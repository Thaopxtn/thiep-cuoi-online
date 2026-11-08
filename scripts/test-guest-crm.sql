-- Disposable local QA database only. All fixtures roll back.
BEGIN;
SET LOCAL ROLE service_role;
INSERT INTO public.cards(id, slug, name, status, user_id, groom) VALUES
 ('qa-crm-card-a', 'qa-crm-card-a', 'Private CRM QA A', 'draft', '11111111-1111-1111-1111-111111111111', '{}'),
 ('qa-crm-card-b', 'qa-crm-card-b', 'Private CRM QA B', 'draft', '22222222-2222-2222-2222-222222222222', '{}');
INSERT INTO public.rsvps(id, "cardId", name, phone, attending, guests, "checkedIn")
VALUES ('qa-crm-rsvp', 'qa-crm-card-a', 'RSVP guest', '0912345678', TRUE, 2, FALSE);
INSERT INTO public.guest_crm("cardId", id, name, phone, email, "group", "tableNumber", "estimatedGuests", status, notes, "rsvpId")
VALUES ('qa-crm-card-a', 'legacy-stable-1', 'Manual guest', '0912345678', 'private@example.test', 'vip', 'Bàn 8', 0, 'confirmed', 'Manual private notes', 'qa-crm-rsvp');
-- A stable local id can be imported repeatedly without replacing newer server metadata.
INSERT INTO public.guest_crm("cardId", id, name, "group", "estimatedGuests", status)
VALUES ('qa-crm-card-a', 'legacy-stable-1', 'Stale browser name', 'other', 1, 'not_sent')
ON CONFLICT ("cardId", id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.guest_crm WHERE "cardId"='qa-crm-card-a' AND id='legacy-stable-1'
   AND name='Manual guest' AND "group"='vip' AND "tableNumber"='Bàn 8' AND "estimatedGuests"=0
   AND status='confirmed' AND NOT "checkedIn" AND notes='Manual private notes') THEN
   RAISE EXCEPTION 'CRM metadata changed during idempotent import or invitation status counted as check-in';
 END IF;
END $$;
UPDATE public.guest_crm SET "checkedIn"=TRUE, "checkedInAt"=NOW()
WHERE "cardId"='qa-crm-card-a' AND id='legacy-stable-1';
UPDATE public.guest_crm SET "checkedIn"=FALSE, "checkedInAt"=NULL, "deletedAt"=NOW()
WHERE "cardId"='qa-crm-card-a' AND id='legacy-stable-1';
-- Another device's old cache must not resurrect this tombstone.
INSERT INTO public.guest_crm("cardId", id, name, "group", "estimatedGuests", status)
VALUES ('qa-crm-card-a', 'legacy-stable-1', 'Stale deleted guest', 'friends', 5, 'sent')
ON CONFLICT ("cardId", id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.guest_crm WHERE "cardId"='qa-crm-card-a' AND id='legacy-stable-1'
   AND "deletedAt" IS NOT NULL AND "checkedInAt" IS NULL AND status='confirmed') THEN
   RAISE EXCEPTION 'Stale import resurrected a deletion or check-in undo changed invitation status';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.rsvps WHERE id='qa-crm-rsvp') THEN
   RAISE EXCEPTION 'Deleting CRM erased RSVP response history';
 END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';
DO $$ BEGIN
 IF has_table_privilege(current_user, 'public.guest_crm', 'SELECT') OR
    has_table_privilege(current_user, 'public.guest_crm', 'INSERT') OR
    has_table_privilege(current_user, 'public.guest_crm', 'UPDATE') OR
    has_table_privilege(current_user, 'public.guest_crm', 'DELETE') THEN
   RAISE EXCEPTION 'Owner can bypass the guest API';
 END IF;
 BEGIN
   PERFORM name FROM public.guest_crm LIMIT 1;
   RAISE EXCEPTION 'Direct CRM read bypassed API authorization';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
SET LOCAL request.jwt.claim.sub='22222222-2222-2222-2222-222222222222';
DO $$ BEGIN
 BEGIN
   UPDATE public.guest_crm SET notes='forged by owner B' WHERE "cardId"='qa-crm-card-a';
   RAISE EXCEPTION 'Owner B can change owner A CRM';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF has_table_privilege(current_user, 'public.guest_crm', 'SELECT') OR
    has_table_privilege(current_user, 'public.guest_crm', 'INSERT') OR
    has_table_privilege(current_user, 'public.guest_crm', 'UPDATE') OR
    has_table_privilege(current_user, 'public.guest_crm', 'DELETE') THEN
   RAISE EXCEPTION 'Anonymous access to private CRM remains enabled';
 END IF;
END $$;
ROLLBACK;
