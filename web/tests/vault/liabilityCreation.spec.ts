import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';



test.describe('Secure Vault - Liability Creation Suite', () => {
  test.setTimeout(90000);

  // Step 1: Dynamic Login based on project (Dev vs Prod)
  test.beforeEach(async ({ page }, testInfo) => {
    await loginToEzit(page, testInfo);
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_LIAB_01: Create New Liability via Secure Vault Navigation
   * ----------------------------------------------------------------------------
   */
  test('TC_LIAB_01: Successfully create a new liability with nominee', async ({ page }) => {
    const testLoanId = `LOAN-${Date.now().toString().slice(-6)}`;
    const organizationName = 'SBI';
    const outstandingValue = '5678';

    // STEP 2: Click 'Secure Vault' in navigation sidebar

    await test.step('Step 2: Click Secure Vault in navigation', async () => {
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

    // STEP 4: Switch to Liabilities tab if not active and click 'Add New Liability'

    await test.step('Step 4: Click Add New Liability button', async () => {
      // Ensure on Liabilities tab
      const isLiabilityBtnVisible = await page.locator('button:visible:has-text("Add New Liability"), button:visible:has-text("Liability")').first().isVisible({ timeout: 1500 }).catch(() => false);
      if (!isLiabilityBtnVisible) {
        const liabilitiesTab = page.getByText(/Liabilities.*Total/i).or(
          page.locator('.summaryCard, .interactiveCard').filter({ hasText: /Liabilities/i })
        ).or(
          page.getByText('Liabilities', { exact: true })
        ).first();
        if (await liabilitiesTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await liabilitiesTab.click({ force: true }).catch(() => {});
          await page.waitForTimeout(500);
        }
        if (!await page.locator('button:visible:has-text("Add New Liability"), button:visible:has-text("Liability")').first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.goto('/portfolio?at=Liabilities');
          await page.waitForLoadState('domcontentloaded');
        }
      }

      const addLiabilityBtn = page.getByRole('button', { name: /Add New Liability/i }).or(
        page.locator('button:visible:has-text("Add New Liability")')
      ).or(
        page.locator('button:visible:has-text("Liability")')
      ).or(
        page.getByText('Add New Liability', { exact: true })
      ).or(
        page.locator('div, span, p').filter({ hasText: /^Add New Liability$/ })
      ).first();

      await expect(addLiabilityBtn).toBeVisible({ timeout: 15000 });
      await addLiabilityBtn.click();
      await page.waitForLoadState('domcontentloaded'); await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    });

    // STEP 5: Fill Liability Form

    await test.step('Step 5: Fill Liability Form fields', async () => {
      // 1. Select Category (Bank Loans = '11')
      const categorySelect = page.locator('#categorySelect select, select[name="category"]').or(
        page.locator('select').first()
      );
      await expect(categorySelect.first()).toBeVisible({ timeout: 10000 });
      await categorySelect.first().focus();
      try {
        await categorySelect.first().selectOption('11');
      } catch {
        await categorySelect.first().selectOption({ index: 1 });
      }
      await categorySelect.first().dispatchEvent('input');
      await categorySelect.first().dispatchEvent('change');
      await categorySelect.first().blur();
      await page.waitForTimeout(1000);

      // 2. Select Sub-Category (Home = '20')
      const subCategorySelect = page.locator('#subCategorySelect, select[name="subCatField"]').or(
        page.locator('select').nth(1)
      );
      await expect(subCategorySelect.first()).toBeVisible({ timeout: 15000 });
      await expect(subCategorySelect.locator('option')).not.toHaveCount(0, { timeout: 10000 });

      await subCategorySelect.first().focus();
      try {
        await subCategorySelect.first().selectOption('20');
      } catch {
        await subCategorySelect.first().selectOption({ index: 1 });
      }
      await subCategorySelect.first().dispatchEvent('input');
      await subCategorySelect.first().dispatchEvent('change');
      await subCategorySelect.first().blur();
      await page.waitForTimeout(500);

      // 3. Organization Name
      const orgInput = page.getByRole('textbox', { name: /Organization/i }).or(
        page.getByPlaceholder(/Organization/i)
      );
      await expect(orgInput.first()).toBeVisible({ timeout: 10000 });
      await orgInput.first().click();
      await orgInput.first().fill(organizationName);

      // 4. Loan / Liability ID
      const refInput = page.getByRole('textbox', { name: /Loan\/Liability ID/i }).or(
        page.getByPlaceholder(/Loan\/Liability ID/i)
      );
      await expect(refInput.first()).toBeVisible({ timeout: 10000 });
      await refInput.first().click();
      await refInput.first().fill(testLoanId);

      // 5. Outstanding Value
      const valueInput = page.getByRole('spinbutton', { name: /Outstanding Value/i }).or(
        page.getByPlaceholder(/Outstanding Value/i)
      ).or(
        page.locator('input[name="outstandingValue"], input[name="assetValue"], input[type="number"]')
      ).first();
      await expect(valueInput).toBeVisible({ timeout: 10000 });
      await valueInput.click();
      await valueInput.fill(outstandingValue);
    });

    // STEP 6: Assign Nominee (100% share)

    await test.step('Step 6: Assign Nominee with 100% share', async () => {
      const assignNomineesBtn = page.getByRole('button', { name: /Assign\/Edit Nominees/i }).or(
        page.locator('button:has-text("Assign")')
      );
      await expect(assignNomineesBtn.first()).toBeVisible({ timeout: 10000 });
      await assignNomineesBtn.first().click();

      // Check nominee checkbox
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

    // STEP 7: Submit Liability Form (with self-healing retry if validation triggers)

    await test.step('Step 7: Submit form and verify liability creation', async () => {
      const submitBtn = page.getByRole('button', { name: 'Create Liability' }).or(
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
        console.log('\n Validation error detected on Liability Category/SubCategory. Re-selecting both fields...\n');

        const categorySelect = page.locator('#categorySelect select, select[name="category"]').or(page.locator('select').first());
        await categorySelect.first().focus();
        try {
          await categorySelect.first().selectOption('11');
        } catch {
          await categorySelect.first().selectOption({ index: 1 });
        }
        await categorySelect.first().dispatchEvent('input');
        await categorySelect.first().dispatchEvent('change');
        await categorySelect.first().blur();
        await page.waitForTimeout(1000);

        const subCategorySelect = page.locator('#subCategorySelect, select[name="subCatField"]').or(page.locator('select').nth(1));
        await subCategorySelect.first().focus();
        try {
          await subCategorySelect.first().selectOption('20');
        } catch {
          await subCategorySelect.first().selectOption({ index: 1 });
        }
        await subCategorySelect.first().dispatchEvent('input');
        await subCategorySelect.first().dispatchEvent('change');
        await subCategorySelect.first().blur();
        await page.waitForTimeout(500);

        // Click Create Liability again
        await submitBtn.click();
      }

      // Return to portfolio list page
      await expect(page).toHaveURL(/.*portfolio/, { timeout: 20000 });

      // Verify created liability appears in the list
      const createdLiabilityItem = page.locator('div').filter({ hasText: new RegExp(organizationName) }).or(
        page.getByText(testLoanId)
      );
      await expect(createdLiabilityItem.first()).toBeVisible({ timeout: 15000 });

      console.log(`\n Successfully created Liability [${organizationName}] with Loan ID [${testLoanId}]\n`);
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_LIAB_02: Verify Liabilities tab displays controls
   * ----------------------------------------------------------------------------
   */
  test('TC_LIAB_02: Verify Liabilities tab displays controls', async ({ page }) => {
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

    await test.step('Step 3: Verify Add New Liability button is visible', async () => {
      // Ensure on Liabilities tab
      const isLiabilityBtnVisible = await page.locator('button:visible:has-text("Add New Liability"), button:visible:has-text("Liability")').first().isVisible({ timeout: 1500 }).catch(() => false);
      if (!isLiabilityBtnVisible) {
        const liabilitiesTab = page.getByText(/Liabilities.*Total/i).or(
          page.locator('.summaryCard, .interactiveCard').filter({ hasText: /Liabilities/i })
        ).or(
          page.getByText('Liabilities', { exact: true })
        ).first();
        if (await liabilitiesTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await liabilitiesTab.click({ force: true }).catch(() => {});
          await page.waitForTimeout(500);
        }
        if (!await page.locator('button:visible:has-text("Add New Liability"), button:visible:has-text("Liability")').first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.goto('/portfolio?at=Liabilities');
          await page.waitForLoadState('domcontentloaded');
        }
      }

      const addLiabilityBtn = page.getByRole('button', { name: /Add New Liability/i }).or(
        page.locator('button:visible:has-text("Add New Liability")')
      ).or(
        page.locator('button:visible:has-text("Liability")')
      ).or(
        page.getByText('Add New Liability', { exact: true })
      ).or(
        page.locator('div, span, p').filter({ hasText: /^Add New Liability$/ })
      );
      await expect(addLiabilityBtn.first()).toBeVisible({ timeout: 15000 });
      console.log('\n TC_LIAB_02 Passed: Liabilities controls verified.\n');
    });
  });

});
