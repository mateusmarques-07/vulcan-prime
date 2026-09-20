// Cria um novo usuário de login pro sistema (Supabase Auth). Uso:
//   node scripts/criar-usuario.mjs <usuario> <senha>
// O "usuario" vira "<usuario>@vulcanprime.local" no Supabase Auth (ver
// src/lib/auth.ts) - não precisa ser um e-mail de verdade, é só a forma de
// reaproveitar o Supabase Auth pra um login por usuário/senha simples.
// Usa a API REST direto (em vez do SDK) porque o SDK do supabase-js exige
// WebSocket nativo, que só existe a partir do Node 22 - este VPS roda Node 20.
import { readFileSync } from "node:fs";

const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const linha of envFile.split("\n")) {
  const [chave, ...resto] = linha.split("=");
  if (chave && resto.length) process.env[chave.trim()] ||= resto.join("=").trim();
}

const [usuario, senha] = process.argv.slice(2);
if (!usuario || !senha) {
  console.error("Uso: node scripts/criar-usuario.mjs <usuario> <senha>");
  process.exit(1);
}

const email = `${usuario}@vulcanprime.local`;
const resposta = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
  method: "POST",
  headers: {
    apikey: process.env.SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password: senha, email_confirm: true }),
});

const corpo = await resposta.json();
if (!resposta.ok) {
  console.error("Erro ao criar usuário:", corpo.msg ?? corpo.message ?? JSON.stringify(corpo));
  process.exit(1);
}

console.log(`Usuário criado: ${usuario} (id ${corpo.id})`);
