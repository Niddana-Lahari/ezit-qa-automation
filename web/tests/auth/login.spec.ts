import { test, expect } from '@playwright/test';

test.describe('Login & Logout Test Cases', () => {

  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto('/');

    if (testInfo.project.name === 'dev') {
      await page.waitForLoadState('networkidle').catch(() => {});
    } else {
      await page.locator('input[name="inputMobile"]').waitFor({ state: 'visible', timeout: 15000 });
    }
  });

  // TEST 1: Check error when clicking Login with empty fields
  test('TC_LOGIN_01: Empty fields show validation error', async ({ page }) => {
    // 1. Click Login button directly without typing anything
    await page.locator('button.loginBtn').click();

    // 2. Check if the error messages appear
    await expect(page.getByText('Please enter mobile number')).toBeVisible();
    await expect(page.getByText('Please enter password')).toBeVisible();
  });

  // TEST 2: Check error when entering invalid mobile number (less than 10 digits)
  test('TC_LOGIN_02: Incomplete mobile shows error', async ({ page }) => {
    // 1. Enter 8 digits mobile number
    await page.locator('input[name="inputMobile"]').fill('98765432');

    // 2. Enter any dummy password
    await page.locator('input[name="inputPwd"]').fill('DummyPass');

    // 3. Click Login button
    await page.locator('button.loginBtn').click();

    // 4. Check if validation error alert shows up
    await expect(page.getByText('Validation Errors')).toBeVisible();
  });

  // TEST 3: Check error when password is wrong
  test('TC_LOGIN_03: Wrong password shows error message', async ({ page }) => {
    // 1. Enter valid mobile number
    const validMobile = process.env.TEST_MOBILE || '';
    await page.locator('input[name="inputMobile"]').fill(validMobile);

    // 2. Enter wrong password
    await page.locator('input[name="inputPwd"]').fill('WrongPassword@123');

    // 3. Click Login button
    await page.locator('button.loginBtn').click();

    // 4. Check if wrong password error message appears
    await expect(page.getByText('You entered the wrong')).toBeVisible();
  });

  // TEST 4: Successful login with correct credentials
  test('TC_LOGIN_04: Login with valid credentials', async ({ page }, testInfo) => {
    const validMobile = process.env.TEST_MOBILE || '';
    const validPassword = process.env.TEST_PASSWORD || '';

    // 1. Enter valid mobile number
    await page.locator('input[name="inputMobile"]').fill(validMobile);

    // 2. Enter correct password
    await page.locator('input[name="inputPwd"]').fill(validPassword);

    // 3. Click Login button
    await page.locator('button.loginBtn').click();

    // 4. Check that user reaches the Dashboard URL
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
  });

  // TEST 5: Logout confirmation popup - click "No" (Cancel)
  test('TC_LOGIN_05: Cancel logout keeps user logged in', async ({ page }, testInfo) => {
    const validMobile = process.env.TEST_MOBILE || '';
    const validPassword = process.env.TEST_PASSWORD || '';

    // 1. Login first
    await page.locator('input[name="inputMobile"]').fill(validMobile);
    await page.locator('input[name="inputPwd"]').fill(validPassword);
    await page.locator('button.loginBtn').click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // 2. Click "Log Out" in the sidebar
    await page.locator('.dashboardSideMenu').getByText('Log Out').click();

    // 3. Click "No" on the confirmation popup
    await page.getByRole('button', { name: 'No' }).click({ force: true });

    // 4. Verify user is still logged in (Log Out link is still visible)
    await expect(page.locator('.dashboardSideMenu').getByText('Log Out')).toBeVisible();
  });

  // TEST 6: Successful Logout
  test('TC_LOGIN_06: Confirm logout redirects to login page', async ({ page }, testInfo) => {
    const validMobile = process.env.TEST_MOBILE || '';
    const validPassword = process.env.TEST_PASSWORD || '';

    // 1. Login first
    await page.locator('input[name="inputMobile"]').fill(validMobile);
    await page.locator('input[name="inputPwd"]').fill(validPassword);
    await page.locator('button.loginBtn').click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // 2. Click "Log Out" in the sidebar
    await page.locator('.dashboardSideMenu').getByText('Log Out').click();

    // 3. Click "Yes, Logout" button
    await page.getByRole('button', { name: 'Yes, Logout' }).click({ force: true });

    // 4. Verify user is returned back to the Login page
    await expect(page.locator('button.loginBtn')).toBeVisible({ timeout: 15000 });
  });

});
