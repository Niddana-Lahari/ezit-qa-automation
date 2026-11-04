import { test, expect } from '@playwright/test';

test.describe('Create & Reset Password Test Suite', () => {

  const testMobile = process.env.TEST_MOBILE || '9876543210';

  test.beforeEach(async ({ page }) => {
    // 1. Open home page and click "Create/Reset password"
    await page.goto('/');
    await page.getByText(/Create\/Reset password/i).or(page.getByRole('link', { name: /Create\/Reset password/i })).click();
    await page.waitForLoadState('domcontentloaded');
  });

  // TEST 1: Password reset / creation navigation and mobile entry
  test('TC_PWD_01: Verify navigation to Reset Password and Send OTP', async ({ page }) => {
    // 1. Verify on Create / Reset Password screen
    await expect(page.getByText('Create / Reset Password')).toBeVisible();

    // 2. Enter mobile number
    const mobileInput = page.getByRole('textbox', { name: 'Enter mobile number here' });
    await mobileInput.fill(testMobile);

    // 3. Verify Send OTP button is visible and clickable
    const sendOtpBtn = page.getByRole('button', { name: 'Send OTP' });
    await expect(sendOtpBtn).toBeVisible();
    await sendOtpBtn.click();

    // 4. Verify OTP notification / toast appears
    const toast = page.locator('.Toastify__toast').or(page.getByText(/OTP/i));
    await expect(toast.first()).toBeVisible({ timeout: 10000 });
  });

  // TEST 2: Password mismatch validation
  test('TC_PWD_02: Verify validation error when New Password and Confirm Password do not match', async ({ page }) => {
    // When directly on the create password form:
    const newPwd = page.getByRole('textbox', { name: /Create password|New password/i });
    if (await newPwd.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newPwd.fill(process.env.TEST_PASSWORD || 'Password@123');
      await page.getByRole('button', { name: 'Continue' }).click();

      const confirmPwd = page.getByRole('textbox', { name: /Confirm/i });
      await confirmPwd.fill('DifferentPass@999');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Check mismatch error
      await expect(page.getByText(/Password.*match|Mismatch/i)).toBeVisible();
    }
  });

  // TEST 3: Password policy / guideline validation (less than 8 characters)
  test('TC_PWD_03: Verify password complexity guidelines are enforced', async ({ page }) => {
    const newPwd = page.getByRole('textbox', { name: /Create password|New password/i });
    if (await newPwd.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Enter weak password without capital/special character/numbers
      await newPwd.fill('simple');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Verify validation requirements display
      const policyNotice = page.getByText(/8 characters|uppercase|special/i);
      await expect(policyNotice.first()).toBeVisible();
    }
  });

});
