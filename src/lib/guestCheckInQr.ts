import type { WeddingCard } from "@/data/initialCards";
import type { GuestItem } from "./guestManagementService";

export type GuestCheckInQrErrorCode =
  | "empty_payload"
  | "invalid_payload"
  | "unsupported_payload"
  | "missing_guest_id"
  | "missing_card_reference"
  | "card_mismatch"
  | "guest_not_found"
  | "ambiguous_guest";

export interface GuestCheckInQrPayload {
  guestId: string;
  cardId?: string;
  /** The /show route identifier, which can be the card slug or its ID. */
  cardSlug?: string;
}

export interface GuestCheckInQrFailure {
  success: false;
  code: GuestCheckInQrErrorCode;
  message: string;
}

export type GuestCheckInQrParseResult =
  | { success: true; payload: GuestCheckInQrPayload }
  | GuestCheckInQrFailure;

export type GuestCheckInQrResult =
  | { success: true; guest: GuestItem }
  | GuestCheckInQrFailure;

const ERROR_MESSAGES: Record<GuestCheckInQrErrorCode, string> = {
  empty_payload: "Chưa nhận được nội dung mã QR.",
  invalid_payload: "Nội dung mã QR không hợp lệ.",
  unsupported_payload: "Mã QR này không phải mã điểm danh ZenLove.",
  missing_guest_id: "Mã QR chỉ mở thiệp, chưa có mã khách mời. Hãy tìm khách bằng tên hoặc số điện thoại.",
  missing_card_reference: "Mã QR chưa xác định thiệp cưới.",
  card_mismatch: "Mã QR thuộc thiệp khác. Vui lòng quét mã của thiệp đang mở.",
  guest_not_found: "Không tìm thấy khách mời trong thiệp này. Hãy làm mới danh sách hoặc tìm khách thủ công.",
  ambiguous_guest: "Mã khách mời bị trùng trong danh sách. Vui lòng tìm và chọn khách thủ công.",
};

function failure(code: GuestCheckInQrErrorCode): GuestCheckInQrFailure {
  return { success: false, code, message: ERROR_MESSAGES[code] };
}

function isIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 256
    && value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value);
}

/**
 * Accepts an invitation URL /show/{slug}?guestId={id}[&cardId={id}], or:
 * { type: "zenlove-checkin", version: 1, guestId, cardId?, cardSlug? }.
 * Names, phone numbers and bare IDs never identify a guest automatically.
 * A QR is a locator, not an authorization token; server ownership checks still apply.
 */
export function parseGuestCheckInQr(raw: string): GuestCheckInQrParseResult {
  if (typeof raw !== "string") return failure("invalid_payload");
  if (!raw.trim()) return failure("empty_payload");
  if (raw.length > 4096) return failure("invalid_payload");
  const value = raw.trim();

  if (value.startsWith("{") || value.startsWith("[")) {
    let parsed: unknown;
    try { parsed = JSON.parse(value); } catch { return failure("invalid_payload"); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return failure("invalid_payload");
    const fields = parsed as Record<string, unknown>;
    if (fields.type !== "zenlove-checkin" || fields.version !== 1) return failure("unsupported_payload");
    if (fields.guestId === undefined) return failure("missing_guest_id");
    if (!isIdentifier(fields.guestId)) return failure("invalid_payload");
    if ((fields.cardId !== undefined && !isIdentifier(fields.cardId))
        || (fields.cardSlug !== undefined && !isIdentifier(fields.cardSlug))) return failure("invalid_payload");
    if (fields.cardId === undefined && fields.cardSlug === undefined) return failure("missing_card_reference");
    return {
      success: true,
      payload: {
        guestId: fields.guestId,
        ...(typeof fields.cardId === "string" ? { cardId: fields.cardId } : {}),
        ...(typeof fields.cardSlug === "string" ? { cardSlug: fields.cardSlug } : {}),
      },
    };
  }

  if ((!value.startsWith("/") && !/^https?:\/\//i.test(value)) || value.startsWith("//")) {
    return failure("unsupported_payload");
  }
  // URL() silently removes tabs/newlines and normalizes backslashes. Reject
  // those inputs rather than changing the card/guest identifier that was scanned.
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return failure("invalid_payload");
  let url: URL;
  try { url = new URL(value, "https://zenlove.invalid"); } catch { return failure("invalid_payload"); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return failure("unsupported_payload");
  const match = url.pathname.match(/^\/show\/([^/]+)\/?$/);
  if (!match) return failure("unsupported_payload");
  let cardSlug: string;
  try { cardSlug = decodeURIComponent(match[1]); } catch { return failure("invalid_payload"); }
  if (!isIdentifier(cardSlug) || /[/\\]/.test(cardSlug)) return failure("invalid_payload");

  const guestIds = url.searchParams.getAll("guestId");
  const cardIds = url.searchParams.getAll("cardId");
  const cardSlugs = url.searchParams.getAll("cardSlug");
  if (guestIds.length === 0) return failure("missing_guest_id");
  if (guestIds.length !== 1 || cardIds.length > 1 || cardSlugs.length > 1
      || !isIdentifier(guestIds[0])
      || (cardIds.length === 1 && !isIdentifier(cardIds[0]))
      || (cardSlugs.length === 1 && cardSlugs[0] !== cardSlug)) return failure("invalid_payload");

  return {
    success: true,
    payload: { guestId: guestIds[0], cardSlug, ...(cardIds.length ? { cardId: cardIds[0] } : {}) },
  };
}

/** Resolves only one active guest with the exact ID in the currently loaded card. */
export function resolveGuestCheckInQr(
  raw: string,
  card: Pick<WeddingCard, "id" | "slug">,
  guests: readonly GuestItem[],
): GuestCheckInQrResult {
  const parsed = parseGuestCheckInQr(raw);
  if (!parsed.success) return parsed;
  const { payload } = parsed;
  if ((payload.cardId !== undefined && payload.cardId !== card.id)
      || (payload.cardSlug !== undefined && payload.cardSlug !== card.slug && payload.cardSlug !== card.id)) {
    return failure("card_mismatch");
  }

  const matches = guests.filter((guest) =>
    guest.id === payload.guestId && guest.cardId === card.id && !guest.deletedAt,
  );
  if (matches.length === 0) return failure("guest_not_found");
  if (matches.length !== 1) return failure("ambiguous_guest");
  return { success: true, guest: matches[0] };
}
