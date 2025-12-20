import { Capacitor } from '@capacitor/core';
import { databaseService } from './db/database';
import { SERVICE_URLS } from '@/config/apiConfig';

export interface Customer {
    id: string;
    name: string;
    mobile: string;
    email: string;
    balance: number;
}

class CustomerManager {
    private isNative = Capacitor.isNativePlatform();

    async getAll(): Promise<Customer[]> {
        if (this.isNative) {
            return await databaseService.query('SELECT * FROM customers');
        } else {
            const response = await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Customers')}`);
            if (response.ok) return await response.json();
            return [];
        }
    }

    async getByMobile(mobile: string): Promise<Customer | null> {
        if (this.isNative) {
            const results = await databaseService.query('SELECT * FROM customers WHERE mobile = ?', [mobile]);
            return results.length > 0 ? results[0] : null;
        } else {
            const response = await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Customers')}/mobile/${mobile}`);
            if (response.ok) return await response.json();
            return null;
        }
    }

    async add(customer: Customer): Promise<void> {
        if (this.isNative) {
            await databaseService.run(
                'INSERT INTO customers (id, name, mobile, email, balance) VALUES (?, ?, ?, ?, ?)',
                [customer.id, customer.name, customer.mobile, customer.email, customer.balance]
            );
        } else {
            await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Customers')}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customer),
            });
        }
    }

    async update(id: string, customer: Partial<Customer>): Promise<void> {
        if (this.isNative) {
            const existing = await databaseService.query('SELECT * FROM customers WHERE id = ?', [id]);
            if (existing.length > 0) {
                const updated = { ...existing[0], ...customer };
                await databaseService.run(
                    'UPDATE customers SET name = ?, mobile = ?, email = ?, balance = ? WHERE id = ?',
                    [updated.name, updated.mobile, updated.email, updated.balance, id]
                );
            }
        } else {
            await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Customers')}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...customer }),
            });
        }
    }

    async updateBalance(mobile: string, amount: number): Promise<void> {
        const customer = await this.getByMobile(mobile);
        if (customer) {
            await this.update(customer.id, { balance: customer.balance + amount });
        }
    }
}

export const customerManager = new CustomerManager();
