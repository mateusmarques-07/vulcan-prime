// Apaga TODAS as comandas/fechamentos/entregas (inclusive finalizadas) e
// devolve as 12 mesas pro estado "livre". Serve pra limpar testes antes de
// o cliente começar a usar de verdade - não é algo pra rodar com vendas
// reais no banco! Depois de limpar, rode
// scripts/resetar-numeracao-entregas.mjs se quiser as Entregas voltando
// a contar do #001. Uso:
//   node scripts/limpar-banco-teste.mjs
import { readFileSync } from "node:fs";

const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const linha of envFile.split("\n")) {
  const [chave, ...resto] = linha.split("=");
  if (chave && resto.length) process.env[chave.trim()] ||= resto.join("=").trim();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const HEADERS = {
  apikey: process.env.SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
  "Content-Type": "application/json",
};

async function apagarTudo(tabela) {
  const resposta = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?id=not.is.null`, {
    method: "DELETE",
    headers: HEADERS,
  });
  console.log(`${tabela}: ${resposta.status}`);
}

// ordem importa: primeiro quem depende (itens/pagamentos), depois quem é
// referenciado (comandas/fechamentos/entregas)
for (const tabela of [
  "fechamento_pagamentos",
  "entrega_itens",
  "entregas",
  "fechamentos",
  "itens_comanda",
  "comandas",
]) {
  await apagarTudo(tabela);
}

const resetMesas = await fetch(`${SUPABASE_URL}/rest/v1/mesas?id=not.is.null`, {
  method: "PATCH",
  headers: HEADERS,
  body: JSON.stringify({ status: "livre", gorjeta_ativa: false, gorjeta_pct: 10, qtd_pessoas: null }),
});
console.log(`mesas: ${resetMesas.status}`);

console.log("\nBanco limpo. Se quiser as Entregas voltando a contar do #001:");
console.log("  node scripts/resetar-numeracao-entregas.mjs");
