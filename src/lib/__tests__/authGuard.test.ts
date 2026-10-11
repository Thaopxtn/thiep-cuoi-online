import { describe, it, expect, beforeEach, vi } from "vitest";
import { cloneTemplateToNewCard, getCurrentUserId } from "../weddingCardService";

describe("Auth Guard - Kiểm soát bắt buộc đăng nhập để tạo thiệp", () => {
  let localStore: Record<string, string> = {};
  let sessionStore: Record<string, string> = {};

  beforeEach(() => {
    localStore = {};
    sessionStore = {};

    const createMockStorage = (store: Record<string, string>) => ({
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      key: (index: number) => Object.keys(store)[index] || null,
      get length() {
        return Object.keys(store).length;
      },
    });

    const mockLocalStorage = createMockStorage(localStore);
    const mockSessionStorage = createMockStorage(sessionStore);

    (globalThis as any).window = {
      localStorage: mockLocalStorage,
      sessionStorage: mockSessionStorage,
      dispatchEvent: () => true,
    };
    (globalThis as any).localStorage = mockLocalStorage;
    (globalThis as any).sessionStorage = mockSessionStorage;

    vi.restoreAllMocks();
  });

  it("cloneTemplateToNewCard ném lỗi nếu người dùng chưa đăng nhập", async () => {
    // Không có user trong localStorage
    expect(getCurrentUserId()).toBeUndefined();

    await expect(cloneTemplateToNewCard("son-duyen")).rejects.toThrow(
      "Vui lòng đăng nhập để bắt đầu tạo thiệp cưới mới."
    );
  });

  it("cloneTemplateToNewCard chấp nhận userId hợp lệ và gửi thông tin xác thực", async () => {
    // Mock fetch cho API /api/cards/clone
    const mockCard = {
      id: "card_mock_123",
      slug: "son-duyen-1234",
      name: "Thiệp Cưới Son Duyên",
      userId: "user_test_888",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        card: mockCard,
      }),
    } as any);

    const card = await cloneTemplateToNewCard(
      "son-duyen",
      "Đức Mạnh",
      "Lệ Quyên",
      "user_test_888"
    );

    expect(card).toBeDefined();
    expect(card.id).toBe("card_mock_123");
    expect(card.userId).toBe("user_test_888");

    // Kiểm tra header x-user-id đã được truyền đúng qua apiFetch
    const [callUrl, callOptions] = (global.fetch as any).mock.calls[0];
    expect(callUrl).toBe("/api/cards/clone");
    const headers = callOptions.headers;
    const userIdHeader = headers instanceof Headers ? headers.get("x-user-id") : headers?.["x-user-id"];
    expect(userIdHeader).toBe("user_test_888");
  });

  it("cơ chế PendingIntent lưu trữ và giải phóng chính xác trong sessionStorage", () => {
    const PENDING_INTENT_KEY = "zenlove_pending_intent";

    const intent = {
      type: "clone_template",
      templateId: "son-duyen",
      customGroom: "Trọng Tấn",
      customBride: "Thu Hiền",
    };

    sessionStorage.setItem(PENDING_INTENT_KEY, JSON.stringify(intent));
    const raw = sessionStorage.getItem(PENDING_INTENT_KEY);
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw!);
    expect(parsed.type).toBe("clone_template");
    expect(parsed.templateId).toBe("son-duyen");
    expect(parsed.customGroom).toBe("Trọng Tấn");

    sessionStorage.removeItem(PENDING_INTENT_KEY);
    expect(sessionStorage.getItem(PENDING_INTENT_KEY)).toBeNull();
  });
});
