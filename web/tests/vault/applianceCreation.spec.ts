import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';



test.describe('Secure Vault - Appliance Creation Suite', () => {
  test.setTimeout(90000);

  // Step 1: Login before each test
  test.beforeEach(async ({ page }, testInfo) => {
    await loginToEzit(page, testInfo);
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_APPLIANCE_01: Create New Appliance via Secure Vault Navigation
   * ----------------------------------------------------------------------------
   */
  test('TC_APPLIANCE_01: Successfully create a new appliance with warranty details', async ({ page }, testInfo) => {
    // Generate unique serial number to avoid duplicate errors
    const testSerialNo = `SN-${Date.now().toString().slice(-6)}`;
    const brandName = 'LG';
    const appliancePrice = '56';

    // Dates for purchase and warranty
    const purchaseDate = '2026-10-08';
    const warrantyStartDate = '2026-10-06';
    const warrantyExpiryDate = '2026-10-21';

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

      // Wait for navigation away from verify-mpin
      await page.waitForURL((url: URL) => !url.href.includes('verify-mpin'), { timeout: 10000 }).catch(() => {});
      }
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    });

    // STEP 4: Click 'Appliances Portfolio'

    await test.step('Step 4: Click Appliances Portfolio', async () => {
      const appliancesPortfolioBtn = page.getByText('Appliances Portfolio', { exact: true }).or(
        page.locator('a, div, span, nav').filter({ hasText: /Appliances Portfolio/i })
      ).or(
        page.locator('.summaryCard.interactiveCard').filter({ hasText: /Appliance/i })
      ).first();

      await expect(appliancesPortfolioBtn).toBeVisible({ timeout: 15000 });
      await appliancesPortfolioBtn.click({ force: true });

      // Ensure navigation to Appliances portfolio completes; fallback to direct url if client routing didn't change
      if (!page.url().toLowerCase().includes('appliances')) {
        await page.waitForURL((url) => url.href.toLowerCase().includes('appliances'), { timeout: 4000 }).catch(async () => {
          await page.goto('/portfolio?at=Appliances');
        });
      }

      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    });

    // STEP 5: Click 'Add New Appliance'

    await test.step('Step 5: Click Add New Appliance button', async () => {
      // Specifically target visible button containing Appliance inside the main tabpanel
      const addApplianceBtn = page.getByRole('button', { name: 'Add New Appliance', exact: true }).or(
        page.locator('button:visible:has-text("Add New Appliance")')
      ).or(
        page.locator('button:visible:has-text("Appliance")')
      ).or(
        page.getByText('Add New Appliance', { exact: true })
      ).or(
        page.locator('div, span, p').filter({ hasText: /^Add New Appliance$/ })
      ).first();

      await expect(addApplianceBtn.first()).toBeVisible({ timeout: 15000 });
      await addApplianceBtn.first().click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
    });

    // STEP 6: Select Appliance Category ('22')

    await test.step('Step 6: Select Category', async () => {
      // 1. Try native <select> first with fast timeout
      const nativeSelect = page.locator('select').first();
      let selected = false;

      if (await nativeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        selected = await nativeSelect.selectOption('22', { timeout: 2000 })
          .then(() => true)
          .catch(() => nativeSelect.selectOption({ index: 1 }, { timeout: 2000 }).then(() => true))
          .catch(() => false);
        if (selected) {
          await nativeSelect.dispatchEvent('change').catch(() => {});
        }
      }

      // 2. If native select wasn't found or couldn't select, try custom dropdown UI
      if (!selected) {
        const categoryDropdown = page.getByRole('combobox').or(
          page.getByText('Select Category')
        ).or(
          page.locator('div, span, button').filter({ hasText: /^Select Category$/ })
        ).first();

        if (await categoryDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
          await categoryDropdown.click({ force: true });
          await page.waitForTimeout(500);

          const dropdownOption = page.locator('.dropdown-menu .dropdown-item, [role="option"], ul.dropdown-menu li, div.option').filter({ hasNotText: /Select Category/i }).first();
          if (await dropdownOption.isVisible({ timeout: 3000 }).catch(() => false)) {
            await dropdownOption.click({ force: true });
          } else {
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
          }
        }
      }

      await page.waitForTimeout(500);
    });

    // STEP 7: Fill Brand / Company Name

    await test.step('Step 7: Fill Brand Name', async () => {
      const brandInput = page.getByRole('textbox', { name: 'e.g. LG, Samsung' }).or(
        page.getByPlaceholder('e.g. LG, Samsung')
      );
      await expect(brandInput.first()).toBeVisible({ timeout: 10000 });
      await brandInput.first().click();
      await brandInput.first().fill(brandName);
    });

    // STEP 8: Fill Serial Number

    await test.step('Step 8: Fill Serial Number', async () => {
      const serialInput = page.getByRole('textbox', { name: 'e.g. SN-' }).or(
        page.getByPlaceholder('e.g. SN-11223344')
      );
      await expect(serialInput.first()).toBeVisible({ timeout: 10000 });
      await serialInput.first().click();
      await serialInput.first().fill(testSerialNo);
    });

    // STEP 9: Fill Price / Value

    await test.step('Step 9: Fill Price Value', async () => {
      const priceInput = page.getByRole('spinbutton', { name: 'e.g. 15000' }).or(
        page.getByRole('spinbutton', { name: 'e.g.' })
      ).or(
        page.getByPlaceholder('e.g. 15000')
      ).or(
        page.locator('input[name="applianceValue"], input[name="price"], input[type="number"]')
      ).first();
      await expect(priceInput).toBeVisible({ timeout: 10000 });
      await priceInput.click();
      await priceInput.fill(appliancePrice);
    });

    // STEP 10: Fill Purchase and Warranty Dates

    await test.step('Step 10: Fill Purchase and Warranty Dates', async () => {
      const purchaseDateInput = page.locator('input[name="purchaseDate"]');
      await expect(purchaseDateInput).toBeVisible({ timeout: 5000 });
      await purchaseDateInput.fill(purchaseDate);

      const warrantyStartInput = page.locator('input[name="warrantyStartDate"]');
      await expect(warrantyStartInput).toBeVisible({ timeout: 5000 });
      await warrantyStartInput.fill(warrantyStartDate);

      const warrantyExpiryInput = page.locator('input[name="warrantyExpiryDate"]');
      await expect(warrantyExpiryInput).toBeVisible({ timeout: 5000 });
      await warrantyExpiryInput.fill(warrantyExpiryDate);
    });

    // STEP 11: Click Save Appliance and verify

    await test.step('Step 11: Save Appliance and verify in list', async () => {
      const saveBtn = page.getByRole('button', { name: 'Save Appliance' }).or(
        page.locator('button:has-text("Save Appliance")')
      ).first();

      await expect(saveBtn).toBeVisible({ timeout: 10000 });
      await saveBtn.scrollIntoViewIfNeeded();
      await saveBtn.click();

      // Verify redirection to portfolio
      await expect(page).toHaveURL(/.*(portfolio|appliances)/i, { timeout: 20000 });

      // Check created appliance is visible in the list
      const createdApplianceItem = page.locator('div').filter({ hasText: new RegExp(brandName) }).or(
        page.getByText(testSerialNo)
      );
      await expect(createdApplianceItem.first()).toBeVisible({ timeout: 15000 });

      console.log(`\n Successfully created Appliance [${brandName}] with Serial [${testSerialNo}]\n`);
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_APPLIANCE_02: Verify Appliances tab displays controls
   * ----------------------------------------------------------------------------
   */
  test('TC_APPLIANCE_02: Verify Appliances tab displays controls', async ({ page }) => {
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

    await test.step('Step 3: Click Appliances Portfolio and verify Add button', async () => {
      const appliancesPortfolioBtn = page.getByText('Appliances Portfolio', { exact: true }).or(
        page.locator('a, div, span, nav').filter({ hasText: /Appliances Portfolio/i })
      ).or(
        page.locator('.summaryCard.interactiveCard').filter({ hasText: /Appliance/i })
      ).first();

      await expect(appliancesPortfolioBtn).toBeVisible({ timeout: 15000 });
      await appliancesPortfolioBtn.click({ force: true });

      // Ensure navigation to Appliances portfolio completes; fallback to direct url if client routing didn't change
      if (!page.url().toLowerCase().includes('appliances')) {
        await page.waitForURL((url) => url.href.toLowerCase().includes('appliances'), { timeout: 4000 }).catch(async () => {
          await page.goto('/portfolio?at=Appliances');
        });
      }

      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});

      const addApplianceBtn = page.getByRole('button', { name: 'Add New Appliance', exact: true }).or(
        page.locator('button:visible:has-text("Add New Appliance")')
      ).or(
        page.locator('button:visible:has-text("Appliance")')
      ).or(
        page.getByText('Add New Appliance', { exact: true })
      ).or(
        page.locator('div, span, p').filter({ hasText: /^Add New Appliance$/ })
      ).first();
      await expect(addApplianceBtn).toBeVisible({ timeout: 15000 });
      console.log('\n TC_APPLIANCE_02 Passed: Appliances controls verified.\n');
    });
  });

});
