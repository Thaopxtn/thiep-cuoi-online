import type { WeddingCard } from "@/data/initialCards";
import { apiFetch } from "./apiClient";
import { bulkImportGuests, fetchGuestsForCard, type GuestGroup, type GuestInviteStatus, type GuestItem } from "./guestManagementService";

const groupAliases: Record<string, GuestGroup> = {
  all: "other", groom: "groom_side", bride: "bride_side",
  groom_side: "groom_side", bride_side: "bride_side", friends: "friends",
  colleagues: "colleagues", vip: "vip", other: "other",
};
const statuses: GuestInviteStatus[] = ["not_sent", "sent", "viewed", "confirmed", "declined"];

/** Read-only: old invitation lists remain available even after successful import. */
export function readLegacyBulkGuests(slug: string, storage: Pick<Storage, "getItem"> = localStorage): unknown[] {
  const raw = storage.getItem(`zenlove_guests_${slug}`);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Danh sách khách cũ không hợp lệ. Dữ liệu trên thiết bị vẫn được giữ nguyên.");
  return parsed;
}

function fieldError(index: number): Error {
  return new Error(`Khách số ${index + 1} trong danh sách cũ có thông tin không hợp lệ. Dữ liệu gốc vẫn được giữ nguyên.`);
}

function optionalText(row: Record<string, unknown>, key: string, max: number, index: number): string | undefined {
  const value = row[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || value.length > max) throw fieldError(index);
  return value;
}

function timestamp(value: unknown, fallback: string, index: number): string {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string" || !Number.isFinite(new Date(value).getTime())) throw fieldError(index);
  return new Date(value).toISOString();
}

async function stableLegacyId(cardId: string, row: Record<string, unknown>, index: number): Promise<string> {
  if (typeof row.id === "string" && /^[a-zA-Z0-9_:-]{1,200}$/.test(row.id)) return row.id;
  // An existing malformed id is still a stable identity; otherwise distinguish
  // repeated names by their original row position without mutating the source.
  const identity = typeof row.id === "string" && row.id ? row.id : [index, row];
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([cardId, "legacy-invitations", identity])));
  return `gst_legacy_${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function prepareLegacyBulkGuests(card: WeddingCard, input: readonly unknown[]): Promise<GuestItem[]> {
  const now = new Date().toISOString();
  const result: GuestItem[] = [];
  const ids = new Set<string>();
  for (let index = 0; index < input.length; index += 1) {
    const value = input[index];
    if (!value || typeof value !== "object" || Array.isArray(value)) throw fieldError(index);
    const row = value as Record<string, unknown>;
    if (row.deletedAt) continue;
    if (row.cardId !== undefined && row.cardId !== card.id) throw fieldError(index);
    if (typeof row.name !== "string" || !row.name.trim() || row.name.length > 200) throw fieldError(index);
    const group = row.group === undefined ? "other" : groupAliases[String(row.group)];
    const status = row.status === undefined ? (row.isSent === true ? "sent" : "not_sent") : row.status;
    const estimatedGuests = row.estimatedGuests ?? 1;
    if (!group || typeof status !== "string" || !statuses.includes(status as GuestInviteStatus) ||
        !Number.isInteger(estimatedGuests) || Number(estimatedGuests) < 0 || Number(estimatedGuests) > 1000 ||
        (row.checkedIn !== undefined && typeof row.checkedIn !== "boolean")) throw fieldError(index);
    const id = await stableLegacyId(card.id, row, index);
    if (ids.has(id)) throw new Error("Danh sách cũ có mã khách bị trùng. Dữ liệu gốc vẫn được giữ nguyên.");
    ids.add(id);
    const guest: GuestItem = {
      id, cardId: card.id, name: row.name.trim(), group, status: status as GuestInviteStatus,
      estimatedGuests: Number(estimatedGuests),
      phone: optionalText(row, "phone", 100, index),
      email: optionalText(row, "email", 254, index),
      tableNumber: optionalText(row, "tableNumber", 100, index),
      notes: optionalText(row, "notes", 4000, index),
      rsvpId: optionalText(row, "rsvpId", 200, index),
      createdAt: timestamp(row.createdAt, now, index),
      updatedAt: timestamp(row.updatedAt, now, index),
    };
    if (typeof row.checkedIn === "boolean") guest.checkedIn = row.checkedIn;
    if (row.checkedIn === true && row.checkedInAt !== undefined) guest.checkedInAt = timestamp(row.checkedInAt, now, index);
    result.push(guest);
  }
  return result;
}

export async function prepareBulkInvitationGuests(card: WeddingCard, text: string, group: GuestGroup): Promise<GuestItem[]> {
  const records = bulkImportGuests(card.id, text, group, false);
  const lines = text.split(/[\r\n]+/).map((line) => line.trim()).filter(Boolean);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([card.id, text.trim(), group])));
  const batchId = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return records.map((record, index) => {
    // Preserve the old modal's English group tokens as well as CRM's Vietnamese
    // group/table parser. Contacts and all other metadata stay in the CRM row.
    const explicitGroup = lines[index].split(/[-|,]/).slice(1)
      .map((part) => groupAliases[part.trim().toLowerCase()]).find(Boolean);
    return { ...record, group: explicitGroup || record.group, id: `gst_bulk_${batchId}_${index}` };
  });
}

/** Server import ignores existing ids and tombstones, making retry non-destructive. */
async function importRecords(card: WeddingCard, records: GuestItem[]): Promise<GuestItem[]> {
  for (let offset = 0; offset < records.length; offset += 200) {
    const response = await apiFetch(`/api/cards/${encodeURIComponent(card.id)}/guests`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guests: records.slice(offset, offset + 200) }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.success || !Array.isArray(body.guests) || !Array.isArray(body.rsvps)) {
      throw new Error(body?.message || "Không thể nhập danh sách cũ. Hãy thử lại; dữ liệu gốc vẫn được giữ nguyên.");
    }
  }
  return fetchGuestsForCard(card);
}

export async function importLegacyBulkGuests(card: WeddingCard, input: readonly unknown[]): Promise<GuestItem[]> {
  return importRecords(card, await prepareLegacyBulkGuests(card, input));
}

export async function importBulkInvitationGuests(card: WeddingCard, text: string, group: GuestGroup): Promise<GuestItem[]> {
  return importRecords(card, await prepareBulkInvitationGuests(card, text, group));
}
