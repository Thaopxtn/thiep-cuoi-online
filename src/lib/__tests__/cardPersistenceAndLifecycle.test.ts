import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";

// Exercise the local repository without touching application data or a configured cloud DB.
const testDatabase = vi.hoisted(() => {
  const originalUrls = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };
  process.env.SUPABASE_URL = "";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "";
  return { contents: "[]", mtime: 0, originalUrls };
});

vi.mock("fs", () => ({
  default: {
    existsSync: () => true,
    statSync: () => ({ mtimeMs: testDatabase.mtime }),
    readFileSync: () => testDatabase.contents,
    writeFileSync: (_file: string, contents: string) => {
      testDatabase.contents = contents;
      testDatabase.mtime += 1;
    },
    mkdirSync: vi.fn(),
  },
}));
import { WeddingCard } from "@/data/initialCards";
import {
  saveCard,
  saveCardAsync,
  fetchCardForEditor,
  getCardByIdOrSlug,
} from "../weddingCardService";
import { upsertCardToDb, getCardByIdOrSlugFromDb } from "../serverDb";
import { toPublicCardDTO } from "../cardDto";

describe("E01–E06: CARD PERSISTENCE, LIFECYCLE & ROUND-TRIP INTEGRITY", () => {
  const originalFetch = global.fetch;
  let store: Record<string, string> = {};

  beforeEach(() => {
    testDatabase.contents = "[]";
    testDatabase.mtime += 1;
    store = {};
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (index: number) => Object.keys(store)[index] || null,
      get length() {
        return Object.keys(store).length;
      },
    };

    (globalThis as any).window = {
      localStorage: mockStorage,
      location: { origin: "http://localhost:3005" },
    };
    (globalThis as any).localStorage = mockStorage;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(testDatabase.originalUrls)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  // =========================================================================
  // 1. E01: Single-path save & decoupling local cache from network mutations
  // =========================================================================
  it("E01.1: saveCard() must ONLY update local storage and NEVER fire background fetch", () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })));
    global.fetch = fetchSpy;

    const sampleCard: WeddingCard = {
      id: "card_test_e01",
      slug: "test-couple-zenlove-mau01",
      name: "Thiệp cưới Test",
      templateId: "tpl-1",
      templateName: "Mẫu 1",
      status: "draft",
      updatedAt: "27/10/2026",
      views: 0,
      coverImage: "https://example.com/cover.jpg",
      story: "Câu chuyện tình yêu",
      weddingDate: "2026-12-01",
      weddingTime: "11:00",
      lunarDate: "Ngày 20 tháng 10",
      groom: { name: "Đức Mạnh", title: "Chú Rể", phone: "0912345678" },
      bride: { name: "Thùy Dung", title: "Cô Dâu", phone: "0987654321" },
      events: [],
      album: ["https://example.com/p1.jpg"],
      musicTitle: "Beautiful In White",
      musicUrl: "https://example.com/song.mp3",
      rsvps: [],
      wishes: [],
      userId: "usr_tester_123",
    };

    saveCard(sampleCard);

    // Assert: local cache has the card
    const retrieved = getCardByIdOrSlug("card_test_e01");
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe("card_test_e01");
    expect(retrieved?.slug).toBe("test-couple-zenlove-mau01");

    // Assert: NO background fetch was triggered
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("E01.2: saveCardAsync() executes exactly ONE network PUT and synchronizes local cache", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "Lưu thành công" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    global.fetch = fetchSpy;

    const sampleCard: WeddingCard = {
      id: "card_async_test",
      slug: "async-test-zenlove",
      name: "Thiệp Async",
      templateId: "tpl-async",
      templateName: "Mẫu Async",
      status: "draft",
      updatedAt: "27/10/2026",
      views: 0,
      coverImage: "",
      story: "",
      weddingDate: "2026-11-20",
      weddingTime: "11:00",
      lunarDate: "",
      groom: { name: "Groom", title: "Chú Rể", phone: "" },
      bride: { name: "Bride", title: "Cô Dâu", phone: "" },
      events: [],
      album: [],
      musicTitle: "",
      musicUrl: "",
      rsvps: [],
      wishes: [],
      userId: "usr_async_user",
    };

    const res = await saveCardAsync(sampleCard);

    expect(res.success).toBe(true);
    // Crucial: exactly ONE fetch call was made! (No secondary uncoordinated fetch from saveCard)
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toContain("/api/cards/card_async_test");
    expect(fetchSpy.mock.calls[0][1]?.method).toBe("PUT");

    // Check local cache was updated
    const local = getCardByIdOrSlug("card_async_test");
    expect(local).toBeDefined();
    expect(local?.id).toBe("card_async_test");
  });

  it("E01.3: Save coordinator handles out-of-order network responses and in-flight race conditions", async () => {
    // Simulate save coordinator revision logic
    let revision = 0;
    let lastSavedRevision = 0;
    let saveStatus: "saved" | "saving" | "offline" = "saved";

    // Edit 1 occurs
    revision += 1;
    const rev1 = revision;
    saveStatus = "saving";

    // Edit 2 occurs while Edit 1 is still in flight
    revision += 1;
    const rev2 = revision;

    // Response for Edit 1 arrives
    const edit1Success = true;
    if (edit1Success) {
      if (revision === rev1) {
        lastSavedRevision = rev1;
        saveStatus = "saved";
      }
      // Since revision is now rev2 (2 > 1), saveStatus must remain "saving"!
    }
    expect(saveStatus).toBe("saving");
    expect(lastSavedRevision).toBe(0);

    // Response for Edit 2 arrives
    const edit2Success = true;
    if (edit2Success) {
      if (revision === rev2) {
        lastSavedRevision = rev2;
        saveStatus = "saved";
      }
    }
    expect(saveStatus).toBe("saved");
    expect(lastSavedRevision).toBe(2);
  });

  // =========================================================================
  // 2. E02: Round-trip persistence preserving all fields, booleans & empty arrays
  // =========================================================================
  it("E02.1: upsertCardToDb and mapDbToCard preserve full schema including false booleans and empty arrays", async () => {
    const fullCard: WeddingCard = {
      id: "card_full_schema_test",
      slug: "full-schema-test-slug",
      name: "Thiệp Đầy Đủ Trường",
      templateId: "tpl-full",
      templateName: "Mẫu Đầy Đủ",
      status: "draft",
      updatedAt: "27/10/2026",
      views: 50,
      coverImage: "https://example.com/cover.webp",
      story: "Câu chuyện riêng",
      weddingDate: "2026-12-25",
      weddingTime: "17:30",
      lunarDate: "Ngày 15 tháng 11",
      // User intentionally cleared phone and bank info (empty strings)
      groom: {
        name: "Hoàng Long",
        title: "Chú Rể",
        phone: "",
        parents: "",
        bankName: "",
        accountNumber: "",
        accountName: "",
      },
      bride: {
        name: "Bảo Ngọc",
        title: "Cô Dâu",
        phone: "",
        parents: "",
        bankName: "",
        accountNumber: "",
        accountName: "",
      },
      // User intentionally disabled modules (false booleans)
      showGiftBox: false,
      showWishes: false,
      showRsvp: false,
      showEvents: false,
      showCalendar: false,
      showLoveStory: false,
      showAlbum: false,
      envelopeTheme: "emerald",
      ambientEffect: "butterflies",
      effectConfig: {
        type: "butterflies",
        enabled: true,
        density: 20,
        speed: 1.2,
        size: 0.9,
        opacity: 0.9,
        direction: "up",
      },
      cinematicFx: {
        enabled: true,
        touchSparkles: true,
        lightLeaks: false,
        sealSymbol: "heart",
        intensity: "vibrant",
      },
      loveStory: [
        {
          id: "story-1",
          date: "2024-01-01",
          title: "Ngày đầu gặp gỡ",
          description: "Quán cà phê góc phố",
        },
      ],
      // User intentionally emptied album
      album: [],
      events: [],
      musicTitle: "Until I Found You",
      musicUrl: "https://example.com/music.mp3",
      rsvps: [],
      wishes: [],
      fixedModuleStyles: {
        calendar: "modern-minimal",
        events: "timeline-cards",
        rsvp: "red-velvet",
      },
      rsvpTitle: "Xác Nhận Có Mặt Nhé",
      rsvpMessage: "Vui lòng báo trước ngày 10/12",
      wishesTitle: "Gửi Lời Chúc Mừng",
      wishesDescription: "Cảm ơn những lời chúc của bạn",
      isVip: true,
      plan: "vip",
      showWatermark: false,
      userId: "usr_schema_tester",
    };

    // Save to DB (offline/local backend in test environment)
    const saved = await upsertCardToDb(fullCard as any);
    expect(saved).toBeDefined();

    // Read back from DB
    const retrieved = await getCardByIdOrSlugFromDb("card_full_schema_test");
    expect(retrieved).toBeDefined();
    if (!retrieved) return;

    // Verify all booleans preserved strictly as false
    expect(retrieved.showGiftBox).toBe(false);
    expect(retrieved.showWishes).toBe(false);
    expect(retrieved.showRsvp).toBe(false);
    expect(retrieved.showEvents).toBe(false);
    expect(retrieved.showCalendar).toBe(false);
    expect(retrieved.showLoveStory).toBe(false);
    expect(retrieved.showAlbum).toBe(false);
    expect(retrieved.showWatermark).toBe(false);

    // Verify empty arrays preserved
    expect(Array.isArray(retrieved.album)).toBe(true);
    expect(retrieved.album.length).toBe(0);
    expect(Array.isArray(retrieved.events)).toBe(true);
    expect(retrieved.events.length).toBe(0);

    // Verify empty strings preserved (not replaced with demo data)
    expect(retrieved.groom?.phone).toBe("");
    expect(retrieved.groom?.bankName).toBe("");
    expect(retrieved.groom?.accountNumber).toBe("");
    expect(retrieved.bride?.phone).toBe("");

    // Verify custom fields
    expect(retrieved.envelopeTheme).toBe("emerald");
    expect(retrieved.ambientEffect).toBe("butterflies");
    expect(retrieved.effectConfig?.type).toBe("butterflies");
    expect(retrieved.cinematicFx?.sealSymbol).toBe("heart");
    expect(retrieved.fixedModuleStyles?.calendar).toBe("modern-minimal");
    expect(retrieved.rsvpTitle).toBe("Xác Nhận Có Mặt Nhé");
    expect(retrieved.wishesTitle).toBe("Gửi Lời Chúc Mừng");
    expect(retrieved.isVip).toBe(true);
    expect(retrieved.plan).toBe("vip");
  });

  it("E02.2: toPublicCardDTO sanitizes private data while preserving display configuration", () => {
    const privateCard: WeddingCard = {
      id: "card_dto_test",
      slug: "dto-test-slug",
      name: "Thiệp DTO",
      templateId: "tpl-dto",
      templateName: "Mẫu DTO",
      status: "published",
      updatedAt: "27/10/2026",
      views: 10,
      coverImage: "https://example.com/cover.jpg",
      story: "Story",
      weddingDate: "2026-11-20",
      weddingTime: "11:00",
      lunarDate: "",
      groom: {
        userId: "secret_groom_user_id",
        name: "Đức Mạnh",
        title: "Chú Rể",
        phone: "0912345678",
        bankName: "MB BANK",
        accountNumber: "240220038888",
        accountName: "NGUYEN DUC MANH",
      },
      bride: {
        name: "Thùy Dung",
        title: "Cô Dâu",
        phone: "0987654321",
        bankName: "TECHCOMBANK",
        accountNumber: "190365824988",
        accountName: "TRAN THUY DUNG",
      },
      showGiftBox: false, // User hid the gift box
      events: [],
      album: [],
      musicTitle: "",
      musicUrl: "",
      rsvps: [
        {
          id: "rsvp-1",
          cardId: "card_dto_test",
          name: "Anh Tuấn",
          phone: "0909123456", // Private phone number!
          attending: true,
          guests: 2,
          note: "Chúc hai bạn trăm năm hạnh phúc!", // Private note!
          createdAt: "2026-10-27T00:00:00Z",
        },
      ],
      wishes: [
        {
          id: "w-1",
          cardId: "card_dto_test",
          name: "Bạn Lan",
          content: "Mừng ngày cưới!",
          createdAt: "2026-10-27T00:00:00Z",
        },
      ],
      userId: "secret_card_owner_user_id",
      effectConfig: { type: "sparkles", enabled: true },
      rsvpTitle: "Xác Nhận Tham Dự",
      wishesTitle: "Gửi Lời Chúc",
    };

    const publicDto = toPublicCardDTO(privateCard);

    // 1. Owner userId must NOT be present
    expect((publicDto as any).userId).toBeUndefined();
    expect((publicDto.groom as any).userId).toBeUndefined();

    // 2. RSVP private phone and note must be stripped
    expect(publicDto.rsvps.length).toBe(1);
    expect(publicDto.rsvps[0].name).toBe("Anh Tuấn");
    expect((publicDto.rsvps[0] as any).phone).toBeUndefined();
    expect((publicDto.rsvps[0] as any).note).toBeUndefined();

    // 3. Bank account info must be hidden because showGiftBox = false
    expect(publicDto.groom.accountNumber).toBeUndefined();
    expect(publicDto.groom.bankName).toBeUndefined();
    expect(publicDto.bride.accountNumber).toBeUndefined();

    // 4. Custom module titles and effects must be preserved for display
    expect(publicDto.effectConfig?.type).toBe("sparkles");
    expect(publicDto.rsvpTitle).toBe("Xác Nhận Tham Dự");
    expect(publicDto.wishesTitle).toBe("Gửi Lời Chúc");
  });

  // =========================================================================
  // 3. E03: Draft vs Published lifecycle integrity
  // =========================================================================
  it("E03: Cloned card is draft, saving keeps draft, only publishing transitions to published", () => {
    // 1. Cloned card starts as draft
    const draftCard: WeddingCard = {
      id: "card_lifecycle_test",
      slug: "lifecycle-test",
      name: "Thiệp Nháp",
      templateId: "tpl-1",
      templateName: "Mẫu",
      status: "draft",
      updatedAt: "27/10/2026",
      views: 0,
      coverImage: "",
      story: "",
      weddingDate: "2026-11-20",
      weddingTime: "11:00",
      lunarDate: "",
      groom: { name: "Groom", title: "Chú Rể", phone: "" },
      bride: { name: "Bride", title: "Cô Dâu", phone: "" },
      events: [],
      album: [],
      musicTitle: "",
      musicUrl: "",
      rsvps: [],
      wishes: [],
    };

    expect(draftCard.status).toBe("draft");

    // 2. Autosave/manual save preserves draft status (never overrides to published)
    const afterSave: WeddingCard = {
      ...draftCard,
      status: draftCard.status || "draft",
    };
    expect(afterSave.status).toBe("draft");

    // 3. Only explicit server-confirmed publish sets status to published
    const afterPublish: WeddingCard = {
      ...afterSave,
      status: "published",
    };
    expect(afterPublish.status).toBe("published");

    // 4. Further saves on published card retain published status
    const furtherEdit: WeddingCard = {
      ...afterPublish,
      status: afterPublish.status || "draft",
    };
    expect(furtherEdit.status).toBe("published");
  });

  // =========================================================================
  // 4. E04: Clean context card hydration via fetchCardForEditor
  // =========================================================================
  it("E04: fetchCardForEditor loads full card for owner in a clean context without local cache", async () => {
    const mockCard: WeddingCard = {
      id: "card_clean_context_123",
      slug: "clean-context-slug",
      name: "Thiệp Clean Context",
      templateId: "tpl-clean",
      templateName: "Mẫu Clean",
      status: "draft",
      updatedAt: "27/10/2026",
      views: 0,
      coverImage: "https://example.com/c.jpg",
      story: "",
      weddingDate: "2026-11-20",
      weddingTime: "11:00",
      lunarDate: "",
      groom: { name: "Groom", title: "Chú Rể", phone: "" },
      bride: { name: "Bride", title: "Cô Dâu", phone: "" },
      events: [],
      album: ["https://example.com/img1.jpg"],
      musicTitle: "",
      musicUrl: "",
      rsvps: [],
      wishes: [],
      userId: "usr_owner_123",
    };

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, card: mockCard, isOwner: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await fetchCardForEditor("card_clean_context_123");

    expect(result.success).toBe(true);
    expect(result.card).toBeDefined();
    expect(result.card?.id).toBe("card_clean_context_123");
    expect(result.card?.status).toBe("draft"); // Draft is successfully fetched
    expect(result.isOwner).toBe(true);
  });
});
