-- Disposable local database only. This file never creates or replaces a database.
DO $$ BEGIN
    IF current_database() !~ '^zenlove_qa_[A-Za-z0-9_]+$' THEN
        RAISE EXCEPTION 'QA bootstrap requires a zenlove_qa_* database';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id UUID PRIMARY KEY, email TEXT);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID
LANGUAGE SQL STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', TRUE), '')::UUID $$;
GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
GRANT SELECT ON auth.users TO service_role;
INSERT INTO auth.users(id,email) VALUES
 ('11111111-1111-1111-1111-111111111111','qa-a@example.test'),
 ('22222222-2222-2222-2222-222222222222','qa-b@example.test')
ON CONFLICT (id) DO NOTHING;
