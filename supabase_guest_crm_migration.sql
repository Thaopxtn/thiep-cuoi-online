-- Apply after supabase_schema.sql and supabase_production_migration.sql.
-- Legacy browser imports preserve ids; tombstones prevent stale devices from resurrecting deletions.
CREATE TABLE IF NOT EXISTS public.guest_crm (
    "cardId" TEXT NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    "group" TEXT NOT NULL CHECK ("group" IN ('groom_side', 'bride_side', 'friends', 'colleagues', 'vip', 'other')),
    "tableNumber" TEXT,
    "estimatedGuests" INTEGER NOT NULL DEFAULT 1 CHECK ("estimatedGuests" BETWEEN 0 AND 1000),
    status TEXT NOT NULL DEFAULT 'not_sent' CHECK (status IN ('not_sent', 'sent', 'viewed', 'confirmed', 'declined')),
    notes TEXT,
    "checkedIn" BOOLEAN NOT NULL DEFAULT FALSE,
    "checkedInAt" TIMESTAMPTZ,
    "rsvpId" TEXT REFERENCES public.rsvps(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ,
    PRIMARY KEY ("cardId", id)
);
CREATE INDEX IF NOT EXISTS idx_guest_crm_card ON public.guest_crm("cardId");
ALTER TABLE public.guest_crm ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.guest_crm FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.guest_crm TO service_role;
-- Guest data is private even when the invitation is public; API ownership checks gate all access.
