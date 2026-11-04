import type { Page } from '@playwright/test';

export interface LoginCredentials {
  mobile: string;
  password: string;
}

export interface RegisterDetails {
  fullName: string;
  mobile: string;
}

/**
 * Fills customer login credentials and submits
 */
export async function loginAsCustomer(page: Page, credentials: LoginCredentials): Promise<void> {
  const mobileInput = page.locator('input[name="inputMobile"]');
  const passwordInput = page.locator('input[name="inputPwd"]');
  const loginBtn = page.locator('button.loginBtn');

  await mobileInput.waitFor({ state: 'visible', timeout: 15000 });
  await mobileInput.fill(credentials.mobile);
  await passwordInput.fill(credentials.password);

  // Click login button
  await loginBtn.click();

  // Dismiss any push notification modal or welcome popups that intercept clicks on Dev
  const dismissModal = page.getByRole('button', { name: /No Thanks|Dismiss|Close|Not Now/i }).or(
    page.locator('.modal-footer button, button.btn-close')
  );
  if (await dismissModal.first().isVisible({ timeout: 4000 }).catch(() => false)) {
    await dismissModal.first().click().catch(() => {});
  }
}

/**
 * Helper to perform full Logout flow
 */
export async function logoutCustomer(page: Page, confirm: boolean = true): Promise<void> {
  const logoutNav = page.locator('.dashboardSideMenu').getByText('Log Out').or(page.getByText('Log Out'));
  await logoutNav.first().click();

  const modal = page.locator('.modal-dialog, .modal-content, [role="dialog"]').first();
  await modal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

  if (confirm) {
    const yesBtn = page.getByRole('button', { name: /Yes/i }).or(page.locator('button:has-text("Yes")'));
    await yesBtn.first().click({ force: true });
    await page.waitForURL(url => !url.pathname.includes('/dashboard'), { timeout: 15000 }).catch(() => {});
  } else {
    const noBtn = page.getByRole('button', { name: /No/i }).or(page.locator('button:has-text("No")'));
    await noBtn.first().click({ force: true });
  }
}

/**
 * Reusable helper to fill registration form
 */
export async function fillRegisterForm(page: Page, details: RegisterDetails): Promise<void> {
  await page.getByRole('textbox', { name: 'Full name' }).fill(details.fullName);
  await page.getByRole('textbox', { name: 'Enter mobile number here' }).fill(details.mobile);
}

/**
 * Helper to fill 6-digit OTP fields
 */
export async function fill6DigitOtp(page: Page, otp: string): Promise<void> {
  const digits = otp.split('');
  for (let i = 0; i < digits.length; i++) {
    const fieldIndex = i + 1;
    const input = page.locator(`input[aria-label*="character ${fieldIndex}"]`).or(
      page.getByRole('spinbutton', { name: new RegExp(`character ${fieldIndex}`, 'i') })
    ).or(
      page.getByRole('textbox', { name: new RegExp(`character ${fieldIndex}`, 'i') })
    ).first();
    await input.fill(digits[i]);
  }
}

/**
 * Helper to fill and confirm 4-digit M-PIN fields
 */
export async function fillAndConfirmMpin(page: Page, mpin: string): Promise<void> {
  const digits = mpin.split('');
  // 4 digits for Set MPIN + 4 digits for Confirm MPIN = 8 total input boxes
  const allInputs = page.locator('input[aria-label*="OTP character"], input[aria-label*="M-PIN"]');
  const count = await allInputs.count();
  
  if (count >= 8) {
    // Fill first 4
    for (let i = 0; i < 4; i++) {
      await allInputs.nth(i).fill(digits[i]);
    }
    // Fill confirm 4
    for (let i = 0; i < 4; i++) {
      await allInputs.nth(i + 4).fill(digits[i]);
    }
  }
}

/**
 * Helper to fill create/confirm password screen
 */
export async function fillCreatePassword(page: Page, password: string): Promise<void> {
  await page.getByRole('textbox', { name: /create password|new password/i }).first().fill(password);
  await page.getByRole('textbox', { name: /confirm/i }).first().fill(password);
  await page.getByRole('button', { name: 'Continue' }).click();
}
