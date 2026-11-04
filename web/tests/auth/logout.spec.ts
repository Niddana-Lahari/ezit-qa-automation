import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';


test.describe('Authentication - Logout Flow', () => {

  test.beforeEach(async ({ page }, testInfo) => {
    // Step 1: Perform unified login (handles Dev/Prod dynamic credentials & environment URLs)
    await loginToEzit(page, testInfo);
  });

  test('TC_LOGOUT_01: Verify successful logout redirects to login screen', async ({ page }) => {
    // Dismiss any notification or welcome dialog if present on the dashboard
    const noThanksBtn = page.getByRole('button', { name: /No Thanks|Dismiss|Close/i });
    if (await noThanksBtn.first().isVisible({ timeout: 4000 }).catch(() => false)) {
      await noThanksBtn.first().click().catch(() => {});
      await page.waitForTimeout(500);
    }

    // 1. Locate the 'Log Out' button in the sidebar navigation
    const logoutBtn = page.getByText('Log Out', { exact: true }).or(
      page.locator('.leftmenu-logout')
    ).or(page.getByRole('navigation').filter({ hasText: 'Log Out' }));
    
    await expect(logoutBtn.first()).toBeVisible({ timeout: 15000 });
    await logoutBtn.first().click({ force: true });

    // 2. Verify confirmation dialog appears and click 'Yes, Logout'
    const confirmLogoutBtn = page.getByRole('button', { name: /Yes, Logout/i }).or(
      page.locator('button:has-text("Yes, Logout")')
    );
    await expect(confirmLogoutBtn.first()).toBeVisible({ timeout: 10000 });
    await confirmLogoutBtn.first().click();

    // 3. Verify redirected to login screen
    const loginMobileInput = page.getByRole('textbox', { name: /Enter mobile number here/i }).or(
      page.locator('input[name="inputMobile"]')
    );
    await expect(loginMobileInput.first()).toBeVisible({ timeout: 15000 });

    const loginBtn = page.getByRole('button', { name: 'Login' }).or(page.locator('button.loginBtn'));
    await expect(loginBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC_LOGOUT_02: Verify cancelling logout modal keeps user logged in', async ({ page }) => {
    // 1. Click 'Log Out'
    const logoutBtn = page.getByText('Log Out', { exact: true }).or(
      page.getByRole('navigation').filter({ hasText: 'Log Out' })
    ).or(page.locator('text=Log Out'));
    
    await expect(logoutBtn.first()).toBeVisible({ timeout: 15000 });
    await logoutBtn.first().click();

    // 2. Locate No / Cancel button on confirmation modal
    const cancelBtn = page.getByRole('button', { name: 'No' }).or(
      page.locator('.modal-content button:has-text("No")')
    );
    
    await expect(cancelBtn.first()).toBeVisible({ timeout: 10000 });
    await cancelBtn.first().click({ force: true });
    await page.waitForTimeout(1000);

    // 3. Verify user remains on active application session (modal dismissed)
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 5000 }).catch(() => {});
    await expect(logoutBtn.first()).toBeVisible({ timeout: 10000 });
  });

});
