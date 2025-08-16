import { test, expect } from '@playwright/test';

test.describe('Theme Toggle Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to landing page before each test
    await page.goto('http://localhost:3000');
  });

  test('should toggle between light and dark themes', async ({ page }) => {
    // Get initial theme state
    const initialTheme = await page.evaluate(() => localStorage.getItem('theme'));
    const initialHtmlClass = await page.evaluate(() => document.documentElement.className);
    
    console.log('Initial theme:', initialTheme);
    console.log('Initial HTML class:', initialHtmlClass);

    // Find and click theme toggle button
    const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
    await expect(themeToggle).toBeVisible();
    
    // Click to toggle theme
    await themeToggle.click();
    
    // Wait for theme change to take effect
    await page.waitForTimeout(100);
    
    // Verify theme state changed
    const newTheme = await page.evaluate(() => localStorage.getItem('theme'));
    const newHtmlClass = await page.evaluate(() => document.documentElement.className);
    
    console.log('New theme:', newTheme);
    console.log('New HTML class:', newHtmlClass);
    
    // Assert theme actually changed
    expect(newTheme).not.toBe(initialTheme);
    expect(newHtmlClass).not.toBe(initialHtmlClass);
  });

  test('should persist theme across page reloads', async ({ page }) => {
    // Set theme to light mode
    await page.evaluate(() => localStorage.setItem('theme', 'light'));
    
    // Reload page
    await page.reload();
    
    // Verify theme persists
    const persistedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(persistedTheme).toBe('light');
    
    // Verify HTML class reflects the theme
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).not.toContain('dark');
  });

  test('should update CSS variables when theme changes', async ({ page }) => {
    // Get initial CSS variables
    const initialBackground = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
    );
    
    // Toggle theme
    const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
    await themeToggle.click();
    await page.waitForTimeout(100);
    
    // Get new CSS variables
    const newBackground = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
    );
    
    // Verify CSS variables changed
    expect(newBackground).not.toBe(initialBackground);
  });

  test('should maintain theme state during navigation', async ({ page }) => {
    // Set theme to dark mode
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard/userId=100492380040453908509');
    
    // Verify theme persists
    const persistedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(persistedTheme).toBe('dark');
    
    // Navigate back to landing page
    await page.goto('http://localhost:3000');
    
    // Verify theme still persists
    const finalTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(finalTheme).toBe('dark');
  });

  test('should handle theme toggle accessibility', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
    
    // Verify button is accessible
    await expect(themeToggle).toBeVisible();
    await expect(themeToggle).toBeEnabled();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(themeToggle).toBeFocused();
    
    // Test keyboard activation
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    
    // Verify theme changed via keyboard
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBeTruthy();
  });

  test('should not cause console errors during theme toggle', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Perform theme toggle
    const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
    await themeToggle.click();
    await page.waitForTimeout(100);
    
    // Verify no theme-related errors
    const themeErrors = consoleErrors.filter(error => 
      error.includes('theme') || error.includes('localStorage')
    );
    expect(themeErrors).toHaveLength(0);
  });

  test('should work correctly with multiple rapid toggles', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
    
    // Perform multiple rapid toggles
    for (let i = 0; i < 5; i++) {
      await themeToggle.click();
      await page.waitForTimeout(50);
    }
    
    // Verify final state is consistent
    const finalTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(finalTheme).toBeTruthy();
    
    // Verify HTML class is consistent
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toBeTruthy();
  });
});
