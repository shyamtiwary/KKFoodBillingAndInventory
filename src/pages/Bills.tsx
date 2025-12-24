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
import { Search, Download, Plus, FileSpreadsheet, Trash2, FileText } from "lucide-react";
import { billManager } from "@/lib/billManager";
import { productManager } from "@/lib/productManager";
import { customerManager } from "@/lib/customerManager";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Bill } from "@/data/testData";
import { toast } from "sonner";
import { formatAmount } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "@/hooks/useAuth";
import { Capacitor } from "@capacitor/core";
import { downloadFile } from "@/lib/utils/fileDownloader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TimeFilter = "Today" | "This Week" | "Last Week" | "This Month" | "This Year" | "Last Year" | "All Time" | "Custom";

const Bills = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("This Month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [billToUpdateStatus, setBillToUpdateStatus] = useState<Bill | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    billManager.initialize();
    updateDateRange(timeFilter);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadBills();
    }
  }, [startDate, endDate]);

  const updateDateRange = (filter: TimeFilter) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (filter) {
      case "Today":
        start = now;
        end = now;
        break;
      case "This Week":
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start = new Date(now.setDate(diff));
        end = new Date();
        break;
      case "Last Week":
        const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        const lastWeekDay = lastWeek.getDay();
        const lastWeekDiff = lastWeek.getDate() - lastWeekDay + (lastWeekDay === 0 ? -6 : 1);
        start = new Date(lastWeek.setDate(lastWeekDiff));
        end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
        break;
      case "This Month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "This Year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case "Last Year":
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case "All Time":
        start = new Date(2000, 0, 1); // Arbitrary past date
        end = now;
        break;
      case "Custom":
        // Don't change dates, let user pick
        return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleFilterChange = (value: TimeFilter) => {
    setTimeFilter(value);
    updateDateRange(value);
  };

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
          // Map backend DateTime to frontend datetime
          const mappedData = data.map((bill: any) => ({
            ...bill,
            datetime: bill.dateTime || bill.datetime
          }));
          setBills(mappedData);
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
    const billsCsvRows = filteredBills
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

  const handleExportPDF = async () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Bills Report", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Filter: ${timeFilter} (${startDate} to ${endDate})`, 14, 34);

    // Table
    const tableData = filteredBills.map((bill) => [
      bill.billNumber,
      bill.customerName,
      new Date(bill.date).toLocaleDateString(),
      `Rs. ${bill.total.toFixed(2)}`,
      bill.status.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["Bill #", "Customer", "Date", "Total", "Status"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [66, 66, 66], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2 },
    });

    const lastAutoTable = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
    const finalY = lastAutoTable && typeof lastAutoTable.finalY === "number" ? lastAutoTable.finalY : 40;

    // Summary
    const totalAmount = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
    const totalPaid = filteredBills.reduce((sum, bill) => {
      const advance = bill.amountPaid !== undefined ? bill.amountPaid : (bill.status === 'paid' ? bill.total : 0);
      return sum + advance;
    }, 0);
    const totalPending = totalAmount - totalPaid;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Summary", 14, finalY + 10);

    doc.setFontSize(10);
    doc.text(`Total Bills: ${filteredBills.length}`, 14, finalY + 16);
    doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 14, finalY + 22);
    doc.text(`Total Paid/Advance: Rs. ${totalPaid.toFixed(2)}`, 14, finalY + 28);
    doc.text(`Total Pending: Rs. ${totalPending.toFixed(2)}`, 14, finalY + 34);

    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const fileName = `bills-report-${new Date().toISOString().split('T')[0]}.pdf`;

    await downloadFile(fileName, pdfBase64, "application/pdf", true);
    toast.success("Bills report PDF exported");
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

  const handleStatusChangeClick = (bill: Bill, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bill.status === 'paid') return;
    setBillToUpdateStatus(bill);
  };

  const confirmStatusChange = async () => {
    if (!billToUpdateStatus) return;

    setIsUpdatingStatus(true);
    try {
      const updatedBill = {
        ...billToUpdateStatus,
        status: 'paid' as const,
        amountPaid: billToUpdateStatus.total // Assume full payment when marking as paid
      };

      await billManager.update(billToUpdateStatus.id, updatedBill);
      toast.success(`Bill ${billToUpdateStatus.billNumber} marked as paid`);

      // Update local state
      setBills(bills.map(b => b.id === billToUpdateStatus.id ? updatedBill : b));
      if (selectedBill && selectedBill.id === billToUpdateStatus.id) {
        setSelectedBill(updatedBill);
      }

      // Update customer balance if applicable
      if (billToUpdateStatus.customerMobile) {
        const pendingAmount = billToUpdateStatus.total - (billToUpdateStatus.amountPaid || 0);
        if (pendingAmount > 0) {
          await customerManager.updateBalance(billToUpdateStatus.customerMobile, -pendingAmount);
        }
      }

    } catch (error) {
      console.error("Error updating bill:", error);
      toast.error("Failed to update bill status");
    } finally {
      setIsUpdatingStatus(false);
      setBillToUpdateStatus(null);
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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportAllData}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
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
            <div className="flex flex-col md:flex-row gap-2 items-center">
              <Select value={timeFilter} onValueChange={(val) => handleFilterChange(val as TimeFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="This Week">This Week</SelectItem>
                  <SelectItem value="Last Week">Last Week</SelectItem>
                  <SelectItem value="This Month">This Month</SelectItem>
                  <SelectItem value="This Year">This Year</SelectItem>
                  <SelectItem value="Last Year">Last Year</SelectItem>
                  <SelectItem value="All Time">All Time</SelectItem>
                  <SelectItem value="Custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {timeFilter === 'Custom' && (
                <>
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
                </>
              )}
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
                  <th className="text-left py-3 px-4 font-semibold">Date & Time</th>
                  <th className="text-right py-3 px-4 font-semibold">Discount</th>
                  <th className="text-right py-3 px-4 font-semibold">Total</th>
                  <th className="text-right py-3 px-4 font-semibold">Advance</th>
                  <th className="text-right py-3 px-4 font-semibold">Pending</th>
                  <th className="text-center py-3 px-4 font-semibold">Status</th>
                  <th className="text-center py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => {
                  const advance = bill.amountPaid !== undefined ? bill.amountPaid : (bill.status === 'paid' ? bill.total : 0);
                  const pending = bill.total - advance;

                  return (
                    <tr
                      key={bill.id}
                      className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedBill(bill)}
                    >
                      <td className="py-3 px-4"><span className="font-mono font-semibold">{bill.billNumber}</span></td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{bill.customerName}</p>
                          <p className="text-sm text-muted-foreground">{bill.customerMobile}</p>
                          <p className="text-sm text-muted-foreground">{bill.customerEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {bill.datetime ? (
                          <>
                            <div>{new Date(bill.datetime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                            <div className="text-xs text-muted-foreground">{new Date(bill.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        ) : (
                          new Date(bill.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">₹{bill.discountAmount ? bill.discountAmount.toFixed(2) : '0.00'}</td>
                      <td className="py-3 px-4 text-right font-semibold">₹{bill.total.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-green-600">₹{advance.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-red-600">₹{formatAmount(pending)}</td>
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
                          onClick={(e) => handleStatusChangeClick(bill, e)}
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
                  );
                })}
                {filteredBills.length > 0 && (
                  <tr className="bg-muted/50 font-bold border-t-2">
                    <td colSpan={3} className="py-3 px-4 text-right">Total:</td>
                    <td className="py-3 px-4 text-right text-green-600">₹{filteredBills.reduce((sum, b) => sum + (b.discountAmount || 0), 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">₹{filteredBills.reduce((sum, b) => sum + b.total, 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-green-600">₹{filteredBills.reduce((sum, b) => {
                      const adv = b.amountPaid !== undefined ? b.amountPaid : (b.status === 'paid' ? b.total : 0);
                      return sum + adv;
                    }, 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-red-600">₹{filteredBills.reduce((sum, b) => {
                      const adv = b.amountPaid !== undefined ? b.amountPaid : (b.status === 'paid' ? b.total : 0);
                      return sum + (b.total - adv);
                    }, 0).toFixed(2)}</td>
                    <td colSpan={2}></td>
                  </tr>
                )}
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

      <Dialog open={!!billToUpdateStatus} onOpenChange={(open) => !open && !isUpdatingStatus && setBillToUpdateStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark bill {billToUpdateStatus?.billNumber} as PAID?
              This will record a payment of ₹{(billToUpdateStatus?.total || 0) - (billToUpdateStatus?.amountPaid || 0)} and update the customer's balance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillToUpdateStatus(null)} disabled={isUpdatingStatus}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Updating..." : "Confirm Paid"}
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

                {/* Payment Breakdown */}
                <div className="pt-2 mt-2 border-t border-dashed">
                  <div className="flex justify-between text-green-600">
                    <span>Advance / Paid:</span>
                    <span>₹{(selectedBill.amountPaid !== undefined ? selectedBill.amountPaid : (selectedBill.status === 'paid' ? selectedBill.total : 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Pending:</span>
                    <span>₹{(selectedBill.total - (selectedBill.amountPaid !== undefined ? selectedBill.amountPaid : (selectedBill.status === 'paid' ? selectedBill.total : 0))).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                {selectedBill.status !== 'paid' && (
                  <Button
                    variant="default"
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    onClick={(e) => handleStatusChangeClick(selectedBill, e)}
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
