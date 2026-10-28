/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Store, RefreshCw, ShieldCheck, CheckCircle2, User, Sparkles } from 'lucide-react';
import { Shop } from '../types';

interface NavbarProps {
  shop: Shop;
  isDemoMode: boolean;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onResetDemo: () => void;
  onRunTests: () => void;
  onOpenDriveBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  shop,
  isDemoMode,
  onOpenProfile,
  onOpenAuth,
  onResetDemo,
  onRunTests,
  onOpenDriveBackup,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Dukan Wordmark */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            उ
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                UdhaarDesk
              </span>
              {isDemoMode && (
                <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate hidden sm:block">
              {shop.shopName} · <span className="text-slate-400">Dukaan ka hisaab, ab ekdum aasaan!</span>
            </p>
          </div>
        </div>

        {/* Right Action Affordances */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Google Drive Backup Button */}
          <button
            onClick={onOpenDriveBackup}
            title="Google Drive Backup"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.25z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            <span className="hidden sm:inline">Drive Backup</span>
          </button>

          {/* Run Verification Tests */}
          <button
            onClick={onRunTests}
            title="Run 16 Scenario Tests"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Verify Scenarios</span>
            <span className="sm:hidden">Tests</span>
          </button>

          {/* Reset Demo Data (if demo mode) */}
          {isDemoMode && (
            <button
              onClick={onResetDemo}
              title="Reset Demo Records"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Shop Profile Button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Dukaan Settings"
          >
            <Store className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline font-semibold">{shop.shopName}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
