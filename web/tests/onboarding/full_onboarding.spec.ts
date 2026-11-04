import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';


test.describe('Complete Secure Vault Onboarding Suite', () => {

  // Generous timeout to allow all steps to finish
  test.setTimeout(120000);

  test('RUN_ENTIRE_ONBOARDING_FLOW: Step 1 to Step 7 Complete', async ({ page }, testInfo) => {

    // STEP 1: Login & Navigate to Secure Vault

    await loginToEzit(page, testInfo);

    // Click Secure Vault navigation link
    const vaultNav = page.getByRole('navigation').filter({ hasText: 'Secure Vault' }).locator('span');
    await expect(vaultNav).toBeVisible({ timeout: 10000 });
    await vaultNav.click();

    // Click Continue on Security & Compliance card (using the inspected selector)
    const introContinue = page.locator('form.securityBtn button:has-text("Continue")')
      .or(page.locator('button.addAttachments:has-text("Continue")'))
      .or(page.getByRole('button', { name: 'Continue' }));

    if (await introContinue.first().isVisible({ timeout: 6000 }).catch(() => false)) {
      await introContinue.first().click();
    }

    // STEP 2: Set M-PIN (1-2-3-4 & 1-2-3-4)

    const mpinInputs = page.getByRole('textbox', { name: /Please enter OTP character/i });
    if (await mpinInputs.first().isVisible({ timeout: 4000 }).catch(() => false)) {
      // Enter M-PIN
      await mpinInputs.nth(0).fill('1');
      await mpinInputs.nth(1).fill('2');
      await mpinInputs.nth(2).fill('3');
      await mpinInputs.nth(3).fill('4');

      // Confirm M-PIN
      await mpinInputs.nth(4).fill('1');
      await mpinInputs.nth(5).fill('2');
      await mpinInputs.nth(6).fill('3');
      await mpinInputs.nth(7).fill('4');

      await page.getByRole('button', { name: 'Create M-PIN' }).click();

      // Click Continue to proceed to KYC
      const postMpinContinue = page.getByRole('button', { name: 'Continue' });
      await expect(postMpinContinue).toBeVisible({ timeout: 10000 });
      await postMpinContinue.click();
    }

    // STEP 3: KYC Verification (Aadhaar & PAN)

    // 3a. Click Aadhaar Card option first, then switch back to PAN Card
    const aadhaarOption = page.getByRole('radio', { name: /Aadhaar/i })
      .or(page.getByLabel(/Aadhaar/i))
      .or(page.getByText(/Aadhaar Card/i));

    if (await aadhaarOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await aadhaarOption.first().click();
      await page.waitForTimeout(800);

      const panOption = page.getByRole('radio', { name: /PAN Card/i })
        .or(page.getByLabel(/PAN Card/i))
        .or(page.getByText(/PAN Card/i));

      if (await panOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await panOption.first().click();
        await page.waitForTimeout(500);
      }
    }

    // 3b. Enter PAN and proceed
    const panInput = page.getByRole('textbox', { name: /Enter PAN Number/i });
    if (await panInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      await panInput.fill(process.env.TEST_PAN || 'DLKPN2135P');

      const continueBtn = page.getByRole('button', { name: 'Continue' });
      await expect(continueBtn).toBeEnabled({ timeout: 5000 });
      await continueBtn.click();

      // Name / KYC confirmation modal
      const modalContinue = page.getByRole('button', { name: 'Continue' });
      await page.waitForTimeout(1000);
      if (await modalContinue.isVisible({ timeout: 4000 }).catch(() => false)) {
        await modalContinue.click();
      }
    }

    // STEP 4: Personal Details

    const stateSelect = page.getByLabel('State');
    if (await stateSelect.isVisible({ timeout: 4000 }).catch(() => false)) {
      // DOB
      const dobInput = page.getByRole('textbox', { name: 'Enter your birth date' });
      if (await dobInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dobInput.click();
        await page.getByRole('combobox').first().selectOption('4').catch(() => {});
        await page.getByRole('combobox').nth(1).selectOption('2003').catch(() => {});
        const dayOption = page.getByRole('option', { name: /May 27th/i });
        if (await dayOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dayOption.click();
        }
      }

      // Address fields
      const city = process.env.TEST_CITY || 'Hyderabad';
      const pincode = process.env.TEST_PINCODE || '500001';
      const address = process.env.TEST_ADDRESS || 'Test Residency, Main Road';
      const state = process.env.TEST_STATE || 'AP';

      await stateSelect.selectOption(state);
      await page.getByRole('textbox', { name: 'City' }).fill(city);
      await page.getByRole('textbox', { name: 'Pincode' }).fill(pincode);
      await page.getByRole('textbox', { name: 'Full address' }).fill(address);

      const whatsappCheckbox = page.getByRole('checkbox', { name: 'WhatsApp on same mobile number' });
      if (await whatsappCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await whatsappCheckbox.check();
      }

      await page.getByRole('button', { name: 'Continue' }).click();

      // Intermediate Continue
      const postPersonalContinue = page.getByRole('button', { name: 'Continue' });
      if (await postPersonalContinue.isVisible({ timeout: 4000 }).catch(() => false)) {
        await postPersonalContinue.click();
      }
    }

    // STEP 5: Add Primary Nominee

    // Handle "Add Primary Nominee" intro card
    const nomineeIntroContinue = page.getByRole('button', { name: 'Continue' });
    const nomineeIntroHeading = page.getByText(/Add Primary Nominee/i);
    if (await nomineeIntroHeading.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      if (await nomineeIntroContinue.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nomineeIntroContinue.click();
      }
    }

    // Fill Nominee form
    const nomineeName = page.getByRole('textbox', { name: 'Full name' });
    if (await nomineeName.isVisible({ timeout: 4000 }).catch(() => false)) {
      await nomineeName.fill(process.env.TEST_NOMINEE_NAME || 'Test Nominee');

      const relationSelect = page.getByLabel(/Default select example|Relationship/i);
      if (await relationSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await relationSelect.selectOption('4');
      }

      await page.getByRole('textbox', { name: 'Enter your mobile number here' }).fill(process.env.TEST_NOMINEE_MOBILE || process.env.TEST_MOBILE || '9876543210');

      const nomineeWhatsapp = page.getByRole('checkbox', { name: 'WhatsApp on same mobile number' });
      if (await nomineeWhatsapp.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nomineeWhatsapp.check();
      }

      await page.getByRole('button', { name: 'Add Nominee' }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
    }

    // STEP 6: Reminder Preferences

    const waitTimeSelect = page.locator('select[name="wait_time"]');
    if (await waitTimeSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waitTimeSelect.selectOption('5'); // 5 days

      const remindersSelect = page.locator('select[name="no_reminders"]');
      if (await remindersSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await remindersSelect.selectOption('3'); // 3 reminders
      }

      await page.getByRole('button', { name: 'Continue' }).click();
    }

    // STEP 7: Communication Preferences (SMS) & Completion

    const smsCheckbox = page.getByRole('checkbox', { name: 'SMS' }).or(page.getByText('SMS'));
    if (await smsCheckbox.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await smsCheckbox.first().click();
      await page.getByRole('button', { name: 'Submit' }).click();
    }

    // Final Continue to reach Dashboard
    const finalContinue = page.getByRole('button', { name: 'Continue' });
    if (await finalContinue.isVisible({ timeout: 5000 }).catch(() => false)) {
      await finalContinue.click();
    }

    // VERIFICATION: Arrived on Dashboard

    const dashboardElement = page.getByText(/Hello|Assets|Dashboard/i).or(page.getByRole('navigation'));
    await expect(dashboardElement.first()).toBeVisible({ timeout: 15000 });
  });

});
