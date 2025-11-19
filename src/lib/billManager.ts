import { Bill, bills as initialBills } from '@/data/testData';

const STORAGE_KEY = 'billflow_bills';

export const billManager = {
  // Initialize localStorage with test data if empty
  initialize: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialBills));
    }
  },

  // Get all bills
  getAll: (): Bill[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialBills;
  },

  // Add a new bill
  add: (bill: Bill) => {
    const bills = billManager.getAll();
    bills.unshift(bill); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    return bill;
  },

  // Generate next bill number
  generateBillNumber: (): string => {
    const bills = billManager.getAll();
    const maxNumber = bills.reduce((max, bill) => {
      const num = parseInt(bill.billNumber.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    return `INV-${String(maxNumber + 1).padStart(3, '0')}`;
  },

  // Export bills as JSON
  exportToJson: () => {
    const bills = billManager.getAll();
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
