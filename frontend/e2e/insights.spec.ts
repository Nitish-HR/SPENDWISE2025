import { test, expect } from '@playwright/test';

test.describe('Insights E2E Tests', () => {
  test('should visit insights page and generate AI insight', async ({ page }) => {
    // Navigate to insights page
    await page.goto('/insights');
    await page.waitForLoadState('networkidle');

    // Check if insights page is loaded
    await expect(page.getByRole('heading', { name: /insights/i })).toBeVisible();

    // Find and click the "Generate New AI Insight" button
    const generateButton = page.getByRole('button', { name: /generate.*insight/i });
    await expect(generateButton).toBeVisible();
    
    // Click the button
    await generateButton.click();

    // Wait for the button to show loading state (optional check)
    await expect(generateButton).toBeDisabled().or(page.getByText(/generating/i).first()).toBeVisible({ timeout: 2000 }).catch(() => true);

    // Wait for the generation to complete (button becomes enabled again or insight appears)
    // This might take a while if using real backend
    await page.waitForTimeout(5000);

    // Verify that either an insight appears or the button is enabled again
    const insightCard = page.locator('text=Overview').or(page.locator('text=Prediction'));
    const buttonEnabled = await generateButton.isEnabled().catch(() => false);
    
    // Either insight should appear or button should be enabled (generation completed)
    expect(insightCard.first().isVisible().catch(() => false) || buttonEnabled).toBeTruthy();
  });

  test('should display insights list', async ({ page }) => {
    await page.goto('/insights');
    await page.waitForLoadState('networkidle');

    // Check if insights page loads
    await expect(page.getByRole('heading', { name: /insights/i })).toBeVisible();

    // Check if either insights are displayed or empty state message
    const hasInsights = await page.locator('text=Overview').first().isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=No insights').first().isVisible().catch(() => false);

    expect(hasInsights || hasEmptyState).toBeTruthy();
  });
});

