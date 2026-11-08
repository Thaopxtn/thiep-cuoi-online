import { spawn } from "node:child_process";
import { readFile, mkdir, appendFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, "test-reports", "continuation-db.log");

export function parseQaDatabaseUrl(value) {
  if (!value) throw new Error("Set ZENLOVE_QA_DATABASE_URL to a disposable localhost zenlove_qa_* database");
  let url;
  try { url = new URL(value); } catch { throw new Error("Invalid QA database URL"); }
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      !/^zenlove_qa_[A-Za-z0-9_]+$/.test(database) || url.search || url.hash) {
    throw new Error("QA verification requires localhost and a zenlove_qa_* database; remote or application databases are refused");
  }
  return { host: url.hostname.replace(/^\[|\]$/g, ""), port: url.port || "5432", database, user: decodeURIComponent(url.username || "postgres"), password: decodeURIComponent(url.password) };
}

function psqlSession(config, applicationName) {
  const binary = process.env.ZENLOVE_QA_PSQL_BIN || (process.platform === "win32" ? "C:/Program Files/PostgreSQL/13/bin/psql.exe" : "psql");
  const args = ["-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", "--host", config.host, "--port", config.port, "--username", config.user, "--dbname", config.database];
  const child = spawn(binary, args, {
    cwd: root, shell: false, windowsHide: true,
    env: { ...process.env, PGAPPNAME: applicationName, PGCONNECT_TIMEOUT: "5", PGPASSWORD: config.password },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = "", stderr = "", finished = false;
  const waiting = new Set();
  const notify = () => { for (const callback of waiting) callback(); };
  child.stdout.on("data", (chunk) => { stdout += chunk.toString(); notify(); });
  child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
  const timeout = setTimeout(() => child.kill(), 25000);
  const completion = new Promise((resolve, reject) => {
    child.once("error", (error) => { clearTimeout(timeout); finished = true; notify(); reject(new Error(`psql could not start: ${error.code || "unknown error"}`)); });
    child.once("close", (code) => {
      clearTimeout(timeout); finished = true; notify();
      if (code === 0) resolve(stdout.trim());
      else {
        const safeError = config.password ? stderr.split(config.password).join("[redacted]") : stderr;
        reject(new Error(`psql failed (${code}): ${safeError.trim().slice(0, 3000)}`));
      }
    });
  });
  completion.catch(() => {});
  child.stdin.on("error", () => {});
  return {
    completion,
    send: (sql) => child.stdin.write(sql),
    end: (sql = "") => child.stdin.end(sql),
    stop: () => child.kill(),
    get finished() { return finished; },
    waitFor: (marker) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => { waiting.delete(check); reject(new Error(`Timed out waiting for ${marker}`)); }, 10000);
      const check = () => {
        if (stdout.includes(marker)) { clearTimeout(timer); waiting.delete(check); resolve(); }
        else if (finished) { clearTimeout(timer); waiting.delete(check); reject(new Error("psql session ended before the lock handshake")); }
      };
      waiting.add(check); check();
    }),
  };
}

async function runSql(config, sql, applicationName = "zenlove-qa-verifier") {
  const session = psqlSession(config, applicationName);
  session.end(`SET client_min_messages=WARNING; SET statement_timeout='15s';\n${sql}\n`);
  return session.completion;
}

const literal = (value) => `'${String(value).replace(/'/g, "''")}'`;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function verifyInterleaving(config, firstKind) {
  const suffix = randomUUID().replaceAll("-", "");
  const id = `qa-race-${firstKind}-${suffix}`;
  const name = `Newest ${firstKind} content`;
  const baseSql = `SET LOCAL ROLE service_role;`;
  const content = { id: "forged", user_id: "22222222-2222-2222-2222-222222222222", views: 0, name,
    groom: { name, userId: "22222222-2222-2222-2222-222222222222", isVip: false, plan: "free", showWatermark: true }, albumImages: [], musicUrl: "", story: "" };
  const contentWrite = `SELECT public.save_card_content(${literal(id)},${literal(JSON.stringify(content))}::JSONB) IS NOT NULL;`;
  const vipWrite = `SELECT public.set_card_vip(${literal(id)},TRUE) IS NOT NULL;`;
  let first, second;
  try {
    await runSql(config, `INSERT INTO public.cards(id,slug,name,status,user_id,views,groom) VALUES (${literal(id)},${literal(id)},'Original','draft','11111111-1111-1111-1111-111111111111',42,'{"name":"Original","userId":"11111111-1111-1111-1111-111111111111","isVip":false,"plan":"free","showWatermark":true}');`);
    first = psqlSession(config, `zenlove-qa-${suffix}-first`);
    first.send(`SET client_min_messages=WARNING; SET statement_timeout='15s'; SET idle_in_transaction_session_timeout='20s'; BEGIN; ${baseSql}\n${firstKind === "content" ? contentWrite : vipWrite}\n\\echo LOCK_HELD_${suffix}\n`);
    await first.waitFor(`LOCK_HELD_${suffix}`);

    const secondName = `zenlove-qa-${suffix}-second`;
    second = psqlSession(config, secondName);
    second.end(`SET client_min_messages=WARNING; SET statement_timeout='15s'; BEGIN; ${baseSql}\n${firstKind === "content" ? vipWrite : contentWrite}\nCOMMIT;\n`);
    const deadline = Date.now() + 7000;
    let observedLockWait = false;
    while (Date.now() < deadline) {
      const wait = await runSql(config, `SELECT COALESCE(wait_event_type,'') FROM pg_stat_activity WHERE application_name=${literal(secondName)} AND state='active';`);
      if (wait.split(/\r?\n/).includes("Lock")) { observedLockWait = true; break; }
      if (second.finished) break;
      await delay(30);
    }
    if (!observedLockWait) throw new Error(`Did not observe the second ${firstKind === "content" ? "VIP" : "content"} writer waiting on the first transaction`);
    first.end("COMMIT;\n");
    await Promise.all([first.completion, second.completion]);
    await runSql(config, `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.cards WHERE id=${literal(id)} AND name=${literal(name)} AND groom->>'name'=${literal(name)}
        AND user_id='11111111-1111-1111-1111-111111111111' AND views=42
        AND groom->>'userId'='11111111-1111-1111-1111-111111111111'
        AND groom->'isVip'='true'::JSONB AND groom->>'plan'='vip' AND groom->'showWatermark'='false'::JSONB
        AND "albumImages"='[]'::JSONB AND "musicUrl"='' AND story='') THEN
        RAISE EXCEPTION 'Concurrent card writes lost current content or server metadata';
      END IF; END $$;`);
  } finally {
    first?.stop(); second?.stop();
    await Promise.allSettled([first?.completion, second?.completion]);
    await runSql(config, `DELETE FROM public.cards WHERE id=${literal(id)};`);
  }
}

export async function verifyDatabase() {
  const config = parseQaDatabaseUrl(process.env.ZENLOVE_QA_DATABASE_URL);
  await mkdir(path.dirname(reportPath), { recursive: true });
  const log = async (message) => { console.log(message); await appendFile(reportPath, `${new Date().toISOString()} ${message}\n`, "utf8"); };
  await log(`Starting local database verification (${config.host}:${config.port}/${config.database})`);
  try {
    const bootstrap = await readFile(path.join(root, "scripts/testing/bootstrap-qa.sql"), "utf8");
    await runSql(config, bootstrap);
    await log("PASS isolated QA bootstrap");
    const migrations = ["supabase_schema.sql", "supabase_production_migration.sql", "supabase_card_write_migration.sql", "supabase_guest_crm_migration.sql"];
    for (let pass = 1; pass <= 2; pass++) {
      for (const filename of migrations) await runSql(config, await readFile(path.join(root, filename), "utf8"));
      await log(`PASS ordered schema/migration sequence ${pass}/2`);
    }
    for (const filename of ["scripts/test-database-security.sql", "scripts/test-guest-crm.sql", "scripts/test-card-writes.sql"]) {
      await runSql(config, await readFile(path.join(root, filename), "utf8"));
      await log(`PASS ${filename} (fixtures rolled back)`);
    }
    await verifyInterleaving(config, "content");
    await log("PASS concurrent content-lock -> VIP writer (real lock wait observed)");
    await verifyInterleaving(config, "vip");
    await log("PASS concurrent VIP-lock -> stale content writer (real lock wait observed)");
    await log("PASS database verification complete; database left running for HTTP/browser QA");
  } catch (error) {
    await log(`FAIL ${error instanceof Error ? error.message : "Database verification failed"}`);
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyDatabase().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
