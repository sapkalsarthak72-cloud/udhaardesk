/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Download,
  BarChart3,
  TrendingUp,
  CreditCard,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Customer, DashboardStats, Shop, Transaction } from '../types';
import { formatDateIndian, formatRupees } from '../utils/formatters';
import { buildCustomerKhataSummaries, exportTransactionsToCsv } from '../utils/ledger';

interface ReportsViewProps {
  stats: DashboardStats;
  customers: Customer[];
  transactions: Transaction[];
  shop: Shop;
  onSelectCustomer: (customerId: string) => void;
  onOpenDriveBackup?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  stats,
  customers,
  transactions,
  shop,
  onSelectCustomer,
  onOpenDriveBackup,
}) => {
  const [reportTab, setReportTab] = useState<'collection' | 'dues' | 'breakdown' | 'customers'>(
    'collection'
  );

  const summaries = useMemo(() => {
    return buildCustomerKhataSummaries(customers, transactions);
  }, [customers, transactions]);

  // Payment methods calculation
  const paymentMethodBreakdown = useMemo(() => {
    const paymentTx = transactions.filter((t) => t.type === 'PAYMENT' && t.status === 'COMPLETED');
    const breakdown = {
      CASH: { count: 0, amountPaise: 0 },
      UPI: { count: 0, amountPaise: 0 },
      BANK_TRANSFER: { count: 0, amountPaise: 0 },
      OTHER: { count: 0, amountPaise: 0 },
    };

    for (const tx of paymentTx) {
      const method = (tx.paymentMethod || 'CASH') as keyof typeof breakdown;
      if (breakdown[method]) {
        breakdown[method].count += 1;
        breakdown[method].amountPaise += tx.amountPaise;
      }
    }

    const totalRecoveredPaise = paymentTx.reduce((acc, t) => acc + t.amountPaise, 0);

    return { breakdown, totalRecoveredPaise, totalCount: paymentTx.length };
  }, [transactions]);

  // Oldest unpaid dues list
  const oldestDuesList = useMemo(() => {
    return summaries
      .filter((s) => s.outstandingBalancePaise > 0 && s.daysPending > 0)
      .sort((a, b) => b.daysPending - a.daysPending);
  }, [summaries]);

  // Highest debt customers
  const highestDebtCustomers = useMemo(() => {
    return [...summaries]
      .filter((s) => s.outstandingBalancePaise > 0)
      .sort((a, b) => b.outstandingBalancePaise - a.outstandingBalancePaise)
      .slice(0, 10);
  }, [summaries]);

  // Cleared dues customers
  const clearedCustomers = useMemo(() => {
    return summaries.filter((s) => s.outstandingBalancePaise === 0);
  }, [summaries]);

  // Total credit entries count & amount
  const creditTotals = useMemo(() => {
    const creditTx = transactions.filter((t) => t.type === 'CREDIT' && t.status === 'COMPLETED');
    const totalPaise = creditTx.reduce((acc, t) => acc + t.amountPaise, 0);
    return { count: creditTx.length, totalPaise };
  }, [transactions]);

  const handleExportCsv = () => {
    const csvContent = exportTransactionsToCsv(transactions, customers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `UdhaarDesk_${shop.shopName.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Dukaan ki Report (Business Health)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Recovered cash, pending udhaar, aur financial analytics
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenDriveBackup && (
            <button
              onClick={onOpenDriveBackup}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs border border-indigo-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.25z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span>Drive Backup</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Top 2 KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Money Recovered */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Money Recovered (Total Jama)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono tabular-nums">
            {formatRupees(paymentMethodBreakdown.totalRecoveredPaise)}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Aaj:</span>
              <span className="font-extrabold text-slate-900 font-mono">
                {formatRupees(stats.todayCollectionPaise)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Iss Hafte:</span>
              <span className="font-extrabold text-slate-900 font-mono">
                {formatRupees(stats.thisWeekCollectionPaise)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Iss Mahine:</span>
              <span className="font-extrabold text-slate-900 font-mono">
                {formatRupees(stats.thisMonthCollectionPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Outstanding Udhaar */}
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">
              Outstanding Udhaar (Market me Baaki)
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-red-600 font-mono tabular-nums">
            {formatRupees(stats.totalOutstandingPaise)}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
            <div className="text-slate-600">
              <strong className="text-slate-900">{stats.activeUdhaarCustomersCount}</strong> grahako ka udhaar baaki hai
            </div>
            {stats.overdueCustomersCount > 0 && (
              <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-[11px]">
                {stats.overdueCustomersCount} Overdue (30+d)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Report Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <button
          onClick={() => setReportTab('collection')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            reportTab === 'collection' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Payment Modes (Cash vs UPI)
        </button>

        <button
          onClick={() => setReportTab('dues')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            reportTab === 'dues' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Oldest Dues (Puraana Udhaar)
        </button>

        <button
          onClick={() => setReportTab('customers')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            reportTab === 'customers' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Top Udhaar Grahak
        </button>

        <button
          onClick={() => setReportTab('breakdown')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            reportTab === 'breakdown' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Transaction Volume
        </button>
      </div>

      {/* Content for Active Tab */}
      {reportTab === 'collection' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Payment Mode Breakdown (Paise Kis Raste Aaye)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-semibold text-slate-500">💵 Cash Payments</div>
              <div className="text-xl font-black text-slate-900 font-mono tabular-nums mt-1">
                {formatRupees(paymentMethodBreakdown.breakdown.CASH.amountPaise)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {paymentMethodBreakdown.breakdown.CASH.count} entries
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl">
              <div className="text-xs font-semibold text-indigo-700">📱 UPI / QR Payments</div>
              <div className="text-xl font-black text-indigo-900 font-mono tabular-nums mt-1">
                {formatRupees(paymentMethodBreakdown.breakdown.UPI.amountPaise)}
              </div>
              <div className="text-[11px] text-indigo-600 mt-1">
                {paymentMethodBreakdown.breakdown.UPI.count} entries
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-semibold text-slate-500">🏦 Bank Transfer</div>
              <div className="text-xl font-black text-slate-900 font-mono tabular-nums mt-1">
                {formatRupees(paymentMethodBreakdown.breakdown.BANK_TRANSFER.amountPaise)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {paymentMethodBreakdown.breakdown.BANK_TRANSFER.count} entries
              </div>
            </div>
          </div>
        </div>
      )}

      {reportTab === 'dues' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Oldest Dues (Sabse Puraana Udhaar)</h3>
            <p className="text-xs text-slate-500">
              FIFO ledger ke hisaab se sabse puraani pending entries
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {oldestDuesList.map((item) => {
              const isOverdue = item.daysPending > 30;
              return (
                <div
                  key={item.customer.customerId}
                  onClick={() => onSelectCustomer(item.customer.customerId)}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{item.customer.name}</span>
                      {isOverdue && (
                        <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded">
                          30+ DIN OVERDUE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Oldest: {formatDateIndian(item.oldestUnpaidDate)}</span>
                      <span>·</span>
                      <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                        {item.daysPending} din pehle se pending
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-red-600 font-mono tabular-nums">
                      {formatRupees(item.outstandingBalancePaise)}
                    </div>
                    <div className="text-[10px] text-slate-400">Baaki Udhaar</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reportTab === 'customers' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Grahak Ranking (Highest Pending Udhaar)
            </h3>
            <p className="text-xs text-slate-500">In grahako par sabse zyada rakam baaki hai</p>
          </div>

          <div className="divide-y divide-slate-100">
            {highestDebtCustomers.map((item, idx) => (
              <div
                key={item.customer.customerId}
                onClick={() => onSelectCustomer(item.customer.customerId)}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 text-center text-xs font-bold text-slate-400">#{idx + 1}</div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{item.customer.name}</div>
                    <div className="text-xs text-slate-500">{item.customer.phone}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-red-600 font-mono tabular-nums">
                    {formatRupees(item.outstandingBalancePaise)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Total Udhaar: {formatRupees(item.totalCreditPaise)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportTab === 'breakdown' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Transaction Volume & Count</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl">
              <span className="text-xs font-bold text-red-700">Total Udhaar Entries (Credit)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{creditTotals.count}</div>
              <div className="text-xs text-slate-600 font-mono mt-1">
                Value: {formatRupees(creditTotals.totalPaise)}
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <span className="text-xs font-bold text-emerald-700">Total Payment Entries (Jama)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {paymentMethodBreakdown.totalCount}
              </div>
              <div className="text-xs text-slate-600 font-mono mt-1">
                Value: {formatRupees(paymentMethodBreakdown.totalRecoveredPaise)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
