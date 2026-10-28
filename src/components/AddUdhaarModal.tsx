/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, UserPlus, AlertCircle, ShoppingBag } from 'lucide-react';
import { Customer, ItemLine, Shop, Transaction } from '../types';
import { formatRupees, getTodayDateString, rupeesToPaise } from '../utils/formatters';
import { buildWhatsAppLink, generateUdhaarBillMessage } from '../utils/whatsapp';

interface AddUdhaarModalProps {
  customers: Customer[];
  shop: Shop;
  initialCustomerId?: string;
  onClose: () => void;
  onSaveUdhaar: (
    data: Omit<Transaction, 'transactionId' | 'shopId' | 'createdAt' | 'createdBy' | 'status'>
  ) => Transaction;
  onAddNewCustomerInline: (name: string, phone: string) => Customer;
  allTransactions: Transaction[];
}

const COMMON_KIRANA_ITEMS = [
  'Aashirvaad Atta',
  'Basmati Rice',
  'Fortune Tel',
  'Toor Dal',
  'Sugar (Cheeni)',
  'Tata Namak',
  'Chai Patti',
  'Amul Doodh',
  'Surf Excel',
  'Maggi',
];

export const AddUdhaarModal: React.FC<AddUdhaarModalProps> = ({
  customers,
  shop,
  initialCustomerId,
  onClose,
  onSaveUdhaar,
  onAddNewCustomerInline,
  allTransactions,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || (customers[0]?.customerId ?? '')
  );
  const [amountInput, setAmountInput] = useState('');
  const [transactionDate, setTransactionDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemLine[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');

  // Inline new customer mode
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Confirmation step & error handling
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedCustomer = customers.find((c) => c.customerId === selectedCustomerId);

  const handleAddItem = (itemName = newItemName, qty = newItemQty) => {
    if (!itemName.trim()) return;
    setItems((prev) => [...prev, { name: itemName.trim(), quantity: qty.trim() || undefined }]);
    setNewItemName('');
    setNewItemQty('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuickAddItem = (itemName: string) => {
    handleAddItem(itemName, '');
  };

  const validateForm = (): boolean => {
    setErrorMsg('');
    if (isAddingNewCustomer) {
      if (!newCustName.trim()) {
        setErrorMsg('Naye customer ka naam likhein.');
        return false;
      }
      if (!newCustPhone.trim() || newCustPhone.replace(/\D/g, '').length < 10) {
        setErrorMsg('10-digit mobile number likhein.');
        return false;
      }
    } else {
      if (!selectedCustomerId) {
        setErrorMsg('Kripya customer select karein.');
        return false;
      }
    }

    const paise = rupeesToPaise(amountInput);
    if (paise <= 0) {
      setErrorMsg('Rakam (Amount) 0 se zyada honi chahiye.');
      return false;
    }

    if (!transactionDate) {
      setErrorMsg('Date select karein.');
      return false;
    }

    return true;
  };

  const handleOpenConfirm = () => {
    if (validateForm()) {
      setShowConfirm(true);
    }
  };

  const executeSave = (sendWhatsApp: boolean) => {
    if (isSubmitting) return; // Prevent duplicate submission
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let targetCust = selectedCustomer;
      let targetCustId = selectedCustomerId;

      if (isAddingNewCustomer) {
        targetCust = onAddNewCustomerInline(newCustName.trim(), newCustPhone.trim());
        targetCustId = targetCust.customerId;
      }

      if (!targetCust) {
        throw new Error('Customer information missing.');
      }

      const paise = rupeesToPaise(amountInput);
      const newTx = onSaveUdhaar({
        customerId: targetCustId,
        type: 'CREDIT',
        amountPaise: paise,
        transactionDate,
        items: items.length > 0 ? items : undefined,
        notes: notes.trim() || undefined,
      });

      if (sendWhatsApp) {
        // Calculate newly expected total
        const prevBal = targetCust.cachedBalancePaise || 0;
        const newTotalBal = prevBal + paise;
        const message = generateUdhaarBillMessage(shop, targetCust, newTx, newTotalBal);
        const waLink = buildWhatsAppLink(targetCust.phone, message);
        window.open(waLink, '_blank', 'noopener,noreferrer');
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save udhaar.');
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Naya Udhaar Jodo (Add Credit)</h2>
              <p className="text-xs text-slate-500">Customer khata me udhaar darj karein</p>
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
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Selection or Inline Add */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">Grahak (Customer) *</label>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNewCustomer(!isAddingNewCustomer);
                  setErrorMsg('');
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAddingNewCustomer ? 'Existing Customer chunein' : '+ Naya Grahak Jodein'}</span>
              </button>
            </div>

            {isAddingNewCustomer ? (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Grahak ka Naam *</label>
                  <input
                    type="text"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="Jaise: Mukesh Kumar"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Mobile Number (10 digits) *</label>
                  <input
                    type="tel"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer font-medium"
              >
                {customers.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.name} ({c.phone}) {c.cachedBalancePaise ? `· Baaki: ${formatRupees(c.cachedBalancePaise)}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount in Rupees */}
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
              Udhaar Rakam (Amount in ₹) *
            </label>
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
                className="w-full pl-8 pr-4 py-3 text-2xl font-black font-mono tabular-nums text-red-600 bg-red-50/40 border border-red-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                autoFocus
              />
            </div>
          </div>

          {/* Common Kirana Item Suggestions */}
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
              Items Purchased (Saaman ki List)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {COMMON_KIRANA_ITEMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleQuickAddItem(item)}
                  className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  + {item}
                </button>
              ))}
            </div>

            {/* Custom Item Row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item ka naam..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
              <input
                type="text"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                placeholder="Qty (e.g. 2kg / 1L)"
                className="w-28 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddItem()}
                className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Added items list */}
            {items.length > 0 && (
              <div className="mt-2 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                    <span className="font-medium text-slate-800">
                      • {it.name} {it.quantity && <span className="text-slate-500">({it.quantity})</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 mb-1 block">Taarikh (Date) *</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 mb-1 block">Optional Note</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Koi zaroori baat..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleOpenConfirm}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Aage Badhein (Confirm)
          </button>
        </div>
      </div>

      {/* Confirmation Drawer */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Udhaar Entry Confirm Karein</h3>
              <p className="text-xs text-slate-500 mt-1">
                Kya aap yeh entry khata me darj karna chahte hain?
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Grahak:</span>
                <span className="font-bold text-slate-800">
                  {isAddingNewCustomer ? newCustName : selectedCustomer?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rakam:</span>
                <span className="font-extrabold text-red-600 text-sm font-mono">
                  {formatRupees(rupeesToPaise(amountInput))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Taarikh:</span>
                <span className="font-semibold text-slate-800">{transactionDate}</span>
              </div>
              {items.length > 0 && (
                <div className="pt-1 border-t border-slate-200 text-slate-600 text-[11px]">
                  <strong>Items:</strong> {items.map((i) => i.name).join(', ')}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => executeSave(true)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Save & WhatsApp Bill Bhejo</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => executeSave(false)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>Sirf Save Karein</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirm(false)}
                className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Badalna Hai (Edit)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
