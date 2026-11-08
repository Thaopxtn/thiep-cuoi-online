import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WeddingCard } from "@/data/initialCards";
import type { GuestItem } from "../guestManagementService";

const harness = vi.hoisted(() => ({
  index: 0, slots: [] as any[], updates: [] as number[],
  effects: [] as Array<{ index: number; effect: () => void | (() => void) }>,
  cleanup: new Map<number, () => void>(), loadCard: vi.fn(), loadGuests: vi.fn(),
  save: vi.fn(), remove: vi.fn(), legacy: vi.fn(), importLegacy: vi.fn(), importText: vi.fn(),
  clipboard: vi.fn(), open: vi.fn(), assign: vi.fn(), storageWrite: vi.fn(),
}));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  const same = (left?: unknown[], right?: unknown[]) => Boolean(left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index])));
  const hooks = {
    useState: (initial: unknown) => {
      const index = harness.index++;
      if (!(index in harness.slots)) harness.slots[index] = { value: typeof initial === "function" ? initial() : initial };
      return [harness.slots[index].value, (value: unknown) => {
        harness.updates.push(index);
        harness.slots[index].value = typeof value === "function" ? value(harness.slots[index].value) : value;
      }];
    },
    useRef: (initial: unknown) => {
      const index = harness.index++;
      if (!(index in harness.slots)) harness.slots[index] = { current: initial };
      return harness.slots[index];
    },
    useEffect: (effect: () => void | (() => void), deps?: unknown[]) => {
      const index = harness.index++;
      if (!same(harness.slots[index]?.deps, deps)) harness.effects.push({ index, effect });
      harness.slots[index] = { deps };
    },
    useMemo: (callback: () => unknown) => callback(), useId: () => "bulk-test",
  };
  return { ...actual, ...hooks, default: { ...actual.default, ...hooks } };
});
vi.mock("@/lib/weddingCardService", () => ({ fetchCardForEditor: harness.loadCard }));
vi.mock("@/lib/guestManagementService", () => ({
  fetchGuestsForCard: harness.loadGuests, saveGuestAsync: harness.save, deleteGuestAsync: harness.remove,
  GUEST_GROUPS: [{ id: "friends", label: "Bạn bè" }, { id: "bride_side", label: "Họ nhà gái" }],
  getZaloSharePayload: (guest: GuestItem, card: WeddingCard) => {
    const cardUrl = `https://wedding.example/show/${card.slug}?cardId=${card.id}&guestId=${guest.id}`;
    return { cardUrl, shareText: `Invite ${guest.name} ${cardUrl}`, zaloUrl: `https://zalo.me/share?url=${encodeURIComponent(cardUrl)}` };
  },
}));
vi.mock("@/lib/bulkInvitationService", () => ({ readLegacyBulkGuests: harness.legacy, importLegacyBulkGuests: harness.importLegacy, importBulkInvitationGuests: harness.importText }));
import BulkGuestInvitationModal, { BulkGuestInvitationContent } from "@/components/invitations/BulkGuestInvitationModal";

const card = { id: "card-A", slug: "slug-A", groom: { name: "An" }, bride: { name: "Bình" }, weddingDate: "2026-12-20" } as WeddingCard;
const guest: GuestItem = { id: "guest-A", cardId: card.id, name: "Khách A", group: "friends", status: "not_sent", estimatedGuests: 0,
  email: "guest@example.test", phone: "0912345678", tableNumber: "Bàn VIP", notes: "Giữ ghi chú", checkedIn: true,
  checkedInAt: "2026-11-08T03:30:00Z", rsvpId: "response-A", createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z", source: "crm" };
let props = { isOpen: true, onClose: vi.fn(), cardSlug: card.slug };
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));
function render() { harness.index = 0; return BulkGuestInvitationContent(props); }
function effects() {
  for (const { index, effect } of harness.effects.splice(0)) {
    harness.cleanup.get(index)?.();
    const cleanup = effect();
    if (cleanup) harness.cleanup.set(index, cleanup); else harness.cleanup.delete(index);
  }
}
function unmount() { for (const cleanup of harness.cleanup.values()) cleanup(); harness.cleanup.clear(); }
async function ready() { render(); effects(); await settle(); return render(); }
function textOf(node: React.ReactNode): string {
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return typeof node === "string" || typeof node === "number" ? String(node) : "";
}
function find(node: React.ReactNode, predicate: (element: React.ReactElement<any>) => boolean): React.ReactElement<any> | undefined {
  if (Array.isArray(node)) { for (const child of node) { const match = find(child, predicate); if (match) return match; } }
  else if (React.isValidElement<{ children?: React.ReactNode }>(node)) return predicate(node) ? node : find(node.props.children, predicate);
}
function button(node: React.ReactNode, name: string) {
  const element = find(node, (item) => item.type === "button" && (item.props["aria-label"] === name || textOf(item) === name));
  expect(element, name).toBeDefined();
  return element!;
}

beforeEach(() => {
  vi.clearAllMocks(); harness.index = 0; harness.slots = []; harness.updates = []; harness.effects = []; harness.cleanup.clear();
  props = { isOpen: true, onClose: vi.fn(), cardSlug: card.slug };
  harness.loadCard.mockReset().mockResolvedValue({ success: true, isOwner: true, card });
  harness.loadGuests.mockReset().mockResolvedValue([guest]);
  harness.save.mockReset().mockResolvedValue([guest]); harness.remove.mockReset().mockResolvedValue([]);
  harness.legacy.mockReset().mockReturnValue([]); harness.importLegacy.mockReset().mockResolvedValue([]);
  harness.importText.mockReset().mockResolvedValue([]); harness.clipboard.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal("window", { open: harness.open, location: { origin: "https://wedding.example", assign: harness.assign } });
  vi.stubGlobal("navigator", { clipboard: { writeText: harness.clipboard } });
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: harness.storageWrite, removeItem: vi.fn() });
});
afterEach(() => { unmount(); vi.unstubAllGlobals(); });

describe("Bulk invitation confirmed CRM handlers", () => {
  it("loads the owner's CRM without inserting samples or importing the legacy list automatically", async () => {
    harness.loadGuests.mockResolvedValue([]);
    harness.legacy.mockReturnValue([{ id: "old", name: "Khách cũ" }]);
    const modal = await ready();
    expect(harness.loadCard).toHaveBeenCalledWith(card.slug);
    expect(harness.loadGuests).toHaveBeenCalledWith(card);
    expect(textOf(modal)).toContain("Tổng khách: 0");
    expect(textOf(modal)).not.toContain("Gia đình Bác Hùng");
    expect(harness.importLegacy).not.toHaveBeenCalled();
    expect(harness.save).not.toHaveBeenCalled();
    expect(harness.storageWrite).not.toHaveBeenCalled();
    expect(BulkGuestInvitationModal({ ...props, isOpen: false })).toBeNull();
    expect(BulkGuestInvitationModal(props)?.key).not.toBe(BulkGuestInvitationModal({ ...props, cardSlug: "another" })?.key);
  });

  it("does not read guests or local legacy data when ownership is denied", async () => {
    harness.loadCard.mockResolvedValue({ success: false, isOwner: false, message: "Bạn không có quyền" });
    expect(textOf(await ready())).toContain("Bạn không có quyền");
    expect(harness.loadGuests).not.toHaveBeenCalled();
    expect(harness.legacy).not.toHaveBeenCalled();
  });

  it("changes sent status only after acknowledgement and retains rich guest fields", async () => {
    let acknowledge!: (guests: GuestItem[]) => void;
    harness.save.mockImplementation(() => new Promise<GuestItem[]>((resolve) => { acknowledge = resolve; }));
    const action = button(await ready(), "Đánh dấu đã gửi cho Khách A");
    action.props.onClick(); action.props.onClick();
    expect(harness.save).toHaveBeenCalledTimes(1);
    expect(harness.save.mock.calls[0]).toEqual([card, { ...guest, status: "sent", checkedIn: undefined }, guest]);
    expect(textOf(render())).toContain("Đã gửi: 0");
    acknowledge([{ ...guest, status: "sent" }]); await settle();
    expect(textOf(render())).toContain("Đã gửi: 1");
    expect(button(render(), "Đánh dấu chưa gửi cho Khách A").props.disabled).toBe(false);
  });

  it("keeps confirmed rows and sent status when mutations fail", async () => {
    harness.save.mockRejectedValueOnce(new Error("Không thể lưu trạng thái"));
    button(await ready(), "Đánh dấu đã gửi cho Khách A").props.onClick(); await settle();
    expect(textOf(render())).toContain("Không thể lưu trạng thái");
    expect(textOf(render())).toContain("Đã gửi: 0");
    harness.remove.mockRejectedValueOnce(new Error("Không thể xóa"));
    button(render(), "Xóa khách mời Khách A").props.onClick(); await settle();
    expect(textOf(render())).toContain("Không thể xóa");
    expect(button(render(), "Sao chép link của Khách A")).toBeDefined();
  });

  it("shares CRM identity in every channel without claiming the invitation was delivered", async () => {
    const modal = await ready();
    button(modal, "Soạn lời mời Zalo cho Khách A").props.onClick();
    button(modal, "Soạn SMS cho Khách A").props.onClick();
    button(modal, "Soạn email cho Khách A").props.onClick();
    button(modal, "Sao chép link của Khách A").props.onClick(); await settle();
    expect(harness.clipboard).toHaveBeenCalledWith(expect.stringContaining("cardId=card-A&guestId=guest-A"));
    expect(decodeURIComponent(harness.open.mock.calls[0][0])).toContain("guestId=guest-A");
    expect(decodeURIComponent(harness.assign.mock.calls[0][0])).toContain("guestId=guest-A");
    expect(decodeURIComponent(harness.open.mock.calls[1][0])).toContain("guestId=guest-A");
    expect(harness.save).not.toHaveBeenCalled();
    expect(textOf(render())).toContain("Đã gửi: 0");
  });

  it("keeps legacy input for an explicit retry and shows imported rows only after acknowledgement", async () => {
    const legacy = [{ id: "old", name: "Khách cũ", estimatedGuests: 0 }];
    harness.legacy.mockReturnValue(legacy); harness.loadGuests.mockResolvedValue([]);
    harness.importLegacy.mockRejectedValueOnce(new Error("Mất mạng")).mockResolvedValue([{ ...guest, name: "Khách cũ" }]);
    button(await ready(), "Nhập danh sách cũ vào CRM").props.onClick(); await settle();
    expect(textOf(render())).toContain("Mất mạng");
    expect(textOf(render())).toContain("Tổng khách: 0");
    button(render(), "Nhập danh sách cũ vào CRM").props.onClick(); await settle();
    expect(harness.importLegacy.mock.calls).toEqual([[card, legacy], [card, legacy]]);
    expect(textOf(render())).toContain("Tổng khách: 1");
    expect(harness.storageWrite).not.toHaveBeenCalled();
  });

  it("keeps pasted names after a failed bulk import so retry uses identical input", async () => {
    button(await ready(), "Nhập hàng loạt").props.onClick();
    const raw = "An | bride | an@example.test";
    find(render(), (element) => element.type === "textarea")!.props.onChange({ target: { value: raw } });
    harness.importText.mockRejectedValueOnce(new Error("Lost import response"));
    button(render(), "Thêm vào danh sách").props.onClick(); await settle();
    expect(find(render(), (element) => element.type === "textarea")!.props.value).toBe(raw);
    button(render(), "Thêm vào danh sách").props.onClick(); await settle();
    expect(harness.importText.mock.calls).toEqual([[card, raw, "friends"], [card, raw, "friends"]]);
  });

  it("ignores an older load after switching to another card", async () => {
    const secondCard = { ...card, id: "card-B", slug: "slug-B" };
    const secondGuest = { ...guest, id: "guest-B", cardId: secondCard.id, name: "Khách B" };
    let finishOld!: (guests: GuestItem[]) => void;
    harness.loadGuests.mockImplementationOnce(() => new Promise<GuestItem[]>((resolve) => { finishOld = resolve; })).mockResolvedValue([secondGuest]);
    render(); effects(); await settle();
    harness.loadCard.mockResolvedValue({ success: true, isOwner: true, card: secondCard });
    props = { ...props, cardSlug: secondCard.slug };
    render(); effects(); await settle();
    expect(textOf(render())).toContain("Khách B");
    finishOld([guest]); await settle();
    expect(textOf(render())).toContain("Khách B");
    expect(textOf(render())).not.toContain("Khách A");
  });

  it("does not update a closed session when a pending mutation later succeeds", async () => {
    let acknowledge!: (guests: GuestItem[]) => void;
    harness.save.mockImplementation(() => new Promise<GuestItem[]>((resolve) => { acknowledge = resolve; }));
    button(await ready(), "Đánh dấu đã gửi cho Khách A").props.onClick();
    unmount(); const updatesBeforeAck = harness.updates.length;
    acknowledge([{ ...guest, status: "sent" }]); await settle();
    expect(harness.updates).toHaveLength(updatesBeforeAck);
  });
});
