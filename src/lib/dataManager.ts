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

// Helper to process array in chunks
const processInChunks = async <T>(
    items: T[],
    chunkSize: number,
    processItem: (item: T) => Promise<void>
) => {
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        await Promise.all(chunk.map(processItem));
    }
};

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

            // Format: backup-YYYY-MM-DD_HH-mm-ss.json
            const now = new Date();
            const dateStr = now.toISOString().split("T")[0];
            const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
            const fileName = `backup-${dateStr}_${timeStr}.json`;

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

                    const CHUNK_SIZE = 50;

                    // Restore Products (Smart Merge)
                    let productsCount = 0;
                    const existingProducts = await productManager.getAll();
                    const existingProductIds = new Set(existingProducts.map(p => p.id));

                    await processInChunks(data.products, CHUNK_SIZE, async (product) => {
                        if (existingProductIds.has(product.id)) {
                            await productManager.update(product.id, product);
                        } else {
                            await productManager.add(product);
                        }
                        productsCount++;
                    });

                    // Restore Bills (Smart Merge)
                    let billsCount = 0;
                    const existingBills = await billManager.getAll();
                    const existingBillIds = new Set(existingBills.map(b => b.id));

                    await processInChunks(data.bills, CHUNK_SIZE, async (bill) => {
                        if (!existingBillIds.has(bill.id)) {
                            await billManager.add(bill);
                            billsCount++;
                        }
                    });

                    // Restore Customers (Smart Merge)
                    let customersCount = 0;
                    if (data.customers) {
                        const existingCustomers = await customerManager.getAll();
                        const existingCustomerMap = new Map(); // Map ID/Mobile to ID
                        existingCustomers.forEach(c => {
                            existingCustomerMap.set(c.id, c.id);
                            existingCustomerMap.set(c.mobile, c.id);
                        });

                        await processInChunks(data.customers, CHUNK_SIZE, async (customer) => {
                            const existingId = existingCustomerMap.get(customer.id) || existingCustomerMap.get(customer.mobile);
                            if (existingId) {
                                await customerManager.update(existingId, customer);
                            } else {
                                await customerManager.add(customer);
                            }
                            customersCount++;
                        });
                    }

                    // Restore Users (Smart Merge)
                    let usersCount = 0;
                    if (data.users && data.users.length > 0) {
                        await processInChunks(data.users, CHUNK_SIZE, async (user) => {
                            try {
                                await fetch(`${SERVICE_URLS.AUTH}/register`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(user),
                                });
                                usersCount++;
                            } catch (e) {
                                // Ignore failures (e.g. user already exists)
                            }
                        });
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
