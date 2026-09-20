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
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

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

// ---------- NAV: link Entregas existe ----------
await page.goto(`${BASE}/entregas`);
await page.waitForLoadState("networkidle");
check("entregas: página carrega com título", await page.locator("h1", { hasText: "Entregas" }).isVisible());
check("entregas: lista começa vazia", await page.locator("text=Nenhuma entrega em aberto").isVisible());

// ---------- VALIDACAO: nao deixa criar sem produto ----------
await page.click("text=+ Nova Entrega");
await page.waitForURL(`${BASE}/entregas/nova`, { timeout: 10000 });
await page.fill('input[name="cliente_nome"]', "João");
await page.fill('input[name="endereco"]', "Rua das Flores, 25");
await page.selectOption('select[name="forma_pagamento_id"]', { label: "Pix" });
await page.click('button:has-text("Criar entrega")');
await page.waitForURL((u) => u.pathname === "/entregas/nova", { timeout: 10000 });
check(
  "entregas: bloqueia criar sem nenhum produto selecionado",
  await page.locator("text=Selecione pelo menos um produto.").isVisible()
);
await page.locator('a:has-text("Entendi")').click();

// ---------- CRIAR PRIMEIRA ENTREGA (João) ----------
await page.fill('input[name="cliente_nome"]', "João");
await page.fill('input[name="endereco"]', "Rua das Flores, 25");
await preencherQtd(page, "Vulcan Burger", 1);
await preencherQtd(page, "Batata Frita", 1);
await page.waitForTimeout(150);
check("entregas: total calcula sozinho ao digitar quantidade (32+22+5=59)", await page.locator("text=R$ 59,00").isVisible());
await page.selectOption('select[name="forma_pagamento_id"]', { label: "Pix" });
await page.click('button:has-text("Criar entrega")');
await page.waitForURL(/\/entregas\/\d+$/, { timeout: 10000 });
const numeroJoao = page.url().split("/").pop();
check("entregas: cria e redireciona pro detalhe com número sequencial", /^\d+$/.test(numeroJoao ?? ""));
check("entregas: detalhe mostra status ABERTA", await page.locator("text=🟡 ABERTA").isVisible());
check("entregas: detalhe mostra total certo (R$ 59,00)", await page.locator("text=R$ 59,00").first().isVisible());

// ---------- CRIAR SEGUNDA ENTREGA SIMULTANEA (Maria) - a pergunta original do Mateus ----------
await page.goto(`${BASE}/entregas/nova`);
await page.fill('input[name="cliente_nome"]', "Maria");
await page.fill('input[name="endereco"]', "Quadra 10, Casa 15");
await preencherQtd(page, "Espeto de Picanha", 2);
await page.selectOption('select[name="forma_pagamento_id"]', { label: "Cartão" });
const campoTaxaMaria = page.locator('input[name="taxa_entrega"]');
await campoTaxaMaria.fill("8");
await page.click('button:has-text("Criar entrega")');
await page.waitForURL(/\/entregas\/\d+$/, { timeout: 10000 });
const numeroMaria = page.url().split("/").pop();
check("entregas: segunda entrega criada com número diferente da primeira", numeroMaria !== numeroJoao);
check("entregas: total da Maria certo (2x18 + 8 = 44)", await page.locator("text=R$ 44,00").first().isVisible());

// ---------- LISTA MOSTRA AS DUAS AO MESMO TEMPO, SEM CONFLITO ----------
await page.goto(`${BASE}/entregas`);
await page.waitForLoadState("networkidle");
check(
  "entregas: as duas entregas aparecem juntas na lista de ativas (simultâneas)",
  (await page.locator("text=João").isVisible()) && (await page.locator("text=Maria").isVisible())
);

// ---------- MUDANCA DE STATUS MANUAL: João vai pra EM ROTA ----------
await page.goto(`${BASE}/entregas/${numeroJoao}`);
await page.click('button:has-text("Marcar como Em Rota")');
await page.waitForURL(`${BASE}/entregas/${numeroJoao}`, { timeout: 10000 });
check("entregas: status muda pra EM ROTA manualmente", await page.locator("text=🔵 EM ROTA").isVisible());

// Maria continua ABERTA (nao afeta uma a outra)
await page.goto(`${BASE}/entregas/${numeroMaria}`);
check("entregas: Maria continua ABERTA (independente da João)", await page.locator("text=🟡 ABERTA").isVisible());

// ---------- FINALIZAR MARIA (motoboy voltou, pagamento confirmado) ----------
await page.click('button:has-text("Finalizar (pagamento confirmado)")');
await page.waitForURL(`${BASE}/entregas/${numeroMaria}`, { timeout: 10000 });
check("entregas: Maria finalizada", await page.locator("text=✅ FINALIZADA").isVisible());
check(
  "entregas: finalizada mostra forma de pagamento e não mostra mais botões de status",
  (await page.locator("text=Forma de pagamento: Cartão").isVisible()) &&
    !(await page.locator('button:has-text("Marcar como Em Rota")').isVisible())
);

// João continua ativa (em rota), nao foi afetada por finalizar a Maria
await page.goto(`${BASE}/entregas`);
await page.waitForLoadState("networkidle");
check(
  "entregas: após finalizar Maria, só João continua na lista de ativas",
  (await page.locator("li", { hasText: "João" }).isVisible()) &&
    !(await page.locator("li", { hasText: "Maria" }).isVisible())
);

// ---------- HISTORICO ----------
await page.goto(`${BASE}/entregas/historico`);
await page.waitForLoadState("networkidle");
check("histórico: Maria aparece finalizada", await page.locator("text=Maria").first().isVisible());
check("histórico: mostra valor e forma de pagamento", await page.locator("text=R$ 44,00").isVisible());

// ---------- COMPROVANTE ----------
const [reciboPage] = await Promise.all([
  page.waitForEvent("popup"),
  page.goto(`${BASE}/entregas/${numeroMaria}`).then(() =>
    page.locator('a:has-text("Imprimir comprovante")').click()
  ),
]);
await reciboPage.waitForLoadState("networkidle");
check(
  "comprovante: mostra dados da entrega e RECIBO NÃO FISCAL",
  (await reciboPage.locator("text=Maria").isVisible()) &&
    (await reciboPage.locator("text=RECIBO NÃO FISCAL").isVisible())
);
await reciboPage.close();

// ---------- RECEBIMENTOS: filtro por tipo + rótulo Entrega #N ----------
await page.goto(`${BASE}/recebimentos`);
await page.waitForLoadState("networkidle");
check(
  `recebimentos: mostra 'Entrega #${numeroMaria.padStart(2, "0")}'`,
  await page.locator(`text=Entrega #${numeroMaria.padStart(2, "0")}`).isVisible()
);
check("recebimentos: filtro por tipo existe", await page.locator('select[name="tipo"]').isVisible());

await page.goto(`${BASE}/recebimentos?tipo=entrega`);
await page.waitForLoadState("networkidle");
check(
  "recebimentos: filtro 'Entrega' mostra só entregas",
  await page.locator(`text=Entrega #${numeroMaria.padStart(2, "0")}`).isVisible()
);

await page.goto(`${BASE}/recebimentos?tipo=mesa`);
await page.waitForLoadState("networkidle");
check(
  "recebimentos: filtro 'Mesa' não mostra a entrega da Maria",
  !(await page.locator(`text=Entrega #${numeroMaria.padStart(2, "0")}`).isVisible())
);

// ---------- FINALIZAR JOAO TAMBEM (limpeza) ----------
await page.goto(`${BASE}/entregas/${numeroJoao}`);
await page.click('button:has-text("Finalizar (pagamento confirmado)")');
await page.waitForURL(`${BASE}/entregas/${numeroJoao}`, { timeout: 10000 });
check("entregas: João também finalizada", await page.locator("text=✅ FINALIZADA").isVisible());

await page.goto(`${BASE}/entregas`);
await page.waitForLoadState("networkidle");
check("entregas: lista de ativas vazia de novo depois de finalizar as duas", await page.locator("text=Nenhuma entrega em aberto").isVisible());

await browser.close();

console.log(`\n${ok} passaram, ${fail} falharam`);
process.exit(fail > 0 ? 1 : 0);
