import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3700";
const PREVIEWS = "previews";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(`${BASE}/login`);
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "123456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });

await page.locator('form:has(input[value="11"]) button[type="submit"]').first().click();
await page.waitForURL(`${BASE}/mesa/11`, { timeout: 10000 });
await page.locator("nav >> text=Bebidas").click();
await page.locator('button:has-text("Água Mineral")').click();
await page.waitForURL((u) => u.pathname === "/mesa/11", { timeout: 10000 });
await page.locator('button:has-text("Refrigerante Lata")').click();
await page.waitForURL((u) => u.pathname === "/mesa/11", { timeout: 10000 });
await page.screenshot({ path: `${PREVIEWS}/12-balcao-comanda.png` });

await browser.close();
