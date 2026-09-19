import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const migrationsDir = path.join(import.meta.dirname, "..", "supabase", "migrations");

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("Defina SUPABASE_DB_URL antes de rodar este script.");
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

await client.connect();
try {
  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    console.log(`Aplicando ${file}...`);
    await client.query(sql);
    console.log(`OK: ${file}`);
  }
} finally {
  await client.end();
}
