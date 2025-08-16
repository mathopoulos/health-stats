import { test, expect } from '@playwright/test';

test.describe('Simple Theme Toggle Test', () => {
  test('should toggle theme in a simple HTML page', async ({ page }) => {
    // Create a simple HTML page with theme toggle functionality
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              background: var(--bg, white); 
              color: var(--text, black); 
              transition: all 0.3s;
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            body.dark { 
              --bg: #1a1a1a; 
              --text: white; 
            }
            body.light { 
              --bg: white; 
              --text: black; 
            }
            button {
              padding: 10px 20px;
              margin: 20px;
              cursor: pointer;
              border: none;
              border-radius: 4px;
              background: #007bff;
              color: white;
            }
            button:hover {
              background: #0056b3;
            }
            .status {
              margin: 20px 0;
              padding: 10px;
              border-radius: 4px;
              background: #f8f9fa;
            }
          </style>
        </head>
        <body class="light">
          <h1>Theme Toggle Test</h1>
          <div class="status" id="status">Current theme: light</div>
          <button id="theme-toggle" aria-label="Toggle theme">Toggle Theme</button>
          <script>
            const button = document.getElementById('theme-toggle');
            const body = document.body;
            const status = document.getElementById('status');
            
            function updateStatus() {
              const currentTheme = body.classList.contains('dark') ? 'dark' : 'light';
              status.textContent = 'Current theme: ' + currentTheme;
              status.style.background = currentTheme === 'dark' ? '#343a40' : '#f8f9fa';
              status.style.color = currentTheme === 'dark' ? 'white' : 'black';
            }
            
            button.addEventListener('click', () => {
              if (body.classList.contains('light')) {
                body.classList.remove('light');
                body.classList.add('dark');
                localStorage.setItem('theme', 'dark');
              } else {
                body.classList.remove('dark');
                body.classList.add('light');
                localStorage.setItem('theme', 'light');
              }
              updateStatus();
            });
            
            // Initialize theme from localStorage
            const savedTheme = localStorage.getItem('theme') || 'light';
            body.classList.remove('light', 'dark');
            body.classList.add(savedTheme);
            updateStatus();
          </script>
        </body>
      </html>
    `);

    // Get initial theme state
    const initialTheme = await page.evaluate(() => localStorage.getItem('theme'));
    const initialHtmlClass = await page.evaluate(() => document.body.className);
    
    console.log('Initial theme:', initialTheme);
    console.log('Initial HTML class:', initialHtmlClass);

    // Find and click theme toggle button
    const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
    await expect(themeToggle).toBeVisible();

    // Click the theme toggle button
    await themeToggle.click();

    // Wait for theme change
    await page.waitForTimeout(500);

    // Check that theme has changed
    const newTheme = await page.evaluate(() => localStorage.getItem('theme'));
    const newHtmlClass = await page.evaluate(() => document.body.className);
    
    console.log('New theme:', newTheme);
    console.log('New HTML class:', newHtmlClass);

    // Verify theme toggle worked
    expect(newTheme).not.toBe(initialTheme);
    expect(newHtmlClass).not.toBe(initialHtmlClass);

    // Toggle back
    await themeToggle.click();
    await page.waitForTimeout(500);

    const finalTheme = await page.evaluate(() => localStorage.getItem('theme'));
    const finalHtmlClass = await page.evaluate(() => document.body.className);

    // Verify we're back to original state
    expect(finalTheme).toBe(initialTheme);
    expect(finalHtmlClass).toBe(initialHtmlClass);
    
    console.log('✅ Theme toggle test completed successfully!');
  });
});
