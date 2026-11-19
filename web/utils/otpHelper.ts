import { Page, TestInfo } from '@playwright/test';

/**
 * Checks if current execution is on STAGE environment
 */
export function isStageEnv(page: Page, testInfo?: TestInfo): boolean {
  return (
    testInfo?.project.name === 'stage' ||
    (page.url() || '').includes('stage-fe') ||
    process.env.TEST_ENV === 'stage'
  );
}

/**
 * Checks if current execution is Non-Prod (DEV or STAGE)
 */
export function isNonProd(page: Page, testInfo?: TestInfo): boolean {
  const pName = testInfo?.project.name || '';
  const url = page.url() || '';
  return (
    pName === 'dev' ||
    pName === 'stage' ||
    url.includes('dev1-fe') ||
    url.includes('stage-fe') ||
    process.env.TEST_ENV === 'dev' ||
    process.env.TEST_ENV === 'stage'
  );
}

/**
 * Universal OTP handler:
 * - On STAGE with bypass enabled (STAGE_USE_BYPASS_OTP=true): Automatically types bypass OTP (123456)
 * - When SKIP_MANUAL_OTP=true: Verifies OTP screen/inputs are loaded, logs success, and skips pausing
 * - When SKIP_MANUAL_OTP=false (default): Pauses browser for manual SMS OTP entry and resumes
 */
export async function handleOtp(page: Page, testInfo: TestInfo, bypassOtp: string = '123456'): Promise<void> {
  const isBypassEnabled = process.env.STAGE_USE_BYPASS_OTP !== 'false';
  const shouldSkipManualOtp = process.env.SKIP_MANUAL_OTP === 'true';

  if (isStageEnv(page, testInfo) && isBypassEnabled) {
    console.log(`\n>>> [STAGE - BYPASS MODE] Automatically entering bypass OTP: ${bypassOtp} <<<\n`);
    
    // 1. Wait for OTP screen / input to appear
    const otpScreenIndicator = page.getByText(/Verify OTP|Enter OTP|6 digits OTP|Enter 6 Digit code|We have sent code/i).first()
      .or(page.locator('input[aria-label*="character 1"], input[maxlength="1"]').first());
    await otpScreenIndicator.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    // 2. Find the 6 OTP input boxes
    let otpInputs = page.locator('input[aria-label*="character"]:visible');
    if ((await otpInputs.count()) < 6) {
      otpInputs = page.locator('input[maxlength="1"]:visible');
    }
    if ((await otpInputs.count()) < 6) {
      otpInputs = page.locator('input[type="text"]:visible, input[type="tel"]:visible, input[type="number"]:visible')
        .filter({ hasNot: page.locator('[name="inputMobile"], [name="inputPwd"], [name="password"], [name="email"]') });
    }

    const count = await otpInputs.count();
    console.log(`>>> Detected ${count} OTP input boxes <<<`);

    if (count >= 6) {
      const digits = bypassOtp.split('');
      for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).click({ force: true });
        await otpInputs.nth(i).fill(digits[i]);
        await page.waitForTimeout(80);
      }
    } else if (count > 0) {
      // Focus first box and type via keyboard
      await otpInputs.first().click({ force: true });
      await page.keyboard.type(bypassOtp, { delay: 100 });
    }

    console.log(`>>> [STAGE] Bypass OTP ${bypassOtp} filled successfully! <<<\n`);
    await page.waitForTimeout(300);
  } else if (shouldSkipManualOtp) {
    // ---- SKIP MANUAL OTP MODE ----
    console.log(`\n>>> [SKIP_MANUAL_OTP=true] Verifying OTP screen and skipping manual entry... <<<`);
    
    // Verify OTP elements are present
    const otpScreenIndicator = page.getByText(/Verify OTP|Enter OTP|6 digits OTP|Enter 6 Digit code|We have sent code/i).first()
      .or(page.locator('input[aria-label*="character 1"], input[maxlength="1"]').first());
    await otpScreenIndicator.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    console.log(`>>> [SUCCESS] OTP screen verified! Manual entry skipped as configured in .env <<<\n`);
    testInfo.skip(true, 'SKIP_MANUAL_OTP=true: OTP screen verified successfully, remaining post-OTP actions skipped.');
  } else {
    // ---- MANUAL OTP ENTRY MODE ----
    const envLabel = isStageEnv(page, testInfo) ? 'STAGE (REAL SMS MODE)' : 'DEV/PROD';
    console.log(`\n>>> [${envLabel}] LIVE SMS OTP REQUIRED: Please enter OTP on screen and click Resume (▶) on Playwright toolbar! <<<\n`);
    await page.pause();
  }
}
