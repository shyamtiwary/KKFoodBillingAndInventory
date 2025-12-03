import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, AlertTriangle, FileText, TrendingUp, IndianRupee } from "lucide-react";
import { billManager } from "@/lib/billManager";
import { productManager } from "@/lib/productManager";
import { useState, useEffect } from "react";
import type { Bill, Product } from "@/data/testData";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

const Dashboard = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'weekly' | 'monthly' | 'custom' | 'all'>('today');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

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

  // Filter bills based on selected date range
  const filteredBills = bills.filter(bill => {
    if (dateFilter === 'all') {
      return true; // Show all bills
    }

    const billDate = new Date(bill.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      const billDateStr = billDate.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      return billDateStr === todayStr;
    } else if (dateFilter === 'weekly') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return billDate >= weekAgo;
    } else if (dateFilter === 'monthly') {
      const monthAgo = new Date(today);
      monthAgo.setDate(today.getDate() - 30);
      return billDate >= monthAgo;
    } else if (dateFilter === 'custom' && customDateRange?.from) {
      const from = new Date(customDateRange.from);
      const to = new Date(customDateRange.to || customDateRange.from);
      // Set time to start and end of day for accurate comparison
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      return billDate >= from && billDate <= to;
    }
    return true;
  });

  // Calculate metrics based on filtered bills
  const sales = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
  const transactions = filteredBills.length;

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold);
  let costprice = 0;
  let profit = 0;

  filteredBills.forEach(bill => {
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

  const totalRevenue = filteredBills
    .filter(b => b.status === 'paid')
    .reduce((sum, bill) => sum + bill.total, 0);

  // Calculate total inventory value (independent of date filter)
  const inventoryValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);

  const recentBills = bills.slice(0, 5); // Always show most recent bills globally

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your inventory and billing
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={dateFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setDateFilter('all')}
            size="sm"
          >
            All Time
          </Button>
          <Button
            variant={dateFilter === 'today' ? 'default' : 'outline'}
            onClick={() => setDateFilter('today')}
            size="sm"
          >
            Today
          </Button>
          <Button
            variant={dateFilter === 'weekly' ? 'default' : 'outline'}
            onClick={() => setDateFilter('weekly')}
            size="sm"
          >
            Weekly
          </Button>
          <Button
            variant={dateFilter === 'monthly' ? 'default' : 'outline'}
            onClick={() => setDateFilter('monthly')}
            size="sm"
          >
            Monthly
          </Button>
          <Button
            variant={dateFilter === 'custom' ? 'default' : 'outline'}
            onClick={() => setDateFilter('custom')}
            size="sm"
          >
            Custom
          </Button>
        </div>
        {dateFilter === 'custom' && (
          <div className="mt-2 md:mt-0">
            <DatePickerWithRange date={customDateRange} setDate={setCustomDateRange} />
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Sales"
          value={`₹${sales.toFixed(2)}`}
          icon={TrendingUp}
          description={`${transactions} transactions (${dateFilter})`}
          variant="success"
        />
        <StatCard
          title="Revenue"
          value={`₹${totalRevenue.toFixed(2)}`}
          icon={IndianRupee}
          description={`From paid invoices (${dateFilter})`}
          variant="success"
        />
        <StatCard
          title="Investment Cost"
          value={`₹${costprice.toFixed(2)}`}
          icon={IndianRupee}
          description={`From paid invoices (${dateFilter})`}
          variant="success"
        />
        <StatCard
          title="Profit"
          value={`₹${profit.toFixed(2)}`}
          icon={IndianRupee}
          description={`From paid invoices (${dateFilter})`}
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
