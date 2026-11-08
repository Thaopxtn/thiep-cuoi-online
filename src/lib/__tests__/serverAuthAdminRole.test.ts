import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

describe("Server authority for admin roles", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://auth.example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rejects an admin role supplied in user-editable metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      id: "ordinary-user",
      app_metadata: { role: "user" },
      user_metadata: { role: "admin" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const { verifyUserAuth, verifyAdminAuth } = await import("../serverAuth");
    const request = new NextRequest("https://app.example.test/api/admin/cards", {
      headers: { Authorization: "Bearer user-editable-role-token" },
    });

    expect(await verifyUserAuth(request)).toMatchObject({
      authenticated: true, userId: "ordinary-user", isAdmin: false,
    });
    expect((await verifyAdminAuth(request)).authenticated).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("accepts an admin role assigned through app_metadata", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      id: "server-appointed-admin",
      app_metadata: { role: "admin" },
      user_metadata: { role: "user" },
    })));
    const { verifyAdminAuth } = await import("../serverAuth");
    const request = new NextRequest("https://app.example.test/api/admin/cards", {
      headers: { Authorization: "Bearer server-appointed-admin-token" },
    });

    expect(await verifyAdminAuth(request)).toEqual({ authenticated: true });
  });
});
