import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test.describe('User Management Tests', () => {
    let helpers: TestHelpers;
    let testUserEmail: string;

    test.beforeEach(async ({ page }) => {
        helpers = new TestHelpers(page);
        await helpers.login('admin', 'admin@123#');
        await helpers.navigateTo('Settings');

        // Wait for user management section to load
        await page.waitForSelector('text=User Management', { timeout: 10000 });
    });

    test('should display user management section for admin', async ({ page }) => {
        await expect(page.locator('text=User Management')).toBeVisible();
        await expect(page.locator('button:has-text("Add User")')).toBeVisible();
    });

    test('should add a new user successfully', async ({ page }) => {
        // Generate unique user data
        testUserEmail = helpers.generateRandomEmail();
        const testUserName = helpers.generateRandomName();

        // Click Add User button
        await helpers.clickButton('Add User');
        await helpers.waitForDialog('Add New User');

        // Fill in user details
        await page.fill('input[id="name"]', testUserName);
        await page.fill('input[id="email"]', testUserEmail);
        await page.fill('input[id="password"]', 'test123');

        // Select role
        await page.click('label:has-text("Role") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Staff")');

        // Select access type
        await page.click('label:has-text("Access Type") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Web")');

        // Submit form using dialog button to avoid ambiguity
        await helpers.clickDialogButton('Add User');

        // Wait for success toast
        await helpers.waitForToast('User added successfully');

        // Wait for dialog to close
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        // Verify user appears in the table
        const isUserInTable = await helpers.isInTable(testUserEmail);
        expect(isUserInTable).toBeTruthy();

        // Verify user details in table
        await expect(page.locator(`tr:has-text("${testUserEmail}")`)).toContainText(testUserName);
        await expect(page.locator(`tr:has-text("${testUserEmail}")`)).toContainText('staff');
    });

    test('should approve a user', async ({ page }) => {
        // First, add a user that needs approval
        testUserEmail = helpers.generateRandomEmail();
        const testUserName = helpers.generateRandomName();

        await helpers.clickButton('Add User');
        await helpers.waitForDialog('Add New User');

        await page.fill('input[id="name"]', testUserName);
        await page.fill('input[id="email"]', testUserEmail);
        await page.fill('input[id="password"]', 'test123');

        await page.click('label:has-text("Role") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Staff")');

        await page.click('label:has-text("Access Type") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Web")');

        await helpers.clickDialogButton('Add User');
        await helpers.waitForToast('User added successfully');
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        // Find the user row and click approve button (checkmark icon)
        const userRow = page.locator(`tr:has-text("${testUserEmail}")`);

        // Check if user is already approved
        const approvedBadge = userRow.locator('text=Approved');
        const isApproved = await approvedBadge.isVisible();

        if (!isApproved) {
            // Click approve button (green checkmark)
            await userRow.locator('button[title="Approve"]').click();
            await helpers.waitForToast('User approved');

            // Verify approval status changed
            await expect(userRow.locator('text=Approved')).toBeVisible();
        }
    });

    test('should disable a user', async ({ page }) => {
        // Use existing test user or create one
        testUserEmail = helpers.generateRandomEmail();
        const testUserName = helpers.generateRandomName();

        await helpers.clickButton('Add User');
        await helpers.waitForDialog('Add New User');

        await page.fill('input[id="name"]', testUserName);
        await page.fill('input[id="email"]', testUserEmail);
        await page.fill('input[id="password"]', 'test123');

        await page.click('label:has-text("Role") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Staff")');

        await page.click('label:has-text("Access Type") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Web")');

        await helpers.clickDialogButton('Add User');
        await helpers.waitForToast('User added successfully');
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        // Find the user row and click disable button
        const userRow = page.locator(`tr:has-text("${testUserEmail}")`);

        // Click disable button (shield off icon)
        await userRow.locator('button[title="Disable User"]').click();
        await helpers.waitForToast('User disabled');

        // Verify status changed to disabled
        await expect(userRow.locator('text=Disabled')).toBeVisible();
    });

    test('should enable a disabled user', async ({ page }) => {
        // First create and disable a user
        testUserEmail = helpers.generateRandomEmail();
        const testUserName = helpers.generateRandomName();

        await helpers.clickButton('Add User');
        await helpers.waitForDialog('Add New User');

        await page.fill('input[id="name"]', testUserName);
        await page.fill('input[id="email"]', testUserEmail);
        await page.fill('input[id="password"]', 'test123');

        await page.click('label:has-text("Role") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Staff")');

        await page.click('label:has-text("Access Type") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Web")');

        await helpers.clickDialogButton('Add User');
        await helpers.waitForToast('User added successfully');
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        const userRow = page.locator(`tr:has-text("${testUserEmail}")`);

        // Disable the user first
        await userRow.locator('button[title="Disable User"]').click();
        await helpers.waitForToast('User disabled');

        // Now enable the user
        await userRow.locator('button[title="Enable User"]').click();
        await helpers.waitForToast('User enabled');

        // Verify status changed to active
        await expect(userRow.locator('text=Active')).toBeVisible();
    });

    test('should delete a user', async ({ page }) => {
        // Create a user to delete
        testUserEmail = helpers.generateRandomEmail();
        const testUserName = helpers.generateRandomName();

        await helpers.clickButton('Add User');
        await helpers.waitForDialog('Add New User');

        await page.fill('input[id="name"]', testUserName);
        await page.fill('input[id="email"]', testUserEmail);
        await page.fill('input[id="password"]', 'test123');

        await page.click('label:has-text("Role") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Staff")');

        await page.click('label:has-text("Access Type") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Web")');

        await helpers.clickDialogButton('Add User');
        await helpers.waitForToast('User added successfully');
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        // Get initial user count
        const initialCount = await helpers.getTableRowCount('table tbody tr');

        // Find the user row and click delete button
        const userRow = page.locator(`tr:has-text("${testUserEmail}")`);

        // Handle confirmation dialog
        page.on('dialog', dialog => dialog.accept());

        // Click delete button (trash icon)
        await userRow.locator('button[title="Delete"]').click();

        // Wait for success toast
        await helpers.waitForToast('User deleted');

        // Verify user is removed from table
        const finalCount = await helpers.getTableRowCount('table tbody tr');
        expect(finalCount).toBe(initialCount - 1);

        // Verify user is not in table anymore
        const isUserInTable = await helpers.isInTable(testUserEmail);
        expect(isUserInTable).toBeFalsy();
    });

    test('should not allow adding user with duplicate email', async ({ page }) => {
        const duplicateEmail = helpers.generateRandomEmail();
        const userName = 'Duplicate User';

        // Add first user
        await helpers.clickButton('Add User');
        await helpers.waitForDialog('Add New User');

        await page.fill('input[id="name"]', userName);
        await page.fill('input[id="email"]', duplicateEmail);
        await page.fill('input[id="password"]', 'test123');

        await page.click('label:has-text("Role") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Staff")');

        await page.click('label:has-text("Access Type") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Web")');

        await helpers.clickDialogButton('Add User');
        await helpers.waitForToast('User added successfully');
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        // Try to add second user with same email
        await helpers.clickButton('Add User');
        await helpers.waitForDialog('Add New User');

        await page.fill('input[id="name"]', 'Another User');
        await page.fill('input[id="email"]', duplicateEmail);
        await page.fill('input[id="password"]', 'test123');

        await page.click('label:has-text("Role") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Manager")');

        await page.click('label:has-text("Access Type") ~ button');
        await page.waitForSelector('[role="option"]', { state: 'visible' });
        await page.click('[role="option"]:has-text("Web")');

        await helpers.clickDialogButton('Add User');

        // Should show error toast
        await helpers.waitForToast('Failed to add user');
    });

    test('should validate required fields when adding user', async ({ page }) => {
        await helpers.clickButton('Add User');
        await helpers.waitForDialog('Add New User');

        // Try to submit without filling fields
        await helpers.clickDialogButton('Add User');

        // Should show validation error toast
        await helpers.waitForToast('Please fill in all required fields');

        // Dialog should still be open
        await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
});
