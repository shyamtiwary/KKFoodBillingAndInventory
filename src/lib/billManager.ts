import { Bill, bills as initialBills } from '@/data/testData';

const STORAGE_KEY = 'billflow_bills';

import { SERVICE_URLS } from '@/config/apiConfig';

export const billManager = {
  // Initialize - no longer needed for API but kept for compatibility
  initialize: () => {
    // No-op
  },

  // Get all bills
  getAll: async (): Promise<Bill[]> => {
    try {
      const response = await fetch(SERVICE_URLS.BILLING);
      if (!response.ok) {
        console.warn('Failed to fetch bills, returning empty list.');
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  },

  // Add a new bill
  add: async (bill: Bill): Promise<Bill | undefined> => {
    try {
      const response = await fetch(SERVICE_URLS.BILLING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bill),
      });
      return response.ok ? await response.json() : undefined;
    } catch (error) {
      console.error('Error adding bill:', error);
      return undefined;
    }
  },

  // Generate next bill number
  generateBillNumber: async (): Promise<string> => {
    try {
      const bills = await billManager.getAll();
      const maxNumber = bills.reduce((max, bill) => {
        const num = parseInt(bill.billNumber.split('-')[1]);
        return num > max ? num : max;
      }, 0);
      return `INV-${String(maxNumber + 1).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating bill number:', error);
      return 'INV-001';
    }
  },

  // Export bills as JSON
  exportToJson: async () => {
    const bills = await billManager.getAll();
    const dataStr = JSON.stringify(bills, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bills_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },
};
