import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/serverDb";
import { verifyAdminAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/health
 * Kiểm tra trạng thái sức khỏe và kết nối các dịch vụ hạ tầng (Yêu cầu quyền Admin)
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error || "Không có quyền xem thông tin hạ tầng hệ thống" },
      { status: 401 }
    );
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const databaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY);
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const hasR2 = Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
    const hasWebhookToken = Boolean(process.env.PAYMENT_WEBHOOK_TOKEN);

    // Kiểm tra ping Supabase
    let dbPing = false;
    let latencyMs: number | null = null;
    let databaseStatus = "unconfigured";
    if (isDbConfigured) {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      try {
        const pingRes = await fetch(`${supabaseUrl}/rest/v1/cards?select=id&limit=1`, {
          headers: {
            apikey: databaseKey,
            Authorization: `Bearer ${databaseKey}`,
          },
          cache: "no-store",
          signal: controller.signal,
        });
        // Keep the deadline active while reading the response body as well.
        const data = pingRes.ok ? await pingRes.json() : null;
        dbPing = pingRes.ok && Array.isArray(data);
        databaseStatus = dbPing ? "live" : "unavailable";
      } catch {
        databaseStatus = controller.signal.aborted ? "timeout" : "unavailable";
      } finally {
        clearTimeout(timeout);
        latencyMs = Date.now() - start;
      }
    }

    return NextResponse.json({
      success: dbPing,
      status: dbPing ? "healthy" : "degraded",
      source: dbPing ? "database" : "unavailable",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          name: "Supabase Cloud Database",
          configured: isDbConfigured,
          connected: dbPing,
          status: databaseStatus,
          latency: latencyMs === null ? "Chưa đo" : `${latencyMs}ms`,
          latencyMs,
          endpoint: supabaseUrl ? supabaseUrl.replace(/https:\/\/(.{4}).*(\..*)/, "https://$1***$2") : "Chưa cấu hình",
        },
        storage: {
          name: "Cloudflare R2 Object Storage",
          configured: hasR2,
          bucket: process.env.R2_BUCKET_NAME || "thiep-cuoi-assets",
          publicDomain: process.env.R2_PUBLIC_DOMAIN || "cdn.thiepcuoixinh.com",
        },
        webhook: {
          name: "Payment & Webhook Banking",
          configured: hasWebhookToken,
          endpoint: "/api/webhook/payment",
        },
        auth: {
          name: "Supabase Authentication",
          configured: hasAnonKey && hasServiceKey,
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005",
      },
    }, { status: dbPing ? 200 : 503 });
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/health:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi kiểm tra hệ thống" },
      { status: 500 }
    );
  }
}
