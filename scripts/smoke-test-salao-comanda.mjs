import { chromium } from "playwright";

const BASE = "http://localhost:3700";
let ok = 0;
let fail = 0;

function check(label, cond) {
  if (cond) {
    console.log(`PASS - ${label}`);
    ok++;
  } else {
    console.log(`FAIL - ${label}`);
    fail++;
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();

// login
await page.goto(`${BASE}/login`);
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "123456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });

// teste 1: salao mostra 12 mesas livres e resumo zerado
const mesasLivres = await page.locator("text=Livre").count();
const resumoOcupadas = await page.locator("text=0 / 12").isVisible();
check("teste1: salao mostra 12 mesas livres e 0/12 ocupadas", mesasLivres === 12 && resumoOcupadas);

// teste 2: abrir mesa 1 cria comanda e navega pra tela da comanda
await page.locator('form:has(input[value="1"]) button[type="submit"]').first().click();
await page.waitForURL(`${BASE}/mesa/1`, { timeout: 10000 });
const tituloMesa = await page.locator("text=Mesa 01 - R$ 0,00").isVisible();
check("teste2: abrir mesa 1 -> comanda vazia com total R$ 0,00", tituloMesa);

// teste 3: lancar produto duas vezes soma quantidade
await page.locator('button:has-text("Espetos")').click();
await page.locator('button:has-text("Espeto de Picanha")').click();
await page.waitForLoadState("networkidle");
await page.locator('button:has-text("Espeto de Picanha")').click();
await page.waitForLoadState("networkidle");
const totalDoisItens = await page.locator("text=Mesa 01 - R$ 36,00").isVisible();
const quantidadeDois = await page.locator("li", { hasText: "Espeto de Picanha" }).locator("text=2").first().isVisible();
check("teste3: lancar 2x o mesmo produto soma quantidade (R$ 36,00)", totalDoisItens && quantidadeDois);

// teste 4: botao + aumenta quantidade
await page.locator("li", { hasText: "Espeto de Picanha" }).locator('button:has-text("+")').click();
await page.waitForLoadState("networkidle");
const totalTresItens = await page.locator("text=Mesa 01 - R$ 54,00").isVisible();
check("teste4: botao + aumenta quantidade (R$ 54,00)", totalTresItens);

// teste 5: observacao persiste apos reload (F5)
await page.locator("li", { hasText: "Espeto de Picanha" }).locator('input[name="observacao"]').fill("Sem cebola");
await page.locator("li", { hasText: "Espeto de Picanha" }).locator('button:has-text("Salvar")').click();
await page.waitForLoadState("networkidle");
await page.reload();
await page.waitForLoadState("networkidle");
const observacaoPersistida = await page.locator('input[value="Sem cebola"]').isVisible();
check("teste5: observacao persiste apos F5", observacaoPersistida);

// teste 6: botao - diminui quantidade ate remover o item quando chega a 0
await page.locator("li", { hasText: "Espeto de Picanha" }).locator('button:has-text("−")').click();
await page.waitForLoadState("networkidle");
await page.locator("li", { hasText: "Espeto de Picanha" }).locator('button:has-text("−")').click();
await page.waitForLoadState("networkidle");
await page.locator("li", { hasText: "Espeto de Picanha" }).locator('button:has-text("−")').click();
await page.waitForLoadState("networkidle");
const semItens = await page.locator("text=Nenhum item lançado ainda.").isVisible();
const totalZerado = await page.locator("text=Mesa 01 - R$ 0,00").isVisible();
check("teste6: diminuir ate 0 remove o item (comanda volta a R$ 0,00)", semItens && totalZerado);

// teste 7: voltar pro salao mostra mesa 1 ocupada (comanda existe, mesmo vazia)
await page.locator('a:has-text("Salão")').click();
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
const mesaOcupada = await page.locator("text=Mesa 01").locator("..").locator("text=Ocupada").isVisible().catch(() => false);
check("teste7: mesa 1 aparece Ocupada no salao apos abrir", mesaOcupada || (await page.locator("text=Ocupada").count()) === 1);

// teste 8: clicar de novo na mesa ocupada NAO cria segunda comanda (RPC idempotente)
await page.locator('a[href="/mesa/1"]').click();
await page.waitForURL(`${BASE}/mesa/1`, { timeout: 10000 });
await page.locator('button:has-text("Hambúrgueres")').click();
await page.locator('button:has-text("Vulcan Burger")').click();
await page.waitForLoadState("networkidle");
const totalBurger = await page.locator("text=Mesa 01 - R$ 32,00").isVisible();
check("teste8: reabrir mesa ocupada nao duplica comanda (item soma no total certo)", totalBurger);

await browser.close();

console.log(`\n${ok} passaram, ${fail} falharam`);
process.exit(fail > 0 ? 1 : 0);
