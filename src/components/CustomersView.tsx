/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { Customer, CustomerKhataSummary, Transaction } from '../types';
import { formatDateIndian, formatRupees } from '../utils/formatters';
import { buildCustomerKhataSummaries } from '../utils/ledger';

interface CustomersViewProps {
  customers: Customer[];
  transactions: Transaction[];
  onSelectCustomer: (customerId: string) => void;
  onOpenAddCustomer: () => void;
}

type FilterTab = 'all' | 'pending' | 'overdue' | 'cleared';
type SortOption = 'amount_desc' | 'amount_asc' | 'days_desc' | 'name_asc';

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  transactions,
  onSelectCustomer,
  onOpenAddCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sortOption, setSortOption] = useState<SortOption>('amount_desc');

  // Compute live summaries for all customers
  const summaries = useMemo(() => {
    return buildCustomerKhataSummaries(customers, transactions);
  }, [customers, transactions]);

  // Filter & Search
  const filteredSummaries = useMemo(() => {
    return summaries.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.customer.name.toLowerCase().includes(q);
        const matchesPhone = item.customer.phone.includes(q);
        if (!matchesName && !matchesPhone) return false;
      }

      // 2. Tab Filter
      if (filterTab === 'pending') {
        return item.outstandingBalancePaise > 0;
      }
      if (filterTab === 'overdue') {
        return item.outstandingBalancePaise > 0 && item.daysPending > 30;
      }
      if (filterTab === 'cleared') {
        return item.outstandingBalancePaise === 0;
      }

      return true;
    });
  }, [summaries, searchQuery, filterTab]);

  // Sort
  const sortedSummaries = useMemo(() => {
    return [...filteredSummaries].sort((a, b) => {
      if (sortOption === 'amount_desc') {
        return b.outstandingBalancePaise - a.outstandingBalancePaise;
      }
      if (sortOption === 'amount_asc') {
        return a.outstandingBalancePaise - b.outstandingBalancePaise;
      }
      if (sortOption === 'days_desc') {
        return b.daysPending - a.daysPending;
      }
      if (sortOption === 'name_asc') {
        return a.customer.name.localeCompare(b.customer.name);
      }
      return 0;
    });
  }, [filteredSummaries, sortOption]);

  const totalOutstandingAll = useMemo(() => {
    return summaries.reduce((acc, s) => acc + (s.outstandingBalancePaise > 0 ? s.outstandingBalancePaise : 0), 0);
  }, [summaries]);

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Mere Customers (Grahak Khata)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Total {summaries.length} grahak · Net Udhaar: <strong className="text-red-600 font-mono">{formatRupees(totalOutstandingAll)}</strong>
          </p>
        </div>
        <button
          onClick={onOpenAddCustomer}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Naya Customer Jodo</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Grahak ka naam ya phone number khojein..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="w-full sm:w-auto px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="amount_desc">Badi Rakam Pehle (Highest Udhaar)</option>
              <option value="days_desc">Puraana Udhaar Pehle (Oldest Debt)</option>
              <option value="amount_asc">Kam Rakam Pehle (Lowest Udhaar)</option>
              <option value="name_asc">Naam se (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Sabhi ({summaries.length})
          </button>

          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'pending'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            Udhaar Baaki ({summaries.filter((s) => s.outstandingBalancePaise > 0).length})
          </button>

          <button
            onClick={() => setFilterTab('overdue')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'overdue'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            30+ Din Overdue ({summaries.filter((s) => s.outstandingBalancePaise > 0 && s.daysPending > 30).length})
          </button>

          <button
            onClick={() => setFilterTab('cleared')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'cleared'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Hisaab Chuka (0 Baaki) ({summaries.filter((s) => s.outstandingBalancePaise === 0).length})
          </button>
        </div>
      </div>

      {/* Customer Cards List */}
      {sortedSummaries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Koi grahak nahi mila</h3>
          <p className="text-xs text-slate-500 mt-1">
            Search badal kar dekhein ya naya grahak jodein.
          </p>
          <button
            onClick={onOpenAddCustomer}
            className="mt-4 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            + Naya Customer Jodo
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedSummaries.map((item) => {
            const hasDue = item.outstandingBalancePaise > 0;
            const isOverdue = hasDue && item.daysPending > 30;

            return (
              <div
                key={item.customer.customerId}
                onClick={() => onSelectCustomer(item.customer.customerId)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs flex items-center justify-between gap-3 cursor-pointer group"
              >
                {/* Customer Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                      isOverdue
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : hasDue
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {item.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {item.customer.name}
                      </h3>
                      {isOverdue && (
                        <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded shrink-0">
                          30+ DIN OVERDUE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.customer.phone}</span>
                      </span>
                      {item.daysPending > 0 && (
                        <>
                          <span>·</span>
                          <span
                            className={`flex items-center gap-1 font-semibold ${
                              isOverdue ? 'text-red-600' : 'text-amber-700'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{item.daysPending} din pehle</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Balance & Action */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-base sm:text-lg font-black font-mono tabular-nums ${
                        isOverdue
                          ? 'text-red-600'
                          : hasDue
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {formatRupees(item.outstandingBalancePaise)}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400">
                      {hasDue ? 'Udhaar Baaki' : 'Chuka Diya (Cleared)'}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-800 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
