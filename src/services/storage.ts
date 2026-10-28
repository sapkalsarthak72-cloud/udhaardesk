/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_CUSTOMERS, INITIAL_SHOP, INITIAL_TRANSACTIONS } from '../data/mockData';
import { AuditLog, Customer, Shop, Transaction } from '../types';
import { calculateCustomerBalance } from '../utils/ledger';

const STORAGE_KEYS = {
  SHOP: 'udhaardesk_shop_v1',
  CUSTOMERS: 'udhaardesk_customers_v1',
  TRANSACTIONS: 'udhaardesk_transactions_v1',
  AUDIT_LOGS: 'udhaardesk_audit_v1',
  IS_DEMO: 'udhaardesk_is_demo_mode_v1',
};

class KhataStorageService {
  private shop: Shop = INITIAL_SHOP;
  private customers: Customer[] = [];
  private transactions: Transaction[] = [];
  private auditLogs: AuditLog[] = [];
  private isDemoMode = true;
  private listeners: Set<() => void> = new Set();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    try {
      const storedShop = localStorage.getItem(STORAGE_KEYS.SHOP);
      const storedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const storedLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      const storedDemo = localStorage.getItem(STORAGE_KEYS.IS_DEMO);

      if (storedShop && storedCustomers && storedTx) {
        this.shop = JSON.parse(storedShop);
        this.customers = JSON.parse(storedCustomers);
        this.transactions = JSON.parse(storedTx);
        this.auditLogs = storedLogs ? JSON.parse(storedLogs) : [];
        this.isDemoMode = storedDemo !== 'false';
      } else {
        // Load default seed demo records
        this.resetToDemoData(false);
      }
    } catch (e) {
      console.error('Error loading stored khata records, resetting to seed:', e);
      this.resetToDemoData(false);
    }
    this.initialized = true;
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SHOP, JSON.stringify(this.shop));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(this.customers));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEYS.IS_DEMO, String(this.isDemoMode));
    } catch (e) {
      console.error('Error saving khata records to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('KhataStorage listener error:', err);
      }
    }
  }

  // --- GETTERS ---

  public getShop(): Shop {
    return { ...this.shop };
  }

  public getCustomers(includeArchived = false): Customer[] {
    const list = includeArchived ? this.customers : this.customers.filter((c) => !c.archivedAt);
    // Enrich with cached balance from ledger
    return list.map((cust) => {
      const { outstandingBalancePaise } = calculateCustomerBalance(cust.customerId, this.transactions);
      return { ...cust, cachedBalancePaise: outstandingBalancePaise };
    });
  }

  public getCustomerById(customerId: string): Customer | undefined {
    const cust = this.customers.find((c) => c.customerId === customerId);
    if (!cust) return undefined;
    const { outstandingBalancePaise } = calculateCustomerBalance(cust.customerId, this.transactions);
    return { ...cust, cachedBalancePaise: outstandingBalancePaise };
  }

  public getTransactions(customerId?: string): Transaction[] {
    if (customerId) {
      return this.transactions.filter((t) => t.customerId === customerId);
    }
    return [...this.transactions];
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public getIsDemoMode(): boolean {
    return this.isDemoMode;
  }

  // --- ACTIONS ---

  public setDemoMode(isDemo: boolean) {
    this.isDemoMode = isDemo;
    this.persist();
  }

  public updateShopProfile(updates: Partial<Shop>): Shop {
    this.shop = {
      ...this.shop,
      ...updates,
    };
    this.logAudit('UPDATE_SHOP', 'SHOP', this.shop.shopId, { updates });
    this.persist();
    return this.getShop();
  }

  public addCustomer(data: Omit<Customer, 'customerId' | 'shopId' | 'createdAt' | 'archivedAt'>): Customer {
    // Check for duplicate phone number
    const normalizedPhone = data.phone.trim();
    const existing = this.customers.find(
      (c) => !c.archivedAt && c.phone.replace(/\D/g, '') === normalizedPhone.replace(/\D/g, '')
    );
    if (existing) {
      throw new Error(`Customer with mobile ${data.phone} already exists (${existing.name}).`);
    }

    const newCustomer: Customer = {
      ...data,
      customerId: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      shopId: this.shop.shopId,
      createdAt: new Date().toISOString(),
      archivedAt: null,
      cachedBalancePaise: 0,
    };

    this.customers.push(newCustomer);
    this.logAudit('ADD_CUSTOMER', 'CUSTOMER', newCustomer.customerId, { name: newCustomer.name, phone: newCustomer.phone });
    this.persist();
    return newCustomer;
  }

  public updateCustomer(customerId: string, updates: Partial<Customer>): Customer {
    const idx = this.customers.findIndex((c) => c.customerId === customerId);
    if (idx === -1) {
      throw new Error('Customer not found');
    }

    this.customers[idx] = {
      ...this.customers[idx],
      ...updates,
      customerId, // immutable
      shopId: this.customers[idx].shopId, // immutable
    };

    this.logAudit('UPDATE_CUSTOMER', 'CUSTOMER', customerId, { updates });
    this.persist();
    return this.getCustomerById(customerId)!;
  }

  /**
   * Safely archives a customer instead of silently deleting financial records.
   */
  public archiveCustomer(customerId: string, reason = 'Archived by owner'): boolean {
    const cust = this.customers.find((c) => c.customerId === customerId);
    if (!cust) return false;

    // Check if customer has outstanding dues
    const { outstandingBalancePaise } = calculateCustomerBalance(customerId, this.transactions);
    if (outstandingBalancePaise > 0) {
      throw new Error(`Cannot archive customer with unpaid udhaar of ₹${(outstandingBalancePaise / 100).toFixed(2)}. Please settle dues first.`);
    }

    cust.archivedAt = new Date().toISOString();
    this.logAudit('ARCHIVE_CUSTOMER', 'CUSTOMER', customerId, { reason, name: cust.name });
    this.persist();
    return true;
  }

  /**
   * Records a new transaction (UDHAAR credit or PAYMENT)
   */
  public addTransaction(
    params: Omit<Transaction, 'transactionId' | 'shopId' | 'createdAt' | 'createdBy' | 'status'>
  ): Transaction {
    if (params.amountPaise <= 0) {
      throw new Error('Amount must be greater than zero.');
    }

    const customer = this.customers.find((c) => c.customerId === params.customerId);
    if (!customer) {
      throw new Error('Invalid customer ID.');
    }

    // For payments, prevent negative outstanding balance unless verified
    if (params.type === 'PAYMENT') {
      const { outstandingBalancePaise } = calculateCustomerBalance(params.customerId, this.transactions);
      if (params.amountPaise > outstandingBalancePaise && outstandingBalancePaise >= 0) {
        // Warning: payment exceeds total debt
        console.warn(`Payment ₹${(params.amountPaise / 100).toFixed(2)} exceeds current balance ₹${(outstandingBalancePaise / 100).toFixed(2)}.`);
      }
    }

    const newTx: Transaction = {
      ...params,
      transactionId: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      shopId: this.shop.shopId,
      createdAt: new Date().toISOString(),
      createdBy: this.shop.ownerUid,
      status: 'COMPLETED',
    };

    this.transactions.push(newTx);
    this.logAudit('ADD_TRANSACTION', 'TRANSACTION', newTx.transactionId, {
      customerId: newTx.customerId,
      type: newTx.type,
      amountPaise: newTx.amountPaise,
    });

    this.persist();
    return newTx;
  }

  /**
   * Reverses an incorrect transaction with an explicit audit reason
   * (preserves immutable ledger auditability)
   */
  public reverseTransaction(transactionId: string, reason: string): Transaction {
    const tx = this.transactions.find((t) => t.transactionId === transactionId);
    if (!tx) {
      throw new Error('Transaction not found.');
    }
    if (tx.status === 'REVERSED') {
      throw new Error('Transaction has already been reversed.');
    }

    tx.status = 'REVERSED';
    tx.notes = tx.notes ? `${tx.notes} (REVERSED: ${reason})` : `REVERSED: ${reason}`;

    this.logAudit('REVERSE_TRANSACTION', 'TRANSACTION', transactionId, {
      reason,
      originalAmountPaise: tx.amountPaise,
      type: tx.type,
    });

    this.persist();
    return tx;
  }

  private logAudit(
    action: string,
    entityType: 'CUSTOMER' | 'TRANSACTION' | 'SHOP',
    entityId: string,
    details?: Record<string, unknown>
  ) {
    const log: AuditLog = {
      logId: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      shopId: this.shop.shopId,
      actorUid: this.shop.ownerUid,
      action,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      details,
    };
    this.auditLogs.unshift(log);
    // Keep max 200 logs
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
  }

  public resetToDemoData(notifyListeners = true) {
    this.shop = { ...INITIAL_SHOP };
    this.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    this.transactions = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
    this.auditLogs = [
      {
        logId: 'log-init-001',
        shopId: INITIAL_SHOP.shopId,
        actorUid: INITIAL_SHOP.ownerUid,
        action: 'RESET_DEMO_DATA',
        entityType: 'SHOP',
        entityId: INITIAL_SHOP.shopId,
        timestamp: new Date().toISOString(),
        details: { message: 'Initialized with realistic kirana store sample records' },
      },
    ];
    this.isDemoMode = true;
    if (notifyListeners) {
      this.persist();
    }
  }

  public restoreBackupData(payload: {
    shop?: Shop;
    customers: Customer[];
    transactions: Transaction[];
  }) {
    if (payload.shop) {
      this.shop = { ...this.shop, ...payload.shop };
    }
    this.customers = [...payload.customers];
    this.transactions = [...payload.transactions];
    this.logAudit('RESTORE_GOOGLE_DRIVE_BACKUP', 'SHOP', this.shop.shopId, {
      restoredCustomersCount: payload.customers.length,
      restoredTransactionsCount: payload.transactions.length,
    });
    this.persist();
  }

  public clearAllData() {
    this.customers = [];
    this.transactions = [];
    this.auditLogs = [];
    this.persist();
  }
}

export const khataStore = new KhataStorageService();
