import { Page, TestInfo, expect } from '@playwright/test';

/**
 * Universal dismisser for "Enable Notifications" / "No Thanks" popup.
 * Installs Playwright's native addLocatorHandler so that whenever
 * "Enable Notifications" appears ANYWHERE at ANY TIME during ANY test,
 * it automatically clicks "No Thanks" instantly!
 */
export async function installNotificationHandler(page: Page): Promise<void> {
  try {
    const noThanksBtn = page.getByRole('button', { name: /No Thanks/i })
      .or(page.locator('button:has-text("No Thanks")'));

    page.addLocatorHandler(noThanksBtn, async (btn) => {
      console.log('>>> [AUTO-HANDLER] "Enable Notifications" popup detected! Automatically clicking "No Thanks" <<<');
      await btn.click({ force: true }).catch(() => {});
    });
  } catch (e) {}
}

export async function loginToEzit(
  page: Page,
  testInfo: TestInfo,
  mobile: string = process.env.TEST_MOBILE || '',
  customPassword?: string
): Promise<void> {
  // Global listener for Enable Notifications popup across ALL pages and actions
  await installNotificationHandler(page);

  // 1. Choose password
  let password = customPassword || process.env.TEST_PASSWORD || '';

  // 2. Navigate to Home/Login
  await page.goto('/');

  // On Dev / Stage, wait for React/Next.js hydration
  if (testInfo.project.name === 'dev' || testInfo.project.name === 'stage') {
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

  // Dismiss welcome/dismissible modals, push notification prompts, and backdrops
  const modalDismissButtons = page.getByRole('button', { name: /No Thanks|Dismiss|Close|Not Now|Later/i }).or(
    page.locator('.modal-footer button, button.btn-close, .modal .close')
  );
  for (let i = 0; i < 3; i++) {
    const noThanks = page.getByRole('button', { name: 'No Thanks' }).or(page.getByRole('button', { name: /Dismiss|Close/i }));
    if (await noThanks.first().isVisible({ timeout: 2500 }).catch(() => false)) {
      await noThanks.first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    } else {
      break;
    }
  }
}
