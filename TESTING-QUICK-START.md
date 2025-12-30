# 🚀 Quick Test Reference Card

## Start Testing in 3 Steps

### Option 1: Interactive UI (Easiest)
```bash
npm run test:ui
```
- Click on tests to run them
- See results in real-time
- Perfect for beginners

### Option 2: PowerShell Script (Recommended)
```bash
.\run-tests.ps1
```
- Interactive menu
- Checks if backend is running
- Easy to use

### Option 3: Command Line
```bash
npm test
```
- Runs all tests
- Shows results in terminal
- Good for quick checks

---

## Common Commands

| What you want to do | Command |
|---------------------|---------|
| Test everything | `npm test` |
| Test with UI | `npm run test:ui` |
| See browser | `npm run test:headed` |
| Test users | `npx playwright test user-management` |
| Test inventory | `npx playwright test inventory` |
| Test login | `npx playwright test auth` |
| View report | `npm run test:report` |
| Debug tests | `npm run test:debug` |

---

## Before Testing

✅ **Start backend server**
```bash
cd backend\KKFoodBilling.Backend
dotnet run
```

✅ **Ensure admin user exists**
- Email: `admin`
- Password: `admin123`

---

## Test Results

### ✅ Green = Passed
Feature works correctly!

### ❌ Red = Failed
1. Check error message
2. Look at screenshot in `test-results/`
3. Run in headed mode: `npm run test:headed`

### 📊 View Report
```bash
npm run test:report
```

---

## Need Help?

📖 **Full documentation:** `tests/README.md`

🐛 **Debug a test:**
```bash
npm run test:debug
```

👀 **Watch tests run:**
```bash
npm run test:headed
```

---

## Test Coverage

- ✅ Login/Logout
- ✅ User Management (Add, Edit, Delete, Approve, Disable)
- ✅ Inventory (Add, Edit, Delete, Search, Filter)
- ⏳ Billing (Coming soon)
- ⏳ Customers (Coming soon)

---

**Happy Testing! 🎉**

*Tests run automatically and give you instant feedback on what's working and what's not!*
