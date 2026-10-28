/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ArrowDownLeft, CheckCircle2, AlertCircle, Share2, Wallet } from 'lucide-react';
import { Customer, PaymentMethod, Shop, Transaction } from '../types';
import { formatRupees, getTodayDateString, rupeesToPaise } from '../utils/formatters';
import { buildWhatsAppLink, generatePaymentReceiptMessage } from '../utils/whatsapp';
import { calculateCustomerBalance } from '../utils/ledger';

interface ReceivePaymentModalProps {
  customers: Customer[];
  shop: Shop;
  initialCustomerId?: string;
  onClose: () => void;
  onRecordPayment: (
    data: Omit<Transaction, 'transactionId' | 'shopId' | 'createdAt' | 'createdBy' | 'status'>
  ) => Transaction;
  allTransactions: Transaction[];
}

export const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({
  customers,
  shop,
  initialCustomerId,
  onClose,
  onRecordPayment,
  allTransactions,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || (customers[0]?.customerId ?? '')
  );
  const [amountInput, setAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transactionDate, setTransactionDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Post-payment receipt view
  const [savedReceipt, setSavedReceipt] = useState<{
    tx: Transaction;
    customer: Customer;
    remainingPaise: number;
  } | null>(null);

  const selectedCustomer = customers.find((c) => c.customerId === selectedCustomerId);

  // Compute live current balance
  const currentBalancePaise = selectedCustomer
    ? calculateCustomerBalance(selectedCustomer.customerId, allTransactions).outstandingBalancePaise
    : 0;

  const handleSetFullPayment = () => {
    if (currentBalancePaise > 0) {
      setAmountInput((currentBalancePaise / 100).toFixed(2));
    }
  };

  const handleSetHalfPayment = () => {
    if (currentBalancePaise > 0) {
      setAmountInput((currentBalancePaise / 200).toFixed(2));
    }
  };

  const handleSubmit = (sendWhatsApp: boolean) => {
    if (isSubmitting) return;
    setErrorMsg('');

    if (!selectedCustomerId || !selectedCustomer) {
      setErrorMsg('Customer chunein.');
      return;
    }

    const paise = rupeesToPaise(amountInput);
    if (paise <= 0) {
      setErrorMsg('Rakam 0 se zyada honi chahiye.');
      return;
    }

    // Check if payment exceeds balance
    if (paise > currentBalancePaise && currentBalancePaise > 0) {
      const confirmExcess = window.confirm(
        `Dhyan dein: Yeh payment (₹${(paise / 100).toFixed(2)}) baaki udhaar (₹${(currentBalancePaise / 100).toFixed(2)}) se zyada hai. Kya aap confirm karna chahte hain?`
      );
      if (!confirmExcess) return;
    }

    setIsSubmitting(true);

    try {
      const newTx = onRecordPayment({
        customerId: selectedCustomerId,
        type: 'PAYMENT',
        amountPaise: paise,
        paymentMethod,
        transactionDate,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      const remainingPaise = Math.max(0, currentBalancePaise - paise);

      if (sendWhatsApp) {
        const message = generatePaymentReceiptMessage(shop, selectedCustomer, newTx, remainingPaise);
        const waLink = buildWhatsAppLink(selectedCustomer.phone, message);
        window.open(waLink, '_blank', 'noopener,noreferrer');
        onClose();
      } else {
        // Show in-app receipt
        setSavedReceipt({
          tx: newTx,
          customer: selectedCustomer,
          remainingPaise,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment record nahi ho saka.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payment Mila (Record Jama)</h2>
              <p className="text-xs text-slate-500">Customer se praapt hui rakam darj karein</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {savedReceipt ? (
            /* Success Receipt View */
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Payment Praapt Hua!</h3>
                <p className="text-xs text-slate-500 mt-0.5">Khata safalta-purvak update ho gaya</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Grahak:</span>
                  <span className="font-bold text-slate-900">{savedReceipt.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Praapt Rakam:</span>
                  <span className="font-black text-emerald-600 text-sm font-mono">
                    {formatRupees(savedReceipt.tx.amountPaise)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-semibold text-slate-800">{savedReceipt.tx.paymentMethod}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-600 font-bold">Bacha Hua Udhaar:</span>
                  <span className="font-extrabold text-slate-900 font-mono">
                    {formatRupees(savedReceipt.remainingPaise)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const msg = generatePaymentReceiptMessage(
                      shop,
                      savedReceipt.customer,
                      savedReceipt.tx,
                      savedReceipt.remainingPaise
                    );
                    const waLink = buildWhatsAppLink(savedReceipt.customer.phone, msg);
                    window.open(waLink, '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp Receipt Bhejo</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Theek Hai (Done)
                </button>
              </div>
            </div>
          ) : (
            /* Input Form View */
            <>
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Customer Select */}
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                  Grahak (Customer) *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.customerId} value={c.customerId}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>

                {/* Outstanding balance badge */}
                {selectedCustomer && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-600">Total Udhaar Baaki:</span>
                    <span className="font-extrabold text-red-600 font-mono text-sm">
                      {formatRupees(currentBalancePaise)}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">Mili Rakam (Amount in ₹) *</label>
                  {currentBalancePaise > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSetHalfPayment}
                        className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                      >
                        50% (Aadha)
                      </button>
                      <button
                        type="button"
                        onClick={handleSetFullPayment}
                        className="text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded cursor-pointer"
                      >
                        Full (Pura)
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 text-2xl font-black font-mono tabular-nums text-emerald-600 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    autoFocus
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                  Payment Method (Kiske zariye mila) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'UPI', 'BANK_TRANSFER'] as PaymentMethod[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMethod(mode)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                        paymentMethod === mode
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode === 'CASH' ? '💵 Cash' : mode === 'UPI' ? '📱 UPI' : '🏦 Bank Transfer'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Number (if UPI or Bank) */}
              {(paymentMethod === 'UPI' || paymentMethod === 'BANK_TRANSFER') && (
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">
                    Reference / UTR Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Jaise: UPI/402910..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              )}

              {/* Date & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Taarikh (Date) *</label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Note (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Koi jaankari..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Actions */}
        {!savedReceipt && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Save & WhatsApp Receipt</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Sirf Save Karein</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
