/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts integer paise to Indian Rupee formatted string.
 * Example: 125050 -> "₹1,250.50", 125000 -> "₹1,250"
 */
export function formatRupees(paise: number, showDecimalsIfZero = false): string {
  if (isNaN(paise) || paise === null || paise === undefined) return '₹0';
  const rupees = paise / 100;
  
  const hasFraction = paise % 100 !== 0;
  const minimumFractionDigits = hasFraction || showDecimalsIfZero ? 2 : 0;
  const maximumFractionDigits = 2;

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Math.abs(rupees));

  return paise < 0 ? `-${formatted}` : formatted;
}

/**
 * Converts rupee decimal or integer string/number to integer paise safely.
 * Example: "125.50" -> 12550, 20 -> 2000
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    rupees = parseFloat(rupees.replace(/[^0-9.-]/g, ''));
  }
  if (isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise to numerical rupee value for form inputs.
 */
export function paiseToRupees(paise: number): number {
  if (!paise) return 0;
  return Math.round(paise) / 100;
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) to Indian DD/MM/YYYY format.
 */
export function formatDateIndian(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formats a date to readable format with time (e.g. "27 Oct 2026, 4:30 PM")
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Normalizes Indian 10-digit mobile number.
 * Returns { valid: boolean, fullPhone: "+91XXXXXXXXXX", displayPhone: "XXXXXXXXXX" }
 */
export function normalizeIndianPhone(input: string): {
  valid: boolean;
  fullPhone: string;
  displayPhone: string;
} {
  const digitsOnly = input.replace(/\D/g, '');
  let mobile10 = '';

  if (digitsOnly.length === 10) {
    mobile10 = digitsOnly;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    mobile10 = digitsOnly.slice(1);
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    mobile10 = digitsOnly.slice(2);
  } else if (digitsOnly.length > 10) {
    // take the last 10 digits if valid mobile length
    mobile10 = digitsOnly.slice(-10);
  }

  // Indian mobile numbers start with 6, 7, 8, or 9
  const isValid = /^[6-9]\d{9}$/.test(mobile10);

  return {
    valid: isValid,
    fullPhone: isValid ? `+91${mobile10}` : `+91${digitsOnly}`,
    displayPhone: mobile10 || digitsOnly,
  };
}

/**
 * Calculates calendar days elapsed between given date and today.
 */
export function calculateDaysAgo(dateStr: string): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr.split('T')[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - target.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

/**
 * Gets today's date formatted as YYYY-MM-DD for form date inputs.
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
