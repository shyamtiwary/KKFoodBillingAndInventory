import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test.describe('Authentication Tests', () => {
    let helpers: TestHelpers;

    test.beforeEach(async ({ page }) => {
        helpers = new TestHelpers(page);
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await page.goto('/');

        // Fill in credentials
        await page.fill('input[id="email"]', 'admin');
        await page.fill('input[id="password"]', 'admin@123#');

        // Click login button
        await page.click('button[type="submit"]');

        // Wait for dashboard to load
        await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });

        // Verify we're on the dashboard
        await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/');

        // Fill in invalid credentials
        await page.fill('input[id="email"]', 'invalid@test.com');
        await page.fill('input[id="password"]', 'wrongpassword');

        // Click login button
        await page.click('button[type="submit"]');

        // Wait for error message
        await page.waitForSelector('text=/Invalid|error/i', { timeout: 5000 });

        // Verify we're still on login page
        await expect(page.locator('input[id="email"]')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
        // Login first
        await helpers.login('admin', 'admin@123#');

        // Click logout button (usually in header or menu)
        const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
        if (await logoutButton.isVisible()) {
            await logoutButton.click();

            // Verify redirected to login page
            await page.waitForURL('**/login', { timeout: 5000 });
            await expect(page.locator('input[id="email"]')).toBeVisible();
        }
    });

    test('should require authentication for protected routes', async ({ page }) => {
        // Try to access inventory without logging in
        await page.goto('/inventory');

        // Should redirect to login page
        await page.waitForURL('**/login', { timeout: 5000 });
        await expect(page.locator('input[id="email"]')).toBeVisible();
    });
});
