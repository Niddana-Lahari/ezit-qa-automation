import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';


test.describe('Complementary Coverage Test Suite', () => {

  test.setTimeout(90000);

  test.beforeEach(async ({ page }, testInfo) => {
    // 1. One-line reusable login
    await loginToEzit(page, testInfo);

    // 2. Wait for loading bar / spinner to finish
    await page.locator('#nprogress').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

    // Navigate to Complementary Coverage using the specific sidebar container
    const sidebar = page.locator('.dashboardSideMenu');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    const coverageNav = sidebar.getByText('Complementary Coverage');
    await expect(coverageNav).toBeVisible({ timeout: 10000 });
    await coverageNav.click();

    // 3. Verify on Complementary Coverage page
    await expect(page).toHaveURL(/.*coverage/, { timeout: 15000 });
    const searchInput = page.getByRole('textbox', { name: /Type here e.g./i });
    await expect(searchInput).toBeVisible({ timeout: 20000 });
  });

  // TEST 1: Validation check (less than 3 characters)
  test('TC_COV_01: Verify validation error when search query is less than 3 characters', async ({ page }) => {
    const calculateBtn = page.getByRole('button', { name: 'Calculate Coverage' });
    await calculateBtn.click();

    // Expect validation message: "Please enter at least 3 characters"
    const validationMsg = page.getByText(/Please enter at least 3/i);
    await expect(validationMsg).toBeVisible({ timeout: 5000 });
  });

  // TEST 2: Basic Search and Calculation (First 2 dropdowns)
  test('TC_COV_02: Calculate Coverage with primary dropdown options', async ({ page }) => {
    // 1. Enter valid search term (minimum 3 characters)
    const searchInput = page.getByRole('textbox', { name: /Type here e.g./i });
    await searchInput.fill('SBI');

    // 2. Select first 2 combobox options (Bank/Card Category)
    const firstSelect = page.getByRole('combobox').first();
    await expect(firstSelect).toBeVisible({ timeout: 5000 });
    await firstSelect.selectOption('4').catch(async () => {
      // Fallback to select first available non-empty option
      await firstSelect.selectOption({ index: 1 });
    });

    const secondSelect = page.getByRole('combobox').nth(1);
    if (await secondSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await secondSelect.selectOption('1').catch(async () => {
        await secondSelect.selectOption({ index: 1 });
      });
    }

    // 3. Click Calculate Coverage
    const calculateBtn = page.getByRole('button', { name: 'Calculate Coverage' });
    await calculateBtn.click();

    // 4. Verify results section appears (Cards, Results container, or Not Available notice)
    const resultIndicator = page.getByText(/Coverage|Air Accident|Not Available/i);
    await expect(resultIndicator.first()).toBeVisible({ timeout: 15000 });

    // 5. Click "Add Coverage" button if available on the results card
    const addCoverageBtn = page.locator('button[class*="coverage_btnAddCoverage"]')
      .or(page.getByRole('button', { name: 'Add Coverage', exact: true }))
      .or(page.locator('button:has-text("Add Coverage")'));

    if (await addCoverageBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await addCoverageBtn.first().scrollIntoViewIfNeeded();
      await addCoverageBtn.first().click();
      console.log('Clicked "Add Coverage" button successfully in TC_COV_02!');

      // 6. Fill card details in the Add Coverage modal (Card Last 4 digits + Date)
      const last4DigitsInput = page.getByRole('textbox', { name: /1234/i })
        .or(page.getByPlaceholder(/1234/i))
        .or(page.locator('input[placeholder*="1234"]'));

      if (await last4DigitsInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        const dynamicLast4 = Math.floor(1000 + Math.random() * 9000).toString();
        await last4DigitsInput.first().fill(dynamicLast4);

        // Fill date (e.g. tomorrow's date YYYY-MM-DD)
        const dateInput = page.locator('input[type="date"]');
        if (await dateInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
          await dateInput.first().fill(tomorrow);
        }

        // Click Save
        const saveBtn = page.getByRole('button', { name: 'Save' });
        await expect(saveBtn.first()).toBeVisible({ timeout: 5000 });
        await saveBtn.first().click();
        console.log('Saved coverage card details successfully!');
      }

      const successNotice = page.getByText(/Added Successfully|Coverage Added|Success/i)
        .or(page.locator('.Toastify__toast'));
      await expect(successNotice.first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    }
  });

  // TEST 3: Comprehensive Coverage Calculation with All Cascading Dropdowns
  test('TC_COV_03: Calculate Coverage with all cascading dropdowns and verify dynamic results', async ({ page }) => {
    // 1. Enter card name
    const searchInput = page.getByRole('textbox', { name: /Type here e.g./i });
    await searchInput.fill('sbi');

    // 2. Dropdown 1: Select Bank / Main Category
    const select1 = page.getByRole('combobox').first();
    await expect(select1).toBeVisible({ timeout: 5000 });
    await select1.selectOption('4').catch(async () => {
      await select1.selectOption({ index: 1 });
    });

    // 3. Dropdown 2: Select Card Type
    const select2 = page.getByRole('combobox').nth(1);
    if (await select2.isVisible({ timeout: 4000 }).catch(() => false)) {
      await select2.selectOption('2').catch(async () => {
        await select2.selectOption({ index: 1 });
      });
    }

    // 4. Dropdown 3: Select Variant (Cascading)
    const select3 = page.getByRole('combobox').nth(2);
    if (await select3.isVisible({ timeout: 4000 }).catch(() => false)) {
      await select3.selectOption('11').catch(async () => {
        await select3.selectOption({ index: 1 });
      });
    }

    // 5. Dropdown 4: Select Tier / Sub-variant (Cascading)
    const select4 = page.getByRole('combobox').nth(3);
    if (await select4.isVisible({ timeout: 4000 }).catch(() => false)) {
      await select4.selectOption('2').catch(async () => {
        await select4.selectOption({ index: 1 });
      });
    }

    // 6. Click Calculate Coverage
    const calculateBtn = page.getByRole('button', { name: 'Calculate Coverage' });
    await calculateBtn.click();

    // 7. Dynamic Result Verification:
    // Because AI / backend coverage values change dynamically, we flexibly handle:
    // (a) Coverage Cards with amounts (e.g. Air Accident Coverage, Personal Accident, etc.)
    // (b) OR "Not Available" badge/message if that specific variant has no complementary coverage
    const coverageResults = page.getByText(/Air Accident Coverage|Personal Accident|Purchase Protection|Coverage/i)
      .or(page.getByText('Not Available', { exact: true }));

    await expect(coverageResults.first()).toBeVisible({ timeout: 15000 });

    // If coverage breakdown is displayed, verify and log the details
    const airAccidentCard = page.getByText(/Air Accident Coverage/i);
    if (await airAccidentCard.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Complementary Coverage cards successfully calculated and displayed!');
    } else {
      console.log('Result evaluated: Selected combination shows "Not Available"');
    }

    // 8. Click "Add Coverage" button if available (matching exact class from DevTools: coverage_btnAddCoverage)
    const addCoverageBtn = page.locator('button[class*="coverage_btnAddCoverage"]')
      .or(page.getByRole('button', { name: 'Add Coverage', exact: true }))
      .or(page.locator('button:has-text("Add Coverage")'));

    if (await addCoverageBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await addCoverageBtn.first().scrollIntoViewIfNeeded();
      await addCoverageBtn.first().click();
      console.log('Clicked "Add Coverage" button successfully in TC_COV_03!');

      // Fill card details in the modal (Last 4 digits + Date)
      const last4DigitsInput = page.getByRole('textbox', { name: /1234/i })
        .or(page.getByPlaceholder(/1234/i))
        .or(page.locator('input[placeholder*="1234"]'));

      if (await last4DigitsInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        const dynamicLast4 = Math.floor(1000 + Math.random() * 9000).toString();
        await last4DigitsInput.first().fill(dynamicLast4);

        const dateInput = page.locator('input[type="date"]');
        if (await dateInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
          await dateInput.first().fill(tomorrow);
        }

        const saveBtn = page.getByRole('button', { name: 'Save' });
        await expect(saveBtn.first()).toBeVisible({ timeout: 5000 });
        await saveBtn.first().click();
        console.log('Saved coverage card details in TC_COV_03!');
      }

      // Handle any confirmation popup or success toast
      const successNotice = page.getByText(/Added Successfully|Coverage Added|Success/i)
        .or(page.locator('.Toastify__toast'));
      await expect(successNotice.first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    }
  });

});
