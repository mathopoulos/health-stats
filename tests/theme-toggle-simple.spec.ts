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
              } else {
                body.classList.remove('dark');
                body.classList.add('light');
              }
              updateStatus();
            });
            
            // Initialize theme
            updateStatus();
          </script>
        </body>
      </html>
    `);

    // Get initial theme state
    const initialHtmlClass = await page.evaluate(() => document.body.className);
    const initialStatus = await page.evaluate(() => document.getElementById('status').textContent);
    
    console.log('Initial HTML class:', initialHtmlClass);
    console.log('Initial status:', initialStatus);

    // Find and click theme toggle button
    const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
    await expect(themeToggle).toBeVisible();

    // Click the theme toggle button
    await themeToggle.click();

    // Wait for theme change
    await page.waitForTimeout(500);

    // Check that theme has changed
    const newHtmlClass = await page.evaluate(() => document.body.className);
    const newStatus = await page.evaluate(() => document.getElementById('status').textContent);
    
    console.log('New HTML class:', newHtmlClass);
    console.log('New status:', newStatus);

    // Verify theme toggle worked
    expect(newHtmlClass).not.toBe(initialHtmlClass);
    expect(newStatus).not.toBe(initialStatus);
    expect(newHtmlClass).toContain('dark');
    expect(newStatus).toContain('dark');

    // Toggle back
    await themeToggle.click();
    await page.waitForTimeout(500);

    const finalHtmlClass = await page.evaluate(() => document.body.className);
    const finalStatus = await page.evaluate(() => document.getElementById('status').textContent);

    // Verify we're back to original state
    expect(finalHtmlClass).toBe(initialHtmlClass);
    expect(finalStatus).toBe(initialStatus);
    expect(finalHtmlClass).toContain('light');
    expect(finalStatus).toContain('light');
    
    console.log('✅ Theme toggle test completed successfully!');
  });
});
