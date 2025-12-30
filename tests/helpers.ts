import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for KK Food Billing application
 */

export class TestHelpers {
    constructor(private page: Page) { }

    /**
     * Login to the application
     */
    async login(email: string = 'admin', password: string = 'admin@123#') {
        await this.page.goto('/');

        // Wait for login page to load
        await this.page.waitForSelector('input[id="email"]', { timeout: 10000 });

        // Fill in credentials
        await this.page.fill('input[id="email"]', email);
        await this.page.fill('input[id="password"]', password);

        // Click login button
        await this.page.click('button[type="submit"]');

        // Wait for dashboard to load
        await this.page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });

        // Verify we're logged in
        await expect(this.page.locator('h1:has-text("Dashboard")')).toBeVisible();
    }

    /**
     * Navigate to a specific page
     */
    async navigateTo(pageName: 'Dashboard' | 'Inventory' | 'Bills' | 'Customers' | 'Settings') {
        // Use a more specific selector for sidebar links
        await this.page.click(`nav a:has-text("${pageName}")`);
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Wait for toast notification
     */
    async waitForToast(message?: string, timeout: number = 5000) {
        // Try to find either sonner or shadcn toast
        let toastLocator = this.page.locator('[data-sonner-toast], [role="status"], .toast');

        if (message) {
            toastLocator = toastLocator.filter({ hasText: message }).first();
        } else {
            toastLocator = toastLocator.first();
        }

        await toastLocator.waitFor({ state: 'visible', timeout });

        if (message) {
            await expect(toastLocator).toContainText(message);
        }

        return toastLocator;
    }

    /**
     * Fill form field by label
     */
    async fillFieldByLabel(label: string, value: string) {
        const field = this.page.locator(`label:has-text("${label}")`).locator('..').locator('input, textarea, select');
        await field.fill(value);
    }

    /**
     * Select dropdown option by label
     */
    async selectByLabel(label: string, value: string) {
        // Click the select trigger
        await this.page.click(`label:has-text("${label}") ~ button[role="combobox"]`);

        // Wait for dropdown to open
        await this.page.waitForSelector('[role="option"]', { state: 'visible' });

        // Click the option
        await this.page.click(`[role="option"]:has-text("${value}")`);
    }

    /**
     * Click button by text
     */
    async clickButton(text: string) {
        await this.page.click(`button:has-text("${text}")`);
    }

    /**
     * Click button inside a dialog by text
     */
    async clickDialogButton(text: string) {
        await this.page.click(`[role="dialog"] button:has-text("${text}")`);
    }

    /**
     * Wait for dialog to open
     */
    async waitForDialog(title?: string) {
        await this.page.waitForSelector('[role="dialog"]', { state: 'visible' });

        if (title) {
            await expect(this.page.locator('[role="dialog"]')).toContainText(title);
        }
    }

    /**
     * Close dialog
     */
    async closeDialog() {
        // Try clicking Cancel button first
        const cancelButton = this.page.locator('button:has-text("Cancel")');
        if (await cancelButton.isVisible()) {
            await cancelButton.click();
        } else {
            // Otherwise click the X button
            await this.page.click('[role="dialog"] button[aria-label="Close"]');
        }

        await this.page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    }

    /**
     * Get table row count
     */
    async getTableRowCount(tableSelector: string = 'table tbody tr') {
        const rows = await this.page.locator(tableSelector).count();
        return rows;
    }

    /**
     * Check if element exists in table and wait for it
     */
    async isInTable(text: string, tableSelector: string = 'table') {
        const table = this.page.locator(tableSelector);
        const cell = table.locator(`text="${text}"`);
        try {
            await cell.waitFor({ state: 'visible', timeout: 5000 });
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Take screenshot with name
     */
    async screenshot(name: string) {
        await this.page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: true });
    }

    /**
     * Wait for API response
     */
    async waitForApiResponse(urlPattern: string | RegExp, timeout: number = 10000) {
        return await this.page.waitForResponse(
            response => {
                const url = response.url();
                if (typeof urlPattern === 'string') {
                    return url.includes(urlPattern);
                }
                return urlPattern.test(url);
            },
            { timeout }
        );
    }

    /**
     * Generate random email
     */
    generateRandomEmail(): string {
        const timestamp = Date.now();
        return `test${timestamp}@example.com`;
    }

    /**
     * Generate random name
     */
    generateRandomName(): string {
        const names = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'];
        return names[Math.floor(Math.random() * names.length)] + ' ' + Date.now();
    }
}
