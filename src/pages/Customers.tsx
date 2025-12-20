import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { customerManager, Customer } from "@/lib/customerManager";
import { Search, UserPlus, History, IndianRupee, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Customers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState("");
    const [adjustmentType, setAdjustmentType] = useState<"payment" | "charge">("payment");

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const data = await customerManager.getAll();
            setCustomers(data);
        } catch (error) {
            toast.error("Failed to load customers");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.mobile.includes(searchTerm)
    );

    const totalPending = customers
        .filter(c => c.balance > 0)
        .reduce((sum, c) => sum + c.balance, 0);

    const totalAdvance = customers
        .filter(c => c.balance < 0)
        .reduce((sum, c) => sum + Math.abs(c.balance), 0);

    const handleAdjustment = async () => {
        if (!selectedCustomer || !adjustmentAmount) return;

        const amount = parseFloat(adjustmentAmount);
        if (isNaN(amount)) {
            toast.error("Invalid amount");
            return;
        }

        const finalAmount = adjustmentType === "payment" ? -amount : amount;

        try {
            await customerManager.updateBalance(selectedCustomer.mobile, finalAmount);
            toast.success("Balance updated successfully");
            setAdjustmentAmount("");
            setSelectedCustomer(null);
            fetchCustomers();
        } catch (error) {
            toast.error("Failed to update balance");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Customers</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage customer profiles and credit/debit balances
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                    title="Total Pending (Receivable)"
                    value={`₹${totalPending.toFixed(2)}`}
                    icon={ArrowUpRight}
                    description="Money owed by customers"
                    variant="warning"
                />
                <StatCard
                    title="Total Advance (Payable)"
                    value={`₹${totalAdvance.toFixed(2)}`}
                    icon={ArrowDownRight}
                    description="Money paid in advance"
                    variant="success"
                />
                <StatCard
                    title="Net Balance"
                    value={`₹${(totalPending - totalAdvance).toFixed(2)}`}
                    icon={Wallet}
                    description="Overall customer credit/debit"
                    variant="default"
                />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or mobile..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Mobile</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            Loading customers...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCustomers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            No customers found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium">{customer.name}</TableCell>
                                            <TableCell>{customer.mobile}</TableCell>
                                            <TableCell>{customer.email}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-bold ${customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                        ₹{Math.abs(customer.balance).toFixed(2)}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold">
                                                        {customer.balance > 0 ? 'Pending' : customer.balance < 0 ? 'Advance' : 'Clear'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)}>
                                                            <IndianRupee className="h-4 w-4 mr-1" />
                                                            Adjust Balance
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Adjust Balance for {customer.name}</DialogTitle>
                                                            <DialogDescription>
                                                                Current Balance: ₹{customer.balance.toFixed(2)}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="grid gap-2">
                                                                <Label>Adjustment Type</Label>
                                                                <div className="flex gap-4">
                                                                    <Button
                                                                        type="button"
                                                                        variant={adjustmentType === "payment" ? "default" : "outline"}
                                                                        onClick={() => setAdjustmentType("payment")}
                                                                        className="flex-1"
                                                                    >
                                                                        Payment Received
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant={adjustmentType === "charge" ? "default" : "outline"}
                                                                        onClick={() => setAdjustmentType("charge")}
                                                                        className="flex-1"
                                                                    >
                                                                        Add Charge
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="amount">Amount (₹)</Label>
                                                                <Input
                                                                    id="amount"
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    value={adjustmentAmount}
                                                                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button onClick={handleAdjustment}>Save Changes</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
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

export default Customers;
