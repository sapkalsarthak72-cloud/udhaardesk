/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Bell,
  BarChart3,
  PlusCircle,
  ArrowDownLeft,
  Store,
  QrCode,
} from 'lucide-react';
import { ActiveTab } from './BottomNav';
import { Shop } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenAddUdhaar: () => void;
  onOpenReceivePayment: () => void;
  onOpenUpiModal: () => void;
  onOpenProfile: () => void;
  onOpenDriveBackup: () => void;
  shop: Shop;
  overdueCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  onOpenAddUdhaar,
  onOpenReceivePayment,
  onOpenUpiModal,
  onOpenProfile,
  onOpenDriveBackup,
  shop,
  overdueCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Namaste Dashboard',
      sublabel: 'Dukaan ka hisaab',
      icon: LayoutDashboard,
    },
    {
      id: 'customers' as ActiveTab,
      label: 'Mere Customers',
      sublabel: 'Khata aur bahi-khata',
      icon: Users,
    },
    {
      id: 'reminders' as ActiveTab,
      label: 'Payment Yaad Dilao',
      sublabel: 'Smart WhatsApp reminders',
      icon: Bell,
      badge: overdueCount > 0 ? `${overdueCount} Overdue` : undefined,
      badgeColor: 'bg-red-100 text-red-700',
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Dukaan ki Report',
      sublabel: 'Munafa aur cash collection',
      icon: BarChart3,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 shrink-0">
      {/* Primary Action Buttons */}
      <div className="space-y-2 mb-6">
        <button
          onClick={onOpenAddUdhaar}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Naya Udhaar Jodo</span>
        </button>

        <button
          onClick={onOpenReceivePayment}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer"
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Payment Mila (Jama)</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <div>
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div
                    className={`text-[11px] ${
                      isActive ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {item.sublabel}
                  </div>
                </div>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-red-500 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Shop UPI Card */}
      <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
        <button
          onClick={onOpenDriveBackup}
          className="w-full flex items-center justify-between p-2.5 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/80 rounded-xl transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.25z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            <div>
              <div className="text-xs font-bold text-slate-800">Google Drive</div>
              <div className="text-[10px] text-indigo-700 font-semibold">Khata Cloud Backup</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded shadow-2xs">
            Sync
          </span>
        </button>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Dukaan UPI ID</span>
            <button
              onClick={onOpenUpiModal}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Dekho</span>
            </button>
          </div>
          <div className="font-mono text-xs text-slate-600 truncate">{shop.upiId || 'Not configured'}</div>
        </div>

        <button
          onClick={onOpenProfile}
          className="w-full flex items-center gap-2 p-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <Store className="w-4 h-4 text-slate-500" />
          <span className="truncate">{shop.ownerName || 'Shop Profile'}</span>
        </button>
      </div>
    </aside>
  );
};
