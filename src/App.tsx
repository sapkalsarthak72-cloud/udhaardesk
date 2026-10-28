/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ActiveTab, BottomNav } from './components/BottomNav';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { CustomerKhataView } from './components/CustomerKhataView';
import { RemindersView } from './components/RemindersView';
import { ReportsView } from './components/ReportsView';
import { AddUdhaarModal } from './components/AddUdhaarModal';
import { ReceivePaymentModal } from './components/ReceivePaymentModal';
import { AddCustomerModal } from './components/AddCustomerModal';
import { EditCustomerModal } from './components/EditCustomerModal';
import { UpiModal } from './components/UpiModal';
import { ShopProfileModal } from './components/ShopProfileModal';
import { AuthModal } from './components/AuthModal';
import { TestResultsModal } from './components/TestResultsModal';
import { GoogleDriveBackupModal } from './components/GoogleDriveBackupModal';

import { khataStore } from './services/storage';
import { Customer, Shop, Transaction } from './types';
import { computeDashboardStats } from './utils/ledger';

export default function App() {
  // Store reactive states
  const [shop, setShop] = useState<Shop>(khataStore.getShop());
  const [customers, setCustomers] = useState<Customer[]>(khataStore.getCustomers());
  const [transactions, setTransactions] = useState<Transaction[]>(khataStore.getTransactions());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(khataStore.getIsDemoMode());

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modals state
  const [showAddUdhaar, setShowAddUdhaar] = useState(false);
  const [addUdhaarInitialCustId, setAddUdhaarInitialCustId] = useState<string | undefined>();

  const [showReceivePayment, setShowReceivePayment] = useState(false);
  const [receivePaymentInitialCustId, setReceivePaymentInitialCustId] = useState<string | undefined>();

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiModalCustomer, setUpiModalCustomer] = useState<Customer | undefined>();
  const [upiModalAmountPaise, setUpiModalAmountPaise] = useState<number>(0);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);

  // Subscribe to reactive store changes
  useEffect(() => {
    const unsubscribe = khataStore.subscribe(() => {
      setShop(khataStore.getShop());
      setCustomers(khataStore.getCustomers());
      setTransactions(khataStore.getTransactions());
      setIsDemoMode(khataStore.getIsDemoMode());
    });
    return () => unsubscribe();
  }, []);

  // Compute live dashboard metrics strictly from records
  const dashboardStats = useMemo(() => {
    return computeDashboardStats(customers, transactions);
  }, [customers, transactions]);

  // Selected customer for Khata view
  const currentSelectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.customerId === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  // Handlers
  const handleOpenAddUdhaar = (custId?: string) => {
    setAddUdhaarInitialCustId(custId);
    setShowAddUdhaar(true);
  };

  const handleOpenReceivePayment = (custId?: string) => {
    setReceivePaymentInitialCustId(custId);
    setShowReceivePayment(true);
  };

  const handleOpenUpiModal = (custId?: string, amountPaise = 0) => {
    const cust = custId ? customers.find((c) => c.customerId === custId) : undefined;
    setUpiModalCustomer(cust);
    setUpiModalAmountPaise(amountPaise);
    setShowUpiModal(true);
  };

  const handleSaveUdhaar = (
    txData: Omit<Transaction, 'transactionId' | 'shopId' | 'createdAt' | 'createdBy' | 'status'>
  ) => {
    return khataStore.addTransaction(txData);
  };

  const handleRecordPayment = (
    txData: Omit<Transaction, 'transactionId' | 'shopId' | 'createdAt' | 'createdBy' | 'status'>
  ) => {
    return khataStore.addTransaction(txData);
  };

  const handleAddCustomerInline = (name: string, phone: string): Customer => {
    return khataStore.addCustomer({ name, phone });
  };

  const handleAddCustomer = (data: { name: string; phone: string; address?: string; notes?: string }) => {
    khataStore.addCustomer(data);
  };

  const handleUpdateCustomer = (customerId: string, updates: Partial<Customer>) => {
    khataStore.updateCustomer(customerId, updates);
  };

  const handleArchiveCustomer = (customerId: string) => {
    khataStore.archiveCustomer(customerId);
  };

  const handleReverseTransaction = (transactionId: string) => {
    khataStore.reverseTransaction(transactionId, 'Reversed by shop owner via Khata view');
  };

  const handleUpdateShop = (updates: Partial<Shop>) => {
    khataStore.updateShopProfile(updates);
  };

  const handleResetDemo = () => {
    khataStore.resetToDemoData();
    setSelectedCustomerId(null);
  };

  const handleRegisterShop = (data: {
    ownerName: string;
    email: string;
    phone: string;
    shopName: string;
    address: string;
  }) => {
    khataStore.updateShopProfile({
      ownerName: data.ownerName,
      shopName: data.shopName,
      phone: data.phone,
      address: data.address,
      ownerUid: `owner-${Date.now()}`,
    });
    khataStore.setDemoMode(false);
  };

  const handleLogin = (email: string) => {
    // Authenticated shop owner session
    khataStore.setDemoMode(false);
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navigation */}
      <Navbar
        shop={shop}
        isDemoMode={isDemoMode}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onResetDemo={handleResetDemo}
        onRunTests={() => setShowTestModal(true)}
        onOpenDriveBackup={() => setShowDriveModal(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop & Tablet Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            setSelectedCustomerId(null);
          }}
          onOpenAddUdhaar={() => handleOpenAddUdhaar()}
          onOpenReceivePayment={() => handleOpenReceivePayment()}
          onOpenUpiModal={() => handleOpenUpiModal()}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenDriveBackup={() => setShowDriveModal(true)}
          shop={shop}
          overdueCount={dashboardStats.overdueCustomersCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* If a customer is selected, render individual Khata */}
          {currentSelectedCustomer ? (
            <CustomerKhataView
              customer={currentSelectedCustomer}
              shop={shop}
              transactions={transactions}
              onBack={() => setSelectedCustomerId(null)}
              onOpenAddUdhaarForCustomer={(cid) => handleOpenAddUdhaar(cid)}
              onOpenReceivePaymentForCustomer={(cid) => handleOpenReceivePayment(cid)}
              onOpenUpiModalForCustomer={(cid, amt) => handleOpenUpiModal(cid, amt)}
              onEditCustomer={(c) => setEditingCustomer(c)}
              onArchiveCustomer={handleArchiveCustomer}
              onReverseTransaction={handleReverseTransaction}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  stats={dashboardStats}
                  shop={shop}
                  customers={customers}
                  allTransactions={transactions}
                  onOpenAddUdhaar={() => handleOpenAddUdhaar()}
                  onOpenReceivePayment={() => handleOpenReceivePayment()}
                  onOpenAddCustomer={() => setShowAddCustomer(true)}
                  onGoToReminders={() => setActiveTab('reminders')}
                  onGoToReports={() => setActiveTab('reports')}
                  onSelectCustomer={handleSelectCustomer}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersView
                  customers={customers}
                  transactions={transactions}
                  onSelectCustomer={handleSelectCustomer}
                  onOpenAddCustomer={() => setShowAddCustomer(true)}
                />
              )}

              {activeTab === 'reminders' && (
                <RemindersView
                  customers={customers}
                  transactions={transactions}
                  shop={shop}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  stats={dashboardStats}
                  customers={customers}
                  transactions={transactions}
                  shop={shop}
                  onSelectCustomer={handleSelectCustomer}
                  onOpenDriveBackup={() => setShowDriveModal(true)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Thumb Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          setSelectedCustomerId(null);
        }}
        onOpenAddUdhaar={() => handleOpenAddUdhaar()}
        overdueCount={dashboardStats.overdueCustomersCount}
      />

      {/* Modals & Dialogs */}
      {showAddUdhaar && (
        <AddUdhaarModal
          customers={customers}
          shop={shop}
          initialCustomerId={addUdhaarInitialCustId}
          onClose={() => {
            setShowAddUdhaar(false);
            setAddUdhaarInitialCustId(undefined);
          }}
          onSaveUdhaar={handleSaveUdhaar}
          onAddNewCustomerInline={handleAddCustomerInline}
          allTransactions={transactions}
        />
      )}

      {showReceivePayment && (
        <ReceivePaymentModal
          customers={customers}
          shop={shop}
          initialCustomerId={receivePaymentInitialCustId}
          onClose={() => {
            setShowReceivePayment(false);
            setReceivePaymentInitialCustId(undefined);
          }}
          onRecordPayment={handleRecordPayment}
          allTransactions={transactions}
        />
      )}

      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onAddCustomer={handleAddCustomer}
          existingCustomers={customers}
        />
      )}

      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onUpdateCustomer={handleUpdateCustomer}
        />
      )}

      {showUpiModal && (
        <UpiModal
          shop={shop}
          customer={upiModalCustomer}
          amountPaise={upiModalAmountPaise}
          onClose={() => {
            setShowUpiModal(false);
            setUpiModalCustomer(undefined);
            setUpiModalAmountPaise(0);
          }}
          onConfirmPaymentReceived={(cid, amt) => {
            handleOpenReceivePayment(cid);
          }}
        />
      )}

      {showProfileModal && (
        <ShopProfileModal
          shop={shop}
          isDemoMode={isDemoMode}
          onClose={() => setShowProfileModal(false)}
          onUpdateShop={handleUpdateShop}
          onResetDemo={handleResetDemo}
          onOpenAuth={() => {
            setShowProfileModal(false);
            setShowAuthModal(true);
          }}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onRegisterShop={handleRegisterShop}
          onLogin={handleLogin}
          currentShop={shop}
        />
      )}

      {showTestModal && (
        <TestResultsModal onClose={() => setShowTestModal(false)} />
      )}

      {showDriveModal && (
        <GoogleDriveBackupModal
          shop={shop}
          customers={customers}
          transactions={transactions}
          onClose={() => setShowDriveModal(false)}
          onRestoreData={(backupData) => {
            khataStore.restoreBackupData(backupData);
          }}
        />
      )}
    </div>
  );
}
