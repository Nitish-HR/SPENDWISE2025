import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard with expenses list', async ({ page }) => {
    // Check if dashboard title is visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Check if expense list section exists
    const expenseSection = page.locator('text=Total Expenses').or(page.locator('[class*="ExpenseList"]'));
    await expect(expenseSection.first()).toBeVisible();
  });

  test('should navigate to add expense page and submit form', async ({ page }) => {
    // Click on "Add Expense" link in navbar or button
    const addExpenseLink = page.getByRole('link', { name: /add expense/i });
    await addExpenseLink.click();

    // Wait for add expense page to load
    await page.waitForURL('**/expenses/add');
    await expect(page.getByRole('heading', { name: /add expense/i })).toBeVisible();

    // Fill in the form
    await page.fill('input[type="number"]', '25.50');
    await page.selectOption('select', 'Food');
    await page.fill('textarea', 'Test expense from e2e');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard (with timeout for API call)
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify we're back on dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should display newly added expense in the list', async ({ page }) => {
    // First, add an expense
    const addExpenseLink = page.getByRole('link', { name: /add expense/i });
    await addExpenseLink.click();
    await page.waitForURL('**/expenses/add');

    const testAmount = '30.75';
    const testCategory = 'Transport';
    const testDescription = 'E2E Test Expense';

    await page.fill('input[type="number"]', testAmount);
    await page.selectOption('select', testCategory);
    await page.fill('textarea', testDescription);
    
    // Submit and wait for redirect
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check if the expense appears - look for category or amount
    // The expense list should contain the category or amount we just added
    const categoryText = page.getByText(testCategory, { exact: false });
    const amountText = page.getByText('$30.75').or(page.getByText('30.75'));
    
    // At least one should be visible
    await expect(categoryText.or(amountText).first()).toBeVisible({ timeout: 5000 });
  });
});

