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

test.describe('Services Module - Raise a Query', () => {

  test.beforeEach(async ({ page }, testInfo) => {
    // Step 1: Perform unified login (handles Dev/Prod dynamic credentials & environment URLs)
    await loginToEzit(page, testInfo);
  });

  test('TC_SRV_QUERY_01: Verify navigation to Raise a Query form', async ({ page }) => {
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

    // 3. Verify 'Raise a Query' card is present and click it
    const raiseQueryCard = page.getByText('Raise a Query', { exact: false }).first();
    await expect(raiseQueryCard).toBeVisible({ timeout: 10000 });
    await raiseQueryCard.click();

    // 4. Verify category dropdown appears
    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeVisible({ timeout: 10000 });
  });

  test('TC_SRV_QUERY_02: Complete Raise a Query creation with document upload and payment', async ({ page }, testInfo) => {
    test.setTimeout(240000);
    const isDev = isDevEnv(page, testInfo.project.name);
    const servicesUrl = isDev ? 'https://dev1-fe.ezit.club/services' : 'https://app.ezit.club/services';

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

    // 3. Select 'Raise a Query'
    const raiseQueryCard = page.getByText('Raise a Query').first();
    await expect(raiseQueryCard).toBeVisible({ timeout: 10000 });
    await raiseQueryCard.click();

    // 4. Choose Category
    const categorySelect = page.getByLabel('Default select example').or(page.locator('select').first());
    await expect(categorySelect).toBeVisible({ timeout: 10000 });
    await categorySelect.selectOption('Accounting-Taxation').catch(async () => {
      await categorySelect.selectOption({ index: 1 });
    });

    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeVisible({ timeout: 10000 });
    await continueBtn.click();

    // 5. Fill Query Title and Details
    const uniqueQueryTitle = `Tax Filing Query - ${Date.now()}`;
    const titleInput = page.getByRole('textbox', { name: 'Title' }).or(page.locator('input[placeholder*="Title" i]'));
    await expect(titleInput.first()).toBeVisible({ timeout: 10000 });
    await titleInput.first().fill(uniqueQueryTitle);

    const detailsInput = page.getByRole('textbox', { name: /Query Details Related/i }).or(
      page.locator('textarea, input[placeholder*="Details" i]')
    );
    await expect(detailsInput.first()).toBeVisible({ timeout: 10000 });
    await detailsInput.first().fill('Need consultation regarding tax declaration and filing documents for FY 2024-25.');

    // 6. Attach supporting document
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

    // 7. Select Priority dropdown if present
    const prioritySelect = page.locator('select[name="queryUrgency"], select').last();
    if (await prioritySelect.isVisible({ timeout: 4000 }).catch(() => false)) {
      await prioritySelect.selectOption({ index: 1 }).catch(() => {});
    }

    // 8. Submit the Query form
    const submitBtn = page.getByRole('button', { name: /Submit|Continue|Proceed/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    await submitBtn.click({ force: true });

    // Wait for submission response and checkout screen navigation or confirmation
    const checkoutOrSuccess = page.getByRole('button', { name: /Proceed|Checkout|Pay/i }).or(
      page.getByText(/Query Submitted|Successfully|Checkout|Payment/i)
    ).or(page.locator('.modal.show, .toast, .alert'));
    await expect(checkoutOrSuccess.first()).toBeVisible({ timeout: 25000 });

    // 9. If checkout button is visible, proceed to checkout
    const checkoutBtn = page.getByRole('button', { name: /Proceed to checkout/i }).or(
      page.locator('button:has-text("Proceed to checkout")')
    ).or(
      page.locator('button:has-text("Proceed")')
    ).first();

    if (await checkoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkoutBtn.click({ force: true });
    }

    if (isDev) {
      const firstContinue = page.getByRole('button', { name: 'Continue' }).first();
      if (await firstContinue.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstContinue.click({ force: true });
      }

      const upiError = page.getByText(/Unable to process the payment/i).first();
      if (await isShown(upiError, 5000)) {
        console.log('\n [UPI Error Captured]: "Unable to process the payment" appeared as expected.\n');
      }

      const closeBtn = page.getByRole('button', { name: 'Close' }).first();
      if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await closeBtn.click();
      }
    }

      // 11. Choose 'WorldLine Option' BY NAME, then Continue
      const worldlineRadio = page.getByRole('radio', { name: 'WorldLine Option' });
      await worldlineRadio.waitFor({ state: 'attached', timeout: 15000 });
      await worldlineRadio.check({ force: true });

      const continueAfterRadio = page
        .getByRole('dialog').getByRole('button', { name: 'Continue' })
        .or(page.getByRole('button', { name: 'Continue' }))
        .first();
      await expect(continueAfterRadio).toBeVisible({ timeout: 15000 });
      await continueAfterRadio.click();

      // 12. Net Banking sandbox payment
      await completeNetBankingPayment(page);
      console.log('\n Net Banking payment completed for the query.\n');
    } else {
      // PROD: Choose WorldLine, go inside gateway, click close icon '✕'
      const worldlineRadio = page.getByRole('radio', { name: 'WorldLine Option' }).or(
        page.locator('input[type="radio"]').nth(1)
      );
      await worldlineRadio.first().check({ force: true });

      const continueBtn = page.getByRole('button', { name: 'Continue' }).first();
      await expect(continueBtn).toBeVisible({ timeout: 15000 });
      await continueBtn.click();

      const gatewayInside = page.locator('iframe:visible').or(
        page.locator('text="EZIT CLUB PRIVATE LIMITED"')
      ).or(
        page.locator('text="Net Banking"')
      );
      await expect(gatewayInside.first()).toBeVisible({ timeout: 30000 });
      console.log('\n [PROD] WorldLine gateway reached successfully.\n');

      // Click close icon '✕' in PROD
      await dismissOrCloseGateway(page);
      await page.goto(servicesUrl);
      await page.waitForLoadState('networkidle');
    }

    // 13. Open the 'Queries' tab
    const queriesTab = page.getByRole('button', { name: /Queries/i }).first();
    await expect(queriesTab).toBeVisible({ timeout: 30000 });
    await queriesTab.click();

    // 14. DEV only: open the submitted request and come back
    if (isDev) {
      const submittedRequest = page.getByText(/REQUEST - ID/i).first();
      await expect(submittedRequest).toBeVisible({ timeout: 15000 });
      await submittedRequest.click();

      const backBtn = page.locator('.back-button').first();
      await expect(backBtn).toBeVisible({ timeout: 10000 });
      await backBtn.click();
    }
  });

});
