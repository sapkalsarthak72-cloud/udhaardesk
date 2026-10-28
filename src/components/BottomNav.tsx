/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, Users, PlusCircle, Bell, BarChart3 } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'customers' | 'reminders' | 'reports';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenAddUdhaar: () => void;
  overdueCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenAddUdhaar,
  overdueCount = 0,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
        {/* Dashboard */}
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Home</span>
        </button>

        {/* Customers */}
        <button
          onClick={() => onChangeTab('customers')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'customers' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Grahak</span>
        </button>

        {/* Central Prominent Quick Add Udhaar */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenAddUdhaar}
            className="w-12 h-12 -mt-5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full flex flex-col items-center justify-center shadow-lg shadow-red-600/30 transition-transform cursor-pointer"
            title="Naya Udhaar Jodo"
          >
            <PlusCircle className="w-6 h-6" />
            <span className="text-[8px] font-bold tracking-tight">UDHAAR</span>
          </button>
        </div>

        {/* Reminders */}
        <button
          onClick={() => onChangeTab('reminders')}
          className={`flex flex-col items-center justify-center h-full relative transition-colors ${
            activeTab === 'reminders' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {overdueCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {overdueCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold mt-1">Reminders</span>
        </button>

        {/* Reports */}
        <button
          onClick={() => onChangeTab('reports')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'reports' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Report</span>
        </button>
      </div>
    </nav>
  );
};
