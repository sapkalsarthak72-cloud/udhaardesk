# UdhaarDesk (उधारडेस्क)
> **"Dukaan ka hisaab, ab ekdum aasaan!"**
> Mobile-first Digital Khata & Udhaar Management System for Indian Kirana & Retail Shop Owners.

---

## 1. Overview & Capabilities

**UdhaarDesk** is a production-grade, responsive Progressive Web App designed specifically for Indian kirana (grocery) stores, general stores, medical halls, and neighborhood retailers. It eliminates traditional paper *bahi-khata* disputes, prevents overdue debt losses, and accelerates cash recovery with zero recurring SMS or gateway fees.

### Key Highlights
- **Mobile-First & Large Touch Targets**: Ergonomically crafted for single-handed thumb operation on mobile and tablets with high-contrast outdoor readability.
- **Natural Hinglish Messaging**: Culturally respectful, friendly customer communications that preserve community trust.
- **Zero Floating-Point Financial Bugs**: All money is stored as integer paise (`amountPaise`), preventing floating-point rounding errors.
- **FIFO Ledger Balance Derivation**: Outstanding balances and overdue aging (>30 days alert) are mathematically computed from an immutable append-only ledger.
- **Dynamic UPI Payment Links & QR Matrix**: Generates NPCI-compliant `upi://pay` links and dynamic on-counter QR codes encoded with merchant VPA and exact paise amounts.
- **WhatsApp Click-to-Chat**: One-tap delivery of itemized bills, payment receipts, khata statements, and overdue payment reminders directly through WhatsApp.
- **Dual Engine Architecture**: Works out-of-the-box with persistent Demo Mode and syncs seamlessly with Google Firebase Authentication and Cloud Firestore with hardened Zero-Trust security rules.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **QR Engine**: `qrcode` (dynamic base64/SVG matrix generation).
- **Backend & Cloud Database**: Firebase Authentication, Cloud Firestore, Firebase Hosting.
- **Security**: Attribute-Based Access Control (ABAC) Firestore Security Rules (`rules_version = '2'`).
- **Intermediate Representation**: `firebase-blueprint.json`.

---

## 3. Database Schema

### `shops`
- `shopId`: Unique string ID
- `ownerUid`: Firebase Auth UID of shopkeeper
- `shopName`: Store business name (e.g. "Gupta Kirana & General Store")
- `ownerName`: Proprietor full name
- `phone`: 10-digit Indian mobile number
- `address`: Physical shop address
- `upiId`: Configured merchant VPA (e.g. `guptastore@okaxis`)
- `preferredLanguage`: `'hinglish'` | `'hindi'` | `'english'`
- `createdAt`: ISO 8601 Timestamp

### `customers`
- `customerId`: Unique string ID
- `shopId`: Scoped parent shop ID
- `name`: Customer full name
- `phone`: Normalized phone format (`+91XXXXXXXXXX`)
- `address`: Optional residence address
- `notes`: Customer notes
- `createdAt`: Timestamp
- `archivedAt`: Nullable timestamp (customers with history are archived, not deleted)

### `transactions` (Append-Only Ledger)
- `transactionId`: Unique ID
- `shopId`: Scoped parent shop ID
- `customerId`: Customer ID
- `type`: `'CREDIT'` (Udhaar) or `'PAYMENT'` (Jama)
- `amountPaise`: Integer paise (e.g. ₹500.00 = `50000`)
- `items`: Optional itemized list `[{ name, quantity, pricePaise }]`
- `paymentMethod`: `'CASH'` | `'UPI'` | `'BANK_TRANSFER'` | `'OTHER'`
- `transactionDate`: YYYY-MM-DD
- `createdAt`: Timestamp
- `createdBy`: Auth UID
- `referenceNumber`: Optional UTR / Bank Reference
- `status`: `'COMPLETED'` | `'REVERSED'`

### `auditLogs`
- `logId`: Unique ID
- `shopId`: Parent shop ID
- `actorUid`: Acting user UID
- `action`: Audit event tag
- `entityType`: `'CUSTOMER'` | `'TRANSACTION'` | `'SHOP'`
- `entityId`: Target resource ID
- `timestamp`: Timestamp

---

## 4. Financial Calculation Engine

### FIFO Aging Algorithm
When a customer pays a partial payment, the payment is attributed against the oldest unpaid credit entries first in chronological order. The earliest credit record that remains partially or fully unpaid determines the true **Oldest Unpaid Date** and **Days Pending**.

### Aging Categories
- **0–7 days**: Recent credit
- **8–15 days**: Standard billing cycle
- **16–30 days**: Pending follow-up
- **30+ days (Red Alert)**: Critical overdue debt requiring immediate reminder

---

## 5. WhatsApp & UPI Specifications

### WhatsApp URL Scheme
Encoded RFC 3986 URL:
```
https://wa.me/919876543210?text=Namaste%20Rahul%20ji!%20...
```

### UPI Deep Link Format
```
upi://pay?pa=shopupi@bank&pn=Gupta%20Kirana&am=250.00&cu=INR&tn=Khata%20Payment
```

---

## 6. Verification Test Scenarios (16 Core Scenarios)

UdhaarDesk includes an automated in-browser verification test runner (accessible via **"Verify Scenarios"** in the top navbar) that validates:

1. **New Shop Owner Registration**: Validates shop profile creation and UID scoping.
2. **Login & Session Management**: Preserves isolated shop owner access.
3. **Customer Registration**: Validates 10-digit Indian phone normalization and duplicate prevention.
4. **New Udhaar Transaction**: Validates positive amount check and itemized grocery breakdown.
5. **Partial Payment Recording**: Accurately decreases outstanding balance.
6. **Full Payment Recording**: Brings net outstanding balance to exact ₹0.
7. **Outstanding Balance Derivation**: Validates that ledger entries are the single source of truth.
8. **WhatsApp Bill Generation**: Formats readable bill message with item breakdown.
9. **UPI Payment Link Generation**: Builds valid NPCI UPI intent URI and validates VPA format.
10. **Overdue Customer Categorization**: Accurately flags >30 day aged debts in bold red.
11. **Zero-Balance Exclusion**: Automatically excludes customers with ₹0 balance from reminders.
12. **Weekly & Daily Collection Reports**: Distinguishes cash received from outstanding credit.
13. **CSV Ledger Export**: Escapes commas and quotes for standard accounting imports.
14. **Cross-Shop Tenant Isolation**: Enforces Master Gate security rules blocking unauthorized reads.
15. **Reversal Audit Trail**: Reverses erroneous entries with explicit audit reasons instead of destructive deletions.
16. **Duplicate Submission Protection**: Debounces and guards against double-tap mutations.

---

## 7. Google Drive Khata Backup & Restore Integration

UdhaarDesk integrates with Google Drive APIs using client-side OAuth token acquisition:
- **Dedicated Folder**: Automatically creates and manages an `UdhaarDesk Khata Backups` folder in the shopkeeper's Google Drive.
- **Snapshot Uploads**: Exports a timestamped JSON snapshot and embedded CSV ledger to Google Drive.
- **Historical Backups**: View, download, open directly in Google Drive, or restore previous backups.
- **Mandatory User Confirmation**: Deletions and data restores require explicit confirmation prompts before execution to prevent accidental data loss.
- **In-Memory Token Cache**: Access tokens are stored purely in memory and cleared on signout, adhering to security guidelines.

---

## 8. Firebase Setup & Deployment Instructions

### A. Deploy to Firebase
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and select project:
   ```bash
   firebase login
   firebase use <your-firebase-project-id>
   ```
3. Deploy Firestore rules and indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
4. Build and deploy frontend:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### B. Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

---

## 8. Security Considerations & Known Limitations

- **Client Intent Link Notice**: Launching a `upi://pay` link or scanning a QR code does not guarantee money was transferred. Shop owners must confirm credit via bank SMS or soundbox before marking payment received.
- **WhatsApp API Boundary**: Click-to-chat links use standard `wa.me` protocols and do not require server-side Twilio/Meta API tokens; message delivery depends on the shopkeeper pressing send in their WhatsApp app.
- **Append-Only Immutability**: Financial transactions cannot be silently edited or deleted. Corrections must be handled via formal reversal records with audit explanations.
