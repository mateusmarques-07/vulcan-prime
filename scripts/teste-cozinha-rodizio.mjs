// Testes do cardapio de 13/10/2026 (rodizio, executivos com acompanhamento)
// e do envio pra cozinha. Grava comandas/fechamentos de teste no banco:
// rode `node scripts/limpar-banco-teste.mjs` depois. Uso:
//   node scripts/teste-cozinha-rodizio.mjs            (localhost:3700)
//   BASE_URL=https://vulcanprime.vercel.app node scripts/teste-cozinha-rodizio.mjs
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3700";
// mesas usadas no teste (MESA_A/MESA_B), pra nao esbarrar em quem estiver
// usando o sistema ao mesmo tempo (o banco e o mesmo da producao)
const MA = Number(process.env.MESA_A ?? 1);
const MB = Number(process.env.MESA_B ?? 2);
const ROT_A = `MESA ${String(MA).padStart(2, "0")}`;
const LABEL_A = `Mesa ${String(MA).padStart(2, "0")}`;
const PRINTS = new URL("../previews/", import.meta.url).pathname;
let ok = 0;
let fail = 0;

function check(label, cond) {
  console.log(`${cond ? "PASS" : "FAIL"} - ${label}`);
  cond ? ok++ : fail++;
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
// window.print de verdade nao existe no navegador de teste: por padrao nao
// faz nada (pra dar pra ler o papel da cozinha); `window.__simularImpressao`
// liga o disparo do "afterprint", igual quando a impressora termina.
await context.addInitScript(() => {
  window.print = () => {
    if (localStorage.getItem("simularImpressao") === "1") {
      setTimeout(() => window.dispatchEvent(new Event("afterprint")), 50);
    }
  };
});
const page = await context.newPage();

async function esperar() {
  await page.waitForLoadState("networkidle");
}

async function lancar(categoria, produto) {
  // repete o clique ate a categoria ficar laranja (selecionada) - logo apos
  // a pagina carregar, o React pode ainda nao ter ligado o botao
  const botaoCategoria = page.locator("nav button", { hasText: categoria }).first();
  for (let i = 0; i < 10; i++) {
    await botaoCategoria.click();
    if ((await botaoCategoria.getAttribute("class")).includes("bg-orange-600")) break;
    await page.waitForTimeout(300);
  }
  await page.locator("div.flex-1 > form button, div.flex-1 > button", { hasText: produto }).first().click();
}

async function lancarComAcomp(categoria, produto, escolhas, outro) {
  await lancar(categoria, produto);
  const popup = page.locator("div.fixed", { hasText: "Escolha" });
  for (const escolha of escolhas) {
    await popup.locator("button", { hasText: new RegExp(`^${escolha}$`) }).click();
  }
  if (outro) await popup.locator('input[placeholder^="Outro"]').fill(outro);
  await popup.locator('button:has-text("Confirmar")').click();
  await page.waitForURL(/\/mesa\/\d+/);
  await esperar();
}

async function abrirMesa(numero) {
  await page.goto(`${BASE}/`);
  await page.locator(`form:has(input[name="numero"][value="${numero}"]) button[type="submit"]`).click();
  await page.waitForURL(`${BASE}/mesa/${numero}`);
  await esperar();
}

async function enviarCozinha() {
  await page.locator('button:has-text("Enviar para cozinha")').first().click();
  await page.waitForURL(/\/cozinha\/\d+\?em=/);
  await esperar();
}

// login
await page.goto(`${BASE}/login`);
await page.fill("#usuario", "matheus.marques");
await page.fill("#senha", "123456");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 15000 });

// 1. salao zerado
const livres = await page.locator("text=Livre").count();
const ocupadasTeste = await page.locator("a").filter({ hasText: new RegExp(`${LABEL_A}|Balcão`) }).count();
check(`1. mesas do teste livres (${livres} livres no salão)`, livres >= 3 && ocupadasTeste === 0);

// 2. cardapio novo: 11 categorias na ordem do cardapio
await abrirMesa(MA);
const categorias = await page.locator("nav button").allInnerTexts();
const esperado = [
  "Rodízio", "Vulcan Executivos", "Espetos Defumados", "Vulcan Burgers", "Porções",
  "Adicionais", "Bebidas", "Chopp", "Cervejas", "Drinks", "Sobremesa",
];
check(
  `2. 11 categorias na ordem (${categorias.join(" | ")})`,
  JSON.stringify(categorias.slice(-11)) === JSON.stringify(esperado)
);

// 3. rodizio: precos e descricao
const rodizioTxt = await page.locator("div.flex-1").first().innerText();
check(
  "3. Rodízio R$ 49,90 + infantil R$ 24,95 com descrição",
  rodizioTxt.includes("49,90") && rodizioTxt.includes("24,95") && rodizioTxt.includes("à vontade")
);

// 4. executivo abre popup com 6 botoes, trava no 4o
await lancar("Vulcan Executivos", "Bife Ancho");
const popup = page.locator("div.fixed", { hasText: "Escolha 4 acompanhamentos" });
const botoes = await popup.locator("div.grid button").allInnerTexts();
check(`4a. popup do executivo com os adicionais (${botoes.join(", ")})`,
  botoes.length === 6 && botoes.includes("Arroz") && !botoes.some((b) => b.includes("adicional")));
for (const b of ["Arroz", "Feijão", "Purê de batata", "Salada"]) {
  await popup.locator("button", { hasText: new RegExp(`^${b}$`) }).click();
}
const legumesTravado = await popup.locator("button", { hasText: /^Legumes$/ }).isDisabled();
const contador = await popup.locator("text=4 de 4").isVisible();
check("4b. depois de 4 escolhas, o 5º botão trava e mostra 4 de 4", legumesTravado && contador);
await page.screenshot({ path: `${PRINTS}36-popup-executivo.png` });
await popup.locator('button:has-text("Confirmar")').click();
await page.waitForURL(new RegExp(`/mesa/${MA}`));
await esperar();
const itemBife = page.locator("li", { hasText: "Bife Ancho" });
check(
  "4c. Bife Ancho entra com acompanhamentos e 🟠 Não enviado",
  (await itemBife.innerText()).includes("Arroz, Feijão, Purê de batata, Salada") &&
    (await itemBife.innerText()).includes("Não enviado")
);

// 5. rodizio: so 1 escolha (clicar outro troca)
await lancar("Rodízio", "Rodízio");
const popupR = page.locator("div.fixed", { hasText: "Escolha 1 acompanhamento" });
await popupR.locator("button", { hasText: /^Arroz$/ }).click();
await popupR.locator("button", { hasText: /^Legumes$/ }).click();
const umSo = await popupR.locator("text=1 de 1").isVisible();
await popupR.locator('button:has-text("Confirmar")').click();
await page.waitForURL(new RegExp(`/mesa/${MA}`));
await esperar();
check("5. Rodízio aceita 1 acompanhamento (troca ao clicar outro)",
  umSo && (await page.locator("li", { hasText: "Rodízio" }).innerText()).includes("Acomp: Legumes"));

// 6. bebida nao vai pra cozinha (sem selo) e soma na mesma linha
await lancar("Chopp", "Chopp Brahma");
await esperar();
await lancar("Chopp", "Chopp Brahma");
await esperar();
const chopp = await page.locator("li", { hasText: "Chopp Brahma" }).innerText();
check("6. Chopp 2x na mesma linha, sem selo de cozinha",
  (await page.locator("li", { hasText: "Chopp Brahma" }).count()) === 1 &&
    chopp.includes("24,00") && !chopp.includes("Cozinha") && !chopp.includes("Não enviado"));

// 7. botao e Salao mostram 2 pendentes (bife + rodizio; chopp nao conta)
const botaoTxt = await page.locator('button:has-text("Enviar para cozinha")').innerText();
await page.screenshot({ path: `${PRINTS}37-comanda-pendente.png`, fullPage: true });
await page.goto(`${BASE}/`);
await esperar();
const cardMesa1 = await page.locator("form, a").filter({ hasText: LABEL_A }).first().innerText();
check(`7. botão "${botaoTxt}" e Salão com "2 p/ cozinha"`,
  botaoTxt.includes("(2)") && cardMesa1.includes("2 p/ cozinha"));
await page.screenshot({ path: `${PRINTS}38-salao-pendente.png` });

// 8. envio: papel da cozinha so com comida, sem preco
await page.goto(`${BASE}/mesa/${MA}`);
await esperar();
await enviarCozinha();
const papel1 = await page.locator("body").innerText();
check("8a. papel da cozinha: mesa do teste, Bife com acomp, Rodízio com acomp",
  papel1.includes(`COZINHA - ${ROT_A}`) &&
    papel1.includes("1X BIFE ANCHO") &&
    papel1.includes("Acomp: Arroz, Feijão, Purê de batata, Salada") &&
    papel1.includes("Acomp: Legumes"));
check("8b. papel da cozinha sem bebida e sem preço",
  !papel1.toUpperCase().includes("CHOPP") && !papel1.includes("R$"));
await page.screenshot({ path: `${PRINTS}39-papel-cozinha.png` });

// 9. voltou: selos verdes, botao "Cozinha em dia", reimprimir aparece
await page.goto(`${BASE}/mesa/${MA}`);
await esperar();
const comandaTxt = await page.locator("body").innerText();
const emDia = await page.locator('button:has-text("Enviar para cozinha")').first().isDisabled();
check("9. itens com ✅ Cozinha, botão 'Enviar para cozinha' cinza e 'Reimprimir' visível",
  (comandaTxt.match(/✅ Cozinha/g) ?? []).length === 2 &&
    emDia &&
    (await page.locator("text=Reimprimir último envio").isVisible()));

// 10. mesa continua ocupada depois do envio
await page.goto(`${BASE}/`);
await esperar();
const cardDepois = await page.locator("a").filter({ hasText: LABEL_A }).first().innerText();
check("10. mesa do teste continua Ocupada e sem pendência no Salão",
  cardDepois.includes("Ocupada") && !cardDepois.includes("p/ cozinha"));

// 11. "+" em item ja enviado cria linha nova pendente; 2o envio leva so ela
await page.goto(`${BASE}/mesa/${MA}`);
await esperar();
await page.locator("li", { hasText: "Bife Ancho" }).locator('button:has-text("+")').click();
await esperar();
const linhasBife = await page.locator("li", { hasText: "Bife Ancho" }).count();
check("11a. '+' no Bife já enviado cria nova linha pendente (2 linhas)", linhasBife === 2);
await lancar("Espetos Defumados", "Espeto de Carne");
await esperar();
await page.locator("li", { hasText: "Espeto de Carne" }).locator('input[name="observacao"]').fill("bem passado");
await page.locator("li", { hasText: "Espeto de Carne" }).locator('button:has-text("Salvar")').click();
await esperar();
await enviarCozinha();
const papel2 = await page.locator("body").innerText();
check("11b. 2º envio: só o Bife novo + Espeto com OBS, marcado '2º pedido'",
  papel2.includes("2º pedido da mesa") &&
    papel2.includes("1X BIFE ANCHO") &&
    papel2.includes("1X ESPETO DE CARNE") &&
    papel2.includes("OBS: bem passado") &&
    !papel2.includes("RODÍZIO"));
await page.screenshot({ path: `${PRINTS}40-papel-cozinha-2.png` });

// 12. reimprimir mostra o ultimo envio
await page.goto(`${BASE}/mesa/${MA}`);
await esperar();
await page.locator("text=Reimprimir último envio").click();
await page.waitForURL(new RegExp(`/cozinha/${MA}\\?em=`));
await esperar();
const reimpresso = await page.locator("body").innerText();
check("12. Reimprimir traz o 2º envio de novo", reimpresso.includes("ESPETO DE CARNE") && !reimpresso.includes("RODÍZIO"));

// 13. remover item enviado pede confirmacao
await page.goto(`${BASE}/mesa/${MA}`);
await esperar();
let perguntou = "";
page.once("dialog", (d) => { perguntou = d.message(); d.dismiss(); });
await page.locator("li", { hasText: "Espeto de Carne" }).locator('button:has-text("Remover")').click();
await page.waitForTimeout(500);
const aindaLa = await page.locator("li", { hasText: "Espeto de Carne" }).count();
page.once("dialog", (d) => d.accept());
await page.locator("li", { hasText: "Espeto de Carne" }).locator('button:has-text("Remover")').click();
await esperar();
await page.waitForTimeout(500);
const removido = (await page.locator("li", { hasText: "Espeto de Carne" }).count()) === 0;
check("13. Remover item já enviado pergunta antes (cancelar mantém, ok remove)",
  perguntou.includes("cozinha") && aindaLa === 1 && removido);

// 14. fechar conta com comida pendente avisa
await lancar("Sobremesa", "Pudim");
await esperar();
await page.locator('button:has-text("Fechar conta")').first().click();
await page.waitForURL(/aviso=cozinha/);
await esperar();
const aviso = await page.locator("text=Tem comida que não foi pra cozinha").isVisible();
await page.screenshot({ path: `${PRINTS}41-aviso-fechar.png` });
check("14. Fechar conta com Pudim pendente mostra o aviso", aviso);

// 15. "Enviar pra cozinha agora" a partir do aviso, depois volta sozinho (afterprint)
await page.evaluate(() => localStorage.setItem("simularImpressao", "1"));
await page.locator('button:has-text("Enviar pra cozinha agora")').click();
await page.waitForURL(`${BASE}/mesa/${MA}`, { timeout: 10000 });
await esperar();
check("15. envio pelo aviso imprime e volta sozinho pra comanda",
  (await page.locator('button:has-text("Enviar para cozinha")').first().isDisabled()) &&
    !(await page.locator("text=Tem comida que não foi pra cozinha").isVisible()));
await page.evaluate(() => localStorage.removeItem("simularImpressao"));

// 16. fechar conta sem pendencia vai direto; recibo tem tudo com preco
await page.locator('button:has-text("Fechar conta")').first().click();
await page.waitForURL(`${BASE}/mesa/${MA}/fechamento`);
await esperar();
const [recibo] = await Promise.all([
  context.waitForEvent("page"),
  page.locator('button:has-text("Fechar conta e imprimir recibo")').click(),
]);
await recibo.waitForLoadState("networkidle");
const reciboTxt = await recibo.locator("body").innerText();
check("16. recibo do cliente tem comida + bebida com preço (igual antes)",
  reciboTxt.includes("Chopp Brahma") && reciboTxt.includes("Bife Ancho") && reciboTxt.includes("R$") &&
    reciboTxt.includes("RECIBO NÃO FISCAL") && !reciboTxt.includes("Acomp"));
await recibo.close();

// 17. pagamento completo
await page.locator('button:has-text("Exato")').first().click();
await page.locator('button:has-text("Confirmar pagamento")').click();
await page.waitForURL(`${BASE}/`, { timeout: 10000 });
await esperar();
const mesa1Livre = await page.locator("form", { hasText: LABEL_A }).first().innerText();
check("17. pagamento confirmado: mesa do teste volta a Livre", mesa1Livre.includes("Livre"));

// 18. balcao tambem envia pra cozinha
await abrirMesa(99);
await lancar("Vulcan Burgers", "Vulcan Fire");
await esperar();
await enviarCozinha();
const papelBalcao = await page.locator("body").innerText();
check("18. Balcão: papel 'COZINHA - BALCÃO (RETIRADA)' com o burger",
  papelBalcao.includes("COZINHA - BALCÃO (RETIRADA)") && papelBalcao.includes("1X VULCAN FIRE"));

// 19. tela de categorias mostra a configuracao
await page.goto(`${BASE}/produtos/categorias`);
await esperar();
const linhaExec = page.locator("form", { has: page.locator('input[value="Vulcan Executivos"]') });
const linhaBebidas = page.locator("form", { has: page.locator('input[value="Bebidas"]') });
check("19. Categorias: Executivos com 4 acomp. e cozinha; Bebidas sem cozinha",
  (await linhaExec.locator('input[name="qtd_acompanhamentos"]').inputValue()) === "4" &&
    (await linhaExec.locator('input[name="vai_cozinha"]').isChecked()) &&
    !(await linhaBebidas.locator('input[name="vai_cozinha"]').isChecked()));
await page.screenshot({ path: `${PRINTS}42-categorias-config.png`, fullPage: true });

// ---- correcoes de 13/10 noite (teste do Mateus) ----

// 20. popup nao confirma sem nenhum acompanhamento; "Outro" sozinho vale
await abrirMesa(MB);
await lancar("Vulcan Executivos", "Frango grelhado");
const popupVazio = page.locator("div.fixed", { hasText: "Escolha 4 acompanhamentos" });
const travadoVazio = await popupVazio.locator('button:has-text("Confirmar")').isDisabled();
await popupVazio.locator('input[placeholder^="Outro"]').fill("só salada");
const liberadoOutro = await popupVazio.locator('button:has-text("Confirmar")').isEnabled();
await popupVazio.locator('button:has-text("Confirmar")').click();
await page.waitForURL(new RegExp(`/mesa/${MB}`));
await esperar();
check("20. Confirmar travado sem escolha; 'Outro' sozinho libera",
  travadoVazio && liberadoOutro &&
    (await page.locator("li", { hasText: "Frango grelhado" }).innerText()).includes("Acomp: só salada"));

// 21. caso real do Mateus: digita "mal passada" e clica Enviar SEM Salvar
await lancar("Vulcan Burgers", "Vulcan Original");
await esperar();
await page.locator("li", { hasText: "Vulcan Original" }).locator('input[name="observacao"]').fill("mal passada");
await enviarCozinha();
const papelObs = await page.locator("body").innerText();
check("21. obs digitada sem clicar Salvar sai no papel (OBS: mal passada)",
  papelObs.includes("1X VULCAN ORIGINAL") && papelObs.includes("OBS: mal passada"));

// 22. obs grava sozinha ao sair do campo (sem Salvar), continua depois do F5
await page.goto(`${BASE}/mesa/${MB}`);
await esperar();
await lancar("Porções", "Batata Prime");
await esperar();
await page.locator("li", { hasText: "Batata Prime" }).locator('input[name="observacao"]').fill("sem bacon");
await page.locator("h2", { hasText: "Itens da comanda" }).click();
await page.locator("text=✓ salvo").waitFor({ timeout: 5000 }).catch(() => {});
await page.reload();
await esperar();
check("22. obs grava sozinha ao sair do campo e continua após F5",
  (await page.locator("li", { hasText: "Batata Prime" }).locator('input[name="observacao"]').inputValue()) === "sem bacon");

// 23. Fechar conta com obs digitada (sem salvar) num item pendente: obs nao se perde
await lancar("Espetos Defumados", "Espeto de Coração");
await esperar();
await page.locator("li", { hasText: "Espeto de Coração" }).locator('input[name="observacao"]').fill("bem assado");
await page.locator('button:has-text("Fechar conta")').first().click();
await page.waitForURL(/aviso=cozinha/);
await esperar();
await page.locator('button:has-text("Enviar pra cozinha agora")').click();
await page.waitForURL(new RegExp(`/cozinha/${MB}\\?em=`));
await esperar();
const papelFechar = await page.locator("body").innerText();
check("23. obs digitada antes de Fechar conta chega no papel pelo aviso",
  papelFechar.includes("ESPETO DE CORAÇÃO") && papelFechar.includes("OBS: bem assado") &&
    papelFechar.includes("OBS: sem bacon"));
await page.screenshot({ path: `${PRINTS}43-papel-obs.png` });

console.log(`\n${ok} passaram, ${fail} falharam`);
await browser.close();
process.exit(fail ? 1 : 0);
