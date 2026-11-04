# EZIT Platform - Web Test Automation Scripts Catalog & Documentation

**Repository:** [github.com/Niddana-Lahari/ezit-qa-automation](https://github.com/Niddana-Lahari/ezit-qa-automation)  
**Branch:** `testing-ezit`  
**Test Framework:** Playwright (TypeScript)  
**Target Application:** EZIT Web Application (`DEV` & `PROD`)  
**Execution Engine:** Microsoft Edge / Chromium Headed & Headless  

---

## 1. Quick Start & Execution Instructions

1. **Clone & Install Dependencies:**
   ```bash
   cd ezit-qa-automation/web
   npm install
   ```

2. **Configure Environment Variables (`web/.env`):**
   ```env
   TEST_MOBILE=6300558941
   TEST_PASSWORD=Lahari@1234
   TEST_MPIN=1234
   ```

3. **Run All Web Tests:**
   ```bash
   npx playwright test --project=dev
   ```

4. **Run in Interactive UI Mode:**
   ```bash
   npx playwright test --ui
   ```

---

## 2. Web Test Automation Scripts Catalog (By Module)

### Module 1: Subscription & Pricing Plans
Covers pricing tiers, corporate verification, and end-to-end sandbox Net Banking payments.

| Test Case ID | Test Scenario | File & Line Link | Terminal Execution Command |
| :--- | :--- | :--- | :--- |
| **TC_PLAN_01** | View current active plan details on Profile | [`subscriptionPlans.spec.ts#L100`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/subscription/subscriptionPlans.spec.ts#L100) | `npx playwright test tests/subscription/subscriptionPlans.spec.ts -g "TC_PLAN_01"` |
| **TC_PLAN_02** | Corporate Plan email & employee ID verification flow | [`subscriptionPlans.spec.ts#L136`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/subscription/subscriptionPlans.spec.ts#L136) | `npx playwright test tests/subscription/subscriptionPlans.spec.ts -g "TC_PLAN_02"` |
| **TC_PLAN_03** | Verify available subscription tiers & pricing cards | [`subscriptionPlans.spec.ts#L221`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/subscription/subscriptionPlans.spec.ts#L221) | `npx playwright test tests/subscription/subscriptionPlans.spec.ts -g "TC_PLAN_03"` |
| **TC_PLAN_04** | Upgrade to Prime Plan via WorldLine Net Banking (DEV) / Dismiss (PROD) | [`subscriptionPlans.spec.ts#L245`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/subscription/subscriptionPlans.spec.ts#L245) | `npx playwright test tests/subscription/subscriptionPlans.spec.ts -g "TC_PLAN_04" --project=dev --headed` |
| **TC_PLAN_05** | Upgrade to Basic Annual Plan via Net Banking (DEV) / Dismiss (PROD) | [`subscriptionPlans.spec.ts#L340`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/subscription/subscriptionPlans.spec.ts#L340) | `npx playwright test tests/subscription/subscriptionPlans.spec.ts -g "TC_PLAN_05" --project=dev --headed` |
| **TC_PLAN_06** | Upgrade to Basic Plan via Net Banking (DEV) / Dismiss (PROD) | [`subscriptionPlans.spec.ts#L430`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/subscription/subscriptionPlans.spec.ts#L430) | `npx playwright test tests/subscription/subscriptionPlans.spec.ts -g "TC_PLAN_06" --project=dev --headed` |

---

### Module 2: Services Module
Covers end-to-end service requests, appointments, document uploads, and payment checkout.

| Test Case ID | Test Scenario | File & Line Link | Terminal Execution Command |
| :--- | :--- | :--- | :--- |
| **TC_SRV_SPEC_01** | Navigate and select Specialised Services | [`specialisedServices.spec.ts#L96`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/services/specialisedServices.spec.ts#L96) | `npx playwright test tests/services/specialisedServices.spec.ts -g "TC_SRV_SPEC_01"` |
| **TC_SRV_SPEC_02** | Specialised Service request creation & Net Banking payment | [`specialisedServices.spec.ts#L189`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/services/specialisedServices.spec.ts#L189) | `npx playwright test tests/services/specialisedServices.spec.ts -g "TC_SRV_SPEC_02" --headed` |
| **TC_SRV_QUERY_02**| Raise a Query creation with PDF document upload & checkout | [`raiseQuery.spec.ts#L54`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/services/raiseQuery.spec.ts#L54) | `npx playwright test tests/services/raiseQuery.spec.ts -g "TC_SRV_QUERY_02" --headed` |
| **TC_SRV_CONS_02** | Book a Consultation appointment & Net Banking checkout | [`bookConsultation.spec.ts#L61`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/services/bookConsultation.spec.ts#L61) | `npx playwright test tests/services/bookConsultation.spec.ts -g "TC_SRV_CONS_02" --headed` |
| **TC_SRV_CUST_01** | Custom Request creation & submission | [`customRequest.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/services/customRequest.spec.ts) | `npx playwright test tests/services/customRequest.spec.ts` |

---

### Module 3: Authentication & Security Module
Covers customer sign-in, sign-out, password creation/reset, and M-PIN management.

| Test Case ID | Test Scenario | File Link | Terminal Execution Command |
| :--- | :--- | :--- | :--- |
| **TC_AUTH_01** | Customer Login with valid credentials | [`login.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/auth/login.spec.ts) | `npx playwright test tests/auth/login.spec.ts` |
| **TC_AUTH_02** | Customer Logout verification | [`logout.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/auth/logout.spec.ts) | `npx playwright test tests/auth/logout.spec.ts` |
| **TC_RESET_MPIN_01**| Verify Reset M-PIN page navigation and screen elements | [`resetMpin.spec.ts#L40`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/profile/resetMpin.spec.ts#L40) | `npx playwright test tests/profile/resetMpin.spec.ts -g "TC_RESET_MPIN_01"` |
| **TC_RESET_MPIN_02**| Reset M-PIN flow with live SMS OTP verification | [`resetMpin.spec.ts#L82`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/profile/resetMpin.spec.ts#L82) | `npx playwright test tests/profile/resetMpin.spec.ts -g "TC_RESET_MPIN_MANUAL_OTP" --headed` |
| **TC_RESET_PWD_01** | Reset Password flow validation | [`resetPassword.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/profile/resetPassword.spec.ts) | `npx playwright test tests/profile/resetPassword.spec.ts` |

---

### Module 4: Secure Vault & Portfolio Module
Covers creation and verification of financial and physical assets in the vault.

| Test Case ID | Test Scenario | File Link | Terminal Execution Command |
| :--- | :--- | :--- | :--- |
| **TC_VAULT_01** | Asset creation and verification | [`assetCreation.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/vault/assetCreation.spec.ts) | `npx playwright test tests/vault/assetCreation.spec.ts` |
| **TC_VAULT_02** | Liability creation and verification | [`liabilityCreation.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/vault/liabilityCreation.spec.ts) | `npx playwright test tests/vault/liabilityCreation.spec.ts` |
| **TC_VAULT_03** | Transport asset creation and verification | [`transportCreation.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/vault/transportCreation.spec.ts) | `npx playwright test tests/vault/transportCreation.spec.ts` |
| **TC_VAULT_04** | Appliance asset creation and verification | [`applianceCreation.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/vault/applianceCreation.spec.ts) | `npx playwright test tests/vault/applianceCreation.spec.ts` |

---

### Module 5: Bill Pay Module
Covers utility bill management and service provider selection.

| Test Case ID | Test Scenario | File Link | Terminal Execution Command |
| :--- | :--- | :--- | :--- |
| **TC_BILL_01** | View Electricity and Water bill tabs | [`billTabs.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/billpay/billTabs.spec.ts) | `npx playwright test tests/billpay/billTabs.spec.ts` |
| **TC_BILL_02** | Bill payment flow & provider navigation | [`billPay.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/billpay/billPay.spec.ts) | `npx playwright test tests/billpay/billPay.spec.ts` |

---

### Module 6: Profile & Nominees Module
Covers user profile settings, account settings, and nominee assignments.

| Test Case ID | Test Scenario | File Link | Terminal Execution Command |
| :--- | :--- | :--- | :--- |
| **TC_PROF_01** | View Profile details & General Information | [`generalInformation.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/profile/generalInformation.spec.ts) | `npx playwright test tests/profile/generalInformation.spec.ts` |
| **TC_PROF_02** | Nominee management & verification | [`nominees.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/profile/nominees.spec.ts) | `npx playwright test tests/profile/nominees.spec.ts` |
| **TC_PROF_03** | Delete Account modal & validation flow | [`deleteAccount.spec.ts`](https://github.com/Niddana-Lahari/ezit-qa-automation/blob/testing-ezit/web/tests/profile/deleteAccount.spec.ts) | `npx playwright test tests/profile/deleteAccount.spec.ts` |
