import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3700";
const PREVIEWS = "previews";

async function preencherQtd(page, nomeProduto, qtd) {
  await page
    .locator("span", { hasText: nomeProduto })
    .locator("xpath=following-sibling::input")
    .first()
    .fill(String(qtd));
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

await page.goto(`${BASE}/login`);
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "123456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });

await page.goto(`${BASE}/entregas/nova`);
await page.fill('input[name="cliente_nome"]', "João Silva");
await page.fill('input[name="endereco"]', "Rua das Flores, 25");
await preencherQtd(page, "Vulcan Burger", 1);
await page.selectOption('select[name="forma_pagamento_id"]', { label: "Dinheiro" });
await page.click('button:has-text("Criar entrega")');
await page.waitForURL(/\/entregas\?numero=\d+$/, { timeout: 10000 });
const numeroJoao = new URL(page.url()).searchParams.get("numero");

await page.goto(`${BASE}/entregas/nova`);
await page.fill('input[name="cliente_nome"]', "Maria Souza");
await page.fill('input[name="endereco"]', "Av. Principal, 120");
await preencherQtd(page, "Espeto de Picanha", 2);
await page.selectOption('select[name="forma_pagamento_id"]', { label: "Cartão" });
await page.click('button:has-text("Criar entrega")');
await page.waitForURL(/\/entregas\?numero=\d+$/, { timeout: 10000 });

await page.goto(`${BASE}/entregas/nova`);
await page.fill('input[name="cliente_nome"]', "Carlos Lima");
await page.fill('input[name="endereco"]', "Rua do Sol, 78");
await preencherQtd(page, "Cheese Bacon", 1);
await page.selectOption('select[name="forma_pagamento_id"]', { label: "Pix" });
await page.click('button:has-text("Criar entrega")');
await page.waitForURL(/\/entregas\?numero=\d+$/, { timeout: 10000 });

// marca a primeira como em rota
await page.goto(`${BASE}/entregas?numero=${numeroJoao}`);
await page.locator('form[action="/api/entregas/status"] button:has-text("Em rota")').click();
await page.waitForURL(new RegExp(`numero=${numeroJoao}$`), { timeout: 10000 });

await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${PREVIEWS}/20-entregas-duas-colunas.png` });

await browser.close();
console.log("ok");
