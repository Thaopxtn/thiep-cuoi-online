import { expect, test, type Page, type Route } from "@playwright/test";
import qrcode from "qrcode-generator";
import type { GuestItem } from "../../src/lib/guestManagementService";

const cardId = "ui-qr-card-a";
const slug = "ui-qr-wedding-a";
const ownerId = "ui-qr-owner";
const guestId = "ui-qr-guest-a";
const qrValue = (id = guestId) => `https://example.test/show/${slug}?cardId=${cardId}&guestId=${id}`;

function qrImage(value: string): string {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  return qr.createDataURL(6, 24);
}

async function installFixture(page: Page, camera: "denied" | "qr" | "pending" = "denied") {
  const now = "2026-11-09T00:00:00.000Z";
  const state: {
    guests: GuestItem[];
    writes: number;
    fail: boolean;
    hold: boolean;
    pending?: Route;
  } = {
    guests: [
      { id: guestId, cardId, name: "Khách trùng tên", group: "friends", tableNumber: "Bàn 7", estimatedGuests: 2, status: "sent", checkedIn: false, createdAt: now, updatedAt: now },
      { id: "ui-qr-guest-b", cardId, name: "Khách trùng tên", group: "friends", tableNumber: "Bàn 8", estimatedGuests: 1, status: "sent", checkedIn: false, createdAt: now, updatedAt: now },
    ],
    writes: 0,
    fail: false,
    hold: false,
  };
  const card = { id: cardId, slug, name: "UI QR wedding", userId: ownerId, status: "published", groom: { name: "QA Groom" }, bride: { name: "QA Bride" }, album: [], rsvps: [], nodes: {}, events: [] };
  await page.addInitScript(({ cameraMode, dataUrl, auth }) => {
    localStorage.setItem("zenlove_auth_user", JSON.stringify(auth));
    const qa = window as typeof window & { __qrStopped?: number; __qrGrant?: () => Promise<void> };
    qa.__qrStopped = 0;
    const createStream = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 720;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "white";
      context.fillRect(0, 0, 720, 720);
      if (cameraMode === "qr") {
        const image = new Image();
        image.src = dataUrl;
        await image.decode();
        context.drawImage(image, 100, 100, 520, 520);
      }
      const stream = canvas.captureStream(10);
      for (const track of stream.getTracks()) {
        const originalStop = track.stop.bind(track);
        track.stop = () => { qa.__qrStopped = (qa.__qrStopped || 0) + 1; originalStop(); };
      }
      return stream;
    };
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: {
      getUserMedia: () => {
        if (cameraMode === "denied") return Promise.reject(new DOMException("QA denied", "NotAllowedError"));
        if (cameraMode === "qr") return createStream();
        return new Promise<MediaStream>((resolve) => { qa.__qrGrant = async () => { resolve(await createStream()); }; });
      },
    } });
  }, {
    cameraMode: camera,
    dataUrl: qrImage(qrValue()),
    auth: { id: ownerId, name: "UI QA owner", email: "ui-qr@example.test", avatar: "/favicon.ico", provider: "email", accessToken: "ui-qa-token", createdAt: now },
  });

  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return ["127.0.0.1", "localhost"].includes(url.hostname) || url.protocol === "data:" ? route.continue() : route.abort();
  });
  const acknowledge = async (route: Route) => {
    const id = decodeURIComponent(new URL(route.request().url()).pathname.split("/").pop()!);
    const body = route.request().postDataJSON() as { checkedIn: boolean };
    state.guests = state.guests.map((guest) => guest.id === id ? { ...guest, checkedIn: body.checkedIn } : guest);
    await route.fulfill({ json: { success: true, guests: state.guests, rsvps: [] } });
  };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (method === "GET" && path === `/api/cards/${slug}`) {
      return route.fulfill({ json: { success: true, card, isOwner: true } });
    }
    if (method === "GET" && path === `/api/cards/${cardId}/guests`) {
      return route.fulfill({ json: { success: true, guests: state.guests, rsvps: [] } });
    }
    if (method === "PATCH" && path.startsWith(`/api/cards/${cardId}/guests/`)) {
      state.writes += 1;
      if (state.hold) { state.pending = route; return; }
      if (state.fail) return route.fulfill({ status: 503, json: { success: false, message: "QA: chưa lưu được điểm danh" } });
      return acknowledge(route);
    }
    // No unknown request reaches an API implementation or a real account.
    return route.fulfill({ status: 404, json: { success: false, message: "UI QR fixture only" } });
  });
  await page.goto(`/checkin/${slug}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Quét mã QR", exact: true })).toBeEnabled();
  return { state, acknowledge };
}

async function openScanner(page: Page) {
  await page.getByRole("button", { name: "Quét mã QR", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Quét mã điểm danh", exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("QR link fallback rejects another wedding and waits for one confirmed write", async ({ page }, testInfo) => {
  const { state, acknowledge } = await installFixture(page);
  state.hold = true;
  const scanner = await openScanner(page);
  await expect(scanner.getByRole("alert")).toContainText("Camera chưa được cấp quyền");
  const viewport = page.viewportSize();
  const panelHeight = await scanner.locator("section").evaluate((element) => Math.ceil(element.getBoundingClientRect().height));
  // A native dialog is clipped by its viewport even in an element screenshot.
  // Preserve the device width and expand only the capture height to show both fallbacks.
  if (viewport && viewport.height < panelHeight + 40) await page.setViewportSize({ ...viewport, height: panelHeight + 40 });
  await scanner.locator("section").screenshot({ path: `output/playwright/checkin-qr-${testInfo.project.name}.png` });
  if (viewport) await page.setViewportSize(viewport);
  const input = scanner.getByLabel("Liên kết hoặc nội dung mã QR", { exact: true });
  const submit = scanner.getByRole("button", { name: "Điểm danh từ liên kết", exact: true });
  await input.fill(`https://example.test/show/another-wedding?cardId=another-card&guestId=${guestId}`);
  await submit.click();
  await expect(scanner.getByRole("alert")).toContainText("thuộc thiệp khác");
  expect(state.writes).toBe(0);
  await input.fill(`https://example.test/show/${slug}?to=Khach`);
  await submit.click();
  await expect(scanner.getByRole("alert")).toContainText("chưa có mã khách mời");
  expect(state.writes).toBe(0);

  await input.fill(qrValue());
  await submit.click();
  await expect.poll(() => state.writes).toBe(1);
  await expect(submit).toBeDisabled();
  await expect(page.getByRole("dialog", { name: "Điểm danh thành công!", exact: true })).toHaveCount(0);
  await input.evaluate((element) => element.closest("form")!.requestSubmit());
  expect(state.writes).toBe(1);
  expect(state.guests[0].checkedIn).toBe(false);
  await acknowledge(state.pending!);
  const success = page.getByRole("dialog", { name: "Điểm danh thành công!", exact: true });
  await expect(success).toBeVisible();
  await expect(success.getByText("Bàn 7", { exact: true })).toBeVisible();
  expect(state.guests[0].checkedIn).toBe(true);
  expect(state.guests[1].checkedIn).toBe(false);
  await page.keyboard.press("Escape");
  await openScanner(page);
  await input.fill(qrValue());
  await submit.click();
  await expect(scanner.getByRole("alert")).toContainText("đã được điểm danh");
  expect(state.writes).toBe(1);
  expect(state.guests[0].checkedIn).toBe(true);
});

test("uploaded QR pixels decode locally and a failed save keeps attendance unchanged", async ({ page }) => {
  const { state } = await installFixture(page);
  state.fail = true;
  const scanner = await openScanner(page);
  const image = Buffer.from(qrImage(qrValue("ui-qr-guest-b")).split(",")[1], "base64");
  const input = scanner.getByLabel("Chọn ảnh mã QR", { exact: true });
  await input.setInputFiles({ name: "guest-qr.gif", mimeType: "image/gif", buffer: image });
  await expect(scanner.getByRole("alert")).toContainText("QA: chưa lưu được điểm danh");
  expect(state.writes).toBe(1);
  expect(state.guests.every((guest) => !guest.checkedIn)).toBe(true);
  await expect(page.getByRole("dialog", { name: "Điểm danh thành công!", exact: true })).toHaveCount(0);

  state.fail = false;
  await input.setInputFiles({ name: "guest-qr.gif", mimeType: "image/gif", buffer: image });
  const success = page.getByRole("dialog", { name: "Điểm danh thành công!", exact: true });
  await expect(success).toBeVisible();
  await expect(success.getByText("Bàn 8", { exact: true })).toBeVisible();
  expect(state.guests[0].checkedIn).toBe(false);
  expect(state.guests[1].checkedIn).toBe(true);
  expect(state.writes).toBe(2);
});

test("camera QR pixels produce one check-in and stop the camera track", async ({ page }) => {
  const { state } = await installFixture(page, "qr");
  await openScanner(page);
  await expect(page.getByRole("dialog", { name: "Điểm danh thành công!", exact: true })).toBeVisible();
  expect(state.writes).toBe(1);
  expect(state.guests[0].checkedIn).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __qrStopped: number }).__qrStopped)).toBe(1);
  await page.keyboard.press("Escape");
  expect(state.writes).toBe(1);
});

test("closing the scanner stops a late camera grant and an active camera", async ({ page }) => {
  const { state } = await installFixture(page, "pending");
  const scanner = await openScanner(page);
  await expect.poll(() => page.evaluate(() => typeof (window as typeof window & { __qrGrant?: unknown }).__qrGrant)).toBe("function");
  await page.keyboard.press("Escape");
  await expect(scanner).toBeHidden();
  await page.evaluate(() => (window as typeof window & { __qrGrant: () => Promise<void> }).__qrGrant());
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __qrStopped: number }).__qrStopped)).toBe(1);

  await page.evaluate(() => { delete (window as typeof window & { __qrGrant?: unknown }).__qrGrant; });
  await openScanner(page);
  await expect.poll(() => page.evaluate(() => typeof (window as typeof window & { __qrGrant?: unknown }).__qrGrant)).toBe("function");
  await page.evaluate(() => (window as typeof window & { __qrGrant: () => Promise<void> }).__qrGrant());
  await expect(scanner.getByRole("button", { name: "Tắt camera", exact: true })).toBeEnabled();
  await scanner.getByRole("button", { name: "Đóng bảng quét mã QR", exact: true }).click();
  await expect(scanner).toBeHidden();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __qrStopped: number }).__qrStopped)).toBe(2);
  await expect(page.getByRole("button", { name: "Quét mã QR", exact: true })).toBeFocused();
  expect(state.writes).toBe(0);
});
