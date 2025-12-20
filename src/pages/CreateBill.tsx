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
import { customerManager, Customer } from "@/lib/customerManager";

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
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerBalance, setCustomerBalance] = useState<number | null>(null);
  const [items, setItems] = useState<BillItem[]>([{ productId: "", quantity: 1, price: 0 }]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      billManager.initialize();
      productManager.initialize();
      const allProducts = await productManager.getAll();
      setProducts(allProducts);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const searchCustomer = async () => {
      if (customerMobile.length >= 10) {
        const customer = await customerManager.getByMobile(customerMobile);
        if (customer) {
          setExistingCustomer(customer);
          setCustomerName(customer.name);
          setCustomerEmail(customer.email);
          setCustomerBalance(customer.balance);
          toast.info(`Found customer: ${customer.name}. Pending balance: ₹${customer.balance.toFixed(2)}`);
        } else {
          setExistingCustomer(null);
          setCustomerBalance(null);
        }
      } else {
        setExistingCustomer(null);
        setCustomerBalance(null);
      }
    };
    searchCustomer();
  }, [customerMobile]);

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BillItem, value: string | number) => {
    const newItems = [...items];

    if (field === "quantity") {
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
    return subtotal - discountAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const validItems = items.filter(item => item.productId && (typeof item.quantity === 'number' ? item.quantity > 0 : parseFloat(item.quantity) > 0));
      if (validItems.length === 0) {
        toast.error("Please add at least one valid item");
        setIsSubmitting(false);
        return;
      }

      const total = calculateTotal();
      const actualAmountPaid = paymentStatus === 'paid' ? total : (parseFloat(amountPaid) || 0);

      const newBill = {
        id: Date.now().toString(),
        billNumber: await billManager.generateBillNumber(),
        customerName: customerName || "Walk-in Customer",
        customerEmail: customerEmail || "N/A",
        customerMobile: customerMobile,
        date: new Date().toLocaleDateString('en-CA'),
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
        subtotal: calculateSubtotal(),
        discountAmount,
        taxAmount: 0,
        tax: 0,
        total,
        amountPaid: actualAmountPaid,
        status: (actualAmountPaid >= total ? 'paid' : 'overdue') as 'paid' | 'overdue',
        createdBy: user?.name || "Unknown User"
      };

      if (customerMobile) {
        const balanceChange = total - actualAmountPaid;
        if (!existingCustomer) {
          await customerManager.add({
            id: Date.now().toString(),
            name: customerName || "Walk-in Customer",
            mobile: customerMobile,
            email: customerEmail || "N/A",
            balance: balanceChange
          });
        } else if (balanceChange !== 0) {
          await customerManager.updateBalance(customerMobile, balanceChange);
        }
      }

      validItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
          productManager.update(item.productId, { stock: product.stock - qty });
        }
      });

      await billManager.add(newBill);
      toast.success(`Bill ${newBill.billNumber} created successfully!`);

      setCustomerName("");
      setCustomerEmail("");
      setCustomerMobile("");
      setCustomerBalance(null);
      setExistingCustomer(null);
      setItems([{ productId: "", quantity: 1, price: 0 }]);
      setDiscountAmount(0);
      setAmountPaid("");
      setPaymentStatus('paid');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error creating bill:", error);
      toast.error("Failed to create bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Bill</h1>
        <p className="text-muted-foreground mt-1">Generate a new invoice for your customer</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerMobile">Mobile Number (Unique ID)</Label>
                  <Input id="customerMobile" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} placeholder="9876543210" />
                </div>
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email (Optional)</Label>
                  <Input id="customerEmail" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="john@example.com" />
                </div>
                {customerBalance !== null && (
                  <div className={`p-3 rounded-md ${customerBalance > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    <p className="text-sm font-medium">
                      Current Balance: ₹{customerBalance.toFixed(2)}
                      {customerBalance > 0 ? ' (Owed to you)' : ' (Advance/Clear)'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Bill Items</CardTitle>
                  <Button type="button" onClick={addItem} size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add New Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-end border-b md:border-0 pb-4 md:pb-0 last:border-0">
                    <div className="flex-1 w-full">
                      <Label>Product</Label>
                      <Select value={item.productId} onValueChange={(value) => updateItem(index, "productId", value)}>
                        <SelectTrigger id={`product-trigger-${index}`}><SelectValue placeholder="Select product" /></SelectTrigger>
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
                      <Input id={`quantity-${index}`} type="text" inputMode="decimal" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} />
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
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
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
              <CardHeader><CardTitle>Bill Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Discount (₹)</span>
                    <Input type="number" className="w-24 h-8 text-right" min="0" value={discountAmount} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Payment Status</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant={paymentStatus === 'paid' ? 'default' : 'outline'} size="sm" onClick={() => { setPaymentStatus('paid'); setAmountPaid(""); }}>Full Payment</Button>
                      <Button type="button" variant={paymentStatus === 'unpaid' ? 'default' : 'outline'} size="sm" onClick={() => setPaymentStatus('unpaid')}>Partial/Unpaid</Button>
                    </div>
                  </div>
                  {paymentStatus === 'unpaid' && (
                    <div className="space-y-2">
                      <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
                      <Input id="amountPaid" type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0.00" />
                      <p className="text-xs text-muted-foreground">Remaining ₹{(calculateTotal() - (parseFloat(amountPaid) || 0)).toFixed(2)} will be added to balance.</p>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" /> {isSubmitting ? "Creating Bill..." : "Create Bill"}
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
