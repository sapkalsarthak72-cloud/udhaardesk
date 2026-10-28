/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, Shop, Transaction } from '../types';

export const INITIAL_SHOP: Shop = {
  shopId: 'shop-demo-001',
  ownerUid: 'owner-rameshwar-01',
  shopName: 'Gupta Kirana & General Store',
  ownerName: 'Rameshwar Gupta',
  phone: '+919820123456',
  address: 'Shop No. 4, Shivaji Chowk, Market Road, Pune, Maharashtra - 411001',
  upiId: 'guptastore@okaxis',
  preferredLanguage: 'hinglish',
  createdAt: '2025-01-10T08:00:00.000Z',
  currencySymbol: '₹',
};

// Calculate dates relative to today for realistic testing
const getRelativeDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    customerId: 'cust-101',
    shopId: 'shop-demo-001',
    name: 'Rahul Sharma',
    phone: '+919876543210',
    address: 'Flat 302, Sai Residency, Shivaji Chowk',
    notes: 'Regular customer, takes monthly grocery on udhaar',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    archivedAt: null,
  },
  {
    customerId: 'cust-102',
    shopId: 'shop-demo-001',
    name: 'Amit Patil',
    phone: '+919822334455',
    address: 'Near Datta Mandir, Lane 2',
    notes: 'Weekly milk and snacks buyer',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    archivedAt: null,
  },
  {
    customerId: 'cust-103',
    shopId: 'shop-demo-001',
    name: 'Priya Deshmukh',
    phone: '+919911223344',
    address: 'B-12, Green Park Society',
    notes: 'Teacher at Modern High School',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    archivedAt: null,
  },
  {
    customerId: 'cust-104',
    shopId: 'shop-demo-001',
    name: 'Sneha Verma',
    phone: '+919890123456',
    address: 'Plot 45, Railway Station Road',
    notes: 'Runs coaching classes nearby',
    createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    archivedAt: null,
  },
  {
    customerId: 'cust-105',
    shopId: 'shop-demo-001',
    name: 'Rohan Gupta',
    phone: '+919765432109',
    address: 'House 14, Gandhi Nagar',
    notes: 'Always pays on time via Google Pay',
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    archivedAt: null,
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // 1. Rahul Sharma: Total credit ₹2,500, paid ₹700, remaining ₹1,800 (Oldest credit: 36 days ago -> Overdue >30d!)
  {
    transactionId: 'tx-1001',
    shopId: 'shop-demo-001',
    customerId: 'cust-101',
    type: 'CREDIT',
    amountPaise: 150000, // ₹1,500.00
    items: [
      { name: 'Aashirvaad Atta', quantity: '10 kg', pricePaise: 42000 },
      { name: 'Fortune Sunflower Oil', quantity: '2 L', pricePaise: 29000 },
      { name: 'Tata Salt', quantity: '2 kg', pricePaise: 5600 },
      { name: 'Sugar (Madhur)', quantity: '5 kg', pricePaise: 23400 },
      { name: 'Toor Dal Premium', quantity: '3 kg', pricePaise: 50000 },
    ],
    transactionDate: getRelativeDate(36),
    createdAt: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'owner-rameshwar-01',
    notes: 'Monthly kirana ration',
    status: 'COMPLETED',
  },
  {
    transactionId: 'tx-1002',
    shopId: 'shop-demo-001',
    customerId: 'cust-101',
    type: 'CREDIT',
    amountPaise: 100000, // ₹1,000.00
    items: [
      { name: 'Surf Excel Quick Wash', quantity: '2 kg', pricePaise: 38000 },
      { name: 'Dettol Soap 4-pack', quantity: '1 unit', pricePaise: 18000 },
      { name: 'Brooke Bond Red Label Tea', quantity: '500 g', pricePaise: 26000 },
      { name: 'Maggi 2-Minute Noodles', quantity: '8-pack', pricePaise: 18000 },
    ],
    transactionDate: getRelativeDate(20),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'owner-rameshwar-01',
    notes: 'Detergent and tea items',
    status: 'COMPLETED',
  },
  {
    transactionId: 'tx-1003',
    shopId: 'shop-demo-001',
    customerId: 'cust-101',
    type: 'PAYMENT',
    amountPaise: 70000, // ₹700.00 partial payment
    paymentMethod: 'UPI',
    referenceNumber: 'UPI/402891238910',
    transactionDate: getRelativeDate(10),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'owner-rameshwar-01',
    notes: 'Google Pay partial payment received',
    status: 'COMPLETED',
  },

  // 2. Amit Patil: Credit ₹640 (12 days ago -> bucket 8-15 days)
  {
    transactionId: 'tx-1004',
    shopId: 'shop-demo-001',
    customerId: 'cust-102',
    type: 'CREDIT',
    amountPaise: 64000, // ₹640.00
    items: [
      { name: 'Amul Taaza Milk', quantity: '4 packets', pricePaise: 12000 },
      { name: 'Britannia Good Day Biscuits', quantity: '5 packets', pricePaise: 15000 },
      { name: 'Amul Butter', quantity: '500 g', pricePaise: 27500 },
      { name: 'Everest Garam Masala', quantity: '100 g', pricePaise: 9500 },
    ],
    transactionDate: getRelativeDate(12),
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'owner-rameshwar-01',
    notes: 'Breakfast snacks and dairy',
    status: 'COMPLETED',
  },

  // 3. Priya Deshmukh: Credit ₹320 (4 days ago -> bucket 0-7 days)
  {
    transactionId: 'tx-1005',
    shopId: 'shop-demo-001',
    customerId: 'cust-103',
    type: 'CREDIT',
    amountPaise: 32000, // ₹320.00
    items: [
      { name: 'Kissan Fresh Tomato Ketchup', quantity: '1 kg', pricePaise: 13500 },
      { name: 'Tata Sampann Chana Dal', quantity: '1 kg', pricePaise: 11500 },
      { name: 'Haldiram Bhujia', quantity: '200 g', pricePaise: 7000 },
    ],
    transactionDate: getRelativeDate(4),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'owner-rameshwar-01',
    notes: 'Snacks & Dal',
    status: 'COMPLETED',
  },

  // 4. Sneha Verma: Total credit ₹3,000, paid ₹600, remaining ₹2,400 (Oldest credit: 42 days ago -> Overdue >30d!)
  {
    transactionId: 'tx-1006',
    shopId: 'shop-demo-001',
    customerId: 'cust-104',
    type: 'CREDIT',
    amountPaise: 300000, // ₹3,000.00
    items: [
      { name: 'Basmati Rice India Gate', quantity: '10 kg', pricePaise: 120000 },
      { name: 'Kisan Pure Ghee', quantity: '1 L', pricePaise: 68000 },
      { name: 'Cashews & Almonds (Dry Fruits)', quantity: '500 g', pricePaise: 72000 },
      { name: 'MDH Spices Set', quantity: '4 boxes', pricePaise: 40000 },
    ],
    transactionDate: getRelativeDate(42),
    createdAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'owner-rameshwar-01',
    notes: 'Festival special grocery order',
    status: 'COMPLETED',
  },
  {
    transactionId: 'tx-1007',
    shopId: 'shop-demo-001',
    customerId: 'cust-104',
    type: 'PAYMENT',
    amountPaise: 60000, // ₹600.00
    paymentMethod: 'CASH',
    transactionDate: getRelativeDate(18),
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'owner-rameshwar-01',
    notes: 'Cash payment given by son',
    status: 'COMPLETED',
  },

  // 5. Rohan Gupta: Credit ₹1,200, paid ₹1,200 yesterday in full -> Balance 0!
  {
    transactionId: 'tx-1008',
    shopId: 'shop-demo-001',
    customerId: 'cust-105',
    type: 'CREDIT',
    amountPaise: 120000, // ₹1,200.00
    items: [
      { name: 'Aashirvaad Shudh Chakki Atta', quantity: '10 kg', pricePaise: 42000 },
      { name: 'Fortune Soya Health Oil', quantity: '3 L', pricePaise: 43000 },
      { name: 'Tata Tea Gold', quantity: '500 g', pricePaise: 35000 },
    ],
    transactionDate: getRelativeDate(6),
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'owner-rameshwar-01',
    notes: 'Regular household staples',
    status: 'COMPLETED',
  },
  {
    transactionId: 'tx-1009',
    shopId: 'shop-demo-001',
    customerId: 'cust-105',
    type: 'PAYMENT',
    amountPaise: 120000, // ₹1,200.00
    paymentMethod: 'UPI',
    referenceNumber: 'UPI/403198712398',
    transactionDate: getRelativeDate(1), // Yesterday (within current week!)
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'owner-rameshwar-01',
    notes: 'Full payment cleared via PhonePe QR',
    status: 'COMPLETED',
  },

  // 6. Today's Collection entry! Cash collected today
  {
    transactionId: 'tx-1010',
    shopId: 'shop-demo-001',
    customerId: 'cust-102',
    type: 'PAYMENT',
    amountPaise: 20000, // ₹200.00
    paymentMethod: 'CASH',
    transactionDate: getRelativeDate(0), // Today!
    createdAt: new Date().toISOString(),
    createdBy: 'owner-rameshwar-01',
    notes: 'Cash payment received at counter today',
    status: 'COMPLETED',
  },
];
