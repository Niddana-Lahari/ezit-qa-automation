import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';


test.describe('Profile - Delete Account Flow', () => {

  // 3 minutes, to leave time for receiving and typing the OTP manually
  test.setTimeout(180000);

  test.beforeEach(async ({ page }, testInfo) => {
    // 1. Reusable login
    await loginToEzit(page, testInfo);

    // 2. Open Profile from the menu
    await page.getByText('Profile', { exact: true }).click();
  });

  test('TC_DEL_MANUAL_OTP: Delete Account with OTP Entry', async ({ page }, testInfo) => {

    // 1. Click "Delete Account" option in Profile
    await page.getByText('Delete Account').click();

    // 2. Backup popup is optional: click "Proceed" only if it appears
    const proceedBtn = page.getByRole('button', { name: /Proceed to Delete Account/i });
    const sendOtpBtn = page.getByRole('button', { name: 'Send OTP' });

    // Wait for whichever screen shows up first
    await expect(proceedBtn.or(sendOtpBtn)).toBeVisible({ timeout: 15000 });

    if (await proceedBtn.isVisible()) {
      await proceedBtn.click();
    }

    // 3. Send OTP
    await expect(sendOtpBtn).toBeVisible({ timeout: 15000 });
    await sendOtpBtn.click();

    // 4. Wait for the OTP boxes to appear
    const otpDigit1 = page.getByRole('spinbutton', { name: 'Please enter OTP character 1' });
    await expect(otpDigit1).toBeVisible({ timeout: 10000 });

    // 5. Enter the OTP: Pause so you can type the real SMS OTP received on your phone

    console.log('>>> ACTION REQUIRED: ENTER THE REAL SMS OTP, THEN CLICK RESUME <<<');

    await page.pause(); // Allows entering the live SMS OTP in headed mode

    // 6. Continue (click if still present on screen)
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (await continueBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
        await continueBtn.click();
      }
    }

    // 7. Confirmation modal: "Are you sure want to Delete Account?" -> Yes
    await expect(page.getByText(/Are you sure want to Delete Account/i)).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Yes' }).click();

    // 8. Verify the user is back on the Login page
    await expect(page.locator('input[name="inputMobile"]')).toBeVisible({ timeout: 15000 });
    console.log('\n>>> SUCCESS: Account has been deleted successfully! <<<\n');
  });

});
