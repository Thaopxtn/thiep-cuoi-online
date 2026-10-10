import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ success: false, message: "Thiếu cấu hình Supabase" }, { status: 500 });
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/colors?select=id,name,hex&order=name.asc`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch colors: ${errText}`);
    }
    
    const colors = await res.json();
    return NextResponse.json({ success: true, colors });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
