const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Usage: node run_module_report.js <module-number-or-name> <env>
// e.g.: node run_module_report.js 7 dev
//       node run_module_report.js asset_creation prod
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
  { id: '13', key: 'logout', name: '13. Logout', file: 'tests/zzz_logout.spec.ts' },
];

function runSingle(mod, targetEnv) {
  const reportFolder = path.join(__dirname, 'reports', targetEnv, `${mod.id}_${mod.key}`);
  fs.mkdirSync(reportFolder, { recursive: true });

  console.log(`\n===============================================================`);
  console.log(` ▶ RUNNING: ${mod.name} [${targetEnv.toUpperCase()}]`);
  console.log(` ▶ FILE:    ${mod.file}`);
  console.log(` ▶ REPORT:  reports/${targetEnv}/${mod.id}_${mod.key}/index.html`);
  console.log(`===============================================================\n`);

  const cmd = `npx playwright test ${mod.file} --project=${targetEnv} --reporter=html:${reportFolder} --grep-invert "OTP"`;

  try {
    execSync(cmd, { stdio: 'inherit', cwd: __dirname });
    console.log(`\n [SUCCESS] ${mod.name} passed completely! Report saved.\n`);
  } catch (err) {
    console.log(`\n [FINISHED] ${mod.name} finished. Check report at ${reportFolder}\\index.html\n`);
  }
}

if (targetInput === 'all') {
  console.log(`\nRunning all 13 modules sequentially for [${env.toUpperCase()}]...\n`);
  for (const m of MODULES) {
    runSingle(m, env);
  }
} else {
  const match = MODULES.find(m => m.id === targetInput || m.key.toLowerCase() === targetInput.toLowerCase());
  if (!match) {
    console.error(`Unknown module "${targetInput}".`);
    console.log('Available modules: 1 to 13 or: ' + MODULES.map(m => m.key).join(', '));
    process.exit(1);
  }
  runSingle(match, env);
}
