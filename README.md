# EZIT QA Automation Suite

Unified test automation repository for **EZIT** covering Web.

```text
ezit-qa-automation/
├── web/              # Web Automation using Playwright & TypeScript
```

---

## 1. Web Automation (Playwright + TypeScript)

Automated end-to-end tests for the EZIT web portal (`https://dev1-fe.ezit.club`).

### Getting Started:
```bash
cd web
npm install
npx playwright install
```

### Configuration:
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

#### OTP Modes in `.env`:
- **Stage Automated Bypass:** `STAGE_USE_BYPASS_OTP="true"` (Auto-fills `123456` on stage).
- **Skip Manual OTP:** `SKIP_MANUAL_OTP="true"` (Verifies OTP inputs render properly and marks test passed/skipped without waiting).
- **Manual SMS OTP Entry:** Set `SKIP_MANUAL_OTP="false"`.

#### 📱 How to Enter Manual SMS OTP during Tests:
1. When running in headed mode (`--headed`) on DEV or PROD with `SKIP_MANUAL_OTP="false"`, the browser pauses automatically at the OTP screen.
2. Type your 6-digit real SMS OTP into the input boxes in the browser.
3. Click the **Resume button (▶)** on the Playwright inspector toolbar (or press `F8` on your keyboard).
4. The test will automatically resume and complete the remaining steps!

### Run Tests:
```bash
# Run specific module with automatic HTML report (1 to 22)
node run_module_report.js 1 stage --headed
node run_module_report.js 1 dev --headed

# Run all tests
npx playwright test

# Run interactive UI mode
npx playwright test --ui

# View HTML report
npx playwright show-report

# Typecheck TypeScript files
npm run typecheck
```

---

## Structure & Architecture
- **Web (`web/`)**: Clean separation between test files (`tests/*.spec.ts`) and reusable TypeScript helper functions (`utils/*.ts`).
