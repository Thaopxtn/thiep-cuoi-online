// Deliberately public fake credentials for the local PostgreSQL HTTP fixture only.
// Override both server and NEXT_PUBLIC values before Next loads .env.local.
export const qaEnv = {
  SUPABASE_URL: "http://127.0.0.1:55433",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:55433",
  SUPABASE_SERVICE_ROLE_KEY: "qa-service-key",
  SUPABASE_SECRET_KEY: "qa-service-key",
  SUPABASE_PUBLISHABLE_KEY: "qa-anon-key",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "qa-anon-key",
  ADMIN_API_KEY: "qa-admin-api-key-local-only",
  ADMIN_SESSION_SECRET: "qa-admin-session-secret-local-only",
  ADMIN_PASSCODE: "qa-admin-passcode",
  PAYMENT_WEBHOOK_TOKEN: "qa-webhook-token-local-only",
  PAYMENT_ACCOUNT_NUMBER: "0000000000",
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3016",
  NEXT_TELEMETRY_DISABLED: "1",
};
