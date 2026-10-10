import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    let userId = "";

    if (supabaseUrl) {
      try {
        const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          userId = authData.id;
        }
      } catch (e) {
        // ignore
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Supabase Storage List API
    // POST /storage/v1/object/list/bucketName
    const listRes = await fetch(`${supabaseUrl}/storage/v1/object/list/wedding-cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        prefix: `${userId}/`,
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      }),
    });

    if (!listRes.ok) {
       return NextResponse.json({ success: false, message: "Failed to fetch files" }, { status: 500 });
    }

    const files = await listRes.json();
    const urls = files.filter((f: any) => f.name && f.name !== ".emptyFolderPlaceholder").map((f: any) => 
      `${supabaseUrl}/storage/v1/object/public/wedding-cards/${userId}/${f.name}`
    );

    return NextResponse.json({ success: true, urls });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
