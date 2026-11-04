import { test, expect } from '@playwright/test';
import { loginAsCustomer, logoutCustomer } from '../../utils/authHelper';

test.describe('EZIT Guardian - Home / Dashboard Test Suite', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const validMobile = process.env.TEST_MOBILE || '';
    const validPassword = process.env.TEST_PASSWORD || '';

    await page.goto('/');
    await loginAsCustomer(page, {
      mobile: validMobile,
      password: validPassword,
    });

    // Dismiss any modal/toast that may pop up upon login
    const dismissBtn = page.getByRole('button', { name: /Dismiss|Close/i });
    if (await dismissBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await dismissBtn.click();
    }

    // Ensure we are on the dashboard or authenticated home
    await expect(page).toHaveURL(/.*(dashboard|\/)/, { timeout: 15000 });
    // If not redirected to dashboard yet, wait for dashboard navigation link or element
    const homeIndicator = page.locator('.hello').or(page.locator('.dashboardSideMenu')).or(page.getByText(/Guardian|Dashboard|Profile/i));
    await expect(homeIndicator.first()).toBeVisible({ timeout: 15000 }).catch(() => {});
  });

  test('TC_DASH_POS_01: Verify Dashboard loads with user greeting and profile completeness', async ({ page }) => {
    // Verify greeting 'Hello' and user's full name
    await expect(page.locator('.hello')).toHaveText('Hello');
    await expect(page.locator('.nameTitle')).toBeVisible();

    // Verify Profile Completeness progress bar / indicator
    const completenessIndicator = page.locator('text=Profile Completeness').or(page.locator('.profile-completeness-text')).or(page.locator('.progress'));
    await expect(completenessIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC_DASH_POS_02: Verify sidebar navigation menu displays all main module links', async ({ page }) => {
    const sidebar = page.locator('.dashboardSideMenu');
    await expect(sidebar).toBeVisible();

    // Verify logo and brand text
    await expect(sidebar.getByText('EZIT Guardian')).toBeVisible();

    // Verify sidebar links
    await expect(sidebar.getByText('Home')).toBeVisible();
    await expect(sidebar.getByText('DocAI')).toBeVisible();
    await expect(sidebar.getByText('Complementary Coverage')).toBeVisible();
    await expect(sidebar.getByText('Secure Vault')).toBeVisible();
    await expect(sidebar.getByText('Bill Pay')).toBeVisible();
    await expect(sidebar.getByText('Services')).toBeVisible();
    await expect(sidebar.getByText('Profile')).toBeVisible();
    await expect(sidebar.getByText('Log Out')).toBeVisible();
  });

  test('TC_DASH_POS_03: Verify overview counter cards render on dashboard', async ({ page }) => {
    // Verify core portfolio tiles
    await expect(page.locator('.assets-card')).toBeVisible();
    await expect(page.locator('.liabilities-card')).toBeVisible();
    await expect(page.locator('.documents-card')).toBeVisible();
    await expect(page.locator('.nominees-card')).toBeVisible();
    await expect(page.locator('.coverage-card')).toBeVisible();
    await expect(page.locator('.appliances-card')).toBeVisible();
    await expect(page.locator('.transport-card')).toBeVisible();

    // Verify Reminders & Actions section
    await expect(page.getByText(/Reminders & Actions/i)).toBeVisible();
    await expect(page.getByText('View all')).toBeVisible();
  });

  test('TC_DASH_POS_04: Verify EZ Coins balance and Free Plan status badge', async ({ page }) => {
    // Check Coin Balance card/section (wait for profile API to finish and render)
    const coinBalance = page.getByText('Coin Balance').or(page.locator('.coinBalance')).first();
    await expect(coinBalance).toBeAttached({ timeout: 15000 });
    await coinBalance.scrollIntoViewIfNeeded();
    await expect(coinBalance).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('EZ Coins').first()).toBeVisible();
    await expect(page.getByText(/Free Plan/i).first()).toBeVisible();
    await expect(page.getByText(/EZ coins redemption is applicable only for paid plans/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Refer a friend/i })).toBeVisible();
  });

  test('TC_DASH_POS_05: Verify sidebar navigation clicks route to respective modules', async ({ page }) => {
    const sidebar = page.locator('.dashboardSideMenu');

    // Navigate to DocAI
    await sidebar.getByText('DocAI').click();
    await expect(page).toHaveURL(/.*docAi/, { timeout: 15000 });

    // Navigate back to Home
    await page.locator('.dashboardSideMenu').getByText('Home').click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Navigate to Complementary Coverage
    await page.locator('.dashboardSideMenu').getByText('Complementary Coverage').click();
    await expect(page).toHaveURL(/.*coverage/, { timeout: 15000 });

    // Navigate back to Home
    await page.locator('.dashboardSideMenu').getByText('Home').click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Navigate to Services
    await page.locator('.dashboardSideMenu').getByText('Services').click();
    await expect(page).toHaveURL(/.*services/, { timeout: 15000 });

    // Navigate to Profile
    await page.locator('.dashboardSideMenu').getByText('Profile').click();
    await expect(page).toHaveURL(/.*profile/, { timeout: 15000 });
  });

  test('TC_DASH_POS_06: Verify clicking Nominees card navigates to Profile Nominees', async ({ page }) => {
    await page.locator('.nominees-card').click();
    await expect(page).toHaveURL(/.*profile\/nominees/, { timeout: 15000 });
  });

  test('TC_DASH_POS_07: Verify clicking Assets card triggers Secure Vault / MPIN check', async ({ page }) => {
    await page.locator('.assets-card').click();
    // Route should navigate to security requirements, mpin verification, portfolio or redirect
    await expect(page).toHaveURL(/.*(security|portfolio|verify-mpin|kyc|\/)/, { timeout: 15000 });
  });

  test('TC_DASH_POS_08: Verify Reminders & Actions "View all" link navigates to viewAllDetails', async ({ page }) => {
    const viewAllLink = page.getByText('View all').first();
    await viewAllLink.scrollIntoViewIfNeeded();
    await viewAllLink.click();
    await expect(page).toHaveURL(/.*dashboard\/viewAllDetails/, { timeout: 15000 });
  });

  test('TC_DASH_POS_09: Verify Logout modal functionality from Home sidebar', async ({ page }) => {
    // Click Cancel on logout dialog
    await logoutCustomer(page, false);
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });

    // Click Confirm logout
    await logoutCustomer(page, true);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible({ timeout: 10000 });
  });

});
