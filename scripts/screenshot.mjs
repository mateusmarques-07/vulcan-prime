import { chromium } from "playwright";

const [, , path = "screenshot.png", url = "http://localhost:3700/login"] = process.argv;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

if (url.includes("/login")) {
  await page.goto(url);
} else {
  await page.goto("http://localhost:3700/login");
  await page.fill("#usuario", "matheus.marques");
  await page.fill("#senha", "123456");
  await page.click('button[type="submit"]');
  await page.waitForURL("http://localhost:3700/", { timeout: 10000 });
  if (url !== "http://localhost:3700/") {
    await page.goto(url);
  }
}

await page.waitForTimeout(500);
await page.screenshot({ path });
await browser.close();
