import { test, expect, Page } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';

// Helper 1: Open the Bill Pay screen (Step 2)

async function openBillPay(page: Page) {
  const billPayNav = page
    .getByRole('navigation')
    .filter({ hasText: 'Bill Pay' })
    .locator('span')
    .or(page.getByRole('link', { name: /Bill Pay/i }))
    .first();

  await expect(billPayNav).toBeVisible({ timeout: 15000 });
  await billPayNav.click();

  // If an M-PIN screen is shown (same as Secure Vault), fill it first
  const mpinChar1 = page.getByRole('textbox', { name: 'Please enter OTP character 1' });
  const hasMpin = await mpinChar1
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (hasMpin) {
    await mpinChar1.fill('1');
    await page.getByRole('textbox', { name: 'Please enter OTP character 2' }).fill('2');
    await page.getByRole('textbox', { name: 'Please enter OTP character 3' }).fill('3');
    await page.getByRole('textbox', { name: 'Please enter OTP character 4' }).fill('4');
  }

  // Wait properly for the Continue button, then click it
  const continueBtn = page.getByRole('button', { name: 'Continue' });
  await expect(continueBtn).toBeVisible({ timeout: 15000 });
  await expect(continueBtn).toBeEnabled({ timeout: 5000 });
  await continueBtn.click({ force: true });

  // Bill payment screens live inside an iframe - wait for it
  await expect(page.locator('iframe').first()).toBeVisible({ timeout: 20000 });
}

// Helper 2: Shortcut to work inside the iframe

function billFrame(page: Page) {
  return page.frameLocator('iframe').first();
}

// Helper 3: Fill a textbox inside the iframe

async function fillField(page: Page, label: string, value: string) {
  const field = billFrame(page).getByRole('textbox', { name: label });
  await expect(field).toBeVisible({ timeout: 10000 });
  await field.click();
  await field.fill(value);
}

// Helper 4: Click 'Fetch bill' and check there is no server crash

async function fetchBillAndCheck(page: Page) {
  const fetchBtn = billFrame(page).getByRole('button', { name: 'Fetch bill' });
  await expect(fetchBtn).toBeVisible({ timeout: 10000 });
  await fetchBtn.click();

  // Give the API a few seconds to respond
  await page.waitForTimeout(4000);

  // "soft" expect = test keeps running, but is marked failed if a panic shows up
  const panicError = billFrame(page).getByText(/panic error/i);
  await expect.soft(panicError, 'Server returned a panic error').toHaveCount(0);
}

// Helper 5: Open a category + biller (links inside the iframe)

async function openCategoryAndBiller(page: Page, category: string, biller: string) {
  const frame = billFrame(page);

  // 1. Click the category
  const categoryLink = frame.getByRole('link', { name: category });
  await expect(categoryLink).toBeVisible({ timeout: 15000 });
  await categoryLink.click();

  // 2. Wait for the biller list to load
  const list = frame.getByTestId('virtuoso-item-list');
  await expect(list).toBeVisible({ timeout: 15000 });

  // 3. .last() = the normal list entry (ignores a "recent/saved" duplicate at the top)
  const billerLink = frame.getByRole('link', { name: biller }).last();

  // 4. The list only renders visible rows, so scroll down until the biller appears
  for (let i = 0; i < 15; i++) {
    if (await billerLink.isVisible()) break;
    await list.hover();
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(500);
  }

  // 5. Click it
  await expect(billerLink).toBeVisible({ timeout: 5000 });
  await billerLink.click();
}

test.describe('Bill Payments - Fetch Bill Suite', () => {
  test.setTimeout(90000);

  // Step 1: Login before each test with dynamic credentials (Dev / Prod)
  test.beforeEach(async ({ page }, testInfo) => {
    await loginToEzit(page, testInfo);
    await openBillPay(page);
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_BILLPAY_01: Electricity - Andhra Pradesh Central Power
   * ----------------------------------------------------------------------------
   */
  test('TC_BILLPAY_01: Fetch electricity bill - AP Central Power', async ({ page }) => {
    await test.step('Step 3: Open Electricity > AP Central Power', async () => {
      await openCategoryAndBiller(page, 'Electricity payment link', 'Andhra Pradesh Central Power');
    });

    await test.step('Step 4: Enter service connection number and fetch bill', async () => {
      await fillField(page, 'Digit Service Connection Number', '4567899098768');
      await fetchBillAndCheck(page);
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_BILLPAY_02: Electricity - APEPDCL Eastern Power
   * ----------------------------------------------------------------------------
   */
  test('TC_BILLPAY_02: Fetch electricity bill - APEPDCL Eastern Power', async ({ page }) => {
    await test.step('Step 3: Open Electricity > APEPDCL', async () => {
      await openCategoryAndBiller(page, 'Electricity payment link', 'APEPDCL-Eastern Power');
    });

    await test.step('Step 4: Enter service number and fetch bill', async () => {
      await fillField(page, 'Service Number', '1234567886756');
      await fetchBillAndCheck(page);
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_BILLPAY_03: Mobile Postpaid - Jio
   * ----------------------------------------------------------------------------
   */
  test('TC_BILLPAY_03: Fetch mobile postpaid bill - Jio', async ({ page }) => {
    await test.step('Step 3: Open Mobile Postpaid > Jio', async () => {
      await openCategoryAndBiller(page, 'Mobile Postpaid payment link', 'Jio Postpaid (Fetch and Pay)');
    });

    await test.step('Step 4: Enter mobile number and fetch bill', async () => {
      await fillField(page, 'Mobile Number', process.env.TEST_MOBILE || '9876543210');
      await fetchBillAndCheck(page);
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_BILLPAY_04: Mobile Postpaid - Vi
   * ----------------------------------------------------------------------------
   */
  test('TC_BILLPAY_04: Fetch mobile postpaid bill - Vi', async ({ page }) => {
    await test.step('Step 3: Open Mobile Postpaid > Vi', async () => {
      await openCategoryAndBiller(page, 'Mobile Postpaid payment link', 'Vi Postpaid (Fetch and Pay)');
    });

    await test.step('Step 4: Enter mobile number and fetch bill', async () => {
      await fillField(page, 'Mobile Number', process.env.TEST_MOBILE || '9876543210');
      await fetchBillAndCheck(page);
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_BILLPAY_05: Book a Cylinder - HP Gas
   * ----------------------------------------------------------------------------
   */
  test('TC_BILLPAY_05: Fetch gas cylinder bill - HP Gas', async ({ page }, testInfo) => {
    await test.step('Step 3: Open Book a Cylinder > HP Gas', async () => {
      await openCategoryAndBiller(page, 'Book a Cylinder payment link', 'HP Gas (HPCL) biller Link');
    });

    await test.step('Step 4: Fill consumer details and fetch bill', async () => {
      const isProd = testInfo.project.name === 'prod';

      if (!isProd) {
        // DEV has all 4 fields
        await fillField(page, 'Consumer Number', '34567890');
        await fillField(page, 'Distributor ID', '23344556');
        await fillField(page, 'Mobile Number', '6767665445');
        await fillField(page, 'Unique Consumer ID', '0987655543267878');
      } else {
        // PROD only has Mobile Number
        await fillField(page, 'Mobile Number', '6767665445');
      }

      await fetchBillAndCheck(page);
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_BILLPAY_06: Hospital - Abhyant Clinic
   * ----------------------------------------------------------------------------
   */
  test('TC_BILLPAY_06: Fetch hospital bill - Abhyant Clinic', async ({ page }) => {
    await test.step('Step 3: Open Hospital > Abhyant Clinic', async () => {
      await openCategoryAndBiller(page, 'Hospital payment link', 'Abhyant Clinic biller Link');
    });

    await test.step('Step 4: Enter customer number and fetch bill', async () => {
      await fillField(page, 'Customer Number', '3456576879809');
      await fetchBillAndCheck(page);
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_BILLPAY_07: Donation - Achyut Maharaj Janmbhumi
   * Fills the form. Only clicks 'Proceed' on DEV (never on PROD).
   * ----------------------------------------------------------------------------
   */
  test('TC_BILLPAY_07: Donation form - Achyut Maharaj Janmbhumi', async ({ page }, testInfo) => {
    const isProd = testInfo.project.name === 'prod';

    await test.step('Step 3: Open Donation > Achyut Maharaj Janmbhumi', async () => {
      await openCategoryAndBiller(page, 'Donation payment link', 'Achyut Maharaj Janmbhumi');
    });

    await test.step('Step 4: Fill donor details', async () => {
      await fillField(page, 'Full Name', process.env.TEST_USER_NAME || 'Test Donor');
      await fillField(page, 'EMAIL', process.env.TEST_CORPORATE_EMAIL || 'test.donor@example.com');
      await fillField(page, 'PAN', process.env.TEST_PAN || 'DFFGHG768J');
    });

    await test.step('Step 5: Choose payment details and enter amount', async () => {
      await billFrame(page).getByRole('button', { name: 'Choose payment details' }).click();

      const amount = billFrame(page).getByRole('spinbutton', { name: 'Amount' });
      await expect(amount).toBeVisible({ timeout: 10000 });
      await amount.click();
      await amount.fill('1200');
    });

    await test.step('Step 6: Proceed (DEV only)', async () => {
      const proceedBtn = billFrame(page).getByRole('button', { name: 'Proceed' });
      await expect(proceedBtn).toBeVisible({ timeout: 10000 });

      if (isProd) {
        console.log('\n PROD detected: skipping Proceed click to avoid a real payment.\n');
        return;
      }

      await proceedBtn.click();
      await page.waitForTimeout(3000);
      console.log('\n DEV: Proceed clicked. Check the payment result screen manually.\n');
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_BILLPAY_08: Verify all bill categories are visible
   * ----------------------------------------------------------------------------
   */
  test('TC_BILLPAY_08: Verify bill categories are displayed', async ({ page }) => {
    const categories = [
      'Electricity payment link',
      'Mobile Postpaid payment link',
      'Book a Cylinder payment link',
      'Donation payment link',
      'Hospital payment link',
    ];

    for (const name of categories) {
      await test.step(`Check category: ${name}`, async () => {
        await expect(billFrame(page).getByRole('link', { name })).toBeVisible({ timeout: 15000 });
      });
    }

    console.log('\n TC_BILLPAY_08 Passed: All bill categories verified.\n');
  });
});
