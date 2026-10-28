/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Bell,
  Clock,
  Phone,
  Share2,
  CheckSquare,
  Square,
  AlertTriangle,
  MessageSquare,
  X,
  ExternalLink,
} from 'lucide-react';
import { Customer, CustomerKhataSummary, Shop, Transaction } from '../types';
import { formatDateIndian, formatRupees } from '../utils/formatters';
import { buildCustomerKhataSummaries, getAgingBucket } from '../utils/ledger';
import { buildWhatsAppLink, generatePaymentReminderMessage } from '../utils/whatsapp';

interface RemindersViewProps {
  customers: Customer[];
  transactions: Transaction[];
  shop: Shop;
}

type AgingTab = 'all_overdue' | '0_to_7' | '8_to_15' | '16_to_30' | 'more_than_30';

export const RemindersView: React.FC<RemindersViewProps> = ({
  customers,
  transactions,
  shop,
}) => {
  const [activeBucket, setActiveBucket] = useState<AgingTab>('all_overdue');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());

  // Review Drawer State
  const [reviewCustomer, setReviewCustomer] = useState<CustomerKhataSummary | null>(null);

  // Compute summaries strictly from transaction ledger
  const allSummaries = useMemo(() => {
    return buildCustomerKhataSummaries(customers, transactions);
  }, [customers, transactions]);

  // Exclude zero-balance customers! Only customers with outstanding balance > 0
  const customersWithDues = useMemo(() => {
    return allSummaries.filter((s) => s.outstandingBalancePaise > 0);
  }, [allSummaries]);

  // Filter by aging bucket
  const filteredList = useMemo(() => {
    return customersWithDues.filter((s) => {
      const bucket = getAgingBucket(s.daysPending);
      if (activeBucket === 'all_overdue') return true;
      return bucket === activeBucket;
    });
  }, [customersWithDues, activeBucket]);

  const toggleSelectCustomer = (customerId: string) => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedCustomerIds.size === filteredList.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(filteredList.map((s) => s.customer.customerId)));
    }
  };

  const handleOpenSingleReminder = (summary: CustomerKhataSummary) => {
    setReviewCustomer(summary);
  };

  const handleSendViaWhatsApp = (summary: CustomerKhataSummary) => {
    const msg = generatePaymentReminderMessage(
      shop,
      summary.customer,
      summary.outstandingBalancePaise,
      summary.daysPending
    );
    const waLink = buildWhatsAppLink(summary.customer.phone, msg);
    window.open(waLink, '_blank', 'noopener,noreferrer');
    setReviewCustomer(null);
  };

  // Dispatch batch reminders step by step
  const handleBatchDispatch = () => {
    const selectedSummaries = filteredList.filter((s) =>
      selectedCustomerIds.has(s.customer.customerId)
    );
    if (selectedSummaries.length === 0) return;

    // Show first selected in review drawer
    setReviewCustomer(selectedSummaries[0]);
  };

  const overdue30PlusCount = useMemo(() => {
    return customersWithDues.filter((s) => s.daysPending > 30).length;
  }, [customersWithDues]);

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Payment Yaad Dilao (Smart Reminders)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Grahako ko polite Hinglish WhatsApp payment reminder bhejein
          </p>
        </div>

        {selectedCustomerIds.size > 0 && (
          <button
            onClick={handleBatchDispatch}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send Selected Reminders ({selectedCustomerIds.size})</span>
          </button>
        )}
      </div>

      {/* Overdue Warning Pill (if >30 days dues exist) */}
      {overdue30PlusCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-xs text-red-900">
            <strong>{overdue30PlusCount} grahak</strong> 30 dino se puraane udhaar ke sath hain. Dues red alert me mark kiye gaye hain.
          </div>
        </div>
      )}

      {/* Aging Category Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800">Udhaar Kitne Din Puraana Hai:</span>
          {filteredList.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              {selectedCustomerIds.size === filteredList.length ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>Select All ({filteredList.length})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => setActiveBucket('all_overdue')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeBucket === 'all_overdue'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">Sabhi Pending</div>
            <div className="text-base font-extrabold mt-0.5">{customersWithDues.length}</div>
          </button>

          <button
            onClick={() => setActiveBucket('0_to_7')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeBucket === '0_to_7'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">0–7 Din (Recent)</div>
            <div className="text-base font-extrabold mt-0.5">
              {customersWithDues.filter((s) => getAgingBucket(s.daysPending) === '0_to_7').length}
            </div>
          </button>

          <button
            onClick={() => setActiveBucket('8_to_15')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeBucket === '8_to_15'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">8–15 Din</div>
            <div className="text-base font-extrabold mt-0.5">
              {customersWithDues.filter((s) => getAgingBucket(s.daysPending) === '8_to_15').length}
            </div>
          </button>

          <button
            onClick={() => setActiveBucket('16_to_30')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeBucket === '16_to_30'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">16–30 Din</div>
            <div className="text-base font-extrabold mt-0.5">
              {customersWithDues.filter((s) => getAgingBucket(s.daysPending) === '16_to_30').length}
            </div>
          </button>

          <button
            onClick={() => setActiveBucket('more_than_30')}
            className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeBucket === 'more_than_30'
                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            <div className="text-[11px] font-black uppercase tracking-wider">30+ Din (Overdue)</div>
            <div className="text-base font-extrabold mt-0.5">{overdue30PlusCount}</div>
          </button>
        </div>
      </div>

      {/* Customer Reminder Cards List */}
      {filteredList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Iss category me koi baaki nahi hai</h3>
          <p className="text-xs text-slate-500 mt-1">
            Zero-balance grahako ko reminders nahi bheje jaate.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredList.map((item) => {
            const isOverdue = item.daysPending > 30;
            const isSelected = selectedCustomerIds.has(item.customer.customerId);

            return (
              <div
                key={item.customer.customerId}
                className={`bg-white border rounded-2xl p-4 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isOverdue ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Select Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelectCustomer(item.customer.customerId)}
                    className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {item.customer.name}
                      </h3>
                      {isOverdue && (
                        <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded shrink-0">
                          30+ DIN OVERDUE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.customer.phone}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Oldest unpaid: {formatDateIndian(item.oldestUnpaidDate)}</span>
                      </span>
                      <span>·</span>
                      <span
                        className={`font-bold ${isOverdue ? 'text-red-600' : 'text-amber-700'}`}
                      >
                        {item.daysPending} din se baaki
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div
                      className={`text-base sm:text-lg font-black font-mono tabular-nums ${
                        isOverdue ? 'text-red-600' : 'text-amber-600'
                      }`}
                    >
                      {formatRupees(item.outstandingBalancePaise)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">Udhaar Rakam</div>
                  </div>

                  <button
                    onClick={() => handleOpenSingleReminder(item)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Send Reminder</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Drawer / Modal before WhatsApp dispatch */}
      {reviewCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">WhatsApp Reminder Review</h3>
                  <p className="text-[11px] text-slate-500">Bhejne se pehle message check karein</p>
                </div>
              </div>
              <button
                onClick={() => setReviewCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Grahak:</span>
                <span className="font-bold text-slate-900">{reviewCustomer.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-slate-800">{reviewCustomer.customer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Udhaar Rakam:</span>
                <span className="font-black text-red-600 font-mono">
                  {formatRupees(reviewCustomer.outstandingBalancePaise)}
                </span>
              </div>
            </div>

            {/* Message Preview */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                Message Preview (WhatsApp par yeh jayega):
              </label>
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-mono whitespace-pre-wrap text-slate-800 max-h-48 overflow-y-auto leading-relaxed">
                {generatePaymentReminderMessage(
                  shop,
                  reviewCustomer.customer,
                  reviewCustomer.outstandingBalancePaise,
                  reviewCustomer.daysPending
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReviewCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendViaWhatsApp(reviewCustomer)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>WhatsApp Kholein & Bhejein</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
