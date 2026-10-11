import { NextRequest, NextResponse } from "next/server";
import { getAggregatedActivities, recordActivity, ActivityType } from "@/lib/activityService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/activities
 * Lấy danh sách toàn bộ hoạt động của website và người dùng
 */
export async function GET(request: NextRequest) {
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

    const recorded = recordActivity({
      type: type as ActivityType,
      title,
      actorName,
      actorEmail,
      actorType: actorType || "user",
      targetName,
      targetId,
      targetSlug,
      details,
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
