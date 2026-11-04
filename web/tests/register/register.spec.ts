import { test, expect } from '@playwright/test';

test.describe('Registration & Onboarding Test Suite', () => {

  const testName = process.env.TEST_USER_NAME || 'Test User';
  const testMobile = process.env.TEST_MOBILE || '9999999999';
  const testPassword = process.env.TEST_PASSWORD || 'Password@123';
  const testEmail = process.env.TEST_CORPORATE_EMAIL || 'test.user@example.com';

  test.beforeEach(async ({ page }) => {
    // Open website and wait for page to load
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // TEST 1: Form validation when clicking Continue with empty form
  test('TC_REG_01: Verify empty fields prevent submission and focus Full name', async ({ page }, testInfo) => {
    // 1. Click "Create an account"
    await page.getByRole('button', { name: 'Create an account' }).click();
    if (testInfo.project.name === 'dev') {
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // 2. Click Continue with empty inputs
    await page.getByRole('button', { name: 'Continue' }).click();

    // 3. Verify user remains on register page and Full name is focused
    await expect(page.getByRole('textbox', { name: 'Full name' })).toBeFocused();
  });

  // TEST 2: Terms and Conditions checkbox can be checked / clicked
  test('TC_REG_02: Verify Terms & Conditions checkbox interaction and agreement label', async ({ page }, testInfo) => {
    // 1. Click "Create an account"
    await page.getByRole('button', { name: 'Create an account' }).click();
    if (testInfo.project.name === 'dev') {
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // 2. Check terms checkbox directly
    await page.locator('#termsCheckbox').check();
    await expect(page.locator('#termsCheckbox')).toBeChecked();

    // 3. Verify Terms of Service and Privacy Policy text is visible
    await expect(page.getByText(/By signing up, you agree to/i)).toBeVisible();
  });

  // TEST 3: Terms and Conditions checkbox validation
  test('TC_REG_03: Verify validation alert when Terms checkbox is not checked', async ({ page }, testInfo) => {
    // 1. Click "Create an account"
    await page.getByRole('button', { name: 'Create an account' }).click();
    if (testInfo.project.name === 'dev') {
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // 2. Fill full name and mobile
    await page.getByRole('textbox', { name: 'Full name' }).fill(testName);
    await page.getByRole('textbox', { name: 'Enter mobile number here' }).fill(testMobile);

    // 3. Click Continue without checking Terms checkbox
    await page.getByRole('button', { name: 'Continue' }).click();

    // 4. Verify "Kindly review and agree to" alert appears
    await expect(page.locator('text=Kindly review and agree')).toBeVisible();
  });

  // TEST 4: Invalid OTP validation
  test('TC_REG_04: Verify error message when entering invalid OTP', async ({ page }, testInfo) => {
    // Use an un-registered random number so the website actually sends OTP and loads OTP inputs
    const freshMobile = '98' + Math.floor(10000000 + Math.random() * 90000000);

    // 1. Fill registration form
    await page.getByRole('button', { name: 'Create an account' }).click();
    if (testInfo.project.name === 'dev') {
      await page.waitForLoadState('networkidle').catch(() => {});
    }
    await page.getByRole('textbox', { name: 'Full name' }).fill(testName);
    await page.getByRole('textbox', { name: 'Enter mobile number here' }).fill(freshMobile);

    // 2. Agree to terms & proceed
    await page.locator('#termsCheckbox').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    // 3. Wait for 6 OTP input boxes to appear
    const otpInputs = page.locator('input[aria-label*="character"], input[type="number"], input.form-control');
    await otpInputs.first().waitFor({ state: 'visible', timeout: 15000 });

    // 4. Enter invalid OTP (0 0 0 0 0 0)
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill('0');
    }

    // 5. Click Continue
    await page.getByRole('button', { name: 'Continue' }).click();

    // 6. Verify error alert "Please enter valid otp" or "Invalid otp"
    const otpError = page.getByText(/Please enter valid otp/i).or(page.getByText(/Invalid otp/i)).or(page.locator('.alert'));
    await expect(otpError.first()).toBeVisible({ timeout: 10000 });
  });

  // TEST 4: Registration submission up to OTP screen
  test('TC_REG_04: Fill Registration Form, accept terms and proceed to OTP', async ({ page }, testInfo) => {
    // 1. Click "Create an account"
    await page.getByRole('button', { name: 'Create an account' }).click();
    if (testInfo.project.name === 'dev') {
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // 2. Fill Name and Mobile Number
    await page.getByRole('textbox', { name: 'Full name' }).fill(testName);
    await page.getByRole('textbox', { name: 'Enter mobile number here' }).fill(testMobile);

    // 3. Check Terms & Conditions
    await page.locator('#termsCheckbox').check();

    // 4. Click Continue to submit registration
    await page.getByRole('button', { name: 'Continue' }).click();

    // ---> PAUSE: The browser pauses here so YOU can type the 6-digit OTP. Then click Resume (▶) in the Playwright window <---
    await page.pause();

    // ALL REMAINING STEPS ARE 100% AUTOMATIC:


    // 5. Click Continue after OTP
    await page.getByRole('button', { name: 'Continue' }).click();

    // 6. Confirm "Account Created Successfully" dialog
    const accountCreatedModal = page.getByText(/Account Created Successfully/i);
    await accountCreatedModal.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    await page.getByRole('button', { name: 'Continue' }).click();

    // 7. Create Password and click Continue
    const createPwdInput = page.getByRole('textbox', { name: 'Create password Confirm' });
    await createPwdInput.waitFor({ state: 'visible', timeout: 15000 });
    await createPwdInput.fill(testPassword);
    await page.getByRole('button', { name: 'Continue' }).click();

    // 8. Confirm Password and click Continue
    const confirmPwdInput = page.getByRole('textbox', { name: 'Confirm new password' });
    await confirmPwdInput.waitFor({ state: 'visible', timeout: 15000 });
    await confirmPwdInput.fill(testPassword);
    await page.getByRole('button', { name: 'Continue' }).click();

    // 9. Choose Free Plan
    await expect(page.getByText(/Free Plan/i)).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Choose this plan' }).nth(3).click();

    // 10. Enter Email for Subscription and click Subscribe Now
    await page.getByRole('textbox', { name: 'Enter your email' }).fill(testEmail);
    await page.getByRole('button', { name: 'Subscribe Now' }).click();

    // 11. Handle any Dismiss / No Thanks popup
    const dismissBtn = page.getByRole('button', { name: 'Dismiss' });
    if (await dismissBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dismissBtn.click();
    }

    const noThanksBtn = page.getByRole('button', { name: 'No Thanks' });
    if (await noThanksBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await noThanksBtn.click();
    }

    // 12. Verify user reaches the Dashboard!
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
  });

});
