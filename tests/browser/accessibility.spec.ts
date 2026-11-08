import { expect, test, type Route } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  // UI checks stay local and never submit credentials to a real auth service.
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/api/auth/")) {
      return route.fulfill({ status: 503, json: { success: false, message: "Auth disabled in UI QA" } });
    }
    return ["127.0.0.1", "localhost"].includes(url.hostname) || url.protocol === "data:"
      ? route.continue()
      : route.abort();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
});

test("login dialog contains keyboard focus and restores its trigger on Escape", async ({ page }) => {
  const trigger = page.locator("header").getByRole("button", { name: "Đăng nhập", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Đăng nhập tài khoản" });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
  await expect(dialog.getByRole("button", { name: "Đóng đăng nhập" })).toBeFocused();

  // Programmatic focus cannot escape onto the inert page behind the modal.
  await page.locator("header a").first().evaluate((element) => (element as HTMLElement).focus());
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Tab");
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  expect(await page.locator("body").evaluate((element) => element.style.overflow)).toBe("hidden");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.locator("body").evaluate((element) => element.style.overflow)).not.toBe("hidden");
});

test("login fields have labels and announce a pending request and failure", async ({ page }) => {
  let pendingRequest: Route | undefined;
  await page.route("**/api/auth/login", (route) => { pendingRequest = route; });
  const trigger = page.locator("header").getByRole("button", { name: "Đăng nhập", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Đăng nhập tài khoản" });
  await dialog.getByLabel("Địa chỉ Email", { exact: true }).fill("ui-qa@example.test");
  const password = dialog.getByLabel("Mật khẩu", { exact: true });
  await expect(password).toHaveAttribute("autocomplete", "current-password");
  await password.fill("qa-password");
  await dialog.getByRole("button", { name: "Đăng nhập ngay" }).click();
  await expect(dialog.getByRole("button", { name: "Đang xử lý...", exact: true })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Đăng ký mới" })).toBeDisabled();
  await expect.poll(() => Boolean(pendingRequest)).toBe(true);
  await pendingRequest!.fulfill({ status: 401, json: { success: false, message: "Thông tin đăng nhập không chính xác." } });
  await expect(dialog.getByRole("alert")).toHaveText("Thông tin đăng nhập không chính xác.");
  await expect(dialog.getByRole("button", { name: "Đăng nhập ngay" })).toBeEnabled();

  await page.keyboard.press("Escape");
  await trigger.click();
  await expect(dialog.getByLabel("Mật khẩu", { exact: true })).toHaveValue("");
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Đăng ký mới" }).click();
  const registerDialog = page.getByRole("dialog", { name: "Tạo tài khoản mới" });
  await expect(registerDialog.getByLabel("Họ và tên", { exact: true })).toBeVisible();
  await expect(registerDialog.getByLabel("Mật khẩu", { exact: true })).toHaveAttribute("autocomplete", "new-password");
});

test("mobile navigation closes with Escape and releases modality after resizing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const trigger = page.getByRole("button", { name: "Mở menu", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Menu chính", exact: true });
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(dialog.getByRole("button", { name: "Đóng menu" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(dialog).toBeHidden();
  const login = page.getByRole("dialog", { name: "Đăng nhập tài khoản" });
  await expect(login).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(login).toBeHidden();
  expect(await page.locator("body").evaluate((element) => element.style.overflow)).not.toBe("hidden");

  await trigger.click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(dialog).toBeHidden();
  expect(await page.locator("body").evaluate((element) => element.style.overflow)).not.toBe("hidden");
  await expect(page.locator("header").getByRole("link", { name: "Mẫu thiệp", exact: true })).toBeVisible();
});

test("FAQ exposes only the expanded answer to assistive technology", async ({ page }) => {
  const faq = page.locator("#faq");
  const first = faq.getByRole("button", { name: "ZenLove là gì và hoạt động như thế nào?", exact: true });
  const second = faq.getByRole("button", { name: "Tạo thiệp cưới online trên ZenLove có thực sự MIỄN PHÍ không?", exact: true });
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(second).toHaveAttribute("aria-expanded", "false");
  await expect(faq.getByRole("region")).toHaveCount(1);
  await second.click();
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await expect(faq.getByRole("region", { name: "ZenLove là gì và hoạt động như thế nào?", exact: true })).toHaveCount(0);
  await expect(faq.getByRole("region", { name: "Tạo thiệp cưới online trên ZenLove có thực sự MIỄN PHÍ không?", exact: true })).toHaveCount(1);
});

test("homepage keeps navigation and its primary action within responsive viewports", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "The viewport sweep runs once in the desktop browser context.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator("main#main-content")).toHaveCount(1);
  await expect(page.locator("#hero-btn-start")).toHaveAttribute("href", "/templates");
  await mkdir("output/playwright", { recursive: true });

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator("#hero-btn-start")).toBeVisible();
    const overflow = await page.locator("header").evaluate((header) => {
      return Array.from(header.querySelectorAll("a, button"))
        .filter((element) => (element as HTMLElement).checkVisibility())
        .map((element) => ({ label: element.getAttribute("aria-label") || element.textContent?.trim(), rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.left < -1 || rect.right > window.innerWidth + 1)
        .map(({ label }) => label);
    });
    expect(overflow, `Navigation overflow at ${width}px`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `output/playwright/zenlove-home-${width}.png`, fullPage: true });
    await page.screenshot({ path: `output/playwright/zenlove-home-${width}-viewport.png`, fullPage: false });
  }
});

test("carousel supports explicit controls and honors reduced motion", async ({ page }) => {
  const carousel = page.getByRole("region", { name: "Mẫu thiệp cưới online", exact: true });
  const next = carousel.getByRole("button", { name: "Xem mục sau trong Mẫu thiệp cưới online", exact: true });
  const previous = carousel.getByRole("button", { name: "Xem mục trước trong Mẫu thiệp cưới online", exact: true });
  await expect(next).toBeEnabled();
  await carousel.getByRole("button", { name: "Tạm dừng chuyển động Mẫu thiệp cưới online", exact: true }).click();
  await expect(carousel.getByRole("button", { name: "Tiếp tục chuyển động Mẫu thiệp cưới online", exact: true })).toBeVisible();
  const firstItem = carousel.locator("[data-arc-index='0']");
  const before = await firstItem.evaluate((element) => (element as HTMLElement).style.transform);
  await next.click();
  await expect.poll(() => firstItem.evaluate((element) => (element as HTMLElement).style.transform)).not.toBe(before);
  await previous.click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(carousel.getByRole("button", { name: "Chuyển động Mẫu thiệp cưới online đã tắt theo tùy chọn giảm chuyển động", exact: true })).toBeDisabled();
  await expect(next).toBeEnabled();
  const reducedBefore = await firstItem.evaluate((element) => (element as HTMLElement).style.transform);
  await next.click();
  await expect.poll(() => firstItem.evaluate((element) => (element as HTMLElement).style.transform)).not.toBe(reducedBefore);
});

test("support starts collapsed and returns keyboard focus when dismissed", async ({ page }) => {
  const support = page.getByRole("complementary", { name: "Tư vấn hỗ trợ trực tuyến" });
  const panel = support.getByRole("region", { name: "Liên hệ hỗ trợ", exact: true });
  const trigger = support.getByRole("button", { name: "Mở hỗ trợ", exact: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toHaveCount(0);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(panel).toBeVisible();
  await expect(support.getByRole("button", { name: "Đóng hỗ trợ", exact: true })).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(panel.getByRole("button", { name: "Đóng bảng hỗ trợ", exact: true })).toBeFocused();
  await expect(panel.getByRole("link", { name: "Nhắn tin qua Zalo", exact: true })).toHaveAttribute("href", "https://zalo.me/0823312212");
  await expect(panel.getByRole("link", { name: "Hotline: 0823.312.212", exact: true })).toHaveAttribute("href", "tel:0823312212");
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await panel.getByRole("button", { name: "Đóng bảng hỗ trợ", exact: true }).click();
  await expect(trigger).toBeFocused();
});
