import { test, expect } from '@playwright/test';
import { loginAsCustomer } from '../../utils/authHelper';

test.describe('EZIT - Profile Management Suite', () => {

  test.beforeEach(async ({ page }, testInfo) => {
    const validPassword = process.env.TEST_PASSWORD || '';
    const validMobile = process.env.TEST_MOBILE || '';
    await page.goto('/');
    await loginAsCustomer(page, {
      mobile: validMobile,
      password: validPassword,
    });

    const dismissBtn = page.getByRole('button', { name: 'Dismiss' });
    if (await dismissBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dismissBtn.click();
    }
  });

  test('TC_PROF_01: Verify user profile details display correctly', async ({ page }) => {
    await page.getByText('Profile').first().click();
    await expect(page).toHaveURL(/.*profile/);

    // Verify user name is visible on profile card
    const userName = process.env.TEST_USER_NAME || 'Profile';
    await expect(page.getByText(userName)).toBeVisible({ timeout: 10000 });
  });

  test('TC_PROF_02: Verify navigation to Profile sub-menus (Nominees, Transactions, Password)', async ({ page }) => {
    await page.getByText('Profile').first().click();
    await expect(page).toHaveURL(/.*profile/);

    // 1. Check Nominees link
    await page.getByRole('link', { name: 'Nominees' }).click();
    await expect(page).toHaveURL(/.*nominees/);
    await page.locator('.back-button').click();

    // 2. Check Reset Password link
    await page.getByRole('link', { name: 'Reset Password' }).click();
    await expect(page).toHaveURL(/.*(reset-password|change-password)/);
    await page.locator('.back-button').click();

    // 3. Check My transactions link
    await page.getByRole('link', { name: 'My transactions' }).click();
    await expect(page).toHaveURL(/.*transactions/);
    await page.locator('.back-button').click();

    // 4. Return to Home
    await page.getByText('Home').click();
    await expect(page).toHaveURL(/.*(dashboard|subscription-plans)/);
  });

});
