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

## Structure & Architecture
- **Web (`web/`)**: Clean separation between test files (`tests/*.spec.ts`) and reusable TypeScript helper functions (`utils/*.ts`).
