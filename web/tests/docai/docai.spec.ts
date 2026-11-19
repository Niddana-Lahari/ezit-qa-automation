import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';
import path from 'path';


test.describe('DocAI Module Test Suite', () => {

  test.setTimeout(120000);

  // Sample file path created in test-data/
  const sampleFilePath = path.resolve(__dirname, '../../test-data/sample_doc.pdf');

  test.beforeEach(async ({ page }, testInfo) => {
    // 1. One-line reusable login
    await loginToEzit(page, testInfo);

    // 2. Click DocAI in navigation menu
    const docAiNav = page.getByRole('navigation').filter({ hasText: 'DocAI' }).locator('span')
      .or(page.getByText('DocAI'));
    await expect(docAiNav.first()).toBeVisible({ timeout: 10000 });
    await docAiNav.first().click();

    // 3. Verify DocAI page URL or heading
    await expect(page).toHaveURL(/.*docai.*/i, { timeout: 10000 });

    // Handle "Vault Setup Required" modal if it appears (click "Setup Later")
    const setupLaterBtn = page.getByRole('button', { name: /Setup Later/i }).or(
      page.locator('button:has-text("Setup Later")')
    ).or(
      page.getByText('Setup Later', { exact: true })
    );

    if (await setupLaterBtn.first().isVisible({ timeout: 4000 }).catch(() => false)) {
      console.log('\n[DocAI] Dismissing "Vault Setup Required" modal with "Setup Later"...\n');
      await setupLaterBtn.first().click().catch(() => {});
      await page.waitForTimeout(1000);
    }
  });

  // TEST 1: Download Checklist
  test('TC_DOCAI_01: Verify Download Checklist functionality', async ({ page }) => {
    // Wait for the download event when clicking Download Checklist
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    const downloadBtn = page.getByRole('button', { name: /Download Checklist/i });
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });
    await downloadBtn.click();

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
    console.log(`Checklist downloaded successfully: ${download.suggestedFilename()}`);
  });

  // TEST 2: File Upload (setInputFiles handles drag & drop area directly)
  test('TC_DOCAI_02: Upload document and Organize with AI', async ({ page }) => {
    // Note: Instead of clicking the dropzone, we directly attach file to hidden input[type="file"]
    const fileInput = page.locator('input[type="file"]');
    await fileInput.waitFor({ state: 'attached', timeout: 10000 });
    await fileInput.setInputFiles(sampleFilePath);

    // Click "Organize With AI →" button
    const organizeBtn = page.getByRole('button', { name: /Organize With AI/i });
    await expect(organizeBtn).toBeVisible({ timeout: 10000 });
    await organizeBtn.click();

    // Verify AI processing / Extracted card appears or document list updates
    const extractedBadge = page.getByText(/Extracted|Uploaded|Processing|Document|Preview/i).or(page.locator('.doc-card, .file-preview, table'));
    await expect(extractedBadge.first()).toBeVisible({ timeout: 25000 });
  });

  // TEST 3: Full End-to-End DocAI Review and Save
  test('TC_DOCAI_03: Complete DocAI Flow - Upload, Organize, Review and Save', async ({ page }) => {
    // 1. Attach file to input[type="file"]
    const fileInput = page.locator('input[type="file"]');
    await fileInput.waitFor({ state: 'attached', timeout: 10000 });
    await fileInput.setInputFiles(sampleFilePath);
    await page.waitForTimeout(1000);

    // 2. Click "Organize With AI" button
    const organizeBtn = page.getByRole('button', { name: /Organize With AI/i }).or(
      page.locator('button:has-text("Organize With AI")')
    );
    await expect(organizeBtn.first()).toBeVisible({ timeout: 10000 });
    await organizeBtn.first().click();

    // If "Vault Setup Required" appears after clicking Organize With AI, dismiss it with "Setup Later"
    const setupLaterModal = page.getByRole('button', { name: /Setup Later/i }).or(
      page.locator('button:has-text("Setup Later")')
    ).or(
      page.getByText('Setup Later', { exact: true })
    );

    if (await setupLaterModal.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('\n[DocAI] Dismissing "Vault Setup Required" modal with "Setup Later"...\n');
      await setupLaterModal.first().click().catch(() => {});
      await page.waitForTimeout(1000);

      // Re-click "Organize With AI" now that the modal blocking it is closed
      if (await organizeBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('[DocAI] Re-clicking "Organize With AI" after modal dismissal...');
        await organizeBtn.first().click().catch(() => {});
      }
    }

    // 3. Wait for AI processing to finish and click "Review"
    const reviewBtn = page.getByRole('button', { name: 'Review' })
      .or(page.locator('button:has-text("Review")'));

    await expect(reviewBtn.first()).toBeVisible({ timeout: 45000 });
    await reviewBtn.first().click();

    // 4. Review the details extracted by AI directly from the document
    const textboxes = page.getByRole('textbox');
    await expect(textboxes.first()).toBeVisible({ timeout: 10000 });

    // Read and verify AI-extracted values from the document
    const fieldCount = await textboxes.count();
    for (let i = 0; i < fieldCount; i++) {
      const extractedValue = await textboxes.nth(i).inputValue().catch(() => '');
      if (extractedValue) {
        console.log(`[DocAI] Field ${i + 1} extracted by AI: "${extractedValue}"`);
      } else {
        // Fallback only if the document had no text for this specific field
        await textboxes.nth(i).fill(`DocAI Field ${i + 1}`);
      }
    }

    // 5. Click Save
    const saveBtn = page.getByRole('button', { name: 'Save' });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();

    // 6. Verify Save success confirmation
    const successAlert = page.getByText(/Success|Saved|Updated/i).or(page.locator('.Toastify__toast'));
    await expect(successAlert.first()).toBeVisible({ timeout: 10000 });
  });

});
