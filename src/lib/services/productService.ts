import { Product } from '@/data/testData';
import { SERVICE_URLS } from '@/config/apiConfig';

const API_URL = SERVICE_URLS.INVENTORY;

export interface IProductService {
    getAll(includeDeleted?: boolean): Promise<Product[]>;
    add(product: Product): Promise<Product>;
    update(id: string, product: Partial<Product>): Promise<Product | undefined>;
    delete(id: string): Promise<void>;
    generateId(): Promise<string>;
}

export class ApiProductService implements IProductService {
    async getAll(includeDeleted: boolean = false): Promise<Product[]> {
        try {
            const url = new URL(API_URL);
            if (includeDeleted) {
                url.searchParams.append('includeDeleted', 'true');
            }
            const response = await fetch(url.toString());
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
    async getAll(includeDeleted: boolean = false): Promise<Product[]> {
        const products = await productStore.getItem<Product[]>('products');
        if (!products) return [];
        return includeDeleted ? products : products.filter(p => !p.isDeleted);
    }

    async add(product: Product): Promise<Product> {
        const products = await productStore.getItem<Product[]>('products') || [];
        const updated = [...products, product];
        await productStore.setItem('products', updated);
        return product;
    }

    async update(id: string, product: Partial<Product>): Promise<Product | undefined> {
        const products = await productStore.getItem<Product[]>('products') || [];
        const index = products.findIndex(p => p.id === id);
        if (index === -1) return undefined;

        const updatedProduct = { ...products[index], ...product };
        products[index] = updatedProduct;
        await productStore.setItem('products', products);
        return updatedProduct;
    }

    async delete(id: string): Promise<void> {
        const products = await productStore.getItem<Product[]>('products') || [];
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index].isDeleted = true;
            await productStore.setItem('products', products);
        }
    }

    async generateId(): Promise<string> {
        const products = await this.getAll(true);
        const maxId = products.reduce((max, product) => {
            const num = parseInt(product.id);
            return num > max ? num : max;
        }, 0);
        return String(maxId + 1);
    }
}

import { databaseService } from '@/lib/db/database';

export class LocalProductService implements IProductService {
    async getAll(includeDeleted: boolean = false): Promise<Product[]> {
        let query = 'SELECT * FROM products';
        if (!includeDeleted) {
            query += ' WHERE isDeleted = 0';
        }
        const result = await databaseService.query(query);
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
            createdAt: row.createdAt,
            isDeleted: !!row.isDeleted
        }));
    }

    async add(product: Product): Promise<Product> {
        const query = `
            INSERT INTO products (id, sku, name, category, price, costPrice, stock, lowStockThreshold, createdAt, isDeleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            product.createdAt || new Date().toISOString(),
            0
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
            SET sku = ?, name = ?, category = ?, price = ?, costPrice = ?, stock = ?, lowStockThreshold = ?, isDeleted = ?
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
            merged.isDeleted ? 1 : 0,
            id
        ]);

        return merged;
    }

    async delete(id: string): Promise<void> {
        await databaseService.run('UPDATE products SET isDeleted = 1 WHERE id = ?', [id]);
    }

    async generateId(): Promise<string> {
        return Date.now().toString();
    }
}
