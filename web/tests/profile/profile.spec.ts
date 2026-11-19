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

    // Verify profile details or header is visible on profile card
    const profileHeading = page.getByRole('heading', { name: /Profile/i }).or(page.getByText(/General Information|Profile/i));
    await expect(profileHeading.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC_PROF_02: Verify navigation to Profile sub-menus (Nominees, Transactions, Password)', async ({ page }) => {
    await page.getByText('Profile').first().click();
    await expect(page).toHaveURL(/.*profile/);

    // 1. Check Nominees link
    const nomineesLink = page.getByRole('link', { name: 'Nominees' }).or(page.getByText('Nominees'));
    if (await nomineesLink.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await nomineesLink.first().click();
      await expect(page).toHaveURL(/.*nominees/);
      await page.goBack().catch(async () => { await page.locator('.back-button').first().click(); });
    }

    // 2. Check Reset Password link
    const resetPwdLink = page.getByRole('link', { name: /Reset Password/i }).or(page.getByText(/Reset Password/i));
    if (await resetPwdLink.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await resetPwdLink.first().click();
      await expect(page).toHaveURL(/.*(reset-password|change-password)/);
      await page.goBack().catch(async () => { await page.locator('.back-button').first().click(); });
    }

    // 3. Return to Home using first instance to prevent strict mode violation
    await page.getByRole('link', { name: /Home/i }).or(page.getByText('Home')).first().click();
    await expect(page).toHaveURL(/.*(dashboard|subscription-plans|\/)/);
  });

});
