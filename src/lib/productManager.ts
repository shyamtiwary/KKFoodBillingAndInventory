import { Product } from '@/data/testData';
import { Capacitor } from '@capacitor/core';
import { ApiProductService, LocalProductService, WebProductService, IProductService } from './services/productService';

const isNative = Capacitor.isNativePlatform();
const service: IProductService = isNative ? new LocalProductService() : new ApiProductService();

export const productManager = {
  initialize: () => {
    // No-op
  },

  getAll: async (includeDeleted: boolean = false): Promise<Product[]> => {
    return await service.getAll(includeDeleted);
  },

  add: async (product: Product): Promise<Product> => {
    return await service.add(product);
  },

  update: async (id: string, updatedProduct: Partial<Product>): Promise<Product | undefined> => {
    return await service.update(id, updatedProduct);
  },

  delete: async (id: string): Promise<void> => {
    await service.delete(id);
  },

  generateId: async (): Promise<string> => {
    return await service.generateId();
  },
};
