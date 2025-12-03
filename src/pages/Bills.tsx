import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Plus, FileSpreadsheet, Trash2 } from "lucide-react";
import { billManager } from "@/lib/billManager";
import { productManager } from "@/lib/productManager";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Bill } from "@/data/testData";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "@/hooks/useAuth";

const Bills = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    billManager.initialize();
    loadBills();
  }, []);

  const loadBills = async () => {
    if (startDate && endDate) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:55219';
        const response = await fetch(`${API_BASE_URL}/api/Bills?startDate=${startDate}&endDate=${endDate}`);
        if (response.ok) {
          const data = await response.json();
          setBills(data);
        }
      } catch (error) {
        console.error("Error fetching filtered bills", error);
        toast.error("Failed to fetch filtered bills");
      }
    } else {
      const data = await billManager.getAll();
      setBills(data);
    }
  };

  const handleExportCSV = () => {
    const csvHeader = "Bill Number,Customer Name,Customer Email,Date,Subtotal,Discount,Tax,Total,Status\n";
    const csvRows = bills
      .map(
        (bill) =>
          `${bill.billNumber},${bill.customerName},${bill.customerEmail},${bill.date},${bill.subtotal},${bill.discountAmount || 0},${bill.tax},${bill.total},${bill.status}`
      )
      .join("\n");
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bills-${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Bills exported to CSV file");
  };

  const handleExportAllData = async () => {
    const products = await productManager.getAll();
    const productsCsvHeader = "ID,SKU,Name,Category,Price,Stock,Low Stock Threshold\n";
    const productsCsvRows = products
      .map(
        (p) => `${p.id},${p.sku},${p.name},${p.category},${p.sellPrice},${p.stock},${p.lowStockThreshold}`
      )
      .join("\n");
    const productsCsv = productsCsvHeader + productsCsvRows;
    const productsBlob = new Blob([productsCsv], { type: "text/csv;charset=utf-8;" });
    const productsUrl = URL.createObjectURL(productsBlob);
    const productsLink = document.createElement("a");
    productsLink.href = productsUrl;
    productsLink.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    productsLink.style.visibility = "hidden";
    document.body.appendChild(productsLink);
    productsLink.click();
    document.body.removeChild(productsLink);

    const billsCsvHeader = "Bill Number,Customer Name,Customer Email,Date,Subtotal,Discount,Tax,Total,Status\n";
    const billsCsvRows = bills
      .map(
        (bill) =>
          `${bill.billNumber},${bill.customerName},${bill.customerEmail},${bill.date},${bill.subtotal},${bill.discountAmount || 0},${bill.tax},${bill.total},${bill.status}`
      )
      .join("\n");
    const billsCsv = billsCsvHeader + billsCsvRows;
    const billsBlob = new Blob([billsCsv], { type: "text/csv;charset=utf-8;" });
    const billsUrl = URL.createObjectURL(billsBlob);
    const billsLink = document.createElement("a");
    billsLink.href = billsUrl;
    billsLink.download = `bills-${new Date().toISOString().split('T')[0]}.csv`;
    billsLink.style.visibility = "hidden";
    document.body.appendChild(billsLink);
    billsLink.click();
    document.body.removeChild(billsLink);

    toast.success("All data exported (Inventory + Bills)");
  };

  const handleDownloadPDF = (bill: Bill) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text("INVOICE", 105, 20, { align: "center" });
    
    // Bill Details
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Bill No: ${bill.billNumber}`, 14, 40);
    doc.text(`Date: ${new Date(bill.date).toLocaleDateString()}`, 14, 46);
    doc.text(`Status: ${bill.status.toUpperCase()}`, 14, 52);
    
    // Customer Details
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Bill To:", 14, 65);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(bill.customerName, 14, 72);
    doc.text(bill.customerEmail, 14, 78);

    // Table
    const tableData = bill.items.map((item) => [
      item.productName,
      item.quantity.toString(),
      `Rs. ${(item.price || 0).toFixed(2)}`,
      `Rs. ${(item.total || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 90,
      head: [["Product", "Quantity", "Price", "Total"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [66, 66, 66], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
    });

    const lastAutoTable = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
    const finalY = lastAutoTable && typeof lastAutoTable.finalY === "number" ? lastAutoTable.finalY : 90;

    // Totals
    const rightMargin = 196;
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    doc.text(`Subtotal:`, 140, finalY + 10);
    doc.text(`Rs. ${(bill.subtotal || 0).toFixed(2)}`, rightMargin, finalY + 10, { align: 'right' });

    if (bill.discountAmount && bill.discountAmount > 0) {
      doc.text(`Discount:`, 140, finalY + 16);
      doc.text(`- Rs. ${(bill.discountAmount || 0).toFixed(2)}`, rightMargin, finalY + 16, { align: 'right' });
      
      doc.text(`Tax (0%):`, 140, finalY + 22);
      doc.text(`Rs. ${(bill.tax || 0).toFixed(2)}`, rightMargin, finalY + 22, { align: 'right' });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total:`, 140, finalY + 32);
      doc.text(`Rs. ${(bill.total || 0).toFixed(2)}`, rightMargin, finalY + 32, { align: 'right' });
    } else {
      doc.text(`Tax (0%):`, 140, finalY + 16);
      doc.text(`Rs. ${(bill.tax || 0).toFixed(2)}`, rightMargin, finalY + 16, { align: 'right' });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total:`, 140, finalY + 26);
      doc.text(`Rs. ${(bill.total || 0).toFixed(2)}`, rightMargin, finalY + 26, { align: 'right' });
    }

    doc.save(`invoice-${bill.billNumber}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const handleDeleteClick = (bill: Bill) => {
    if (!user || user.role !== 'admin') {
      toast.error("Only admins can delete bills");
      return;
    }
    setBillToDelete(bill);
  };

  const confirmDeleteBill = async () => {
    if (!billToDelete) return;

    setIsDeleting(true);
    try {
      // Restore stock for each item in the bill
      const products = await productManager.getAll();
      for (const item of billToDelete.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await productManager.update(item.productId, {
            stock: product.stock + item.quantity
          });
        }
      }

      // Delete the bill
      const success = await billManager.delete(billToDelete.id);
      if (success) {
        toast.success(`Bill ${billToDelete.billNumber} deleted and stock restored successfully`);
        loadBills();
      } else {
        toast.error("Failed to delete bill");
      }
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast.error("Failed to delete bill and restore stock");
    } finally {
      setIsDeleting(false);
      setBillToDelete(null);
    }
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bills & Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all your bills
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportAllData}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export All Data
          </Button>
          <Link to="/create-bill">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Bill
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full md:w-auto"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full md:w-auto"
              />
              <Button variant="secondary" onClick={loadBills}>
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Bill #</th>
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Created By</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-right py-3 px-4 font-semibold">Discount</th>
                  <th className="text-right py-3 px-4 font-semibold">Amount</th>
                  <th className="text-center py-3 px-4 font-semibold">Status</th>
                  <th className="text-center py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4"><span className="font-mono font-semibold">{bill.billNumber}</span></td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{bill.customerName}</p>
                        <p className="text-sm text-muted-foreground">{bill.customerEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {bill.createdBy || "Unknown"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(bill.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {bill.discountAmount && bill.discountAmount > 0 ? (
                        <span className="text-green-600 font-medium">-₹{bill.discountAmount.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">₹{bill.total.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
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
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(bill)} title="Download PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        {user?.role === 'admin' && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(bill)} title="Delete Bill" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBills.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No bills found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!billToDelete} onOpenChange={(open) => !open && !isDeleting && setBillToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete bill {billToDelete?.billNumber}? This action cannot be undone and will restore the stock for all items in this bill.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteBill} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bills;
