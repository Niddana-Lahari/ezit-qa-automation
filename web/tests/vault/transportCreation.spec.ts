import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';



test.describe('Secure Vault - Transport Creation Suite', () => {
  test.setTimeout(90000);

  // Step 1: Login before each test with dynamic credentials
  test.beforeEach(async ({ page }, testInfo) => {
    await loginToEzit(page, testInfo);
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_TRANSPORT_01: Create New Transport with Document Entry
   * ----------------------------------------------------------------------------
   */
  test('TC_TRANSPORT_01: Successfully create a new transport with document entry', async ({ page }) => {
    // Generate unique registration plate to avoid duplicate errors
    const testRegNumber = `KA${Date.now().toString().slice(-6)}`;
    const vehicleModel = 'Maruti Swift';
    const vehicleBrand = 'Maruti';
    const policyNumber = `RC-${Date.now().toString().slice(-4)}`;
    const issuerName = 'RTO';
    const premiumAmount = '67890';
    const issueDate = '2026-10-08';
    const expiryDate = '2027-10-14';

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

      // Wait for navigation away from verify-mpin so backend session unlocks
      await page.waitForURL((url: URL) => !url.href.includes('verify-mpin'), { timeout: 10000 }).catch(() => {});
      }
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    });

    // STEP 4: Navigate to Transport Portfolio

    await test.step('Step 4: Navigate to Transport Portfolio', async () => {
      const transportPortfolioBtn = page.getByText('Transport Portfolio', { exact: true }).or(
        page.locator('a, div, span, nav').filter({ hasText: /Transport Portfolio/i })
      ).or(
        page.locator('.summaryCard.interactiveCard').filter({ hasText: /Transport/i })
      ).first();

      if (await transportPortfolioBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await transportPortfolioBtn.click({ force: true }).catch(() => {});
      }

      if (!page.url().toLowerCase().includes('transport')) {
        await page.goto('/portfolio?at=Transport');
      }

      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    });

    // STEP 5: Click 'Add New Transport'

    await test.step('Step 5: Click Add New Transport button', async () => {
      const addTransportBtn = page.getByRole('button', { name: 'Add New Transport', exact: true }).or(
        page.getByRole('button', { name: 'Add New Vehicle', exact: true })
      ).or(
        page.locator('button:visible:has-text("Add New Transport")')
      ).or(
        page.locator('button:visible:has-text("Transport")')
      ).or(
        page.getByText('Add New Transport', { exact: true })
      ).or(
        page.getByText('Add New Vehicle', { exact: true })
      ).or(
        page.locator('div, span, p').filter({ hasText: /^Add New (Transport|Vehicle)$/ })
      );

      await expect(addTransportBtn.first()).toBeVisible({ timeout: 15000 });
      await addTransportBtn.first().click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
    });

    // STEP 6: Fill Vehicle Model / Name

    await test.step('Step 6: Fill Vehicle Model Name', async () => {
      const modelInput = page.getByRole('textbox', { name: 'e.g. Yamaha FZ / Maruti Swift' }).or(
        page.getByPlaceholder(/Yamaha FZ \/ Maruti Swift/i)
      );
      await expect(modelInput.first()).toBeVisible({ timeout: 10000 });
      await modelInput.first().click();
      await modelInput.first().fill(vehicleModel);
    });

    // STEP 7: Fill Registration Number

    await test.step('Step 7: Fill Registration Number', async () => {
      const regInput = page.getByRole('textbox', { name: 'e.g. KA01AB1234' }).or(
        page.getByPlaceholder(/KA01AB1234/i)
      );
      await expect(regInput.first()).toBeVisible({ timeout: 10000 });
      await regInput.first().click();
      await regInput.first().fill(testRegNumber);
    });

    // STEP 8: Select Vehicle Category ('25')

    await test.step('Step 8: Select Category', async () => {
      // 1. Try native <select> first with fast timeout
      const nativeSelect = page.locator('select').first();
      let selected = false;

      if (await nativeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        selected = await nativeSelect.selectOption('25', { timeout: 2000 })
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

    // STEP 9: Fill Manufacturer / Brand

    await test.step('Step 9: Fill Manufacturer / Brand', async () => {
      const brandInput = page.getByRole('textbox', { name: 'e.g. Maruti, Honda' }).or(
        page.getByPlaceholder(/Maruti, Honda/i)
      );
      await expect(brandInput.first()).toBeVisible({ timeout: 10000 });
      await brandInput.first().click();
      await brandInput.first().fill(vehicleBrand);
    });

    // STEP 10: Add Document Entry

    await test.step('Step 10: Add Document Entry details', async () => {
      const addDocBtn = page.getByRole('button', { name: 'Add Document Entry' }).or(
        page.locator('button:has-text("Add Document Entry")')
      );
      await expect(addDocBtn.first()).toBeVisible({ timeout: 10000 });
      await addDocBtn.first().click();

      // Select Document Type ('RC')
      const docTypeSelect = page.locator('.modal select, form select, select').nth(1).or(
        page.getByRole('combobox').nth(1)
      ).first();
      
      let docSelected = false;
      if (await docTypeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        docSelected = await docTypeSelect.selectOption('RC', { timeout: 2000 })
          .then(() => true)
          .catch(() => docTypeSelect.selectOption({ index: 1 }, { timeout: 2000 }).then(() => true))
          .catch(() => false);
        if (docSelected) {
          await docTypeSelect.dispatchEvent('change').catch(() => {});
        }
      }
      if (!docSelected) {
        const docDropdown = page.getByText(/Select Document Type|Document Type/i).first();
        if (await docDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
          await docDropdown.click({ force: true });
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        }
      }

      // Fill Policy / Cert No
      const docNoInput = page.getByRole('textbox', { name: 'e.g. Policy No, Cert No' }).or(
        page.getByPlaceholder(/Policy No, Cert No/i)
      );
      await expect(docNoInput.first()).toBeVisible({ timeout: 5000 });
      await docNoInput.first().click();
      await docNoInput.first().fill(policyNumber);

      // Fill Issuer (e.g. 'RTO')
      const issuerInput = page.getByRole('textbox', { name: 'e.g. Go Digit, RTO' }).or(
        page.getByPlaceholder(/Go Digit, RTO/i)
      );
      await expect(issuerInput.first()).toBeVisible({ timeout: 5000 });
      await issuerInput.first().click();
      await issuerInput.first().fill(issuerName);

      // Fill Premium Amount
      const amountInput = page.getByRole('spinbutton', { name: 'e.g. Premium amount' }).or(
        page.getByPlaceholder(/Premium amount/i)
      );
      await expect(amountInput.first()).toBeVisible({ timeout: 5000 });
      await amountInput.first().click();
      await amountInput.first().fill(premiumAmount);

      // Fill Dates
      const dateInputs = page.locator('input[type="date"]');
      if (await dateInputs.nth(0).isVisible({ timeout: 3000 }).catch(() => false)) {
        await dateInputs.nth(0).fill(issueDate);
      }
      if (await dateInputs.nth(1).isVisible({ timeout: 3000 }).catch(() => false)) {
        await dateInputs.nth(1).fill(expiryDate);
      }
    });

    // STEP 11: Click Save Transport and verify

    await test.step('Step 11: Save Transport Form and verify in list', async () => {
      const saveBtn = page.getByRole('button', { name: 'Save Transport' }).or(
        page.locator('button:has-text("Save Transport")')
      );
      await expect(saveBtn.first()).toBeVisible({ timeout: 10000 });
      await saveBtn.first().click();

      // Verify redirection to portfolio
      await expect(page).toHaveURL(/.*(portfolio|transport)/i, { timeout: 20000 });

      // Verify created transport item in the list
      const createdTransportItem = page.locator('div').filter({ hasText: new RegExp(vehicleModel) }).or(
        page.getByText(testRegNumber)
      );
      await expect(createdTransportItem.first()).toBeVisible({ timeout: 15000 });

      console.log(`\n Successfully created Transport [${vehicleModel}] with Reg No [${testRegNumber}]\n`);
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_TRANSPORT_02: Verify Transport tab displays controls
   * ----------------------------------------------------------------------------
   */
  test('TC_TRANSPORT_02: Verify Transport tab displays controls', async ({ page }) => {
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

        // Wait for navigation away from verify-mpin so backend session unlocks
        await page.waitForURL((url: URL) => !url.href.includes('verify-mpin'), { timeout: 10000 }).catch(() => {});
      }

      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    });

    await test.step('Step 3: Navigate to Transport Portfolio and verify Add button', async () => {
      const transportPortfolioBtn = page.getByText('Transport Portfolio', { exact: true }).or(
        page.locator('a, div, span, nav').filter({ hasText: /Transport Portfolio/i })
      ).or(
        page.locator('.summaryCard.interactiveCard').filter({ hasText: /Transport/i })
      ).first();

      if (await transportPortfolioBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await transportPortfolioBtn.click({ force: true }).catch(() => {});
      }

      if (!page.url().toLowerCase().includes('transport')) {
        await page.goto('/portfolio?at=Transport');
      }

      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});

      const addTransportBtn = page.getByRole('button', { name: 'Add New Transport', exact: true }).or(
        page.getByRole('button', { name: 'Add New Vehicle', exact: true })
      ).or(
        page.locator('button:visible:has-text("Add New Transport")')
      ).or(
        page.locator('button:visible:has-text("Transport")')
      ).or(
        page.getByText('Add New Transport', { exact: true })
      ).or(
        page.getByText('Add New Vehicle', { exact: true })
      ).or(
        page.locator('div, span, p').filter({ hasText: /^Add New (Transport|Vehicle)$/ })
      );
      await expect(addTransportBtn.first()).toBeVisible({ timeout: 15000 });
      console.log('\n TC_TRANSPORT_02 Passed: Transport controls verified.\n');
    });
  });

});
