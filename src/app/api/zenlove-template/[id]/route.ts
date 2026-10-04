import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import lzutf8 from "lzutf8";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const res = await fetch(`https://api.zenlove.me/v1/templates/${id}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `ZenLove API returned status ${res.status}` },
        { status: res.status }
      );
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 });
    }

    const tplData = json.data;
    let parsedNodes: any = null;

    if (tplData.pageData && typeof tplData.pageData === "string") {
      try {
        const decompressed = lzutf8.decompress(tplData.pageData, {
          inputEncoding: "Base64",
        });
        parsedNodes = JSON.parse(decompressed);
      } catch (err) {
        console.error("Failed to decompress pageData:", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...tplData,
        parsedNodes,
      },
    });
  } catch (error: any) {
    console.error("API error fetching template:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
