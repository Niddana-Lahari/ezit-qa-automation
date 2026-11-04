import { test, expect } from '@playwright/test';
import { fillRegisterForm } from '../../utils/authHelper';

test.describe('EZIT - Registration Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('TC_REG_01: Verify registration shows required field errors when empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#termsCheckbox').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Full name required')).toBeVisible();
    await expect(page.getByText('Mobile number required')).toBeVisible();
  });

  test('TC_REG_02: Verify error when registering with an already existing mobile number', async ({ page }) => {
    await fillRegisterForm(page, {
      fullName: process.env.TEST_USER_NAME || 'Existing User',
      mobile: process.env.TEST_MOBILE || '9876543210',
    });

    await page.locator('#termsCheckbox').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    const errorText = page.getByText(/Customer already exists with/i);
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test('TC_REG_03: Verify navigation back to login from registration page', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/(login)?$/);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

});
