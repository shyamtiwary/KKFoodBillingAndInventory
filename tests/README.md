# Automated Testing Guide for KK Food Billing

This guide explains how to run automated tests for the web application without needing developer assistance.

## Prerequisites

1. **Backend must be running** on `http://localhost:5000`
2. **Node.js and npm** must be installed
3. **Admin account** must exist with credentials: `admin` / `admin123`

## Quick Start

### Run All Tests

```bash
npm test
```

This will:
- Start the development server automatically
- Run all test suites
- Generate a test report
- Show results in the terminal

### Run Tests with UI (Recommended for Beginners)

```bash
npm run test:ui
```

This opens an interactive UI where you can:
- See all available tests
- Run individual tests
- Watch tests execute in real-time
- Debug failed tests

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:headed
```

This runs tests with a visible browser window so you can see what's happening.

### Debug Tests

```bash
npm run test:debug
```

Opens Playwright Inspector for step-by-step debugging.

### View Test Report

```bash
npm run test:report
```

Opens the HTML test report in your browser.

## Test Suites

### 1. Authentication Tests (`auth.spec.ts`)

Tests login, logout, and authentication flows.

**Run only auth tests:**
```bash
npx playwright test auth
```

**Tests included:**
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Logout functionality
- ✅ Protected route access

---

### 2. User Management Tests (`user-management.spec.ts`)

Tests all user management features in Settings.

**Run only user management tests:**
```bash
npx playwright test user-management
```

**Tests included:**
- ✅ Display user management section
- ✅ Add new user
- ✅ Approve user
- ✅ Disapprove user
- ✅ Enable user
- ✅ Disable user
- ✅ Delete user
- ✅ Prevent duplicate email
- ✅ Validate required fields

---

### 3. Inventory Tests (`inventory.spec.ts`)

Tests product/inventory management features.

**Run only inventory tests:**
```bash
npx playwright test inventory
```

**Tests included:**
- ✅ Display inventory page
- ✅ Add new product
- ✅ Edit existing product
- ✅ Delete product
- ✅ Filter products by category
- ✅ Search products
- ✅ Show low stock warning

---

## Running Specific Tests

### Run a single test file
```bash
npx playwright test user-management.spec.ts
```

### Run a specific test by name
```bash
npx playwright test -g "should add a new user successfully"
```

### Run tests in a specific browser
```bash
npx playwright test --project=chromium
```

## Understanding Test Results

### ✅ Passed Tests
- Green checkmark indicates the test passed
- Feature is working as expected

### ❌ Failed Tests
- Red X indicates the test failed
- Check the error message and screenshot
- Screenshots are saved in `test-results/` folder

### ⏭️ Skipped Tests
- Test was not run
- Usually due to test configuration

## Test Reports

After running tests, a detailed HTML report is generated:

```bash
npm run test:report
```

The report includes:
- Test execution timeline
- Screenshots of failures
- Video recordings (for failed tests)
- Detailed error messages
- Test duration

## Troubleshooting

### Backend Not Running

**Error:** `Connection refused` or `ECONNREFUSED`

**Solution:**
1. Start the backend server first
2. Ensure it's running on `http://localhost:5000`
3. Then run tests

### Port Already in Use

**Error:** `Port 5173 is already in use`

**Solution:**
1. Stop any running dev servers
2. Or set `reuseExistingServer: true` in `playwright.config.ts`

### Tests Timing Out

**Error:** `Test timeout of 30000ms exceeded`

**Solution:**
1. Increase timeout in test file
2. Check if backend is responding slowly
3. Ensure database is not locked

### Admin User Not Found

**Error:** `Invalid email or password`

**Solution:**
1. Ensure admin user exists in database
2. Check credentials are `admin` / `admin123`
3. Run backend seeding script if needed

## Best Practices

### Before Running Tests

1. ✅ Start the backend server
2. ✅ Ensure database is in a clean state
3. ✅ Close other browser windows to avoid conflicts

### After Running Tests

1. ✅ Review test report for failures
2. ✅ Check screenshots for visual issues
3. ✅ Clean up test data if needed

### When Tests Fail

1. ✅ Check the error message
2. ✅ Look at the screenshot
3. ✅ Watch the video recording
4. ✅ Run the test in headed mode to see what's happening
5. ✅ Use debug mode to step through the test

## Continuous Testing

### Watch Mode (Re-run on Changes)

While developing, you can run tests in watch mode:

```bash
npx playwright test --watch
```

This will re-run tests automatically when files change.

### Run Tests Before Deployment

Always run the full test suite before deploying:

```bash
npm test
```

Ensure all tests pass before pushing to production.

## Advanced Usage

### Run Tests in Parallel

```bash
npx playwright test --workers=4
```

### Run Tests with Custom Config

```bash
npx playwright test --config=playwright.custom.config.ts
```

### Generate Test Code

Playwright can generate test code by recording your actions:

```bash
npx playwright codegen http://localhost:5173
```

## Test Coverage

Current test coverage:

| Feature | Tests | Status |
|---------|-------|--------|
| Authentication | 4 | ✅ Complete |
| User Management | 8 | ✅ Complete |
| Inventory | 7 | ✅ Complete |
| Billing | 0 | ⏳ Pending |
| Customers | 0 | ⏳ Pending |
| Dashboard | 0 | ⏳ Pending |

## Adding New Tests

To add new tests, create a new file in the `tests/` folder:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test.describe('My New Feature Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login('admin', 'admin123');
  });

  test('should do something', async ({ page }) => {
    // Your test code here
  });
});
```

## Support

If you encounter issues:

1. Check this README for troubleshooting steps
2. Review the test report for detailed error information
3. Run tests in debug mode to investigate
4. Check browser console for JavaScript errors

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:ui` | Run with interactive UI |
| `npm run test:headed` | Run with visible browser |
| `npm run test:debug` | Debug tests step-by-step |
| `npm run test:report` | View test report |
| `npx playwright test auth` | Run only auth tests |
| `npx playwright test user-management` | Run only user tests |
| `npx playwright test inventory` | Run only inventory tests |

---

**Happy Testing! 🎉**
