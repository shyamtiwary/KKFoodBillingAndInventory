import { Product, products as initialProducts } from '@/data/testData';

const STORAGE_KEY = 'billflow_products';

export const productManager = {
  // Initialize localStorage with test data if empty
  initialize: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProducts));
    }
  },

  // Get all products
  getAll: (): Product[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialProducts;
  },

  // Add a new product
  add: (product: Product) => {
    const products = productManager.getAll();
    products.push(product);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return product;
  },

  // Update a product
  update: (id: string, updatedProduct: Partial<Product>) => {
    const products = productManager.getAll();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedProduct };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }
    return products[index];
  },

  // Delete a product
  delete: (id: string) => {
    const products = productManager.getAll();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // Generate next product ID
  generateId: (): string => {
    const products = productManager.getAll();
    const maxId = products.reduce((max, product) => {
      const num = parseInt(product.id);
      return num > max ? num : max;
    }, 0);
    return String(maxId + 1);
  },
};
