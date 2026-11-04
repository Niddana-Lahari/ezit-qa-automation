import { expect, Page } from '@playwright/test';

async function waitForStage(page: Page, timeout: number): Promise<'bank' | 'login'> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try {
      if (await page.locator('#textfield2 >> visible=true').count() > 0) return 'login';
      if (await page.locator('input[type="password"] >> visible=true').count() > 0) return 'login';
      if (await page.locator('select >> visible=true').count() > 0) return 'bank';
    } catch {
      // the page was changing (navigation) - just look again
    }
    await page.waitForTimeout(500);
  }

  const inputs = await page
    .locator('input >> visible=true')
    .evaluateAll(els => els.map(e => `${(e as HTMLInputElement).type}#${e.id}`))
    .catch(() => [] as string[]);
  throw new Error(
    `Net Banking: no bank dropdown and no login box (#textfield2) appeared in ${timeout / 1000}s.\n` +
    `URL: ${page.url()}\nVisible inputs: ${JSON.stringify(inputs)}`
  );
}

export async function completeNetBankingPayment(page: Page) {
  for (let round = 1; round <= 3; round++) {
    const stage = await waitForStage(page, 40000);
    if (stage === 'login') break;

    const exactSelect = page.locator('#selectNetBank >> visible=true');
    const bankSelect = (await exactSelect.count()) > 0
      ? exactSelect.first()
      : page.locator('select >> visible=true').first();

    const payNow = page.locator('input[value*="pay now" i] >> visible=true')
      .or(page.locator('button:has-text("Pay Now") >> visible=true'))
      .or(page.locator('a:has-text("Pay Now") >> visible=true'))
      .first();

    const oldDropdown = await bankSelect.elementHandle();
    const pageMoved = async (): Promise<boolean> => {
      if (!oldDropdown) return true;
      const end = Date.now() + 45000;
      while (Date.now() < end) {
        try {
          const gone = await oldDropdown.evaluate(
            el => !el.isConnected || el.getClientRects().length === 0 || !!document.querySelector('#textfield2')
          );
          if (gone) return true;
        } catch {
          return true; // the page navigated, so the old element no longer exists
        }
        await page.waitForTimeout(500);
      }
      return false;
    };

    // Up to 3 tries per page: select 470 -> wait -> check it is STILL 470 -> Pay Now once
    let moved = false;
    for (let attempt = 1; attempt <= 3 && !moved; attempt++) {
      await bankSelect.selectOption('470', { timeout: 10000 });
      await page.waitForTimeout(1200); // give the page time to finish reacting to the choice

      const value = await bankSelect.inputValue().catch(() => '');
      if (value !== '470') {
        console.log(`\n [Net Banking] Bank got reset to "${value}" (try ${attempt}) - selecting again.\n`);
        continue;
      }

      await expect(payNow).toBeVisible({ timeout: 10000 });
      await payNow.click();
      moved = await pageMoved();
      if (!moved) {
        console.log(`\n [Net Banking] Page did not change after Pay Now (try ${attempt}) - trying again.\n`);
      }
    }
    if (!moved) {
      throw new Error(
        `Net Banking: Pay Now did not take us to the next page after 3 tries.\nURL: ${page.url()}\n` +
        `Selected bank value: ${await bankSelect.inputValue().catch(() => '?')}`
      );
    }
  }

  const username = page.locator('#textfield2 >> visible=true')
    .or(page.locator('input[type="text"] >> visible=true'))
    .first();
  await expect(username).toBeVisible({ timeout: 20000 });
  await username.fill('test');

  const password = page.locator('#textfield3 >> visible=true')
    .or(page.locator('input[type="password"] >> visible=true'))
    .first();
  await expect(password).toBeVisible({ timeout: 10000 });
  await password.fill('test');
  console.log('\n [Net Banking] Entered test / test on the bank login page.\n');

  // Submit (a button or an input, only the visible one)
  const submitBtn = () => page.locator('input[value*="submit" i] >> visible=true')
    .or(page.locator('button:has-text("Submit") >> visible=true'))
    .or(page.locator('a:has-text("Submit") >> visible=true'))
    .first();

  await expect(submitBtn()).toBeVisible({ timeout: 10000 });
  await submitBtn().click();

  // The recording clicked Submit a second time, so do the same if it appears
  const hasSecondSubmit = await submitBtn()
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (hasSecondSubmit) {
    await submitBtn().click().catch(() => {});
  }

  // ---- Final check: 'Payment completed' message OR back on the Ezit site ----
  const paymentCompleted = page.getByText(/Payment completed/i).first();
  const backOnEzit = page.waitForURL(/^https:\/\/(dev1-fe|app)\.ezit\.club/i, { timeout: 30000 });
  await Promise.any([
    paymentCompleted.waitFor({ state: 'visible', timeout: 30000 }),
    backOnEzit,
  ]);
}
