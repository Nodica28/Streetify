// Quick smoke-test: confirms env vars work and the `insights` table exists.
// Run with: node scripts/verify-supabase.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local (minimal parser — enough for a smoke test)
try {
  const env = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* ignore */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const supa = createClient(url, key, { auth: { persistSession: false } });

console.log(`→ Connecting to ${url}`);

// Hit the REST endpoint directly so we get PostgREST's real error code
const probeRes = await fetch(`${url}/rest/v1/insights?select=slug&limit=1`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  },
});

if (probeRes.status === 404 || probeRes.status === 406) {
  const body = await probeRes.text();
  console.error(`✗ Table 'insights' not reachable (HTTP ${probeRes.status}).`);
  console.error(`  Response: ${body}`);
  console.error("");
  console.error("Please run the migration first:");
  console.error(
    `  1. Open https://supabase.com/dashboard/project/${new URL(url).hostname.split(".")[0]}/sql/new`,
  );
  console.error("  2. Paste the contents of supabase/migrations/0001_init.sql");
  console.error("  3. Click Run");
  process.exit(2);
}

if (!probeRes.ok) {
  console.error(`✗ Probe failed: HTTP ${probeRes.status}`);
  console.error(await probeRes.text());
  process.exit(3);
}

const { count, error } = await supa.from("insights").select("*", { count: "exact", head: true });
if (error) {
  console.error(`✗ Count failed: ${error.message}`);
  process.exit(3);
}

console.log(`✓ Connected. 'insights' table has ${count ?? 0} row(s).`);
