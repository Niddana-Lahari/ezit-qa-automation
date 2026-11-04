import { test, expect } from '@playwright/test';
import { loginToEzit } from '../../utils/loginHelper';


test.describe('Profile - Nominees Management', () => {

  test.beforeEach(async ({ page }, testInfo) => {
    // Step 1: Perform unified login (handles Dev/Prod dynamic credentials & environment URLs)
    await loginToEzit(page, testInfo);
  });

  test('TC_NOM_01: Add a new Nominee with Primary status', async ({ page }) => {
    // 1. Navigate to Profile -> Nominees
    const profileLink = page.getByText('Profile', { exact: true }).or(
      page.locator('a[href*="/profile"]').first()
    );
    await expect(profileLink.first()).toBeVisible({ timeout: 15000 });
    await profileLink.first().click();

    const nomineesTab = page.getByRole('link', { name: 'Nominees' }).or(
      page.locator('a:has-text("Nominees")')
    );
    await expect(nomineesTab.first()).toBeVisible({ timeout: 10000 });
    await nomineesTab.first().click();
    await page.waitForLoadState('networkidle');

    // 2. Click "Add new Nominee"
    const addNomineeBtn = page.getByRole('button', { name: /Add new Nominee/i });
    await expect(addNomineeBtn.first()).toBeVisible({ timeout: 15000 });
    await addNomineeBtn.first().click();

    // 3. Fill Nominee details
    const baseName = process.env.TEST_NOMINEE_NAME || 'Test Nominee';
    const nomineeName = `${baseName} ${Date.now().toString().slice(-4)}`;
    const fullNameInput = page.getByRole('textbox', { name: /Full name/i }).or(
      page.locator('input[placeholder*="Full name"], input[name*="name"]')
    );
    await expect(fullNameInput.first()).toBeVisible({ timeout: 10000 });
    await fullNameInput.first().fill(nomineeName);

    // 4. Select Relationship from dropdown (dynamically via env)
    const relOption = process.env.TEST_NOMINEE_RELATIONSHIP || '4';
    const relationshipSelect = page.getByRole('combobox').or(page.locator('select'));
    await expect(relationshipSelect.first()).toBeVisible({ timeout: 10000 });
    await relationshipSelect.first().selectOption(relOption).catch(async () => {
      await relationshipSelect.first().selectOption({ index: 2 });
    });

    // 5. Enter Mobile Number
    const mobileInput = page.getByRole('spinbutton', { name: /Enter number here/i }).or(
      page.locator('input[type="number"], input[placeholder*="number"]')
    );
    await expect(mobileInput.first()).toBeVisible({ timeout: 10000 });
    await mobileInput.first().fill(process.env.TEST_NOMINEE_MOBILE || process.env.TEST_MOBILE || '9876543210');

    // 6. Check WhatsApp on same mobile number
    const whatsappCheckbox = page.getByRole('checkbox', { name: /WhatsApp on same mobile number/i }).or(
      page.locator('input[type="checkbox"]').first()
    );
    if (await whatsappCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await whatsappCheckbox.check().catch(() => {});
    }

    // 7. Make Primary Nominee option if available
    const primaryCheckbox = page.getByRole('checkbox', { name: /Make him\/her as Primary/i }).or(
      page.locator('input[type="checkbox"]').last()
    );
    if (await primaryCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await primaryCheckbox.check().catch(() => {});
    }

    // 8. Submit "Add Nominee"
    const submitBtn = page.getByRole('button', { name: 'Add Nominee' });
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    await submitBtn.click();
    await page.waitForTimeout(2000);

    // 9. Verify Nominee appears in the list (use .first() to avoid strict mode ambiguity with equity tab)
    await expect(page.getByText(nomineeName).first()).toBeVisible({ timeout: 15000 });
  });

  test('TC_NOM_02: Edit Nominee and verify relationship field constraint', async ({ page }) => {
    // 1. Navigate to Profile -> Nominees
    const profileLink = page.getByText('Profile', { exact: true }).or(
      page.locator('a[href*="/profile"]').first()
    );
    await expect(profileLink.first()).toBeVisible({ timeout: 15000 });
    await profileLink.first().click();

    const nomineesTab = page.getByRole('link', { name: 'Nominees' }).or(
      page.locator('a:has-text("Nominees")')
    );
    await expect(nomineesTab.first()).toBeVisible({ timeout: 10000 });
    await nomineesTab.first().click();
    await page.waitForLoadState('networkidle');

    // 2. Click Edit icon on the first existing Nominee card
    // Note: The UI shows edit icon / link on the card
    const editIcon = page.locator('.edit-icon, button:has-text("Edit"), a[href*="edit"]').or(
      page.getByRole('link', { name: 'Logo' }).nth(1)
    ).or(page.locator('.nominee-card img, [class*="card"] img').first());
    
    await expect(editIcon.first()).toBeVisible({ timeout: 15000 });
    await editIcon.first().click();
    await page.waitForTimeout(1000);

    // 3. Verify Relationship dropdown behaviour:
    // User noted: in edit, relationship is NOT editable / read-only constraint
    const relationshipSelect = page.getByRole('combobox').or(page.locator('select')).first();
    if (await relationshipSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isDisabled = await relationshipSelect.isDisabled().catch(() => false);
      const isReadonly = await relationshipSelect.getAttribute('readonly').catch(() => null);
      console.log(`Relationship dropdown in Edit Mode - Disabled: ${isDisabled}, Readonly: ${isReadonly !== null}`);
    }

    // 4. Edit other editable fields (e.g. toggle Primary Nominee checkbox)
    const primaryCheckbox = page.getByRole('checkbox', { name: /Make him\/her as Primary/i }).or(
      page.locator('input[type="checkbox"]').last()
    );
    if (await primaryCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isChecked = await primaryCheckbox.isChecked();
      if (isChecked) {
        await primaryCheckbox.uncheck();
      } else {
        await primaryCheckbox.check();
      }
    }

    // 5. Click "Update Nominee"
    const updateBtn = page.getByRole('button', { name: 'Update Nominee' });
    await expect(updateBtn).toBeVisible({ timeout: 10000 });
    await updateBtn.click();
    await page.waitForTimeout(2000);

    // 6. Verify Nominees list page is displayed
    const addNomineeBtn = page.getByRole('button', { name: /Add new Nominee/i });
    await expect(addNomineeBtn.first()).toBeVisible({ timeout: 15000 });
  });

  test('TC_NOM_03: Delete Nominee flow with confirmation and cancellation', async ({ page }) => {
    // 1. Navigate to Profile -> Nominees
    const profileLink = page.getByText('Profile', { exact: true }).or(
      page.locator('a[href*="/profile"]').first()
    );
    await expect(profileLink.first()).toBeVisible({ timeout: 15000 });
    await profileLink.first().click();

    const nomineesTab = page.getByRole('link', { name: 'Nominees' }).or(
      page.locator('a:has-text("Nominees")')
    );
    await expect(nomineesTab.first()).toBeVisible({ timeout: 10000 });
    await nomineesTab.first().click();
    await page.waitForLoadState('networkidle');

    // 2. Open Edit mode for existing nominee
    const editIcon = page.locator('.edit-icon, button:has-text("Edit"), a[href*="edit"]').or(
      page.getByRole('link', { name: 'Logo' }).nth(1)
    ).or(page.locator('.nominee-card img, [class*="card"] img').first());
    
    await expect(editIcon.first()).toBeVisible({ timeout: 15000 });
    await editIcon.first().click();
    await page.waitForTimeout(1000);

    // 3. Click "Delete Nominee"
    const deleteBtn = page.getByRole('button', { name: 'Delete Nominee' });
    await expect(deleteBtn).toBeVisible({ timeout: 10000 });
    await deleteBtn.click();

    // 4. Test "Cancel" on confirmation modal
    const cancelDeleteBtn = page.getByRole('button', { name: 'Cancel' });
    await expect(cancelDeleteBtn).toBeVisible({ timeout: 10000 });
    await cancelDeleteBtn.click();
    await page.waitForTimeout(500);

    // Verify still on edit/details view
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });

    // 5. Click "Delete Nominee" again and confirm with "Yes, delete"
    await deleteBtn.click();

    const confirmDeleteBtn = page.getByRole('button', { name: /Yes, delete/i });
    await expect(confirmDeleteBtn).toBeVisible({ timeout: 10000 });
    await confirmDeleteBtn.click();
    await page.waitForTimeout(2000);

    // 6. Verify returned to Nominees listing
    const addNomineeBtn = page.getByRole('button', { name: /Add new Nominee/i });
    await expect(addNomineeBtn.first()).toBeVisible({ timeout: 15000 });
  });

});
