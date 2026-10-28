/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, Shop, Transaction } from '../types';
import { formatDateIndian, formatRupees, normalizeIndianPhone } from './formatters';
import { generateUpiUrl } from './upi';

/**
 * Builds the wa.me click-to-chat URL with properly encoded text.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const { fullPhone } = normalizeIndianPhone(phone);
  const cleanPhone = fullPhone.replace(/\+/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Generates Hinglish Udhaar Bill Message
 */
export function generateUdhaarBillMessage(
  shop: Shop,
  customer: Customer,
  transaction: Transaction,
  totalOutstandingPaise: number
): string {
  const itemsText =
    transaction.items && transaction.items.length > 0
      ? transaction.items.map((it) => `${it.name}${it.quantity ? ` (${it.quantity})` : ''}`).join(', ')
      : transaction.notes || 'Kirana Saaman';

  const amountStr = formatRupees(transaction.amountPaise);
  const totalOutstandingStr = formatRupees(totalOutstandingPaise);
  const dateStr = formatDateIndian(transaction.transactionDate);

  return `Namaste ${customer.name} ji! 🙏

Aapka *${shop.shopName}* ka udhaar bill:

📅 *Date:* ${dateStr}
🛒 *Items:* ${itemsText}
💰 *Bill Amount:* ${amountStr}
📊 *Total Outstanding Udhaar:* ${totalOutstandingStr}

Dhanyavaad!
*${shop.shopName}*
📞 ${shop.phone}`;
}

/**
 * Generates Hinglish Payment Reminder Message
 */
export function generatePaymentReminderMessage(
  shop: Shop,
  customer: Customer,
  outstandingPaise: number,
  daysPending?: number
): string {
  const outstandingStr = formatRupees(outstandingPaise);
  const daysText = daysPending && daysPending > 0 ? ` (Pichhle ${daysPending} dino se)` : '';
  
  let upiSection = '';
  if (shop.upiId) {
    const upiLink = generateUpiUrl({
      upiId: shop.upiId,
      shopName: shop.shopName,
      amountPaise: outstandingPaise,
      note: `Khata payment - ${customer.name}`,
    });
    upiSection = `\n💳 *UPI se payment karein:* ${upiLink}\n(UPI ID: ${shop.upiId})\n`;
  }

  return `Namaste ${customer.name} ji! 🙏

Aapke *${shop.shopName}* par *${outstandingStr}* ka udhaar pending hai${daysText}.

Kripya apni suvidha ke anusaar payment kar dein.${upiSection}
Agar aap payment pehle hi kar chuke hain toh kripya batayein.

Dhanyavaad!
*${shop.shopName}*
📞 ${shop.phone}`;
}

/**
 * Generates Hinglish Payment Received Receipt Message
 */
export function generatePaymentReceiptMessage(
  shop: Shop,
  customer: Customer,
  transaction: Transaction,
  remainingBalancePaise: number
): string {
  const receivedAmountStr = formatRupees(transaction.amountPaise);
  const remainingStr = formatRupees(remainingBalancePaise);
  const dateStr = formatDateIndian(transaction.transactionDate);
  const modeText = transaction.paymentMethod || 'CASH';

  return `Namaste ${customer.name} ji! 🙏

Aapka payment praapt hua:

✅ *Payment Mila:* ${receivedAmountStr}
📅 *Date:* ${dateStr}
💳 *Method:* ${modeText}${transaction.referenceNumber ? `\n🔖 *Ref:* ${transaction.referenceNumber}` : ''}
📊 *Bacha hua Udhaar:* ${remainingStr}

Aapka hisaab update kar diya gaya hai.
Dhanyavaad!
*${shop.shopName}*
📞 ${shop.phone}`;
}

/**
 * Generates Full Khata Statement Message
 */
export function generateKhataStatementMessage(
  shop: Shop,
  customer: Customer,
  recentTransactions: Transaction[],
  outstandingPaise: number
): string {
  const outstandingStr = formatRupees(outstandingPaise);
  
  const entriesSummary = recentTransactions
    .slice(0, 5)
    .map((t) => {
      const isCredit = t.type === 'CREDIT';
      const symbol = isCredit ? '🔴 Udhaar' : '🟢 Jama';
      return `• ${formatDateIndian(t.transactionDate)}: ${symbol} ${formatRupees(t.amountPaise)}`;
    })
    .join('\n');

  return `Namaste ${customer.name} ji! 🙏

Aapka *${shop.shopName}* ka digital khata hisaab:

*Halaat (Summary):*
📊 *Current Outstanding:* ${outstandingStr}

*Haal hi ke hisaab (Recent Entries):*
${entriesSummary || 'Koi entry nahi'}

Kripya kisi bhi sankoch ya jaankari ke liye humse sampark karein.

Dhanyavaad!
*${shop.shopName}*
📞 ${shop.phone}`;
}
