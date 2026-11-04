import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';

test.describe('Profile - Reset M-PIN Flow', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await loginToEzit(page, testInfo);
  });

  test('TC_RESET_MPIN_01: Verify Reset M-PIN page displays correctly', async ({ page }) => {
    // Navigate to Profile
    const profileLink = page.getByText('Profile', { exact: true }).or(
      page.locator('a[href*="/profile"]').first()
    );
    await expect(profileLink.first()).toBeVisible({ timeout: 15000 });
    await profileLink.first().click();
    await page.waitForLoadState('networkidle').catch(() => {});

    // Open Reset M-PIN link
    const resetMpinLink = page.locator('a[href*="/profile/reset-mpin"]').or(
      page.getByText('Reset M-PIN', { exact: true })
    ).or(page.getByRole('link', { name: /Reset M-PIN/i }));
    await expect(resetMpinLink.first()).toBeVisible({ timeout: 15000 });
    await resetMpinLink.first().click();
    await page.waitForLoadState('networkidle').catch(() => {});

    // Verify fields and buttons
    await expect(page.getByText('Reset M-PIN').first()).toBeVisible({ timeout: 10000 });
    const sendOtpBtn = page.getByRole('button', { name: /Send OTP/i });
    await expect(sendOtpBtn).toBeVisible({ timeout: 10000 });

    const instructionText = page.getByText(/Enter 6 Digit code/i).or(
      page.getByText(/We have sent code to your mobile/i)
    );
    await expect(instructionText.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC_RESET_MPIN_MANUAL_OTP: Complete Reset M-PIN with live SMS OTP', async ({ page }) => {
    const targetMpin = process.env.TEST_MPIN || '1234';

    // Go to profile
    const profileLink = page.getByText('Profile', { exact: true }).or(
      page.locator('a[href*="/profile"]').first()
    );
    await expect(profileLink.first()).toBeVisible({ timeout: 15000 });
    await profileLink.first().click();
    await page.waitForLoadState('networkidle').catch(() => {});

    // Go to reset mpin
    const resetMpinLink = page.locator('a[href*="/profile/reset-mpin"]').or(
      page.getByText('Reset M-PIN', { exact: true })
    ).or(page.getByRole('link', { name: /Reset M-PIN/i }));
    await expect(resetMpinLink.first()).toBeVisible({ timeout: 15000 });
    await resetMpinLink.first().click();
    await page.waitForLoadState('networkidle').catch(() => {});

    // Send OTP
    const sendOtpBtn = page.getByRole('button', { name: /Send OTP/i });
    await expect(sendOtpBtn).toBeVisible({ timeout: 10000 });
    await sendOtpBtn.click();

    // Wait for OTP input
    const otpInput1 = page.locator('input[aria-label*="character 1"], input.otp-input').or(
      page.locator('input[type="number"]')
    ).first();
    await expect(otpInput1).toBeVisible({ timeout: 15000 });

    // Pause for OTP input
    await page.pause();

    // Verify mobile number if button active
    const verifyBtn = page.getByRole('button', { name: /Verify mobile number/i });
    if (await verifyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isEnabled = await verifyBtn.isEnabled().catch(() => false);
      if (isEnabled) {
        await verifyBtn.click().catch(() => {});
      }
    }

    // Click continue on success modal
    const modalContinueBtn = page.getByRole('button', { name: 'Continue' }).or(
      page.locator('button:has-text("Continue")')
    );
    await expect(modalContinueBtn.first()).toBeVisible({ timeout: 15000 });
    await modalContinueBtn.first().click();

    // Enter new mpin
    await page.waitForURL('**/profile/update-mpin', { timeout: 15000 }).catch(() => {});
    const mpinInputs = page.locator('input[type="number"], input[autoComplete="new-password"]');
    await expect(mpinInputs.first()).toBeVisible({ timeout: 15000 });

    const digits = targetMpin.split('');
    for (let i = 0; i < 4; i++) {
      await mpinInputs.nth(i).fill(digits[i]);
    }
    for (let i = 0; i < 4; i++) {
      await mpinInputs.nth(4 + i).fill(digits[i]);
    }

    // Submit new mpin
    const resetSubmitBtn = page.getByRole('button', { name: 'Reset M-PIN' }).or(
      page.locator('button:has-text("Reset M-PIN")')
    );
    await expect(resetSubmitBtn.first()).toBeVisible({ timeout: 10000 });
    await resetSubmitBtn.first().click();

    // Confirm success modal
    const successContinueBtn = page.getByRole('button', { name: 'Continue' }).or(
      page.locator('button:has-text("Continue")')
    );
    if (await successContinueBtn.first().isVisible({ timeout: 10000 }).catch(() => false)) {
      await successContinueBtn.first().click();
    }

    await page.waitForTimeout(2000);
  });
});
