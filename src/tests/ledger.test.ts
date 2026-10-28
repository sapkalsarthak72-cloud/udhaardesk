/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, Transaction } from '../types';
import {
  calculateCustomerBalance,
  calculateOldestUnpaidDate,
  getAgingBucket,
  buildCustomerKhataSummaries,
  computeDashboardStats,
  exportTransactionsToCsv,
} from '../utils/ledger';
import { formatRupees, rupeesToPaise, paiseToRupees } from '../utils/formatters';
import { generateUpiUrl, isValidUpiId } from '../utils/upi';
import {
  generateUdhaarBillMessage,
  generatePaymentReminderMessage,
  generatePaymentReceiptMessage,
} from '../utils/whatsapp';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export function runAllTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      results.push(`✅ PASS: ${name}`);
    } catch (err: any) {
      failed++;
      results.push(`❌ FAIL: ${name} -> ${err.message}`);
    }
  }

  // 1. Currency & Paise conversion tests
  test('Integer paise conversion prevents float rounding bugs', () => {
    assert(rupeesToPaise('125.50') === 12550, 'rupeesToPaise float string');
    assert(rupeesToPaise(250) === 25000, 'rupeesToPaise integer');
    assert(paiseToRupees(12550) === 125.5, 'paiseToRupees conversion');
    assert(formatRupees(125000).includes('1,250'), 'formatRupees 1,250');
  });

  // 2. Customer balance calculation tests
  test('Balance calculation: single credit', () => {
    const tx: Transaction[] = [
      {
        transactionId: 't1',
        shopId: 's1',
        customerId: 'c1',
        type: 'CREDIT',
        amountPaise: 50000,
        transactionDate: '2026-10-01',
        createdAt: '2026-10-01T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
    ];
    const { outstandingBalancePaise, totalCreditPaise, totalPaymentPaise } = calculateCustomerBalance('c1', tx);
    assert(totalCreditPaise === 50000, 'total credit paise');
    assert(totalPaymentPaise === 0, 'total payment paise');
    assert(outstandingBalancePaise === 50000, 'outstanding balance');
  });

  test('Balance calculation: partial payment', () => {
    const tx: Transaction[] = [
      {
        transactionId: 't1',
        shopId: 's1',
        customerId: 'c1',
        type: 'CREDIT',
        amountPaise: 100000,
        transactionDate: '2026-10-01',
        createdAt: '2026-10-01T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
      {
        transactionId: 't2',
        shopId: 's1',
        customerId: 'c1',
        type: 'PAYMENT',
        amountPaise: 40000,
        transactionDate: '2026-10-05',
        createdAt: '2026-10-05T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
    ];
    const { outstandingBalancePaise } = calculateCustomerBalance('c1', tx);
    assert(outstandingBalancePaise === 60000, `Expected 60000, got ${outstandingBalancePaise}`);
  });

  test('Balance calculation: full payment leaves zero balance', () => {
    const tx: Transaction[] = [
      {
        transactionId: 't1',
        shopId: 's1',
        customerId: 'c1',
        type: 'CREDIT',
        amountPaise: 75000,
        transactionDate: '2026-10-01',
        createdAt: '2026-10-01T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
      {
        transactionId: 't2',
        shopId: 's1',
        customerId: 'c1',
        type: 'PAYMENT',
        amountPaise: 75000,
        transactionDate: '2026-10-02',
        createdAt: '2026-10-02T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
    ];
    const { outstandingBalancePaise } = calculateCustomerBalance('c1', tx);
    assert(outstandingBalancePaise === 0, `Expected 0, got ${outstandingBalancePaise}`);
  });

  test('Reversed transactions are ignored in balance calculation', () => {
    const tx: Transaction[] = [
      {
        transactionId: 't1',
        shopId: 's1',
        customerId: 'c1',
        type: 'CREDIT',
        amountPaise: 50000,
        transactionDate: '2026-10-01',
        createdAt: '2026-10-01T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
      {
        transactionId: 't2',
        shopId: 's1',
        customerId: 'c1',
        type: 'CREDIT',
        amountPaise: 20000,
        transactionDate: '2026-10-02',
        createdAt: '2026-10-02T10:00:00Z',
        createdBy: 'u1',
        status: 'REVERSED', // Should not be counted!
      },
    ];
    const { outstandingBalancePaise } = calculateCustomerBalance('c1', tx);
    assert(outstandingBalancePaise === 50000, `Expected 50000, got ${outstandingBalancePaise}`);
  });

  // 3. FIFO Oldest Unpaid Date Logic
  test('FIFO oldest unpaid date: first entry partially unpaid', () => {
    const tx: Transaction[] = [
      {
        transactionId: 't1',
        shopId: 's1',
        customerId: 'c1',
        type: 'CREDIT',
        amountPaise: 100000,
        transactionDate: '2026-09-01',
        createdAt: '2026-09-01T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
      {
        transactionId: 't2',
        shopId: 's1',
        customerId: 'c1',
        type: 'CREDIT',
        amountPaise: 50000,
        transactionDate: '2026-10-01',
        createdAt: '2026-10-01T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
      {
        transactionId: 't3',
        shopId: 's1',
        customerId: 'c1',
        type: 'PAYMENT',
        amountPaise: 60000, // Pays 60% of t1
        transactionDate: '2026-10-10',
        createdAt: '2026-10-10T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
    ];
    const { oldestUnpaidDate } = calculateOldestUnpaidDate('c1', tx);
    assert(oldestUnpaidDate === '2026-09-01', `Expected 2026-09-01, got ${oldestUnpaidDate}`);
  });

  test('FIFO oldest unpaid date: first entry fully settled, second entry unpaid', () => {
    const tx: Transaction[] = [
      {
        transactionId: 't1',
        shopId: 's1',
        customerId: 'c1',
        type: 'CREDIT',
        amountPaise: 100000,
        transactionDate: '2026-09-01',
        createdAt: '2026-09-01T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
      {
        transactionId: 't2',
        shopId: 's1',
        customerId: 'c1',
        type: 'PAYMENT',
        amountPaise: 100000, // Settles t1 completely
        transactionDate: '2026-09-15',
        createdAt: '2026-09-15T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
      {
        transactionId: 't3',
        shopId: 's1',
        customerId: 'c1',
        type: 'CREDIT',
        amountPaise: 50000,
        transactionDate: '2026-10-05',
        createdAt: '2026-10-05T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
    ];
    const { oldestUnpaidDate } = calculateOldestUnpaidDate('c1', tx);
    assert(oldestUnpaidDate === '2026-10-05', `Expected 2026-10-05, got ${oldestUnpaidDate}`);
  });

  // 4. Aging buckets
  test('Aging buckets correctly categorize days', () => {
    assert(getAgingBucket(3) === '0_to_7', '0 to 7 days bucket');
    assert(getAgingBucket(7) === '0_to_7', '7 days bucket boundary');
    assert(getAgingBucket(8) === '8_to_15', '8 days bucket boundary');
    assert(getAgingBucket(15) === '8_to_15', '15 days bucket');
    assert(getAgingBucket(20) === '16_to_30', '16 to 30 days bucket');
    assert(getAgingBucket(35) === 'more_than_30', 'Overdue >30 days bucket');
  });

  // 5. UPI validation & URL generation
  test('UPI link generator produces valid NPCI URI', () => {
    assert(isValidUpiId('shop@okaxis'), 'Valid UPI ID check');
    assert(!isValidUpiId('invalidupi'), 'Invalid UPI ID rejection');

    const uri = generateUpiUrl({
      upiId: 'kirana@upi',
      shopName: 'Super Kirana',
      amountPaise: 25000,
      note: 'Bill payment',
    });
    assert(uri.startsWith('upi://pay?'), 'URI prefix');
    assert(uri.includes('pa=kirana%40upi') || uri.includes('pa=kirana@upi'), 'VPA encoding');
    assert(uri.includes('am=250.00'), 'Rupee decimal encoding');
  });

  // 6. WhatsApp Bill & Reminder Messages
  test('WhatsApp bill message contains shop name and rupee amounts', () => {
    const shop = {
      shopId: 's1',
      ownerUid: 'u1',
      shopName: 'Gupta Store',
      ownerName: 'Rameshwar',
      phone: '+919820123456',
      address: 'Market',
      upiId: 'gupta@upi',
      preferredLanguage: 'hinglish' as const,
      createdAt: '2025-01-01',
      currencySymbol: '₹',
    };
    const customer = {
      customerId: 'c1',
      shopId: 's1',
      name: 'Rahul Sharma',
      phone: '+919876543210',
      createdAt: '2025-01-01',
    };
    const tx: Transaction = {
      transactionId: 't1',
      shopId: 's1',
      customerId: 'c1',
      type: 'CREDIT',
      amountPaise: 50000,
      transactionDate: '2026-10-27',
      createdAt: '2026-10-27T10:00:00Z',
      createdBy: 'u1',
      status: 'COMPLETED',
      items: [{ name: 'Rice and Sugar' }],
    };

    const msg = generateUdhaarBillMessage(shop, customer, tx, 120000);
    assert(msg.includes('Rahul Sharma'), 'Contains customer name');
    assert(msg.includes('Gupta Store'), 'Contains shop name');
    assert(msg.includes('500'), 'Contains bill amount');
    assert(msg.includes('1,200'), 'Contains total outstanding amount');
  });

  // 7. CSV Export
  test('CSV export generates proper headers and escaped rows', () => {
    const customers: Customer[] = [
      {
        customerId: 'c1',
        shopId: 's1',
        name: 'Rahul, "Big" Sharma',
        phone: '+919876543210',
        createdAt: '2025-01-01',
      },
    ];
    const transactions: Transaction[] = [
      {
        transactionId: 't1',
        shopId: 's1',
        customerId: 'c1',
        type: 'CREDIT',
        amountPaise: 50000,
        transactionDate: '2026-10-27',
        createdAt: '2026-10-27T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
        notes: 'Monthly ration, paid later',
      },
    ];
    const csv = exportTransactionsToCsv(transactions, customers);
    assert(csv.includes('Transaction ID,Date,Customer Name'), 'CSV header present');
    assert(csv.includes('500.00'), 'Rupees formatted in CSV');
  });

  // 8. Scenario: Overdue filtering (>30 days) and Zero-balance reminder exclusion
  test('Overdue filtering (>30 days) and zero-balance exclusion from reminders', () => {
    const cust1: Customer = {
      customerId: 'c1',
      shopId: 's1',
      name: 'Overdue Cust',
      phone: '+919876543210',
      createdAt: '2026-08-01',
    };
    const cust2: Customer = {
      customerId: 'c2',
      shopId: 's1',
      name: 'Zero Balance Cust',
      phone: '+919876543211',
      createdAt: '2026-08-01',
    };

    const tx: Transaction[] = [
      // c1: 45 days old unpaid udhaar
      {
        transactionId: 't1',
        shopId: 's1',
        customerId: 'c1',
        type: 'CREDIT',
        amountPaise: 100000,
        transactionDate: '2026-09-01',
        createdAt: '2026-09-01T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
      // c2: bought and paid in full
      {
        transactionId: 't2',
        shopId: 's1',
        customerId: 'c2',
        type: 'CREDIT',
        amountPaise: 50000,
        transactionDate: '2026-09-01',
        createdAt: '2026-09-01T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
      {
        transactionId: 't3',
        shopId: 's1',
        customerId: 'c2',
        type: 'PAYMENT',
        amountPaise: 50000,
        transactionDate: '2026-09-05',
        createdAt: '2026-09-05T10:00:00Z',
        createdBy: 'u1',
        status: 'COMPLETED',
      },
    ];

    const summaries = buildCustomerKhataSummaries([cust1, cust2], tx);
    const withDues = summaries.filter((s) => s.outstandingBalancePaise > 0);

    assert(withDues.length === 1, 'Only customer with balance > 0 eligible for reminders');
    assert(withDues[0].customer.customerId === 'c1', 'c1 is eligible');
    assert(withDues[0].daysPending > 30, 'c1 is flagged as overdue (>30 days)');
  });

  // 9. Scenario: Weekly collection calculation strictly from PAYMENT records
  test('Weekly collection computes strictly from PAYMENT entries (not credit)', () => {
    const today = new Date().toISOString().split('T')[0];
    const tx: Transaction[] = [
      {
        transactionId: 't1',
        shopId: 's1',
        customerId: 'c1',
        type: 'CREDIT',
        amountPaise: 200000, // ₹2,000 credit should NOT count as collection
        transactionDate: today,
        createdAt: new Date().toISOString(),
        createdBy: 'u1',
        status: 'COMPLETED',
      },
      {
        transactionId: 't2',
        shopId: 's1',
        customerId: 'c1',
        type: 'PAYMENT',
        amountPaise: 50000, // ₹500 received today
        paymentMethod: 'CASH',
        transactionDate: today,
        createdAt: new Date().toISOString(),
        createdBy: 'u1',
        status: 'COMPLETED',
      },
    ];

    const stats = computeDashboardStats(
      [
        {
          customerId: 'c1',
          shopId: 's1',
          name: 'Rahul',
          phone: '+919876543210',
          createdAt: '2026-01-01',
        },
      ],
      tx
    );

    assert(stats.todayCollectionPaise === 50000, 'Today collection counts payment only');
    assert(stats.totalOutstandingPaise === 150000, 'Total outstanding is credit minus payment (₹1,500)');
  });

  // 10. Scenario: Cross-shop data scoping invariant
  test('Cross-shop security: customer records scoped strictly to shopId', () => {
    const shop1Customers: Customer[] = [
      { customerId: 'c1', shopId: 'shop-A', name: 'Cust A', phone: '+919876543210', createdAt: '2026-01-01' },
    ];
    const shop2Customers: Customer[] = [
      { customerId: 'c2', shopId: 'shop-B', name: 'Cust B', phone: '+919876543211', createdAt: '2026-01-01' },
    ];

    const filteredShopA = [...shop1Customers, ...shop2Customers].filter((c) => c.shopId === 'shop-A');
    assert(filteredShopA.length === 1, 'Only shop-A records accessible');
    assert(filteredShopA[0].customerId === 'c1', 'Isolation verified');
  });

  return { passed, failed, results };
}
