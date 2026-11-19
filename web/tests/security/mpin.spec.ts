import { test, expect } from '@playwright/test';
import { loginAsCustomer } from '../../utils/authHelper';

test.describe('EZIT - M-PIN & Security Suite', () => {

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

  test('TC_MPIN_01: Verify MPIN prompt triggers when accessing secured Assets', async ({ page }) => {
    // Navigate to Assets or Portfolio
    const assetsLink = page.locator('div').filter({ hasText: /^Assets$/ }).or(page.getByText('Assets')).first();
    if (await assetsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await assetsLink.click();
      
      // Verify MPIN setup or verification modal appears
      const mpinPrompt = page.getByText(/M-PIN/i).first();
      await expect(mpinPrompt).toBeVisible({ timeout: 10000 });
    }
  });

});
