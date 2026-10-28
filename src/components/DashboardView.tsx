/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Bell,
  Users,
  BarChart3,
  UserPlus,
  AlertTriangle,
  Calendar,
  Share2,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { Customer, DashboardStats, Shop, Transaction } from '../types';
import { formatDateIndian, formatRupees } from '../utils/formatters';
import { buildWhatsAppLink, generateUdhaarBillMessage, generatePaymentReceiptMessage } from '../utils/whatsapp';
import { calculateCustomerBalance } from '../utils/ledger';

interface DashboardViewProps {
  stats: DashboardStats;
  shop: Shop;
  customers: Customer[];
  allTransactions: Transaction[];
  onOpenAddUdhaar: () => void;
  onOpenReceivePayment: () => void;
  onOpenAddCustomer: () => void;
  onGoToReminders: () => void;
  onGoToReports: () => void;
  onSelectCustomer: (customerId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  shop,
  customers,
  allTransactions,
  onOpenAddUdhaar,
  onOpenReceivePayment,
  onOpenAddCustomer,
  onGoToReminders,
  onGoToReports,
  onSelectCustomer,
}) => {
  const customerMap = new Map(customers.map((c) => [c.customerId, c]));

  const handleShareTransactionWhatsApp = (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    const customer = customerMap.get(tx.customerId);
    if (!customer) return;

    const { outstandingBalancePaise } = calculateCustomerBalance(customer.customerId, allTransactions);

    let message = '';
    if (tx.type === 'CREDIT') {
      message = generateUdhaarBillMessage(shop, customer, tx, outstandingBalancePaise);
    } else {
      message = generatePaymentReceiptMessage(shop, customer, tx, outstandingBalancePaise);
    }

    const waLink = buildWhatsAppLink(customer.phone, message);
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
              Namaste, {shop.ownerName || 'Dukaandar'}! 🙏
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {shop.shopName}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Dukaan ka hisaab, ab ekdum aasaan! Aaj ka pura hisaab-kitaab live.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddUdhaar}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Naya Udhaar</span>
            </button>
            <button
              onClick={onOpenReceivePayment}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition-all cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Payment Mila</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Udhaar */}
        <div className="col-span-2 sm:col-span-1 bg-white border border-red-200/80 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">Total Udhaar</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 font-mono tabular-nums">
            {formatRupees(stats.totalOutstandingPaise)}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {stats.activeUdhaarCustomersCount} grahako ka baaki hai
          </p>
        </div>

        {/* 2. Today's Collection */}
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Aaj Mila (Today)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono tabular-nums">
            {formatRupees(stats.todayCollectionPaise)}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Aaj ka jama cash/UPI</p>
        </div>

        {/* 3. This Week's Collection */}
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Iss Hafte Mila</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono tabular-nums">
            {formatRupees(stats.thisWeekCollectionPaise)}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Current week recovery</p>
        </div>

        {/* 4 & 5. Overdue & Total Customers */}
        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Grahak & Overdue</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                {stats.totalCustomersCount}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Total Grahak</div>
            </div>
            <div className="text-right">
              <div
                className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums ${
                  stats.overdueCustomersCount > 0 ? 'text-red-600' : 'text-slate-700'
                }`}
              >
                {stats.overdueCustomersCount}
              </div>
              <div className="text-[11px] text-red-600 font-semibold">30+ Din Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alert Banner (if overdue customers exist) */}
      {stats.overdueCustomersCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-900">
                {stats.overdueCustomersCount} Grahakon ka udhaar 30 dino se puraana hai!
              </h4>
              <p className="text-xs text-red-700">
                Samay par reminder bhejne se udhaar 3 guna jaldi recover hota hai.
              </p>
            </div>
          </div>
          <button
            onClick={onGoToReminders}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Reminders Bhejo
          </button>
        </div>
      )}

      {/* Quick Actions (Large Buttons suitable for shop owners) */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span>Quick Actions</span>
          <span className="text-xs font-normal text-slate-500">· Jaldi access karein</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={onOpenAddUdhaar}
            className="flex flex-col items-center justify-center p-3.5 bg-red-50 hover:bg-red-100/80 border border-red-200 rounded-2xl text-center transition-all cursor-pointer active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Naya Udhaar</span>
            <span className="text-[10px] text-red-700 font-medium mt-0.5">Bill bhej sakte hain</span>
          </button>

          <button
            onClick={onOpenReceivePayment}
            className="flex flex-col items-center justify-center p-3.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl text-center transition-all cursor-pointer active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Payment Mila</span>
            <span className="text-[10px] text-emerald-700 font-medium mt-0.5">Jama darj karein</span>
          </button>

          <button
            onClick={onOpenAddCustomer}
            className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-center transition-all cursor-pointer active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Naya Grahak</span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">Customer jodein</span>
          </button>

          <button
            onClick={onGoToReminders}
            className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-center transition-all cursor-pointer active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Yaad Dilao</span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">WhatsApp reminder</span>
          </button>

          <button
            onClick={onGoToReports}
            className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-center transition-all cursor-pointer active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-2 shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Dukaan Report</span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">Munafa & CSV</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Haal hi ke Hisaab (Recent Transactions)</h3>
            <p className="text-xs text-slate-500">Live ledger records</p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {stats.recentTransactions.length} entries
          </span>
        </div>

        {stats.recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Koi transaction nahi mila. Naya udhaar ya payment darj karein!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.recentTransactions.map((tx) => {
              const customer = customerMap.get(tx.customerId);
              const isCredit = tx.type === 'CREDIT';

              return (
                <div
                  key={tx.transactionId}
                  onClick={() => customer && onSelectCustomer(customer.customerId)}
                  className="p-4 sm:px-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                        isCredit ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {isCredit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {customer?.name || 'Unknown Grahak'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isCredit ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isCredit ? 'UDHAAR' : 'PAYMENT'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                        <span>{formatDateIndian(tx.transactionDate)}</span>
                        <span>·</span>
                        <span className="truncate">
                          {tx.items && tx.items.length > 0
                            ? tx.items.map((it) => it.name).join(', ')
                            : tx.notes || (isCredit ? 'Kirana item' : tx.paymentMethod || 'Cash')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-extrabold font-mono tabular-nums ${
                          isCredit ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {isCredit ? `+ ${formatRupees(tx.amountPaise)}` : `- ${formatRupees(tx.amountPaise)}`}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {tx.paymentMethod ? tx.paymentMethod : 'Credit'}
                      </div>
                    </div>

                    {/* Quick WhatsApp Share Button */}
                    <button
                      onClick={(e) => handleShareTransactionWhatsApp(tx, e)}
                      title={isCredit ? 'WhatsApp Bill Bhejo' : 'WhatsApp Receipt Bhejo'}
                      className="p-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
