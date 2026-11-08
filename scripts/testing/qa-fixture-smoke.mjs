/** Positive adapter smoke checks. Mutates only generated records in a guarded QA database. */
import assert from "node:assert/strict";

const base = new URL(process.env.ZENLOVE_QA_FIXTURE_URL || "http://127.0.0.1:55433");
if (base.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname) || base.pathname !== "/") {
  throw new Error("Fixture smoke refuses non-local URLs");
}
const service = { apikey: "qa-service-key", Authorization: "Bearer qa-service-key" };
const actor = (token) => ({ apikey: "qa-anon-key", Authorization: `Bearer ${token}` });
let checks = 0;
async function call(path, { method = "GET", body, headers = service, status = 200 } = {}) {
  const response = await fetch(new URL(path, base), {
    method, headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(result)}`);
  checks++;
  return result;
}

const health = await call("/__qa/health");
assert.equal(health.testOnly, true);
assert.match(health.database, /^zenlove_qa_[a-z0-9_]+$/);
const id = `qa-adapter-smoke-${Date.now()}`;
let created = false;
try {
  const login = await call("/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: "qa-anon-key" }, body: { email: "qa-a@example.test", password: "qa-password" },
  });
  assert.equal(login.access_token, "qa-user-a");
  const attack = "literal '; DROP TABLE public.cards; --\\n\\! echo unsafe 💌";
  const card = { id, slug: id, name: "QA fixture card", status: "draft",
    user_id: "11111111-1111-1111-1111-111111111111", story: attack,
    groom: { name: "QA A", userId: "11111111-1111-1111-1111-111111111111", isVip: false },
    bride: { name: "QA B" }, albumImages: [], weddingDate: "2026-12-01" };
  const inserted = await call("/rest/v1/cards", { method: "POST", body: card, status: 201 });
  created = true;
  assert.equal(inserted[0].story, attack);
  assert.equal((await call(`/rest/v1/cards?id=eq.${id}`, { headers: actor("qa-user-a") })).length, 1);
  assert.equal((await call(`/rest/v1/cards?id=eq.${id}`, { headers: actor("qa-user-b") })).length, 0);
  assert.equal((await call(`/rest/v1/cards?id=eq.${id}`, { headers: actor("qa-anon-key") })).length, 0);
  await call(`/rest/v1/cards?id=eq.${id}`, { method: "PATCH", headers: actor("qa-user-a"), body: { name: "Direct client overwrite" }, status: 403 });
  await call("/rest/v1/cards", { method: "POST", body: { ...card, name: "Duplicate overwrite" }, status: 409 });
  const vip = await call("/rest/v1/rpc/set_card_vip", { method: "POST", body: { card_key: id, enabled: true } });
  assert.equal(vip.groom.isVip, true);
  const saved = await call("/rest/v1/rpc/save_card_content", { method: "POST", body: {
    card_key: id, content: { name: "Saved fixture", story: attack, groom: { isVip: false, plan: "free", name: "Edited QA A" } },
  } });
  assert.equal(saved.groom.isVip, true);
  assert.equal(saved.groom.name, "Edited QA A");
  assert.equal(saved.story, attack);
  await call("/rest/v1/rpc/set_card_vip", { method: "POST", headers: actor("qa-user-a"), body: { card_key: id, enabled: true }, status: 403 });
  assert.equal(await call("/rest/v1/rpc/increment_card_views", { method: "POST", body: { card_key: id } }), 1);
  await call("/rest/v1/rsvps", { method: "POST", body: { id: `${id}-rsvp`, cardId: id, name: "QA guest", phone: "0900000000" }, status: 201 });
  const embedded = await call(`/rest/v1/cards?id=eq.${id}&select=*,rsvps(*),wishes(*)`, { headers: actor("qa-user-a") });
  assert.equal(embedded[0].rsvps.length, 1);
  const guest = { cardId: id, id: `${id}-guest`, name: "Manual QA guest", group: "friends", estimatedGuests: 2, status: "not_sent" };
  const guestPath = `/rest/v1/guest_crm?cardId=eq.${id}&on_conflict=cardId,id`;
  const importHeaders = { ...service, Prefer: "resolution=ignore-duplicates,return=representation" };
  assert.equal((await call(guestPath, { method: "POST", body: [guest], headers: importHeaders, status: 201 })).length, 1);
  assert.deepEqual(await call(guestPath, { method: "POST", body: [guest], headers: importHeaders, status: 201 }), []);
  const crm = await call(`/rest/v1/guest_crm?cardId=eq.${id}&id=eq.${guest.id}&deletedAt=is.null`, {
    method: "PATCH", body: { tableNumber: "QA Table 4", checkedIn: true },
  });
  assert.equal(crm[0].tableNumber, "QA Table 4");
  assert.equal(crm[0].checkedIn, true);
  await call(`/rest/v1/guest_crm?cardId=eq.${id}`, { headers: actor("qa-user-a"), status: 403 });
  await call("/rest/v1/rpc/save_card_content", { method: "POST", body: { card_key: id, content: { status: "published" } } });
  assert.equal((await call(`/rest/v1/cards?id=eq.${id}`, { headers: actor("qa-anon-key") })).length, 1);
  console.log(`[LOCAL QA FIXTURE ONLY] ${checks} HTTP checks passed against disposable PostgreSQL.`);
} finally {
  if (created) await call(`/rest/v1/cards?id=eq.${id}`, { method: "DELETE" });
}
