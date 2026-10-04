import { NextRequest, NextResponse } from "next/server";
import { resolveBankCode, generateVietQrUrl } from "@/lib/vietQrBankCodes";

export const dynamic = "force-dynamic";

/**
 * GET /api/tools/vietqr
 * Tạo mã VietQR chuẩn Napas 24/7 (hỗ trợ 54 ngân hàng Việt Nam, 0đ phí)
 * Query params: bank, account, name, amount, message, template (compact2, compact, qr_only)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bankRaw = searchParams.get("bank") || "MB";
  const account = searchParams.get("account") || "240220038888";
  const name = searchParams.get("name") || "";
  const amount = searchParams.get("amount") || "";
  const message = searchParams.get("message") || "Mung cuoi";

  const bankCode = resolveBankCode(bankRaw);
  const qrUrl = generateVietQrUrl(bankCode, account, name, amount, message);

  return NextResponse.json({
    success: true,
    bankCode,
    accountNumber: account,
    accountName: name,
    amount: amount ? Number(amount) : null,
    message,
    qrUrl,
    napasDeepLink: `https://api.vietqr.io/v2/generate`,
  });
}
