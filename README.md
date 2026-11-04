# EZIT QA Automation Suite

Unified test automation repository for **EZIT** covering both Web and Mobile platforms.

```text
ezit-qa-automation/
├── web/              # Web Automation using Playwright & TypeScript
└── mobile/           # Mobile Automation using Maestro for Flutter app
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

### Run Tests:
```bash
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

## 2. Mobile Automation (Maestro + Flutter)

Automated UI flows for the EZIT Flutter mobile application.

### Getting Started:
Ensure [Maestro](https://maestro.mobile.dev/) is installed and an Android emulator or iOS simulator is running.

```bash
cd mobile
```

### Run Flows:
```bash
# Run customer authentication flow
maestro test flows/auth/customer_login.yaml

# Run nominee authentication flow
maestro test flows/auth/nominee_login.yaml

# Run all auth flows
maestro test flows/auth/
```

---

## Structure & Architecture
- **Web (`web/`)**: Clean separation between test files (`tests/*.spec.ts`) and reusable TypeScript helper functions (`utils/*.ts`).
- **Mobile (`mobile/`)**: Declarative test flows written in YAML (`flows/**/*.yaml`) targeting the Flutter application ID.
