/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';

export interface UpiLinkParams {
  upiId: string;
  shopName: string;
  amountPaise: number;
  note?: string;
  transactionRef?: string;
}

/**
 * Validates standard Indian UPI ID (VPA), e.g. name@bank, 9876543210@paytm, etc.
 */
export function isValidUpiId(upiId: string): boolean {
  if (!upiId || typeof upiId !== 'string') return false;
  const clean = upiId.trim();
  // Standard format: string + @ + handle (at least 2 chars after @)
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(clean);
}

/**
 * Generates official NPCI UPI Deep Link URL for mobile wallet invocation.
 * Standard format: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
 */
export function generateUpiUrl(params: UpiLinkParams): string {
  const { upiId, shopName, amountPaise, note, transactionRef } = params;
  const rupees = (amountPaise / 100).toFixed(2);

  const queryParams = new URLSearchParams();
  queryParams.set('pa', upiId.trim());
  queryParams.set('pn', shopName.trim());
  queryParams.set('am', rupees);
  queryParams.set('cu', 'INR');

  if (note) {
    queryParams.set('tn', note.slice(0, 50));
  } else {
    queryParams.set('tn', `Payment to ${shopName}`);
  }

  if (transactionRef) {
    queryParams.set('tr', transactionRef);
  }

  return `upi://pay?${queryParams.toString()}`;
}

/**
 * Generates an SVG Data URI or base64 QR Code using the `qrcode` library.
 */
export async function generateUpiQrDataUrl(params: UpiLinkParams): Promise<string> {
  const upiUrl = generateUpiUrl(params);
  try {
    const dataUrl = await QRCode.toDataURL(upiUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate UPI QR code:', error);
    return '';
  }
}
