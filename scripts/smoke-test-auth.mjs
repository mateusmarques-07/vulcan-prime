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
const context = await browser.newContext();
const page = await context.newPage();

// Teste 1: rota protegida sem sessao redireciona pro /login
await page.goto(`${BASE}/`);
check("teste1: sem sessao -> redireciona pro /login", page.url() === `${BASE}/login`);

// Teste 2: login com senha errada mostra erro e mantem na tela de login
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "senha-errada");
await page.click('button[type="submit"]');
await page.waitForURL((url) => url.searchParams.has("erro"), { timeout: 10000 });
const erroVisivel = await page.locator("text=Usuário ou senha inválidos").isVisible();
check("teste2: senha errada -> mostra mensagem de erro", erroVisivel);

// Teste 3: login correto redireciona pro Salão autenticado
await page.goto(`${BASE}/login`);
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "123456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
const salaoVisivel = await page.locator("text=Mesas ocupadas").isVisible();
check("teste3: login correto -> Salão carrega autenticado", salaoVisivel);

// Teste 4: F5 na pagina autenticada mantem a sessao (nao volta pro login)
await page.reload();
await page.waitForLoadState("networkidle");
check("teste4: reload mantem sessao (nao redireciona pro login)", page.url() === `${BASE}/`);

// Teste 5: logout limpa a sessao e rota protegida volta a exigir login
await page.click('button:has-text("Sair")');
await page.waitForURL(`${BASE}/login`, { timeout: 10000 });
await page.goto(`${BASE}/`);
await page.waitForURL(`${BASE}/login`, { timeout: 10000 });
check("teste5: logout -> / volta a exigir login", page.url() === `${BASE}/login`);

await browser.close();

console.log(`\n${ok} passaram, ${fail} falharam`);
process.exit(fail > 0 ? 1 : 0);
