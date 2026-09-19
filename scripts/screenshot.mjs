import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://localhost:3700/login");
await page.waitForTimeout(500);
await page.screenshot({ path: process.argv[2] || "login.png" });
await browser.close();
