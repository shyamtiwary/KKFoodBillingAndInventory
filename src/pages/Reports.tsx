import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { billManager } from "@/lib/billManager";
import { downloadFile } from "@/lib/utils/fileDownloader";
import { formatAmount, formatQuantity } from "@/lib/utils";

interface ProductSales {
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    invoiceCount: number;
}

const Reports = () => {
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toLocaleDateString('en-CA'); // Local YYYY-MM-DD
    });
    const [endDate, setEndDate] = useState(() => new Date().toLocaleDateString('en-CA')); // Local YYYY-MM-DD
    const [salesData, setSalesData] = useState<ProductSales[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Offline/Native Mode
            if (Capacitor.isNativePlatform()) {
                const allBills = await billManager.getAll();
                const start = startDate ? new Date(startDate) : new Date(0);
                // Set start to beginning of day
                start.setHours(0, 0, 0, 0);

                const end = endDate ? new Date(endDate) : new Date();
                // Set end to end of day
                end.setHours(23, 59, 59, 999);

                const filteredBills = allBills.filter(bill => {
                    const billDate = new Date(bill.date);
                    return billDate >= start && billDate <= end;
                });

                // Aggregate sales by product
                const productStats: Record<string, { name: string, qty: number, rev: number, bills: Set<string> }> = {};

                filteredBills.forEach(bill => {
                    bill.items.forEach(item => {
                        if (!productStats[item.productId]) {
                            productStats[item.productId] = {
                                name: item.productName,
                                qty: 0,
                                rev: 0,
                                bills: new Set()
                            };
                        }
                        productStats[item.productId].qty += item.quantity;
                        productStats[item.productId].rev += item.total;
                        productStats[item.productId].bills.add(bill.id);
                    });
                });

                const reportData: ProductSales[] = Object.keys(productStats).map(pid => ({
                    productId: pid,
                    productName: productStats[pid].name,
                    totalQuantity: productStats[pid].qty,
                    totalRevenue: productStats[pid].rev,
                    invoiceCount: productStats[pid].bills.size
                }));

                setSalesData(reportData);
                if (reportData.length === 0) {
                    toast.info("No sales found for the selected period");
                }
                return;
            }

            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append("startDate", startDate);
            if (endDate) queryParams.append("endDate", endDate);

            // Use environment variable for API URL
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:55219';
            const response = await fetch(`${API_BASE_URL}/api/Reports/sales?${queryParams.toString()}`);

            if (response.ok) {
                const data = await response.json();
                setSalesData(data);
                if (data.length === 0) {
                    toast.info("No sales found for the selected period");
                }
            } else {
                toast.error("Failed to fetch sales report");
            }
        } catch (error) {
            console.error("Error fetching report:", error);
            // Fallback to local if API fails on web too
            if (!Capacitor.isNativePlatform()) {
                toast.error("Error connecting to server");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (salesData.length === 0) {
            toast.error("No data to export");
            return;
        }

        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text("Sales Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Period: ${startDate || 'All time'} to ${endDate || 'All time'}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

        // Table
        const tableColumn = ["Product Name", "Quantity Sold", "Revenue", "Invoice Count"];
        const tableRows = salesData.map(item => [
            item.productName,
            formatQuantity(item.totalQuantity),
            formatAmount(item.totalRevenue),
            item.invoiceCount.toString()
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 44,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [66, 66, 66] },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right' }
            }
        });

        const pdfBase64 = doc.output('datauristring').split(',')[1];
        const fileName = `sales_report_${new Date().toISOString().split('T')[0]}.pdf`;

        await downloadFile(fileName, pdfBase64, "application/pdf", true);
    };

    const handleExportCSV = async () => {
        if (salesData.length === 0) {
            toast.error("No data to export");
            return;
        }

        // Simple CSV export
        const headers = ["Product Name", "Quantity Sold", "Revenue", "Invoice Count"];
        const csvContent = [
            headers.join(","),
            ...salesData.map(item =>
                `"${item.productName}",${item.totalQuantity},${item.totalRevenue},${item.invoiceCount}`
            )
        ].join("\n");

        const fileName = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
        await downloadFile(fileName, csvContent, "text/csv");
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Sales Report</h1>
                <p className="text-muted-foreground mt-1">
                    View product-wise sales performance
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filter & Export</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Start Date</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">End Date</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 pt-2">
                            <Button onClick={fetchReport} disabled={loading} className="w-full md:w-auto md:flex-1">
                                {loading ? "Loading..." : "Generate Report"}
                            </Button>
                            <Button variant="outline" onClick={handleExportPDF} disabled={salesData.length === 0} className="w-full md:w-auto md:flex-1">
                                <FileText className="h-4 w-4 mr-2" />
                                Export PDF
                            </Button>
                            <Button variant="outline" onClick={handleExportCSV} disabled={salesData.length === 0} className="w-full md:w-auto md:flex-1">
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Report Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table className="min-w-[600px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead className="text-right">Quantity Sold</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Invoice Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {salesData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No data available. Select a date range and click Generate.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    salesData.map((item) => (
                                        <TableRow key={item.productId}>
                                            <TableCell className="font-medium">{item.productName}</TableCell>
                                            <TableCell className="text-right">{formatQuantity(item.totalQuantity)}</TableCell>
                                            <TableCell className="text-right">₹{formatAmount(item.totalRevenue)}</TableCell>
                                            <TableCell className="text-right">{item.invoiceCount}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Reports;
