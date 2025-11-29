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

interface BillItem {
  productId: string;
  quantity: number;
  price: number;
}

const CreateBill = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [items, setItems] = useState<BillItem[]>([{ productId: "", quantity: 0, price: 0 }]); // Start with 0 quantity
  const [products, setProducts] = useState<Product[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);

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
    setItems([...items, { productId: "", quantity: 0, price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BillItem, value: string | number) => {
    const newItems = [...items];

    // Handle decimal input for quantity
    if (field === "quantity") {
      // Allow empty string or valid number
      if (value === "" || value === ".") {
        // @ts-ignore - temporary allow string for input handling
        newItems[index] = { ...newItems[index], [field]: value };
      } else {
        const numValue = parseFloat(value.toString());
        if (!isNaN(numValue) && numValue >= 0) {
          newItems[index] = { ...newItems[index], [field]: numValue };
        }
      }

      // Auto-add new row if last row's quantity is changed and > 0
      if (index === items.length - 1 && parseFloat(value.toString()) > 0) {
        // Debounce check could be added here if needed, but simple check works for now
        // We'll add a new row only if the current last row has a product selected too
        if (newItems[index].productId) {
          setTimeout(() => addItem(), 100); // Small delay to avoid render loop issues
        }
      }

    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].price = product.sellPrice;
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

  const calculateDiscountAmount = () => {
    return (calculateSubtotal() * discountPercentage) / 100;
  };

  const calculateTax = () => {
    return (calculateSubtotal() - calculateDiscountAmount()) * 0.0; // 0% tax for now
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail) {
      setCustomerName("Walk-in Customer");
      setCustomerEmail("N/A");
    }

    // Filter out empty rows (no product or 0 quantity)
    const validItems = items.filter(item => item.productId && (typeof item.quantity === 'number' ? item.quantity > 0 : parseFloat(item.quantity) > 0));

    if (validItems.length === 0) {
      toast.error("Please add at least one valid item");
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
        return;
      }
      if (product.stock < totalQuantity) {
        toast.error(`Insufficient stock for ${product.name}. Requested: ${totalQuantity}, Available: ${product.stock}`);
        return;
      }
    }

    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const tax = calculateTax();
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
      discountPercentage,
      discountAmount,
      taxAmount: tax, // Map to backend TaxAmount
      tax, // Keep for frontend compatibility if needed, or remove if strictly following backend model
      total,
      status: 'paid' as const,
      createdBy: "Admin" // Placeholder for now, will implement auth later
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

    billManager.add(newBill);
    toast.success(`Bill ${newBill.billNumber} created successfully! Stock updated.`);

    // Navigate to bills page after short delay
    setTimeout(() => navigate('/bills'), 1000);
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
                <div className="flex items-center justify-between">
                  <CardTitle>Bill Items</CardTitle>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label>Product</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => updateItem(index, "productId", value)}
                      >
                        <SelectTrigger>
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
                    <div className="w-24">
                      <Label>Quantity</Label>
                      <Input
                        type="text" // Use text to allow "1." intermediate state
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="w-32">
                      <Label>Price</Label>
                      <Input value={`₹${item.price.toFixed(2)}`} disabled />
                    </div>
                    <div className="w-32">
                      <Label>Total</Label>
                      <Input value={`₹${(item.price * (typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity)).toFixed(2)}`} disabled />
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
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
                    <span className="text-muted-foreground">Discount (%)</span>
                    <Input
                      type="number"
                      className="w-20 h-8 text-right"
                      min="0"
                      max="100"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="text-muted-foreground">Discount Amount</span>
                    <span className="font-medium">-₹{calculateDiscountAmount().toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (0%)</span>
                    <span className="font-medium">₹{calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <Save className="h-4 w-4 mr-2" />
                  Create Bill
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
