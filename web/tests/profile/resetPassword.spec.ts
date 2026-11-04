import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';


test.describe('Profile - Reset Password Flow', () => {

  test.beforeEach(async ({ page }, testInfo) => {
    // Step 1: Perform unified login (handles Dev/Prod dynamic credentials & environment URLs)
    await loginToEzit(page, testInfo);
  });

  test('TC_RESET_PWD_01: Verify navigation to Reset Password screen', async ({ page }) => {
    // 1. Navigate to Profile
    const profileLink = page.getByText('Profile', { exact: true }).or(
      page.locator('a[href*="/profile"]').first()
    );
    await expect(profileLink.first()).toBeVisible({ timeout: 15000 });
    await profileLink.first().click();

    // 2. Click "Reset Password" link
    const resetPwdLink = page.getByRole('link', { name: /Reset Password/i }).or(
      page.locator('a:has-text("Reset Password")')
    );
    await expect(resetPwdLink.first()).toBeVisible({ timeout: 10000 });
    await resetPwdLink.first().click();
    await page.waitForLoadState('networkidle');

    // 3. Verify 'Send OTP' button is displayed
    const sendOtpBtn = page.getByRole('button', { name: /Send OTP/i });
    await expect(sendOtpBtn).toBeVisible({ timeout: 10000 });
  });

  test('TC_RESET_PWD_MANUAL_OTP: Complete Reset Password with live SMS OTP', async ({ page }, testInfo) => {
    // Extended timeout (5 minutes) to give ample time for receiving and entering SMS OTP
    test.setTimeout(300000);

    // Target password to restore (from TEST_PASSWORD env):
    const targetPassword = process.env.TEST_PASSWORD || (testInfo.project.name === 'prod' ? 'ProdPassword@123' : 'DevPassword@1234');

    // 1. Navigate to Profile -> Reset Password
    const profileLink = page.getByText('Profile', { exact: true }).or(
      page.locator('a[href*="/profile"]').first()
    );
    await expect(profileLink.first()).toBeVisible({ timeout: 15000 });
    await profileLink.first().click();

    const resetPwdLink = page.getByRole('link', { name: /Reset Password/i }).or(
      page.locator('a:has-text("Reset Password")')
    );
    await expect(resetPwdLink.first()).toBeVisible({ timeout: 10000 });
    await resetPwdLink.first().click();
    await page.waitForLoadState('networkidle');

    // 2. Click "Send OTP"
    const sendOtpBtn = page.getByRole('button', { name: /Send OTP/i });
    await expect(sendOtpBtn).toBeVisible({ timeout: 15000 });
    await sendOtpBtn.click();

    // 3. Wait for OTP character input fields to appear
    const otpInput1 = page.getByRole('textbox', { name: /Please enter OTP character 1/i }).or(
      page.locator('input[aria-label*="character 1"], input.otp-input').first()
    );
    await expect(otpInput1).toBeVisible({ timeout: 15000 });

    console.log('>>> ACTION REQUIRED: PLEASE ENTER THE 6-DIGIT OTP ON SCREEN <<<');
    console.log('>>> Once you enter OTP & click "Verify OTP", click "Resume" (▶) on Playwright toolbar! <<<');

    // Pause execution to allow entering the live SMS OTP
    await page.pause();

    // 4. If Verify OTP button is enabled and not yet clicked, click it
    const verifyOtpBtn = page.getByRole('button', { name: /Verify OTP/i });
    if (await verifyOtpBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isEnabled = await verifyOtpBtn.isEnabled().catch(() => false);
      if (isEnabled) {
        await verifyOtpBtn.click().catch(() => {});
      }
    }

    // 5. When OTP is valid, the "Verified Successfully" modal appears with a "Continue" button
    const modalContinueBtn = page.getByRole('button', { name: 'Continue' }).or(
      page.locator('button:has-text("Continue")')
    );
    await expect(modalContinueBtn.first()).toBeVisible({ timeout: 15000 });
    await modalContinueBtn.first().click();

    // 6. Navigates to /profile/change-password. Fill New Password
    const newPwdInput = page.getByPlaceholder('Enter new password').or(
      page.locator('input[placeholder="Enter new password"], input[name="password"]')
    );
    await expect(newPwdInput.first()).toBeVisible({ timeout: 15000 });
    await newPwdInput.first().fill(targetPassword);

    // 7. Fill Confirm New Password
    const confirmPwdInput = page.getByPlaceholder('Confirm new password').or(
      page.locator('input[placeholder="Confirm new password"], input[name="confirm_password"]')
    );
    await expect(confirmPwdInput.first()).toBeVisible({ timeout: 10000 });
    await confirmPwdInput.first().fill(targetPassword);

    // 8. Click "Reset Password" button to finalize
    const resetSubmitBtn = page.getByRole('button', { name: 'Reset Password' }).or(
      page.locator('button:has-text("Reset Password")')
    );
    await expect(resetSubmitBtn.first()).toBeVisible({ timeout: 10000 });
    await resetSubmitBtn.first().click();

    await page.waitForTimeout(3000);
    console.log(`\n Successfully reset password to: ${targetPassword}\n`);
  });

});
