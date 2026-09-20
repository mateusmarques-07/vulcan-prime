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
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

await page.goto(`${BASE}/login`);
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "123456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${PREVIEWS}/13-salao-11mesas-balcao.png` });

// ---------- Nova Entrega (formulario preenchido) ----------
await page.goto(`${BASE}/entregas/nova`);
await page.fill('input[name="cliente_nome"]', "João");
await page.fill('input[name="endereco"]', "Rua das Flores, 25");
await preencherQtd(page, "Vulcan Burger", 1);
await preencherQtd(page, "Batata Frita", 1);
await page.selectOption('select[name="forma_pagamento_id"]', { label: "Pix" });
await page.waitForTimeout(150);
await page.screenshot({ path: `${PREVIEWS}/14-nova-entrega.png` });
await page.click('button:has-text("Criar entrega")');
await page.waitForURL(/\/entregas\/\d+$/, { timeout: 10000 });
const numeroJoao = page.url().split("/").pop();

// segunda entrega simultanea
await page.goto(`${BASE}/entregas/nova`);
await page.fill('input[name="cliente_nome"]', "Maria");
await page.fill('input[name="endereco"]', "Quadra 10, Casa 15");
await preencherQtd(page, "Espeto de Picanha", 2);
await page.selectOption('select[name="forma_pagamento_id"]', { label: "Cartão" });
await page.fill('input[name="taxa_entrega"]', "8");
await page.click('button:has-text("Criar entrega")');
await page.waitForURL(/\/entregas\/\d+$/, { timeout: 10000 });
const numeroMaria = page.url().split("/").pop();

// Joao vai pra Em Rota
await page.goto(`${BASE}/entregas/${numeroJoao}`);
await page.click('button:has-text("Marcar como Em Rota")');
await page.waitForURL(`${BASE}/entregas/${numeroJoao}`, { timeout: 10000 });

// ---------- Lista de ativas com as duas ao mesmo tempo ----------
await page.goto(`${BASE}/entregas`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${PREVIEWS}/15-entregas-ativas.png` });

// ---------- Detalhe de uma entrega ----------
await page.goto(`${BASE}/entregas/${numeroJoao}`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${PREVIEWS}/16-entrega-detalhe.png` });

// ---------- Finaliza a Maria, mostra historico ----------
await page.goto(`${BASE}/entregas/${numeroMaria}`);
await page.click('button:has-text("Finalizar (pagamento confirmado)")');
await page.waitForURL(`${BASE}/entregas/${numeroMaria}`, { timeout: 10000 });
await page.goto(`${BASE}/entregas/historico`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${PREVIEWS}/17-entregas-historico.png` });

// ---------- Recebimentos com filtro por tipo ----------
await page.goto(`${BASE}/recebimentos`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${PREVIEWS}/18-recebimentos-filtro-tipo.png` });

await browser.close();
console.log("screenshots ok:", numeroJoao, numeroMaria);
