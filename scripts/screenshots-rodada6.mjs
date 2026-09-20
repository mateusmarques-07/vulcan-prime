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
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${PREVIEWS}/01-salao.png` });

// Entrega: abre, lanca item, vai pro fechamento com a taxa ja preenchida
await page.locator('form:has(input[value="12"]) button[type="submit"]').first().click();
await page.waitForURL(`${BASE}/mesa/12`, { timeout: 10000 });
await page.locator("nav >> text=Hambúrgueres").click();
await page.locator('button:has-text("Vulcan Burger")').click();
await page.waitForURL((u) => u.pathname === "/mesa/12", { timeout: 10000 });
await page.screenshot({ path: `${PREVIEWS}/10-entrega-comanda.png` });

await page.click('button:has-text("Fechar conta")');
await page.waitForURL(`${BASE}/mesa/12/fechamento`, { timeout: 10000 });
await page.screenshot({ path: `${PREVIEWS}/11-entrega-fechamento.png` });

// limpa a comanda de demonstracao que acabou de abrir (sem finalizar pagamento)
await browser.close();
