# UdhaarDesk: Kirana Digital Khata & Udhaar Manager

UdhaarDesk is a modern, mobile-first web application designed specifically for Indian kirana (grocery) shop owners to effortlessly record customer credit (udhaar), maintain immutable digital khata ledgers, collect UPI payments with dynamic QR codes, send personalized Hinglish WhatsApp reminders and bills, and monitor real-time business health.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product and architectural decisions have been aligned based on user input:
> - **Default Experience**: Launches with an **Interactive Demo Mode with one-click Firebase sync**, pre-loaded with realistic kirana customer accounts (Rahul Sharma, Amit Patil, Priya Deshmukh, Sneha Verma, Rohan Gupta) and realistic credit/payment histories, allowing immediate hands-on testing without an initial setup barrier.
> - **Language & Tone**: Personalized **Hinglish messaging** ("Namaste Rahul ji! Aapke Kirana Store par Rs. 1,200 ka udhaar pending hai...") that is respectful, polite, and culturally resonant with Indian community retail relationships.
> - **Payment Collection**: Triple-option UPI modal providing a **Dynamic scannable QR Code** (auto-encoded with merchant VPA and transaction/khata amount), a **Direct UPI App Launch intent link** (`upi://pay`), and a **1-Tap Copy UPI ID** button.
> - **Financial Ledger Safety**: Integer-paise storage (`amountPaise`) to eliminate JavaScript floating-point rounding bugs, strict append-only transaction ledger, and client-side balance derivation ensuring zero desynchronization between ledger and balance records.

---

## 1. Overview & Core Concept

- **What It Does**: Digitizes the traditional paper "bahi-khata" notebook into a lightning-fast mobile web app. Shop owners can record udhaar entries with itemized descriptions, log cash/UPI payments, view customer ledgers, filter overdue debts (>30 days), broadcast WhatsApp bill receipts, and export transaction audit trails.
- **Target Persona**: Indian kirana and local retail shop owners (Kirana, General Stores, Medical Stores, Dairies) who need large touch targets, minimal typing, high-contrast sunlight legibility, and simple Hinglish phrasing.
- **Key Value**: Reduces overdue credit loss, accelerates cash recovery by 3x through frictionless WhatsApp reminder links with pre-filled UPI payment links, and eliminates calculation disputes with timestamped ledger histories.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Quick Udhaar Entry (Naya Udhaar Jodo)**:
   - Tap primary floating action or dashboard quick button.
   - Pick customer with quick search or tap "Naya Grahak" (instant inline add).
   - Enter amount in Rs., optional item tag (e.g., "Atta, Dal, Oil"), set date.
   - Confirmation drawer opens with 2 primary options: "Save Udhaar" or "Save & Send Bill on WhatsApp".
   - Generates instant WhatsApp Click-to-Chat link with formatted bill summary.

2. **Receive Payment (Payment Mila)**:
   - Select customer; outstanding balance is highlighted.
   - Enter payment amount (full or partial payment supported).
   - Select method (Cash, UPI, Bank Transfer).
   - Saves transaction as a payment credit in ledger, updates balance, and offers instant receipt sharing via WhatsApp.

3. **Smart Reminders & Collections (Payment Yaad Dilao)**:
   - Filter ledger aging: 0–7 days, 8–15 days, 16–30 days, 30+ days (flagged in bold red).
   - Zero-balance customers are excluded.
   - Multi-select customers or tap individual "Send Reminder" button.
   - Previews polite Hinglish reminder message with UPI pay link before dispatching.

4. **UPI QR & In-Person Payment**:
   - Tap "Pay by UPI" on any customer khata.
   - Generates dynamic high-contrast QR code with exact amount and shop UPI ID.
   - Customer scans from PhonePe, Google Pay, or Paytm directly at the counter.

5. **Business Reports & CSV Export (Dukaan ki Report)**:
   - Daily, weekly, and monthly collection metrics.
   - Oldest pending dues breakdown and payment mode distribution.
   - 1-Click CSV export of ledger entries.

### Visual Identity & Theme Tokens

- **Aesthetic Direction**: Clean, tactile utilitarian retail system. High contrast for outdoor bright-light dukan environments, zero-pill typography, large $\ge 48\text{px}$ touch targets.
- **Color Palette**:
  - *Dominant Canvas (60%)*: Crisp clean slate-50 (`#f8fafc`) with pure white card surfaces (`#ffffff`).
  - *Structural Neutrals (30%)*: Border slate-200 (`#e2e8f0`), text slate-900 (`#0f172a`), muted text slate-600 (`#475569`).
  - *Accent & Semantic Budget (10%)*:
    - **Received Payments / Success**: Emerald-600 (`#059669`) / Emerald-50 background.
    - **Overdue Debts (>30d) / Urgency**: Crimson/Red-600 (`#dc2626`) / Red-50 background.
    - **Pending Udhaar / Alerts**: Amber-600 (`#d97706`) / Amber-50 background.
    - **Primary Brand Action**: Indigo-700 / Deep Slate (`#1e293b`) for shop owner authority.
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans`, font-weight 700 with `text-wrap: balance`.
  - Body & Form Controls: `Plus Jakarta Sans`, 15–16px readable prose.
  - Financial Figures & Ledgers: `font-mono tabular-nums` for precise alignment of Indian currency amounts (`Rs. 1,250.00`).
- **Responsive Layout**:
  - *Mobile (< 768px)*: Fixed thumb-zone bottom navigation bar (Home, Customers, Reminders, Reports), sticky top bar with shop name and quick add button, bottom drawers for transactional entry.
  - *Desktop / Tablet ($\ge 768px$)*: Full-width responsive dashboard with left sidebar navigation, expansive multi-column grid, and desktop table views.

---

## 3. Key Product Decisions & Trade-Offs

- **Dual-Engine Architecture (Demo Mode + Live Firebase Integration)**:
  - *Approach*: Built with a unified repository interface (`KhataRepository`). Starts in Demo Mode with persistent local storage, and provides a clear Firebase Connect dialog allowing instant live sync to Cloud Firestore and Firebase Auth without code changes.
  - *Why*: Kirana shop owners and evaluators can immediately experience the entire workflow without waiting for backend provisioning or encountering blocked permissions.
- **Integer Paise Financial Storage**:
  - *Approach*: All monetary values stored as integers in paise (`Rs. 50.50` = `5050 paise`). Display converted via pure helper utilities (`formatRupees(paise)`).
  - *Why*: Eliminates IEEE-754 floating-point precision drifts that plague web financial systems.
- **Derived Khata Balance (Source-of-Truth Ledger)**:
  - *Approach*: Total outstanding balances are derived dynamically from the sum of transactions (`CREDIT` increases balance, `PAYMENT` decreases balance). Customer records cache balance for fast indexing, verified against the ledger.
  - *Why*: Prevents desynchronization bugs and ensures auditability.
- **WhatsApp Click-to-Chat over Direct API Gateways**:
  - *Approach*: Uses official WhatsApp deep-links (`https://wa.me/<phone>?text=<encoded_msg>`).
  - *Why*: Eliminates recurring SMS/Twilio API fees for small shop owners; allows the shopkeeper to review the message in WhatsApp before hitting send, maintaining warm community relationships.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              UdhaarDesk                                │
│                     (Mobile & Desktop Responsive)                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────┐                         ┌───────────────────────┐
│     Mobile Shell      │                         │     Desktop Shell     │
│ Sticky Header (Shop)  │                         │ Collapsible Sidebar   │
│ Thumb Bottom Nav Bar  │                         │ Multi-Column Views    │
│ Slide-Up Action Sheet │                         │ Modal Drawers         │
└──────────┬────────────┘                         └───────────┬───────────┘
           │                                                  │
           └────────────────────────┬─────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Core Feature Modules                            │
│  ├── Dashboard: Total Udhaar, Collections (Today/Week), Overdue Counts  │
│  ├── Customer Khata: Ledger history, partial payments, date filtering   │
│  ├── Quick Add: Udhaar entry with item breakdown & WhatsApp bill share  │
│  ├── Payment Collector: Cash/UPI ledger entry, Receipt WhatsApp link    │
│  ├── Smart Reminders: Aging buckets (0-7d, 8-15d, 16-30d, 30+d overdue) │
│  ├── Dynamic UPI Modal: Auto-generated QR code, URI intent & Copy VPA   │
│  └── Reports & CSV: Revenue recovered, aging debt, exportable audit log │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Khata Repository & State Layer                      │
│   ├── Integer Paise Math Engine (Safe additions, balance derivations)   │
│   ├── Dual Storage Adapter:                                             │
│   │   ├── Mode A: LocalStorage + Reactive Store (Full Demo Kirby Data)  │
│   │   └── Mode B: Firebase Auth + Cloud Firestore + Security Rules      │
│   └── WhatsApp Intent & UPI URI Generator (RFC 3986 Compliant)          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Schema (Firestore & LocalStorage)

1. **`shops`**:
   - `shopId`: string (unique)
   - `ownerUid`: string (auth uid)
   - `shopName`: string (e.g. "Gupta Kirana & General Store")
   - `ownerName`: string
   - `phone`: string (10-digit Indian mobile)
   - `address`: string
   - `upiId`: string (e.g. "guptastore@okaxis")
   - `preferredLanguage`: "hinglish" | "hindi" | "english"
   - `createdAt`: ISO / Timestamp

2. **`customers`**:
   - `customerId`: string
   - `shopId`: string
   - `name`: string
   - `phone`: string (normalized with +91)
   - `address`?: string
   - `notes`?: string
   - `createdAt`: ISO / Timestamp
   - `archivedAt`?: string | null

3. **`transactions`**:
   - `transactionId`: string
   - `shopId`: string
   - `customerId`: string
   - `type`: "CREDIT" (Udhaar) | "PAYMENT" (Jama)
   - `amountPaise`: integer
   - `items`: Array<{ name: string; quantity?: string; pricePaise?: number }>
   - `paymentMethod`: "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER"
   - `transactionDate`: string (YYYY-MM-DD)
   - `createdAt`: ISO / Timestamp
   - `referenceNumber`?: string
   - `notes`?: string
   - `status`: "COMPLETED" | "REVERSED"

4. **`auditLogs`**:
   - `logId`: string
   - `shopId`: string
   - `actorUid`: string
   - `action`: string
   - `entityType`: "CUSTOMER" | "TRANSACTION" | "SHOP"
   - `entityId`: string
   - `timestamp`: ISO / Timestamp
   - `details`: object

---

## 5. Implementation Stages & Verification Plan

1. **Stage 1: Core Domain Utilities & Financial Engine**:
   - Currency formatting (`formatRupees`, `paiseToRupees`, `rupeesToPaise`).
   - Phone normalization (+91 sanitizer).
   - WhatsApp message generators for bills, payment receipts, reminders, and khata statements.
   - Dynamic UPI deep-link URL and QR code matrix renderer.
2. **Stage 2: Storage Architecture & Seed Data**:
   - Complete `KhataStore` supporting reactive subscription, demo toggle, and Firebase Firestore bridge.
   - Rich demo data for 5 customers with historical credit and partial payments showcasing all reminder aging buckets.
3. **Stage 3: Mobile-First Shell & Navigation**:
   - Responsive layout with bottom navigation on mobile, persistent sidebar on desktop.
   - Shop switcher, demo mode banner with reset button, and Firebase sync trigger.
4. **Stage 4: Dashboard & Quick Actions**:
   - Live KPI cards (Total Udhaar, Today's Collection, This Week's Collection, Overdue Customers).
   - Quick action bar: "Naya Udhaar Jodo", "Payment Mila", "Customer Jodo", "Report Dekho".
   - Recent transaction feed with color-coded debit/credit badges.
5. **Stage 5: Customer Management & Khata Ledger**:
   - Searchable, sortable customer directory.
   - Individual customer Khata screen with chronologically sorted ledger, balance summary, date filters, and action sheet.
6. **Stage 6: Udhaar & Payment Workflows**:
   - Add Udhaar modal with multi-item tagging, amount validation, and instant WhatsApp bill sharing.
   - Receive Payment modal with payment mode selection and receipt sharing.
7. **Stage 7: Smart Reminders System**:
   - Categorized dues (0-7d, 8-15d, 16-30d, 30+d in high-contrast red).
   - Multi-select or single-click reminder generation with pre-populated UPI payment link.
8. **Stage 8: Dukaan Reports & CSV Export**:
   - Aggregated charts and tables for collected revenue vs outstanding credit.
   - Client-side CSV export generator for complete financial records.
9. **Stage 9: Security Rules, Documentation & Verification**:
   - `firestore.rules` adhering to Zero-Trust ABAC specifications.
   - `firebase-blueprint.json` schema blueprint.
   - Unit tests covering balance calculation and overdue ledger aging.
   - Full TypeScript type-check and applet compilation.
