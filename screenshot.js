const puppeteer = require('puppeteer');
const path = require('path');

const BASE = 'file:///Users/vanibhardwaj/Desktop/RideFlux/frontend';
const OUT = '/Users/vanibhardwaj/.gemini/antigravity/brain/68606fda-28c4-44ad-9353-1e4479954b48';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function screenshot(page, name) {
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`✅ Saved ${name}.png`);
}

async function loginAs(page, email, password) {
  await page.goto(`${BASE}/login.html`);
  await page.waitForSelector('#email');
  await page.type('#email', email);
  await page.type('#password', password);
  await page.click('button[type="submit"]');
  await sleep(2500);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Landing
  await page.goto(`${BASE}/index.html`);
  await screenshot(page, '1_landing');

  // 2. Login
  await page.goto(`${BASE}/login.html`);
  await screenshot(page, '2_login');

  // 3. Register
  await page.goto(`${BASE}/register.html`);
  await screenshot(page, '3_register');

  // 4. Passenger Dashboard
  await loginAs(page, 'passenger@test.com', 'password123');
  await screenshot(page, '4_passenger_dashboard');

  // 5. Cab Driver Dashboard
  await loginAs(page, 'driver@test.com', 'password123');
  await screenshot(page, '5_cab_dashboard');

  // 6. Bus Driver Dashboard
  await loginAs(page, 'bus@test.com', 'password123');
  await screenshot(page, '6_bus_dashboard');

  await browser.close();
  console.log('All screenshots done!');
})();
