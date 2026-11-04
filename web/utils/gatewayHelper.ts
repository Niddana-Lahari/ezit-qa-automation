import { Page } from '@playwright/test';

export async function dismissOrCloseGateway(page: Page) {
  await page.waitForTimeout(1500);
  let clicked = false;

  for (const frame of page.frames()) {
    try {
      const closeCandidate = frame.locator(
        '[class*="close" i], [id*="close" i], [aria-label*="close" i], header svg, .header svg, [class*="header"] svg, .close, button.close, [class*="cross" i]'
      ).or(
        frame.locator('button, span, a, div, i, svg').filter({ hasText: /^(×|✕|X)$/i })
      ).first();

      if (await closeCandidate.isVisible({ timeout: 1500 }).catch(() => false)) {
        await closeCandidate.click({ force: true });
        console.log('\n [PROD Gateway] Successfully clicked close icon (✕) inside gateway iframe.\n');
        clicked = true;
        break;
      }
    } catch {}
  }

  // 2. Look for top-right close icon on visible gateway modal / container
  if (!clicked) {
    const modalClose = page.locator(
      '.modal.show button.btn-close, [role="dialog"] button.btn-close, .modal.show button.close, [role="dialog"] [aria-label*="close" i], button.btn-close'
    ).or(
      page.locator('button, span, a, div, i, svg').filter({ hasText: /^(×|✕|X)$/i })
    ).first();

    if (await modalClose.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modalClose.click({ force: true });
      console.log('\n [PROD Gateway] Successfully clicked close icon (✕) on modal.\n');
      clicked = true;
    }
  }

  // 3. Fallback: Click top-right coordinate of visible iframe
  if (!clicked) {
    const iframe = page.locator('iframe:visible').first();
    if (await iframe.isVisible({ timeout: 2000 }).catch(() => false)) {
      const box = await iframe.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width - 25, box.y + 25);
        console.log('\n [PROD Gateway] Clicked top-right coordinate of gateway iframe (X position).\n');
        clicked = true;
      }
    }
  }

  // 4. Fallback: Generic Close / Cancel button on page
  if (!clicked) {
    const closeOnPage = page.locator('dialog, .modal, [role="dialog"]').locator(
      'button:has-text("Close"), button:has-text("Cancel")'
    ).or(
      page.getByRole('button', { name: 'Close', exact: true })
    ).or(
      page.getByRole('button', { name: /Cancel/i })
    ).first();

    if (await closeOnPage.isVisible({ timeout: 2500 }).catch(() => false)) {
      await closeOnPage.click({ force: true });
      console.log('\n [PROD Gateway] Clicked Close button on page.\n');
      clicked = true;
    }
  }

  await page.waitForTimeout(1000);

  // 5. Handle cancellation confirmation popup ("Are you sure you want to cancel?" -> "Yes" / "OK" / "Confirm")
  const confirmBtn = page.getByRole('button', { name: /Yes|Confirm|Cancel Transaction|OK|Abort/i }).or(
    page.locator('button, a').filter({ hasText: /^(Yes|Confirm|Cancel Transaction|OK|Abort)$/i })
  ).or(
    page.frameLocator('iframe').getByRole('button', { name: /Yes|Confirm|Cancel Transaction|OK|Abort/i })
  ).or(
    page.frameLocator('iframe').locator('button, a').filter({ hasText: /^(Yes|Confirm|Cancel Transaction|OK|Abort)$/i })
  ).first();

  if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await confirmBtn.click({ force: true });
    console.log('\n [PROD Gateway] Confirmed cancellation modal.\n');
    await page.waitForTimeout(1000);
  }
}
