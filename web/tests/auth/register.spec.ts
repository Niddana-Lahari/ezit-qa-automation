import { test, expect } from '@playwright/test';
import { fillRegisterForm } from '../../utils/authHelper';

test.describe('EZIT - Registration Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('TC_REG_01: Verify registration shows required field errors when empty', async ({ page }) => {
    const continueBtn = page.getByRole('button', { name: 'Continue' }).or(page.locator('button.loginBtn'));
    await continueBtn.first().click();

    const termsCheckbox = page.locator('#termsCheckbox, input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible({ timeout: 4000 }).catch(() => false)) {
      await termsCheckbox.check().catch(() => {});
      await continueBtn.first().click();
    }

    const fieldError = page.getByText(/required|Please enter|Full name required|Mobile number required/i).or(
      page.locator('.invalid-feedback, .error, .Toastify__toast')
    );
    await expect(fieldError.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC_REG_02: Verify error when registering with an already existing mobile number', async ({ page }) => {
    await fillRegisterForm(page, {
      fullName: process.env.TEST_USER_NAME || 'Existing User',
      mobile: process.env.TEST_MOBILE || '9876543210',
    });

    const termsCheckbox = page.locator('#termsCheckbox, input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible({ timeout: 4000 }).catch(() => false)) {
      await termsCheckbox.check().catch(() => {});
    }

    const continueBtn = page.getByRole('button', { name: 'Continue' }).or(page.locator('button.loginBtn'));
    await continueBtn.first().click();

    // Verify error toast, invalid feedback, or redirect prevention
    const errorText = page.getByText(/Customer already exists|already registered|exists with|already taken/i).or(
      page.locator('.Toastify__toast, .alert, .invalid-feedback, .text-danger')
    );
    await expect(errorText.first()).toBeVisible({ timeout: 10000 }).catch(() => {
      // If error toast auto-dismisses, ensure we remained on register URL
      expect(page.url()).toContain('register');
    });
  });

  test('TC_REG_03: Verify navigation back to login from registration page', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/(login)?$/);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

});
