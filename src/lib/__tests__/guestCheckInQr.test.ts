import { describe, expect, it } from "vitest";
import type { GuestItem } from "../guestManagementService";
import { parseGuestCheckInQr, resolveGuestCheckInQr } from "../guestCheckInQr";

const card = { id: "card-1", slug: "ngay-chung-doi" };
const guest: GuestItem = {
  id: "guest-1", cardId: card.id, name: "Nguyễn Văn An", group: "friends",
  estimatedGuests: 2, status: "sent", createdAt: "2026-11-09T00:00:00Z", updatedAt: "2026-11-09T00:00:00Z",
};
const url = (guestId = guest.id) => `https://wedding.example/show/${card.slug}?guestId=${encodeURIComponent(guestId)}&cardId=${card.id}`;
const json = (extra: Record<string, unknown> = {}) => JSON.stringify({
  type: "zenlove-checkin", version: 1, cardId: card.id, guestId: guest.id, ...extra,
});

describe("Guest check-in QR parsing", () => {
  it("parses a personalized URL without treating names or table numbers as identity", () => {
    expect(parseGuestCheckInQr(`${url()}&to=Kh%C3%A1ch+kh%C3%A1c&table=B%C3%A0n+99`)).toEqual({
      success: true, payload: { guestId: guest.id, cardId: card.id, cardSlug: card.slug },
    });
    expect(parseGuestCheckInQr(`/show/${card.slug}/?guestId=rsvp%3Aresponse-1`)).toEqual({
      success: true, payload: { guestId: "rsvp:response-1", cardSlug: card.slug },
    });
  });

  it("parses versioned JSON with either or both card identifiers", () => {
    expect(parseGuestCheckInQr(json({ cardSlug: card.slug }))).toEqual({
      success: true, payload: { guestId: guest.id, cardId: card.id, cardSlug: card.slug },
    });
    expect(parseGuestCheckInQr(json({ cardId: undefined, cardSlug: card.slug }))).toEqual({
      success: true, payload: { guestId: guest.id, cardSlug: card.slug },
    });
  });

  it("does not reinterpret a legacy name-only invitation as a guest record", () => {
    expect(parseGuestCheckInQr(`https://wedding.example/show/${card.slug}?to=Nguy%E1%BB%85n+V%C4%83n+An`))
      .toMatchObject({ success: false, code: "missing_guest_id" });
    expect(parseGuestCheckInQr(`https://wedding.example/show/${card.slug}`))
      .toMatchObject({ success: false, code: "missing_guest_id" });
  });

  it.each(["guest-1", "Nguyễn Văn An", "0912345678", "00020101021238570010A000000727", "javascript:alert(1)",
    "data:text/plain,guest-1", "//wedding.example/show/ngay-chung-doi?guestId=guest-1", "https://wedding.example/api/cards?guestId=guest-1",
    "https://user:password@wedding.example/show/ngay-chung-doi?guestId=guest-1"])("rejects unrelated or ambiguous payloads: %s", (value) => {
    expect(parseGuestCheckInQr(value)).toMatchObject({ success: false, code: "unsupported_payload" });
  });

  it.each([
    "/show/ngay-chung-doi?guestId=guest-1&guestId=guest-2",
    "/show/ngay-chung-doi?guestId=guest-1&cardId=card-1&cardId=card-2",
    "/show/ngay-chung-doi?guestId=guest-1&cardSlug=other-card",
    "/show/ngay-chung-doi?guestId=guest-1&cardId=",
    "/show/ngay-chung-doi?guestId=guest-1%00",
    "/show/ngay-chung-doi?guestId=guest\n-1",
    "/show\\ngay-chung-doi?guestId=guest-1",
    "/show/%E0%A4%A?guestId=guest-1",
    "/show/other%2Fcard?guestId=guest-1",
    "/show/ngay-chung-doi?guestId=",
    "{broken", "[]", json({ guestId: 1 }), json({ cardId: null }), json({ cardSlug: " " }), json({ guestId: " guest-1" }),
  ])("rejects malformed identity data: %s", (value) => {
    expect(parseGuestCheckInQr(value)).toMatchObject({ success: false, code: "invalid_payload" });
  });

  it("rejects unsupported JSON versions and missing identity fields", () => {
    expect(parseGuestCheckInQr(json({ version: 2 }))).toMatchObject({ success: false, code: "unsupported_payload" });
    expect(parseGuestCheckInQr(json({ type: "other-system" }))).toMatchObject({ success: false, code: "unsupported_payload" });
    expect(parseGuestCheckInQr(json({ guestId: undefined }))).toMatchObject({ success: false, code: "missing_guest_id" });
    expect(parseGuestCheckInQr(json({ cardId: undefined }))).toMatchObject({ success: false, code: "missing_card_reference" });
  });

  it("bounds input size and handles empty/non-string decoded results without throwing", () => {
    expect(parseGuestCheckInQr(" \n ")).toMatchObject({ success: false, code: "empty_payload" });
    expect(parseGuestCheckInQr("x".repeat(4097))).toMatchObject({ success: false, code: "invalid_payload" });
    expect(parseGuestCheckInQr(null as unknown as string)).toMatchObject({ success: false, code: "invalid_payload" });
  });
});

describe("Guest check-in QR resolution", () => {
  it("returns the exact guest despite duplicate names, with no mutation or checked-in toggle", () => {
    const checkedInGuest = { ...guest, checkedIn: true, checkedInAt: "2026-11-09T02:00:00Z" };
    const guests = [checkedInGuest, { ...guest, id: "guest-2" }];
    const before = structuredClone(guests);
    const result = resolveGuestCheckInQr(url(), card, guests);
    expect(result).toEqual({ success: true, guest: checkedInGuest });
    if (result.success) expect(result.guest).toBe(checkedInGuest);
    expect(guests).toEqual(before);
  });

  it("supports a current-card ID in the /show route and an exact RSVP-derived guest ID", () => {
    const responseGuest = { ...guest, id: "rsvp:response-1", rsvpId: "response-1", source: "rsvp" as const };
    expect(resolveGuestCheckInQr(`/show/${card.id}?guestId=rsvp%3Aresponse-1`, card, [responseGuest]))
      .toEqual({ success: true, guest: responseGuest });
  });

  it.each([
    `/show/other-card?guestId=guest-1&cardId=${card.id}`,
    `/show/${card.slug}?guestId=guest-1&cardId=other-card`,
    json({ cardId: "other-card" }),
    json({ cardSlug: "other-card" }),
  ])("requires every card marker to match the currently loaded card: %s", (value) => {
    expect(resolveGuestCheckInQr(value, card, [guest])).toMatchObject({ success: false, code: "card_mismatch" });
  });

  it("does not select a foreign guest even if its ID/name matches", () => {
    expect(resolveGuestCheckInQr(url(), card, [{ ...guest, cardId: "other-card" }]))
      .toMatchObject({ success: false, code: "guest_not_found" });
    expect(resolveGuestCheckInQr(url(), card, [{ ...guest, cardId: "other-card" }, guest]))
      .toEqual({ success: true, guest });
  });

  it("rejects unknown/deleted IDs and never falls back to a matching name, phone or RSVP link", () => {
    expect(resolveGuestCheckInQr(url(), card, [{ ...guest, id: "different-id", rsvpId: guest.id }]))
      .toMatchObject({ success: false, code: "guest_not_found" });
    expect(resolveGuestCheckInQr(url(), card, [{ ...guest, deletedAt: "2026-11-09T02:00:00Z" }]))
      .toMatchObject({ success: false, code: "guest_not_found" });
  });

  it("refuses duplicate active guest IDs instead of taking the first match", () => {
    expect(resolveGuestCheckInQr(json(), card, [guest, { ...guest, name: "Khách khác" }]))
      .toMatchObject({ success: false, code: "ambiguous_guest" });
  });
});
