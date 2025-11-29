import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { toast } from "sonner";

interface ProductSales {
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    invoiceCount: number;
}

const Reports = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [salesData, setSalesData] = useState<ProductSales[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
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
            toast.error("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
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

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Date</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Date</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <Button onClick={fetchReport} disabled={loading}>
                            {loading ? "Loading..." : "Generate Report"}
                        </Button>
                        <Button variant="outline" onClick={handleExport} disabled={salesData.length === 0}>
                            Export CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Product Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead className="text-right">Quantity Sold</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Invoices</TableHead>
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
                                            <TableCell className="text-right">{item.totalQuantity}</TableCell>
                                            <TableCell className="text-right">₹{item.totalRevenue.toFixed(2)}</TableCell>
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
