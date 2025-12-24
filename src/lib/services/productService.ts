import { Product } from '@/data/testData';
import { SERVICE_URLS } from '@/config/apiConfig';

const API_URL = SERVICE_URLS.INVENTORY;

export interface IProductService {
    getAll(): Promise<Product[]>;
    add(product: Product): Promise<Product>;
    update(id: string, product: Partial<Product>): Promise<Product | undefined>;
    delete(id: string): Promise<void>;
    generateId(): Promise<string>;
}

export class ApiProductService implements IProductService {
    async getAll(): Promise<Product[]> {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                console.warn('Failed to fetch products from API');
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    async add(product: Product): Promise<Product> {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });
        return await response.json();
    }

    async update(id: string, product: Partial<Product>): Promise<Product | undefined> {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });
        return response.ok ? await response.json() : undefined;
    }

    async delete(id: string): Promise<void> {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    }

    async generateId(): Promise<string> {
        // API usually handles ID generation, but for compatibility with current manager:
        const products = await this.getAll();
        const maxId = products.reduce((max, product) => {
            const num = parseInt(product.id);
            return num > max ? num : max;
        }, 0);
        return String(maxId + 1);
    }
}

import { productStore } from '../storage/localStore';

export class WebProductService implements IProductService {
    async getAll(): Promise<Product[]> {
        const products = await productStore.getItem<Product[]>('products');
        return products || [];
    }

    async add(product: Product): Promise<Product> {
        const products = await this.getAll();
        const updated = [...products, product];
        await productStore.setItem('products', updated);
        return product;
    }

    async update(id: string, product: Partial<Product>): Promise<Product | undefined> {
        const products = await this.getAll();
        const index = products.findIndex(p => p.id === id);
        if (index === -1) return undefined;

        const updatedProduct = { ...products[index], ...product };
        products[index] = updatedProduct;
        await productStore.setItem('products', products);
        return updatedProduct;
    }

    async delete(id: string): Promise<void> {
        const products = await this.getAll();
        const filtered = products.filter(p => p.id !== id);
        await productStore.setItem('products', filtered);
    }

    async generateId(): Promise<string> {
        const products = await this.getAll();
        const maxId = products.reduce((max, product) => {
            const num = parseInt(product.id);
            return num > max ? num : max;
        }, 0);
        return String(maxId + 1);
    }
}

import { databaseService } from '@/lib/db/database';

export class LocalProductService implements IProductService {
    async getAll(): Promise<Product[]> {
        const result = await databaseService.query('SELECT * FROM products');
        // Map database columns to Product object (if needed, but names match)
        return result.map(row => ({
            id: row.id,
            sku: row.sku,
            name: row.name,
            category: row.category,
            sellPrice: row.price, // Map price to sellPrice
            costPrice: row.costPrice || 0, // Default to 0 if missing
            stock: row.stock,
            lowStockThreshold: row.lowStockThreshold,
            createdAt: row.createdAt
        }));
    }

    async add(product: Product): Promise<Product> {
        const query = `
            INSERT INTO products (id, sku, name, category, price, costPrice, stock, lowStockThreshold, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await databaseService.run(query, [
            product.id,
            product.sku,
            product.name,
            product.category,
            product.sellPrice,
            product.costPrice,
            product.stock,
            product.lowStockThreshold,
            product.createdAt || new Date().toISOString()
        ]);
        return product;
    }

    async update(id: string, product: Partial<Product>): Promise<Product | undefined> {
        // First get existing to merge
        const existingList = await databaseService.query('SELECT * FROM products WHERE id = ?', [id]);
        if (existingList.length === 0) return undefined;

        const existing = existingList[0];
        const merged = {
            ...existing,
            sellPrice: existing.price, // Map back for merging
            costPrice: existing.costPrice,
            ...product
        };

        const query = `
            UPDATE products 
            SET sku = ?, name = ?, category = ?, price = ?, costPrice = ?, stock = ?, lowStockThreshold = ?
            WHERE id = ?
        `;

        await databaseService.run(query, [
            merged.sku,
            merged.name,
            merged.category,
            merged.sellPrice,
            merged.costPrice,
            merged.stock,
            merged.lowStockThreshold,
            id
        ]);

        return merged;
    }

    async delete(id: string): Promise<void> {
        await databaseService.run('DELETE FROM products WHERE id = ?', [id]);
    }

    async generateId(): Promise<string> {
        return Date.now().toString();
    }
}
