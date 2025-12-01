import { Product, products as initialProducts } from '@/data/testData';

import { SERVICE_URLS } from '@/config/apiConfig';

const API_URL = SERVICE_URLS.INVENTORY;

export const productManager = {
  // Initialize - no longer needed
  initialize: () => {
    // No-op
  },

  // Get all products
  getAll: async (): Promise<Product[]> => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        console.warn('Failed to fetch products from API');
        return [];
      }

      const data = await response.json();
      console.log('Fetched products from API:', data);
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Add a new product
  add: async (product: Product): Promise<Product> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    return await response.json();
  },

  // Update a product
  update: async (id: string, updatedProduct: Partial<Product>): Promise<Product | undefined> => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedProduct),
    });
    return response.ok ? await response.json() : undefined;
  },

  // Delete a product
  delete: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  // Generate next product ID (this may need to be handled by the microservice)
  generateId: async (): Promise<string> => {
    const products = await productManager.getAll();
    const maxId = products.reduce((max, product) => {
      const num = parseInt(product.id);
      return num > max ? num : max;
    }, 0);
    return String(maxId + 1);
  },
};
