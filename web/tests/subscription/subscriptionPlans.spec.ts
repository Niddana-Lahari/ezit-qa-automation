import { test, expect, Page } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';
import { dismissOrCloseGateway } from '../../utils/gatewayHelper';

function isDevEnv(page: Page, projectName?: string): boolean {
  return (
    projectName === 'dev' ||
    (page.url() || '').includes('dev1-fe') ||
    process.env.TEST_ENV === 'dev'
  );
}

// Complete the test net banking payment in Dev
async function completeNetBankingPayment(page: Page) {
  // Select bank 470 and submit
  const ezitBankSelect = page.getByRole('combobox').first();
  await expect(ezitBankSelect).toBeVisible({ timeout: 25000 });
  await ezitBankSelect.selectOption('470');
  await page.getByRole('button', { name: 'Pay Now' }).click();

  // Wait for payment gateway page
  await page.waitForURL(/tpsl-india\.in/i, { timeout: 30000 });

  // Select test bank again on gateway
  const gatewayBankSelect = page.locator('#selectNetBank');
  await expect(gatewayBankSelect).toBeVisible({ timeout: 20000 });
  await gatewayBankSelect.selectOption('470');
  await page.getByRole('button', { name: 'Pay Now' }).click();

  // Enter test credentials
  const username = page.locator('#textfield2');
  await expect(username).toBeVisible({ timeout: 20000 });
  await username.fill('test');
  await page.locator('#textfield3').fill('test');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Handle second submit if shown
  const secondSubmit = page.getByRole('button', { name: 'Submit' });
  const hasSecondSubmit = await secondSubmit
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (hasSecondSubmit) {
    await secondSubmit.click();
  }

  // Verify success confirmation
  await expect(page.getByText(/Payment completed/i).first()).toBeVisible({ timeout: 30000 });
}

test.describe('Subscription Plans Tests', () => {
  test.setTimeout(240000);

  test.beforeEach(async ({ page }, testInfo) => {
    await loginToEzit(page, testInfo);
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_PLAN_01: View Current Active Plan Details from Profile
   * ----------------------------------------------------------------------------
   */
  test('TC_PLAN_01: Verify user can view subscription plan details from Profile', async ({ page }) => {
    // 1. Navigate to Profile
    await test.step('Navigate to Profile', async () => {
      const profileBtn = page.getByText('Profile', { exact: true }).or(
        page.getByRole('link', { name: /Profile/i })
      ).or(
        page.locator('text=Profile')
      );
      await expect(profileBtn.first()).toBeVisible({ timeout: 15000 });
      await profileBtn.first().click();
      await page.waitForURL('**/profile', { timeout: 15000 });
    });

    // 2. Click Plan details link
    await test.step('Open Plan Details', async () => {
      const planDetailsLink = page.getByRole('link', { name: 'Plan details' }).or(
        page.getByText('Plan details', { exact: false })
      );
      await expect(planDetailsLink.first()).toBeVisible({ timeout: 15000 });
      await planDetailsLink.first().click();
      await page.waitForURL(/.*subscription-plan/i, { timeout: 15000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded');
    });

    // 3. Verify Plan Details page renders
    await test.step('Verify Plan Information is displayed', async () => {
      const planHeading = page.getByText(/Subscription Plan Details|Your Current plan|Choose this plan|Active Plan/i).first();
      await expect(planHeading).toBeVisible({ timeout: 15000 });
      console.log('\n TC_PLAN_01 Passed: Active plan details rendered successfully.\n');
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_PLAN_02: Corporate Plan Verification Flow (Dev & Prod aware)
   * ----------------------------------------------------------------------------
   */
  test('TC_PLAN_02: Verify Corporate Plan email and employee ID verification flow', async ({ page }) => {
    const corporateEmail = 'lahari.niddana@vithiit.com';
    const employeeId = 'V1231';

    // 1. Navigate to Profile
    await test.step('Navigate to Profile', async () => {
      const profileBtn = page.getByText('Profile', { exact: true }).or(
        page.getByRole('link', { name: /Profile/i })
      ).or(
        page.locator('text=Profile')
      );
      await expect(profileBtn.first()).toBeVisible({ timeout: 15000 });
      await profileBtn.first().click();
      await page.waitForURL('**/profile', { timeout: 15000 });
    });

    // 2. Click Plan details
    await test.step('Open Plan Details', async () => {
      const planDetailsLink = page.getByRole('link', { name: 'Plan details' }).or(
        page.getByText('Plan details', { exact: false })
      );
      await expect(planDetailsLink.first()).toBeVisible({ timeout: 15000 });
      await planDetailsLink.first().click();
      await page.waitForURL(/.*subscription-plan/i, { timeout: 15000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded');
    });

    // 3. Click 'Choose this plan' for Corporate plan
    await test.step('Click Choose this plan on Corporate Plan', async () => {
      const choosePlanBtn = page.getByRole('button', { name: 'Choose this plan' }).first();
      await expect(choosePlanBtn).toBeVisible({ timeout: 15000 });
      await choosePlanBtn.click();
      await page.waitForTimeout(1000);
    });

    // 4. Fill Corporate Email and Employee ID
    await test.step('Enter Corporate Email ID and Employee ID', async () => {
      const emailInput = page.getByRole('textbox', { name: /Your corporate Email ID/i }).or(
        page.getByPlaceholder(/corporate Email ID/i)
      );
      await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
      await emailInput.first().click();
      await emailInput.first().fill(corporateEmail);

      const empIdInput = page.getByRole('textbox', { name: /Corporate Employee ID/i }).or(
        page.getByPlaceholder(/Corporate Employee ID/i)
      );
      await expect(empIdInput.first()).toBeVisible({ timeout: 10000 });
      await empIdInput.first().click();
      await empIdInput.first().fill(employeeId);
    });

    // 5. Click 'Verify my email'
    await test.step('Submit Corporate Email Verification', async () => {
      const verifyEmailBtn = page.getByRole('button', { name: 'Verify my email' }).or(
        page.locator('button:has-text("Verify my email")')
      );
      await expect(verifyEmailBtn.first()).toBeVisible({ timeout: 10000 });
      await verifyEmailBtn.first().click();

      // Check verification response
      const corporateNotFoundError = page.locator('text=Corporate account not found with given email domain.').or(
        page.getByText('Corporate account not found', { exact: false })
      );

      const otpPrompt = page.getByText(/Enter OTP|OTP sent|Verification code/i).or(
        page.getByRole('textbox', { name: /OTP/i })
      );

      const resultIndicator = corporateNotFoundError.or(otpPrompt);
      await expect(resultIndicator.first()).toBeVisible({ timeout: 15000 });

      if (await corporateNotFoundError.first().isVisible().catch(() => false)) {
        console.log('\n [Expected Flow Verified]: "Corporate account not found with given email domain." is displayed as expected.\n');
      } else {
        console.log('\n [Corporate OTP Flow Verified]: Corporate domain recognized and OTP prompt displayed.\n');
      }
    });
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_PLAN_03: Verify Available Subscription Tiers & Pricing Options
   * ----------------------------------------------------------------------------
   */
  test('TC_PLAN_03: Verify subscription plans render cards and pricing options', async ({ page }) => {
    // 1. Navigate to Profile -> Plan details
    const profileBtn = page.getByText('Profile', { exact: true }).or(
      page.getByRole('link', { name: /Profile/i })
    ).or(page.locator('text=Profile'));
    await expect(profileBtn.first()).toBeVisible({ timeout: 15000 });
    await profileBtn.first().click();

    const planDetailsLink = page.getByRole('link', { name: 'Plan details' }).or(
      page.getByText('Plan details', { exact: false })
    );
    await expect(planDetailsLink.first()).toBeVisible({ timeout: 10000 });
    await planDetailsLink.first().click();
    await page.waitForLoadState('networkidle').catch(() => {});

    // 2. Wait for Subscription Plan Details header and plan options to load
    await expect(page.getByText(/Subscription Plan Details|Your Current plan/i).first()).toBeVisible({ timeout: 15000 });

    // 3. Verify buttons or plan cards
    const choosePlanButtons = page.getByRole('button', { name: /Choose this plan/i }).or(
      page.locator('button:has-text("Choose this plan")')
    );

    await expect(choosePlanButtons.first()).toBeVisible({ timeout: 15000 });
    const count = await choosePlanButtons.count();
    console.log(`\n Verified ${count} plan tier options available for selection.\n`);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_PLAN_04: Upgrade to Prime Plan via WorldLine Net Banking (Handles UPI error)
   * ----------------------------------------------------------------------------
   */
  test('TC_PLAN_04: Successfully upgrade to Prime Plan via Net Banking payment', async ({ page }) => {
    // 1. Navigate to Profile -> Plan details
    await test.step('Navigate to Plan Details', async () => {
      const profileBtn = page.getByText('Profile', { exact: true }).or(
        page.getByRole('link', { name: /Profile/i })
      ).or(page.locator('text=Profile'));
      await expect(profileBtn.first()).toBeVisible({ timeout: 15000 });
      await profileBtn.first().click();

      await page.waitForURL(/.*profile/i, { timeout: 15000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded');

      const planDetailsLink = page.getByRole('link', { name: 'Plan details' }).or(
        page.getByText('Plan details', { exact: false })
      );
      await expect(planDetailsLink.first()).toBeVisible({ timeout: 20000 });
      await planDetailsLink.first().click();
      await page.waitForLoadState('networkidle').catch(() => {});
    });

    // 2. Choose Prime Plan (nth 1 as recorded)
    await test.step('Select Prime Plan', async () => {
      const primePlanBtn = page.getByRole('button', { name: 'Choose this plan' }).nth(1);
      await expect(primePlanBtn).toBeVisible({ timeout: 15000 });
      await primePlanBtn.click();
      await page.waitForTimeout(500);

      // On checkout page, click 'Continue' to trigger Choose Payment Option dialog
      const continueBtn = page.getByRole('button', { name: 'Continue' }).first();
      await expect(continueBtn).toBeVisible({ timeout: 10000 });
      await continueBtn.click();
      await page.waitForTimeout(1000);
    });

    // 3. Confirm Dialog & Select WorldLine Gateway
    await test.step('Select Payment Gateway (WorldLine Option)', async () => {
      // Step A: In "Choose Payment Option" modal dialog, click modal Continue with default UPI
      const modal = page.locator('.modal.show, [role="dialog"], .modal-dialog');
      const modalContinueBtn = modal.getByRole('button', { name: 'Continue' }).or(
        page.getByRole('dialog').getByRole('button', { name: 'Continue' })
      );
      await expect(modalContinueBtn.first()).toBeVisible({ timeout: 15000 });
      await modalContinueBtn.first().click({ force: true });

      // Step B: Wait for UPI error: "Unable to process the payment"
      const upiErrorToast = page.getByText(/Unable to process the payment/i);
      await expect(upiErrorToast.first()).toBeVisible({ timeout: 15000 });
      console.log('\n [UPI Error Captured]: "Unable to process the payment" appeared as expected on Prime.\n');

      // Dismiss / wait for error toast and ensure modal is open
      await page.waitForTimeout(1000);
      const pageContinueBtn = page.getByRole('button', { name: 'Continue' }).first();
      await pageContinueBtn.click({ force: true });
      await page.waitForTimeout(500);

      // Step C: Select "WorldLine Option" (For Cards & Net Banking)
      const worldlineRadio = page.getByRole('radio', { name: 'WorldLine Option' });
      const worldlineLabel = page.locator('label').nth(3);

      if (await worldlineLabel.isVisible().catch(() => false)) {
        await worldlineLabel.click({ force: true }).catch(() => {});
      }
      await worldlineRadio.check({ force: true }).catch(async () => {
        await worldlineRadio.click({ force: true }).catch(() => {});
      });
      await page.waitForTimeout(500);

      // Step D: Click Continue in the modal dialog to proceed to Net Banking
      const dialogContinue = page.getByRole('dialog').getByRole('button', { name: 'Continue' }).or(
        modal.getByRole('button', { name: 'Continue' })
      );
      await dialogContinue.first().click({ force: true });
    });

    // 4. Select Bank and Submit Payment in Dev, or Dismiss in Prod
    if (isDevEnv(page, test.info().project.name)) {
      await test.step('Complete Net Banking Sandbox Payment', async () => {
        await completeNetBankingPayment(page);
        console.log('\n Successfully completed the Net Banking payment flow!\n');
      });
    } else {
      await test.step('Dismiss Gateway in PROD', async () => {
        await dismissOrCloseGateway(page);
        await page.goto('https://app.ezit.club/profile');
        await page.waitForLoadState('domcontentloaded');
        console.log('\n [PROD] Gateway safely dismissed without payment.\n');
      });
    }
  });

  /**
   * ----------------------------------------------------------------------------
   * TC_PLAN_05: Upgrade to Basic Annual Plan via WorldLine Net Banking (Handles UPI error)
   * ----------------------------------------------------------------------------
   */
  test('TC_PLAN_05: Successfully upgrade to Basic Annual Plan via Net Banking payment', async ({ page }) => {
    // 1. Navigate to Profile -> Plan details
    await test.step('Navigate to Plan Details', async () => {
      const profileBtn = page.getByText('Profile', { exact: true }).or(
        page.getByRole('link', { name: /Profile/i })
      ).or(page.locator('text=Profile'));
      await expect(profileBtn.first()).toBeVisible({ timeout: 15000 });
      await profileBtn.first().click();

      await page.waitForURL(/.*profile/i, { timeout: 15000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded');

      const planDetailsLink = page.getByRole('link', { name: 'Plan details' }).or(
        page.getByText('Plan details', { exact: false })
      );
      await expect(planDetailsLink.first()).toBeVisible({ timeout: 20000 });
      await planDetailsLink.first().click();
      await page.waitForLoadState('networkidle').catch(() => {});
    });

    // 2. Choose Basic Annual Plan
    await test.step('Select Basic Annual Plan', async () => {
      const basicCardBtn = page.locator('div, .card').filter({ hasText: /Basic/i }).getByRole('button', { name: 'Choose this plan' }).first();
      const planBtn = (await basicCardBtn.isVisible().catch(() => false))
        ? basicCardBtn
        : page.getByRole('button', { name: 'Choose this plan' }).nth(1);

      await expect(planBtn).toBeVisible({ timeout: 15000 });
      await planBtn.click();
      await page.waitForTimeout(500);

      const continueBtn = page.getByRole('button', { name: 'Continue' }).first();
      await expect(continueBtn).toBeVisible({ timeout: 10000 });
      await continueBtn.click();
      await page.waitForTimeout(1000);
    });

    // 3. Confirm Dialog & Select WorldLine Gateway
    await test.step('Select Payment Gateway (WorldLine Option)', async () => {
      // Step A: In "Choose Payment Option" modal dialog, click modal Continue with default UPI
      const modal = page.locator('.modal.show, [role="dialog"], .modal-dialog');
      const modalContinueBtn = modal.getByRole('button', { name: 'Continue' }).or(
        page.getByRole('dialog').getByRole('button', { name: 'Continue' })
      );
      await expect(modalContinueBtn.first()).toBeVisible({ timeout: 15000 });
      await modalContinueBtn.first().click({ force: true });

      // Step B: Wait for UPI error: "Unable to process the payment"
      const upiErrorToast = page.getByText(/Unable to process the payment/i);
      await expect(upiErrorToast.first()).toBeVisible({ timeout: 15000 });
      console.log('\n [UPI Error Captured]: "Unable to process the payment" appeared as expected on Basic Annual.\n');

      // Dismiss / wait for error toast and ensure modal is open
      await page.waitForTimeout(1000);
      const pageContinueBtn = page.getByRole('button', { name: 'Continue' }).first();
      await pageContinueBtn.click({ force: true });
      await page.waitForTimeout(500);

      // Step C: Select "WorldLine Option" (For Cards & Net Banking)
      const worldlineRadio = page.getByRole('radio', { name: 'WorldLine Option' });
      const worldlineLabel = page.locator('label').nth(3);

      if (await worldlineLabel.isVisible().catch(() => false)) {
        await worldlineLabel.click({ force: true }).catch(() => {});
      }
      await worldlineRadio.check({ force: true }).catch(async () => {
        await worldlineRadio.click({ force: true }).catch(() => {});
      });
      await page.waitForTimeout(500);

      // Step D: Click Continue in the modal dialog to proceed to Net Banking
      const dialogContinue = page.getByRole('dialog').getByRole('button', { name: 'Continue' }).or(
        modal.getByRole('button', { name: 'Continue' })
      );
      await dialogContinue.first().click({ force: true });
    });

    // 4. Select Bank and Submit Payment in Dev, or Dismiss in Prod
    if (isDevEnv(page, test.info().project.name)) {
      await test.step('Complete Net Banking Sandbox Payment', async () => {
        await completeNetBankingPayment(page);
        console.log('\n Successfully completed the Net Banking payment flow!\n');
      });
    } else {
      await test.step('Dismiss Gateway in PROD', async () => {
        await dismissOrCloseGateway(page);
        await page.goto('https://app.ezit.club/profile');
        await page.waitForLoadState('domcontentloaded');
        console.log('\n [PROD] Gateway safely dismissed without payment.\n');
      });
    }
  });

  test('TC_PLAN_06: Successfully upgrade to Basic Plan via Net Banking payment', async ({ page }) => {
    // 1. Navigate to Profile -> Plan details
    await test.step('Navigate to Plan Details', async () => {
      const profileBtn = page.getByText('Profile', { exact: true }).or(
        page.getByRole('link', { name: /Profile/i })
      ).or(page.locator('text=Profile'));
      await expect(profileBtn.first()).toBeVisible({ timeout: 15000 });
      await profileBtn.first().click();

      await page.waitForURL(/.*profile/i, { timeout: 15000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded');

      const planDetailsLink = page.getByRole('link', { name: 'Plan details' }).or(
        page.getByText('Plan details', { exact: false })
      );
      await expect(planDetailsLink.first()).toBeVisible({ timeout: 20000 });
      await planDetailsLink.first().click();
      await page.waitForLoadState('networkidle').catch(() => {});
    });

    // 2. Choose Basic Plan (card containing 'Basic' or nth 2 button)
    await test.step('Select Basic Plan', async () => {
      // Find the card/container for "Basic" or choose the 3rd 'Choose this plan' button
      const basicCardBtn = page.locator('div, .card').filter({ hasText: /^Basic\b/i }).getByRole('button', { name: 'Choose this plan' }).first();
      const planBtn = (await basicCardBtn.isVisible().catch(() => false))
        ? basicCardBtn
        : page.getByRole('button', { name: 'Choose this plan' }).nth(2);

      await expect(planBtn).toBeVisible({ timeout: 15000 });
      await planBtn.click();
      await page.waitForTimeout(500);

      const continueBtn = page.getByRole('button', { name: 'Continue' }).first();
      await expect(continueBtn).toBeVisible({ timeout: 10000 });
      await continueBtn.click();
      await page.waitForTimeout(1000);
    });

    // 3. Confirm Dialog & Select WorldLine Gateway
    await test.step('Select Payment Gateway (WorldLine Option)', async () => {
      const modal = page.locator('.modal.show, [role="dialog"], .modal-dialog');
      const modalContinueBtn = modal.getByRole('button', { name: 'Continue' }).or(
        page.getByRole('dialog').getByRole('button', { name: 'Continue' })
      ).or(
        page.getByRole('button', { name: 'Continue' })
      );
      await expect(modalContinueBtn.first()).toBeVisible({ timeout: 15000 });
      await modalContinueBtn.first().click({ force: true });

      // Step B: Check if UPI error toast appears ("Unable to process the payment")
      const upiErrorToast = page.getByText(/Unable to process the payment/i);
      const isUpiError = await upiErrorToast.first().isVisible({ timeout: 4000 }).catch(() => false);
      if (isUpiError) {
        console.log('\n [UPI Error Captured]: "Unable to process the payment" appeared.\n');
        await page.waitForTimeout(1000);
        const pageContinueBtn = page.getByRole('button', { name: 'Continue' }).first();
        await pageContinueBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(500);
      }

      // Step C: Select "WorldLine Option" (For Cards & Net Banking)
      const worldlineRadio = page.getByRole('radio', { name: 'WorldLine Option' }).or(
        page.locator('label:has-text("WorldLine")')
      ).or(
        page.locator('label').nth(3)
      );

      await worldlineRadio.first().click({ force: true }).catch(async () => {
        await page.getByRole('radio', { name: 'WorldLine Option' }).check({ force: true });
      });
      await page.waitForTimeout(500);

      // Step D: Click Continue inside the dialog to proceed to Net Banking
      const dialog = page.getByRole('dialog').or(page.locator('.modal.show, .modal-dialog'));
      const dialogContinue = dialog.getByRole('button', { name: 'Continue' }).first();
      await expect(dialogContinue).toBeVisible({ timeout: 10000 });
      await dialogContinue.click({ force: true });
    });

    // 4. Select Bank and Submit Payment in Dev, or Dismiss in Prod
    if (isDevEnv(page, test.info().project.name)) {
      await test.step('Complete Net Banking Sandbox Payment', async () => {
        await completeNetBankingPayment(page);
        console.log('\n Successfully completed the Basic Plan Net Banking payment flow!\n');
      });
    } else {
      await test.step('Dismiss Gateway in PROD', async () => {
        await dismissOrCloseGateway(page);
        await page.goto('https://app.ezit.club/profile');
        await page.waitForLoadState('domcontentloaded');
        console.log('\n [PROD] Gateway safely dismissed without payment.\n');
      });
    }
  });

});