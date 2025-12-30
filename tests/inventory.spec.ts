import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test.describe('Inventory Management Tests', () => {
    let helpers: TestHelpers;

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        helpers = new TestHelpers(page);
        await helpers.login('admin', 'admin@123#');
        await helpers.navigateTo('Inventory');

        // Wait for inventory page to load
        await page.waitForSelector('h1:has-text("Inventory")', { timeout: 15000 });
    });

    test('should display inventory page', async ({ page }) => {
        await expect(page.locator('h1:has-text("Inventory")')).toBeVisible();
        await expect(page.locator('button:has-text("Add Product")')).toBeVisible();
    });

    test('should add a new product successfully', async ({ page }) => {
        const productName = `Test Product ${Date.now()}`;
        const sku = `SKU${Date.now()}`;

        await helpers.clickButton('Add Product');
        await helpers.waitForDialog('Add New Product');

        await page.fill('#name', productName);
        await page.fill('#sku', sku);
        await page.fill('#category', 'Food');
        await page.fill('#sellprice', '100');
        await page.fill('#costprice', '50');
        await page.fill('#stock', '25');
        await page.fill('#lowStockThreshold', '5');

        await helpers.clickDialogButton('Add Product');
        await helpers.waitForToast('Product added successfully', 10000);
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        const isProductInTable = await helpers.isInTable(productName);
        expect(isProductInTable).toBeTruthy();
    });

    test('should edit an existing product', async ({ page }) => {
        const originalName = `Original Product ${Date.now()}`;
        const updatedName = `Updated Product ${Date.now()}`;
        const sku = `SKU${Date.now()}`;

        await helpers.clickButton('Add Product');
        await helpers.waitForDialog('Add New Product');

        await page.fill('#name', originalName);
        await page.fill('#sku', sku);
        await page.fill('#category', 'Food');
        await page.fill('#sellprice', '100');
        await page.fill('#costprice', '50');
        await page.fill('#stock', '25');
        await page.fill('#lowStockThreshold', '5');

        await helpers.clickDialogButton('Add Product');
        await helpers.waitForToast('Product added successfully', 10000);
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        const productRow = page.locator(`tr:has-text("${originalName}")`);
        await productRow.locator('button[title="Edit Product"]').click();

        await helpers.waitForDialog('Edit Product');

        await page.fill('#edit-name', updatedName);
        await page.fill('#edit-price', '150');

        await helpers.clickDialogButton('Save Changes');
        await helpers.waitForToast('Product updated successfully', 10000);
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        const isUpdatedProductInTable = await helpers.isInTable(updatedName);
        expect(isUpdatedProductInTable).toBeTruthy();
    });

    test('should delete a product', async ({ page }) => {
        const productName = `Delete Me ${Date.now()}`;
        const sku = `SKU${Date.now()}`;

        await helpers.clickButton('Add Product');
        await helpers.waitForDialog('Add New Product');

        await page.fill('#name', productName);
        await page.fill('#sku', sku);
        await page.fill('#category', 'Food');
        await page.fill('#sellprice', '100');
        await page.fill('#costprice', '50');
        await page.fill('#stock', '25');
        await page.fill('#lowStockThreshold', '5');

        await helpers.clickDialogButton('Add Product');
        await helpers.waitForToast('Product added successfully', 10000);
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        const initialCount = await helpers.getTableRowCount('table tbody tr');
        const productRow = page.locator(`tr:has-text("${productName}")`);

        await productRow.locator('button[title="Delete Product"]').click();
        await helpers.waitForDialog('Confirm Deletion');
        await helpers.clickDialogButton('Delete');

        await helpers.waitForToast('Product deleted successfully', 10000);
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        const finalCount = await helpers.getTableRowCount('table tbody tr');
        expect(finalCount).toBe(initialCount - 1);
    });

    test('should filter products by category using search', async ({ page }) => {
        const categoryName = `Category${Date.now()}`;
        const foodProduct = `Food Item ${Date.now()}`;
        const beverageProduct = `Beverage Item ${Date.now()}`;

        // Add product in specific category
        await helpers.clickButton('Add Product');
        await helpers.waitForDialog('Add New Product');
        await page.fill('#name', foodProduct);
        await page.fill('#sku', `SKU${Date.now()}`);
        await page.fill('#category', categoryName);
        await page.fill('#sellprice', '100');
        await page.fill('#costprice', '50');
        await page.fill('#stock', '25');
        await page.fill('#lowStockThreshold', '5');
        await helpers.clickDialogButton('Add Product');
        await helpers.waitForToast('Product added successfully', 10000);
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        // Add another product in different category
        await helpers.clickButton('Add Product');
        await helpers.waitForDialog('Add New Product');
        await page.fill('#name', beverageProduct);
        await page.fill('#sku', `SKU${Date.now() + 1}`);
        await page.fill('#category', 'Other');
        await page.fill('#sellprice', '50');
        await page.fill('#costprice', '25');
        await page.fill('#stock', '30');
        await page.fill('#lowStockThreshold', '10');
        await helpers.clickDialogButton('Add Product');
        await helpers.waitForToast('Product added successfully', 10000);
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        // Search for the specific category
        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.fill(categoryName);
        await page.waitForTimeout(1000); // Wait for debounce

        // Verify food product is visible
        await expect(page.locator(`tr:has-text("${foodProduct}")`)).toBeVisible();
        // Verify beverage product is NOT visible
        await expect(page.locator(`tr:has-text("${beverageProduct}")`)).not.toBeVisible();
    });

    test('should search for products', async ({ page }) => {
        const searchTerm = `Searchable ${Date.now()}`;

        await helpers.clickButton('Add Product');
        await helpers.waitForDialog('Add New Product');
        await page.fill('#name', searchTerm);
        await page.fill('#sku', `SKU${Date.now()}`);
        await page.fill('#category', 'Food');
        await page.fill('#sellprice', '100');
        await page.fill('#costprice', '50');
        await page.fill('#stock', '25');
        await page.fill('#lowStockThreshold', '5');
        await helpers.clickDialogButton('Add Product');
        await helpers.waitForToast('Product added successfully', 10000);
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.fill(searchTerm);
        await page.waitForTimeout(1000); // Wait for debounce

        await expect(page.locator(`tr:has-text("${searchTerm}")`)).toBeVisible();
    });

    test('should show low stock warning', async ({ page }) => {
        const lowStockProduct = `Low Stock ${Date.now()}`;

        await helpers.clickButton('Add Product');
        await helpers.waitForDialog('Add New Product');
        await page.fill('#name', lowStockProduct);
        await page.fill('#sku', `SKU${Date.now()}`);
        await page.fill('#category', 'Food');
        await page.fill('#sellprice', '100');
        await page.fill('#costprice', '50');
        await page.fill('#stock', '3'); // Below threshold
        await page.fill('#lowStockThreshold', '5');
        await helpers.clickDialogButton('Add Product');
        await helpers.waitForToast('Product added successfully', 10000);
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        const productRow = page.locator(`tr:has-text("${lowStockProduct}")`);
        // Use exact text matching to avoid strict mode violation with product name
        await expect(productRow.getByText('Low Stock', { exact: true })).toBeVisible();
    });
});
