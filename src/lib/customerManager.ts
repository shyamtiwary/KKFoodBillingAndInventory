import { Capacitor } from '@capacitor/core';
import { databaseService } from './db/database';
import { SERVICE_URLS } from '@/config/apiConfig';

export interface Customer {
    id: string;
    name: string;
    mobile: string;
    email: string;
    balance: number;
    createdAt?: string;
    isDeleted?: boolean;
}

import { customerStore } from './storage/localStore';

class CustomerManager {
    private isNative = Capacitor.isNativePlatform();

    async getAll(includeDeleted: boolean = false): Promise<Customer[]> {
        if (this.isNative) {
            const auth = localStorage.getItem('kkfood_auth');
            const user = auth ? JSON.parse(auth) : null;

            let query = 'SELECT * FROM customers';
            let params: any[] = [];
            let conditions: string[] = [];

            if (user && user.role !== 'admin' && user.role !== 'manager') {
                conditions.push('createdBy = ?');
                params.push(user.email);
            }

            if (!includeDeleted) {
                conditions.push('isDeleted = 0');
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            return (await databaseService.query(query, params)).map(row => ({
                ...row,
                createdAt: row.createdAt,
                isDeleted: !!row.isDeleted
            }));
        } else {
            const auth = localStorage.getItem('kkfood_auth');
            const user = auth ? JSON.parse(auth) : null;
            const headers: Record<string, string> = {};
            if (user) {
                headers['X-User-Email'] = user.email;
                headers['X-User-Role'] = user.role;
            }

            const url = new URL(`${SERVICE_URLS.AUTH.replace('Auth', 'Customers')}`);
            if (includeDeleted) {
                url.searchParams.append('includeDeleted', 'true');
            }

            const response = await fetch(url.toString(), { headers });
            if (response.ok) return await response.json();
            return [];
        }
    }

    async getByMobile(mobile: string): Promise<Customer | null> {
        if (this.isNative) {
            const results = await databaseService.query('SELECT * FROM customers WHERE mobile = ?', [mobile]);
            return results.length > 0 ? results[0] : null;
        } else {
            const auth = localStorage.getItem('kkfood_auth');
            const user = auth ? JSON.parse(auth) : null;
            const headers: Record<string, string> = {};
            if (user) {
                headers['X-User-Email'] = user.email;
                headers['X-User-Role'] = user.role;
            }

            const response = await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Customers')}/mobile/${mobile}`, { headers });
            if (response.ok) return await response.json();
            return null;
        }
    }

    async add(customer: Customer): Promise<void> {
        if (this.isNative) {
            const auth = localStorage.getItem('kkfood_auth');
            const user = auth ? JSON.parse(auth) : null;

            await databaseService.run(
                'INSERT INTO customers (id, name, mobile, email, balance, createdBy, createdAt, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [customer.id, customer.name, customer.mobile, customer.email, customer.balance, user?.email || 'admin', customer.createdAt || new Date().toISOString(), 0]
            );
        } else {
            const auth = localStorage.getItem('kkfood_auth');
            const user = auth ? JSON.parse(auth) : null;
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (user) {
                headers['X-User-Email'] = user.email;
                headers['X-User-Role'] = user.role;
            }

            await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Customers')}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ ...customer, createdBy: user?.email || 'admin' }),
            });
        }
    }

    async update(id: string, customer: Partial<Customer>): Promise<void> {
        if (this.isNative) {
            const existing = await databaseService.query('SELECT * FROM customers WHERE id = ?', [id]);
            if (existing.length > 0) {
                const updated = { ...existing[0], ...customer };
                await databaseService.run(
                    'UPDATE customers SET name = ?, mobile = ?, email = ?, balance = ?, createdBy = ?, isDeleted = ? WHERE id = ?',
                    [updated.name, updated.mobile, updated.email, updated.balance, updated.createdBy || 'admin', updated.isDeleted ? 1 : 0, id]
                );
            }
        } else {
            const auth = localStorage.getItem('billflow_auth');
            const user = auth ? JSON.parse(auth) : null;
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (user) {
                headers['X-User-Email'] = user.email;
                headers['X-User-Role'] = user.role;
            }

            await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Customers')}/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ id, ...customer }),
            });
        }
    }

    async delete(id: string): Promise<void> {
        if (this.isNative) {
            await databaseService.run('UPDATE customers SET isDeleted = 1 WHERE id = ?', [id]);
        } else {
            const auth = localStorage.getItem('kkfood_auth');
            const user = auth ? JSON.parse(auth) : null;
            const headers: Record<string, string> = {};
            if (user) {
                headers['X-User-Email'] = user.email;
                headers['X-User-Role'] = user.role;
            }

            await fetch(`${SERVICE_URLS.AUTH.replace('Auth', 'Customers')}/${id}`, {
                method: 'DELETE',
                headers
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
