/**
 * LOCAL QA FIXTURE ONLY. A small Supabase-shaped HTTP adapter for disposable PG.
 * It is not Supabase Auth/PostgREST, and never loads .env or application data files.
 * Apply the project's migrations to a zenlove_qa_* database before starting it.
 */
import http from "node:http";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

export const QA_USERS = [
  { id: "11111111-1111-1111-1111-111111111111", email: "qa-a@example.test", token: "qa-user-a", refresh: "qa-refresh-a", name: "QA User A" },
  { id: "22222222-2222-2222-2222-222222222222", email: "qa-b@example.test", token: "qa-user-b", refresh: "qa-refresh-b", name: "QA User B" },
];
const SERVICE_KEY = "qa-service-key";
const ANON_KEY = "qa-anon-key";
const TEXT = "text";
const TABLES = {
  cards: { primary: ["id"], columns: {
    id: TEXT, slug: TEXT, name: TEXT, templateId: TEXT, templateName: TEXT, status: TEXT,
    updatedAt: "timestamptz", views: "integer", coverImage: TEXT, story: TEXT,
    weddingDate: "date", weddingTime: "time", lunarDate: TEXT, groom: "jsonb", bride: "jsonb",
    events: "jsonb", albumImages: "jsonb", pageData: TEXT, musicUrl: TEXT, musicTitle: TEXT,
    created_at: "timestamptz", user_id: "uuid",
  } },
  rsvps: { primary: ["id"], columns: {
    id: TEXT, cardId: TEXT, name: TEXT, phone: TEXT, attending: "boolean", guests: "integer",
    note: TEXT, checkedIn: "boolean", checkedInAt: "timestamptz", tableNumber: TEXT, createdAt: "timestamptz",
  } },
  wishes: { primary: ["id"], columns: {
    id: TEXT, cardId: TEXT, name: TEXT, content: TEXT, createdAt: "timestamptz",
  } },
  payment_transactions: { primary: ["reference_code"], columns: {
    reference_code: TEXT, amount: "numeric", card_id: TEXT, content: TEXT,
    claimed_at: "timestamptz", claim_token: TEXT, processed_at: "timestamptz",
  } },
  guest_crm: { primary: ["cardId", "id"], columns: {
    cardId: TEXT, id: TEXT, name: TEXT, phone: TEXT, email: TEXT, group: TEXT, tableNumber: TEXT,
    estimatedGuests: "integer", status: TEXT, notes: TEXT, checkedIn: "boolean", checkedInAt: "timestamptz",
    rsvpId: TEXT, createdAt: "timestamptz", updatedAt: "timestamptz", deletedAt: "timestamptz",
  } },
};

class FixtureError extends Error {
  constructor(status, message, code = "QA_FIXTURE_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function validateQaDatabaseUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("ZENLOVE_QA_DATABASE_URL must be an explicit local disposable database URL"); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
      !/^\/zenlove_qa_[a-z0-9_]+$/.test(url.pathname) || url.search || url.hash) {
    throw new Error("QA fixture refuses non-local databases, non-zenlove_qa_* names, and URL query overrides");
  }
  return url;
}

// Input never becomes SQL syntax: UTF-8 values travel as a base64-only SQL literal.
// This also keeps large editor payloads out of Windows' limited command-line argv.
export function sqlValue(value, type = TEXT) {
  const encoded = Buffer.from(String(value), "utf8").toString("base64");
  return `convert_from(decode('${encoded}','base64'),'UTF8')::${type}`;
}
const jsonValue = (value) => sqlValue(JSON.stringify(value), "jsonb");
const identifier = (name) => `"${name}"`;

function column(table, name) {
  if (!Object.hasOwn(TABLES[table].columns, name)) {
    throw new FixtureError(400, "Unsupported fixture column", "PGRST204");
  }
  return identifier(name);
}

function filterExpression(table, name, filter) {
  const key = `target.${column(table, name)}`;
  if (filter === "is.null") return `${key} IS NULL`;
  if (filter === "not.is.null") return `${key} IS NOT NULL`;
  for (const [prefix, operator] of [["eq.", "="], ["lt.", "<"], ["lte.", "<="], ["gt.", ">"], ["gte.", ">="]]) {
    if (filter.startsWith(prefix)) {
      return `${key} ${operator} ${sqlValue(filter.slice(prefix.length), TABLES[table].columns[name])}`;
    }
  }
  throw new FixtureError(400, "Unsupported fixture filter");
}

function filters(table, params) {
  const expressions = [];
  for (const [name, filter] of params) {
    if (["select", "order", "limit", "offset", "on_conflict"].includes(name)) continue;
    if (name === "or") {
      if (!filter.startsWith("(") || !filter.endsWith(")")) throw new FixtureError(400, "Invalid OR filter");
      const parts = filter.slice(1, -1).split(",").map((part) => {
        const match = /^([A-Za-z_][A-Za-z0-9_]*)\.(eq\.[\s\S]*)$/.exec(part);
        if (!match) throw new FixtureError(400, "Unsupported OR filter");
        return filterExpression(table, match[1], match[2]);
      });
      expressions.push(`(${parts.join(" OR ")})`);
    } else {
      expressions.push(filterExpression(table, name, filter));
    }
  }
  return expressions.length ? ` WHERE ${expressions.join(" AND ")}` : "";
}

function selection(table, select = "*") {
  const parts = select.split(/,(?![^()]*\))/);
  const selected = [];
  for (const item of parts) {
    if (item === "*") selected.push("target.*");
    else if (table === "cards" && ["rsvps(*)", "wishes(*)"].includes(item)) {
      const relation = item.slice(0, item.indexOf("("));
      selected.push(`COALESCE((SELECT jsonb_agg(to_jsonb(child)) FROM public.${identifier(relation)} AS child WHERE child."cardId"=target.id),'[]'::jsonb) AS ${identifier(relation)}`);
    } else selected.push(`target.${column(table, item)}`);
  }
  return selected.join(",");
}

function resultRows(statement) {
  return `WITH result AS (${statement}) SELECT COALESCE(jsonb_agg(to_jsonb(result)),'[]'::jsonb)::text FROM result;`;
}

export function buildRestSql(table, method, params, body, prefer = "") {
  if (!Object.hasOwn(TABLES, table)) throw new FixtureError(404, "Unsupported fixture table");
  const predicate = filters(table, params);
  if (method === "GET") {
    const orders = (params.get("order") || "").split(",").filter(Boolean).map((order) => {
      const [name, direction = "asc"] = order.split(".");
      if (!["asc", "desc"].includes(direction)) throw new FixtureError(400, "Unsupported fixture sort");
      return `target.${column(table, name)} ${direction.toUpperCase()}`;
    });
    const limit = Number(params.get("limit") || 1000);
    const offset = Number(params.get("offset") || 0);
    if (!Number.isSafeInteger(limit) || limit < 0 || limit > 10000 || !Number.isSafeInteger(offset) || offset < 0) {
      throw new FixtureError(400, "Invalid fixture pagination");
    }
    return resultRows(`SELECT ${selection(table, params.get("select") || "*")} FROM public.${identifier(table)} AS target${predicate}${orders.length ? ` ORDER BY ${orders.join(",")}` : ""} LIMIT ${limit} OFFSET ${offset}`);
  }
  if (method === "DELETE") return resultRows(`DELETE FROM public.${identifier(table)} AS target${predicate} RETURNING target.*`);
  if (!["POST", "PATCH"].includes(method)) throw new FixtureError(405, "Unsupported fixture method");
  const rows = method === "POST" && Array.isArray(body) ? body : [body];
  if (!rows.length) return "SELECT '[]';";
  if (rows.some((row) => !row || typeof row !== "object" || Array.isArray(row))) throw new FixtureError(400, "Expected JSON records");
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (!keys.length) throw new FixtureError(400, "Empty fixture record");
  keys.forEach((key) => column(table, key));
  if (method === "PATCH") {
    if (Array.isArray(body)) throw new FixtureError(400, "PATCH expects an object");
    return resultRows(`UPDATE public.${identifier(table)} AS target SET ${keys.map((key) => `${column(table, key)}=input.${column(table, key)}`).join(",")} FROM jsonb_populate_record(NULL::public.${identifier(table)},${jsonValue(body)}) AS input${predicate} RETURNING target.*`);
  }
  const primary = TABLES[table].primary;
  if (params.has("on_conflict") && params.get("on_conflict") !== primary.join(",")) throw new FixtureError(400, "Unsupported fixture conflict target");
  let conflict = "";
  if (prefer.includes("resolution=ignore-duplicates")) conflict = ` ON CONFLICT (${primary.map(identifier).join(",")}) DO NOTHING`;
  else if (prefer.includes("resolution=merge-duplicates")) {
    const updates = keys.filter((key) => !primary.includes(key));
    conflict = ` ON CONFLICT (${primary.map(identifier).join(",")}) ${updates.length ? `DO UPDATE SET ${updates.map((key) => `${identifier(key)}=EXCLUDED.${identifier(key)}`).join(",")}` : "DO NOTHING"}`;
  }
  return resultRows(`INSERT INTO public.${identifier(table)} (${keys.map(identifier).join(",")}) SELECT ${keys.map((key) => `input.${identifier(key)}`).join(",")} FROM jsonb_populate_recordset(NULL::public.${identifier(table)},${jsonValue(rows)}) AS input WHERE TRUE${conflict} RETURNING *`);
}

function rpcSql(name, body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new FixtureError(400, "Expected RPC arguments");
  if (name === "increment_card_views") return `SELECT to_jsonb(public.increment_card_views(${sqlValue(body.card_key)}))::text;`;
  if (name === "save_card_content") return `SELECT COALESCE(public.save_card_content(${sqlValue(body.card_key)},${jsonValue(body.content)}),'null'::jsonb)::text;`;
  if (name === "set_card_vip") {
    if (typeof body.enabled !== "boolean") throw new FixtureError(400, "enabled must be boolean");
    return `SELECT COALESCE(public.set_card_vip(${sqlValue(body.card_key)},${body.enabled ? "TRUE" : "FALSE"}),'null'::jsonb)::text;`;
  }
  throw new FixtureError(404, "Unsupported fixture RPC");
}

function principal(request) {
  const apiKey = request.headers.apikey;
  if (![SERVICE_KEY, ANON_KEY].includes(apiKey)) throw new FixtureError(401, "QA fixture requires a QA API key");
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "") || apiKey;
  if (token === SERVICE_KEY && apiKey === SERVICE_KEY) return { role: "service_role" };
  const user = QA_USERS.find((candidate) => candidate.token === token);
  if (user) return { role: "authenticated", user };
  if (token === ANON_KEY) return { role: "anon" };
  throw new FixtureError(401, "Invalid QA fixture token");
}

function userData(user) {
  return {
    id: user.id, email: user.email, created_at: "2026-11-04T00:00:00.000Z",
    app_metadata: { role: "user", provider: "email" },
    user_metadata: { full_name: user.name, ...user.metadata },
  };
}

function session(user) {
  return { access_token: user.token, refresh_token: user.refresh, token_type: "bearer", expires_in: 3600, user: userData(user) };
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16 * 1024 * 1024) throw new FixtureError(413, "Fixture request exceeds 16 MiB");
    chunks.push(chunk);
  }
  try { return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; }
  catch { throw new FixtureError(400, "Invalid fixture JSON"); }
}

export async function createQaFixtureServer({ databaseUrl, psql = process.env.ZENLOVE_QA_PSQL || "psql" }) {
  const validated = validateQaDatabaseUrl(databaseUrl);
  const execute = (statement, identity = { role: "service_role" }) => new Promise((resolve, reject) => {
    const child = spawn(psql, ["-X", "-q", "-t", "-A", "--no-password", "--set=ON_ERROR_STOP=1", "--set=VERBOSITY=sqlstate", "--dbname", validated.href], {
      shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PGCONNECT_TIMEOUT: "3", PGCLIENTENCODING: "UTF8" },
    });
    let output = "", errors = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { errors += chunk; });
    const timeout = setTimeout(() => { child.kill(); reject(new FixtureError(504, "QA fixture PostgreSQL command timed out")); }, 10000);
    child.on("error", () => { clearTimeout(timeout); reject(new FixtureError(503, "Cannot launch QA fixture psql")); });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        const sqlstate = /ERROR:\s+([0-9A-Z]{5})\b/.exec(errors)?.[1] || "QA_DATABASE_ERROR";
        const status = sqlstate === "42501" ? 403 : ["23505", "23503"].includes(sqlstate) ? 409 :
          ["22P02", "22007", "23502", "23514"].includes(sqlstate) ? 400 : sqlstate === "57014" ? 504 : 500;
        reject(new FixtureError(status, `QA fixture database rejected the request (${sqlstate})`, sqlstate));
      } else {
        try { resolve(JSON.parse(output.trim())); }
        catch { reject(new FixtureError(500, "Invalid JSON returned by QA fixture PostgreSQL")); }
      }
    });
    // All role names below are constants from principal(); values remain encoded literals.
    child.stdin.end(`BEGIN;
SET LOCAL standard_conforming_strings=on;
SET LOCAL statement_timeout='5000ms';
SET LOCAL ROLE ${identity.role};
SET LOCAL request.jwt.claim.sub='${identity.user?.id || ""}';
${statement}
COMMIT;
`);
  });
  const current = await execute("SELECT jsonb_build_object('database',current_database())::text;");
  if (`/${current.database}` !== validated.pathname) throw new Error("QA fixture connected to an unexpected database");

  const server = http.createServer(async (request, response) => {
    const origin = request.headers.origin;
    if (origin && /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(origin)) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
      response.setHeader("Access-Control-Allow-Headers", "authorization, apikey, content-type, prefer");
      response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, PUT, OPTIONS");
    }
    const send = (status, data) => {
      response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
        "X-ZenLove-QA-Fixture": "local-postgresql-adapter-only",
      });
      response.end(JSON.stringify(data));
    };
    try {
      if (request.method === "OPTIONS") return send(204, null);
      const url = new URL(request.url, "http://127.0.0.1");
      if (url.pathname === "/__qa/health") return send(200, { testOnly: true, adapter: "local PostgreSQL QA fixture", database: current.database });
      if (url.pathname === "/auth/v1/token" && request.method === "POST") {
        if (request.headers.apikey !== ANON_KEY) throw new FixtureError(401, "Invalid QA anon key");
        const body = await readBody(request);
        const user = url.searchParams.get("grant_type") === "refresh_token"
          ? QA_USERS.find((candidate) => candidate.refresh === body.refresh_token)
          : QA_USERS.find((candidate) => candidate.email === body.email && body.password === "qa-password");
        if (!user) throw new FixtureError(400, "Invalid QA fixture credentials");
        return send(200, session(user));
      }
      const identity = principal(request);
      if (url.pathname === "/auth/v1/user") {
        if (!identity.user) throw new FixtureError(401, "A QA user token is required");
        if (request.method === "PUT") {
          const body = await readBody(request);
          identity.user.metadata = { ...identity.user.metadata, ...body.data };
        } else if (request.method !== "GET") throw new FixtureError(405, "Unsupported QA auth method");
        return send(200, userData(identity.user));
      }
      if (url.pathname === "/auth/v1/admin/users" && request.method === "GET") {
        if (identity.role !== "service_role") throw new FixtureError(403, "QA service role is required");
        return send(200, { users: QA_USERS.map(userData) });
      }
      const rpc = /^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(url.pathname);
      if (rpc && request.method === "POST") return send(200, await execute(rpcSql(rpc[1], await readBody(request)), identity));
      const table = /^\/rest\/v1\/([a-z_]+)$/.exec(url.pathname);
      if (!table) throw new FixtureError(404, "Unsupported QA fixture endpoint");
      const body = ["POST", "PATCH"].includes(request.method) ? await readBody(request) : undefined;
      const query = buildRestSql(table[1], request.method, url.searchParams, body, request.headers.prefer || "");
      return send(request.method === "POST" ? 201 : 200, await execute(query, identity));
    } catch (error) {
      send(error.status || 500, { code: error.code || "QA_FIXTURE_ERROR", message: error.status ? error.message : "QA fixture request failed" });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const port = Number(process.env.ZENLOVE_QA_PORT || 55433);
    if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid ZENLOVE_QA_PORT");
    const server = await createQaFixtureServer({ databaseUrl: process.env.ZENLOVE_QA_DATABASE_URL });
    server.listen(port, "127.0.0.1", () => console.log(`[LOCAL QA FIXTURE ONLY] http://127.0.0.1:${port}`));
    for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
