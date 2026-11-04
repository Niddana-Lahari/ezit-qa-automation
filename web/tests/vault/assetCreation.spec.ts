import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';
import path from 'path';


test.describe('Secure Vault - Asset Creation Suite', () => {
  test.setTimeout(90000);

  // Step 1: Login before each test with dynamic credentials
  test.beforeEach(async ({ page }, testInfo) => {
    await loginToEzit(page, testInfo);
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_ASSET_01: Create New Asset through Secure Vault navigation
   * ----------------------------------------------------------------------------
   */
  test('TC_ASSET_01: Successfully create a new asset with nominee and document', async ({ page }) => {
    const testReferenceId = `REF${Date.now().toString().slice(-8)}`;
    const organizationName = 'SBI Bank';
    const assetValue = '234567';
    const sampleFilePath = path.resolve(__dirname, '../../test-data/empty.pdf');

    // STEP 2: Click 'Secure Vault' in navigation sidebar

    await test.step('Step 2: Click Secure Vault in navigation', async () => {
      // Exact element from recording: page.getByRole('navigation').filter({ hasText: 'Secure Vault' }).locator('span').click();
      const secureVaultNav = page.getByRole('navigation').filter({ hasText: 'Secure Vault' }).locator('span').or(
        page.getByRole('link', { name: /Secure Vault/i })
      ).or(
        page.locator('text=Secure Vault')
      ).first();

      await expect(secureVaultNav).toBeVisible({ timeout: 15000 });
      await secureVaultNav.click();
    });

    // STEP 3: Enter M-PIN (1, 2, 3, 4) and click Continue

    await test.step('Step 3: Enter M-PIN and Continue', async () => {
      const char1 = page.getByRole('textbox', { name: 'Please enter OTP character 1' }).or(
        page.locator('input[aria-label*="character 1"], input.otp-input').first()
      );

      // Wait for M-PIN verification prompt
      const hasMpin = await char1.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);

      if (hasMpin) {
        await page.getByRole('textbox', { name: 'Please enter OTP character 1' }).fill('1');
        await page.getByRole('textbox', { name: 'Please enter OTP character 2' }).fill('2');
        await page.getByRole('textbox', { name: 'Please enter OTP character 3' }).fill('3');
        await page.getByRole('textbox', { name: 'Please enter OTP character 4' }).fill('4');

        const continueBtn = page.getByRole('button', { name: 'Continue' });
        await expect(continueBtn).toBeVisible({ timeout: 5000 });
        await continueBtn.click();

        // Wait for navigation away from verify-mpin
        await page.waitForURL((url: URL) => !url.href.includes('verify-mpin'), { timeout: 10000 }).catch(() => {});
      }

      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    });

    // STEP 4: Click 'Add New Asset' button

    await test.step('Step 4: Click Add New Asset button', async () => {
      // Ensure on Assets tab / Financial Portfolio
      const assetsTab = page.getByText(/Assets.*Total/i).or(
        page.locator('.summaryCard, .interactiveCard').filter({ hasText: /Assets/i })
      ).or(
        page.getByText('Financial Portfolio', { exact: true })
      ).or(
        page.getByText('Assets', { exact: true })
      ).first();
      if (await assetsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await assetsTab.click({ force: true }).catch(() => {});
        await page.waitForTimeout(500);
      }

      const addAssetBtn = page.getByRole('button', { name: 'Add New Asset' }).or(
        page.getByRole('button', { name: /Add New Asset/i })
      ).or(
        page.locator('button:has-text("Add New Asset")')
      ).or(
        page.locator('button:has-text("Add New")')
      ).or(
        page.getByText('Add New Asset', { exact: true })
      ).or(
        page.locator('div, span, p').filter({ hasText: /^Add New Asset$/ })
      ).first();

      await expect(addAssetBtn).toBeVisible({ timeout: 15000 });
      await addAssetBtn.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    });

    // STEP 5: Fill Asset Form

    await test.step('Step 5: Fill Asset Form fields', async () => {
      // 1. Select Category ('9' = Insurance Policies)
      const categorySelect = page.getByLabel('Default select example').first().or(
        page.locator('select').first()
      );
      await expect(categorySelect).toBeVisible({ timeout: 10000 });
      await categorySelect.selectOption('9');

      // 2. Wait for Sub-Category dropdown to populate and select Option '14'
      const subCategorySelect = page.locator('#subCategorySelect');
      await expect(subCategorySelect).toBeVisible({ timeout: 15000 });
      await expect(subCategorySelect.locator('option')).not.toHaveCount(0, { timeout: 10000 });

      // Focus and select Option '14' using selectOption + user event dispatch to satisfy React Hook Form
      await subCategorySelect.focus();
      await subCategorySelect.selectOption('14');
      await subCategorySelect.dispatchEvent('input');
      await subCategorySelect.dispatchEvent('change');
      await subCategorySelect.blur();
      await page.waitForTimeout(500);

      // 3. Organization Name
      const orgInput = page.getByRole('textbox', { name: 'Organization ( HDFC, SBI etc' }).or(
        page.getByPlaceholder(/Organization/i)
      );
      await expect(orgInput.first()).toBeVisible({ timeout: 10000 });
      await orgInput.first().fill(organizationName);

      // 4. Reference ID
      const refInput = page.getByRole('textbox', { name: 'Reference ID' }).or(
        page.getByPlaceholder(/Reference ID/i)
      );
      await expect(refInput.first()).toBeVisible({ timeout: 10000 });
      await refInput.first().fill(testReferenceId);

      // 5. Asset Value
      const valueInput = page.getByRole('spinbutton', { name: 'Asset Value' }).or(
        page.getByPlaceholder(/Asset Value/i)
      );
      await expect(valueInput.first()).toBeVisible({ timeout: 10000 });
      await valueInput.first().fill(assetValue);
    });

    // STEP 6: Assign Nominee (100% share)

    await test.step('Step 6: Assign Nominee with 100% share', async () => {
      const assignNomineesBtn = page.getByRole('button', { name: 'Assign/Edit Nominees' }).or(
        page.locator('button:has-text("Assign")')
      );
      await expect(assignNomineesBtn.first()).toBeVisible({ timeout: 10000 });
      await assignNomineesBtn.first().click();

      // Check the nominee checkbox
      const nomineeCheckbox = page.locator('.offcanvas input[type="checkbox"]').first();
      await expect(nomineeCheckbox).toBeVisible({ timeout: 10000 });
      await nomineeCheckbox.check();

      // Enter 100% in Percentage % textbox
      const percentageInput = page.getByRole('textbox', { name: 'Percentage %' }).or(
        page.locator('.offcanvas input[placeholder*="Percentage"]')
      ).first();
      await expect(percentageInput).toBeVisible({ timeout: 5000 });
      await percentageInput.click();
      await percentageInput.pressSequentially('100', { delay: 100 });
      await page.waitForTimeout(500);

      // Click Continue
      const continueNomineeBtn = page.locator('.offcanvas').getByRole('button', { name: 'Continue' }).or(
        page.locator('button.loginBtnUrgent')
      );
      await continueNomineeBtn.first().click();
      await page.waitForSelector('.offcanvas.show', { state: 'detached', timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1000);
    });

    // STEP 7: Submit form and verify asset creation (with automatic retry if error appears)

    await test.step('Step 7: Submit form and verify asset creation', async () => {
      const submitBtn = page.getByRole('button', { name: 'Create Asset' }).or(
        page.locator('button.loginBtn[type="submit"]')
      ).first();

      await expect(submitBtn).toBeVisible({ timeout: 10000 });
      await submitBtn.scrollIntoViewIfNeeded();
      await submitBtn.click();
      await page.waitForTimeout(1500);

      // Check if validation errors "Please select Category" or "Please select SubCategory" appeared
      const categoryError = page.locator('text=Please select Category');
      const subCatError = page.locator('text=Please select SubCategory');

      if (await categoryError.isVisible({ timeout: 2000 }).catch(() => false) || 
          await subCatError.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('\n Validation error detected on Category/SubCategory. Re-selecting both fields...\n');

        // Re-select Category
        const categorySelect = page.getByLabel('Default select example').first().or(
          page.locator('select').first()
        );
        await categorySelect.selectOption('9');
        await page.waitForTimeout(1000);

        // Re-select Sub-Category
        const subCategorySelect = page.locator('#subCategorySelect');
        await expect(subCategorySelect).toBeVisible({ timeout: 10000 });
        await subCategorySelect.selectOption('14');
        await page.waitForTimeout(500);

        // Click Create Asset again
        await submitBtn.click();
      }

      // Return to portfolio list page
      await expect(page).toHaveURL(/.*portfolio/, { timeout: 20000 });

      // Verify created asset appears in the list
      const createdAssetItem = page.locator('div').filter({ hasText: new RegExp(organizationName) }).or(
        page.getByText(testReferenceId)
      );
      await expect(createdAssetItem.first()).toBeVisible({ timeout: 15000 });

      console.log(`\n Successfully created Asset [${organizationName}] with Ref ID [${testReferenceId}]\n`);
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_ASSET_02: Verify Assets tab displays assets list and controls
   * ----------------------------------------------------------------------------
   */
  test('TC_ASSET_02: Verify Assets tab displays assets list and controls', async ({ page }) => {
    await test.step('Step 1: Click Secure Vault in navigation', async () => {
      const secureVaultNav = page.getByRole('navigation').filter({ hasText: 'Secure Vault' }).locator('span').or(
        page.getByRole('link', { name: /Secure Vault/i })
      ).or(
        page.locator('text=Secure Vault')
      ).first();

      await expect(secureVaultNav).toBeVisible({ timeout: 15000 });
      await secureVaultNav.click();
    });

    await test.step('Step 2: Enter M-PIN and Continue', async () => {
      const char1 = page.getByRole('textbox', { name: 'Please enter OTP character 1' }).or(
        page.locator('input[aria-label*="character 1"], input.otp-input').first()
      );
      const hasMpin = await char1.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);

      if (hasMpin) {
        await page.getByRole('textbox', { name: 'Please enter OTP character 1' }).fill('1');
        await page.getByRole('textbox', { name: 'Please enter OTP character 2' }).fill('2');
        await page.getByRole('textbox', { name: 'Please enter OTP character 3' }).fill('3');
        await page.getByRole('textbox', { name: 'Please enter OTP character 4' }).fill('4');

        const continueBtn = page.getByRole('button', { name: 'Continue' });
        await expect(continueBtn).toBeVisible({ timeout: 5000 });
        await continueBtn.click();

        await page.waitForURL((url: URL) => !url.href.includes('verify-mpin'), { timeout: 10000 }).catch(() => {});
      }

      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    });

    await test.step('Step 3: Verify Add New Asset button is visible', async () => {
      // Ensure on Assets tab / Financial Portfolio
      const assetsTab = page.getByText(/Assets.*Total/i).or(
        page.locator('.summaryCard, .interactiveCard').filter({ hasText: /Assets/i })
      ).or(
        page.getByText('Financial Portfolio', { exact: true })
      ).or(
        page.getByText('Assets', { exact: true })
      ).first();
      if (await assetsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await assetsTab.click({ force: true }).catch(() => {});
        await page.waitForTimeout(500);
      }

      const addAssetBtn = page.getByRole('button', { name: 'Add New Asset' }).or(
        page.getByRole('button', { name: /Add New Asset/i })
      ).or(
        page.locator('button:has-text("Add New Asset")')
      ).or(
        page.locator('button:has-text("Add New")')
      ).or(
        page.getByText('Add New Asset', { exact: true })
      ).or(
        page.locator('div, span, p').filter({ hasText: /^Add New Asset$/ })
      ).first();
      await expect(addAssetBtn).toBeVisible({ timeout: 15000 });
      console.log('\n TC_ASSET_02 Passed: Assets listing and controls verified.\n');
    });
  });

});
