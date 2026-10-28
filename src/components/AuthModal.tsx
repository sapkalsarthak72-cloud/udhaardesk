/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, Mail, Store, User, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { Shop } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onRegisterShop: (data: {
    ownerName: string;
    email: string;
    phone: string;
    shopName: string;
    address: string;
  }) => void;
  onLogin: (email: string) => void;
  currentShop: Shop;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onRegisterShop,
  onLogin,
  currentShop,
}) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email aur Password dono zaroori hain.');
      return;
    }

    onLogin(email.trim());
    setSuccessMsg('Safalta-purvak Login ho gaya!');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!ownerName.trim()) {
      setErrorMsg('Maalik ka naam likhein.');
      return;
    }
    if (!shopName.trim()) {
      setErrorMsg('Dukaan ka naam likhein.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Mobile number zaroori hai.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email aur Password likhein.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password kam se kam 6 akshar ka hona chahiye.');
      return;
    }

    onRegisterShop({
      ownerName: ownerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      shopName: shopName.trim(),
      address: address.trim(),
    });

    setSuccessMsg('Nayi Dukaan account safalta-purvak ban gaya!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Kripya registered email likhein.');
      return;
    }
    setSuccessMsg(`Password reset link ${email} par bhej diya gaya hai!`);
    setTimeout(() => {
      setTab('login');
      setSuccessMsg('');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Dukaan Account Access</h3>
              <p className="text-xs text-slate-500">Firebase Authentication & Cloud Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        {tab !== 'forgot' && (
          <div className="grid grid-cols-2 p-2 bg-slate-100 mx-5 mt-4 rounded-xl shrink-0">
            <button
              onClick={() => {
                setTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dukaan Login
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nayi Dukaan Registration
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shopkeeper@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">Password *</label>
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Login Karein (Open Dukaan)
                </button>
              </div>
            </form>
          )}

          {tab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Maalik ka Naam (Owner's Full Name) *
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Jaise: Rajesh Agarwal"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Dukaan ka Naam (Shop Name) *
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Agarwal Kirana & General Store"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Mobile Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@gmail.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kam se kam 6 akshar..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Dukaan ka Pata (Shop Address)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Main Bazaar, Pune"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Create Account (Khata Shuru Karein)
                </button>
              </div>
            </form>
          )}

          {tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4 py-2">
              <p className="text-xs text-slate-600">
                Apna registered email address enter karein. Hum aapko password reset karne ka link bhejenge.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shopkeeper@gmail.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
                  required
                />
              </div>
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Wapas Login Par Jayein
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Reset Link Bhejo
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
