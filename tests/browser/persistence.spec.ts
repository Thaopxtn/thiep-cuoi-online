import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const owner = { Authorization: "Bearer qa-user-a" };
const other = { Authorization: "Bearer qa-user-b" };
const fixture = "http://127.0.0.1:55433";
const created = new Set<string>();
const transactions = new Set<string>();
const nodes = {
  ROOT: { type: { resolvedName: "GeometricBox" }, props: { height: 1200, backgroundColor: "#fff" }, nodes: ["heading", "body"] },
  heading: { type: { resolvedName: "TextBox" }, props: { text: "ZENLOVE QA WEDDING", top: 100, left: 20, width: 300, height: 60 }, parent: "ROOT" },
  body: { type: { resolvedName: "TextBox" }, props: { text: "QA PRIVATE CONTENT", top: 200, left: 20, width: 300, height: 60 }, parent: "ROOT" },
};

async function jsonOk(response: { ok(): boolean; text(): Promise<string>; json(): Promise<unknown> }): Promise<any> {
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}
async function createCard(request: APIRequestContext, extra: Record<string, unknown> = {}) {
  const id = `qa-${randomUUID()}`;
  created.add(id);
  const result = await jsonOk(await request.post("/api/cards", { headers: owner, data: {
    id, slug: id, name: "QA isolated wedding", status: "draft", groom: { name: "QA Groom" }, bride: { name: "QA Bride" },
    weddingDate: "2026-12-20", weddingTime: "11:00", album: [], musicUrl: "", musicTitle: "", nodes, ...extra,
  } }));
  return result.card;
}
async function signIn(page: Page, request: APIRequestContext) {
  const login = await jsonOk(await request.post("/api/auth/login", { data: { email: "qa-a@example.test", password: "qa-password" } }));
  await page.addInitScript((user) => { localStorage.setItem("zenlove_auth_user", JSON.stringify(user)); }, login.user);
  await isolateMedia(page);
}
async function isolateMedia(page: Page) {
  // External decorative media isn't needed to verify persistence, and is kept offline in QA.
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/proxy-image") return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80"><rect width="60" height="80" fill="#d8c4ab"/></svg>' });
    return ["127.0.0.1", "localhost"].includes(url.hostname) || url.protocol === "data:" ? route.continue() : route.abort();
  });
}
async function manualSave(page: Page) {
  if (await page.getByTitle("Lưu bản thiết kế (Ctrl+S)").isVisible()) {
    await page.getByTitle("Lưu bản thiết kế (Ctrl+S)").click();
  } else {
    await page.getByTitle("Tùy chọn khác").click();
    await page.getByRole("button", { name: "Lưu bản thiết kế", exact: true }).click();
  }
}
async function openAlbum(page: Page) {
  const opened = page.getByText(/Đã mở thiệp cưới:/);
  await expect(opened).toBeVisible();
  await expect(opened).toBeHidden();
  const inspector = page.getByTitle("Đóng chỉnh sửa");
  if (await inspector.isVisible()) await inspector.click();
  const desktopAlbum = page.getByRole("button", { name: "Ảnh & Album", exact: true });
  if (await desktopAlbum.isVisible()) await desktopAlbum.click();
  else await page.getByRole("button", { name: "Ảnh cưới", exact: true }).click();
}
async function closeMobileDrawer(page: Page) {
  const close = page.getByTitle("Đóng bảng công cụ");
  if (await close.isVisible()) await close.click();
}

test.beforeAll(async ({ request }) => {
  const health = await jsonOk(await request.get(`${fixture}/__qa/health`));
  expect(health.testOnly).toBe(true);
  expect(health.database).toMatch(/^zenlove_qa_/);
});
test.afterEach(async ({ request }) => {
  for (const reference of Array.from(transactions)) {
    await request.delete(`${fixture}/rest/v1/payment_transactions?reference_code=eq.${reference}`, { headers: { apikey: "qa-service-key", Authorization: "Bearer qa-service-key" } });
    transactions.delete(reference);
  }
  for (const id of Array.from(created)) {
    await request.delete(`/api/cards/${id}`, { headers: owner });
    created.delete(id);
  }
});

test("clone → editor save → reload → publish → clean browser", async ({ page, request, browser }, testInfo) => {
  await signIn(page, request);
  const clone = await jsonOk(await request.post("/api/cards/clone", { headers: owner, data: {
    templateId: "8c5055d8-30db-4b38-8831-e11063e3d352", customGroom: "QA Groom", customBride: "QA Bride",
  } }));
  const card = clone.card;
  created.add(card.id);
  expect(card.status).toBe("draft");
  expect(Object.keys(card.nodes || {}).length).toBeGreaterThan(2);
  const album = ["/favicon.ico?qa-photo=1", "/favicon.ico?qa-photo=2"];
  await jsonOk(await request.put(`/api/cards/${card.id}`, { headers: owner, data: {
    album, musicUrl: "", musicTitle: "", showWishes: false, showRsvp: false, rsvpTitle: "", loveStory: [],
  } }));
  await page.goto(`/design-template/${card.id}`, { waitUntil: "domcontentloaded" });
  await openAlbum(page);
  await expect(page.getByRole("img", { name: /^Album ảnh cưới \d+$/ })).toHaveCount(2);
  await page.getByTitle("Đưa ảnh ra sau").first().click();
  await expect.poll(async () => (await (await request.get(`/api/cards/${card.id}`, { headers: owner })).json()).card.album).toEqual([...album].reverse());
  await closeMobileDrawer(page);
  await manualSave(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await openAlbum(page);
  await expect(page.getByRole("img", { name: "Album ảnh cưới 1", exact: true })).toHaveAttribute("src", /qa-photo(?:=|%3D)2/);
  await page.getByTitle("Xóa khỏi album cưới (không xóa ảnh khỏi máy)").first().click();
  await page.getByTitle("Xóa khỏi album cưới (không xóa ảnh khỏi máy)").first().click();
  await expect.poll(async () => (await (await request.get(`/api/cards/${card.id}`, { headers: owner })).json()).card.album).toEqual([]);
  const saved = (await jsonOk(await request.get(`/api/cards/${card.id}`, { headers: owner }))).card;
  expect(saved).toMatchObject({ album: [], musicUrl: "", musicTitle: "", showWishes: false, showRsvp: false, rsvpTitle: "", loveStory: [] });
  await closeMobileDrawer(page);
  // Publishing still uses the actual editor handler; the response is observed before assertion.
  const published = page.waitForResponse((r) => r.url().endsWith(`/api/cards/${card.id}/publish`) && r.request().method() === "POST");
  await page.getByTitle("Xuất bản thiệp cưới để chia sẻ").click();
  // This intentionally empty QA album produces the editor's completeness warning.
  await page.getByRole("button", { name: "Vẫn tiếp tục xuất bản", exact: true }).click();
  const pub = await jsonOk(await published);
  expect(pub.card.status).toBe("published");
  const clean = await browser.newContext(testInfo.project.use);
  try {
    const guestPage = await clean.newPage();
    await isolateMedia(guestPage);
    await guestPage.goto(`/show/${pub.card.slug}`, { waitUntil: "domcontentloaded" });
    const shown = await jsonOk(await clean.request.get(`/api/show/${pub.card.slug}`));
    expect(shown.card.album).toEqual([]);
    expect(shown.card.showWishes).toBe(false);
    expect(shown.card.userId).toBeUndefined();
    expect(await guestPage.evaluate(() => localStorage.getItem("zenlove_auth_user"))).toBeNull();
    await expect(guestPage.getByTitle("Về trang chủ ZenLove")).toBeVisible();
    await expect(guestPage.locator("audio")).toHaveCount(0);
    await guestPage.screenshot({ path: `output/playwright/${testInfo.project.name}-published.png`, fullPage: false });
  } finally { await clean.close(); }
});

test("owner isolation, direct REST denial, empty values, and concurrent VIP saves", async ({ request }) => {
  const card = await createCard(request);
  for (const method of ["get", "put", "delete"] as const) {
    const response = await request[method](`/api/cards/${card.id}`, { headers: other, ...(method === "put" ? { data: { name: "forged" } } : {}) });
    expect(response.status()).toBe(403);
  }
  expect((await request.post(`/api/cards/${card.id}/publish`, { headers: other })).status()).toBe(403);
  expect((await request.get(`/api/cards/${card.id}/guests`, { headers: other })).status()).toBe(403);
  const rest = { apikey: "qa-anon-key", Authorization: "Bearer qa-user-a" };
  expect((await request.patch(`${fixture}/rest/v1/cards?id=eq.${card.id}`, { headers: rest, data: { groom: { isVip: true } } })).status()).toBe(403);
  expect((await request.post(`${fixture}/rest/v1/rpc/set_card_vip`, { headers: rest, data: { card_key: card.id, enabled: true } })).status()).toBe(403);
  const name = "QA newest groom";
  const writes = await Promise.all([
    request.put(`/api/cards/${card.id}`, { headers: owner, data: { ...card, groom: { ...card.groom, name }, musicUrl: "", musicTitle: "", album: [], showWishes: false, wishesTitle: "", isVip: false, plan: "free" } }),
    request.patch("/api/admin/cards", { headers: { "x-admin-key": "qa-admin-api-key-local-only" }, data: { id: card.id, isVip: true } }),
  ]);
  for (const write of writes) await jsonOk(write);
  const saved = (await jsonOk(await request.get(`/api/cards/${card.id}`, { headers: owner }))).card;
  expect(saved).toMatchObject({ groom: { name }, isVip: true, plan: "vip", showWatermark: false, album: [], musicUrl: "", wishesTitle: "", showWishes: false });
});

test("CRM preserves manual metadata while RSVP and check-in persist across devices", async ({ page, request, browser }, testInfo) => {
  await signIn(page, request);
  const card = await createCard(request, { status: "published" });
  const guest = { id: `gst_${randomUUID()}`, name: "QA Manual Guest", phone: "0912345678", group: "vip", tableNumber: "QA Table 7", estimatedGuests: 2, status: "confirmed", notes: "QA manual notes" };
  await jsonOk(await request.post(`/api/cards/${card.id}/guests`, { headers: owner, data: { guests: [guest] } }));
  const rsvp = await jsonOk(await request.post(`/api/show/${card.slug}/rsvp`, { data: { name: guest.name, phone: guest.phone, attending: true, guests: 3, note: "QA RSVP" } }));
  expect(rsvp.success).toBe(true);
  await page.goto(`/checkin/${card.slug}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(guest.name, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(guest.tableNumber, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: `Điểm danh ${guest.name}`, exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: `Điểm danh ${guest.name}`, exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Điểm danh thành công!", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Hoàn tất & Tiếp tục đón khách", exact: true }).click();
  await expect(page.getByRole("button", { name: `Hủy điểm danh ${guest.name}`, exact: true })).toBeVisible();
  const loaded = await jsonOk(await request.get(`/api/cards/${card.id}/guests`, { headers: owner }));
  expect(loaded.guests[0]).toMatchObject({ id: guest.id, group: "vip", tableNumber: guest.tableNumber, notes: guest.notes, estimatedGuests: 2, status: "confirmed" });
  expect(loaded.rsvps[0]).toMatchObject({ checkedIn: true, guests: 3 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: `Hủy điểm danh ${guest.name}`, exact: true })).toBeVisible();
  await page.screenshot({ path: `output/playwright/${testInfo.project.name}-checkin.png`, fullPage: false });
  // A device without the old guest cache still sees the confirmed server state.
  const clean = await browser.newContext(testInfo.project.use);
  try {
    const second = await clean.newPage();
    await signIn(second, request);
    await second.goto(`/checkin/${card.slug}`, { waitUntil: "domcontentloaded" });
    await expect(second.getByRole("button", { name: `Hủy điểm danh ${guest.name}`, exact: true })).toBeVisible();
  } finally { await clean.close(); }
  await jsonOk(await request.delete(`/api/cards/${card.id}/guests/${guest.id}`, { headers: owner }));
  const stale = await jsonOk(await request.post(`/api/cards/${card.id}/guests`, { headers: owner, data: { guests: [guest] } }));
  expect(stale.guests.find((row: { id: string; deletedAt?: string }) => row.id === guest.id)?.deletedAt).toBeTruthy();
});

test("bulk dashboard invitations share CRM ids and preserve check-in while marking sent", async ({ page, request, browser }, testInfo) => {
  await signIn(page, request);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (text: string) => { (window as typeof window & { __qaCopiedInvite?: string }).__qaCopiedInvite = text; },
    } });
  });
  const card = await createCard(request, { status: "published", name: `QA bulk invitations ${randomUUID()}` });
  const firstName = "QA Bulk One";
  const secondName = "QA Bulk Two";
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  const panel = page.locator("div.rounded-3xl").filter({ has: page.getByRole("heading", { name: card.name, exact: true }) });
  await panel.getByRole("button", { name: "Mời Zalo", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Gửi thiệp mời cá nhân hóa", exact: true });
  await expect(modal.getByRole("button", { name: "Nhập hàng loạt", exact: true })).toBeEnabled();
  await modal.getByRole("button", { name: "Nhập hàng loạt", exact: true }).click();
  await modal.getByLabel("Danh sách khách mời, mỗi người một dòng", { exact: true }).fill(`${firstName} - 0900000001 - Bàn 9\n${secondName} | bride | 0900000002`);
  await modal.getByRole("button", { name: "Thêm vào danh sách", exact: true }).click();
  await expect(modal.getByRole("status").filter({ hasText: "Đã lưu danh sách khách mời vào CRM." })).toBeVisible();
  const imported = await jsonOk(await request.get(`/api/cards/${card.id}/guests`, { headers: owner }));
  expect(imported.guests).toHaveLength(2);
  const first = imported.guests.find((guest: { name: string }) => guest.name === firstName);
  const second = imported.guests.find((guest: { name: string }) => guest.name === secondName);
  expect(first).toMatchObject({ cardId: card.id, phone: "0900000001", tableNumber: "Bàn 9", status: "not_sent", checkedIn: false });
  expect(second).toMatchObject({ cardId: card.id, phone: "0900000002", group: "bride_side", status: "not_sent" });
  expect(first.id).toBeTruthy();
  expect(second.id).not.toBe(first.id);

  await modal.getByRole("button", { name: `Sao chép link của ${firstName}`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __qaCopiedInvite?: string }).__qaCopiedInvite || "")).toContain("guestId=");
  const copied = new URL(await page.evaluate(() => (window as typeof window & { __qaCopiedInvite: string }).__qaCopiedInvite));
  expect(copied.pathname).toBe(`/show/${card.slug}`);
  expect(copied.searchParams.get("guestId")).toBe(first.id);
  expect(copied.searchParams.get("cardId")).toBe(card.id);

  const downloadPromise = page.waitForEvent("download");
  await modal.getByRole("button", { name: "Xuất CSV", exact: true }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString("utf8");
  expect(csv).toContain(first.id);
  expect(csv).toContain(second.id);
  expect(csv).toContain(card.id);

  // Another device checks this guest in after the modal took its snapshot.
  const attendance = await jsonOk(await request.patch(`/api/cards/${card.id}/guests/${encodeURIComponent(first.id)}`, { headers: owner, data: { checkedIn: true } }));
  const checkedInAt = attendance.guests.find((guest: { id: string }) => guest.id === first.id).checkedInAt;
  expect(checkedInAt).toBeTruthy();
  await modal.getByRole("button", { name: `Đánh dấu đã gửi cho ${firstName}`, exact: true }).click();
  await expect(modal.getByRole("button", { name: `Đánh dấu chưa gửi cho ${firstName}`, exact: true })).toHaveAttribute("aria-pressed", "true");
  const saved = await jsonOk(await request.get(`/api/cards/${card.id}/guests`, { headers: owner }));
  expect(saved.guests.find((guest: { id: string }) => guest.id === first.id)).toMatchObject({ status: "sent", checkedIn: true, checkedInAt });

  const clean = await browser.newContext(testInfo.project.use);
  try {
    const secondDevice = await clean.newPage();
    await signIn(secondDevice, request);
    await secondDevice.goto(`/checkin/${card.slug}`, { waitUntil: "domcontentloaded" });
    await expect(secondDevice.getByRole("button", { name: `Hủy điểm danh ${firstName}`, exact: true })).toBeVisible();
    await expect(secondDevice.getByRole("button", { name: `Điểm danh ${secondName}`, exact: true })).toBeVisible();
  } finally { await clean.close(); }
});

test("failed check-in keeps the last confirmed state and displays an error", async ({ page, request }) => {
  await signIn(page, request);
  const card = await createCard(request, { status: "published" });
  const guest = { id: `gst_${randomUUID()}`, name: "QA Network Guest", group: "friends", estimatedGuests: 1, status: "confirmed" };
  await jsonOk(await request.post(`/api/cards/${card.id}/guests`, { headers: owner, data: { guests: [guest] } }));
  await page.goto(`/checkin/${card.slug}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: `Điểm danh ${guest.name}`, exact: true })).toBeVisible();
  await page.route(`**/api/cards/${card.id}/guests/${guest.id}`, (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ success: false, message: "QA offline" }) }));
  await page.getByRole("button", { name: `Điểm danh ${guest.name}`, exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "QA offline" })).toBeVisible();
  await expect(page.getByRole("button", { name: `Điểm danh ${guest.name}`, exact: true })).toBeVisible();
  const loaded = await jsonOk(await request.get(`/api/cards/${card.id}/guests`, { headers: owner }));
  expect(loaded.guests[0].checkedIn).toBe(false);
});

test("webhook retries and expired claims preserve one durable VIP activation", async ({ request }) => {
  const card = await createCard(request);
  const reference = `qa-tx-${randomUUID()}`;
  transactions.add(reference);
  const headers = { Authorization: "Bearer qa-webhook-token-local-only" };
  const data = { referenceCode: reference, content: `VIP ${card.slug}`, transferType: "in", transferAmount: 99000, accountNumber: "0000000000" };
  const deliveries = await Promise.all([1, 2].map(() => request.post("/api/webhook/payment", { headers, data })));
  expect(deliveries.some((r) => r.ok())).toBe(true);
  for (const response of deliveries) expect([200, 503]).toContain(response.status());
  const first = (await jsonOk(await request.get(`/api/cards/${card.id}`, { headers: owner }))).card;
  expect(first.isVip).toBe(true);
  const retry = await jsonOk(await request.post("/api/webhook/payment", { headers, data }));
  expect(retry.alreadyProcessed).toBe(true);
  const second = (await jsonOk(await request.get(`/api/cards/${card.id}`, { headers: owner }))).card;
  expect(second.vipUnlockedAt).toBe(first.vipUnlockedAt);

  const expired = `qa-tx-${randomUUID()}`;
  transactions.add(expired);
  await jsonOk(await request.post(`${fixture}/rest/v1/payment_transactions`, {
    headers: { apikey: "qa-service-key", Authorization: "Bearer qa-service-key" },
    data: { reference_code: expired, amount: 99000, content: data.content, claim_token: randomUUID(), claimed_at: new Date(Date.now() - 10 * 60_000).toISOString(), processed_at: null },
  }));
  await jsonOk(await request.post("/api/webhook/payment", { headers, data: { ...data, referenceCode: expired } }));
  const stored = await jsonOk(await request.get(`${fixture}/rest/v1/payment_transactions?reference_code=eq.${expired}`, { headers: { apikey: "qa-service-key", Authorization: "Bearer qa-service-key" } }));
  expect(stored).toHaveLength(1);
  expect(stored[0].processed_at).toBeTruthy();
});
