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
  datetime: string;
  items: BillItem[];
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue';
  createdBy?: string;
  amountPaid?: number;
  customerMobile?: string;
}

export const products: Product[] = [];

export const bills: Bill[] = [
  //{
  //   id: '1',
  //   billNumber: 'INV-001',
  //   customerName: 'John Doe',
  //   customerEmail: 'john@example.com',
  //   date: '2024-11-05',
  //   items: [
  //     {
  //       productId: '1',
  //       productName: 'Wireless Mouse',
  //       quantity: 2,
  //       price: 29.99,
  //       total: 59.98,
  //     },
  //     {
  //       productId: '3',
  //       productName: 'USB-C Cable',
  //       quantity: 3,
  //       price: 12.99,
  //       total: 38.97,
  //     },
  //   ],
  //   subtotal: 98.95,
  //   tax: 9.90,
  //   total: 108.85,
  //   status: 'paid',
  // },
  // {
  //   id: '2',
  //   billNumber: 'INV-002',
  //   customerName: 'Jane Smith',
  //   customerEmail: 'jane@example.com',
  //   date: '2024-11-06',
  //   items: [
  //     {
  //       productId: '7',
  //       productName: 'Monitor 27"',
  //       quantity: 1,
  //       price: 299.99,
  //       total: 299.99,
  //     },
  //     {
  //       productId: '4',
  //       productName: 'Laptop Stand',
  //       quantity: 1,
  //       price: 45.99,
  //       total: 45.99,
  //     },
  //   ],
  //   subtotal: 345.98,
  //   tax: 34.60,
  //   total: 380.58,
  //   status: 'paid',
  // },
  // {
  //   id: '3',
  //   billNumber: 'INV-003',
  //   customerName: 'Bob Johnson',
  //   customerEmail: 'bob@example.com',
  //   date: '2024-11-07',
  //   items: [
  //     {
  //       productId: '2',
  //       productName: 'Mechanical Keyboard',
  //       quantity: 1,
  //       price: 89.99,
  //       total: 89.99,
  //     },
  //   ],
  //   subtotal: 89.99,
  //   tax: 9.00,
  //   total: 98.99,
  //   status: 'pending',
  // },
  // {
  //   id: '4',
  //   billNumber: 'INV-004',
  //   customerName: 'Alice Brown',
  //   customerEmail: 'alice@example.com',
  //   date: '2024-10-28',
  //   items: [
  //     {
  //       productId: '8',
  //       productName: 'Office Chair',
  //       quantity: 2,
  //       price: 199.99,
  //       total: 399.98,
  //     },
  //     {
  //       productId: '6',
  //       productName: 'Desk Lamp',
  //       quantity: 2,
  //       price: 34.99,
  //       total: 69.98,
  //     },
  //   ],
  //   subtotal: 469.96,
  //   tax: 47.00,
  //   total: 516.96,
  //   status: 'overdue',
  // },
  // {
  //   id: '5',
  //   billNumber: 'INV-005',
  //   customerName: 'Charlie Davis',
  //   customerEmail: 'charlie@example.com',
  //   date: '2024-11-07',
  //   items: [
  //     {
  //       productId: '10',
  //       productName: 'Pen Set Premium',
  //       quantity: 5,
  //       price: 24.99,
  //       total: 124.95,
  //     },
  //     {
  //       productId: '9',
  //       productName: 'Notebook Set',
  //       quantity: 10,
  //       price: 15.99,
  //       total: 159.90,
  //     },
  //   ],
  //   subtotal: 284.85,
  //   tax: 28.49,
  //   total: 313.34,
  //   status: 'paid',
  // },
];
