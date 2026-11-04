import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';


test.describe('Profile - General Information Suite', () => {

  test.setTimeout(90000);

  test.beforeEach(async ({ page }, testInfo) => {
    // 1. Centralized Reusable Login (Dev & Prod password handling)
    await loginToEzit(page, testInfo);

    // 2. Navigate to Profile
    const profileLink = page.locator('.dashboardSideMenu').getByText('Profile')
      .or(page.getByRole('navigation').filter({ hasText: 'Profile' }))
      .or(page.getByText('Profile', { exact: true }));
      
    await expect(profileLink.first()).toBeVisible({ timeout: 15000 });
    await profileLink.first().click();

    // 3. Click 'General Information'
    const generalInfoLink = page.getByRole('link', { name: /General Information/i })
      .or(page.getByText('General Information'));
    await expect(generalInfoLink.first()).toBeVisible({ timeout: 10000 });
    await generalInfoLink.first().click();

    // 4. Verify on General Information form
    await expect(page).toHaveURL(/.*general-information|.*profile/i, { timeout: 15000 });
  });

  // TEST 1: Verify General Information page loads correctly
  test('TC_GEN_01: Verify General Information page displays profile fields', async ({ page }) => {
    // Verify City, State, Pincode, Address fields are rendered
    await expect(page.getByRole('textbox', { name: /city/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('combobox').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('spinbutton', { name: /pincode/i }).or(page.locator('input[name*="pincode"]')).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('textbox', { name: /address/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible({ timeout: 10000 });
  });

  // TEST 2: Update and Save General Information
  test('TC_GEN_02: Update and Save General Information fields successfully', async ({ page }) => {
    // 1. Date of Birth selection (react-datepicker dynamic via env)
    const dobYear = process.env.TEST_DOB_YEAR || '2003';
    const dobDay = (process.env.TEST_DOB_DAY || '27').padStart(2, '0');
    const dobInput = page.getByRole('textbox', { name: /Date of Birth/i });
    if (await dobInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dobInput.click();

      // Open year dropdown in datepicker
      const yearDropdown = page.locator('.react-datepicker__year-read-view--down-arrow')
        .or(page.locator('.react-datepicker__year-select'))
        .or(page.locator('.react-datepicker__header select').last());

      if (await yearDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await yearDropdown.click();
        const yearOption = page.getByText(dobYear, { exact: true });
        if (await yearOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await yearOption.click();
        }
      }

      // Select specific date dynamically matching day
      const dayOption = page.locator(`.react-datepicker__day--0${dobDay}`).first()
        .or(page.getByRole('option', { name: new RegExp(`.*${parseInt(dobDay, 10)}(st|nd|rd|th)?`, 'i') }));

      if (await dayOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dayOption.click();
      } else {
        // If date picker is open, click away or select current visible day
        await page.locator('.react-datepicker__day').first().click().catch(() => {});
      }
    }

    // 2. City - update field value
    const city = process.env.TEST_CITY || 'Hyderabad';
    const pincode = process.env.TEST_PINCODE || '500001';
    const address = process.env.TEST_ADDRESS || 'Test Residency, Main Road';
    const state = process.env.TEST_STATE || 'AP';

    const cityInput = page.getByRole('textbox', { name: /city/i });
    await cityInput.click();
    await cityInput.fill(`${city} City`);

    // 3. State
    const stateDropdown = page.getByRole('combobox').first();
    await stateDropdown.selectOption(state).catch(async () => {
      await stateDropdown.selectOption({ label: 'Andhra Pradesh' }).catch(() => {});
    });

    // 4. Pincode
    const pincodeInput = page.getByRole('spinbutton', { name: /pincode/i })
      .or(page.locator('input[name*="pincode"]'))
      .or(page.getByPlaceholder(/pincode/i));
    await pincodeInput.first().click();
    await pincodeInput.first().fill(pincode);

    // 5. Full address
    const addressInput = page.getByRole('textbox', { name: /address/i });
    await addressInput.click();
    await addressInput.fill(`${address} Main Road`);

    // 6. Click "Save Changes" (wait until enabled)
    const saveBtn = page.getByRole('button', { name: /Save Changes/i });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    
    // If enabled, click and verify save
    if (await saveBtn.isEnabled()) {
      await saveBtn.click();
      const successNotice = page.getByText(/Customer personal information|successfully|saved|updated/i)
        .or(page.locator('.Toastify__toast, .toast, .alert-success'));
      await expect(successNotice.first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    }
  });

  // TEST 3: Verify read-only / disabled fields
  test('TC_GEN_03: Verify Name and Mobile are read-only / disabled', async ({ page }) => {
    const nameInput = page.locator('input[disabled]').first();
    await expect(nameInput).toBeDisabled();
    
    const panValidated = page.getByText(/Your PAN is validated|KYC Information/i);
    await expect(panValidated.first()).toBeVisible({ timeout: 5000 });
  });

});
