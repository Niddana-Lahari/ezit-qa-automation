import { Page, expect } from '@playwright/test';


export type VaultModule = 'Assets' | 'Liabilities' | 'Appliances' | 'Transport';

export async function openVaultAndUnlock(page: Page, moduleName: VaultModule, mpin: string = '1234') {
  // 1. Ensure we are on Dashboard
  if (!page.url().includes('dashboard')) {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  // 2. Click the dashboard card for the specific module
  const moduleCard = page.locator(`div.dash-card.${moduleName.toLowerCase()}-card`).or(
    page.locator(`.${moduleName.toLowerCase()}-card`)
  ).or(
    page.getByText(moduleName, { exact: true })
  ).or(
    page.locator('div').filter({ hasText: new RegExp(`^${moduleName}$`, 'i') }).first()
  );

  await expect(moduleCard.first()).toBeVisible({ timeout: 15000 });
  await moduleCard.first().click();

  // Secondary trigger click if card hasn't navigated or triggered M-PIN
  const triggerContainer = page.locator('.mb-3 > div').or(page.locator('.interactiveCard'));
  if (await triggerContainer.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await triggerContainer.first().click().catch(() => {});
  }

  // 3. Unlock with M-PIN (Wait up to 6s for prompt to appear)
  const char1 = page.getByRole('textbox', { name: 'Please enter OTP character 1' }).or(
    page.locator('input[aria-label*="character 1"], input.otp-input').first()
  );

  if (await char1.isVisible({ timeout: 6000 }).catch(() => false)) {
    const digits = mpin.split('');
    await page.getByRole('textbox', { name: 'Please enter OTP character 1' }).fill(digits[0]);
    await page.getByRole('textbox', { name: 'Please enter OTP character 2' }).fill(digits[1]);
    await page.getByRole('textbox', { name: 'Please enter OTP character 3' }).fill(digits[2]);
    await page.getByRole('textbox', { name: 'Please enter OTP character 4' }).fill(digits[3]);

    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  // 4. Ensure we are on the correct portfolio tab
  const expectedUrlPattern = new RegExp(`(portfolio.*at=${moduleName}|${moduleName.toLowerCase()})`, 'i');
  if (!expectedUrlPattern.test(page.url())) {
    // Check if the tab button is on screen
    const tabBtn = page.getByText(moduleName, { exact: true }).or(
      page.locator('.summaryCard.interactiveCard').filter({ hasText: moduleName })
    );
    if (await tabBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await tabBtn.first().click().catch(() => {});
    } else {
      await page.goto(`/portfolio?at=${moduleName}`).catch(() => {});
    }
  }

  await page.waitForLoadState('networkidle').catch(() => {});
}
