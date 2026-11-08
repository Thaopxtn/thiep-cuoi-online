import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import jsQR from "jsqr";
import type { WeddingCard } from "../../src/data/initialCards";

const card: WeddingCard = {
  id: "qa-guest-pass-card", slug: "qa-guest-pass", name: "QA Guest Pass Wedding",
  templateId: "qa-guest-pass-template", templateName: "QA Guest Pass",
  status: "published", updatedAt: "2026-11-09T00:00:00Z", views: 0,
  coverImage: "/favicon.ico", story: "Thiệp giả lập để kiểm tra mã điểm danh.",
  weddingDate: "2026-12-20", weddingTime: "11:00", lunarDate: "",
  groom: { name: "QA Pass Groom", title: "Chú Rể", phone: "" },
  bride: { name: "QA Pass Bride", title: "Cô Dâu", phone: "" },
  events: [], album: [], musicTitle: "", musicUrl: "", rsvps: [], wishes: [],
  showGiftBox: false, showWishes: false, showRsvp: false, showEvents: false,
  showCalendar: false, showLoveStory: false, showAlbum: false,
  cinematicFx: { enabled: false, touchSparkles: false, lightLeaks: false, ambientDust: false, goldShimmer: false },
  nodes: {
    ROOT: { type: { resolvedName: "GeometricBox" }, props: { width: 500, height: 400, backgroundColor: "#fff" }, nodes: ["groom", "bride"] },
    groom: { type: { resolvedName: "TextBox" }, props: { text: "QA Pass Groom", top: 80, left: 24, width: 320, height: 40, fontSize: 24 }, parent: "ROOT" },
    bride: { type: { resolvedName: "TextBox" }, props: { text: "QA Pass Bride", top: 140, left: 24, width: 320, height: 40, fontSize: 24 }, parent: "ROOT" },
  },
};
const guestId = "rsvp:qa-guest-pass-42";

async function openViewer(page: Page, query: string, status: WeddingCard["status"] = "published") {
  const externalQrRequests: string[] = [];
  await page.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["127.0.0.1", "localhost"].includes(url.hostname) && url.protocol !== "data:") {
      if (/qr|barcode/i.test(url.hostname + url.pathname)) externalQrRequests.push(url.href);
      return route.abort();
    }
    if (url.pathname === `/api/show/${card.slug}` && request.method() === "GET") {
      return route.fulfill({ json: { success: true, card: { ...card, status } } });
    }
    // Even view counting stays mocked; these tests never write through an API.
    if (url.pathname.startsWith("/api/")) return route.fulfill({ status: 404, json: { success: false } });
    return route.continue();
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const loaded = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/show/${card.slug}`);
  await page.goto(`/show/${card.slug}${query}`, { waitUntil: "domcontentloaded" });
  await loaded;
  const seal = page.getByTitle("Chạm vào con dấu sáp để mở thiệp cưới", { exact: true });
  await seal.click();
  await expect(seal).toBeHidden();
  await page.waitForLoadState("networkidle");
  return externalQrRequests;
}

test("personalized invitation renders a locally generated QR that decodes to the exact guest and card", async ({ page }, testInfo) => {
  const query = new URLSearchParams({ guestId, cardId: card.id, to: "Khách Quý", table: "Bàn 12" });
  const externalQrRequests = await openViewer(page, `?${query}`);
  const trigger = page.getByRole("button", { name: "Mã điểm danh", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Mã điểm danh của bạn", exact: true });
  await expect(dialog).toBeVisible();
  const image = dialog.getByRole("img", { name: "Mã QR điểm danh khách mời", exact: true });
  await expect(image).toHaveAttribute("src", /^data:image\/svg\+xml/);
  const imageUrl = await image.getAttribute("src");
  const pixels = await image.evaluate(async (element) => {
    const imageElement = element as HTMLImageElement;
    await imageElement.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rasterization is unavailable");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    return Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data);
  });
  const decoded = jsQR(Uint8ClampedArray.from(pixels), 512, 512, { inversionAttempts: "dontInvert" });
  expect(decoded, "The actual SVG shown to the guest must be readable by the scanner").not.toBeNull();
  const expected = new URL(`/show/${card.slug}`, page.url());
  expected.searchParams.set("cardId", card.id);
  expected.searchParams.set("guestId", guestId);
  expect(decoded?.data).toBe(expected.href);
  const decodedUrl = new URL(decoded!.data);
  expect(decodedUrl.searchParams.get("guestId")).toBe(guestId);
  expect(decodedUrl.searchParams.get("cardId")).toBe(card.id);
  expect(decodedUrl.searchParams.has("to")).toBe(false);
  expect(decodedUrl.searchParams.has("table")).toBe(false);
  const download = dialog.getByRole("link", { name: "Tải mã QR", exact: true });
  await expect(download).toHaveAttribute("href", imageUrl!);
  await expect(download).toHaveAttribute("download", "Ma-diem-danh.svg");
  expect(externalQrRequests).toEqual([]);
  await mkdir("output/playwright", { recursive: true });
  await page.screenshot({ path: `output/playwright/guest-check-in-pass-${testInfo.project.name}.png` });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const [label, query] of [
  ["a generic invitation", ""],
  ["a legacy name-only link", "?to=Kh%C3%A1ch+Qu%C3%BD"],
  ["a conflicting card ID", `?guestId=${encodeURIComponent(guestId)}&cardId=another-card`],
  ["duplicate guest identifiers", `?guestId=${encodeURIComponent(guestId)}&guestId=another-guest&cardId=${card.id}`],
] as const) {
  test(`does not show a check-in pass for ${label}`, async ({ page }) => {
    const externalQrRequests = await openViewer(page, query);
    await expect(page.getByRole("button", { name: "Mã điểm danh", exact: true })).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Mã điểm danh của bạn", exact: true })).toHaveCount(0);
    expect(externalQrRequests).toEqual([]);
  });
}

test("does not issue a pass when a draft snapshot reaches the viewer", async ({ page }) => {
  await openViewer(page, `?guestId=${encodeURIComponent(guestId)}&cardId=${card.id}`, "draft");
  await expect(page.getByRole("button", { name: "Mã điểm danh", exact: true })).toHaveCount(0);
});
