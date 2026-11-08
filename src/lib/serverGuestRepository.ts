import type { GuestItem } from "./guestManagementService";

function config() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || url.includes("your-project")) throw new Error("Chưa cấu hình kho khách mời trên máy chủ");
  return { url, key };
}

async function query(cardId: string, init: RequestInit = {}, suffix = ""): Promise<GuestItem[]> {
  const { url, key } = config();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${url}/rest/v1/guest_crm?cardId=eq.${encodeURIComponent(cardId)}${suffix}`, {
      ...init, headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}`, Prefer: "return=representation", ...init.headers },
      signal: controller.signal, cache: "no-store",
    });
    if (!res.ok) throw new Error("Không thể lưu hoặc tải khách mời từ cơ sở dữ liệu");
    const rows: unknown = await res.json();
    if (!Array.isArray(rows) || rows.some((row) => !row || row.cardId !== cardId || typeof row.id !== "string")) {
      throw new Error("Máy chủ trả về danh sách khách mời không hợp lệ");
    }
    return rows as GuestItem[];
  } finally { clearTimeout(timer); }
}

/** Tombstones are returned to avoid resurrecting guests when another device imports old data. */
export function listGuestRecords(cardId: string): Promise<GuestItem[]> {
  return query(cardId, {}, "&order=createdAt.desc");
}

export async function importGuestRecords(cardId: string, records: GuestItem[]): Promise<void> {
  if (!records.length) return;
  await query(cardId, {
    method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify(records.map((record) => ({ ...record, cardId }))),
  }, "&on_conflict=cardId,id");
}

export async function updateGuestRecord(cardId: string, guestId: string, updates: Partial<GuestItem>): Promise<GuestItem | null> {
  const rows = await query(cardId, { method: "PATCH", body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() }) }, `&id=eq.${encodeURIComponent(guestId)}&deletedAt=is.null`);
  return rows.length === 1 && rows[0].id === guestId ? rows[0] : null;
}

export async function deleteGuestRecord(cardId: string, guestId: string): Promise<boolean> {
  const rows = await query(cardId, { method: "PATCH", body: JSON.stringify({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }) }, `&id=eq.${encodeURIComponent(guestId)}&deletedAt=is.null`);
  if (rows.length === 1 && rows[0].id === guestId && rows[0].deletedAt) return true;
  // A retry after a lost response is successful only if the tombstone exists.
  return (await listGuestRecords(cardId)).some((row) => row.id === guestId && Boolean(row.deletedAt));
}
