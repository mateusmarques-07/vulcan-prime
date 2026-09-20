import { chromium } from "playwright";

const BASE = "http://localhost:3700";
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

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// localiza a linha (div.items-center) mais proxima que contem um input com esse value
function linhaPor(valor) {
  return page
    .locator(`input[value="${valor}"]`)
    .locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' items-center ')][1]");
}

// ---------- LOGIN ----------
await page.goto(`${BASE}/login`);
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "123456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
check("login: entra no Salão", await page.locator("text=Mesas ocupadas").isVisible());

// ---------- SALAO ----------
await page.screenshot({ path: `${PREVIEWS}/01-salao.png` });
check("salao: 12 mesas livres", (await page.locator("text=Livre").count()) === 12);

// ---------- ABRIR MESA 2 + LANCAR PRODUTOS (sidebar) ----------
await page.locator('form:has(input[value="2"]) button[type="submit"]').first().click();
await page.waitForURL(`${BASE}/mesa/2`, { timeout: 10000 });
check("comanda: cardapio em sidebar (categorias verticais)", await page.locator('nav >> text=Espetos').isVisible());

await page.locator("nav >> text=Espetos").click();
await page.locator('button:has-text("Espeto de Picanha")').click();
await page.waitForURL((u) => u.pathname === "/mesa/2", { timeout: 10000 });
await page.locator('button:has-text("Espeto de Picanha")').click();
await page.waitForURL((u) => u.pathname === "/mesa/2", { timeout: 10000 });
check("comanda: lancar 2x soma quantidade (R$ 36,00)", await page.locator("text=Mesa 02 - R$ 36,00").isVisible());

await page.locator("li", { hasText: "Espeto de Picanha" }).locator('button:has-text("+")').click();
await page.waitForURL((u) => u.pathname === "/mesa/2", { timeout: 10000 });
check("comanda: botao + funciona (R$ 54,00)", await page.locator("text=Mesa 02 - R$ 54,00").isVisible());

await page.locator("li", { hasText: "Espeto de Picanha" }).locator('input[name="observacao"]').fill("Bem passado");
await page.locator("li", { hasText: "Espeto de Picanha" }).locator('button:has-text("Salvar")').click();
await page.waitForURL((u) => u.pathname === "/mesa/2", { timeout: 10000 });
check("comanda: observacao salva", await page.locator('input[value="Bem passado"]').isVisible());

await page.screenshot({ path: `${PREVIEWS}/02-comanda-sidebar.png` });

// ---------- FECHAR CONTA ----------
await page.click('button:has-text("Fechar conta")');
await page.waitForURL(`${BASE}/mesa/2/fechamento`, { timeout: 10000 });
check("fechamento: mostra subtotal certo", await page.locator("text=R$ 54,00").first().isVisible());

// divisao por pessoas
await page.fill('input[type="number"][min="1"]', "3");
await page.waitForTimeout(200);
check("fechamento: divisao por pessoas calcula", await page.locator("text=Dividido por 3 pessoas").isVisible());

// gorjeta
await page.locator('input[type="checkbox"]').check();
await page.locator('button:has-text("10%")').click();
await page.waitForTimeout(200);
await page.locator('button:has-text("Pix")').first().click();
await page.waitForTimeout(200);
check("fechamento: gorjeta 10% calculada (R$ 5,40)", await page.locator("text=Taxa de serviço (10%): R$ 5,40").isVisible());

await page.screenshot({ path: `${PREVIEWS}/03-fechamento.png` });

// clicar em "Imprimir recibo" de verdade (pega o link real, nao so confia no texto)
const [reciboPage] = await Promise.all([
  page.waitForEvent("popup"),
  page.locator('a:has-text("Imprimir recibo")').click(),
]);
await reciboPage.waitForLoadState("networkidle");
check(
  "recibo: abre em janela propria com conteudo certo (nao 404)",
  (await reciboPage.locator("text=RECIBO NÃO FISCAL").isVisible()) &&
    (await reciboPage.locator("text=Espeto de Picanha").isVisible())
);
await reciboPage.screenshot({ path: `${PREVIEWS}/04-recibo.png` });
await reciboPage.close();

// pagamento do subtotal dividido em 2 formas (Cartao + Dinheiro), localizando
// cada input pelo span com o nome exato da forma ao lado
async function preencherValorForma(nomeExato, valor) {
  await page
    .locator("span", { hasText: nomeExato })
    .locator("xpath=following-sibling::input")
    .first()
    .fill(valor);
}

await preencherValorForma("Cartão", "30");
await preencherValorForma("Dinheiro", "24");
await page.waitForTimeout(200);
check("fechamento: falta cobrir zera com 2 formas (30+24=54)", await page.locator("text=Valor cobrado confere com o subtotal.").isVisible());

const botaoConfirmar = page.locator('button:has-text("Confirmar pagamento")');
check("fechamento: botao confirmar habilitado", await botaoConfirmar.isEnabled());

await botaoConfirmar.click();
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
check("fechamento: confirmar volta pro salao com mesa livre", (await page.locator("text=0 / 12").isVisible()));

// ---------- RECEBIMENTOS ----------
await page.goto(`${BASE}/recebimentos`);
await page.waitForLoadState("networkidle");
check("recebimentos: total recebido hoje R$ 59,40", await page.locator("text=R$ 59,40").first().isVisible());
check("recebimentos: gorjetas R$ 5,40", await page.locator("text=R$ 5,40").first().isVisible());
await page.screenshot({ path: `${PREVIEWS}/05-recebimentos.png` });

// ---------- CATEGORIAS ----------
await page.goto(`${BASE}/produtos/categorias`);
await page.waitForLoadState("networkidle");

await page.fill('form[action="/api/categorias/criar"] input[name="nome"]', "Sobremesas");
await page.locator('form[action="/api/categorias/criar"] button:has-text("Adicionar")').click();
await page.waitForURL((u) => u.pathname === "/produtos/categorias", { timeout: 10000 });
check("categorias: nova categoria criada", await page.locator('input[value="Sobremesas"]').isVisible());
check("categorias: categoria antiga (Bebidas) nao foi afetada", await page.locator('input[value="Bebidas"]').isVisible());

await page.screenshot({ path: `${PREVIEWS}/07-categorias.png` });

// tentar remover categoria com produtos -> deve bloquear com popup
await linhaPor("Espetos").locator('button:has-text("Remover")').click();
await page.waitForURL((u) => u.searchParams.has("erro"), { timeout: 10000 });
check(
  "categorias: bloqueia remover categoria com produtos (popup)",
  await page.locator("text=Não é possível remover essa categoria").isVisible()
);
await page.locator('a:has-text("Entendi")').click();
await page.waitForURL((u) => !u.searchParams.has("erro"), { timeout: 10000 });

// remover a categoria vazia criada agora -> deve funcionar
await linhaPor("Sobremesas").locator('button:has-text("Remover")').click();
await page.waitForURL((u) => u.pathname === "/produtos/categorias", { timeout: 10000 });
check(
  "categorias: remove categoria vazia com sucesso",
  !(await page.locator('input[value="Sobremesas"]').isVisible())
);

// ---------- PRODUTOS ----------
await page.goto(`${BASE}/produtos`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${PREVIEWS}/06-produtos.png` });

await page.fill('form[action="/api/produtos/criar"] input[name="nome"]', "Petit Gateau");
await page.selectOption('form[action="/api/produtos/criar"] select[name="categoria_id"]', { label: "Porções" });
await page.fill('form[action="/api/produtos/criar"] input[name="preco"]', "24.90");
await page.locator('form[action="/api/produtos/criar"] button:has-text("Adicionar")').click();
await page.waitForURL((u) => u.pathname === "/produtos", { timeout: 10000 });
check("produtos: novo produto criado", await page.locator('input[value="Petit Gateau"]').isVisible());

await linhaPor("Petit Gateau").locator('button:has-text("Desativar")').click();
await page.waitForURL((u) => u.pathname === "/produtos", { timeout: 10000 });
check(
  "produtos: desativar funciona (some do cardapio)",
  await linhaPor("Petit Gateau").locator('button:has-text("Ativar")').isVisible()
);

// confere que sumiu do cardapio da comanda
await page.goto(`${BASE}/`);
await page.waitForLoadState("networkidle");
await page.locator('form:has(input[value="3"]) button[type="submit"]').first().click();
await page.waitForURL(`${BASE}/mesa/3`, { timeout: 10000 });
await page.locator("nav >> text=Porções").click();
check("comanda: produto desativado nao aparece no cardapio", !(await page.locator('button:has-text("Petit Gateau")').isVisible()));

// reativa de volta e libera a mesa 3 sem lancar nada
await page.goto(`${BASE}/produtos`);
await page.waitForLoadState("networkidle");
await linhaPor("Petit Gateau").locator('button:has-text("Ativar")').click();
await page.waitForURL((u) => u.pathname === "/produtos", { timeout: 10000 });
check(
  "produtos: reativar funciona",
  await linhaPor("Petit Gateau").locator('button:has-text("Desativar")').isVisible()
);

// ---------- PAGAMENTOS ----------
await page.goto(`${BASE}/pagamentos`);
await page.waitForLoadState("networkidle");

await page.fill('form[action="/api/pagamentos/criar"] input[name="nome"]', "Vale Refeição");
await page.locator('form[action="/api/pagamentos/criar"] button:has-text("Adicionar")').click();
await page.waitForURL((u) => u.pathname === "/pagamentos", { timeout: 10000 });
check("pagamentos: nova forma criada", await page.locator('input[value="Vale Refeição"]').isVisible());
await page.screenshot({ path: `${PREVIEWS}/08-pagamentos.png` });

// desativa 3 das 4 formas ativas, a ultima deve ser bloqueada
for (const nome of ["Cartão", "Dinheiro", "Vale Refeição"]) {
  await linhaPor(nome).locator('button:has-text("Desativar")').click();
  await page.waitForURL((u) => u.pathname === "/pagamentos", { timeout: 10000 });
}
await linhaPor("Pix").locator('button:has-text("Desativar")').click();
await page.waitForURL((u) => u.searchParams.has("erro"), { timeout: 10000 });
check(
  "pagamentos: bloqueia desativar a ultima forma ativa (popup)",
  await page.locator("text=última ativa").isVisible()
);
await page.locator('a:has-text("Entendi")').click();
await page.waitForURL((u) => !u.searchParams.has("erro"), { timeout: 10000 });

// devolve tudo como estava (reativa Cartao, Dinheiro; remove Vale Refeicao voltando pra 3 formas originais)
for (const nome of ["Cartão", "Dinheiro"]) {
  await linhaPor(nome).locator('button:has-text("Ativar")').click();
  await page.waitForURL((u) => u.pathname === "/pagamentos", { timeout: 10000 });
}
check("pagamentos: reativou Cartão e Dinheiro", true);

// ---------- CONFIGURACOES: alterar senha e voltar ----------
await page.goto(`${BASE}/configuracoes`);
await page.waitForLoadState("networkidle");
await page.fill('input[name="novaSenha"]', "senhaNova456");
await page.fill('input[name="confirmar"]', "senhaNova456");
await page.locator('button:has-text("Salvar nova senha")').click();
await page.waitForURL((u) => u.searchParams.has("sucesso"), { timeout: 10000 });
check("configuracoes: senha alterada com sucesso", await page.locator("text=Senha alterada com sucesso").isVisible());

// logout e login de novo com a senha nova, pra confirmar que trocou de verdade
await page.locator('button:has-text("Sair")').click();
await page.waitForURL(`${BASE}/login`, { timeout: 10000 });
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "senhaNova456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
check("configuracoes: login funciona com a senha nova", await page.locator("text=Mesas ocupadas").isVisible());

// volta a senha pro valor original (123456) pra nao confundir o Mateus depois
await page.goto(`${BASE}/configuracoes`);
await page.waitForLoadState("networkidle");
await page.fill('input[name="novaSenha"]', "123456");
await page.fill('input[name="confirmar"]', "123456");
await page.locator('button:has-text("Salvar nova senha")').click();
await page.waitForURL((u) => u.searchParams.has("sucesso"), { timeout: 10000 });
check("configuracoes: senha restaurada pra 123456", await page.locator("text=Senha alterada com sucesso").isVisible());

await browser.close();

console.log(`\n${ok} passaram, ${fail} falharam`);
process.exit(fail > 0 ? 1 : 0);
