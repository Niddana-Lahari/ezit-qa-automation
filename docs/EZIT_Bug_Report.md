# 🐛 EZIT Guardian – Bug Report

**Project:** Ezit Guardian Web App
**Environment:** Dev (`dev1-fe.ezit.club`) / Prod (`app.ezit.club`)
**Prepared By:** QA Team
**Last Updated:** 2026-10-16

---

## Bug 1 — Coverage Options 500 Error

- **URL:** `dev1-fe.ezit.club/coverage`
- **What Failed:** `GET /api/v1/coverage/options` returned **500 Internal Server Error**
- **UI Impact:** The dropdowns (**Select Org / Bank**, **Account Type**) fail to load. The user **cannot calculate coverage** at all — the entire coverage page is broken.
- **Root Cause:** `VertexGeminiService.php` or missing **Google Cloud / Vertex AI** classes crash the coverage backend on Dev. The Laravel service class is not instantiated correctly in the Dev environment.
- **Steps to Reproduce:**
  1. Login with valid credentials on `dev1-fe.ezit.club`
  2. Navigate to `/coverage`
  3. Observe the dropdown fields — they fail to populate
  4. Open DevTools → Network tab → find `GET /api/v1/coverage/options` → Status: 500
- **Expected:** Dropdowns load with Org/Bank list and Account Type options; user can fill and calculate coverage
- **Verdict:** 🚨 **High Severity — Backend Bug on Dev**

---

## Bug 2 — Free Trial Subscription Submit 500 Error

- **URL:** `dev1-fe.ezit.club/subscription-plans`
- **What Failed:** `POST /api/v1/free-subscription-plan` returned **500 Internal Server Error**
- **UI Impact:** Clicking "Start trial for 30 days" shows a red error toast or silently fails. User **cannot activate free trial** — onboarding is completely blocked.
- **Root Cause:** `ZohoCRM.php:157` throws an uncaught exception during CRM sync after plan activation. The backend crashes trying to push user data to Zoho CRM on Dev.
- **Steps to Reproduce:**
  1. Complete registration and M-PIN setup
  2. Navigate to `/subscription-plans`
  3. Click "Start trial for 30 days"
  4. Open DevTools → Network tab → `POST /api/v1/free-subscription-plan` → Status: 500
- **Expected:** Free trial activated; user redirected to next onboarding step (Choose Plan / KYC)
- **Verdict:** 🚨 **High Severity / Blocker — Backend Bug on Dev**

---

## Bug 3 — M-PIN Success Skips Plan Selection (Goes Directly to KYC)

- **URL:** `dev1-fe.ezit.club/customer/mpin-success`
- **What Failed:** After setting M-PIN, the app **skips Step 2 (Choose a Plan)** and jumps directly to **Step 3 (KYC Verification)**
- **UI Impact:** Users never see the plan selection screen. They go M-PIN → KYC, bypassing subscription entirely. This breaks the onboarding funnel.
- **Root Cause:** `mpin-success.js` has a **hardcoded `router.push('/kyc-verification')`** instead of routing to `/subscription-plans` first.
- **Steps to Reproduce:**
  1. Register a new user
  2. Complete M-PIN setup on `/customer/set-mpin`
  3. Observe: app goes directly to `/kyc-verification`
  4. Step 2 (Plan Selection) is never shown
- **Expected:** M-PIN success → `/subscription-plans` (Step 2) → `/kyc-verification` (Step 3)
- **Verdict:** 🚨 **High Severity / Blocker — Frontend Routing Bug**

---

## Bug 4 — Personal Details: FullName Field Disabled + No Validation Indicators

- **URL:** `dev1-fe.ezit.club/customer/edit-personal-details`
- **What Failed:**
  1. `FullName` input has `disabled={true}` hardcoded — user cannot edit name even when a "Name mismatch" prompt appears
  2. Required fields (State, City, Pincode, Address) have no asterisk indicator and no inline validation — form submits then throws backend 400 error toasts unexpectedly
- **UI Impact:** Users who have name mismatches are **permanently stuck** — cannot correct their name. Users also get sudden backend validation errors with no frontend warning.
- **Root Cause:**
  - `FullName` input: `disabled={true}` hardcoded in JSX
  - Inline validation rules for required fields are commented out in the form schema
- **Steps to Reproduce:**
  1. Login and navigate to `/customer/edit-personal-details`
  2. Try clicking the Full Name field — it is unclickable/grayed out
  3. Leave State/City/Pincode empty and click Submit
  4. Observe: red error toast from backend 400 with no prior frontend warning
- **Expected:** FullName should be editable; required fields should show asterisk and inline validation before submit
- **Verdict:** 🔴 **High Severity / Blocker — Frontend Bug (Onboarding)**

---

## Bug 5 — Bill Details Showing Wrong Customer Name (N/A) and Wrong Bill Date

- **URL:** `dev1-fe.ezit.club` → Bill Details section
- **What Failed:**
  - Customer Name displayed as N/A instead of the logged-in user's name
  - Bill Date also shows incorrect or N/A value
- **UI Impact:** User sees incorrect billing identity. On Dev, sandbox mock data (e.g., "Joseph Miller") is returned instead of real user data. On Prod, user is incorrectly shown as "not postpaid."
- **Root Cause:**
  - Dev environment bill API returns mock/sandbox test data (not real user data)
  - Frontend does not fall back gracefully when API returns null for name/date fields — renders N/A instead
- **Steps to Reproduce:**
  1. Login with a valid postpaid account
  2. Navigate to Bill Details
  3. Observe: Customer Name = N/A; Bill Date = N/A or wrong
  4. Check DevTools: name shown is a mock name like "Joseph Miller" (Dev only)
- **Expected:** Customer Name = logged-in user's real name; Bill Date = current billing cycle date
- **Verdict:** 🟠 **Medium Severity — Data Mismatch Bug (Dev: Mock Data / Prod: Missing API field)**

---

## Bug 6 — Doc AI: 500 Error on Open

- **URL:** `dev1-fe.ezit.club` → Doc AI section
- **What Failed:** Opening Doc AI returns a **500 Internal Server Error**
- **UI Impact:** The entire Doc AI feature is inaccessible. Users cannot upload, organize, or analyze documents.
- **Root Cause:** Backend service supporting Doc AI (likely a document processing / AI endpoint) is not running or misconfigured on Dev.
- **Steps to Reproduce:**
  1. Login with valid credentials
  2. Navigate to Doc AI from the dashboard or menu
  3. Observe: 500 error immediately on page load
  4. Check DevTools → Network tab for the failing API call
- **Expected:** Doc AI loads successfully; user can upload and organize documents
- **Verdict:** 🚨 **High Severity — Backend Bug on Dev**

---

## Bug 7 — Nominee Update Failing

- **URL:** `dev1-fe.ezit.club/primary-nominee` or `/secondary-nominee`
- **What Failed:** Clicking Submit on the nominee form shows an error or the update does not save
- **UI Impact:** User **cannot add or update nominee** details — a critical legal/financial feature of the app.
- **Root Cause:** Possible API validation mismatch, missing required fields in payload, or backend returning error on `PUT /api/v1/nominee`.
- **Steps to Reproduce:**
  1. Login and navigate to Nominee section
  2. Fill in all nominee details (Name, Relationship, DOB, etc.)
  3. Click Submit / Update
  4. Observe: error toast or no success confirmation
- **Expected:** Nominee saved successfully; success toast shown; nominee name reflected in profile
- **Verdict:** 🟠 **Medium-High Severity — Backend/Frontend Integration Bug**

---

## Bug 8 — File Upload / Download / Organize with AI Failing

- **URL:** `dev1-fe.ezit.club` → Doc AI / File Manager
- **What Failed:** Upload file, Download file, and Organize with AI all return errors
- **UI Impact:** Core document management features are completely non-functional on Dev.
- **Root Cause:** AI/document processing backend endpoints not available or returning errors (related to Bug 6 — Doc AI 500).
- **Steps to Reproduce:**
  1. Login and navigate to the file/document management section
  2. Try to upload a file → error
  3. Try to download an existing file → error
  4. Try Organize with AI → error
- **Expected:** Files upload/download successfully; AI organization processes and categorizes documents
- **Verdict:** 🚨 **High Severity — Backend/Service Bug on Dev**

---

## Bug 9 — Proceed to Payment: Error on Click

- **URL:** `dev1-fe.ezit.club` → Payment / Checkout
- **What Failed:** Clicking "Proceed to Payment" returns an error (500 or unhandled UI error)
- **UI Impact:** User **cannot complete payment** — subscription purchase is blocked entirely.
- **Root Cause:** Likely Razorpay order creation API failing on backend, or missing payment gateway configuration on Dev environment.
- **Steps to Reproduce:**
  1. Login and navigate to plan selection
  2. Select a plan
  3. Click "Proceed to Payment"
  4. Observe: error toast / 500 / UI stuck with spinner
  5. Open DevTools → Network tab → check `POST /api/v1/payment` or similar endpoint
- **Expected:** Razorpay payment modal opens with correct amount; user can complete payment
- **Verdict:** 🚨 **High Severity / Blocker — Backend Bug (Payment Gateway)**

---

## Bug 10 — Slot Booking: Error on Confirm

- **URL:** `dev1-fe.ezit.club` → Book a Slot / Schedule Service
- **What Failed:** Clicking "Book Slot" or "Confirm" returns an error
- **UI Impact:** User **cannot book service appointments** — a key feature for premium subscribers.
- **Root Cause:** Slot booking API (`POST /api/v1/slots` or `/api/v1/appointments`) failing — possible missing data, auth token issue, or service unavailable on Dev.
- **Steps to Reproduce:**
  1. Login with valid credentials (with active subscription)
  2. Navigate to slot booking
  3. Select a date and time slot
  4. Click Confirm / Book Slot
  5. Observe: error toast or no confirmation received
- **Expected:** Slot booked successfully; confirmation screen shows date, time, and booking reference ID
- **Verdict:** 🔴 **High Severity — Backend/API Bug on Dev**

---

## Bug Summary Table

| # | Bug Title | URL / Module | Severity | Environment | Status |
|---|-----------|--------------|----------|-------------|--------|
| 1 | Coverage Options 500 Error | `/coverage` | 🚨 High | Dev | Open |
| 2 | Free Trial Submit 500 Error | `/subscription-plans` | 🚨 High / Blocker | Dev | Open |
| 3 | M-PIN skips Plan Selection to KYC | `/customer/mpin-success` | 🚨 High / Blocker | Dev + Prod | Open |
| 4 | Personal Details: Name locked + no validation | `/customer/edit-personal-details` | 🔴 High / Blocker | Dev + Prod | Open |
| 5 | Bill Details: Name N/A + Wrong Data | Bill Details section | 🟠 Medium | Dev + Prod | Open |
| 6 | Doc AI: 500 Error on Open | Doc AI section | 🚨 High | Dev | Open |
| 7 | Nominee Update Failing | `/primary-nominee` | 🟠 Medium-High | Dev | Open |
| 8 | File Upload/Download/AI Organize Failing | Doc AI / File Manager | 🚨 High | Dev | Open |
| 9 | Proceed to Payment: 500 / Error | Checkout / Payment | 🚨 High / Blocker | Dev | Open |
| 10 | Slot Booking: Error on Confirm | Book Slot / Schedule | 🔴 High | Dev | Open |

---

Legend:
- 🚨 High Severity / Blocker — Stops user from completing core flow
- 🔴 High Severity — Major feature broken
- 🟠 Medium Severity — Feature works partially but data is wrong
