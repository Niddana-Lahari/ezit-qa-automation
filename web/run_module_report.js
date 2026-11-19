const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Usage: node run_module_report.js <module-number-or-name> <env>
const targetInput = process.argv[2] || 'all';
const env = process.argv[3] || 'dev';

const MODULES = [
  { id: '1', key: 'register', name: '1. Register', file: 'tests/register/register.spec.ts' },
  { id: '2', key: 'login', name: '2. Login', file: 'tests/auth/login.spec.ts' },
  { id: '3', key: 'delete_account', name: '3. Delete Account', file: 'tests/profile/deleteAccount.spec.ts' },
  { id: '4', key: 'secure_vault', name: '4. Secure Vault', file: 'tests/onboarding/steps_vault.spec.ts' },
  { id: '5', key: 'docai', name: '5. Doc AI', file: 'tests/docai/docai.spec.ts' },
  { id: '6', key: 'coverage', name: '6. Complementary Coverage', file: 'tests/coverage/coverage.spec.ts' },
  { id: '7', key: 'asset_creation', name: '7. Asset Creation', file: 'tests/vault/assetCreation.spec.ts' },
  { id: '8', key: 'appliance_creation', name: '8. Appliance Creation', file: 'tests/vault/applianceCreation.spec.ts' },
  { id: '9', key: 'liability_creation', name: '9. Liability Creation', file: 'tests/vault/liabilityCreation.spec.ts' },
  { id: '10', key: 'transport_creation', name: '10. Transport Creation', file: 'tests/vault/transportCreation.spec.ts' },
  { id: '11', key: 'billpay', name: '11. Bill Pay', file: 'tests/billpay/billPay.spec.ts' },
  { id: '12', key: 'profile', name: '12. Profile', file: 'tests/profile/generalInformation.spec.ts' },
  { id: '13', key: 'nominee', name: '13. Nominees', file: 'tests/profile/nominees.spec.ts' },
  { id: '14', key: 'reset_password', name: '14. Reset Password', file: 'tests/profile/resetPassword.spec.ts' },
  { id: '15', key: 'reset_mpin', name: '15. Reset M-PIN', file: 'tests/profile/resetMpin.spec.ts' },
  { id: '16', key: 'plans', name: '16. Plan Details & Subscription', file: 'tests/subscription/subscriptionPlans.spec.ts' },
  { id: '17', key: 'services', name: '17. Services (All)', file: 'tests/services/' },
  { id: '18', key: 'custom_request', name: '18. Services - Custom Request', file: 'tests/services/customRequest.spec.ts' },
  { id: '19', key: 'book_consultation', name: '19. Services - Book Consultation', file: 'tests/services/bookConsultation.spec.ts' },
  { id: '20', key: 'raise_query', name: '20. Services - Raise Query', file: 'tests/services/raiseQuery.spec.ts' },
  { id: '21', key: 'specialised_services', name: '21. Services - Specialised Services', file: 'tests/services/specialisedServices.spec.ts' },
  { id: '22', key: 'logout', name: '22. Logout', file: 'tests/zzz_logout.spec.ts' },
];

function runSingle(mod, targetEnv) {
  const reportFolder = path.join(__dirname, 'reports', targetEnv, `${mod.id}_${mod.key}`);
  fs.mkdirSync(reportFolder, { recursive: true });

  console.log(`\n===============================================================`);
  console.log(` ▶ RUNNING: ${mod.name} [${targetEnv.toUpperCase()}]`);
  console.log(` ▶ FILE:    ${mod.file}`);
  console.log(` ▶ REPORT:  reports/${targetEnv}/${mod.id}_${mod.key}/index.html`);
  console.log(`===============================================================\n`);

  // If running on stage, or with --headed, do NOT filter out OTP so tests run automatically with bypass OTP 123456
  const hasHeaded = process.argv.some(arg => arg.toLowerCase().includes('headed'));
  const isStage = targetEnv.toLowerCase() === 'stage';
  const grepFilter = (mod.id === '3' || mod.id === '1' || hasHeaded || isStage) ? '' : '--grep-invert "OTP"';
  const isHeaded = hasHeaded ? '--headed' : '';
  const cmd = `npx playwright test ${mod.file} --project=${targetEnv} --reporter=html ${grepFilter} ${isHeaded}`.trim();

  try {
    execSync(cmd, {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        PLAYWRIGHT_HTML_REPORT: reportFolder,
      },
    });
    console.log(`\n [SUCCESS] ${mod.name} passed completely! Report saved at ${reportFolder}\\index.html\n`);
    // Automatically open report in browser for single module runs
    if (targetInput !== 'all') {
      try {
        const openCmd = process.platform === 'win32' ? `start "" "${reportFolder}\\index.html"` : `open "${reportFolder}/index.html"`;
        execSync(openCmd);
      } catch (e) {}
    }
  } catch (err) {
    console.log(`\n [FINISHED] ${mod.name} finished. Check report at ${reportFolder}\\index.html\n`);
    if (targetInput !== 'all') {
      try {
        const openCmd = process.platform === 'win32' ? `start "" "${reportFolder}\\index.html"` : `open "${reportFolder}/index.html"`;
        execSync(openCmd);
      } catch (e) {}
    }
  }
}

if (targetInput === 'all') {
  console.log(`\nRunning all ${MODULES.length} modules sequentially for [${env.toUpperCase()}]...\n`);
  for (const m of MODULES) {
    runSingle(m, env);
  }
} else {
  const match = MODULES.find(m => m.id === targetInput || m.key.toLowerCase() === targetInput.toLowerCase());
  if (!match) {
    console.error(`Unknown module "${targetInput}".`);
    console.log(`Available modules (1 to ${MODULES.length}):\n` + MODULES.map(m => `  ${m.id}. ${m.key} (${m.name})`).join('\n'));
    process.exit(1);
  }
  runSingle(match, env);
}
