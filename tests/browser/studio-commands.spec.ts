import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const owner = { Authorization: "Bearer qa-user-a" };
const fixture = "http://127.0.0.1:55433";
const created = new Set<string>();
const customData = { zero: 0, enabled: false, label: "", items: [] };

interface StoredNode {
  parent?: string;
  nodes?: string[];
  props: Record<string, unknown>;
}
interface StoredCard { id: string; nodes: Record<string, StoredNode> }

async function openCommandCard(page: Page, request: APIRequestContext): Promise<StoredCard> {
  const login = await request.post("/api/auth/login", { data: { email: "qa-a@example.test", password: "qa-password" } });
  expect(login.ok()).toBeTruthy();
  const { user } = await login.json();
  await page.addInitScript((profile) => localStorage.setItem("zenlove_auth_user", JSON.stringify(profile)), user);
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/proxy-image") return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80"><rect width="60" height="80" fill="#d8c4ab"/></svg>' });
    return ["127.0.0.1", "localhost"].includes(url.hostname) || url.protocol === "data:" ? route.continue() : route.abort();
  });
  const id = `qa-studio-command-${randomUUID()}`;
  created.add(id);
  const response = await request.post("/api/cards", { headers: owner, data: {
    id, slug: id, name: "QA Studio commands", status: "draft",
    groom: { name: "QA Command Groom" }, bride: { name: "QA Command Bride" },
    weddingDate: "2026-12-20", weddingTime: "11:00", album: [], musicUrl: "", musicTitle: "",
    showGiftBox: false, showWishes: false, showRsvp: false, showEvents: false,
    showCalendar: false, showLoveStory: false, showAlbum: false, loveStory: [], events: [],
    effectConfig: { enabled: false, type: "petals", density: 10, speed: 1, size: 1, opacity: 0.8, direction: "down" },
    nodes: {
      ROOT: { type: { resolvedName: "GeometricBox" }, props: { width: 500, height: 1400, backgroundColor: "#fff" }, nodes: ["one", "two"] },
      one: { type: { resolvedName: "TextBox" }, parent: "ROOT", props: { text: "QA COMMAND FIRST", top: 40, left: 100, width: 250, height: 40, fontSize: 20, color: "#224466", zIndex: 1, customData } },
      two: { type: { resolvedName: "TextBox" }, parent: "ROOT", props: { text: "QA COMMAND SECOND", top: 110, left: 150, width: 250, height: 40, fontSize: 20, zIndex: 2 } },
    },
  } });
  expect(response.ok(), await response.text()).toBeTruthy();
  const card = (await response.json()).card;
  await page.goto(`/design-template/${id}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#canvas-node-one")).toHaveText("QA COMMAND FIRST");
  return card;
}

async function readCard(request: APIRequestContext, id: string): Promise<StoredCard> {
  const response = await request.get(`/api/cards/${id}`, { headers: owner });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).card;
}

async function saveCommandCard(page: Page, id: string) {
  const saved = page.waitForResponse((response) => response.url().endsWith(`/api/cards/${id}`) && response.request().method() === "PUT");
  const save = page.getByTitle("Lưu bản thiết kế (Ctrl+S)");
  if (await save.isVisible()) await save.click();
  else {
    await page.getByTitle("Tùy chọn khác").click();
    await page.getByRole("button", { name: "Lưu bản thiết kế", exact: true }).click();
  }
  expect((await saved).ok()).toBeTruthy();
}

const undo = (page: Page) => page.locator('button[title="Hoàn tác (Ctrl+Z)"]:visible');
const redo = (page: Page) => page.locator('button[title="Làm lại (Ctrl+Y)"]:visible');

test.beforeAll(async ({ request }) => {
  const response = await request.get(`${fixture}/__qa/health`);
  expect(response.ok()).toBeTruthy();
  const health = await response.json();
  expect(health.testOnly).toBe(true);
  expect(health.database).toMatch(/^zenlove_qa_/);
});

test.afterEach(async ({ request }) => {
  for (const id of Array.from(created)) {
    const response = await request.delete(`/api/cards/${id}`, { headers: owner });
    expect(response.ok()).toBeTruthy();
    created.delete(id);
  }
});

test("multi-selection move is one undo step and a new command replaces the redo branch", async ({ page, request }) => {
  const card = await openCommandCard(page, request);
  const first = page.locator("#canvas-node-one");
  const second = page.locator("#canvas-node-two");
  await first.click();
  await second.click({ modifiers: ["Shift"] });
  await expect(page.getByText("2 đối tượng", { exact: true })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(first).toHaveCSS("left", "101px");
  await expect(second).toHaveCSS("left", "151px");
  await undo(page).click();
  await expect(first).toHaveCSS("left", "100px");
  await expect(second).toHaveCSS("left", "150px");
  await expect(redo(page)).toBeEnabled();
  // Return keyboard focus to the selected group without changing its selection.
  await page.getByTitle("Giữ chuột và kéo để di chuyển cả nhóm đối tượng").click();
  await page.keyboard.press("ArrowDown");
  await expect(first).toHaveCSS("top", "41px");
  await expect(second).toHaveCSS("top", "111px");
  await expect(redo(page)).toBeDisabled();
  await undo(page).click();
  await expect(first).toHaveCSS("top", "40px");
  await expect(second).toHaveCSS("top", "110px");
  await redo(page).click();
  await expect(first).toHaveCSS("top", "41px");
  await expect(second).toHaveCSS("top", "111px");
  await saveCommandCard(page, card.id);
  await expect.poll(async () => (await readCard(request, card.id)).nodes.one.props.top).toBe(41);
  const saved = await readCard(request, card.id);
  expect(saved.nodes.two.props).toMatchObject({ top: 111, left: 150 });
  expect(saved.nodes.ROOT.nodes).toEqual(["one", "two"]);
  expect(saved.nodes.one.props.customData).toEqual(customData);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(first).toHaveCSS("top", "41px");
  await expect(second).toHaveCSS("top", "111px");
});

test("duplicate, undo, redo and delete preserve the stored layer graph and custom values", async ({ page, request }) => {
  const card = await openCommandCard(page, request);
  await page.locator("#canvas-node-one").click({ button: "right" });
  await page.getByRole("button", { name: /^Nhân bản\s+Ctrl\+D$/ }).click();
  await saveCommandCard(page, card.id);
  await expect.poll(async () => Object.keys((await readCard(request, card.id)).nodes).length).toBe(4);
  const duplicated = await readCard(request, card.id);
  const added = Object.keys(duplicated.nodes).find((id) => !["ROOT", "one", "two"].includes(id))!;
  expect(added).toBeTruthy();
  expect(duplicated.nodes.ROOT.nodes).toEqual(["one", added, "two"]);
  expect(duplicated.nodes[added].parent).toBe("ROOT");
  expect(duplicated.nodes[added].props.customData).toEqual(customData);
  expect(duplicated.nodes.one.props.customData).toEqual(customData);
  await undo(page).click();
  await expect(page.locator(`#canvas-node-${added}`)).toHaveCount(0);
  await redo(page).click();
  const copy = page.locator(`#canvas-node-${added}`);
  await expect(copy).toHaveCount(1);
  await copy.click({ button: "right" });
  await page.getByRole("button", { name: /^Xóa phần tử\s+Del$/ }).click();
  await expect(copy).toHaveCount(0);
  await expect(page.locator('#studio-selection-heading:visible, #studio-mobile-selection-heading:visible')).toHaveCount(0);
  await saveCommandCard(page, card.id);
  await expect.poll(async () => (await readCard(request, card.id)).nodes.ROOT.nodes).toEqual(["one", "two"]);
  const deleted = await readCard(request, card.id);
  expect(Object.keys(deleted.nodes).sort()).toEqual(["ROOT", "one", "two"]);
  expect(deleted.nodes.one.props).toMatchObject({ left: 100, top: 40, customData });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#canvas-node-one")).toHaveText("QA COMMAND FIRST");
  await expect(page.locator(`#canvas-node-${added}`)).toHaveCount(0);
});
