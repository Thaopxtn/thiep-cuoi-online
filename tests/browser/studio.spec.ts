import { test, expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const owner = { Authorization: "Bearer qa-user-a" };
const fixture = "http://127.0.0.1:55433";
const originalText = "STUDIO QA ORIGINAL";
const editedText = "STUDIO QA EDITED";
const created = new Set<string>();

interface StudioCard {
  id: string;
  nodes: Record<string, { props: Record<string, unknown> }>;
}

async function createStudioCard(request: APIRequestContext): Promise<StudioCard> {
  const id = `qa-studio-${randomUUID()}`;
  created.add(id);
  const response = await request.post("/api/cards", { headers: owner, data: {
    id, slug: id, name: "QA Studio workspace", templateName: "QA Studio workspace", status: "draft",
    groom: { name: "QA Studio Groom" }, bride: { name: "QA Studio Bride" },
    weddingDate: "2026-12-20", weddingTime: "11:00", album: [], musicUrl: "", musicTitle: "",
    showGiftBox: false, showWishes: false, showRsvp: false, showEvents: false,
    showCalendar: false, showLoveStory: false, showAlbum: false, loveStory: [], events: [],
    effectConfig: { enabled: false, type: "petals", density: 10, speed: 1, size: 1, opacity: 0.8, direction: "down" },
    nodes: {
      ROOT: { type: { resolvedName: "GeometricBox" }, props: { width: 500, height: 1400, backgroundColor: "#fff" }, nodes: ["heading", "body"] },
      heading: { type: { resolvedName: "TextBox" }, parent: "ROOT", props: { text: originalText, top: 120, left: 100, width: 260, height: 80, fontSize: 22, color: "#224466", zIndex: 2 } },
      body: { type: { resolvedName: "TextBox" }, parent: "ROOT", props: { text: "QA STUDIO SECOND TEXT", top: 300, left: 100, width: 260, height: 80, fontSize: 20, zIndex: 1 } },
    },
  } });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()).card;
}

async function openStudio(page: Page, request: APIRequestContext): Promise<StudioCard> {
  const login = await request.post("/api/auth/login", { data: { email: "qa-a@example.test", password: "qa-password" } });
  expect(login.ok()).toBeTruthy();
  const { user } = await login.json();
  await page.addInitScript((profile) => localStorage.setItem("zenlove_auth_user", JSON.stringify(profile)), user);
  // Media is isolated; this suite exercises only its own QA cards in the fixture database.
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/proxy-image") return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80"><rect width="60" height="80" fill="#d8c4ab"/></svg>' });
    return ["127.0.0.1", "localhost"].includes(url.hostname) || url.protocol === "data:" ? route.continue() : route.abort();
  });
  const card = await createStudioCard(request);
  await page.goto(`/design-template/${card.id}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#canvas-node-heading")).toHaveText(originalText);
  await expect(page.locator('footer[aria-label="Điều khiển không gian thiết kế"]')).toBeVisible();
  return card;
}

async function assertInViewport(locator: Locator, page: Page) {
  await expect(locator).toBeVisible();
  // Native modality reparents the responsive library after matchMedia updates.
  // Retry the complete bounds contract while that surface mounts, without relaxing it.
  await expect(async () => {
    const box = await locator.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(-1);
    expect(box!.y).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
  }).toPass({ timeout: 5000 });
}

async function readCard(request: APIRequestContext, id: string): Promise<StudioCard> {
  const response = await request.get(`/api/cards/${id}`, { headers: owner });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).card;
}

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

test("Studio popovers preserve selection and isolate keyboard commands from the document", async ({ page, request }, testInfo) => {
  await openStudio(page, request);
  const heading = page.locator("#canvas-node-heading");
  const positionBeforeSelection = await heading.boundingBox();
  expect(positionBeforeSelection).not.toBeNull();
  await heading.click();
  const selectionHeading = page.locator('#studio-selection-heading:visible, #studio-mobile-selection-heading:visible');
  await expect(selectionHeading).toHaveText("Văn bản");
  const positionAfterSelection = await heading.boundingBox();
  expect(positionAfterSelection).not.toBeNull();
  expect(Math.abs(positionAfterSelection!.y - positionBeforeSelection!.y)).toBeLessThanOrEqual(1);
  const footer = page.locator('footer[aria-label="Điều khiển không gian thiết kế"]');
  const tools = footer.getByRole("button", { name: "Công cụ căn chỉnh", exact: true });
  await tools.click();
  await page.keyboard.press("Tab");
  const grid = footer.getByRole("button", { name: "Lưới thiết kế", exact: true });
  await expect(grid).toBeFocused();
  await expect(grid).toHaveAttribute("aria-pressed", "true");
  await grid.click();
  await expect(grid).toHaveAttribute("aria-pressed", "false");
  await grid.click();
  await expect(grid).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Delete");
  await expect(heading).toHaveCSS("top", "120px");
  await expect(heading).toHaveCSS("left", "100px");
  await expect(heading).toHaveText(originalText);
  await page.keyboard.press("Escape");
  await expect(tools).toBeFocused();
  await expect(tools).toHaveAttribute("aria-expanded", "false");
  await expect(selectionHeading).toHaveText("Văn bản");

  const zoom = footer.getByTitle("Chọn tỉ lệ thu phóng", { exact: true });
  await zoom.click();
  await page.keyboard.press("Tab");
  await expect(footer.getByRole("button", { name: "Vừa màn hình", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(zoom).toBeFocused();
  await expect(zoom).toHaveAttribute("aria-expanded", "false");
  const header = page.getByRole("banner", { name: "Thanh điều khiển ZenLove Studio" });
  const more = header.getByRole("button", { name: "Tùy chọn khác", exact: true });
  await more.click();
  const options = header.getByRole("region", { name: "Tùy chọn bản thiết kế" });
  await expect(options).toBeVisible();
  expect(await options.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await expect(selectionHeading).toHaveText("Văn bản");
  await assertInViewport(header.getByRole("button", { name: "Xem trước", exact: true }), page);
  await assertInViewport(header.getByTitle("Xuất bản thiệp cưới để chia sẻ"), page);
  await assertInViewport(footer, page);
  await page.screenshot({ path: `output/playwright/${testInfo.project.name}-studio-workspace.png` });
});

test("Studio stays usable across viewport widths and mobile library returns focus", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The desktop context sweeps all responsive widths once.");
  await openStudio(page, request);
  for (const width of [320, 375, 640, 700, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const header = page.getByRole("banner", { name: "Thanh điều khiển ZenLove Studio" });
    const footer = page.locator('footer[aria-label="Điều khiển không gian thiết kế"]');
    await assertInViewport(header, page);
    await assertInViewport(header.getByTitle("Xuất bản thiệp cưới để chia sẻ"), page);
    await assertInViewport(header.getByRole("button", { name: "Xem trước", exact: true }), page);
    await assertInViewport(page.locator('button[title="Hoàn tác (Ctrl+Z)"]:visible'), page);
    await assertInViewport(page.locator('button[title="Làm lại (Ctrl+Y)"]:visible'), page);
    await assertInViewport(footer, page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const nav = page.getByRole("navigation", { name: width < 768 ? "Công cụ thiết kế trên điện thoại" : "Công cụ thiết kế", exact: true });
    const album = nav.getByRole("button", { name: width < 768 ? "Ảnh cưới" : "Ảnh & Album", exact: true });
    await album.click();
    const library = page.getByTestId("studio-library");
    await assertInViewport(library, page);
    if (width < 768) {
      const dialog = page.getByRole("dialog", { name: "Ảnh và album cưới", exact: true });
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(album).toBeFocused();
    } else await library.getByRole("button", { name: "Thu gọn bảng công cụ", exact: true }).click();
    await expect(library).toHaveCount(0);
    await expect(album).toHaveAttribute("aria-pressed", "false");
    await assertInViewport(footer, page);
  }
  await page.screenshot({ path: "output/playwright/desktop-studio-1440.png" });
});

test("Studio text edit, undo and redo persist exactly after save and reload", async ({ page, request }) => {
  const card = await openStudio(page, request);
  const heading = page.locator("#canvas-node-heading");
  await heading.click();
  const edit = page.getByLabel("Nội dung văn bản", { exact: true }).filter({ visible: true });
  await expect(edit).toBeVisible();
  await edit.fill(editedText);
  await edit.blur();
  await expect(heading).toHaveText(editedText);
  await page.locator('button[title="Hoàn tác (Ctrl+Z)"]:visible').click();
  await expect(heading).toHaveText(originalText);
  await page.locator('button[title="Làm lại (Ctrl+Y)"]:visible').click();
  await expect(heading).toHaveText(editedText);
  const saved = page.waitForResponse((response) => response.url().endsWith(`/api/cards/${card.id}`) && response.request().method() === "PUT");
  const directSave = page.getByTitle("Lưu bản thiết kế (Ctrl+S)");
  if (await directSave.isVisible()) await directSave.click();
  else {
    await page.getByTitle("Tùy chọn khác").click();
    await page.getByRole("button", { name: "Lưu bản thiết kế", exact: true }).click();
  }
  expect((await saved).ok()).toBeTruthy();
  await expect.poll(async () => (await readCard(request, card.id)).nodes.heading.props.text).toBe(editedText);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(heading).toHaveText(editedText);
  await expect(heading.locator("div[style*='color:']")).toHaveCSS("color", "rgb(34, 68, 102)");
  const persisted = await readCard(request, card.id);
  expect(persisted.nodes.heading.props).toMatchObject({ text: editedText, top: 120, left: 100, color: "#224466" });
});
