/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Phone, MapPin, User, FileText } from 'lucide-react';
import { Customer } from '../types';
import { normalizeIndianPhone } from '../utils/formatters';

interface AddCustomerModalProps {
  onClose: () => void;
  onAddCustomer: (data: { name: string; phone: string; address?: string; notes?: string }) => void;
  existingCustomers: Customer[];
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  onClose,
  onAddCustomer,
  existingCustomers,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Grahak ka naam zaroori hai.');
      return;
    }

    const { valid, fullPhone, displayPhone } = normalizeIndianPhone(phone);
    if (!valid) {
      setErrorMsg('Kripya 10-digit valid Indian mobile number daalein.');
      return;
    }

    // Check for duplicate phone
    const duplicate = existingCustomers.find(
      (c) => !c.archivedAt && c.phone.replace(/\D/g, '') === displayPhone
    );
    if (duplicate) {
      setErrorMsg(`Yeh mobile number pehle se ${duplicate.name} ke naam par darj hai.`);
      return;
    }

    try {
      onAddCustomer({
        name: name.trim(),
        phone: fullPhone,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add customer.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Naya Grahak Jodein</h2>
              <p className="text-xs text-slate-500">Khata book me naya customer record banayein</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Grahak ka Naam (Customer Name) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jaise: Santosh Deshmukh"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Mobile Number (WhatsApp) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              WhatsApp bills aur reminders isi number par bheje jayenge.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Pata (Address - Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ghar / Dukaan ka pata..."
                rows={2}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jaise: Monthly ration customer"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Customer Save Karein
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
