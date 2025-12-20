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
import { Capacitor } from "@capacitor/core";
import { downloadFile } from "@/lib/utils/fileDownloader";

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
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    billManager.initialize();
    loadBills();
  }, []);

  const loadBills = async () => {
    // Native/Offline Mode
    if (Capacitor.isNativePlatform()) {
      const allBills = await billManager.getAll();
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filtered = allBills.filter(bill => {
          const billDate = new Date(bill.date);
          return billDate >= start && billDate <= end;
        });
        setBills(filtered);
      } else {
        setBills(allBills);
      }
      return;
    }

    // Web/Online Mode
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
        // Fallback to local if API fails on web too (optional, but good for safety)
        const data = await billManager.getAll();
        setBills(data);
      }
    } else {
      const data = await billManager.getAll();
      setBills(data);
    }
  };

  const handleExportCSV = async () => {
    const csvHeader = "Bill Number,Customer Name,Customer Email,Date,Subtotal,Discount,Tax,Total,Status\n";
    const csvRows = bills
      .map(
        (bill) =>
          `${bill.billNumber},${bill.customerName},${bill.customerEmail},${bill.date},${bill.subtotal},${bill.discountAmount || 0},${bill.tax},${bill.total},${bill.status}`
      )
      .join("\n");
    const csvContent = csvHeader + csvRows;
    const fileName = `bills-${new Date().toISOString().split('T')[0]}.csv`;

    await downloadFile(fileName, csvContent, "text/csv");
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
    const productsFileName = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    await downloadFile(productsFileName, productsCsv, "text/csv");

    const billsCsvHeader = "Bill Number,Customer Name,Customer Email,Date,Subtotal,Discount,Tax,Total,Status\n";
    const billsCsvRows = bills
      .map(
        (bill) =>
          `${bill.billNumber},${bill.customerName},${bill.customerEmail},${bill.date},${bill.subtotal},${bill.discountAmount || 0},${bill.tax},${bill.total},${bill.status}`
      )
      .join("\n");
    const billsCsv = billsCsvHeader + billsCsvRows;
    const billsFileName = `bills-${new Date().toISOString().split('T')[0]}.csv`;
    await downloadFile(billsFileName, billsCsv, "text/csv");

    toast.success("All data exported (Inventory + Bills)");
  };

  const handleDownloadPDF = async (bill: Bill, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent row click
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

    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const fileName = `invoice-${bill.billNumber}.pdf`;

    await downloadFile(fileName, pdfBase64, "application/pdf", true);
  };

  const handleDeleteClick = (bill: Bill, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
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

  const handleStatusChange = async (bill: Bill, newStatus: 'paid' | 'overdue') => {
    try {
      const updatedBill = { ...bill, status: newStatus };
      await billManager.update(bill.id, updatedBill);
      toast.success(`Bill ${bill.billNumber} marked as ${newStatus}`);

      // Update local state
      setBills(bills.map(b => b.id === bill.id ? updatedBill : b));
      if (selectedBill && selectedBill.id === bill.id) {
        setSelectedBill(updatedBill);
      }
    } catch (error) {
      console.error("Error updating bill:", error);
      toast.error("Failed to update bill status");
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
                  <tr
                    key={bill.id}
                    className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedBill(bill)}
                  >
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
                        className={`${bill.status !== 'paid' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${bill.status === 'paid' ? 'bg-accent hover:bg-accent' : ''}`}
                        onClick={(e) => {
                          if (bill.status === 'paid') return; // Prevent changing if already paid
                          e.stopPropagation();
                          handleStatusChange(bill, 'paid');
                        }}
                      >
                        {bill.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={(e) => handleDownloadPDF(bill, e)} title="Download PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        {user?.role === 'admin' && (
                          <Button variant="ghost" size="sm" onClick={(e) => handleDeleteClick(bill, e)} title="Delete Bill" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBills.length > 0 && (
              <div className="border-t p-4 bg-muted/20">
                <div className="flex justify-end items-center gap-4 text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>₹{filteredBills.reduce((sum, bill) => sum + bill.total, 0).toFixed(2)}</span>
                </div>
              </div>
            )}
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

      <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details: {selectedBill?.billNumber}</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="font-semibold">Customer:</p>
                  <p>{selectedBill.customerName}</p>
                  <p className="text-muted-foreground">{selectedBill.customerEmail}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Date:</p>
                  <p>{new Date(selectedBill.date).toLocaleDateString()}</p>
                  <Badge className="mt-1">{selectedBill.status}</Badge>
                </div>
              </div>

              <div className="border rounded-md p-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2">Item</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.items.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2">{item.productName}</td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">₹{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{selectedBill.subtotal.toFixed(2)}</span>
                </div>
                {selectedBill.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{selectedBill.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>₹{selectedBill.total.toFixed(2)}</span>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                {selectedBill.status !== 'paid' && (
                  <Button
                    variant="default"
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusChange(selectedBill, 'paid')}
                  >
                    Mark as Paid
                  </Button>
                )}
                <Button className="w-full sm:w-auto" onClick={() => handleDownloadPDF(selectedBill)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bills;
