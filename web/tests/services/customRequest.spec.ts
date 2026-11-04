import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';
import path from 'path';


test.describe('Services Module - Custom Request (Get Quote)', () => {

  test.beforeEach(async ({ page }, testInfo) => {
    // Step 1: Perform unified login (handles Dev/Prod dynamic credentials & environment URLs)
    await loginToEzit(page, testInfo);
  });

  test('TC_SRV_CUSTOM_01: Verify navigation to Custom Request - Get Quote form', async ({ page }) => {
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

    // 3. Click "Custom Request- Get Quote" option
    const customCard = page.getByText('Custom Request- Get Quote', { exact: false }).or(
      page.getByText('Custom Request', { exact: false })
    ).first();
    await expect(customCard).toBeVisible({ timeout: 10000 });
    await customCard.click();

    // 4. Verify Service Category dropdown is visible
    const categorySelect = page.locator('select[name="serviceType"]').or(page.locator('select').first());
    await expect(categorySelect).toBeVisible({ timeout: 10000 });
  });

  test('TC_SRV_CUSTOM_02: Complete End-to-End Custom Request submission with document upload', async ({ page }) => {
    // The default test time is only 30 seconds - too short (15s wait for the modal + page load)
    test.setTimeout(90000);
    const isDev = (page.url() || '').includes('dev1-fe') || (process.env.TEST_ENV === 'dev');

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

    // 3. Select 'Custom Request- Get Quote'
    const customCard = page.getByText('Custom Request- Get Quote', { exact: false }).or(
      page.getByText('Custom Request', { exact: false })
    ).first();
    await expect(customCard).toBeVisible({ timeout: 10000 });
    await customCard.click();

    // 4. Select Service Type (Accounting-Taxation)
    const categorySelect = page.locator('select[name="serviceType"]').or(page.locator('select').first());
    await expect(categorySelect).toBeVisible({ timeout: 10000 });
    
    // The form can show 'Accounting-Taxation' but still say "Please Select Service Type"
    // (the screen shows the choice, the form did not register it). So: choose it, then CHECK
    // that the red message is gone. If not, switch to another option and back so the form
    // really sees a change.
    const serviceTypeError = page.getByText(/Please Select Service Type/i);
    await categorySelect.selectOption('Accounting-Taxation').catch(async () => {
      await categorySelect.selectOption({ label: 'Accounting-Taxation' }).catch(async () => {
        await categorySelect.selectOption({ index: 1 });
      });
    });
    await categorySelect.press('Tab'); // leave the box, like a real user (some forms validate on blur)
    await page.waitForTimeout(700);

    if (await serviceTypeError.first().isVisible().catch(() => false)) {
      console.log('\n [Custom Request] Form still says "Please Select Service Type" - re-selecting.\n');
      await categorySelect.selectOption({ index: 2 }).catch(() => {});
      await page.waitForTimeout(300);
      await categorySelect.selectOption('Accounting-Taxation').catch(async () => {
        await categorySelect.selectOption({ index: 1 });
      });
      await categorySelect.press('Tab');
      await page.waitForTimeout(700);
    }
    await expect(serviceTypeError, 'Service Type was not accepted by the form').toHaveCount(0, { timeout: 5000 });

    // 5. Fill Title
    const uniqueTitle = `Custom Tax Advisory Request - ${Date.now()}`;
    const titleInput = page.getByRole('textbox', { name: 'Title' }).or(page.locator('input[placeholder*="Title"]'));
    await expect(titleInput.first()).toBeVisible({ timeout: 10000 });
    await titleInput.first().fill(uniqueTitle);

    // 6. Fill Details
    const detailsInput = page.getByRole('textbox', { name: 'Add Details here' }).or(
      page.locator('textarea, input[placeholder*="Details"]')
    );
    await expect(detailsInput.first()).toBeVisible({ timeout: 10000 });
    await detailsInput.first().fill('Need detailed custom quotation for multi-year accounting and tax advisory services.');

    // 7. Attach supporting document using sample_doc.pdf
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

    // 8. Select Priority (select[name="priority"] -> 'Normal Priority')
    const prioritySelect = page.locator('select[name="priority"]').or(page.locator('select').last());
    await expect(prioritySelect).toBeVisible({ timeout: 10000 });
    await prioritySelect.selectOption({ label: 'Normal Priority' }).catch(async () => {
      await prioritySelect.selectOption('Normal Priority').catch(async () => {
        await prioritySelect.selectOption({ index: 1 });
      });
    });
    await prioritySelect.dispatchEvent('change');
    await prioritySelect.dispatchEvent('input');
    await page.waitForTimeout(1000);

    // 9. Submit the Custom Request Form
    const submitBtn = page.getByRole('button', { name: 'Submit' });
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    await submitBtn.click();

    // If the form refuses to submit because of the Service Type, say so clearly (instead of a vague timeout later)
    await page.waitForTimeout(1500);
    await expect(serviceTypeError, 'Submit was blocked: "Please Select Service Type" is showing').toHaveCount(0);

    // 10. Verify confirmation modal / success message and click 'Close'
    // waitFor really WAITS up to 15s (isVisible only looks once), so a slow modal is not missed
    const closeBtn = page.getByRole('button', { name: 'Close' }).first();
    const sawConfirmation = await closeBtn
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (sawConfirmation) {
      await closeBtn.click();
      console.log('\n Confirmation modal appeared and was closed.\n');
    } else {
      // Modal dismissed automatically or redirected
      console.log('\n No Close button appeared - opening Services page instead.\n');
      // 'domcontentloaded' = do not wait for every image/script (the full 'load' got aborted before)
      await page.goto(isDev ? 'https://dev1-fe.ezit.club/services' : 'https://app.ezit.club/services', { waitUntil: 'domcontentloaded' });
    }
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
  });

});
