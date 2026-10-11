import { NextRequest, NextResponse } from "next/server";
import { getAggregatedActivities, recordActivity, ActivityType } from "@/lib/activityService";
import { verifyAdminAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/activities
 * Lấy danh sách toàn bộ hoạt động của website và người dùng (Yêu cầu quyền Admin)
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error || "Không có quyền xem nhật ký hoạt động hệ thống" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const userId = searchParams.get("userId") || undefined;

    const activities = await getAggregatedActivities({
      type,
      search,
      limit,
      userId,
    });

    // Thống kê nhanh
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayCount = activities.filter(
      (a) => new Date(a.timestamp).getTime() >= startOfToday
    ).length;

    const typeBreakdown: Record<string, number> = {};
    activities.forEach((a) => {
      typeBreakdown[a.type] = (typeBreakdown[a.type] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      total: activities.length,
      todayCount,
      typeBreakdown,
      activities,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/activities:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tải lịch sử hoạt động" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/activities
 * Ghi nhận một sự kiện hoạt động mới từ client hoặc internal service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, actorName, actorEmail, actorType, targetName, targetId, targetSlug, details, metadata } = body;

    if (!type || !title || !actorName) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin sự kiện bắt buộc (type, title, actorName)" },
        { status: 400 }
      );
    }

    // Nếu cố tình giả mạo actorType là admin, phải kiểm tra quyền Admin thực tế
    if (actorType === "admin") {
      const auth = await verifyAdminAuth(request);
      if (!auth.authenticated) {
        return NextResponse.json(
          { success: false, message: "Không thể ghi nhật ký với tư cách Quản trị viên khi chưa xác thực" },
          { status: 403 }
        );
      }
    }

    const recorded = recordActivity({
      type: type as ActivityType,
      title: String(title).slice(0, 200),
      actorName: String(actorName).slice(0, 100),
      actorEmail: actorEmail ? String(actorEmail).slice(0, 150) : undefined,
      actorType: actorType === "admin" ? "admin" : (actorType === "guest" ? "guest" : "user"),
      targetName: targetName ? String(targetName).slice(0, 200) : undefined,
      targetId: targetId ? String(targetId).slice(0, 100) : undefined,
      targetSlug: targetSlug ? String(targetSlug).slice(0, 150) : undefined,
      details: details ? String(details).slice(0, 500) : undefined,
      metadata,
    });

    return NextResponse.json({
      success: true,
      activity: recorded,
    });
  } catch (error: any) {
    console.error("Lỗi POST /api/admin/activities:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi ghi nhận sự kiện hoạt động" },
      { status: 500 }
    );
  }
}
