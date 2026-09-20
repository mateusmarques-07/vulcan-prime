import { chromium } from "playwright";

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

// ---------- SALAO: 11 mesas + Balcao (Retirada) por ultimo, sem Entrega ----------
check("salao: 12 campos livres (11 mesas + Balcão)", (await page.locator("text=Livre").count()) === 12);
check("salao: mostra Mesa 11 (era Balcão antes)", await page.locator("text=Mesa 11").first().isVisible());
check(
  "salao: mostra Balcão (Retirada)",
  await page.locator("text=Balcão (Retirada)").first().isVisible()
);
const rotulosSalao = await page.locator(".text-lg.font-bold").allTextContents();
check(
  "salao: não existe mais campo 'Entrega' sozinho no grid (12 campos: 11 mesas + Balcão)",
  rotulosSalao.length === 12 && !rotulosSalao.includes("Entrega")
);

// ---------- ENTREGAS: layout de 2 colunas ----------
await page.goto(`${BASE}/entregas`);
await page.waitForLoadState("networkidle");
check("entregas: página carrega com título", await page.locator("h1", { hasText: "Entregas" }).isVisible());
check("entregas: lista começa vazia", await page.locator("text=Nenhuma entrega em aberto").isVisible());
check(
  "entregas: painel da direita mostra aviso de selecionar quando não há nenhuma",
  await page.locator("text=Selecione uma entrega na lista ao lado").isVisible()
);

// ---------- VALIDACAO: nao deixa criar sem produto ----------
await page.click("text=+ Nova Entrega");
await page.waitForURL(`${BASE}/entregas/nova`, { timeout: 10000 });
await page.fill('input[name="cliente_nome"]', "João Silva");
await page.fill('input[name="endereco"]', "Rua das Flores, 25");
await page.selectOption('select[name="forma_pagamento_id"]', { label: "Pix" });
await page.click('button:has-text("Criar entrega")');
await page.waitForURL((u) => u.pathname === "/entregas/nova", { timeout: 10000 });
check(
  "entregas: bloqueia criar sem nenhum produto selecionado",
  await page.locator("text=Selecione pelo menos um produto.").isVisible()
);
await page.locator('a:has-text("Entendi")').click();

// ---------- CRIAR PRIMEIRA ENTREGA (João Silva) ----------
await page.fill('input[name="cliente_nome"]', "João Silva");
await page.fill('input[name="endereco"]', "Rua das Flores, 25");
await preencherQtd(page, "Vulcan Burger", 1);
await preencherQtd(page, "Batata Frita", 1);
await page.waitForTimeout(150);
check("entregas: total calcula sozinho ao digitar quantidade (32+22+5=59)", await page.locator("text=R$ 59,00").isVisible());
await page.selectOption('select[name="forma_pagamento_id"]', { label: "Pix" });
await page.click('button:has-text("Criar entrega")');
await page.waitForURL(/\/entregas\?numero=\d+$/, { timeout: 10000 });
const numeroJoao = new URL(page.url()).searchParams.get("numero");
check("entregas: cria e volta pra tela de Entregas com a entrega selecionada", /^\d+$/.test(numeroJoao ?? ""));
check(
  "entregas: painel direito mostra a entrega recém-criada, status ABERTA",
  await page.locator("text=🟡 ABERTA").first().isVisible()
);
check("entregas: painel direito mostra total certo (R$ 59,00)", await page.locator("text=R$ 59,00").first().isVisible());
check(
  "entregas: itens aparecem em formato de tabela (Produto/Qtd/Valor/Total)",
  await page.locator("th", { hasText: "Qtd" }).isVisible()
);

// ---------- CRIAR SEGUNDA ENTREGA SIMULTANEA (Maria Souza) ----------
await page.goto(`${BASE}/entregas/nova`);
await page.fill('input[name="cliente_nome"]', "Maria Souza");
await page.fill('input[name="endereco"]', "Av. Principal, 120");
await preencherQtd(page, "Espeto de Picanha", 2);
await page.selectOption('select[name="forma_pagamento_id"]', { label: "Cartão" });
const campoTaxaMaria = page.locator('input[name="taxa_entrega"]');
await campoTaxaMaria.fill("8");
await page.click('button:has-text("Criar entrega")');
await page.waitForURL(/\/entregas\?numero=\d+$/, { timeout: 10000 });
const numeroMaria = new URL(page.url()).searchParams.get("numero");
check("entregas: segunda entrega criada com número diferente da primeira", numeroMaria !== numeroJoao);
check("entregas: total da Maria certo (2x18 + 8 = 44)", await page.locator("text=R$ 44,00").first().isVisible());

// ---------- LISTA MOSTRA AS DUAS AO MESMO TEMPO, SEM CONFLITO ----------
check(
  "entregas: as duas entregas aparecem juntas na lista da esquerda (simultâneas)",
  (await page.locator("text=João Silva").first().isVisible()) &&
    (await page.locator("text=Maria Souza").first().isVisible())
);

// ---------- CLICAR NA LISTA TROCA O DETALHE, SEM RECARREGAR A PAGINA TODA ----------
await page.locator("a", { hasText: "João Silva" }).first().click();
await page.waitForURL(new RegExp(`numero=${numeroJoao}$`), { timeout: 10000 });
check(
  "entregas: clicar no card da João mostra o detalhe dela (endereço certo)",
  await page.locator("text=Rua das Flores, 25").first().isVisible()
);

// ---------- MUDANCA DE STATUS MANUAL: João vai pra EM ROTA ----------
await page.locator('form[action="/api/entregas/status"] button:has-text("Em rota")').click();
await page.waitForURL(new RegExp(`numero=${numeroJoao}$`), { timeout: 10000 });
check("entregas: status muda pra EM ROTA manualmente", await page.locator("text=🔵 EM ROTA").first().isVisible());

// pode voltar pra ABERTA se precisar (toggle, nao so avanca)
await page.locator('form[action="/api/entregas/status"] button:has-text("Aberta")').click();
await page.waitForURL(new RegExp(`numero=${numeroJoao}$`), { timeout: 10000 });
check("entregas: dá pra voltar de EM ROTA pra ABERTA (toggle, não só avança)", await page.locator("text=🟡 ABERTA").first().isVisible());

// volta pra em rota de novo, pra continuar o fluxo normal
await page.locator('form[action="/api/entregas/status"] button:has-text("Em rota")').click();
await page.waitForURL(new RegExp(`numero=${numeroJoao}$`), { timeout: 10000 });

// Maria continua ABERTA (nao afeta uma a outra)
await page.locator("a", { hasText: "Maria Souza" }).first().click();
await page.waitForURL(new RegExp(`numero=${numeroMaria}$`), { timeout: 10000 });
check("entregas: Maria continua ABERTA (independente da João)", await page.locator("text=🟡 ABERTA").first().isVisible());

// ---------- FINALIZAR MARIA (motoboy voltou, pagamento confirmado) - botao separado ----------
check(
  "entregas: botão Finalizar é separado dos de status (Aberta/Em rota), evita clique errado",
  await page.locator('button:has-text("Finalizar (pagamento confirmado)")').isVisible()
);
await page.click('button:has-text("Finalizar (pagamento confirmado)")');
await page.waitForURL(new RegExp(`numero=${numeroMaria}$`), { timeout: 10000 });
check("entregas: Maria finalizada", await page.locator("text=✅ FINALIZADA").first().isVisible());
check(
  "entregas: finalizada mostra forma de pagamento e não mostra mais botões de status",
  (await page.locator("text=Forma de pagamento: Cartão").isVisible()) &&
    !(await page.locator('button:has-text("Finalizar")').isVisible())
);

// João continua ativa (em rota), nao foi afetada por finalizar a Maria
await page.goto(`${BASE}/entregas`);
await page.waitForLoadState("networkidle");
check(
  "entregas: após finalizar Maria, só João continua na lista de ativas",
  (await page.locator("li", { hasText: "João Silva" }).isVisible()) &&
    !(await page.locator("li", { hasText: "Maria Souza" }).isVisible())
);

// ---------- HISTORICO ----------
await page.goto(`${BASE}/entregas/historico`);
await page.waitForLoadState("networkidle");
check("histórico: Maria aparece finalizada", await page.locator("text=Maria Souza").first().isVisible());
check("histórico: mostra valor e forma de pagamento", await page.locator("text=R$ 44,00").isVisible());

await page.click(`text=#${numeroMaria.padStart(2, "0")}`);
await page.waitForURL(new RegExp(`numero=${numeroMaria}$`), { timeout: 10000 });
check(
  "histórico: clicar no número abre o detalhe (read-only) da entrega finalizada",
  await page.locator("text=✅ FINALIZADA").first().isVisible()
);

// ---------- COMPROVANTE ----------
const [reciboPage] = await Promise.all([
  page.waitForEvent("popup"),
  page.locator('a:has-text("Imprimir comprovante")').click(),
]);
await reciboPage.waitForLoadState("networkidle");
check(
  "comprovante: mostra dados da entrega e RECIBO NÃO FISCAL",
  (await reciboPage.locator("text=Maria Souza").isVisible()) &&
    (await reciboPage.locator("text=RECIBO NÃO FISCAL").isVisible())
);
await reciboPage.close();

// ---------- RECEBIMENTOS: filtro por tipo agora vale pra tela inteira ----------
await page.goto(`${BASE}/recebimentos`);
await page.waitForLoadState("networkidle");
check(
  `recebimentos: mostra 'Entrega #${numeroMaria.padStart(2, "0")}'`,
  await page.locator("table").locator(`text=Entrega #${numeroMaria.padStart(2, "0")}`).isVisible()
);
check("recebimentos: card de Taxa de entrega existe", await page.locator("text=Taxa de entrega").first().isVisible());
check("recebimentos: filtro por tipo existe", await page.locator('select[name="tipo"]').isVisible());

await page.goto(`${BASE}/recebimentos?tipo=entrega`);
await page.waitForLoadState("networkidle");
check(
  "recebimentos: filtro 'Entrega' mostra só entregas na lista",
  await page.locator("table").locator(`text=Entrega #${numeroMaria.padStart(2, "0")}`).isVisible()
);
check(
  "recebimentos: filtro 'Entrega' - card do topo soma só a Maria (36), João ainda não finalizou",
  (await page.locator("text=Subtotal vendido").locator("xpath=following-sibling::p").first().textContent())?.includes("36,00")
);

await page.goto(`${BASE}/recebimentos?tipo=mesa`);
await page.waitForLoadState("networkidle");
check(
  "recebimentos: filtro 'Mesa' não mostra a entrega da Maria na lista",
  !(await page.locator("table").locator(`text=Entrega #${numeroMaria.padStart(2, "0")}`).isVisible())
);
check(
  "recebimentos: filtro por tipo agora também muda os cards do topo (Mesa = R$0, já que hoje só teve entrega)",
  (await page.locator("text=Subtotal vendido").locator("xpath=following-sibling::p").first().textContent())?.includes("0,00")
);

// ---------- FINALIZAR JOAO TAMBEM (limpeza) ----------
await page.goto(`${BASE}/entregas?numero=${numeroJoao}`);
await page.click('button:has-text("Finalizar (pagamento confirmado)")');
await page.waitForURL(new RegExp(`numero=${numeroJoao}$`), { timeout: 10000 });
check("entregas: João também finalizada", await page.locator("text=✅ FINALIZADA").first().isVisible());

await page.goto(`${BASE}/entregas`);
await page.waitForLoadState("networkidle");
check("entregas: lista de ativas vazia de novo depois de finalizar as duas", await page.locator("text=Nenhuma entrega em aberto").isVisible());

await browser.close();

console.log(`\n${ok} passaram, ${fail} falharam`);
process.exit(fail > 0 ? 1 : 0);
