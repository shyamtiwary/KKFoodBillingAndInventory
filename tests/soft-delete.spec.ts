import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test.describe('Soft Delete Functionality', () => {
    let helpers: TestHelpers;

    test.beforeEach(async ({ page }) => {
        helpers = new TestHelpers(page);
        await helpers.login('admin', 'admin@123#');
    });

    test('Soft delete product', async ({ page }) => {
        // 1. Navigate to Inventory
        await helpers.navigateTo('Inventory');
        await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

        // 2. Add a new product
        const uniqueId = Date.now().toString();
        const productName = `Soft Delete Product ${uniqueId}`;
        const productSku = `SD-${uniqueId}`;

        await helpers.clickButton('Add Product');
        await helpers.waitForDialog('Add New Product');

        await page.fill('input#name', productName);
        await page.fill('input#sku', productSku);
        await page.fill('input#category', 'Test Category');
        await page.fill('input#costprice', '10');
        await page.fill('input#stock', '100');
        await page.fill('input#sellprice', '20');
        await page.fill('input#lowStockThreshold', '10');

        await helpers.clickDialogButton('Add Product');
        await helpers.waitForToast('Product added successfully');
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        await expect(page.locator(`text=${productName}`)).toBeVisible();

        // 3. Delete the product
        const row = page.locator('tr', { hasText: productName });
        await row.locator('button[title="Delete Product"]').click();

        await helpers.waitForDialog('Confirm Deletion');
        await helpers.clickDialogButton('Delete');
        await helpers.waitForToast('Product deleted successfully');

        // 4. Verify it's gone from default view
        await expect(page.locator(`text=${productName}`)).toBeHidden();

        // 5. Toggle "Show Deleted"
        await page.click('label[for="show-deleted"]');

        // 6. Verify it reappears with "Deleted" status
        await expect(page.locator(`text=${productName}`)).toBeVisible();
        const deletedRow = page.locator('tr', { hasText: productName });
        await expect(deletedRow).toHaveClass(/opacity-50/);
        await expect(deletedRow.locator('text=Deleted')).toBeVisible();
    });

    test('Soft delete user', async ({ page }) => {
        // 1. Navigate to Settings
        await helpers.navigateTo('Settings');
        await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

        // 2. Add a new user
        const uniqueId = Date.now().toString();
        const userName = `Delete Test User ${uniqueId}`;
        const userEmail = helpers.generateRandomEmail();

        await helpers.clickButton('Add User');
        await helpers.waitForDialog('Add New User');

        await page.fill('input#name', userName);
        await page.fill('input#email', userEmail);
        await page.fill('input#password', 'password123');

        await helpers.clickDialogButton('Add User');
        await helpers.waitForToast('User added successfully');
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        await expect(page.locator(`text=${userEmail}`)).toBeVisible();

        // 3. Delete the user
        const row = page.locator('tr', { hasText: userEmail });

        // Setup dialog handler BEFORE clicking delete
        page.on('dialog', dialog => dialog.accept());

        await row.locator('button[title="Delete"]').click();

        // Wait for deletion to complete
        await helpers.waitForToast('User deleted');
        await expect(page.locator(`text=${userEmail}`)).toBeHidden();

        // 4. Toggle "Show Deleted"
        await page.click('label[for="show-deleted-users"]');

        // 5. Verify it reappears with "Deleted" status
        await expect(page.locator(`text=${userEmail}`)).toBeVisible();
        const deletedRow = page.locator('tr', { hasText: userEmail });
        await expect(deletedRow).toHaveClass(/opacity-50/);
        await expect(deletedRow.locator('text=Deleted')).toBeVisible();
    });
});
