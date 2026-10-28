/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgingBucket, Customer, CustomerKhataSummary, DashboardStats, Transaction } from '../types';
import { calculateDaysAgo, formatDateIndian, formatRupees } from './formatters';

/**
 * Calculates current outstanding balance for a customer strictly from transaction ledger.
 * CREDIT adds to balance, PAYMENT subtracts from balance.
 * Returns balance in paise.
 */
export function calculateCustomerBalance(
  customerId: string,
  transactions: Transaction[]
): {
  totalCreditPaise: number;
  totalPaymentPaise: number;
  outstandingBalancePaise: number;
} {
  const customerTx = transactions.filter(
    (t) => t.customerId === customerId && t.status === 'COMPLETED'
  );

  let totalCreditPaise = 0;
  let totalPaymentPaise = 0;

  for (const t of customerTx) {
    if (t.type === 'CREDIT') {
      totalCreditPaise += t.amountPaise;
    } else if (t.type === 'PAYMENT') {
      totalPaymentPaise += t.amountPaise;
    }
  }

  const outstandingBalancePaise = totalCreditPaise - totalPaymentPaise;
  return {
    totalCreditPaise,
    totalPaymentPaise,
    outstandingBalancePaise,
  };
}

/**
 * Calculates the oldest unpaid credit date using FIFO (First-In, First-Out) matching.
 * We subtract all payments in chronological order against the oldest unpaid credit entries.
 * The earliest credit entry that remains partially or fully unpaid is the oldest unpaid date.
 */
export function calculateOldestUnpaidDate(
  customerId: string,
  transactions: Transaction[]
): {
  oldestUnpaidDate: string | null;
  daysPending: number;
} {
  const customerTx = transactions
    .filter((t) => t.customerId === customerId && t.status === 'COMPLETED')
    .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

  let totalPayments = 0;
  for (const t of customerTx) {
    if (t.type === 'PAYMENT') {
      totalPayments += t.amountPaise;
    }
  }

  let remainingPayments = totalPayments;

  for (const t of customerTx) {
    if (t.type === 'CREDIT') {
      if (remainingPayments >= t.amountPaise) {
        remainingPayments -= t.amountPaise;
      } else {
        // This transaction is either partially or fully unpaid!
        const days = calculateDaysAgo(t.transactionDate);
        return {
          oldestUnpaidDate: t.transactionDate,
          daysPending: days,
        };
      }
    }
  }

  return {
    oldestUnpaidDate: null,
    daysPending: 0,
  };
}

/**
 * Categorizes days pending into the 4 required buckets:
 * 0–7 days, 8–15 days, 16–30 days, >30 days.
 */
export function getAgingBucket(days: number): AgingBucket {
  if (days <= 7) return '0_to_7';
  if (days <= 15) return '8_to_15';
  if (days <= 30) return '16_to_30';
  return 'more_than_30';
}

/**
 * Builds full summary for each customer
 */
export function buildCustomerKhataSummaries(
  customers: Customer[],
  transactions: Transaction[]
): CustomerKhataSummary[] {
  return customers
    .filter((c) => !c.archivedAt)
    .map((customer) => {
      const { totalCreditPaise, totalPaymentPaise, outstandingBalancePaise } =
        calculateCustomerBalance(customer.customerId, transactions);

      const customerTx = transactions.filter(
        (t) => t.customerId === customer.customerId && t.status === 'COMPLETED'
      );

      const { oldestUnpaidDate, daysPending } =
        outstandingBalancePaise > 0
          ? calculateOldestUnpaidDate(customer.customerId, transactions)
          : { oldestUnpaidDate: null, daysPending: 0 };

      const sortedByDate = [...customerTx].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );

      return {
        customer,
        totalCreditPaise,
        totalPaymentPaise,
        outstandingBalancePaise,
        oldestUnpaidDate,
        daysPending,
        transactionsCount: customerTx.length,
        lastTransactionDate: sortedByDate[0]?.transactionDate || null,
      };
    });
}

/**
 * Computes live dashboard metrics strictly from database records
 */
export function computeDashboardStats(
  customers: Customer[],
  transactions: Transaction[]
): DashboardStats {
  const activeCustomers = customers.filter((c) => !c.archivedAt);
  const activeCustomerIds = new Set(activeCustomers.map((c) => c.customerId));
  const validTx = transactions.filter(
    (t) => activeCustomerIds.has(t.customerId) && t.status === 'COMPLETED'
  );

  const summaries = buildCustomerKhataSummaries(activeCustomers, validTx);

  // Total Outstanding Udhaar
  let totalOutstandingPaise = 0;
  let overdueCustomersCount = 0;
  let activeUdhaarCustomersCount = 0;

  for (const s of summaries) {
    if (s.outstandingBalancePaise > 0) {
      totalOutstandingPaise += s.outstandingBalancePaise;
      activeUdhaarCustomersCount += 1;
      if (s.daysPending > 30) {
        overdueCustomersCount += 1;
      }
    }
  }

  // Today's Collection and This Week's Collection
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Start of current week (Monday)
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday is 0
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  // Start of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let todayCollectionPaise = 0;
  let thisWeekCollectionPaise = 0;
  let thisMonthCollectionPaise = 0;

  for (const t of validTx) {
    if (t.type === 'PAYMENT') {
      const txDate = new Date(t.transactionDate);
      if (t.transactionDate === todayStr) {
        todayCollectionPaise += t.amountPaise;
      }
      if (txDate >= startOfWeek) {
        thisWeekCollectionPaise += t.amountPaise;
      }
      if (txDate >= startOfMonth) {
        thisMonthCollectionPaise += t.amountPaise;
      }
    }
  }

  const recentTransactions = [...validTx]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return {
    totalOutstandingPaise,
    todayCollectionPaise,
    thisWeekCollectionPaise,
    thisMonthCollectionPaise,
    totalCustomersCount: activeCustomers.length,
    activeUdhaarCustomersCount,
    overdueCustomersCount,
    recentTransactions,
  };
}

/**
 * Generates CSV Export text for transactions
 */
export function exportTransactionsToCsv(
  transactions: Transaction[],
  customers: Customer[]
): string {
  const customerMap = new Map(customers.map((c) => [c.customerId, c]));

  const headers = [
    'Transaction ID',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Type',
    'Amount (INR)',
    'Payment Method',
    'Items Purchased',
    'Reference Number',
    'Notes',
    'Status',
  ];

  const rows = transactions.map((t) => {
    const cust = customerMap.get(t.customerId);
    const items = t.items?.map((i) => `${i.name}${i.quantity ? ` (${i.quantity})` : ''}`).join('; ') || '';
    const amountRs = (t.amountPaise / 100).toFixed(2);
    const typeLabel = t.type === 'CREDIT' ? 'UDHAAR (CREDIT)' : 'PAYMENT (JAMA)';

    return [
      t.transactionId,
      formatDateIndian(t.transactionDate),
      `"${(cust?.name || 'Unknown').replace(/"/g, '""')}"`,
      cust?.phone || '',
      typeLabel,
      amountRs,
      t.paymentMethod || '-',
      `"${items.replace(/"/g, '""')}"`,
      t.referenceNumber || '-',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.status,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
