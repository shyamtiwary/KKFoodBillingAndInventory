import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataManager } from "@/lib/dataManager";
import { userManager } from "@/lib/userManager";
import { Download, Upload, User, Check, X, Trash, Shield, ShieldOff, Smartphone, Monitor, RefreshCw, Plus } from "lucide-react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
    const { user: currentUser } = useAuth();
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [showDeletedUsers, setShowDeletedUsers] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff' as 'admin' | 'manager' | 'staff',
        accessType: 'web' as 'web' | 'mobile',
        isApproved: true,
        isActive: true
    });

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            loadUsers();
            if (Capacitor.isNativePlatform()) {
                handleSyncUsers();
            }
        }
    }, [currentUser, showDeletedUsers]);

    const loadUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const data = await userManager.getAll(showDeletedUsers);
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
                if (showDeletedUsers) {
                    setUsers(users.map(u => u.email === email ? { ...u, isDeleted: true } : u));
                } else {
                    setUsers(users.filter(u => u.email !== email));
                }
            } else {
                toast.error("Failed to delete user");
            }
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const handleAddUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            const success = await userManager.add(newUser as any);
            if (success) {
                toast.success("User added successfully");
                setIsAddUserOpen(false);
                setNewUser({
                    name: '',
                    email: '',
                    password: '',
                    role: 'staff',
                    accessType: 'web',
                    isApproved: true,
                    isActive: true
                });
                loadUsers();
            } else {
                toast.error("Failed to add user");
            }
        } catch (error) {
            toast.error("Failed to add user");
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    User Management
                                </CardTitle>
                                <CardDescription>
                                    Approve or manage user accounts.
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                                <div className="flex items-center space-x-2 mr-4">
                                    <Switch
                                        id="show-deleted-users"
                                        checked={showDeletedUsers}
                                        onCheckedChange={setShowDeletedUsers}
                                    />
                                    <Label htmlFor="show-deleted-users">Show Deleted</Label>
                                </div>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setIsAddUserOpen(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Add User</span>
                                    <span className="sm:hidden">Add</span>
                                </Button>
                                {Capacitor.isNativePlatform() && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSyncUsers}
                                        disabled={isSyncing}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                        <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                                        <span className="sm:hidden">{isSyncing ? 'Syncing...' : 'Sync'}</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[800px]">
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
                                        <tr key={u.email} className={`border-b last:border-0 whitespace-nowrap ${u.isDeleted ? 'opacity-50 bg-muted/20' : ''}`}>
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
                                                    {u.isDeleted ? (
                                                        <Badge variant="destructive">Deleted</Badge>
                                                    ) : (
                                                        <>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                {u.isApproved ? 'Approved' : 'Pending'}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                                {u.isActive ? 'Active' : 'Disabled'}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {!u.isDeleted && (
                                                        <>
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
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && !isLoadingUsers && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-4 text-muted-foreground">No users found</td>
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

            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                            Create a new user account with specific role and access type.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                placeholder="Enter full name"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="Enter email"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                placeholder="Enter password"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="accessType">Access Type</Label>
                            <Select value={newUser.accessType} onValueChange={(value: any) => setNewUser({ ...newUser, accessType: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select access type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="web">Web</SelectItem>
                                    <SelectItem value="mobile">Mobile</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddUser}>
                            Add User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Settings;
