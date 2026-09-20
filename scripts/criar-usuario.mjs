// Cria (ou, se já existir, atualiza a senha de) um usuário de login do
// sistema. Uso:
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const HEADERS = {
  apikey: process.env.SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
  "Content-Type": "application/json",
};
const email = `${usuario}@vulcanprime.local`;

const criar = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ email, password: senha, email_confirm: true }),
});
const corpoCriar = await criar.json();

if (criar.ok) {
  console.log(`Usuário criado: ${usuario} (id ${corpoCriar.id})`);
  process.exit(0);
}

// Já existe: acha o usuário pelo e-mail e troca a senha dele em vez de
// tentar duplicar.
const busca = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
  headers: HEADERS,
});
const corpoBusca = await busca.json();
const usuarioExistente = corpoBusca.users?.[0];

if (!usuarioExistente) {
  console.error("Erro ao criar usuário:", corpoCriar.msg ?? corpoCriar.message ?? JSON.stringify(corpoCriar));
  process.exit(1);
}

const atualizar = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${usuarioExistente.id}`, {
  method: "PUT",
  headers: HEADERS,
  body: JSON.stringify({ password: senha }),
});

if (!atualizar.ok) {
  const corpoAtualizar = await atualizar.json();
  console.error("Erro ao atualizar senha:", corpoAtualizar.msg ?? corpoAtualizar.message ?? JSON.stringify(corpoAtualizar));
  process.exit(1);
}

console.log(`Usuário "${usuario}" já existia - senha atualizada.`);
