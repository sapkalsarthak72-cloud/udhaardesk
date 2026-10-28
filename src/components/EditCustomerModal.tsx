/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Edit2, AlertCircle, Phone, MapPin, User, FileText } from 'lucide-react';
import { Customer } from '../types';
import { normalizeIndianPhone } from '../utils/formatters';

interface EditCustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onUpdateCustomer: (customerId: string, updates: Partial<Customer>) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  customer,
  onClose,
  onUpdateCustomer,
}) => {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address || '');
  const [notes, setNotes] = useState(customer.notes || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Grahak ka naam zaroori hai.');
      return;
    }

    const { valid, fullPhone } = normalizeIndianPhone(phone);
    if (!valid) {
      setErrorMsg('Valid 10-digit mobile number daalein.');
      return;
    }

    try {
      onUpdateCustomer(customer.customerId, {
        name: name.trim(),
        phone: fullPhone,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update customer.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Grahak Details Badlein</h3>
              <p className="text-[11px] text-slate-500">Customer profile update karein</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">Naam *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">Mobile Number *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">Pata (Address)</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
