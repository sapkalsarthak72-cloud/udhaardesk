/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'hinglish' | 'hindi' | 'english';

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

export type TransactionType = 'CREDIT' | 'PAYMENT';

export type TransactionStatus = 'COMPLETED' | 'REVERSED';

export interface ItemLine {
  name: string;
  quantity?: string;
  pricePaise?: number;
}

export interface Shop {
  shopId: string;
  ownerUid: string;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  upiId: string;
  preferredLanguage: Language;
  createdAt: string;
  currencySymbol: string;
}

export interface Customer {
  customerId: string;
  shopId: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
  archivedAt?: string | null;
  // Cached calculated balance for quick search/sort (always validated against ledger)
  cachedBalancePaise?: number;
}

export interface Transaction {
  transactionId: string;
  shopId: string;
  customerId: string;
  type: TransactionType; // CREDIT (Udhaar diya) or PAYMENT (Paisa mila)
  amountPaise: number; // Stored in integer paise (e.g. ₹50.50 = 5050 paise)
  items?: ItemLine[];
  paymentMethod?: PaymentMethod;
  transactionDate: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  createdBy: string;
  referenceNumber?: string;
  notes?: string;
  status: TransactionStatus;
}

export interface AuditLog {
  logId: string;
  shopId: string;
  actorUid: string;
  action: string;
  entityType: 'CUSTOMER' | 'TRANSACTION' | 'SHOP';
  entityId: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface CustomerKhataSummary {
  customer: Customer;
  totalCreditPaise: number;
  totalPaymentPaise: number;
  outstandingBalancePaise: number;
  oldestUnpaidDate: string | null;
  daysPending: number;
  transactionsCount: number;
  lastTransactionDate: string | null;
}

export type AgingBucket = '0_to_7' | '8_to_15' | '16_to_30' | 'more_than_30';

export interface DashboardStats {
  totalOutstandingPaise: number;
  todayCollectionPaise: number;
  thisWeekCollectionPaise: number;
  thisMonthCollectionPaise: number;
  totalCustomersCount: number;
  activeUdhaarCustomersCount: number;
  overdueCustomersCount: number; // >30 days
  recentTransactions: Transaction[];
}
