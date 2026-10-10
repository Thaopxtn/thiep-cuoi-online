import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_ADMIN_PASSCODE = "zenlove8888";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passcode } = body;

    const configuredPasscode =
      process.env.ADMIN_PASSCODE ||
      process.env.NEXT_PUBLIC_ADMIN_PASSCODE ||
      DEFAULT_ADMIN_PASSCODE;

    if (!passcode || String(passcode).trim() !== configuredPasscode.trim()) {
      return NextResponse.json(
        { success: false, message: "Mã PIN Quản trị viên không chính xác!" },
        { status: 401 }
      );
    }

    // Tạo token xác thực đơn giản cho phiên làm việc
    const timestamp = Date.now();
    const token = Buffer.from(`admin_auth_${timestamp}_${configuredPasscode}`).toString("base64");

    return NextResponse.json({
      success: true,
      message: "Xác thực Quản trị viên thành công!",
      token,
      expiresIn: 86400 * 7, // 7 ngày
    });
  } catch (error: any) {
    console.error("Lỗi xác thực Admin:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi máy chủ khi xác thực" },
      { status: 500 }
    );
  }
}
