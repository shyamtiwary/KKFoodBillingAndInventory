import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import { Product } from "@/data/testData";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { billManager } from "@/lib/billManager";
import { productManager } from "@/lib/productManager";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface BillItem {
  productId: string;
  quantity: number | string;
  price: number;
}

const CreateBill = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [items, setItems] = useState<BillItem[]>([{ productId: "", quantity: 1, price: 0 }]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      billManager.initialize();
      productManager.initialize();
      const allProducts = await productManager.getAll();
      setProducts(allProducts);
    };
    fetchData();
  }, []);

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BillItem, value: string | number) => {
    const newItems = [...items];

    // Handle decimal input for quantity
    if (field === "quantity") {
      // Allow valid number or empty string
      if (value === "" || /^\d*\.?\d*$/.test(value.toString())) {
        newItems[index] = { ...newItems[index], [field]: value };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].price = product.sellPrice;
      }

      // Auto-add new row if product selected in last row
      if (index === items.length - 1) {
        newItems.push({ productId: "", quantity: 1, price: 0 });
      }
    }

    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity;
      return sum + item.price * qty;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = (subtotal - discountAmount) * 0.0; // 0% tax
    return subtotal - discountAmount + tax;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);

    try {
      if (!customerName || !customerEmail) {
        setCustomerName("Walk-in Customer");
        setCustomerEmail("N/A");
      }

      // Filter out empty rows (no product or 0 quantity)
      const validItems = items.filter(item => item.productId && (typeof item.quantity === 'number' ? item.quantity > 0 : parseFloat(item.quantity) > 0));

      if (validItems.length === 0) {
        toast.error("Please add at least one valid item");
        setIsSubmitting(false);
        return;
      }

      // Check stock availability with aggregated quantities
      const productQuantities = new Map<string, number>();
      for (const item of validItems) {
        const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
        const currentQty = productQuantities.get(item.productId) || 0;
        productQuantities.set(item.productId, currentQty + qty);
      }

      for (const [productId, totalQuantity] of productQuantities.entries()) {
        const product = products.find(p => p.id === productId);
        if (!product) {
          toast.error("Product not found");
          setIsSubmitting(false);
          return;
        }
        if (product.stock < totalQuantity) {
          toast.error(`Insufficient stock for ${product.name}. Requested: ${totalQuantity}, Available: ${product.stock}`);
          setIsSubmitting(false);
          return;
        }
      }

      const subtotal = calculateSubtotal();
      const tax = (subtotal - discountAmount) * 0.0;
      const total = calculateTotal();

      const newBill = {
        id: Date.now().toString(),
        billNumber: await billManager.generateBillNumber(),
        customerName: customerName == "" ? "Walk-in Customer" : customerName,
        customerEmail: customerEmail == "" ? "N/A" : customerEmail,
        date: new Date().toISOString().split('T')[0],
        items: validItems.map(item => {
          const product = products.find(p => p.id === item.productId);
          const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
          return {
            productId: item.productId,
            productName: product?.name || "",
            quantity: qty,
            price: item.price,
            total: item.price * qty,
          };
        }),
        subtotal,
        discountAmount,
        taxAmount: tax,
        tax,
        total,
        status: 'paid' as const,
        createdBy: user?.name || "Unknown User"
      };

      // Update stock for each product
      validItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
          productManager.update(item.productId, {
            stock: product.stock - qty
          });
        }
      });

      await billManager.add(newBill);
      toast.success(`Bill ${newBill.billNumber} created successfully! Stock updated.`);

      // Navigate to bills page after short delay
      setTimeout(() => navigate('/bills'), 1000);
    } catch (error) {
      console.error("Error creating bill:", error);
      toast.error("Failed to create bill");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Bill</h1>
        <p className="text-muted-foreground mt-1">
          Generate a new invoice for your customer
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Contact Number</Label>
                  <Input
                    id="customerEmail"
                    type="text"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Contact Number"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Bill Items</CardTitle>
                  <Button type="button" onClick={addItem} size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-end border-b md:border-0 pb-4 md:pb-0 last:border-0">
                    <div className="flex-1 w-full">
                      <Label>Product</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => {
                          updateItem(index, "productId", value);
                          // Auto-focus quantity after product selection
                          setTimeout(() => {
                            const quantityInput = document.getElementById(`quantity-${index}`);
                            if (quantityInput) {
                              quantityInput.focus();
                            }
                          }, 100);
                        }}
                      >
                        <SelectTrigger id={`product-trigger-${index}`}>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} (Stock: {product.stock}) - ₹{product.sellPrice.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full md:w-24">
                      <Label>Quantity</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="text"
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (index < items.length - 1) {
                              // Focus next row's product trigger
                              const nextTrigger = document.getElementById(`product-trigger-${index + 1}`);
                              if (nextTrigger) nextTrigger.focus();
                            } else {
                              // If it's the last row and has valid data, maybe submit or just stay?
                              // For now, let's just blur or focus the save button if needed, 
                              // but usually user might want to review. 
                              // If we want to submit on Enter from last row:
                              // handleSubmit(e); 
                              // But safer to just let them click save or Tab to discount.
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <Label>Price</Label>
                      <Input value={`₹${item.price.toFixed(2)}`} disabled />
                    </div>
                    <div className="w-full md:w-32">
                      <Label>Total</Label>
                      <Input value={`₹${(item.price * (typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity)).toFixed(2)}`} disabled />
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="self-end md:self-auto"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Bill Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Discount (₹)</span>
                    <Input
                      type="number"
                      className="w-24 h-8 text-right"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="text-muted-foreground">Discount Amount</span>
                    <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (0%)</span>
                    <span className="font-medium">₹{((calculateSubtotal() - discountAmount) * 0.0).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Creating Bill..." : "Create Bill"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateBill;
