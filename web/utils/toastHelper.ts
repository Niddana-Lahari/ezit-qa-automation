import { expect, type Page } from '@playwright/test';

export async function expectAlert(page: Page, message: RegExp | string): Promise<void> {
  await expect(page.getByRole('alert').filter({ hasText: message })).toBeVisible();
}
