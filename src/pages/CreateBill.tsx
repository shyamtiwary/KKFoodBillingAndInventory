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
  const [items, setItems] = useState<BillItem[]>([{ productId: "", quantity: 1, price: 0 }]);
  const [products, setProducts] = useState<Product[]>([]);

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
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].price = product.sellPrice;
      }
    }

    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.0; // 10% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail) {
      setCustomerName("Walk-in Customer");
      setCustomerEmail("N/A");
    }

    if (items.some(item => !item.productId || item.quantity <= 0)) {
      toast.error("Please complete all bill items");
      return;
    }

    // Check stock availability with aggregated quantities
    const productQuantities = new Map<string, number>();
    for (const item of items) {
      const currentQty = productQuantities.get(item.productId) || 0;
      productQuantities.set(item.productId, currentQty + item.quantity);
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

    const newBill = {
      id: Date.now().toString(),
      billNumber: await billManager.generateBillNumber(),
      customerName: customerName == "" ? "Walk-in Customer" : customerName,
      customerEmail: customerEmail == "" ? "N/A" : customerEmail,
      date: new Date().toISOString().split('T')[0],
      items: items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          productName: product?.name || "",
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        };
      }),
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
      status: 'paid' as const,
    };

    // Update stock for each product
    items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        productManager.update(item.productId, {
          stock: product.stock - item.quantity
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
                              {product.name} in stock {product.stock} - ₹{product.sellPrice.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0.00)}
                      />
                    </div>
                    <div className="w-32">
                      <Label>Price</Label>
                      <Input value={`₹${item.price.toFixed(2)}`} disabled />
                    </div>
                    <div className="w-32">
                      <Label>Total</Label>
                      <Input value={`₹${(item.price * item.quantity).toFixed(2)}`} disabled />
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
