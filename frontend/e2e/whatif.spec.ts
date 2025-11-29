import { test, expect } from '@playwright/test';

test.describe('What-If Analysis E2E Tests', () => {
  test('should visit what-if page and submit scenario', async ({ page }) => {
    // Navigate to what-if page
    await page.goto('/what-if');
    await page.waitForLoadState('networkidle');

    // Check if what-if page is loaded
    await expect(page.getByRole('heading', { name: /what-if/i })).toBeVisible();

    // Select scenario type (category-change is default)
    const scenarioSelect = page.locator('select').first();
    await expect(scenarioSelect).toBeVisible();

    // Ensure category-change is selected (or select it)
    await scenarioSelect.selectOption('category-change');

    // Fill in category
    const categorySelect = page.locator('select').nth(1);
    await categorySelect.selectOption('Food');

    // Fill in percentage change
    const percentInput = page.locator('input[type="number"]').first();
    await percentInput.fill('-30');

    // Click "Run What-If Analysis" button
    const runButton = page.getByRole('button', { name: /run.*analysis/i });
    await expect(runButton).toBeVisible();
    await runButton.click();

    // Wait for analysis to complete (button shows loading then results appear)
    await page.waitForTimeout(3000);

    // Verify results appear
    const resultsSection = page.locator('text=Scenario Results').or(page.locator('text=Overview'));
    await expect(resultsSection.first()).toBeVisible({ timeout: 10000 });

    // Verify result structure
    await expect(page.locator('text=Overview').or(page.locator('text=Prediction')).first()).toBeVisible();
  });

  test('should handle income-change scenario', async ({ page }) => {
    await page.goto('/what-if');
    await page.waitForLoadState('networkidle');

    // Select income-change scenario
    const scenarioSelect = page.locator('select').first();
    await scenarioSelect.selectOption('income-change');

    // Fill in amount change
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('1000');

    // Submit
    const runButton = page.getByRole('button', { name: /run.*analysis/i });
    await runButton.click();

    // Wait for results
    await page.waitForTimeout(3000);
    const resultsSection = page.locator('text=Scenario Results');
    await expect(resultsSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle absolute scenario', async ({ page }) => {
    await page.goto('/what-if');
    await page.waitForLoadState('networkidle');

    // Select absolute scenario
    const scenarioSelect = page.locator('select').first();
    await scenarioSelect.selectOption('absolute');

    // Fill in amount change
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('-200');

    // Submit
    const runButton = page.getByRole('button', { name: /run.*analysis/i });
    await runButton.click();

    // Wait for results
    await page.waitForTimeout(3000);
    const resultsSection = page.locator('text=Scenario Results');
    await expect(resultsSection.first()).toBeVisible({ timeout: 10000 });
  });
});

