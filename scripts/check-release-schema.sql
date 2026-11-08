-- Read-only release preflight. Run as the database administrator in Supabase SQL
-- Editor, or with psql -X -v ON_ERROR_STOP=1 -f scripts/check-release-schema.sql.
-- Reads system catalogs only: no card/guest/payment rows and no RPC invocation.
-- This checks structural prerequisites and effective grants, not function bodies
-- or the behavior of RLS expressions. Keep the isolated integration tests as well.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '10s';

DO $preflight$
DECLARE
    issues TEXT[] := ARRAY[]::TEXT[];
    required RECORD;
    relation_id OID;
    function_id OID;
    role_name TEXT;
    privilege_name TEXT;
    column_name TEXT;
    actual_arg_names TEXT[];
    actual_result OID;
    actual_security_definer BOOLEAN;
    actual_config TEXT[];
BEGIN
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = role_name) THEN
            issues := array_append(issues, format('Missing role: %I', role_name));
        END IF;
    END LOOP;

    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname IN ('anon', 'authenticated')
               AND (rolsuper OR rolbypassrls)) THEN
        issues := array_append(issues, 'Browser roles must not be superusers or bypass RLS');
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role'
               AND NOT (rolsuper OR rolbypassrls)) THEN
        issues := array_append(issues, 'service_role must bypass RLS for authorized server operations');
    END IF;

    FOR required IN
        SELECT * FROM (VALUES
            ('cards', ARRAY['id', 'slug', 'name', 'templateId', 'templateName', 'status',
                'updatedAt', 'views', 'coverImage', 'story', 'weddingDate', 'weddingTime',
                'lunarDate', 'groom', 'bride', 'events', 'albumImages', 'pageData',
                'musicUrl', 'musicTitle', 'created_at', 'user_id']),
            ('rsvps', ARRAY['id', 'cardId', 'name', 'phone', 'attending', 'guests', 'note',
                'checkedIn', 'checkedInAt', 'tableNumber', 'createdAt']),
            ('wishes', ARRAY['id', 'cardId', 'name', 'content', 'createdAt']),
            ('payment_transactions', ARRAY['reference_code', 'amount', 'card_id', 'content',
                'claimed_at', 'claim_token', 'processed_at']),
            ('guest_crm', ARRAY['cardId', 'id', 'name', 'phone', 'email', 'group', 'tableNumber',
                'estimatedGuests', 'status', 'notes', 'checkedIn', 'checkedInAt', 'rsvpId',
                'createdAt', 'updatedAt', 'deletedAt'])
        ) AS tables(table_name, columns)
    LOOP
        relation_id := to_regclass(format('public.%I', required.table_name));
        IF relation_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM pg_catalog.pg_class WHERE oid = relation_id AND relkind IN ('r', 'p')
        ) THEN
            issues := array_append(issues, format('Missing table: public.%I', required.table_name));
            CONTINUE;
        END IF;

        FOREACH column_name IN ARRAY required.columns LOOP
            IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_attribute
                           WHERE attrelid = relation_id AND attname = column_name
                             AND attnum > 0 AND NOT attisdropped) THEN
                issues := array_append(issues, format('Missing column: public.%I.%I', required.table_name, column_name));
            END IF;
        END LOOP;

        IF NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = relation_id) THEN
            issues := array_append(issues, format('RLS disabled: public.%I', required.table_name));
        END IF;

        FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
            IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = role_name) THEN CONTINUE; END IF;
            IF NOT has_schema_privilege(role_name, 'public', 'USAGE') THEN
                issues := array_append(issues, format('Missing schema USAGE: %I on public', role_name));
            END IF;
            FOREACH privilege_name IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'] LOOP
                IF role_name = 'service_role' THEN
                    IF NOT has_table_privilege(role_name, relation_id, privilege_name) THEN
                        issues := array_append(issues, format('Missing server grant: %I on public.%I', privilege_name, required.table_name));
                    END IF;
                ELSIF privilege_name <> 'SELECT' THEN
                    IF has_table_privilege(role_name, relation_id, privilege_name)
                       OR (privilege_name IN ('INSERT', 'UPDATE') AND
                           has_any_column_privilege(role_name, relation_id, privilege_name)) THEN
                        issues := array_append(issues, format('Forbidden browser grant: %I %s on public.%I', role_name, privilege_name, required.table_name));
                    END IF;
                ELSIF required.table_name IN ('cards', 'wishes')
                      OR (required.table_name = 'rsvps' AND role_name = 'authenticated') THEN
                    IF NOT has_table_privilege(role_name, relation_id, 'SELECT') THEN
                        issues := array_append(issues, format('Missing read grant: %I on public.%I', role_name, required.table_name));
                    END IF;
                ELSIF has_any_column_privilege(role_name, relation_id, 'SELECT') THEN
                    issues := array_append(issues, format('Forbidden private read grant: %I on public.%I', role_name, required.table_name));
                END IF;
            END LOOP;
            IF role_name <> 'service_role' THEN
                FOREACH privilege_name IN ARRAY ARRAY['TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
                    IF has_table_privilege(role_name, relation_id, privilege_name) THEN
                        issues := array_append(issues, format('Forbidden browser grant: %I %s on public.%I', role_name, privilege_name, required.table_name));
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;

    FOR required IN
        SELECT * FROM (VALUES
            ('public.save_card_content(text,jsonb)', ARRAY['card_key', 'content'], 'jsonb', FALSE),
            ('public.set_card_vip(text,boolean)', ARRAY['card_key', 'enabled'], 'jsonb', FALSE),
            ('public.increment_card_views(text)', ARRAY['card_key'], 'integer', TRUE)
        ) AS functions(signature, argument_names, return_type, security_definer)
    LOOP
        function_id := to_regprocedure(required.signature);
        IF function_id IS NULL THEN
            issues := array_append(issues, format('Missing RPC: %s', required.signature));
            CONTINUE;
        END IF;

        SELECT proargnames, prorettype, prosecdef, proconfig
        INTO actual_arg_names, actual_result, actual_security_definer, actual_config
        FROM pg_catalog.pg_proc WHERE oid = function_id;
        IF actual_arg_names IS DISTINCT FROM required.argument_names THEN
            issues := array_append(issues, format('RPC argument names do not match API payload: %s', required.signature));
        END IF;
        IF actual_result IS DISTINCT FROM to_regtype(required.return_type)::OID THEN
            issues := array_append(issues, format('RPC return type mismatch: %s', required.signature));
        END IF;
        IF actual_security_definer IS DISTINCT FROM required.security_definer
           OR NOT COALESCE(actual_config @> ARRAY['search_path=public'], FALSE) THEN
            issues := array_append(issues, format('RPC security/search_path mismatch: %s', required.signature));
        END IF;

        FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
            IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = role_name) THEN CONTINUE; END IF;
            IF has_function_privilege(role_name, function_id, 'EXECUTE') IS DISTINCT FROM (role_name = 'service_role') THEN
                issues := array_append(issues, format('RPC EXECUTE grant mismatch: %I on %s', role_name, required.signature));
            END IF;
        END LOOP;
    END LOOP;

    -- These SELECT policies support the read grants above. Names/presence cannot
    -- establish the correctness of their expressions; verify A/B behavior separately.
    FOR required IN
        SELECT * FROM (VALUES
            ('cards', 'Public Read Published Cards'),
            ('rsvps', 'Owner Read RSVPs'),
            ('wishes', 'Public Read Wishes')
        ) AS policies(table_name, policy_name)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies
                       WHERE schemaname = 'public' AND tablename = required.table_name
                         AND policyname = required.policy_name AND cmd = 'SELECT') THEN
            issues := array_append(issues, format('Missing SELECT policy: public.%I / %s', required.table_name, required.policy_name));
        END IF;
    END LOOP;

    IF cardinality(issues) > 0 THEN
        RAISE EXCEPTION 'Release schema preflight failed:%', E'\n - ' || array_to_string(issues, E'\n - ')
            USING ERRCODE = '55000',
                  HINT = 'Review schema and the production, card-write and guest-CRM migrations before deployment. This script never applies them.';
    END IF;
END;
$preflight$;

SELECT 'PASS: release schema prerequisites, RLS flags and grants' AS release_schema_status;
ROLLBACK;
