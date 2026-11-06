const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Arguments: node run_module_report.js <module> <env>
// e.g. node run_module_report.js subscription dev
const moduleArg = process.argv[2] || 'all';
const envArg = process.argv[3] || 'dev';

const MODULES = {
  subscription: {
    name: 'Subscription Plans',
    path: 'tests/subscription/',
  },
  vault: {
    name: 'Secure Vault (Assets, Liabilities, Appliances, Transport)',
    path: 'tests/vault/',
  },
  services: {
    name: 'Services (Specialised, Consultations, Custom Request)',
    path: 'tests/services/',
  },
  billpay: {
    name: 'Bill Pay Module',
    path: 'tests/billpay/',
  },
  profile: {
    name: 'Profile & Nominees',
    path: 'tests/profile/',
  },
  docai: {
    name: 'DocAI Module',
    path: 'tests/docai/',
  },
  coverage: {
    name: 'Complementary Coverage',
    path: 'tests/coverage/',
  },
  auth: {
    name: 'Authentication (Login & Registration)',
    path: 'tests/auth/',
  },
  dashboard: {
    name: 'Home & Dashboard',
    path: 'tests/dashboard/',
  },
};

function runModule(modKey, env) {
  const mod = MODULES[modKey];
  if (!mod) {
    console.error(`Unknown module: ${modKey}`);
    console.log(`Available modules: ${Object.keys(MODULES).join(', ')}`);
    process.exit(1);
  }

  const reportFolder = path.join(__dirname, 'reports', env, modKey);
  console.log(`\n======================================================`);
  console.log(` Running: ${mod.name} on [${env.toUpperCase()}]`);
  console.log(` Report Destination: ${reportFolder}`);
  console.log(`======================================================\n`);

  // Ensure reports dir exists
  fs.mkdirSync(reportFolder, { recursive: true });

  const command = `npx playwright test ${mod.path} --project=${env} --reporter=html:${reportFolder} --grep-invert "OTP|deleteAccount"`;
  
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    console.log(`\n [SUCCESS] Report generated at: ${reportFolder}\\index.html\n`);
  } catch (error) {
    console.log(`\n [NOTE] Tests completed with some results logged in: ${reportFolder}\\index.html\n`);
  }
}

if (moduleArg === 'all') {
  console.log(`Running all modules sequentially for [${envArg}] with individual reports...`);
  for (const modKey of Object.keys(MODULES)) {
    runModule(modKey, envArg);
  }
} else {
  runModule(moduleArg, envArg);
}
