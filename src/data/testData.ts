export interface Product {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  sku: string;
  lowStockThreshold: number;
  createdAt?: string;
  isDeleted?: boolean;
}

export interface BillItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  customerName: string;
  customerEmail: string;
  date: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid?: number;
  status: 'paid' | 'pending' | 'overdue';
  createdBy?: string;
  customerMobile?: string;
  isDeleted?: boolean;
  datetime?: string;
  discountAmount?: number;
}

export const products: Product[] = [];

export const bills: Bill[] = [];
