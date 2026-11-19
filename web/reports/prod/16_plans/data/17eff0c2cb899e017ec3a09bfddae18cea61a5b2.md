# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: subscription\subscriptionPlans.spec.ts >> Subscription Plans Tests >> TC_PLAN_04: Successfully upgrade to Prime Plan via Net Banking payment
- Location: tests\subscription\subscriptionPlans.spec.ts:209:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Continue' }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Continue' }).first() with timeout 10000ms
  - waiting for getByRole('button', { name: 'Continue' }).first()

```

```yaml
- main:
  - img "Logo"
  - paragraph: Get started with EZIT Club by finishing these steps
  - list:
    - listitem: 1 STEP 1 Create an account
    - img "Vercel Logo"
    - listitem: 2 STEP 2 Choose a plan
    - img "Vercel Logo"
    - listitem: 3 STEP 3 Vault Setup & KYC Verification
    - img "Vercel Logo"
    - listitem: 4 STEP 4 Add Primary Nominee
  - paragraph
  - paragraph:
    - img "Logo"
    - text: Back
  - paragraph: Take Subscription
  - text: Corporate Plan
  - img
  - text: Up to 100 assets/liabilities
  - img
  - text: Store up to 200MB of documents in DocVault
  - img
  - text: Standard support
  - img
  - text: Audit Report On Demand
  - img
  - text: Standard price
  - paragraph:
    - link "Switch plan, explore other plans":
      - /url: /subscription-plans
  - paragraph:
    - img "Logo"
    - text: INFO
  - paragraph: We will verify your corporate email ID.
  - text: Your corporate Email ID *
  - textbox "Your corporate Email ID *":
    - /placeholder: corporate@ezit.club
  - text: Corporate Employee ID *
  - textbox "Corporate Employee ID *":
    - /placeholder: e.g. ezit-508
  - paragraph:
    - text: "Info : How to get more EZ coins."
    - link "Refer a friend":
      - /url: /refer-a-friend
  - button "Verify my email"
- alert: /subscription-plans/corporate
```

# Test source

```ts
  129 |       const choosePlanBtn = page.getByRole('button', { name: 'Choose this plan' }).first();
  130 |       await expect(choosePlanBtn).toBeVisible({ timeout: 15000 });
  131 |       await choosePlanBtn.click();
  132 |       await page.waitForTimeout(1000);
  133 |     });
  134 | 
  135 |     // 4. Fill Corporate Email and Employee ID
  136 |     await test.step('Enter Corporate Email ID and Employee ID', async () => {
  137 |       const emailInput = page.getByRole('textbox', { name: /Your corporate Email ID/i }).or(
  138 |         page.getByPlaceholder(/corporate Email ID/i)
  139 |       );
  140 |       await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
  141 |       await emailInput.first().click();
  142 |       await emailInput.first().fill(corporateEmail);
  143 | 
  144 |       const empIdInput = page.getByRole('textbox', { name: /Corporate Employee ID/i }).or(
  145 |         page.getByPlaceholder(/Corporate Employee ID/i)
  146 |       );
  147 |       await expect(empIdInput.first()).toBeVisible({ timeout: 10000 });
  148 |       await empIdInput.first().click();
  149 |       await empIdInput.first().fill(employeeId);
  150 |     });
  151 | 
  152 |     // 5. Click 'Verify my email'
  153 |     await test.step('Submit Corporate Email Verification', async () => {
  154 |       const verifyEmailBtn = page.getByRole('button', { name: 'Verify my email' }).or(
  155 |         page.locator('button:has-text("Verify my email")')
  156 |       );
  157 |       await expect(verifyEmailBtn.first()).toBeVisible({ timeout: 10000 });
  158 |       await verifyEmailBtn.first().click();
  159 | 
  160 |       // Check verification response
  161 |       const corporateNotFoundError = page.locator('text=Corporate account not found with given email domain.').or(
  162 |         page.getByText('Corporate account not found', { exact: false })
  163 |       );
  164 | 
  165 |       const otpPrompt = page.getByText(/Enter OTP|OTP sent|Verification code/i).or(
  166 |         page.getByRole('textbox', { name: /OTP/i })
  167 |       );
  168 | 
  169 |       const resultIndicator = corporateNotFoundError.or(otpPrompt);
  170 |       await expect(resultIndicator.first()).toBeVisible({ timeout: 15000 });
  171 | 
  172 |       if (await corporateNotFoundError.first().isVisible().catch(() => false)) {
  173 |         console.log('\n [Expected Flow Verified]: "Corporate account not found with given email domain." is displayed as expected.\n');
  174 |       } else {
  175 |         console.log('\n [Corporate OTP Flow Verified]: Corporate domain recognized and OTP prompt displayed.\n');
  176 |       }
  177 |     });
  178 |   });
  179 | 
  180 |   /**
  181 |    * ----------------------------------------------------------------------------
  182 |    * TC_PLAN_03: Verify Available Subscription Tiers & Pricing Options
  183 |    * ----------------------------------------------------------------------------
  184 |    */
  185 |   test('TC_PLAN_03: Verify subscription plans render cards and pricing options', async ({ page }) => {
  186 |     // Navigate directly to Subscription Plan Details URL
  187 |     await page.goto('/profile/subscription-plan-details');
  188 |     await page.waitForLoadState('domcontentloaded');
  189 | 
  190 |     // 2. Wait for Subscription Plan Details header and plan options to load
  191 |     await expect(page.getByText(/Subscription Plan Details|Your Current plan|Free Plan/i).first()).toBeVisible({ timeout: 15000 });
  192 | 
  193 |     // 3. Verify buttons or plan cards
  194 |     const choosePlanButtons = page.getByRole('button', { name: /Choose this plan/i }).or(
  195 |       page.locator('button:has-text("Choose this plan")')
  196 |     );
  197 | 
  198 |     await expect(choosePlanButtons.first()).toBeVisible({ timeout: 15000 });
  199 |     const count = await choosePlanButtons.count();
  200 |     console.log(`\n Verified ${count} plan tier options available for selection.\n`);
  201 |     expect(count).toBeGreaterThanOrEqual(1);
  202 |   });
  203 | 
  204 |   /**
  205 |    * ----------------------------------------------------------------------------
  206 |    * TC_PLAN_04: Upgrade to Prime Plan via WorldLine Net Banking (Handles UPI error)
  207 |    * ----------------------------------------------------------------------------
  208 |    */
  209 |   test('TC_PLAN_04: Successfully upgrade to Prime Plan via Net Banking payment', async ({ page }) => {
  210 |     // 1. Navigate to Profile -> Plan details
  211 |     await test.step('Navigate to Plan Details', async () => {
  212 |       await page.goto('/profile/subscription-plan-details');
  213 |       await page.waitForLoadState('domcontentloaded');
  214 |     });
  215 | 
  216 |     // 2. Choose Prime Plan (by link href or container)
  217 |     await test.step('Select Prime Plan', async () => {
  218 |       const primePlanBtn = page.locator('a[href*="annual-prime"]').getByRole('button', { name: 'Choose this plan' }).or(
  219 |         page.locator('div, .card').filter({ hasText: /Prime Annual/i }).getByRole('button', { name: 'Choose this plan' })
  220 |       ).or(
  221 |         page.getByRole('button', { name: 'Choose this plan' }).nth(1)
  222 |       );
  223 |       await expect(primePlanBtn.first()).toBeVisible({ timeout: 15000 });
  224 |       await primePlanBtn.first().click();
  225 |       await page.waitForTimeout(500);
  226 | 
  227 |       // On checkout page, click 'Continue' to trigger Choose Payment Option dialog
  228 |       const continueBtn = page.getByRole('button', { name: 'Continue' }).first();
> 229 |       await expect(continueBtn).toBeVisible({ timeout: 10000 });
      |                                 ^ Error: expect(locator).toBeVisible() failed
  230 |       await continueBtn.click();
  231 |       await page.waitForTimeout(1000);
  232 |     });
  233 | 
  234 |     // 3. Confirm Dialog & Select WorldLine Gateway
  235 |     await test.step('Select Payment Gateway (WorldLine Option)', async () => {
  236 |       // Step A: In "Choose Payment Option" modal dialog, click modal Continue with default UPI
  237 |       const modal = page.locator('.modal.show, [role="dialog"], .modal-dialog');
  238 |       const modalContinueBtn = modal.getByRole('button', { name: 'Continue' }).or(
  239 |         page.getByRole('dialog').getByRole('button', { name: 'Continue' })
  240 |       ).or(page.locator('button.btn-primary:has-text("Continue")'));
  241 |       
  242 |       if (await modalContinueBtn.first().isVisible({ timeout: 15000 }).catch(() => false)) {
  243 |         await modalContinueBtn.first().click({ force: true });
  244 |       }
  245 | 
  246 |       // Step B: Wait for UPI error: "Unable to process the payment" if it appears
  247 |       const upiErrorToast = page.getByText(/Unable to process the payment/i);
  248 |       if (await upiErrorToast.first().isVisible({ timeout: 5000 }).catch(() => false)) {
  249 |         console.log('\n [UPI Error Captured]: "Unable to process the payment" appeared as expected on Prime.\n');
  250 |       }
  251 | 
  252 |       // Dismiss / wait for error toast and ensure modal is open
  253 |       await page.waitForTimeout(1000);
  254 |       const pageContinueBtn = page.getByRole('button', { name: 'Continue' }).first();
  255 |       await pageContinueBtn.click({ force: true }).catch(() => {});
  256 |       await page.waitForTimeout(500);
  257 | 
  258 |       // Step C: Select "WorldLine Option" (For Cards & Net Banking)
  259 |       const worldlineRadio = page.getByRole('radio', { name: 'WorldLine Option' });
  260 |       const worldlineLabel = page.locator('label').nth(3);
  261 | 
  262 |       if (await worldlineLabel.isVisible().catch(() => false)) {
  263 |         await worldlineLabel.click({ force: true }).catch(() => {});
  264 |       }
  265 |       await worldlineRadio.check({ force: true }).catch(async () => {
  266 |         await worldlineRadio.click({ force: true }).catch(() => {});
  267 |       });
  268 |       await page.waitForTimeout(500);
  269 | 
  270 |       // Step D: Click Continue in the modal dialog to proceed to Net Banking
  271 |       const dialogContinue = page.getByRole('dialog').getByRole('button', { name: 'Continue' }).or(
  272 |         modal.getByRole('button', { name: 'Continue' })
  273 |       );
  274 |       await dialogContinue.first().click({ force: true });
  275 |     });
  276 | 
  277 |     // 4. Select Bank and Submit Payment in Dev, or Dismiss in Prod
  278 |     if (isDevEnv(page, test.info().project.name)) {
  279 |       await test.step('Complete Net Banking Sandbox Payment', async () => {
  280 |         await completeNetBankingPayment(page);
  281 |         console.log('\n Successfully completed the Net Banking payment flow!\n');
  282 |       });
  283 |     } else {
  284 |       await test.step('Dismiss Gateway in PROD', async () => {
  285 |         await dismissOrCloseGateway(page);
  286 |         await page.goto('https://app.ezit.club/profile');
  287 |         await page.waitForLoadState('domcontentloaded');
  288 |         console.log('\n [PROD] Gateway safely dismissed without payment.\n');
  289 |       });
  290 |     }
  291 |   });
  292 | 
  293 |   /**
  294 |    * ----------------------------------------------------------------------------
  295 |    * TC_PLAN_05: Upgrade to Basic Annual Plan via WorldLine Net Banking (Handles UPI error)
  296 |    * ----------------------------------------------------------------------------
  297 |    */
  298 |   test('TC_PLAN_05: Successfully upgrade to Basic Annual Plan via Net Banking payment', async ({ page }) => {
  299 |     // 1. Navigate directly to Subscription Plan Details URL
  300 |     await test.step('Navigate to Plan Details', async () => {
  301 |       await page.goto('/profile/subscription-plan-details');
  302 |       await page.waitForLoadState('domcontentloaded');
  303 |     });
  304 | 
  305 |     // 2. Choose Basic Annual Plan
  306 |     await test.step('Select Basic Annual Plan', async () => {
  307 |       const basicCardBtn = page.locator('a[href*="annual-basic"]').getByRole('button', { name: 'Choose this plan' }).or(
  308 |         page.locator('div, .card').filter({ hasText: /Basic/i }).getByRole('button', { name: 'Choose this plan' })
  309 |       ).or(
  310 |         page.getByRole('button', { name: 'Choose this plan' }).nth(2)
  311 |       );
  312 | 
  313 |       await expect(basicCardBtn.first()).toBeVisible({ timeout: 15000 });
  314 |       await basicCardBtn.first().click();
  315 |       await page.waitForTimeout(500);
  316 | 
  317 |       const continueBtn = page.getByRole('button', { name: 'Continue' }).first();
  318 |       await expect(continueBtn).toBeVisible({ timeout: 10000 });
  319 |       await continueBtn.click();
  320 |       await page.waitForTimeout(1000);
  321 |     });
  322 | 
  323 |     // 3. Confirm Dialog & Select WorldLine Gateway
  324 |     await test.step('Select Payment Gateway (WorldLine Option)', async () => {
  325 |       // Step A: In "Choose Payment Option" modal dialog, click modal Continue with default UPI
  326 |       const modal = page.locator('.modal.show, [role="dialog"], .modal-dialog');
  327 |       const modalContinueBtn = modal.getByRole('button', { name: 'Continue' }).or(
  328 |         page.getByRole('dialog').getByRole('button', { name: 'Continue' })
  329 |       );
```