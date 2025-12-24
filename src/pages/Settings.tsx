import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataManager } from "@/lib/dataManager";
import { userManager } from "@/lib/userManager";
import { Download, Upload, User, Check, X, Trash, Shield, ShieldOff, Smartphone, Monitor, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { SERVICE_URLS } from "@/config/apiConfig";
import { Capacitor } from "@capacitor/core";
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
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            loadUsers();
            if (Capacitor.isNativePlatform()) {
                handleSyncUsers();
            }
        }
    }, [currentUser]);

    const loadUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const data = await userManager.getAll();
            setUsers(data);
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleSyncUsers = async () => {
        setIsSyncing(true);
        try {
            await userManager.syncUsers();
            await loadUsers();
            toast.success("Users synced with server");
        } catch (error) {
            toast.error("Failed to sync users");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleApprove = async (email: string) => {
        try {
            const success = await userManager.approve(email);
            if (success) {
                toast.success("User approved");
                loadUsers();
            } else {
                toast.error("Failed to approve user");
            }
        } catch (error) {
            toast.error("Failed to approve user");
        }
    };

    const handleDisapprove = async (email: string) => {
        try {
            const success = await userManager.disapprove(email);
            if (success) {
                toast.success("User disapproved");
                loadUsers();
            } else {
                toast.error("Failed to disapprove user");
            }
        } catch (error) {
            toast.error("Failed to disapprove user");
        }
    };

    const handleEnable = async (email: string) => {
        try {
            const success = await userManager.enable(email);
            if (success) {
                toast.success("User enabled");
                loadUsers();
            } else {
                toast.error("Failed to enable user");
            }
        } catch (error) {
            toast.error("Failed to enable user");
        }
    };

    const handleDisable = async (email: string) => {
        try {
            const success = await userManager.disable(email);
            if (success) {
                toast.success("User disabled");
                loadUsers();
            } else {
                toast.error("Failed to disable user");
            }
        } catch (error) {
            toast.error("Failed to disable user");
        }
    };

    const handleDeleteUser = async (email: string) => {
        if (!confirm(`Are you sure you want to delete user ${email}?`)) return;
        try {
            const success = await userManager.delete(email);
            if (success) {
                toast.success("User deleted");
                loadUsers();
            } else {
                toast.error("Failed to delete user");
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
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    User Management
                                </CardTitle>
                                <CardDescription>
                                    Approve or manage user accounts.
                                </CardDescription>
                            </div>
                            {Capacitor.isNativePlatform() && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSyncUsers}
                                    disabled={isSyncing}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">Name</th>
                                        <th className="text-left py-2">Email</th>
                                        <th className="text-left py-2">Role</th>
                                        <th className="text-left py-2">Registered At</th>
                                        <th className="text-left py-2">Access</th>
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
                                            <td className="py-3 text-xs text-muted-foreground">
                                                {u.createdAt ? (
                                                    <>
                                                        <div>{new Date(u.createdAt).toLocaleDateString()}</div>
                                                        <div>{new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </>
                                                ) : '-'}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    {u.accessType === 'mobile' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                                                    <span className="text-[10px] capitalize">{u.accessType || 'web'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {u.isApproved ? 'Approved' : 'Pending'}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                        {u.isActive ? 'Active' : 'Disabled'}
                                                    </span>
                                                </div>
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
                                                    {u.isActive ? (
                                                        <Button size="sm" variant="outline" onClick={() => handleDisable(u.email)} title="Disable User" disabled={u.email === 'admin'}>
                                                            <ShieldOff className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleEnable(u.email)} title="Enable User">
                                                            <Shield className="h-4 w-4" />
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
