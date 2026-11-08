-- Run after supabase_schema.sql and supabase_production_migration.sql.
-- Content and billing writes lock the same card row, preserving unrelated updates.
BEGIN;

CREATE OR REPLACE FUNCTION public.save_card_content(card_key TEXT, content JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    current_card public.cards%ROWTYPE;
    candidate public.cards%ROWTYPE;
    saved public.cards%ROWTYPE;
    safe_content JSONB;
BEGIN
    IF jsonb_typeof(content) IS DISTINCT FROM 'object' THEN
        RAISE EXCEPTION 'Card content must be a JSON object' USING ERRCODE = '22023';
    END IF;
    SELECT c.* INTO current_card FROM public.cards c WHERE c.id = card_key FOR UPDATE;
    IF NOT FOUND THEN RETURN NULL; END IF;

    safe_content := content - ARRAY['id', 'user_id', 'views', 'created_at',
        'isVip', 'plan', 'vipUnlockedAt', 'showWatermark', 'rsvps', 'wishes'];
    candidate := jsonb_populate_record(current_card, safe_content);
    -- Preserve current server-controlled metadata, including changes committed after a GET.
    candidate.groom := COALESCE(current_card.groom, '{}'::JSONB) ||
        (COALESCE(safe_content->'groom', '{}'::JSONB) -
            ARRAY['userId', 'isVip', 'plan', 'vipUnlockedAt', 'showWatermark']);

    UPDATE public.cards c SET
        slug = candidate.slug, name = candidate.name,
        "templateId" = candidate."templateId", "templateName" = candidate."templateName",
        status = candidate.status, "updatedAt" = NOW(),
        "coverImage" = candidate."coverImage", story = candidate.story,
        "weddingDate" = candidate."weddingDate", "weddingTime" = candidate."weddingTime",
        "lunarDate" = candidate."lunarDate", groom = candidate.groom, bride = candidate.bride,
        events = candidate.events, "albumImages" = candidate."albumImages",
        "pageData" = candidate."pageData", "musicUrl" = candidate."musicUrl", "musicTitle" = candidate."musicTitle"
    WHERE c.id = current_card.id RETURNING c.* INTO saved;

    RETURN to_jsonb(saved) || jsonb_build_object(
        'rsvps', COALESCE((SELECT jsonb_agg(r) FROM public.rsvps r WHERE r."cardId" = saved.id), '[]'::JSONB),
        'wishes', COALESCE((SELECT jsonb_agg(w) FROM public.wishes w WHERE w."cardId" = saved.id), '[]'::JSONB)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_card_vip(card_key TEXT, enabled BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    saved public.cards%ROWTYPE;
BEGIN
    IF enabled IS NULL THEN
        RAISE EXCEPTION 'VIP state is required' USING ERRCODE = '22023';
    END IF;
    SELECT c.* INTO saved FROM public.cards c
        WHERE c.id = card_key OR c.slug = card_key
        ORDER BY (c.id = card_key) DESC LIMIT 1 FOR UPDATE;
    IF NOT FOUND THEN RETURN NULL; END IF;

    UPDATE public.cards c SET
        groom = COALESCE(c.groom, '{}'::JSONB) || jsonb_build_object(
            'isVip', enabled, 'plan', CASE WHEN enabled THEN 'vip' ELSE 'free' END,
            'showWatermark', NOT enabled,
            'vipUnlockedAt', CASE WHEN enabled
                THEN COALESCE(NULLIF(c.groom->>'vipUnlockedAt', ''), NOW()::TEXT) ELSE NULL END
        ),
        "updatedAt" = NOW()
    WHERE c.id = saved.id RETURNING c.* INTO saved;

    RETURN to_jsonb(saved) || jsonb_build_object(
        'rsvps', COALESCE((SELECT jsonb_agg(r) FROM public.rsvps r WHERE r."cardId" = saved.id), '[]'::JSONB),
        'wishes', COALESCE((SELECT jsonb_agg(w) FROM public.wishes w WHERE w."cardId" = saved.id), '[]'::JSONB)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.save_card_content(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_card_vip(TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_card_content(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_card_vip(TEXT, BOOLEAN) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
