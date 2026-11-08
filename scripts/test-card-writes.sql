-- Disposable QA database only; fixtures and writes are rolled back.
BEGIN;
DO $$ BEGIN
    IF current_database() !~ '^zenlove_qa_[A-Za-z0-9_]+$' THEN
        RAISE EXCEPTION 'Card write assertions require a zenlove_qa_* database';
    END IF;
END $$;
SET LOCAL ROLE service_role;
INSERT INTO public.cards(id,slug,name,status,user_id,views,groom,bride,"albumImages","musicUrl",story)
VALUES ('qa-card-write','qa-card-write','Original card','draft',
 '11111111-1111-1111-1111-111111111111',42,
 '{"name":"Original groom","userId":"11111111-1111-1111-1111-111111111111","isVip":true,"plan":"vip","showWatermark":false,"vipUnlockedAt":"2026-11-01T00:00:00Z"}',
 '{"name":"Bride"}','["original.webp"]','original.mp3','Original story');
INSERT INTO public.rsvps(id,"cardId",name,phone,attending,guests)
VALUES ('qa-card-write-rsvp','qa-card-write','QA response','0912345678',TRUE,2);
INSERT INTO public.wishes(id,"cardId",name,content)
VALUES ('qa-card-write-wish','qa-card-write','QA well-wisher','Congratulations');

DO $$ DECLARE saved JSONB; BEGIN
    saved := public.save_card_content('qa-card-write','{
        "id":"forged-id","user_id":"22222222-2222-2222-2222-222222222222","views":0,
        "isVip":false,"plan":"free","showWatermark":true,"vipUnlockedAt":"forged",
        "name":"Newest content","albumImages":[],"musicUrl":"","musicTitle":"","coverImage":"","story":"","events":[],
        "groom":{"name":"Newest groom","userId":"22222222-2222-2222-2222-222222222222","isVip":false,"plan":"free","showWatermark":true,"vipUnlockedAt":"forged","showAlbum":false},
        "rsvps":[],"wishes":[]
    }'::JSONB);
    IF saved->>'id' IS DISTINCT FROM 'qa-card-write' OR
       saved->>'user_id' IS DISTINCT FROM '11111111-1111-1111-1111-111111111111' OR
       (saved->>'views')::INTEGER IS DISTINCT FROM 42 OR
       saved#>>'{groom,userId}' IS DISTINCT FROM '11111111-1111-1111-1111-111111111111' OR
       saved#>'{groom,isVip}' IS DISTINCT FROM 'true'::JSONB OR
       saved#>>'{groom,plan}' IS DISTINCT FROM 'vip' OR
       saved#>'{groom,showWatermark}' IS DISTINCT FROM 'false'::JSONB OR
       saved#>>'{groom,vipUnlockedAt}' IS DISTINCT FROM '2026-11-01T00:00:00Z' THEN
        RAISE EXCEPTION 'Stale content replaced current ownership, views, or VIP';
    END IF;
    IF saved->'albumImages' IS DISTINCT FROM '[]'::JSONB OR saved->'events' IS DISTINCT FROM '[]'::JSONB OR
       saved->>'musicUrl' IS DISTINCT FROM '' OR saved->>'musicTitle' IS DISTINCT FROM '' OR
       saved->>'coverImage' IS DISTINCT FROM '' OR saved->>'story' IS DISTINCT FROM '' OR
       saved#>'{groom,showAlbum}' IS DISTINCT FROM 'false'::JSONB OR
       saved#>>'{groom,name}' IS DISTINCT FROM 'Newest groom' THEN
        RAISE EXCEPTION 'Content write failed to preserve explicit empty values or false';
    END IF;
    IF jsonb_array_length(saved->'rsvps') IS DISTINCT FROM 1 OR
       jsonb_array_length(saved->'wishes') IS DISTINCT FROM 1 THEN
        RAISE EXCEPTION 'Content response lost persisted RSVP or wish relations';
    END IF;

    saved := public.set_card_vip('qa-card-write',FALSE);
    saved := public.set_card_vip('qa-card-write',TRUE);
    IF saved#>>'{groom,name}' IS DISTINCT FROM 'Newest groom' OR
       saved->>'name' IS DISTINCT FROM 'Newest content' OR
       saved#>'{groom,isVip}' IS DISTINCT FROM 'true'::JSONB OR
       jsonb_array_length(saved->'rsvps') IS DISTINCT FROM 1 OR
       jsonb_array_length(saved->'wishes') IS DISTINCT FROM 1 THEN
        RAISE EXCEPTION 'VIP write reverted latest content or omitted relations';
    END IF;

    saved := public.save_card_content('qa-card-write','{"status":"published"}'::JSONB);
    IF saved->>'status' IS DISTINCT FROM 'published' OR saved->>'name' IS DISTINCT FROM 'Newest content' OR
       saved#>>'{groom,name}' IS DISTINCT FROM 'Newest groom' OR saved->'albumImages' IS DISTINCT FROM '[]'::JSONB OR
       saved->>'musicUrl' IS DISTINCT FROM '' OR saved#>'{groom,isVip}' IS DISTINCT FROM 'true'::JSONB THEN
        RAISE EXCEPTION 'Status-only publish reverted existing content or VIP';
    END IF;
    IF public.save_card_content('qa-card-missing','{"name":"Must not resurrect"}'::JSONB) IS NOT NULL OR
       public.set_card_vip('qa-card-missing',TRUE) IS NOT NULL OR
       EXISTS(SELECT 1 FROM public.cards WHERE id='qa-card-missing') THEN
        RAISE EXCEPTION 'Write RPC recreated a missing card';
    END IF;
    BEGIN
        PERFORM public.save_card_content('qa-card-write','[]'::JSONB);
        RAISE EXCEPTION 'Non-object content was accepted';
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;
END $$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';
DO $$ BEGIN
    IF has_function_privilege(current_user,'public.save_card_content(TEXT,JSONB)','EXECUTE') OR
       has_function_privilege(current_user,'public.set_card_vip(TEXT,BOOLEAN)','EXECUTE') THEN
        RAISE EXCEPTION 'Authenticated browser can call protected write RPCs';
    END IF;
    BEGIN
        PERFORM public.save_card_content('qa-card-write','{"name":"forged"}'::JSONB);
        RAISE EXCEPTION 'Authenticated browser bypassed the content API';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        PERFORM public.set_card_vip('qa-card-write',TRUE);
        RAISE EXCEPTION 'Authenticated browser bypassed billing authorization';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
    IF has_function_privilege(current_user,'public.save_card_content(TEXT,JSONB)','EXECUTE') OR
       has_function_privilege(current_user,'public.set_card_vip(TEXT,BOOLEAN)','EXECUTE') THEN
        RAISE EXCEPTION 'Anonymous browser can call protected write RPCs';
    END IF;
    BEGIN
        PERFORM public.set_card_vip('qa-card-write',TRUE);
        RAISE EXCEPTION 'Anonymous browser bypassed billing authorization';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;
ROLLBACK;
