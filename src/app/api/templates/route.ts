import { NextRequest, NextResponse } from "next/server";
import { ZENLOVE_TEMPLATES, ZENLOVE_CATEGORIES } from "@/data/zenloveTemplates";

export const dynamic = "force-dynamic";

/**
 * GET /api/templates
 * Kho mẫu thiệp cưới độc lập 100% (Không phụ thuộc ZenLove)
 * Hỗ trợ lọc theo categorySlug, tìm kiếm keyword, phân trang page/limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || searchParams.get("cat") || "all";
    const search = (searchParams.get("q") || searchParams.get("search") || "").toLowerCase().trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "24", 10)));

    let filtered = [...ZENLOVE_TEMPLATES];

    // Lọc theo danh mục
    if (category && category !== "all") {
      filtered = filtered.filter(
        (t) =>
          t.categorySlug === category ||
          t.categoryId === category ||
          (t as any).idCat === category
      );
    }

    // Tìm kiếm theo từ khóa
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.slug.toLowerCase().includes(search) ||
          (t.description && t.description.toLowerCase().includes(search))
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      source: "self_hosted",
      total,
      page,
      totalPages,
      limit,
      categories: ZENLOVE_CATEGORIES,
      templates: paginated,
    });
  } catch (error: any) {
    console.error("GET /api/templates error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tải kho mẫu" },
      { status: 500 }
    );
  }
}
