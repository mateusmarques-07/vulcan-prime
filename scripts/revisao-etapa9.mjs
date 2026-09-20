import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3700";
const PREVIEWS = "previews";
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

async function preencherValorForma(page, nomeExato, valor) {
  await page
    .locator("span", { hasText: nomeExato })
    .locator("xpath=following-sibling::input")
    .first()
    .fill(valor);
}

async function abrirMesaGrid(page, numero) {
  await page.locator(`form:has(input[value="${numero}"]) button[type="submit"]`).first().click();
  await page.waitForURL(`${BASE}/mesa/${numero}`, { timeout: 10000 });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// ---------- LOGIN ----------
await page.goto(`${BASE}/login`);
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "123456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
check("login: entra no Salão", await page.locator("text=Mesas ocupadas").first().isVisible());

// ---------- FLUXO MESA NORMAL: pagamento cobrindo o TOTAL (item + gorjeta) ----------
await abrirMesaGrid(page, "1");
await page.locator("nav >> text=Espetos").click();
await page.locator('button:has-text("Espeto de Picanha")').click();
await page.waitForURL((u) => u.pathname === "/mesa/1", { timeout: 10000 });
check("comanda: lançar produto (R$ 18,00)", await page.locator("text=Mesa 01 - R$ 18,00").first().isVisible());

await page.click('button:has-text("Fechar conta")');
await page.waitForURL(`${BASE}/mesa/1/fechamento`, { timeout: 10000 });
await page.locator('input[type="checkbox"]').check();
await page.locator('button:has-text("10%")').click();
await page.waitForTimeout(200);
check(
  "fechamento: total mostra 19,80 (18 + 10%)",
  await page.locator("text=R$ 19,80").first().isVisible()
);
check(
  "fechamento: não mostra mais campo de taxa de entrega (virou módulo próprio de Entregas)",
  !(await page.locator("text=Taxa de entrega").isVisible())
);

// paga parte no cartao (comida) e parte em dinheiro (gorjeta) - cenario que
// travava antes por comparar so com o subtotal
await preencherValorForma(page, "Cartão", "18");
await preencherValorForma(page, "Dinheiro", "1.80");
await page.waitForTimeout(200);
check(
  "fechamento: pagamento dividido (comida no cartão + gorjeta em dinheiro) fecha certo com o TOTAL",
  await page.locator("text=Valor cobrado confere com o total.").first().isVisible()
);
check("fechamento: botão confirmar habilitado", await page.locator('button:has-text("Confirmar pagamento")').isEnabled());

await page.screenshot({ path: `${PREVIEWS}/03-fechamento.png` });

// checa que o Salao ja mostra o total certo (com gorjeta) antes de confirmar
// o pagamento - precisa ter salvo via "fechar conta e imprimir recibo" antes
const [reciboPage] = await Promise.all([
  page.waitForEvent("popup"),
  page.locator('button:has-text("Fechar conta e imprimir recibo")').click(),
]);
await reciboPage.waitForLoadState("networkidle");
check(
  "recibo: mostra taxa de serviço e total corretos",
  (await reciboPage.locator("text=RECIBO NÃO FISCAL").isVisible()) &&
    (await reciboPage.locator("text=R$ 19,80").isVisible())
);
await reciboPage.close();

await page.goto(`${BASE}/`);
await page.waitForLoadState("networkidle");
check(
  "salao: card da mesa em Conta já mostra o total com gorjeta (R$ 19,80), não só o subtotal",
  await page.locator('a:has-text("Mesa 01")').locator("text=R$ 19,80").isVisible()
);

await page.goto(`${BASE}/mesa/1/fechamento`);
await page.waitForLoadState("networkidle");
await preencherValorForma(page, "Cartão", "18");
await preencherValorForma(page, "Dinheiro", "1.80");
await page.waitForTimeout(200);
await page.locator('button:has-text("Confirmar pagamento")').click();
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
check("fechamento: confirmar pagamento libera a mesa", await page.locator("text=0 / 12").first().isVisible());

// ---------- AUTO-SALVAMENTO (sem clicar em nada, sobrevive sair/voltar) ----------
await abrirMesaGrid(page, "2");
await page.locator("nav >> text=Bebidas").click();
await page.locator('button:has-text("Refrigerante Lata")').click();
await page.waitForURL((u) => u.pathname === "/mesa/2", { timeout: 10000 });
await page.click('button:has-text("Fechar conta")');
await page.waitForURL(`${BASE}/mesa/2/fechamento`, { timeout: 10000 });

await page.fill('input[type="number"][min="1"]', "4");
await page.locator('input[type="checkbox"]').check();
await page.locator('button:has-text("15%")').click();
await page.waitForTimeout(900); // espera o auto-save (debounce de 500ms)

await page.goto(`${BASE}/`);
await page.waitForLoadState("networkidle");
await page.goto(`${BASE}/mesa/2/fechamento`);
await page.waitForLoadState("networkidle");
check(
  "fechamento: gorjeta/pessoas salvam sozinhas, sem precisar clicar em nada",
  (await page.locator('input[type="checkbox"]').isChecked()) &&
    (await page.locator('input[type="number"][min="1"]').inputValue()) === "4" &&
    (await page.locator('button:has-text("15%")').getAttribute("class"))?.includes("bg-orange-600")
);

await preencherValorForma(page, "Pix", "6.90");
await page.waitForTimeout(200);
await page.locator('button:has-text("Confirmar pagamento")').click();
await page.waitForURL(`${BASE}/`, { timeout: 10000 });

// ---------- FORMATAÇÃO ,00 AO SAIR DO CAMPO ----------
await abrirMesaGrid(page, "3");
await page.locator("nav >> text=Espetos").click();
await page.locator('button:has-text("Espeto de Frango")').click();
await page.waitForURL((u) => u.pathname === "/mesa/3", { timeout: 10000 });
await page.click('button:has-text("Fechar conta")');
await page.waitForURL(`${BASE}/mesa/3/fechamento`, { timeout: 10000 });
const campoCartao = page.locator("span", { hasText: "Cartão" }).locator("xpath=following-sibling::input").first();
await campoCartao.fill("14");
await campoCartao.blur();
await page.waitForTimeout(150);
check("fechamento: campo de pagamento formata pra 14.00 ao sair do campo", (await campoCartao.inputValue()) === "14.00");
await page.locator('button:has-text("Cancelar e voltar pra comanda")').click();
await page.waitForURL(`${BASE}/mesa/3`, { timeout: 10000 });
await page.locator('button:has-text("Fechar conta")').click();
await page.waitForURL(`${BASE}/mesa/3/fechamento`, { timeout: 10000 });
await preencherValorForma(page, "Cartão", "14");
await page.waitForTimeout(200);
await page.locator('button:has-text("Confirmar pagamento")').click();
await page.waitForURL(`${BASE}/`, { timeout: 10000 });

// ---------- PRODUTOS: MoneyInput formata ,00 ----------
await page.goto(`${BASE}/produtos`);
await page.waitForLoadState("networkidle");
const campoPreco = page.locator('form[action="/api/produtos/criar"] input[name="preco"]');
await campoPreco.fill("15");
await campoPreco.blur();
await page.waitForTimeout(150);
check("produtos: campo de preço novo formata pra 15.00 ao sair do campo", (await campoPreco.inputValue()) === "15.00");

// ---------- BALCAO (RETIRADA) - agora mesa 12, sem campo de taxa de entrega ----------
await page.goto(`${BASE}/`);
await page.waitForLoadState("networkidle");
await page.locator('form:has(input[value="12"]) button[type="submit"]').first().click();
await page.waitForURL(`${BASE}/mesa/12`, { timeout: 10000 });
check(
  "balcão: comanda abre com rótulo Balcão (Retirada)",
  await page.locator("text=Balcão (Retirada) -").first().isVisible()
);
await page.locator("nav >> text=Bebidas").click();
await page.locator('button:has-text("Água Mineral")').click();
await page.waitForURL((u) => u.pathname === "/mesa/12", { timeout: 10000 });
await page.click('button:has-text("Fechar conta")');
await page.waitForURL(`${BASE}/mesa/12/fechamento`, { timeout: 10000 });
await preencherValorForma(page, "Pix", "4");
await page.waitForTimeout(200);
await page.locator('button:has-text("Confirmar pagamento")').click();
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
check("balcão: fecha e libera normalmente", await page.locator("text=0 / 12").first().isVisible());

// ---------- RECEBIMENTOS: mostra rótulo Balcão (Retirada) ----------
await page.goto(`${BASE}/recebimentos`);
await page.waitForLoadState("networkidle");
// obs: o locator precisa ficar restrito a "table" - o <select> do filtro de
// tipo tambem tem uma <option>"Balcão (Retirada)"</option> em texto, e um
// <option> de um select fechado nao conta como "visivel" pro Playwright,
// entao um locator solto acaba nessa opcao escondida em vez da tabela.
check(
  "recebimentos: mostra 'Balcão (Retirada)' na lista",
  await page.locator("table").locator("text=Balcão (Retirada)").first().isVisible()
);
await page.screenshot({ path: `${PREVIEWS}/05-recebimentos.png` });

await browser.close();

console.log(`\n${ok} passaram, ${fail} falharam`);
process.exit(fail > 0 ? 1 : 0);
