import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  // Setup browser context for tests
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to the app and set up initial state
  if (baseURL) {
    await page.goto(baseURL);
    
    // Set up default theme state for consistent testing
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
  }
  
  await browser.close();
}

export default globalSetup;
