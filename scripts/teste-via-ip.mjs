import { chromium } from "playwright";

const BASE = "http://187.77.55.239:3700";
let ok = 0;
let fail = 0;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + " - " + label);
  if (cond) ok++;
  else fail++;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const erros = [];
page.on("pageerror", (err) => erros.push(err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") erros.push(msg.text());
});

await page.goto(`${BASE}/login`);
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "123456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });

await page.locator('form:has(input[value="6"]) button[type="submit"]').first().click();
await page.waitForURL(`${BASE}/mesa/6`, { timeout: 10000 });

// clicar numa categoria (isso e' 100% JS, sem isso a pagina nem muda)
await page.locator("nav >> text=Defumados").click();
await page.waitForTimeout(300);
const trocouCategoria = await page.locator('button:has-text("Costela Defumada")').isVisible();
check("clicar em categoria troca o cardapio exibido (JS funcionando)", trocouCategoria);

// adicionar produto
await page.locator('button:has-text("Costela Defumada")').click();
await page.waitForURL((u) => u.pathname === "/mesa/6", { timeout: 10000 });
const itemAdicionado = await page.locator("li", { hasText: "Costela Defumada" }).isVisible();
check("adicionar produto funciona sem erro", itemAdicionado);

check("nenhum erro de JS no console/pagina", erros.length === 0);
if (erros.length > 0) {
  console.log("Erros capturados:", erros);
}

await browser.close();
console.log(`\n${ok} passaram, ${fail} falharam`);
process.exit(fail > 0 ? 1 : 0);
