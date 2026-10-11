import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, getRsvpsFromDb } from "@/lib/serverDb";
import { verifyUserAuth, verifyAdminAuth, isCardOwner } from "@/lib/serverAuth";
import { sanitizeCsvField } from "@/lib/securityUtils";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/**
 * GET /api/cards/[id]/export
 * Xuất danh sách khách mời xác nhận tham dự thành file CSV chuẩn UTF-8
 * Bảo vệ: BOLA/IDOR (chỉ chủ thiệp hoặc Admin) + Chống CSV Formula Injection
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = params;
  try {
    const userAuth = await verifyUserAuth(request);
    const adminAuth = await verifyAdminAuth(request);

    // 1. Yêu cầu đăng nhập hoặc quyền Admin
    if (!userAuth.authenticated && !adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để xuất danh sách khách mời." },
        { status: 401 }
      );
    }

    const card = await getCardByIdOrSlugFromDb(id);
    if (!card) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy thiệp cưới" },
        { status: 404 }
      );
    }

    // 2. Multi-tenancy check: Xác thực quyền sở hữu thiệp
    const isOwner = userAuth.authenticated && userAuth.userId && isCardOwner(card, userAuth.userId);
    if (!isOwner && !adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, message: "Bạn không có quyền tải danh sách khách mời của thiệp này" },
        { status: 403 }
      );
    }

    const rsvps = await getRsvpsFromDb(card.id);

    // Header UTF-8 Byte Order Mark (\uFEFF) giúp Excel mở file tiếng Việt chuẩn
    const BOM = "\uFEFF";
    const headers = ["STT", "Họ và tên", "Số điện thoại", "Trạng thái", "Số người", "Lời nhắn", "Thời gian gửi"];

    // 3. Sử dụng sanitizeCsvField để triệt tiêu lỗ hổng CSV Formula Injection
    const rows = rsvps.map((r, index) => [
      sanitizeCsvField(index + 1),
      sanitizeCsvField(r.name || ""),
      sanitizeCsvField(r.phone || ""),
      sanitizeCsvField(r.attending ? "Có tham dự" : "Không thể đến"),
      sanitizeCsvField(r.attending ? r.guests || 1 : 0),
      sanitizeCsvField(r.note || ""),
      sanitizeCsvField(r.createdAt || ""),
    ]);

    const csvContent = BOM + [headers.map(sanitizeCsvField).join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    const safeSlug = (card.slug || "thiep-cuoi").replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `danh-sach-khach-moi-${safeSlug}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error(`GET /api/cards/${id}/export error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xuất danh sách khách mời" },
      { status: 500 }
    );
  }
}
