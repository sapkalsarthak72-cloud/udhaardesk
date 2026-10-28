/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, ExternalLink, ShieldAlert, ArrowDownLeft } from 'lucide-react';
import { Customer, Shop } from '../types';
import { formatRupees } from '../utils/formatters';
import { generateUpiQrDataUrl, generateUpiUrl } from '../utils/upi';

interface UpiModalProps {
  shop: Shop;
  customer?: Customer;
  amountPaise: number;
  onClose: () => void;
  onConfirmPaymentReceived?: (customerId: string, amountPaise: number) => void;
}

export const UpiModal: React.FC<UpiModalProps> = ({
  shop,
  customer,
  amountPaise,
  onClose,
  onConfirmPaymentReceived,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loadingQr, setLoadingQr] = useState(true);

  const upiUrl = generateUpiUrl({
    upiId: shop.upiId,
    shopName: shop.shopName,
    amountPaise: amountPaise > 0 ? amountPaise : 10000,
    note: customer ? `Khata Payment - ${customer.name}` : `Dukaan Payment - ${shop.shopName}`,
  });

  useEffect(() => {
    let isMounted = true;
    async function loadQr() {
      setLoadingQr(true);
      const url = await generateUpiQrDataUrl({
        upiId: shop.upiId,
        shopName: shop.shopName,
        amountPaise: amountPaise > 0 ? amountPaise : 10000,
        note: customer ? `Khata Payment - ${customer.name}` : `Dukaan Payment - ${shop.shopName}`,
      });
      if (isMounted) {
        setQrDataUrl(url);
        setLoadingQr(false);
      }
    }
    loadQr();
    return () => {
      isMounted = false;
    };
  }, [shop.upiId, shop.shopName, amountPaise, customer]);

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(shop.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUpiApp = () => {
    window.location.href = upiUrl;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">UPI QR se Payment Lein</h3>
              <p className="text-[11px] text-slate-500">PhonePe, GPay, Paytm se scan karein</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Shop Details */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
          <div className="text-xs text-slate-500 font-medium">Payment Rakam (Amount)</div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-0.5">
            {formatRupees(amountPaise > 0 ? amountPaise : 10000)}
          </div>
          <div className="text-xs text-indigo-700 font-bold mt-1">{shop.shopName}</div>
          {customer && (
            <div className="text-[11px] text-slate-500 mt-0.5">Grahak: {customer.name}</div>
          )}
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl shadow-inner">
          {loadingQr ? (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
              QR generate ho raha hai...
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="UPI QR Code"
              className="w-52 h-52 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-red-500">
              UPI ID theek se configured nahi hai.
            </div>
          )}
          <span className="text-[10px] text-slate-400 font-medium mt-1">
            Grahak ko counter par scan karwayein
          </span>
        </div>

        {/* Copy UPI ID Row */}
        <div className="flex items-center justify-between p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] text-slate-500 block font-semibold">UPI ID:</span>
            <span className="font-mono text-slate-800 font-bold truncate block">{shop.upiId}</span>
          </div>
          <button
            onClick={handleCopyUpiId}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-xs shrink-0 cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Direct UPI App Intent Link (For mobile phones) */}
        <button
          onClick={handleOpenUpiApp}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>UPI App Me Kholein (Direct Intent)</span>
        </button>

        {/* Security Warning Notice */}
        <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Dukaan Dhyan:</strong> UPI link ya QR kholne ka matlab payment confirm hona nahi hai. Apne bank SMS ya Soundbox par paise praapt hone ke baad hi payment darj karein.
          </div>
        </div>

        {/* Manual Confirm Button */}
        {customer && onConfirmPaymentReceived && (
          <button
            onClick={() => {
              onConfirmPaymentReceived(customer.customerId, amountPaise);
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Paise Mil Gaye! Khata Me Jama Karein</span>
          </button>
        )}
      </div>
    </div>
  );
};
