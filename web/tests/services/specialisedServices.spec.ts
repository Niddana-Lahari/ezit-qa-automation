import { test, expect, Page, Locator } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';
import path from 'path';
import { completeNetBankingPayment } from '../../utils/netBankingHelper';
import { dismissOrCloseGateway } from '../../utils/gatewayHelper';

function isDevEnv(page: Page, projectName: string): boolean {
  return (
    projectName === 'dev' ||
    (page.url() || '').includes('dev1-fe') ||
    process.env.TEST_ENV === 'dev'
  );
}

async function isShown(locator: Locator, timeout = 5000): Promise<boolean> {
  return locator.first()
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
}

async function payExactRecordedFlow(page: Page, isDev: boolean) {
  // First continue click
  const firstContinue = page.getByRole('button', { name: 'Continue' }).first();
  await expect(firstContinue).toBeVisible({ timeout: 15000 });
  await firstContinue.click();

  // Handle upi error toast if shown
  const upiError = page.getByText(/Unable to process the payment/i).first();
  if (await isShown(upiError, 15000)) {
    console.log('UPI error captured, choosing alternate gateway');
  }

  // Close initial modal
  const closeBtn = page.getByRole('button', { name: 'Close' }).first();
  await expect(closeBtn).toBeVisible({ timeout: 15000 });
  await closeBtn.click();

  //  Proceed to checkout (again)
  const checkoutAgain = page.getByRole('button', { name: 'Proceed to checkout' });
  await expect(checkoutAgain).toBeVisible({ timeout: 15000 });
  await checkoutAgain.click();

  // WorldLine Option
  const worldlineRadio = page.getByRole('radio', { name: 'WorldLine Option' });
  await worldlineRadio.waitFor({ state: 'attached', timeout: 15000 });
  await worldlineRadio.check({ force: true });

  //  Continue
  const continueAfterRadio = page
    .getByRole('dialog').getByRole('button', { name: 'Continue' })
    .or(page.getByRole('button', { name: 'Continue' }))
    .first();
  await expect(continueAfterRadio).toBeVisible({ timeout: 15000 });
  await continueAfterRadio.click();

  //  bank 470 -> Pay Now -> TPSL bank 470 -> Pay Now -> test / test -> Submit
  await completeNetBankingPayment(page);

  // Return to services
  await returnToServices(page, isDev);
}

async function returnToServices(page: Page, isDev: boolean) {
  const targetUrl = isDev ? 'https://dev1-fe.ezit.club/services' : 'https://app.ezit.club/services';

  await page.evaluate(() => {
    document.querySelectorAll('iframe[src*="worldline"], iframe[src*="tpsl"], .modal-backdrop').forEach(el => el.remove());
  }).catch(() => {});

  await page.goto(targetUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page).toHaveURL(/\/services/);
}

test.describe('Services Module - Specialised Services', () => {

  test.beforeEach(async ({ page }, testInfo) => {
    // Step 1: Perform unified login
    await loginToEzit(page, testInfo);
  });

  test('TC_SRV_SPEC_01: Verify navigation and selection for Specialised Services', async ({ page }) => {
    // 1. Navigate to Services module
    const servicesNavLink = page.getByRole('navigation').filter({ hasText: 'Services' }).locator('span').or(
      page.locator('a[href*="/services"]')
    ).or(page.getByRole('link', { name: /services/i }));
    
    await expect(servicesNavLink.first()).toBeVisible({ timeout: 15000 });
    await servicesNavLink.first().click();

    // 2. Click "+ New Request" button
    const newRequestBtn = page.getByRole('button', { name: /\+ New Request/i });
    await expect(newRequestBtn).toBeVisible({ timeout: 15000 });
    await newRequestBtn.click();

    // 3. Click "Specialised services" card
    const specCard = page.getByText('Specialised services', { exact: true }).or(
      page.getByText('Specialised services', { exact: false })
    ).first();
    await expect(specCard).toBeVisible({ timeout: 10000 });
    await specCard.click();

    // 4. Verify Service Type dropdown appears
    const serviceTypeSelect = page.getByLabel('Service Type').or(page.locator('select').first());
    await expect(serviceTypeSelect).toBeVisible({ timeout: 10000 });

    // 5. Select Service Type
    await serviceTypeSelect.selectOption('Insurance and Claim Settlement').catch(async () => {
      await serviceTypeSelect.selectOption({ index: 1 });
    });

    // 6. Verify Available Services dropdown appears
    const availableServicesSelect = page.getByLabel('Available Services').or(page.locator('select').nth(1));
    await expect(availableServicesSelect).toBeVisible({ timeout: 10000 });
  });

  test('TC_SRV_SPEC_02: Complete End-to-End Specialised Service Request Creation & Payment', async ({ page }, testInfo) => {
    test.setTimeout(240000);
    const isDev = isDevEnv(page, testInfo.project.name);

    // 1. Navigate to Services module
    const servicesNavLink = page.getByRole('navigation').filter({ hasText: 'Services' }).locator('span').or(
      page.locator('a[href*="/services"]')
    ).or(page.getByRole('link', { name: /services/i }));
    
    await expect(servicesNavLink.first()).toBeVisible({ timeout: 15000 });
    await servicesNavLink.first().click();

    // 2. Click "+ New Request" button
    const newRequestBtn = page.getByRole('button', { name: /\+ New Request/i });
    await expect(newRequestBtn).toBeVisible({ timeout: 15000 });
    await newRequestBtn.click();

    // 3. Select 'Specialised services' option
    const specCard = page.getByText('Specialised services', { exact: true }).or(
      page.getByText('Specialised services', { exact: false })
    ).first();
    await expect(specCard).toBeVisible({ timeout: 10000 });
    await specCard.click();

    // 4. Select Service Type & Available Service
    const serviceTypeSelect = page.getByLabel('Service Type').or(page.locator('select').first());
    await expect(serviceTypeSelect).toBeVisible({ timeout: 10000 });
    await serviceTypeSelect.selectOption('Insurance and Claim Settlement');

    const availableServicesSelect = page.getByLabel('Available Services').or(page.locator('select').nth(1));
    await expect(availableServicesSelect).toBeVisible({ timeout: 10000 });
    await availableServicesSelect.selectOption('Claim Submission');

    // 5. Click "Continue" to proceed to tier selection
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeVisible({ timeout: 10000 });
    await continueBtn.click();
    await page.waitForTimeout(1000);

    // 6. Select Service Tier / Plan
    const tierRadio = page.getByRole('radio', { name: /Claim Submission - Standard Claim between 1CR and 3CR/i }).or(
      page.locator('input[type="radio"]').first()
    );
    await expect(tierRadio).toBeVisible({ timeout: 10000 });
    await tierRadio.check();

    // 7. Click "Continue" to proceed to requirement details
    const continueTierBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueTierBtn).toBeVisible({ timeout: 10000 });
    await continueTierBtn.click();
    await page.waitForTimeout(1000);

    // 8. Fill Query / Requirements Details
    const detailsInput = page.getByRole('textbox', { name: /Query Details Related Document/i }).or(
      page.locator('textarea, input[placeholder*="Details"]')
    );
    await expect(detailsInput.first()).toBeVisible({ timeout: 10000 });
    await detailsInput.first().fill(`Claim submission assistance request - ${Date.now()}`);

    // 9. Attach supporting document using sample_doc.pdf
    const sampleFilePath = path.resolve(__dirname, '../../test-data/sample_doc.pdf');
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.first().setInputFiles(sampleFilePath);
    } else {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
        page.getByRole('button', { name: /Choose File/i }).click().catch(() => {})
      ]);
      if (fileChooser) {
        await fileChooser.setFiles(sampleFilePath);
      }
    }
    await page.waitForTimeout(1000);

    // 10. Submit Service Request
    const submitBtn = page.getByRole('button', { name: 'Submit' });
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    await submitBtn.click();

    // Wait for submission response and checkout screen navigation
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // 11. Handle optional Billing Address ONLY IF there is an actual billing form modal
    const addressInput = page.getByRole('textbox', { name: 'Address' }).or(page.locator('input[placeholder*="Address" i]'));
    const isAddressFieldPresent = await addressInput.first().isVisible().catch(() => false);

    if (isAddressFieldPresent) {
      const testCity = process.env.TEST_CITY || 'Vizianagaram';
      const testAddress = process.env.TEST_ADDRESS || 'Vizianagaram';
      const testPincode = process.env.TEST_PINCODE || '535002';

      await addressInput.first().fill(testAddress);

      const cityInput = page.getByRole('textbox', { name: /City/i }).or(page.locator('input[placeholder*="City" i]')).first();
      if (await cityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cityInput.fill(testCity);
      }

      const pinCodeInput = page.locator('input[placeholder*="pin" i], input[name*="pincode" i], input[name*="pin" i]').or(
        page.getByRole('textbox', { name: /PIN CODE|Pincode/i })
      ).or(
        page.getByRole('spinbutton', { name: /PIN CODE|Pincode/i })
      ).first();

      if (await pinCodeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pinCodeInput.fill(testPincode);
      }

      const submitBillingBtn = page.getByRole('button', { name: /Submit|Continue|Save/i }).first();
      if (await submitBillingBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBillingBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // 12. Proceed to Checkout button (matches bookConsultation exactly)
    const checkoutBtn = page.getByRole('button', { name: /Proceed to checkout/i }).or(
      page.locator('button:has-text("Proceed to checkout")')
    ).or(
      page.locator('button:has-text("Proceed")')
    ).or(
      page.getByText('Proceed to checkout', { exact: true })
    ).first();

    await expect(checkoutBtn).toBeVisible({ timeout: 20000 });
    await checkoutBtn.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(500);

    // Click Proceed to checkout with hydration retry support
    for (let attempt = 0; attempt < 3; attempt++) {
      await checkoutBtn.click({ force: true });
      await page.waitForTimeout(1000);

      const modalVisible = await page.locator('.modal.show, [role="dialog"], .modal-dialog').first().isVisible({ timeout: 2000 }).catch(() => false);
      if (modalVisible) break;
    }

    if (isDev) {
      // 13. DEV: Complete full automated payment flow
      await payExactRecordedFlow(page, isDev);
      console.log('\n Net Banking payment completed for the specialised service.\n');
    } else {
      // PROD: Select WorldLine, open gateway, click close icon '✕' (do not proceed with payment)
      const worldlineRadio = page.getByRole('radio', { name: 'WorldLine Option' }).or(
        page.locator('input[type="radio"]').nth(1)
      );
      await worldlineRadio.first().check({ force: true });

      const continueBtn = page.getByRole('button', { name: 'Continue' }).first();
      await expect(continueBtn).toBeVisible({ timeout: 15000 });
      await continueBtn.click();

      // Verify we arrived inside WorldLine gateway
      const gatewayInside = page.locator('iframe:visible').or(
        page.locator('text="EZIT CLUB PRIVATE LIMITED"')
      ).or(
        page.locator('text="Net Banking"')
      );
      await expect(gatewayInside.first()).toBeVisible({ timeout: 30000 });
      console.log('\n [PROD] WorldLine gateway reached successfully.\n');

      // Click close icon '✕'
      await dismissOrCloseGateway(page);
      await returnToServices(page, isDev);
    }
  });

});
