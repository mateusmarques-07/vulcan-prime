// Apaga comandas/fechamentos SO das mesas informadas e libera essas mesas -
// pra limpar teste automatico sem mexer em quem esta usando o sistema em
// outras mesas ao mesmo tempo. Uso:
//   node scripts/limpar-mesas-teste.mjs 5 6 99
import { readFileSync } from "node:fs";

const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const linha of envFile.split("\n")) {
  const [chave, ...resto] = linha.split("=");
  if (chave && resto.length) process.env[chave.trim()] ||= resto.join("=").trim();
}

const numeros = process.argv.slice(2).map(Number).filter(Boolean);
if (numeros.length === 0) {
  console.error("Informe os números das mesas. Ex: node scripts/limpar-mesas-teste.mjs 5 6 99");
  process.exit(1);
}

const URL_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const HEADERS = {
  apikey: process.env.SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
  "Content-Type": "application/json",
};
const lista = (ids) => `(${ids.join(",")})`;
const buscar = async (caminho) => (await fetch(`${URL_BASE}/${caminho}`, { headers: HEADERS })).json();
const apagar = async (caminho) =>
  (await fetch(`${URL_BASE}/${caminho}`, { method: "DELETE", headers: HEADERS })).status;

const mesas = await buscar(`mesas?select=id,numero&numero=in.${lista(numeros)}`);
const comandas = await buscar(`comandas?select=id&mesa_id=in.${lista(mesas.map((m) => m.id))}`);
const comandaIds = comandas.map((c) => c.id);

if (comandaIds.length > 0) {
  const fechamentos = await buscar(`fechamentos?select=id&comanda_id=in.${lista(comandaIds)}`);
  const fechamentoIds = fechamentos.map((f) => f.id);
  if (fechamentoIds.length > 0) {
    await apagar(`fechamento_pagamentos?fechamento_id=in.${lista(fechamentoIds)}`);
    await apagar(`fechamentos?id=in.${lista(fechamentoIds)}`);
  }
  await apagar(`itens_comanda?comanda_id=in.${lista(comandaIds)}`);
  await apagar(`comandas?id=in.${lista(comandaIds)}`);
}

await fetch(`${URL_BASE}/mesas?numero=in.${lista(numeros)}`, {
  method: "PATCH",
  headers: HEADERS,
  body: JSON.stringify({ status: "livre", gorjeta_ativa: false, gorjeta_pct: 10, qtd_pessoas: null }),
});

console.log(`Mesas ${numeros.join(", ")}: ${comandaIds.length} comanda(s) de teste apagada(s), mesas livres.`);
