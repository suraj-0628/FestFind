import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) { process.exit(1); }

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  // Wait for Google Maps JS to update the URL with @lat,lng
  for (let i = 0; i < 30; i++) {
    const cur = page.url();
    if (/@(-?\d+\.?\d+),(-?\d+\.?\d+)/.test(cur)) {
      console.log(JSON.stringify({ url: cur }));
      process.exit(0);
    }
    await page.waitForTimeout(500);
  }
  // Fallback: try to get coords from page content
  const content = await page.content();
  const m = content.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (m) {
    console.log(JSON.stringify({ url: page.url(), lat: parseFloat(m[1]), lng: parseFloat(m[2]) }));
  } else {
    console.log(JSON.stringify({ url: page.url() }));
  }
} catch (e) {
  console.log(JSON.stringify({ url, error: e.message }));
} finally {
  await browser.close();
}
