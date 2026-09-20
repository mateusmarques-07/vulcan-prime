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

function linhaPor(page, valor) {
  return page
    .locator(`input[value="${valor}"]`)
    .locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' items-center ')][1]");
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// ---------- LOGIN ----------
await page.goto(`${BASE}/login`);
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "123456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
check("login: entra no Salão", await page.locator("text=Mesas ocupadas").isVisible());
check("salao: 12 mesas livres", (await page.locator("text=Livre").count()) === 12);

// ---------- MESA LIBERA SOZINHA SE FICAR VAZIA ----------
await page.locator('form:has(input[value="7"]) button[type="submit"]').first().click();
await page.waitForURL(`${BASE}/mesa/7`, { timeout: 10000 });
await page.goto(`${BASE}/`);
await page.waitForLoadState("networkidle");
check(
  "salao: mesa aberta sem nenhum item lançado volta a Livre sozinha",
  (await page.locator("text=Livre").count()) === 12
);

// ---------- ABRIR MESA + LANCAR PRODUTOS ----------
await page.locator('form:has(input[value="7"]) button[type="submit"]').first().click();
await page.waitForURL(`${BASE}/mesa/7`, { timeout: 10000 });
await page.locator("nav >> text=Espetos").click();

const inicioClique = Date.now();
await page.locator('button:has-text("Espeto de Picanha")').click();
await page.waitForURL((u) => u.pathname === "/mesa/7", { timeout: 10000 });
const duracaoLancar = Date.now() - inicioClique;
console.log(`   (tempo pra lançar 1 item: ${duracaoLancar}ms)`);
check("comanda: lançar produto funciona", await page.locator("li", { hasText: "Espeto de Picanha" }).isVisible());

await page.locator('button:has-text("Espeto de Picanha")').click();
await page.waitForURL((u) => u.pathname === "/mesa/7", { timeout: 10000 });
check("comanda: lançar 2x soma quantidade (R$ 36,00)", await page.locator("text=Mesa 07 - R$ 36,00").isVisible());

await page.locator("li", { hasText: "Espeto de Picanha" }).locator('button:has-text("+")').click();
await page.waitForURL((u) => u.pathname === "/mesa/7", { timeout: 10000 });
check("comanda: botão + funciona (R$ 54,00)", await page.locator("text=Mesa 07 - R$ 54,00").isVisible());

await page.screenshot({ path: `${PREVIEWS}/01-salao.png` });

// ---------- FECHAMENTO: gorjeta sem forma de pagamento propria ----------
await page.click('button:has-text("Fechar conta")');
await page.waitForURL(`${BASE}/mesa/7/fechamento`, { timeout: 10000 });

await page.fill('input[type="number"][min="1"]', "3");
await page.locator('input[type="checkbox"]').check();
await page.locator('button:has-text("10%")').click();
await page.waitForTimeout(200);
check(
  "fechamento: NÃO pede mais forma de pagamento da gorjeta",
  !(await page.locator("text=Forma de pagamento da gorjeta").isVisible())
);
check(
  "fechamento: total mostra itens e gorjeta separados",
  (await page.locator("text=Itens").first().isVisible()) &&
    (await page.locator("text=Gorjeta (10%)").isVisible())
);

async function preencherValorForma(nomeExato, valor) {
  await page
    .locator("span", { hasText: nomeExato })
    .locator("xpath=following-sibling::input")
    .first()
    .fill(valor);
}
await preencherValorForma("Pix", "54");
await page.waitForTimeout(200);
check(
  "fechamento: botão confirmar habilita só com o subtotal batendo (sem escolher forma da gorjeta)",
  await page.locator('button:has-text("Confirmar pagamento")').isEnabled()
);

await page.screenshot({ path: `${PREVIEWS}/03-fechamento.png` });

// ---------- IMPRIMIR RECIBO PERSISTE GORJETA/PESSOAS NA MESA ----------
const [reciboPage] = await Promise.all([
  page.waitForEvent("popup"),
  page.locator('button:has-text("Fechar conta e imprimir recibo")').click(),
]);
await reciboPage.waitForLoadState("networkidle");
check(
  "recibo: abre em janela própria com conteúdo certo",
  (await reciboPage.locator("text=RECIBO NÃO FISCAL").isVisible()) &&
    (await reciboPage.locator("text=Espeto de Picanha").isVisible())
);
await reciboPage.screenshot({ path: `${PREVIEWS}/04-recibo.png` });
await reciboPage.close();

// simula o "tempo de espera do garçom": sai da tela e volta
await page.goto(`${BASE}/`);
await page.waitForLoadState("networkidle");
await page.goto(`${BASE}/mesa/7/fechamento`);
await page.waitForLoadState("networkidle");
check(
  "fechamento: gorjeta e nº de pessoas continuam preenchidos ao reabrir (não precisa digitar de novo)",
  (await page.locator('input[type="checkbox"]').isChecked()) &&
    (await page.locator('input[type="number"][min="1"]').inputValue()) === "3"
);

// precisa preencher o pagamento de novo (isso é esperado - só o pagamento
// real acontece quando o garçom volta)
await preencherValorForma("Pix", "54");
await page.waitForTimeout(200);
await page.locator('button:has-text("Confirmar pagamento")').click();
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
check("fechamento: confirmar pagamento volta pro salão com mesa livre", await page.locator("text=0 / 12").isVisible());

// ---------- RECEBIMENTOS ----------
await page.goto(`${BASE}/recebimentos`);
await page.waitForLoadState("networkidle");
check("recebimentos: total recebido hoje R$ 59,40", await page.locator("text=R$ 59,40").first().isVisible());
check(
  "recebimentos: gorjeta aparece separada na lista (não como forma de pagamento)",
  await page.locator("text=+ Gorjeta R$ 5,40").isVisible()
);
await page.screenshot({ path: `${PREVIEWS}/05-recebimentos.png` });

// ---------- CATEGORIAS ----------
await page.goto(`${BASE}/produtos/categorias`);
await page.waitForLoadState("networkidle");

await page.fill('form[action="/api/categorias/criar"] input[name="nome"]', "Sobremesas");
await page.locator('form[action="/api/categorias/criar"] button:has-text("Adicionar")').click();
await page.waitForURL((u) => u.pathname === "/produtos/categorias", { timeout: 10000 });
check("categorias: nova categoria criada", await page.locator('input[value="Sobremesas"]').isVisible());
await page.screenshot({ path: `${PREVIEWS}/07-categorias.png` });

await linhaPor(page, "Espetos").locator('button:has-text("Remover")').click();
await page.waitForURL((u) => u.searchParams.has("erro"), { timeout: 10000 });
check(
  "categorias: bloqueia remover categoria com produtos (popup)",
  await page.locator("text=Não é possível remover essa categoria").isVisible()
);
await page.screenshot({ path: `${PREVIEWS}/09-popup-bloqueio.png` });
await page.locator('a:has-text("Entendi")').click();
await page.waitForURL((u) => !u.searchParams.has("erro"), { timeout: 10000 });

await linhaPor(page, "Sobremesas").locator('button:has-text("Remover")').click();
await page.waitForURL((u) => u.pathname === "/produtos/categorias", { timeout: 10000 });
check("categorias: remove categoria vazia com sucesso", !(await page.locator('input[value="Sobremesas"]').isVisible()));

// ---------- PRODUTOS: preço com 2 casas, sem campo ordem no cadastro ----------
await page.goto(`${BASE}/produtos`);
await page.waitForLoadState("networkidle");
check(
  "produtos: preço mostra com 2 casas decimais (18.00)",
  await page.locator('input[value="18.00"]').first().isVisible()
);
check(
  "produtos: cadastro NÃO tem mais campo de ordem",
  !(await page.locator('form[action="/api/produtos/criar"] input[name="ordem"]').count())
);
await page.screenshot({ path: `${PREVIEWS}/06-produtos.png` });

await page.fill('form[action="/api/produtos/criar"] input[name="nome"]', "Petit Gateau");
await page.selectOption('form[action="/api/produtos/criar"] select[name="categoria_id"]', { label: "Porções" });
await page.fill('form[action="/api/produtos/criar"] input[name="preco"]', "24.90");
await page.locator('form[action="/api/produtos/criar"] button:has-text("Adicionar")').click();
await page.waitForURL((u) => u.pathname === "/produtos", { timeout: 10000 });
check("produtos: novo produto criado (ordem automática)", await page.locator('input[value="Petit Gateau"]').isVisible());

await linhaPor(page, "Petit Gateau").locator('button:has-text("Desativar")').click();
await page.waitForURL((u) => u.pathname === "/produtos", { timeout: 10000 });
check(
  "produtos: desativar funciona",
  await linhaPor(page, "Petit Gateau").locator('button:has-text("Ativar")').isVisible()
);
await linhaPor(page, "Petit Gateau").locator('button:has-text("Ativar")').click();
await page.waitForURL((u) => u.pathname === "/produtos", { timeout: 10000 });

// ---------- PAGAMENTOS AGORA DENTRO DE CONFIGURAÇÕES ----------
check("nav: Pagamentos não aparece mais no menu principal", !(await page.locator('nav >> text=Pagamentos').isVisible()));

await page.goto(`${BASE}/configuracoes`);
await page.waitForLoadState("networkidle");
await page.locator('a:has-text("Formas de pagamento")').click();
await page.waitForURL(`${BASE}/configuracoes/pagamentos`, { timeout: 10000 });
check("configurações: formas de pagamento acessível a partir daqui", await page.locator("text=Formas de pagamento").first().isVisible());

await page.fill('form[action="/api/pagamentos/criar"] input[name="nome"]', "Vale Refeição");
await page.locator('form[action="/api/pagamentos/criar"] button:has-text("Adicionar")').click();
await page.waitForURL((u) => u.pathname === "/configuracoes/pagamentos", { timeout: 10000 });
check("pagamentos: nova forma criada", await page.locator('input[value="Vale Refeição"]').isVisible());
await page.screenshot({ path: `${PREVIEWS}/08-pagamentos.png` });

for (const nome of ["Cartão", "Dinheiro", "Vale Refeição"]) {
  await linhaPor(page, nome).locator('button:has-text("Desativar")').click();
  await page.waitForURL((u) => u.pathname === "/configuracoes/pagamentos", { timeout: 10000 });
}
await linhaPor(page, "Pix").locator('button:has-text("Desativar")').click();
await page.waitForURL((u) => u.searchParams.has("erro"), { timeout: 10000 });
check(
  "pagamentos: bloqueia desativar a última forma ativa (popup)",
  await page.locator("text=última ativa").isVisible()
);
await page.locator('a:has-text("Entendi")').click();
await page.waitForURL((u) => !u.searchParams.has("erro"), { timeout: 10000 });

for (const nome of ["Cartão", "Dinheiro"]) {
  await linhaPor(page, nome).locator('button:has-text("Ativar")').click();
  await page.waitForURL((u) => u.pathname === "/configuracoes/pagamentos", { timeout: 10000 });
}
check("pagamentos: reativou Cartão e Dinheiro", true);

// ---------- CONFIGURACOES: alterar senha e voltar ----------
await page.goto(`${BASE}/configuracoes`);
await page.waitForLoadState("networkidle");
await page.fill('input[name="novaSenha"]', "senhaNova456");
await page.fill('input[name="confirmar"]', "senhaNova456");
await page.locator('button:has-text("Salvar nova senha")').click();
await page.waitForURL((u) => u.searchParams.has("sucesso"), { timeout: 10000 });
check("configurações: senha alterada com sucesso", await page.locator("text=Senha alterada com sucesso").isVisible());

await page.locator('button:has-text("Sair")').click();
await page.waitForURL(`${BASE}/login`, { timeout: 10000 });
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "senhaNova456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
check("configurações: login funciona com a senha nova", await page.locator("text=Mesas ocupadas").isVisible());

await page.goto(`${BASE}/configuracoes`);
await page.waitForLoadState("networkidle");
await page.fill('input[name="novaSenha"]', "123456");
await page.fill('input[name="confirmar"]', "123456");
await page.locator('button:has-text("Salvar nova senha")').click();
await page.waitForURL((u) => u.searchParams.has("sucesso"), { timeout: 10000 });
check("configurações: senha restaurada pra 123456", await page.locator("text=Senha alterada com sucesso").isVisible());

await browser.close();

console.log(`\n${ok} passaram, ${fail} falharam`);
process.exit(fail > 0 ? 1 : 0);
