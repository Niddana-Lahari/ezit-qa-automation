# 🐛 EZIT Guardian – Bug Report (Services Module)

**Project:** Ezit Guardian Web App
**Environment:** Dev (`dev1-fe.ezit.club`)
**Prepared By:** QA Team
**Last Updated:** 2026-10-16

---

## Bug 1 — Custom Request Submit: 500 Internal Server Error

- **Screenshot:** `dev1-fe.ezit.club` → Services → Custom Request
- **What Failed:** `POST /api/v1/create-vas-request` returned **500 Internal Server Error**
- **UI Impact:** The user fills in all details (Service Type: Accounting-Taxation, Title, Query Details, Related Document) and submits. The form **does not save** — request is never created. User is stuck on the form with no success feedback.
- **Root Cause:** Backend `/api/v1/create-vas-request` endpoint crashes on Dev — likely missing service handler, file upload processing failure (empty.pdf uploaded), or unhandled exception in the VAS (Value Added Services) controller.
- **Steps to Reproduce:**
  1. Login with valid credentials on `dev1-fe.ezit.club`
  2. Navigate to **Services → Custom Request**
  3. Select Service Type: **Accounting-Taxation**
  4. Enter Title: `account` and Query Details: `account`
  5. Upload a related document (e.g., `empty.pdf`)
  6. Click **Submit**
  7. Open DevTools → Network tab → `POST /api/v1/create-vas-request` → Status: **500**
- **Expected:** Custom request saved successfully; user sees confirmation or request reference ID
- **Verdict:** 🚨 **High Severity — Backend Bug on Dev**

---

## Bug 2 — Specialised Services: Save Billing Address 500 Error

- **Screenshot:** `dev1-fe.ezit.club` → Services → Specialised Services → Checkout
- **What Failed:** `POST /api/v1/save-billing-address` returned **500 Internal Server Error**
- **UI Impact:** Red error toast appears: **"An error occurred while saving billing address."** User sees Net Payable: ₹1249.62 but **cannot proceed to checkout** — payment flow is completely blocked. EZ Coins section shows 0 Coins.
- **Root Cause:** Backend `/api/v1/save-billing-address` endpoint fails on Dev — likely missing required address fields in request payload, DB validation failure, or unhandled null reference in the billing address handler.
- **Steps to Reproduce:**
  1. Login with valid credentials on `dev1-fe.ezit.club`
  2. Navigate to **Services → Specialised Services**
  3. Select a service and proceed to the payment/billing screen
  4. Attempt to save billing address or click **Proceed to Checkout**
  5. Observe: red toast — "An error occurred while saving billing address."
  6. Open DevTools → Network tab → `POST /api/v1/save-billing-address` → Status: **500**
- **Expected:** Billing address saved; user proceeds to payment gateway (Razorpay/checkout)
- **Verdict:** 🚨 **High Severity / Blocker — Backend Bug on Dev (Payment Flow Blocked)**

---

## Bug 3 — Book Consultation: Slots Not Available + Calendar Days 500 Error

- **Screenshot:** `dev1-fe.ezit.club` → Services → Book Consultation
- **What Failed:** `POST /api/v1/calendar-days` returned **500 Internal Server Error**
- **UI Impact:** The **Book Consultation** page shows a red warning icon with the message: **"Currently slots are not available"** — user cannot book any consultation date or time. The Continue button does nothing useful.
- **Root Cause:** `/api/v1/calendar-days` endpoint fails on Dev — the calendar/slot availability service is likely not configured or the consultant availability data is missing in the Dev database. The 500 error prevents slots from being fetched and rendered.
- **Steps to Reproduce:**
  1. Login with valid credentials on `dev1-fe.ezit.club`
  2. Navigate to **Services → Book Consultation**
  3. Reach the **"Book date and slot"** screen (Consultation details)
  4. Observe: "Currently slots are not available" message
  5. Open DevTools → Network tab → `POST /api/v1/calendar-days` → Status: **500**
- **Expected:** Available consultation dates and time slots are displayed; user can pick a slot and confirm booking
- **Verdict:** 🚨 **High Severity — Backend Bug on Dev (Slot Service Not Working)**

---

## Bug 4 — Raise a Query: Proceed to Checkout — Generate Payment 500 Error

- **Screenshot:** `dev1-fe.ezit.club` → Services → Raise a Query → Checkout
- **What Failed:** `POST /api/v1/generate-payment` returned **500 Internal Server Error**
- **UI Impact:** User reaches the checkout screen for "Raise a Query" service (Net Payable visible, EZ Coins: 0). Clicking **"Proceed to checkout"** fails silently or shows error — **payment cannot be initiated**. The `calendar-days` endpoint also shows 500 in this flow.
- **Root Cause:** `/api/v1/generate-payment` endpoint crashes on Dev — Razorpay order creation is failing (missing API keys in Dev config, or unhandled exception in payment order generation). Additionally, `/api/v1/calendar-days` 500 indicates the slot booking dependency in this flow also fails.
- **Steps to Reproduce:**
  1. Login with valid credentials on `dev1-fe.ezit.club`
  2. Navigate to **Services → Raise a Query**
  3. Fill in query details and proceed to checkout
  4. Observe: EZ Coins = 0, "EZ coins redemption is applicable only for paid plans"
  5. Click **Proceed to checkout**
  6. Open DevTools → Network tab → `POST /api/v1/generate-payment` → Status: **500**
- **Expected:** Payment order generated; Razorpay modal opens with correct amount; user completes payment
- **Verdict:** 🚨 **High Severity / Blocker — Backend Bug on Dev (Payment Gateway Not Configured)**

---

## Bug Summary Table

| # | Bug Title | URL / API | Severity | Environment | Status |
|---|-----------|-----------|----------|-------------|--------|
| 1 | Custom Request Submit 500 | `POST /api/v1/create-vas-request` | 🚨 High | Dev | Open |
| 2 | Save Billing Address 500 | `POST /api/v1/save-billing-address` | 🚨 High / Blocker | Dev | Open |
| 3 | Book Consultation: Slots Not Available + Calendar 500 | `POST /api/v1/calendar-days` | 🚨 High | Dev | Open |
| 4 | Raise a Query: Generate Payment 500 | `POST /api/v1/generate-payment` | 🚨 High / Blocker | Dev | Open |

---

Legend:
- 🚨 High Severity / Blocker — Stops user from completing core flow
- 🔴 High Severity — Major feature broken
- 🟠 Medium Severity — Feature works partially but data is wrong
