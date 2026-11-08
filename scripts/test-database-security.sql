-- Run only in a disposable PostgreSQL/Supabase test database after both migrations.
-- Fixtures and grants are rolled back even when every assertion succeeds.
BEGIN;
SET LOCAL ROLE service_role;
INSERT INTO public.cards(id, slug, name, status, user_id, groom) VALUES
    ('qa-db-owner', 'qa-db-owner', 'Private QA card', 'draft',
     '11111111-1111-1111-1111-111111111111', '{"isVip":false,"plan":"free"}'),
    ('qa-db-public', 'qa-db-public', 'Public QA card', 'published',
     '11111111-1111-1111-1111-111111111111', '{}');
INSERT INTO public.rsvps(id, "cardId", name, phone) VALUES
    ('qa-db-rsvp', 'qa-db-owner', 'Test guest', '0912345678');
UPDATE public.cards SET groom = groom || '{"isVip":true,"plan":"vip"}' WHERE id = 'qa-db-owner';
UPDATE public.rsvps SET "checkedIn"=TRUE, "checkedInAt"=NOW(), "tableNumber"='Bàn 4' WHERE id='qa-db-rsvp';
INSERT INTO public.payment_transactions(reference_code, amount, processed_at, claim_token)
    VALUES ('qa-db-tx', 99000, NULL, 'test-claim-only');
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.rsvps WHERE id='qa-db-rsvp' AND "checkedIn" AND "tableNumber"='Bàn 4') THEN
        RAISE EXCEPTION 'Check-in columns did not persist';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.payment_transactions WHERE reference_code='qa-db-tx' AND processed_at IS NULL AND claimed_at IS NOT NULL) THEN
        RAISE EXCEPTION 'Payment claim did not remain pending';
    END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.cards WHERE id='qa-db-owner') OR
       NOT EXISTS (SELECT 1 FROM public.rsvps WHERE id='qa-db-rsvp') THEN
        RAISE EXCEPTION 'Owner cannot read their private card or RSVP';
    END IF;
    BEGIN
        UPDATE public.cards SET groom='{"isVip":true}' WHERE id='qa-db-owner';
        RAISE EXCEPTION 'Direct user writes bypassed the API entitlement guard';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        DELETE FROM public.rsvps WHERE id='qa-db-rsvp';
        RAISE EXCEPTION 'Direct user deletion bypassed the authorized API';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;
SET LOCAL request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM public.cards WHERE id='qa-db-owner') OR
       EXISTS (SELECT 1 FROM public.rsvps WHERE id='qa-db-rsvp') THEN
        RAISE EXCEPTION 'Another user can read private card or guest data';
    END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM public.cards WHERE id='qa-db-owner') OR
       NOT EXISTS (SELECT 1 FROM public.cards WHERE id='qa-db-public') THEN
        RAISE EXCEPTION 'Public card visibility is incorrect';
    END IF;
    IF has_table_privilege(current_user, 'public.rsvps', 'SELECT') OR
       has_table_privilege(current_user, 'public.cards', 'INSERT') OR
       has_table_privilege(current_user, 'public.cards', 'UPDATE') OR
       has_table_privilege(current_user, 'public.payment_transactions', 'SELECT') THEN
        RAISE EXCEPTION 'Anonymous role retains private access or write access';
    END IF;
END $$;
ROLLBACK;
