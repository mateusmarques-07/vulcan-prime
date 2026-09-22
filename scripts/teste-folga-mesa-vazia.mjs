// Testa o comportamento sem folga (22/09/2026, pedido do Mateus - atendimento
// por comanda de papel, sem garçom no celular, então a folga de tempo não é
// mais necessária): mesa aberta sem item volta pra Livre assim que a tela do
// Salão recarrega (F5 manual, já que o tempo real só escuta itens_comanda).
// Usa mesas 7 e 8, que estavam livres antes deste teste (não mexe nas
// mesas 1/2/3/5, que podem ter comanda aberta de teste do Mateus).
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

// ---------- TESTE B: mesa vazia (abriu e voltou sem lançar nada) libera na hora, sem esperar nenhum tempo ----------
await abrirMesaGrid(page, "8");
const comanda8Antes = await comandaAbertaDaMesa(8);
check("B: abrir mesa 8 cria comanda vazia", comanda8Antes !== null && comanda8Antes.status === "ocupada");

// volta pro Salão (equivalente ao garçom clicar na mesa e desistir/voltar
// sem lançar nada) - com F5 manual, deve liberar na hora, sem precisar
// esperar nenhum tempo (sem folga)
await page.goto(`${BASE}/`);
await page.waitForTimeout(200);
const comanda8Depois = await comandaAbertaDaMesa(8);
check("B: mesa 8 volta pra Livre sozinha ao recarregar, sem precisar esperar", comanda8Depois === null);
const statusMesa8 = await db.query(`select status from mesas where numero = 8`);
check("B: mesa 8 volta pro status Livre", statusMesa8.rows[0].status === "livre");

await db.end();
await browser.close();

console.log(`\n${ok} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
