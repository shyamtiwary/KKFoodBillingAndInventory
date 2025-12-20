import { productManager } from "./productManager";
import { billManager } from "./billManager";
import { customerManager, Customer } from "./customerManager";
import { downloadFile } from "./utils/fileDownloader";
import { Product, Bill } from "@/data/testData";
import { SERVICE_URLS } from "@/config/apiConfig";

interface BackupData {
    version: string;
    timestamp: string;
    products: Product[];
    bills: Bill[];
    customers: Customer[];
    users: any[];
}

export const dataManager = {
    backupData: async () => {
        try {
            const products = await productManager.getAll();
            const bills = await billManager.getAll();
            const customers = await customerManager.getAll();

            // Fetch users (admin only usually, but we'll try)
            let users: any[] = [];
            try {
                const response = await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Users')}`);
                if (response.ok) users = await response.json();
            } catch (e) {
                console.warn("Could not backup users:", e);
            }

            const backup: BackupData = {
                version: "1.1",
                timestamp: new Date().toISOString(),
                products,
                bills,
                customers,
                users
            };

            const jsonContent = JSON.stringify(backup, null, 2);
            const fileName = `backup-${new Date().toISOString().split("T")[0]}.json`;

            await downloadFile(fileName, jsonContent, "application/json");
            return true;
        } catch (error) {
            console.error("Backup failed:", error);
            throw error;
        }
    },

    restoreData: async (file: File): Promise<{ productsCount: number; billsCount: number; customersCount: number; usersCount: number }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const content = e.target?.result as string;
                    const data: BackupData = JSON.parse(content);

                    if (!data.products || !data.bills) {
                        throw new Error("Invalid backup file format");
                    }

                    // Restore Products (Smart Merge)
                    let productsCount = 0;
                    const existingProducts = await productManager.getAll();
                    for (const product of data.products) {
                        const exists = existingProducts.find(p => p.id === product.id);
                        if (exists) {
                            await productManager.update(product.id, product);
                        } else {
                            await productManager.add(product);
                        }
                        productsCount++;
                    }

                    // Restore Bills (Smart Merge)
                    let billsCount = 0;
                    const existingBills = await billManager.getAll();
                    for (const bill of data.bills) {
                        const exists = existingBills.find(b => b.id === bill.id);
                        if (!exists) {
                            await billManager.add(bill);
                            billsCount++;
                        }
                    }

                    // Restore Customers (Smart Merge)
                    let customersCount = 0;
                    if (data.customers) {
                        const existingCustomers = await customerManager.getAll();
                        for (const customer of data.customers) {
                            const exists = existingCustomers.find(c => c.id === customer.id || c.mobile === customer.mobile);
                            if (exists) {
                                await customerManager.update(exists.id, customer);
                            } else {
                                await customerManager.add(customer);
                            }
                            customersCount++;
                        }
                    }

                    // Restore Users (Smart Merge)
                    let usersCount = 0;
                    if (data.users && data.users.length > 0) {
                        for (const user of data.users) {
                            try {
                                // Try to register/add user via API if not exists
                                // This is a bit tricky as we don't have a bulk upsert for users
                                // For now, we'll just log or attempt a POST to register (might fail if exists)
                                await fetch(`${SERVICE_URLS.AUTH}/register`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(user),
                                });
                                usersCount++;
                            } catch (e) {
                                // Ignore failures (e.g. user already exists)
                            }
                        }
                    }

                    resolve({ productsCount, billsCount, customersCount, usersCount });
                } catch (error) {
                    console.error("Restore failed:", error);
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        });
    },
};
