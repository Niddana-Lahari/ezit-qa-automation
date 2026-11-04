import { Page, TestInfo, expect } from '@playwright/test';

export async function loginToEzit(
  page: Page,
  testInfo: TestInfo,
  mobile: string = process.env.TEST_MOBILE || '',
  customPassword?: string
): Promise<void> {
  // 1. Choose password from env or custom parameter
  let password = customPassword || process.env.TEST_PASSWORD || '';

  // 2. Navigate to Home/Login
  await page.goto('/');

  // On Dev, wait for React/Next.js hydration
  if (testInfo.project.name === 'dev') {
    await page.waitForLoadState('networkidle').catch(() => {});
  } else {
    await page.locator('input[name="inputMobile"]').waitFor({ state: 'visible', timeout: 15000 });
  }

  // 3. Fill mobile number and password
  await page.locator('input[name="inputMobile"]').fill(mobile);
  await page.locator('input[name="inputPwd"]').fill(password);

  // 4. Click Login button
  const loginButton = page.locator('button.loginBtn');
  await loginButton.click({ force: true });

  // 5. Wait for login navigation (dashboard, reminder, or portfolio)
  try {
    await page.waitForURL((url: URL) => !url.href.endsWith('/') && !url.href.includes('login'), { timeout: 25000 });
  } catch {
    // If already moved to dashboard or another page, no fallback needed
    if (!page.url().includes('login') && !page.url().endsWith('/')) {
      return;
    }

    // Check if dashboard or navigation header is already visible
    const dashboardLoaded = page.locator('.dashboardSideMenu, nav, .navigation, a[href*="/dashboard"]').first();
    if (await dashboardLoaded.isVisible({ timeout: 3000 }).catch(() => false)) {
      return;
    }

    // If still on login page with button visible, click again (handle network jitter)
    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginButton.click({ force: true });
      await page.waitForURL((url: URL) => !url.href.endsWith('/') && !url.href.includes('login'), { timeout: 25000 }).catch(() => {});
    }
  }

  // 6. If redirected to onboarding / reminder preferences, navigate directly to dashboard
  if (page.url().includes('reminder') || page.url().includes('preferences') || page.url().includes('onboarding')) {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  // Dismiss welcome/dismissible modals
  page.getByRole('button', { name: 'No Thanks' }).click({ timeout: 1500 }).catch(() => {});
  page.getByRole('button', { name: /Dismiss|Close/i }).click({ timeout: 1500 }).catch(() => {});
}
