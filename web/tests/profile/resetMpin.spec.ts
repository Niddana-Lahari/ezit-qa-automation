import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';
import { handleOtp } from '../../utils/otpHelper';

test.describe('Profile - Reset M-PIN Flow', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await loginToEzit(page, testInfo);
  });

  test('TC_RESET_MPIN_01: Verify Reset M-PIN page displays correctly', async ({ page }) => {
    // Navigate directly to Reset M-PIN URL
    await page.goto('/profile/reset-mpin');
    await page.waitForLoadState('domcontentloaded');

    // Verify heading or page elements
    const heading = page.getByText(/Reset M-PIN|M-PIN/i).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    const sendOtpBtn = page.getByRole('button', { name: 'Send OTP', exact: true }).or(
      page.locator('button:has-text("Send OTP")')
    );
    await expect(sendOtpBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC_RESET_MPIN_MANUAL_OTP: Complete Reset M-PIN with live SMS OTP', async ({ page }, testInfo) => {
    test.setTimeout(300000); // 5 minutes to give ample time to receive & enter live SMS OTP
    const targetMpin = process.env.TEST_MPIN || '1234';

    // Navigate directly to Reset M-PIN URL
    await page.goto('/profile/reset-mpin');
    await page.waitForLoadState('domcontentloaded');

    // Check if OTP input fields are already visible or if Send OTP needs to be clicked
    const otpInput1 = page.locator('input[aria-label*="character 1"], input.otp-input, input[type="number"], input[type="text"]').first();
    // Locate Send OTP button or link
    const sendOtpBtn = page.getByRole('button', { name: /Send OTP/i }).or(
      page.locator('button:has-text("Send OTP")')
    ).or(
      page.getByText('Send OTP', { exact: true })
    );

    await expect(sendOtpBtn.first()).toBeVisible({ timeout: 15000 });
    console.log('\n>>> Clicking "Send OTP" button now... <<<\n');
    await sendOtpBtn.first().click({ force: true });
    await page.waitForTimeout(2000);

    // Wait for OTP boxes to appear
    await expect(otpInput1).toBeVisible({ timeout: 15000 });

    // ---> OTP Handling: Automatically types '123456' on STAGE, or pauses for SMS on DEV/PROD <---
    await handleOtp(page, testInfo);

    // Click "Verify mobile number" or "Verify OTP" once enabled after entering OTP
    const verifyBtn = page.getByRole('button', { name: /Verify/i });
    await expect(verifyBtn.first()).toBeEnabled({ timeout: 15000 });
    await verifyBtn.first().click();

    // 5. When OTP is verified, wait for "Verified Successfully" modal with "Continue" button
    const modalContinueBtn = page.getByRole('button', { name: 'Continue' }).or(
      page.locator('button:has-text("Continue")')
    );
    await expect(modalContinueBtn.first()).toBeVisible({ timeout: 15000 });
    await modalContinueBtn.first().click({ force: true });
    await page.waitForTimeout(1000);

    // Fill new MPIN (4 boxes for Set M-PIN + 4 boxes for Confirm M-PIN = 8 boxes total)
    const mpinHeading = page.getByText(/Set M-PIN|Confirm M-PIN|Reset M-PIN/i).first();
    await mpinHeading.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    // Locate all visible single-digit MPIN input boxes
    let mpinInputs = page.locator('input[aria-label*="character"]:visible');
    if ((await mpinInputs.count()) < 8) {
      mpinInputs = page.locator('input[maxlength="1"]:visible');
    }
    if ((await mpinInputs.count()) < 8) {
      mpinInputs = page.locator('input:visible').filter({ hasNot: page.locator('[name="inputMobile"], [name="inputPwd"]') });
    }

    const mpinBoxCount = await mpinInputs.count();
    console.log(`>>> Detected ${mpinBoxCount} MPIN input boxes on screen <<<`);

    const digits = targetMpin.split(''); // e.g. ['1', '2', '3', '4']

    if (mpinBoxCount >= 8) {
      // First 4 boxes: Set M-PIN
      for (let i = 0; i < 4; i++) {
        await mpinInputs.nth(i).click({ force: true });
        await mpinInputs.nth(i).fill(digits[i]);
        await page.waitForTimeout(80);
      }
      // Next 4 boxes: Confirm M-PIN
      for (let i = 0; i < 4; i++) {
        await mpinInputs.nth(4 + i).click({ force: true });
        await mpinInputs.nth(4 + i).fill(digits[i]);
        await page.waitForTimeout(80);
      }
    } else if (mpinBoxCount >= 4) {
      // If only 4 boxes are rendered at a time
      for (let i = 0; i < 4; i++) {
        await mpinInputs.nth(i).click({ force: true });
        await mpinInputs.nth(i).fill(digits[i]);
        await page.waitForTimeout(80);
      }
    }

    // Submit new MPIN - click "Reset M-PIN" button
    await page.waitForTimeout(500);
    const resetMpinBtn = page.getByRole('button', { name: /Reset M-PIN/i }).or(
      page.locator('button:has-text("Reset M-PIN")')
    );
    await expect(resetMpinBtn.first()).toBeVisible({ timeout: 10000 });
    await expect(resetMpinBtn.first()).toBeEnabled({ timeout: 10000 });
    await resetMpinBtn.first().click({ force: true });
    console.log(`\n Successfully submitted new M-PIN: ${targetMpin}\n`);
    await page.waitForTimeout(3000);
  });
});
