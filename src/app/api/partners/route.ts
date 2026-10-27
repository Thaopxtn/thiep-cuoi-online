import { NextRequest, NextResponse } from "next/server";
import {
  getPartnerApplications,
  savePartnerApplication,
  updatePartnerApplicationStatus,
  deletePartnerApplication,
} from "@/lib/partnerService";

export const dynamic = "force-dynamic";

/**
 * GET /api/partners
 * Lấy danh sách các đối tác cưới đã đăng ký hợp tác
 */
export async function GET(request: NextRequest) {
  try {
    const list = await getPartnerApplications();
    return NextResponse.json({
      success: true,
      total: list.length,
      partners: list,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Lỗi khi lấy danh sách đối tác", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/partners
 * Tiếp nhận đơn đăng ký hợp tác từ các thương hiệu, studio cưới
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandName, category, contactName, phone, email, website, message } = body;

    // Xác thực dữ liệu đầu vào
    if (!brandName || typeof brandName !== "string" || !brandName.trim()) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập tên thương hiệu hoặc studio của bạn." },
        { status: 400 }
      );
    }

    if (!contactName || typeof contactName !== "string" || !contactName.trim()) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập tên người đại diện liên hệ." },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || !phone.trim() || phone.trim().length < 8) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập số điện thoại liên hệ hợp lệ (tối thiểu 8 chữ số)." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập địa chỉ email hợp lệ." },
        { status: 400 }
      );
    }

    const application = await savePartnerApplication({
      brandName,
      category: category || "studio",
      contactName,
      phone,
      email,
      website,
      message,
    });

    return NextResponse.json({
      success: true,
      message: "Đăng ký đối tác thành công! Đội ngũ phát triển ZenLove sẽ liên hệ với bạn trong 24h.",
      data: application,
    });
  } catch (error: any) {
    console.error("Lỗi khi đăng ký đối tác:", error);
    return NextResponse.json(
      { success: false, message: "Có lỗi xảy ra khi xử lý yêu cầu", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/partners
 * Cập nhật trạng thái xử lý đơn đăng ký đối tác (Admin)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID hoặc trạng thái cập nhật" },
        { status: 400 }
      );
    }

    const updated = await updatePartnerApplicationStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn đối tác với ID đã cung cấp" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật trạng thái đối tác thành công",
      partner: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Lỗi cập nhật đơn đối tác", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/partners
 * Xóa đơn đăng ký đối tác
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID đơn đối tác cần xóa" },
        { status: 400 }
      );
    }

    const deleted = await deletePartnerApplication(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy hoặc không thể xóa đơn đối tác" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa đơn đăng ký đối tác thành công",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Lỗi xóa đơn đối tác", error: error.message },
      { status: 500 }
    );
  }
}
