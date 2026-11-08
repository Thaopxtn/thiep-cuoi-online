import type { WeddingCard } from "@/data/initialCards";

const CONTENT_FIELDS = [
  "slug", "name", "templateId", "templateName", "status", "coverImage", "story",
  "weddingDate", "weddingTime", "lunarDate", "events", "album", "musicTitle",
  "musicUrl", "nodes", "showGiftBox", "showWishes", "showRsvp", "showEvents",
  "showCalendar", "showLoveStory", "showAlbum", "envelopeTheme", "ambientEffect",
  "effectConfig", "cinematicFx", "loveStory", "fixedModuleStyles", "rsvpTitle",
  "rsvpMessage", "wishesTitle", "wishesDescription",
] as const satisfies readonly (keyof WeddingCard)[];

const PERSON_FIELDS = [
  "name", "title", "phone", "parents", "bankName", "accountNumber", "accountName", "qrCode",
] as const;

function pickFields(input: Record<string, unknown>, fields: readonly string[]) {
  const picked: Record<string, unknown> = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(input, field)) picked[field] = input[field];
  }
  return picked;
}

/** Content saves never grant ownership or paid entitlements, even for an admin. */
export function buildCardContentWrite(
  input: Record<string, unknown>,
  existing?: WeddingCard,
  newOwnerId?: string,
): Partial<WeddingCard> {
  const groomMetadata = existing?.groom as (WeddingCard["groom"] & Partial<WeddingCard>) | undefined;
  const userId = existing ? existing.userId || groomMetadata?.userId : newOwnerId;
  const isVip = Boolean(existing?.isVip ?? groomMetadata?.isVip ?? false);
  const entitlements = {
    isVip,
    plan: existing?.plan || groomMetadata?.plan || (isVip ? "vip" : "free"),
    vipUnlockedAt: existing?.vipUnlockedAt || groomMetadata?.vipUnlockedAt,
    showWatermark: existing?.showWatermark ?? groomMetadata?.showWatermark ?? !isVip,
  };
  const content = pickFields(input, CONTENT_FIELDS);

  for (const person of ["groom", "bride"] as const) {
    const submitted = input[person];
    const editable = submitted && typeof submitted === "object" && !Array.isArray(submitted)
      ? pickFields(submitted as Record<string, unknown>, PERSON_FIELDS)
      : {};
    content[person] = {
      ...existing?.[person],
      ...editable,
      ...(person === "groom" ? { userId, ...entitlements } : {}),
    };
  }

  return { ...existing, ...content, userId, ...entitlements } as Partial<WeddingCard>;
}
