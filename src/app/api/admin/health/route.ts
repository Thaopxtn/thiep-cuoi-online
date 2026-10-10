import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY);
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const hasR2 = Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID);
    const hasWebhookToken = Boolean(process.env.PAYMENT_WEBHOOK_TOKEN);

    // Kiểm tra ping Supabase
    let dbPing = false;
    let latencyMs = 0;
    if (isDbConfigured) {
      const start = Date.now();
      try {
        const pingRes = await fetch(`${supabaseUrl}/rest/v1/cards?select=id&limit=1`, {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
          },
          cache: "no-store",
        });
        dbPing = pingRes.ok;
        latencyMs = Date.now() - start;
      } catch (e) {
        dbPing = false;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        database: {
          name: "Supabase Cloud Database",
          configured: isDbConfigured,
          connected: dbPing,
          latency: `${latencyMs}ms`,
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
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/health:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi kiểm tra hệ thống" },
      { status: 500 }
    );
  }
}
