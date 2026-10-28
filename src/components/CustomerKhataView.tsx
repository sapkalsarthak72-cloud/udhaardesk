/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Share2,
  PlusCircle,
  ArrowDownLeft,
  QrCode,
  FileText,
  Clock,
  RotateCcw,
  Archive,
  Edit2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Customer, Shop, Transaction } from '../types';
import { formatDateIndian, formatRupees } from '../utils/formatters';
import { calculateCustomerBalance, calculateOldestUnpaidDate } from '../utils/ledger';
import {
  buildWhatsAppLink,
  generateKhataStatementMessage,
  generateUdhaarBillMessage,
  generatePaymentReceiptMessage,
} from '../utils/whatsapp';

interface CustomerKhataViewProps {
  customer: Customer;
  shop: Shop;
  transactions: Transaction[];
  onBack: () => void;
  onOpenAddUdhaarForCustomer: (customerId: string) => void;
  onOpenReceivePaymentForCustomer: (customerId: string) => void;
  onOpenUpiModalForCustomer: (customerId: string, amountPaise: number) => void;
  onEditCustomer: (customer: Customer) => void;
  onArchiveCustomer: (customerId: string) => void;
  onReverseTransaction: (transactionId: string) => void;
}

type DateFilter = 'all' | '7days' | '30days' | 'this_month';

export const CustomerKhataView: React.FC<CustomerKhataViewProps> = ({
  customer,
  shop,
  transactions,
  onBack,
  onOpenAddUdhaarForCustomer,
  onOpenReceivePaymentForCustomer,
  onOpenUpiModalForCustomer,
  onEditCustomer,
  onArchiveCustomer,
  onReverseTransaction,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [reverseModalTx, setReverseModalTx] = useState<Transaction | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // All transactions for this customer
  const customerAllTx = useMemo(() => {
    return transactions.filter((t) => t.customerId === customer.customerId);
  }, [transactions, customer.customerId]);

  // Derived balance strictly from transactions ledger
  const { totalCreditPaise, totalPaymentPaise, outstandingBalancePaise } = useMemo(() => {
    return calculateCustomerBalance(customer.customerId, transactions);
  }, [customer.customerId, transactions]);

  const { oldestUnpaidDate, daysPending } = useMemo(() => {
    return outstandingBalancePaise > 0
      ? calculateOldestUnpaidDate(customer.customerId, transactions)
      : { oldestUnpaidDate: null, daysPending: 0 };
  }, [customer.customerId, transactions, outstandingBalancePaise]);

  // Filtered transactions for display
  const filteredTx = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return customerAllTx
      .filter((t) => {
        if (dateFilter === 'all') return true;
        const txDate = new Date(t.transactionDate);

        if (dateFilter === '7days') {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return txDate >= sevenDaysAgo;
        }

        if (dateFilter === '30days') {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return txDate >= thirtyDaysAgo;
        }

        if (dateFilter === 'this_month') {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          return txDate >= startOfMonth;
        }

        return true;
      })
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [customerAllTx, dateFilter]);

  // Share Full Khata on WhatsApp
  const handleShareKhata = () => {
    const message = generateKhataStatementMessage(
      shop,
      customer,
      customerAllTx,
      outstandingBalancePaise
    );
    const waLink = buildWhatsAppLink(customer.phone, message);
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  // Share single transaction receipt / bill
  const handleShareSingleTx = (tx: Transaction) => {
    let message = '';
    if (tx.type === 'CREDIT') {
      message = generateUdhaarBillMessage(shop, customer, tx, outstandingBalancePaise);
    } else {
      message = generatePaymentReceiptMessage(shop, customer, tx, outstandingBalancePaise);
    }
    const waLink = buildWhatsAppLink(customer.phone, message);
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmReverse = () => {
    if (!reverseModalTx) return;
    if (!reverseReason.trim()) {
      setErrorMsg('Reversal ka kaaran (reason) likhna zaroori hai.');
      return;
    }
    try {
      onReverseTransaction(reverseModalTx.transactionId);
      setReverseModalTx(null);
      setReverseReason('');
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reverse transaction.');
    }
  };

  const handleArchive = () => {
    if (outstandingBalancePaise > 0) {
      alert(`Customer ka ₹${(outstandingBalancePaise / 100).toFixed(2)} udhaar baaki hai. Pehle payment clear karein!`);
      return;
    }
    if (window.confirm(`Kya aap sach me ${customer.name} ko archive karna chahte hain? Inka hisaab safe rahega.`)) {
      onArchiveCustomer(customer.customerId);
      onBack();
    }
  };

  const isOverdue = outstandingBalancePaise > 0 && daysPending > 30;

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Wapas (Back)</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditCustomer(customer)}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleArchive}
            className="p-2 text-slate-500 hover:text-red-600 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Archive Customer"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xl shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">{customer.name}</h1>
                {isOverdue && (
                  <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded">
                    30+ DIN OVERDUE
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-1 font-semibold text-slate-700 hover:text-indigo-600"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.phone}</span>
                </a>
                {customer.address && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions inside Profile */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleShareKhata}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Khata</span>
            </button>
            {outstandingBalancePaise > 0 && shop.upiId && (
              <button
                onClick={() => onOpenUpiModalForCustomer(customer.customerId, outstandingBalancePaise)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>UPI QR</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Summary Metrics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 bg-red-50/60 rounded-xl border border-red-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-red-700">Total Udhaar</div>
            <div className="text-base sm:text-xl font-extrabold text-red-600 font-mono tabular-nums mt-0.5">
              {formatRupees(totalCreditPaise)}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Total Jama (Paid)</div>
            <div className="text-base sm:text-xl font-extrabold text-emerald-600 font-mono tabular-nums mt-0.5">
              {formatRupees(totalPaymentPaise)}
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              isOverdue
                ? 'bg-red-100/70 border-red-200'
                : outstandingBalancePaise > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Net Baaki (Due)</div>
            <div
              className={`text-base sm:text-xl font-black font-mono tabular-nums mt-0.5 ${
                isOverdue
                  ? 'text-red-700'
                  : outstandingBalancePaise > 0
                  ? 'text-amber-700'
                  : 'text-slate-800'
              }`}
            >
              {formatRupees(outstandingBalancePaise)}
            </div>
            {daysPending > 0 && (
              <div className="text-[10px] text-red-600 font-bold mt-0.5 flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                <span>{daysPending} din se baaki</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Transaction Action Strip */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onOpenAddUdhaarForCustomer(customer.customerId)}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Naya Udhaar Diya</span>
        </button>

        <button
          onClick={() => onOpenReceivePaymentForCustomer(customer.customerId)}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer"
        >
          <ArrowDownLeft className="w-5 h-5" />
          <span>Payment Mila (Jama)</span>
        </button>
      </div>

      {/* Khata Ledger Table & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Digital Bahi-Khata (Ledger History)</h3>
            <p className="text-xs text-slate-500">Append-only chronological records</p>
          </div>

          {/* Date Range Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                dateFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Sabhi
            </button>
            <button
              onClick={() => setDateFilter('7days')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                dateFilter === '7days' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              7 Din
            </button>
            <button
              onClick={() => setDateFilter('30days')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                dateFilter === '30days' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              30 Din
            </button>
            <button
              onClick={() => setDateFilter('this_month')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                dateFilter === 'this_month' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Iss Mahine
            </button>
          </div>
        </div>

        {/* Ledger List */}
        {filteredTx.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Iss time frame me koi transaction nahi mila.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTx.map((tx) => {
              const isCredit = tx.type === 'CREDIT';
              const isReversed = tx.status === 'REVERSED';

              return (
                <div
                  key={tx.transactionId}
                  className={`p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isReversed ? 'opacity-50 bg-slate-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold mt-0.5 ${
                        isReversed
                          ? 'bg-slate-100 text-slate-400'
                          : isCredit
                          ? 'bg-red-50 text-red-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {isCredit ? <PlusCircle className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-500">
                          {formatDateIndian(tx.transactionDate)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isReversed
                              ? 'bg-slate-200 text-slate-600'
                              : isCredit
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isReversed ? 'REVERSED' : isCredit ? 'UDHAAR' : 'JAMA'}
                        </span>
                        {tx.paymentMethod && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {tx.paymentMethod}
                          </span>
                        )}
                      </div>

                      {/* Items breakdown */}
                      {tx.items && tx.items.length > 0 && (
                        <div className="text-xs font-medium text-slate-800 mt-1">
                          {tx.items.map((it, idx) => (
                            <span key={idx} className="mr-2">
                              • {it.name} {it.quantity && <span className="text-slate-500">({it.quantity})</span>}
                            </span>
                          ))}
                        </div>
                      )}

                      {tx.notes && (
                        <div className="text-[11px] text-slate-500 mt-0.5 italic">
                          Note: {tx.notes}
                        </div>
                      )}
                      {tx.referenceNumber && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Ref: {tx.referenceNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div
                        className={`text-base font-extrabold font-mono tabular-nums ${
                          isReversed
                            ? 'line-through text-slate-400'
                            : isCredit
                            ? 'text-red-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {isCredit ? `+ ${formatRupees(tx.amountPaise)}` : `- ${formatRupees(tx.amountPaise)}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isReversed && (
                        <>
                          {/* Share on WhatsApp */}
                          <button
                            onClick={() => handleShareSingleTx(tx)}
                            title="WhatsApp par bhejo"
                            className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Reversal / Correction Button */}
                          <button
                            onClick={() => {
                              setReverseModalTx(tx);
                              setReverseReason('');
                              setErrorMsg('');
                            }}
                            title="Galat entry cancel karein (Reverse)"
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Reversal Modal (Audit trail preserved) */}
      {reverseModalTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Transaction Cancel / Reverse Karein
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Hisaab ki suraksha ke liye financial records delete nahi kiye jaate. Yeh entry <strong>REVERSED</strong> mark hogi aur balance theek ho jayega.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                <span className="font-semibold text-slate-600">Transaction ID:</span> {reverseModalTx.transactionId}
              </div>
              <div>
                <span className="font-semibold text-slate-600">Rakam:</span> {formatRupees(reverseModalTx.amountPaise)} ({reverseModalTx.type})
              </div>
              <div>
                <span className="font-semibold text-slate-600">Date:</span> {formatDateIndian(reverseModalTx.transactionDate)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cancel karne ka kaaran (Reason) *
              </label>
              <input
                type="text"
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                placeholder="Jaise: Galat amount daala gaya tha / Duplicate entry"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              {errorMsg && <p className="text-[11px] text-red-600 font-semibold mt-1">{errorMsg}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReverseModalTx(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReverse}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
              >
                Haan, Reverse Karein
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
