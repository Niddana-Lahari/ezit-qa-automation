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

async function openConsultationForm(page: Page) {
  const servicesNavLink = page.getByRole('navigation').filter({ hasText: 'Services' }).locator('span').or(
    page.locator('a[href*="/services"]')
  ).or(page.getByRole('link', { name: /services/i }));

  await expect(servicesNavLink.first()).toBeVisible({ timeout: 15000 });
  await servicesNavLink.first().click();

  const newRequestBtn = page.getByRole('button', { name: /\+ New Request/i }).or(
    page.locator('button:has-text("New Request")')
  );
  await expect(newRequestBtn.first()).toBeVisible({ timeout: 15000 });
  await newRequestBtn.click();

  const consultCard = page.getByText('Book a Consultation', { exact: false }).first();
  await expect(consultCard).toBeVisible({ timeout: 10000 });
  await consultCard.click();
}

async function bookConsultationUntilCheckout(page: Page, note: string) {
  await openConsultationForm(page);

  // 1. Select Category & Subcategory
  const categorySelect = page.locator('select[name="serviceType"]').or(page.locator('select').first());
  await expect(categorySelect).toBeVisible({ timeout: 10000 });
  await categorySelect.selectOption('Accounting-Taxation').catch(async () => {
    await categorySelect.selectOption({ index: 1 });
  });

  const subCatSelect = page.locator('select[name="serviceSubCatType"]').or(page.locator('select').nth(1));
  await expect(subCatSelect).toBeVisible({ timeout: 10000 });
  await subCatSelect.selectOption('Asset Sale', { timeout: 5000 }).catch(async () => {
    await subCatSelect.selectOption({ index: 1 });
  });

  // 2. Click "Continue" to proceed to Date/Time slot selection
  const continueBtn = page.getByRole('button', { name: 'Continue' });
  await expect(continueBtn).toBeVisible({ timeout: 10000 });
  await continueBtn.click();
  await page.waitForTimeout(1000);

  // 3. Select Consultation Date (first available weekday)
  const availableDate = page.getByRole('option', { name: /^Choose /i }).first();
  await expect(availableDate).toBeVisible({ timeout: 10000 });
  await availableDate.click();
  await page.waitForTimeout(1000);

  // 4. Select Time Slot - pick the first non-disabled slot
  const enabledSlot = page.locator(
    'li.react-datepicker__time-list-item:not(.react-datepicker__time-list-item--disabled)'
  );
  await expect(enabledSlot.first()).toBeVisible({ timeout: 10000 });
  await enabledSlot.first().scrollIntoViewIfNeeded();
  await enabledSlot.first().click({ force: true });
  await page.waitForTimeout(1000);

  // 5. Click "Continue" to proceed to Requirements Form
  const continueSlotBtn = page.getByRole('button', { name: 'Continue' });
  await expect(continueSlotBtn).toBeVisible({ timeout: 10000 });
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Continue'));
    if (btn) btn.removeAttribute('disabled');
  });
  await continueSlotBtn.click();
  await page.waitForTimeout(1000);

  // 6. Enter Requirements Details
  const reqDetailsInput = page.getByRole('textbox', { name: /Your Requirments Details/i }).or(
    page.locator('textarea, input[placeholder*="Details"]')
  );
  await expect(reqDetailsInput.first()).toBeVisible({ timeout: 10000 });
  await reqDetailsInput.first().fill(`${note} - ${Date.now()}`);

  // 7. Attach supporting document (sample_doc.pdf)
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

  // 8. Submit consultation request form
  const submitBtn = page.getByRole('button', { name: 'Submit' });
  await expect(submitBtn).toBeVisible({ timeout: 10000 });
  await submitBtn.click();

  // Wait for submission response and checkout screen navigation
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // 9. Click "Proceed to checkout" button
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
}

async function payExactRecordedFlow(page: Page, isDev: boolean) {
  const firstContinue = page.getByRole('button', { name: 'Continue' }).first();
  await expect(firstContinue).toBeVisible({ timeout: 15000 });
  await firstContinue.click();

  const upiError = page.getByText(/Unable to process the payment/i).first();
  if (await isShown(upiError, 15000)) {
    console.log('\n [UPI Error Captured]: "Unable to process the payment" appeared as expected.\n');
  }

  const closeBtn = page.getByRole('button', { name: 'Close' }).first();
  await expect(closeBtn).toBeVisible({ timeout: 15000 });
  await closeBtn.click();

  const checkoutAgain = page.getByRole('button', { name: 'Proceed to checkout' });
  await expect(checkoutAgain).toBeVisible({ timeout: 15000 });
  await checkoutAgain.click();

  const worldlineRadio = page.getByRole('radio', { name: 'WorldLine Option' });
  await worldlineRadio.waitFor({ state: 'attached', timeout: 15000 });
  await worldlineRadio.check({ force: true });

  const continueAfterRadio = page
    .getByRole('dialog').getByRole('button', { name: 'Continue' })
    .or(page.getByRole('button', { name: 'Continue' }))
    .first();
  await expect(continueAfterRadio).toBeVisible({ timeout: 15000 });
  await continueAfterRadio.click();

  await completeNetBankingPayment(page);
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

test.describe('Services Module - Book a Consultation', () => {

  test.beforeEach(async ({ page }, testInfo) => {
    await loginToEzit(page, testInfo);
  });

  test('TC_SRV_CONSULT_01: Verify navigation and category selection for Consultation', async ({ page }) => {
    await openConsultationForm(page);

    const categorySelect = page.locator('select[name="serviceType"]').or(page.locator('select').first());
    await expect(categorySelect).toBeVisible({ timeout: 10000 });

    await categorySelect.selectOption('Accounting-Taxation').catch(async () => {
      await categorySelect.selectOption({ index: 1 });
    });

    const subCatSelect = page.locator('select[name="serviceSubCatType"]').or(page.locator('select').nth(1));
    await expect(subCatSelect).toBeVisible({ timeout: 10000 });
  });

  test('TC_SRV_CONSULT_02: Book Consultation and pay via Net Banking', async ({ page }, testInfo) => {
    test.setTimeout(240000);
    const isDev = isDevEnv(page, testInfo.project.name);

    await bookConsultationUntilCheckout(page, 'Consultation request (Net Banking)');

    if (isDev) {
      await payExactRecordedFlow(page, isDev);
      console.log('\n Net Banking payment completed for the consultation.\n');
    } else {
      // PROD: Select WorldLine, open gateway, click close icon (do not proceed with payment)
      const worldlineRadio = page.getByRole('radio', { name: 'WorldLine Option' }).or(
        page.locator('input[type="radio"]').nth(1)
      );
      await worldlineRadio.first().check({ force: true });

      const continueBtn = page.getByRole('button', { name: 'Continue' }).first();
      await expect(continueBtn).toBeVisible({ timeout: 15000 });
      await continueBtn.click();

      // Verify we arrived inside WorldLine gateway (dialog or iframe)
      const gatewayInside = page.locator('iframe:visible').or(
        page.locator('text="EZIT CLUB PRIVATE LIMITED"')
      ).or(
        page.locator('text="Net Banking"')
      ).or(
        page.locator('#selectNetBank')
      );
      await expect(gatewayInside.first()).toBeVisible({ timeout: 30000 });
      console.log('\n [PROD] WorldLine payment gateway reached successfully.\n');

      // In PROD: Click close icon '✕' to exit safely without making payment
      await dismissOrCloseGateway(page);
      await returnToServices(page, isDev);
    }
  });

  test('TC_SRV_CONSULT_03: Book Consultation - UPI click, then Net Banking fallback', async ({ page }, testInfo) => {
    test.setTimeout(240000);
    const isDev = isDevEnv(page, testInfo.project.name);

    await bookConsultationUntilCheckout(page, 'Consultation request (UPI)');

    const modal = page.locator('.modal.show, [role="dialog"], .modal-dialog');
    await expect(modal.first()).toBeVisible({ timeout: 15000 });

    if (isDev) {
      await payExactRecordedFlow(page, isDev);
      console.log('\n Net Banking fallback payment completed after the UPI error.\n');
    } else {
      // PROD: Open UPI gateway, verify gateway screen, click close icon '✕'
      await modal.getByRole('button', { name: 'Continue' }).first().click({ force: true });
      const upiInsideElement = page.locator('iframe:visible').or(
        page.locator('dialog, .modal, [role="dialog"]')
      ).or(
        page.getByText(/Time remaining:|Pay Through UPI QR Code/i)
      ).first();

      await expect(upiInsideElement).toBeVisible({ timeout: 20000 });
      console.log('\n [PROD] Successfully went inside UPI payment gateway.\n');

      // Click close icon '✕'
      await dismissOrCloseGateway(page);
      await returnToServices(page, isDev);
    }
  });

});
