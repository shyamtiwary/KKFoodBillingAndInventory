import { Bill } from '@/data/testData';
import { Capacitor } from '@capacitor/core';
import { ApiBillService, LocalBillService, WebBillService, IBillService } from './services/billService';

const isNative = Capacitor.isNativePlatform();
const service: IBillService = isNative ? new LocalBillService() : new ApiBillService();

export const billManager = {
  initialize: () => {
    // No-op
  },

  getAll: async (includeDeleted: boolean = false): Promise<Bill[]> => {
    return await service.getAll(includeDeleted);
  },

  add: async (bill: Bill): Promise<Bill | undefined> => {
    return await service.add(bill);
  },

  update: async (id: string, bill: Bill): Promise<Bill | undefined> => {
    return await service.update(id, bill);
  },

  generateBillNumber: async (): Promise<string> => {
    return await service.generateBillNumber();
  },

  exportToJson: async () => {
    const bills = await service.getAll();
    const dataStr = JSON.stringify(bills, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bills_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  delete: async (billId: string): Promise<boolean> => {
    return await service.delete(billId);
  },
};
