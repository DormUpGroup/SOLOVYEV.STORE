/**
 * Apply a single SQL migration file against the live/dev database.
 * Does NOT seed or wipe data.
 *
 * Usage: node scripts/apply-migration.mjs 011_clothing_type.sql
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { getDatabaseUrl, loadEnvFile } from "./load-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvFile(".env.local");
loadEnvFile(".env");

const name = process.argv[2];
if (!name) {
  console.error("Usage: node scripts/apply-migration.mjs <file.sql>");
  process.exit(1);
}

const file = path.join(root, "supabase", "migrations", name);
if (!fs.existsSync(file)) {
  console.error(`Migration not found: ${file}`);
  process.exit(1);
}

const dbUrl = getDatabaseUrl();
if (!dbUrl) {
  console.error("Missing SUPABASE_DB_PASSWORD / SUPABASE_DB_URL / DATABASE_URL");
  process.exit(1);
}

const sql = fs.readFileSync(file, "utf8");
const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  console.log(`Applying ${name}...`);
  await client.query(sql);
  console.log("Done.");
} finally {
  await client.end();
}
