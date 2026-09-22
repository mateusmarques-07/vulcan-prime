// Testa a correcao da corrida "mesa vazia libera sozinha" (21/09/2026):
// agora so libera automatico se a comanda esta vazia HA MAIS DE 60s.
// Usa mesas 7, 8 e 11, que estavam livres antes deste teste (nao mexe nas
// mesas 1/2/3/5, que tinham comanda aberta de teste do Mateus).
import { chromium } from "playwright";
import pg from "pg";

const BASE = process.env.BASE_URL || "http://localhost:3700";
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

async function abrirMesaGrid(page, numero) {
  await page.locator(`form:has(input[value="${numero}"]) button[type="submit"]`).first().click();
  await page.waitForURL(`${BASE}/mesa/${numero}`, { timeout: 10000 });
}

async function preencherValorForma(page, nomeExato, valor) {
  await page
    .locator("span", { hasText: nomeExato })
    .locator("xpath=following-sibling::input")
    .first()
    .fill(valor);
}

const db = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await db.connect();

async function comandaAbertaDaMesa(numero) {
  const res = await db.query(
    `select c.id, c.aberta_em, m.status from comandas c
     join mesas m on m.id = c.mesa_id
     where m.numero = $1 and c.status = 'aberta'`,
    [numero]
  );
  return res.rows[0] ?? null;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(`${BASE}/login`);
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "123456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
check("login ok", await page.locator("text=Mesas ocupadas").first().isVisible());

// ---------- TESTE A: fluxo normal continua funcionando (abrir -> lancar -> fechar -> pagar -> livre) ----------
await abrirMesaGrid(page, "7");
await page.locator("nav >> text=Espetos na Brasa").click();
await page.locator('button:has-text("Denver Prime")').click();
await page.waitForURL((u) => u.pathname === "/mesa/7", { timeout: 10000 });
await page.waitForLoadState("networkidle");
check("A: lançar produto na mesa 7 funciona normal", await page.locator("text=Mesa 07 - R$ 39,00").first().isVisible());

await page.click('button:has-text("Fechar conta")');
await page.waitForURL(`${BASE}/mesa/7/fechamento`, { timeout: 10000 });
await preencherValorForma(page, "Dinheiro", "39");
await page.waitForTimeout(200);
await page.click('button:has-text("Confirmar pagamento")');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
const mesa7Depois = await comandaAbertaDaMesa(7);
check("A: mesa 7 volta pra Livre depois do pagamento (fluxo normal intacto)", mesa7Depois === null);

// ---------- TESTE B: mesa aberta vazia NAO some mesmo com varios reloads do Salao dentro da folga ----------
await abrirMesaGrid(page, "8");
const comanda8Antes = await comandaAbertaDaMesa(8);
check("B: abrir mesa 8 cria comanda vazia", comanda8Antes !== null && comanda8Antes.status === "ocupada");

// simula o Salao recarregando varias vezes rapido (o gatilho real seria
// tempo real disparado por outra mesa) enquanto o garcom ainda nao lancou
// o primeiro item - isso e exatamente o que apagava a mesa antes da folga
for (let i = 0; i < 4; i++) {
  await page.goto(`${BASE}/`);
  await page.waitForTimeout(150);
}
const comanda8DepoisReloads = await comandaAbertaDaMesa(8);
check(
  "B: mesa 8 continua aberta depois de 4 reloads do Salão dentro da folga de 60s",
  comanda8DepoisReloads !== null && comanda8DepoisReloads.id === comanda8Antes.id
);

// garcom (chegando atrasado por causa dos reloads acima) consegue lançar o
// primeiro item normalmente, sem ter sido expulso da tela
await page.goto(`${BASE}/mesa/8`);
await page.locator("nav >> text=Espetos na Brasa").click();
await page.locator('button:has-text("Denver Prime")').click();
await page.waitForURL((u) => u.pathname === "/mesa/8", { timeout: 10000 });
await page.waitForLoadState("networkidle");
check("B: consegue lançar item na mesa 8 depois dos reloads (não foi expulso)", await page.locator("text=Mesa 08 - R$ 39,00").first().isVisible());

// ---------- TESTE C: mesa esquecida de verdade (aberta ha mais de 60s, sem item) ainda libera sozinha ----------
await page.goto(`${BASE}/`);
await abrirMesaGrid(page, "11");
const comanda11 = await comandaAbertaDaMesa(11);
check("C: abrir mesa 11 cria comanda vazia", comanda11 !== null);
// em vez de esperar 60s de verdade, adianta o relogio da comanda pra
// simular "aberta ha 2 minutos" - mesmo efeito de esperar, sem gastar tempo
await db.query(`update comandas set aberta_em = now() - interval '2 minutes' where id = $1`, [comanda11.id]);

await page.goto(`${BASE}/`);
await page.waitForTimeout(200);
const comanda11Depois = await comandaAbertaDaMesa(11);
check("C: mesa 11 esquecida (>60s, sem item) libera sozinha normalmente", comanda11Depois === null);
const statusMesa11 = await db.query(`select status from mesas where numero = 11`);
check("C: mesa 11 volta pro status Livre", statusMesa11.rows[0].status === "livre");

// ---------- limpeza da mesa 8 (deixada aberta de propósito pro teste B) ----------
await page.goto(`${BASE}/mesa/8`);
await page.click('button:has-text("Fechar conta")');
await page.waitForURL(`${BASE}/mesa/8/fechamento`, { timeout: 10000 });
await preencherValorForma(page, "Dinheiro", "39");
await page.waitForTimeout(200);
await page.click('button:has-text("Confirmar pagamento")');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
const mesa8Final = await comandaAbertaDaMesa(8);
check("limpeza: mesa 8 fechada e livre ao final do teste", mesa8Final === null);

await db.end();
await browser.close();

console.log(`\n${ok} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
