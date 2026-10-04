import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Standard Bank Code Mapping for VietQR
 */
const BANK_CODE_MAP: Record<string, string> = {
  mbbank: "MB",
  mb: "MB",
  vietcombank: "VCB",
  vcb: "VCB",
  techcombank: "TCB",
  tcb: "TCB",
  vietinbank: "CTG",
  ctg: "CTG",
  bidv: "BIDV",
  acb: "ACB",
  vpbank: "VPB",
  vpb: "VPB",
  tpbank: "TPB",
  tpb: "TPB",
  sacombank: "STB",
  stb: "STB",
  hdbank: "HDB",
  shb: "SHB",
  vib: "VIB",
  msb: "MSB",
  seabank: "SEAB",
  ocb: "OCB",
  lienvietpostbank: "LPB",
  lpbank: "LPB",
};

/**
 * GET /api/tools/vietqr
 * Tạo mã VietQR chuẩn Napas 24/7 cho phong bì mừng cưới hoặc thanh toán dịch vụ (0đ phí)
 * Query params: bank, account, name, amount, message, template (compact2, compact, qr_only)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bankRaw = (searchParams.get("bank") || "MB").toLowerCase().replace(/[^a-z0-9]/g, "");
  const account = searchParams.get("account") || "240220038888";
  const name = searchParams.get("name") || "";
  const amount = searchParams.get("amount") || "";
  const message = searchParams.get("message") || "Mung cuoi";
  const template = searchParams.get("template") || "compact2";

  const bankCode = BANK_CODE_MAP[bankRaw] || searchParams.get("bank")?.toUpperCase() || "MB";

  let qrUrl = `https://img.vietqr.io/image/${bankCode}-${account}-${template}.png`;
  const queryParams: string[] = [];

  if (amount) queryParams.push(`amount=${encodeURIComponent(amount)}`);
  if (message) queryParams.push(`addInfo=${encodeURIComponent(message)}`);
  if (name) queryParams.push(`accountName=${encodeURIComponent(name)}`);

  if (queryParams.length > 0) {
    qrUrl += `?${queryParams.join("&")}`;
  }

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
