/**
 * Apply Supabase migrations and seed catalog data.
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_DB_PASSWORD   (or SUPABASE_DB_URL / DATABASE_URL)
 *
 * Usage: npm run setup:supabase
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { getDatabaseUrl, loadEnvFile } from "./load-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "supabase", "migrations");

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = getDatabaseUrl();

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

if (!dbUrl) {
  console.error(
    [
      "Missing database connection.",
      "Add one of these to .env.local:",
      "  SUPABASE_DB_PASSWORD=your-db-password",
      "  SUPABASE_DB_URL=postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres",
      "",
      "Password: Supabase Dashboard → Project Settings → Database → Database password",
    ].join("\n"),
  );
  process.exit(1);
}

function migrationFiles() {
  return fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => path.join(migrationsDir, name));
}

async function tableExists(client, tableName) {
  const { rows } = await client.query(
    `select 1 from information_schema.tables where table_schema = 'public' and table_name = $1 limit 1`,
    [tableName],
  );
  return rows.length > 0;
}

async function applyMigrations(client) {
  const files = migrationFiles();
  console.log(`Applying ${files.length} migration file(s)...`);

  for (const file of files) {
    const sql = fs.readFileSync(file, "utf8");
    const name = path.basename(file);
    console.log(`→ ${name}`);
    try {
      await client.query(sql);
    } catch (err) {
      const msg = String(err.message ?? err);
      if (/already exists|duplicate key value/i.test(msg)) {
        console.warn(`  skipped (already applied): ${msg.split("\n")[0]}`);
        continue;
      }
      throw err;
    }
  }
}

async function verifySchema(supabase) {
  const checks = ["products", "product_images", "faq_items", "store_config", "analytics_events"];
  for (const table of checks) {
    const { error } = await supabase.from(table).select("*", { head: true, count: "exact" });
    if (error) throw new Error(`${table}: ${error.message}`);
  }

  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) throw bucketErr;
  const names = new Set((buckets ?? []).map((b) => b.name));
  for (const bucket of ["product-images", "hero-images"]) {
    if (!names.has(bucket)) {
      console.warn(`Storage bucket "${bucket}" not found — create it in Supabase Dashboard if uploads fail.`);
    }
  }
}

async function main() {
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const hasProducts = await tableExists(client, "products");
    if (hasProducts) {
      console.log("Schema already exists — running migrations idempotently...");
    }
    await applyMigrations(client);
  } finally {
    await client.end();
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  await verifySchema(supabase);
  console.log("Schema OK.");

  console.log("Seeding catalog...");
  const { spawnSync } = await import("node:child_process");
  const seed = spawnSync(process.execPath, ["scripts/seed-supabase.mjs"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (seed.status !== 0) process.exit(seed.status ?? 1);

  const { count, error } = await supabase
    .from("products")
    .select("*", { head: true, count: "exact" });
  if (error) throw error;

  console.log(`Setup complete. Products in Supabase: ${count ?? 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
