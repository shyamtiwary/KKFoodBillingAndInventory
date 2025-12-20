import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataManager } from "@/lib/dataManager";
import { Download, Upload, User, Check, X, Trash } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { SERVICE_URLS } from "@/config/apiConfig";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Settings = () => {
    const { user: currentUser } = useAuth();
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            loadUsers();
        }
    }, [currentUser]);

    const loadUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const response = await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Users')}`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleApprove = async (email: string) => {
        try {
            const response = await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Users')}/approve/${email}`, {
                method: 'POST'
            });
            if (response.ok) {
                toast.success("User approved");
                loadUsers();
            }
        } catch (error) {
            toast.error("Failed to approve user");
        }
    };

    const handleDisapprove = async (email: string) => {
        try {
            const response = await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Users')}/disapprove/${email}`, {
                method: 'POST'
            });
            if (response.ok) {
                toast.success("User disapproved");
                loadUsers();
            } else {
                const err = await response.text();
                toast.error(err || "Failed to disapprove user");
            }
        } catch (error) {
            toast.error("Failed to disapprove user");
        }
    };

    const handleDeleteUser = async (email: string) => {
        if (!confirm(`Are you sure you want to delete user ${email}?`)) return;
        try {
            const response = await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Users')}/${email}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                toast.success("User deleted");
                loadUsers();
            } else {
                const err = await response.text();
                toast.error(err || "Failed to delete user");
            }
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const handleBackup = async () => {
        try {
            toast.info("Preparing backup...");
            await dataManager.backupData();
            toast.success("Backup downloaded successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to download backup");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setRestoreFile(e.target.files[0]);
        }
    };

    const handleRestoreClick = () => {
        if (!restoreFile) {
            toast.error("Please select a backup file first");
            return;
        }
        setShowConfirmDialog(true);
    };

    const confirmRestore = async () => {
        if (!restoreFile) return;

        setIsRestoring(true);
        try {
            const result = await dataManager.restoreData(restoreFile);
            toast.success(`Restore successful! Merged ${result.productsCount} products, ${result.billsCount} bills, ${result.customersCount} customers, and ${result.usersCount} users.`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to restore data. Please check the file format.");
        } finally {
            setIsRestoring(false);
            setShowConfirmDialog(false);
            setRestoreFile(null);
            const fileInput = document.getElementById('restore-file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage application settings and data
                </p>
            </div>

            {currentUser?.role === 'admin' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            User Management
                        </CardTitle>
                        <CardDescription>
                            Approve or manage user accounts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">Name</th>
                                        <th className="text-left py-2">Email</th>
                                        <th className="text-left py-2">Role</th>
                                        <th className="text-center py-2">Status</th>
                                        <th className="text-right py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.email} className="border-b last:border-0">
                                            <td className="py-3">{u.name}</td>
                                            <td className="py-3">{u.email}</td>
                                            <td className="py-3 capitalize">{u.role}</td>
                                            <td className="py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {u.isApproved ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {u.isApproved ? (
                                                        <Button size="sm" variant="outline" onClick={() => handleDisapprove(u.email)} title="Disapprove" disabled={u.email === 'admin'}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(u.email)} title="Approve">
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteUser(u.email)} title="Delete" disabled={u.email === 'admin'}>
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && !isLoadingUsers && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4 text-muted-foreground">No users found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Backup Data
                        </CardTitle>
                        <CardDescription>
                            Download a copy of all your products and bills to your device.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleBackup} className="w-full sm:w-auto">
                            Download Backup
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Restore Data
                        </CardTitle>
                        <CardDescription>
                            Restore data from a previously downloaded backup file.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="restore-file">Backup File</Label>
                            <Input id="restore-file" type="file" accept=".json" onChange={handleFileChange} />
                        </div>
                        <Button
                            onClick={handleRestoreClick}
                            disabled={!restoreFile || isRestoring}
                            variant="secondary"
                            className="w-full sm:w-auto"
                        >
                            {isRestoring ? "Restoring..." : "Restore Data"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will merge the data from the backup file with your current data.
                            Existing items with the same ID will be updated. New items will be added.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRestore}>Continue Restore</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Settings;
