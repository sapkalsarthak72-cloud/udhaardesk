/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Store, User, Phone, MapPin, QrCode, Globe, RefreshCw, Cloud, Check } from 'lucide-react';
import { Language, Shop } from '../types';
import { isValidUpiId } from '../utils/upi';

interface ShopProfileModalProps {
  shop: Shop;
  isDemoMode: boolean;
  onClose: () => void;
  onUpdateShop: (updates: Partial<Shop>) => void;
  onResetDemo: () => void;
  onOpenAuth: () => void;
}

export const ShopProfileModal: React.FC<ShopProfileModalProps> = ({
  shop,
  isDemoMode,
  onClose,
  onUpdateShop,
  onResetDemo,
  onOpenAuth,
}) => {
  const [shopName, setShopName] = useState(shop.shopName);
  const [ownerName, setOwnerName] = useState(shop.ownerName);
  const [phone, setPhone] = useState(shop.phone);
  const [address, setAddress] = useState(shop.address);
  const [upiId, setUpiId] = useState(shop.upiId);
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(shop.preferredLanguage);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!shopName.trim()) {
      setErrorMsg('Dukaan ka naam zaroori hai.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Mobile number zaroori hai.');
      return;
    }
    if (upiId.trim() && !isValidUpiId(upiId.trim())) {
      setErrorMsg('Kripya valid UPI ID likhein (jaise: yourname@bank).');
      return;
    }

    onUpdateShop({
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      upiId: upiId.trim(),
      preferredLanguage,
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Dukaan Profile & Settings</h3>
              <p className="text-xs text-slate-500">Apni dukaan aur UPI settings manage karein</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
              {errorMsg}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Dukaan profile safalta-purvak update ho gayi!</span>
            </div>
          )}

          {/* Shop Name */}
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Dukaan ka Naam (Shop Name) *
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Gupta Kirana Store"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none font-semibold text-slate-900"
              required
            />
          </div>

          {/* Owner Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 mb-1 block">
                Maalik ka Naam (Owner Name)
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Rameshwar Gupta"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 mb-1 block">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919820..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* UPI ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800">Dukaan UPI ID (QR ke liye)</label>
              <span className="text-[11px] text-slate-400">PhonePe / GPay / Paytm handle</span>
            </div>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourstore@okaxis"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Customer isi UPI ID par online payment bhejenge.
            </p>
          </div>

          {/* Shop Address */}
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Dukaan ka Pata (Shop Address)
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Shop No., Market road, City, Pincode"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              WhatsApp & App Bhasha (Language)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'hinglish' as Language, label: 'Hinglish (Recommended)' },
                { id: 'hindi' as Language, label: 'Hindi (हिंदी)' },
                { id: 'english' as Language, label: 'English' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setPreferredLanguage(lang.id)}
                  className={`p-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    preferredLanguage === lang.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Firebase Cloud Sync Info Box */}
          <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-indigo-950">Cloud Database & Security Rules</h4>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              UdhaarDesk me Cloud Firestore aur Zero-Trust Security Rules configured hain. Har dukaan ka data isolated rehta hai aur ek dukaandar doosre ka hisaab nahi dekh sakta.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs cursor-pointer"
              >
                Owner Login / Sign Up
              </button>
            </div>
          </div>

          {/* Reset Demo Data Button */}
          {isDemoMode && (
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Demo Testing Data:</span>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Kya aap sample demo data reset karna chahte hain?')) {
                    onResetDemo();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Demo Records</span>
              </button>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
