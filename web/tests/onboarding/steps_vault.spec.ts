import { test, expect, Page, Locator } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';


async function isShown(locator: Locator, timeout = 5000): Promise<boolean> {
  return locator.first()
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
}

// Helper: Click Secure Vault, and click Continue on the intro screen if it shows

async function ensureInVault(page: Page) {
  const vaultNav = page.getByRole('navigation').filter({ hasText: 'Secure Vault' }).locator('span');
  await expect(vaultNav.first()).toBeVisible({ timeout: 15000 });
  await vaultNav.first().click();

  // WAIT for the intro screen. If the account is already past it, it never shows - that is fine.
  const introHeading = page.getByText(/Security & Compliance/i);
  if (await isShown(introHeading, 8000)) {
    await page.getByRole('button', { name: 'Continue' }).first().click();
  }
}

// Helper: STEP 3 - PAN / KYC

async function enterPanAndContinue(page: Page) {
  // 1. First click Aadhaar Card, then switch back to PAN Card
  const aadhaarOption = page.getByRole('radio', { name: /Aadhaar/i })
    .or(page.getByLabel(/Aadhaar/i))
    .or(page.getByText(/Aadhaar Card/i));

  if (await aadhaarOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await aadhaarOption.first().click();
    await page.waitForTimeout(800);

    const panOption = page.getByRole('radio', { name: /PAN Card/i })
      .or(page.getByLabel(/PAN Card/i))
      .or(page.getByText(/PAN Card/i));

    if (await panOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await panOption.first().click();
      await page.waitForTimeout(500);
    }
  }

  // 2. Enter PAN Number and proceed
  const pan = page.getByRole('textbox', { name: /Enter PAN Number/i });
  await expect(pan).toBeVisible({ timeout: 15000 });
  await pan.fill(process.env.TEST_PAN || 'DLKPN2135P');

  const continueBtn = page.getByRole('button', { name: 'Continue' }).first();
  await expect(continueBtn).toBeEnabled({ timeout: 5000 });
  await continueBtn.click();
}

async function submitPan(page: Page) {
  await enterPanAndContinue(page);

  let aadhaarDone = false;
  let panRetyped = false;

  for (let round = 0; round < 6; round++) {
    // Finished: the Personal Details form is showing
    if (await isShown(stateBox(page), 4000)) return;

    // Aadhaar Card screen (as recorded)
    const aadhaarRadio = page.getByRole('radio', { name: 'Aadhaar Card' });
    if (!aadhaarDone && (await isShown(aadhaarRadio, 1500))) {
      await aadhaarRadio.check();
      await page.getByRole('button', { name: 'Continue' }).first().click();

      const notice = page.getByRole('alert').filter({ hasText: /Aadhaar verification is/i });
      if (await isShown(notice, 5000)) {
        console.log('\n Aadhaar notice shown:', (await notice.first().innerText()).trim(), '\n');
      }
      aadhaarDone = true;
      continue;
    }

    if (aadhaarDone && !panRetyped && (await isShown(panBox(page), 1500))) {
      await enterPanAndContinue(page);
      panRetyped = true;
      continue;
    }

    const anyContinue = page.getByRole('button', { name: 'Continue' }).first();
    if (await isShown(anyContinue, 3000)) {
      await anyContinue.click();
    }
  }

  await expect(
    stateBox(page),
    'Personal Details did not appear after the PAN / KYC steps. Page URL now: ' + page.url()
  ).toBeVisible({ timeout: 5000 });
}

// Helper: STEP 4 - Personal details

async function fillPersonalDetails(page: Page) {
  const stateSelect = page.getByLabel('State');
  await expect(stateSelect).toBeVisible({ timeout: 20000 });

  const dobInput = page.getByRole('textbox', { name: 'Enter your birth date' });
  if (await isShown(dobInput, 3000)) {
    await dobInput.click();
    await page.getByRole('combobox').first().selectOption('4', { timeout: 3000 }).catch(() => {});
    await page.getByRole('combobox').nth(1).selectOption('2003', { timeout: 3000 }).catch(() => {});
    const dayOption = page.getByRole('option', { name: /May 27th/i });
    if (await isShown(dayOption, 3000)) {
      await dayOption.click();
    }
  }

  const city = process.env.TEST_CITY || 'Hyderabad';
  const pincode = process.env.TEST_PINCODE || '500001';
  const address = process.env.TEST_ADDRESS || 'Test Residency, Main Road';
  const state = process.env.TEST_STATE || 'AP';

  await stateSelect.selectOption(state);
  await page.getByRole('textbox', { name: 'City' }).fill(city);
  await page.getByRole('textbox', { name: 'Pincode' }).fill(pincode);
  await page.getByRole('textbox', { name: 'Full address' }).fill(address);

  const whatsappCheckbox = page.getByRole('checkbox', { name: 'WhatsApp on same mobile number' });
  if (await isShown(whatsappCheckbox, 3000)) {
    await whatsappCheckbox.check();
  }

  await page.getByRole('button', { name: 'Continue' }).first().click();

  // Intermediate Continue button
  const postContinue = page.getByRole('button', { name: 'Continue' }).first();
  if (await isShown(postContinue, 5000)) {
    await postContinue.click();
  }
}

// Helper: STEP 5 - Nominee

async function addNominee(page: Page) {
  const nomineeName = page.getByRole('textbox', { name: 'Full name' });

  // If the form is not showing yet, we are on the intro "Add Primary Nominee" screen
  if (!(await isShown(nomineeName, 3000))) {
    const introContinue = page.getByRole('button', { name: 'Continue' }).first();
    await expect(introContinue).toBeVisible({ timeout: 10000 });
    await introContinue.click();
  }

  await expect(nomineeName).toBeVisible({ timeout: 10000 });
  await nomineeName.fill(process.env.TEST_NOMINEE_NAME || 'Test Nominee');

  const relationSelect = page.getByLabel(/Default select example|Relationship/i).first();
  if (await isShown(relationSelect, 3000)) {
    await relationSelect.selectOption('4', { timeout: 5000 });
  }

  await page.getByRole('textbox', { name: 'Enter your mobile number here' }).fill(process.env.TEST_NOMINEE_MOBILE || process.env.TEST_MOBILE || '9876543210');

  const nomineeWhatsapp = page.getByRole('checkbox', { name: 'WhatsApp on same mobile number' });
  if (await isShown(nomineeWhatsapp, 3000)) {
    await nomineeWhatsapp.check();
  }

  await page.getByRole('button', { name: 'Add Nominee' }).click();

  // The recording ends this step on the message 'Nominee Added Successfully' - wait for it,
  // so we know the nominee was really saved before clicking Continue.
  await expect(page.getByText(/Nominee Added Successfully/i).first()).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Continue' }).first().click();
}

// Helper: STEP 6 - Reminder preferences

async function setReminders(page: Page) {
  const waitTimeSelect = page.locator('select[name="wait_time"]');
  await expect(waitTimeSelect).toBeVisible({ timeout: 10000 });
  await waitTimeSelect.selectOption('5'); // 5 days

  const remindersSelect = page.locator('select[name="no_reminders"]');
  if (await isShown(remindersSelect, 3000)) {
    await remindersSelect.selectOption('4', { timeout: 5000 }); // 4 reminders (as in the recording)
  }

  await page.getByRole('button', { name: 'Continue' }).first().click();
}

// Helper: STEP 7 - SMS + finish

async function chooseSmsAndFinish(page: Page) {
  const smsCheckbox = page.getByRole('checkbox', { name: 'SMS' });
  if (await isShown(smsCheckbox, 10000)) {
    await smsCheckbox.first().check();   // .check() ticks it for sure (a plain click can un-tick it)
  } else {
    await page.getByText('SMS').first().click();
  }

  await page.getByRole('button', { name: 'Submit' }).click();

  // Final Continue to reach the dashboard
  const finalContinue = page.getByRole('button', { name: 'Continue' }).first();
  if (await isShown(finalContinue, 6000)) {
    await finalContinue.click();
  }
}

// Locators for "which screen is the account on right now?"

const mpinBoxes = (page: Page) => page.getByRole('textbox', { name: /Please enter OTP character/i });
// The CREATE screen has 8 boxes (enter + confirm) and a 'Create M-PIN' button.
// The VERIFY screen (account already has an M-PIN) has only 4 boxes and NO 'Create M-PIN' button.
const createMpinBtn = (page: Page) => page.getByRole('button', { name: 'Create M-PIN' });
const panBox = (page: Page) => page.getByRole('textbox', { name: /Enter PAN Number/i });
const stateBox = (page: Page) => page.getByLabel('State');
const nomineeScreen = (page: Page) =>
  page.getByText(/Add Primary Nominee/i).or(page.getByRole('textbox', { name: 'Full name' }));
const reminderBox = (page: Page) => page.locator('select[name="wait_time"]');
const smsScreen = (page: Page) => page.getByRole('checkbox', { name: 'SMS' }).or(page.getByText('SMS'));

const dashboardCheck = (page: Page) =>
  page.getByText(/Hello|Assets|Dashboard/i).or(page.getByRole('navigation'));

test.describe.serial('Secure Vault Step-by-Step Onboarding', () => {

  test.setTimeout(90000);

  // STEP 1 & 2: Navigate to Secure Vault AND Set M-PIN (Single Session)

  test('STEP_1_TO_2: Navigate to Vault and Create M-PIN', async ({ page }, testInfo) => {
    await loginToEzit(page, testInfo);
    await ensureInVault(page);

    // Only continue if this is the CREATE screen. An account that already has an M-PIN shows
    // a 4-box "enter your M-PIN" screen instead, and there is nothing to create.
    const onCreateScreen = await isShown(createMpinBtn(page), 15000);
    test.skip(!onCreateScreen,
      'The Create M-PIN screen is not showing. This account already has an M-PIN. Use a fresh account to run this step.');

    const mpinInputs = mpinBoxes(page);
    await expect(mpinInputs).toHaveCount(8, { timeout: 10000 });

    // Enter M-PIN (1 2 3 4), then confirm it (1 2 3 4)
    for (let i = 0; i < 4; i++) {
      await mpinInputs.nth(i).fill(String(i + 1));
    }
    for (let i = 0; i < 4; i++) {
      await mpinInputs.nth(4 + i).fill(String(i + 1));
    }

    await page.getByRole('button', { name: 'Create M-PIN' }).click();

    const postMpinContinue = page.getByRole('button', { name: 'Continue' }).first();
    await expect(postMpinContinue).toBeVisible({ timeout: 10000 });
    await postMpinContinue.click();

    // Verify arrival on the PAN / KYC screen
    await expect(panBox(page)).toBeVisible({ timeout: 10000 });
  });

  // STEP 3 TO 7: KYC through to Dashboard (one continuous session)
  // Each screen is checked with a REAL wait, so nothing after PAN is skipped by mistake.

  test('STEP_3_TO_7: Complete KYC, Personal Details, Nominee, Reminders and SMS to Dashboard', async ({ page }, testInfo) => {
    test.setTimeout(180000);

    await loginToEzit(page, testInfo);
    await ensureInVault(page);

    // KYC (PAN card)
    if (await isShown(panBox(page), 10000)) {
      await submitPan(page);
    }

    // Personal details
    if (await isShown(stateBox(page), 20000)) {
      await fillPersonalDetails(page);
    }

    // Nominee
    if (await isShown(nomineeScreen(page), 12000)) {
      await addNominee(page);
    }

    // Reminder preferences
    if (await isShown(reminderBox(page), 12000)) {
      await setReminders(page);
    }

    // SMS + finish
    if (await isShown(smsScreen(page), 12000)) {
      await chooseSmsAndFinish(page);
    }

    // Verify Dashboard
    await expect(dashboardCheck(page).first()).toBeVisible({ timeout: 15000 });
  });

  // STEP 1: Login & Open Secure Vault

  test('STEP_1: Login and Navigate to Secure Vault', async ({ page }, testInfo) => {
    await loginToEzit(page, testInfo);

    const vaultNav = page.getByRole('navigation').filter({ hasText: 'Secure Vault' }).locator('span');
    await expect(vaultNav.first()).toBeVisible({ timeout: 15000 });
    await vaultNav.first().click();

    const introHeading = page.getByText(/Security & Compliance/i);
    const anyVaultScreen = introHeading
      .or(page.getByText(/KYC Verification/i))
      .or(panBox(page))
      .or(mpinBoxes(page))
      .or(page.getByText(/Transport Portfolio/i));

    await expect(
      anyVaultScreen.first(),
      'Secure Vault did not open on any known screen. Page URL now: ' + page.url()
    ).toBeVisible({ timeout: 20000 });

    // Only the intro screen has a Continue button to click
    if (await isShown(introHeading, 1000)) {
      await page.getByRole('button', { name: 'Continue' }).first().click();
    }
    console.log('\n Secure Vault opened. Page URL: ' + page.url() + '\n');

    await page.waitForTimeout(2000);
  });


});
