// Volta a numeração de Entregas pro #001 de novo. Só funciona se a tabela
// "entregas" estiver vazia (senão criaria um numero repetido) - por isso
// SEMPRE apagar os testes primeiro (ver scripts/limpar-banco-teste.mjs,
// ou fazer manualmente pelo Supabase). Uso:
//   node scripts/resetar-numeracao-entregas.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const linha of envFile.split("\n")) {
  const [chave, ...resto] = linha.split("=");
  if (chave && resto.length) process.env[chave.trim()] ||= resto.join("=").trim();
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const { rows } = await client.query("select count(*)::int as total from entregas");
if (rows[0].total > 0) {
  console.error(
    `Ainda tem ${rows[0].total} entrega(s) na tabela - apague os testes antes de resetar a numeração.`
  );
  await client.end();
  process.exit(1);
}

await client.query("alter table entregas alter column numero restart with 1");
console.log("Numeração de Entregas resetada - a próxima criada será a #001.");

await client.end();
