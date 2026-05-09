const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3001...');
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded', timeout: 120000 });
    console.log('Title:', await page.title());
    
    // Check if hotel-hero-2.jpg is used in any img tag
    const imgSources = await page.$$eval('img', imgs => imgs.map(img => img.src));
    console.log('Images on home page:', imgSources);
    const hasHero2 = imgSources.some(src => src.includes('hotel-hero-2.jpg'));
    console.log('Has global background image (hotel-hero-2.jpg):', hasHero2);

    // Capture screenshot of landing page
    const artifactsDir = '/Users/asithalakmal/.gemini/antigravity/brain/4a8287cd-b5ce-46ae-978d-b75963165853/artifacts';
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
    const homeScreenshotPath = path.join(artifactsDir, 'home_backdrop.png');
    await page.screenshot({ path: homeScreenshotPath });
    console.log('Saved landing page screenshot to:', homeScreenshotPath);

  } catch (error) {
    console.error('Error on home page:', error);
  }

  console.log('\nNavigating to http://localhost:3001/dashboard...');
  try {
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'domcontentloaded', timeout: 120000 });
    console.log('Dashboard Title:', await page.title());
    
    // Check if the page is redirected (e.g., to signin page)
    const url = page.url();
    console.log('Current URL:', url);
    
    // Try to view the dashboard page's page source or check if it was checked
    // Since Next.js rendering on server includes the dashboard content initially
    // or since page contains our img layout, let's see.
    const content = await page.content();
    const hasHero1InDOM = content.includes('hotel-hero-1.jpg');
    console.log('Has dashboard background (hotel-hero-1.jpg) in current DOM:', hasHero1InDOM);

    const artifactsDir = '/Users/asithalakmal/.gemini/antigravity/brain/4a8287cd-b5ce-46ae-978d-b75963165853/artifacts';
    const dashboardScreenshotPath = path.join(artifactsDir, 'dashboard_page.png');
    await page.screenshot({ path: dashboardScreenshotPath });
    console.log('Saved dashboard/redirect page screenshot to:', dashboardScreenshotPath);

  } catch (error) {
    console.error('Error on dashboard page:', error);
  }

  await browser.close();
}

run();
