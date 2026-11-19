import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';

test.describe('Secure Vault Step-by-Step Flow', () => {

  test('STEP 1: Login & Click Secure Vault', async ({ page }, testInfo) => {
    // 1. Login
    await loginToEzit(page, testInfo);

    // 2. Click Secure Vault from menu
    await page.getByRole('navigation').filter({ hasText: 'Secure Vault' }).locator('span').click();

    // 3. Click Continue on Security & Compliance introduction
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeVisible({ timeout: 10000 });
    await continueBtn.click();

    // 4. Pause so you can see Step 2 (Set M-PIN screen) on your screen
    await page.waitForTimeout(5000);
  });

});
