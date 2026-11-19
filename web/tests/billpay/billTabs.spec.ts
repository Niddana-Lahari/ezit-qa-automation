import { test, expect, Page } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';

// Helper 1: Open the Bill Pay screen (click Bill Pay, then Continue)

async function openBillPay(page: Page) {
  const billPayNav = page
    .getByRole('navigation')
    .filter({ hasText: 'Bill Pay' })
    .locator('span')
    .first();
 
  await expect(billPayNav).toBeVisible({ timeout: 15000 });
  await billPayNav.click();
 
  // WAIT for the Continue button (up to 15 seconds), then click it
  const continueBtn = page.getByRole('button', { name: 'Continue' });
  await expect(continueBtn).toBeVisible({ timeout: 15000 });
  await continueBtn.click();
 
  // The bill screens live inside an iframe - wait for it to appear
  await expect(page.locator('iframe').first()).toBeVisible({ timeout: 20000 });
}

// Helper 2: Shortcut to work inside the iframe

function billFrame(page: Page) {
  return page.frameLocator('iframe').first();
}

// Helper 3: Click a tab and check the page did not crash

async function openTabAndCheck(page: Page, tabName: string) {
  const tab = billFrame(page).getByRole('button', { name: tabName });
 
  // WAIT until the tab is visible, then click it
  await expect(tab).toBeVisible({ timeout: 15000 });
  await tab.click();
 
  // Give the screen a few seconds to load its data
  await page.waitForTimeout(3000);
 
  // The tab button should still be on screen (page did not break)
  await expect(tab).toBeVisible({ timeout: 5000 });
 
  // "soft" expect = test keeps running, but is marked failed if a panic shows up
  const panicError = billFrame(page).getByText(/panic error/i);
  await expect.soft(panicError, `Panic error shown on ${tabName}`).toHaveCount(0);
}
 
test.describe('Bill Pay - Tabs Suite', () => {
  test.setTimeout(90000);
 
  // Step 1 + 2: Login, then open Bill Pay before each test
  test.beforeEach(async ({ page }, testInfo) => {
    await loginToEzit(page, testInfo);
    await openBillPay(page);
  });
 
  /**
   * ----------------------------------------------------------------------------
   * TC_BILLTABS_01: Transactions tab
   * ----------------------------------------------------------------------------
   */
  test('TC_BILLTABS_01: Transactions tab opens', async ({ page }) => {
    await test.step('Step 3: Click Transactions tab and verify', async () => {
      await openTabAndCheck(page, 'Transactions Tab');
    });
  });
 
  /**
   * ----------------------------------------------------------------------------
   * TC_BILLTABS_02: Complaints tab
   * ----------------------------------------------------------------------------
   */
  test('TC_BILLTABS_02: Complaints tab opens', async ({ page }) => {
    await test.step('Step 3: Click Complaints tab and verify', async () => {
      await openTabAndCheck(page, 'Complaints Tab');
    });
  });
 
  /**
   * ----------------------------------------------------------------------------
   * TC_BILLTABS_03: Saved bills tab
   * ----------------------------------------------------------------------------
   */
  test('TC_BILLTABS_03: Saved bills tab opens', async ({ page }) => {
    await test.step('Step 3: Click Saved bills tab and verify', async () => {
      await openTabAndCheck(page, 'Saved bills Tab');
    });
  });
 
  /**
   * ----------------------------------------------------------------------------
   * TC_BILLTABS_04: Go through all three tabs in order
   * ----------------------------------------------------------------------------
   */
  test('TC_BILLTABS_04: Move through Transactions, Complaints and Saved bills', async ({ page }) => {
    await test.step('Step 3: Transactions tab', async () => {
      await openTabAndCheck(page, 'Transactions Tab');
    });
 
    await test.step('Step 4: Complaints tab', async () => {
      await openTabAndCheck(page, 'Complaints Tab');
    });
 
    await test.step('Step 5: Saved bills tab', async () => {
      await openTabAndCheck(page, 'Saved bills Tab');
    });
 
    console.log('\n TC_BILLTABS_04 Passed: All three tabs opened.\n');
  });
});
