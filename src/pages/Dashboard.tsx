import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, AlertTriangle, FileText, TrendingUp, IndianRupee } from "lucide-react";
import { billManager } from "@/lib/billManager";
import { productManager } from "@/lib/productManager";
import { useState, useEffect } from "react";
import type { Bill, Product } from "@/data/testData";

const Dashboard = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    billManager.initialize();
    productManager.initialize();

    const fetchData = async () => {
      const billsData = await billManager.getAll();
      console.log('Dashboard fetched bills:', billsData);
      setBills(billsData);
      const productsData = await productManager.getAll();
      setProducts(productsData);
    };
    fetchData();
  }, []);

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  // Calculate daily sales (today)
  const todayBills = bills.filter(b => b.date === today);
  const dailySales = todayBills.reduce((sum, bill) => sum + bill.total, 0);
  const dailyTransactions = todayBills.length;

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold);
  let costprice = 0;
  let profit = 0;

  bills.forEach(bill => {
    if (bill.status !== "paid") return;

    bill.items.forEach(item => {
      const product = products.find(p => p.name === item.productName);
      if (!product) return;

      const sp = product.sellPrice;
      const cp = product.costPrice;
      const itemProfit = (sp - cp) * item.quantity;

      profit += itemProfit;
      costprice += cp * item.quantity;
    });

    // Subtract discount from profit
    if (bill.discountAmount) {
      profit -= bill.discountAmount;
    }
  });

  const totalRevenue = bills
    .filter(b => b.status === 'paid')
    .reduce((sum, bill) => sum + bill.total, 0);
  const totalBills = bills.length;
  const pendingBills = bills.filter(b => b.status === 'paid' || b.status === 'overdue').length;

  // Calculate total inventory value
  const inventoryValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);

  const recentBills = bills.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your inventory and billing
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Daily Sales"
          value={`₹${dailySales.toFixed(2)}`}
          icon={TrendingUp}
          description={`${dailyTransactions} transactions today`}
          variant="success"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toFixed(2)}`}
          icon={IndianRupee}
          description="From paid invoices"
          variant="success"
        />
        <StatCard
          title="Investment Cost"
          value={`₹${costprice.toFixed(2)}`}
          icon={IndianRupee}
          description="From paid invoices"
          variant="success"
        />
        <StatCard
          title="Profit Revenue"
          value={`₹${profit.toFixed(2)}`}
          icon={IndianRupee}
          description="From paid invoices"
          variant="success"
        />
        <StatCard
          title="Inventory Value"
          value={`₹${inventoryValue.toFixed(2)}`}
          icon={Package}
          description={`${totalProducts} products`}
          variant="default"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          icon={AlertTriangle}
          description="Need restocking"
          variant="warning"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">All products are well stocked!</p>
              ) : (
                lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    </div>
                    <Badge variant="outline" className="text-warning border-warning">
                      {product.stock} left
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 overflow-y-auto max-h-32">
              {recentBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{bill.billNumber}</p>
                    <p className="text-sm text-muted-foreground">{bill.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{bill.total.toFixed(2)}</p>
                    <Badge
                      variant={
                        bill.status === 'paid'
                          ? 'default'
                          : bill.status === 'overdue'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className={bill.status === 'paid' ? 'bg-accent hover:bg-accent' : ''}
                    >
                      {bill.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
