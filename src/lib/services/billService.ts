import { Bill } from '@/data/testData';
import { SERVICE_URLS } from '@/config/apiConfig';

const API_URL = SERVICE_URLS.BILLING;

export interface IBillService {
    getAll(): Promise<Bill[]>;
    add(bill: Bill): Promise<Bill | undefined>;
    update(id: string, bill: Bill): Promise<Bill | undefined>;
    delete(id: string): Promise<boolean>;
    generateBillNumber(): Promise<string>;
}

export class ApiBillService implements IBillService {
    async getAll(): Promise<Bill[]> {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('API offline');
        }
        return [];
    }

    async add(bill: Bill): Promise<Bill | undefined> {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bill),
            });
            return response.ok ? await response.json() : undefined;
        } catch (error) {
            console.warn('API offline');
            return undefined;
        }
    }

    async update(id: string, bill: Bill): Promise<Bill | undefined> {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bill),
            });
            return response.ok ? await response.json() : undefined;
        } catch (error) {
            console.warn('API offline');
            return undefined;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            return response.ok;
        } catch (error) {
            console.warn('API offline');
            return false;
        }
    }

    async generateBillNumber(): Promise<string> {
        // For API, we might need a specific endpoint or just calculate from getAll like before
        const bills = await this.getAll();
        const maxNumber = bills.reduce((max, bill) => {
            const num = parseInt(bill.billNumber.split('-')[1]);
            return num > max ? num : max;
        }, 0);
        return `INV-${String(maxNumber + 1).padStart(3, '0')}`;
    }
}

import { billStore } from '../storage/localStore';

export class WebBillService implements IBillService {
    async getAll(): Promise<Bill[]> {
        const bills = await billStore.getItem<Bill[]>('bills');
        return bills || [];
    }

    async add(bill: Bill): Promise<Bill | undefined> {
        const bills = await this.getAll();
        const updated = [bill, ...bills]; // Newest first
        await billStore.setItem('bills', updated);
        return bill;
    }

    async update(id: string, bill: Bill): Promise<Bill | undefined> {
        const bills = await this.getAll();
        const index = bills.findIndex(b => b.id === id);
        if (index === -1) return undefined;

        bills[index] = bill;
        await billStore.setItem('bills', bills);
        return bill;
    }

    async delete(id: string): Promise<boolean> {
        const bills = await this.getAll();
        const filtered = bills.filter(b => b.id !== id);
        await billStore.setItem('bills', filtered);
        return true;
    }

    async generateBillNumber(): Promise<string> {
        const bills = await this.getAll();
        const maxNum = bills.reduce((max, bill) => {
            const num = parseInt(bill.billNumber.split('-')[1]);
            return num > max ? num : max;
        }, 0);
        return `INV-${String(maxNum + 1).padStart(3, '0')}`;
    }
}

import { databaseService } from '@/lib/db/database';

export class LocalBillService implements IBillService {
    async getAll(): Promise<Bill[]> {
        const result = await databaseService.query('SELECT * FROM bills ORDER BY date DESC');
        return result.map(row => {
            // Parse the full bill object from the JSON column
            const billData = JSON.parse(row.data);
            // Ensure status matches the column (source of truth for filtering)
            return { ...billData, status: row.status };
        });
    }

    async add(bill: Bill): Promise<Bill | undefined> {
        const query = `
            INSERT INTO bills (id, billNumber, date, customerName, customerEmail, total, status, data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await databaseService.run(query, [
            bill.id,
            bill.billNumber,
            bill.date,
            bill.customerName,
            bill.customerEmail,
            bill.total,
            bill.status,
            JSON.stringify(bill)
        ]);
        return bill;
    }

    async update(id: string, bill: Bill): Promise<Bill | undefined> {
        const query = `
            UPDATE bills 
            SET date = ?, customerName = ?, customerEmail = ?, total = ?, status = ?, data = ?
            WHERE id = ?
        `;
        await databaseService.run(query, [
            bill.date,
            bill.customerName,
            bill.customerEmail,
            bill.total,
            bill.status,
            JSON.stringify(bill),
            id
        ]);
        return bill;
    }

    async delete(id: string): Promise<boolean> {
        await databaseService.run('DELETE FROM bills WHERE id = ?', [id]);
        return true;
    }

    async generateBillNumber(): Promise<string> {
        const result = await databaseService.query('SELECT MAX(CAST(SUBSTR(billNumber, 5) AS INTEGER)) as maxNum FROM bills');
        const maxNum = result[0]?.maxNum || 0;
        return `INV-${String(maxNum + 1).padStart(3, '0')}`;
    }
}
