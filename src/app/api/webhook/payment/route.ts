import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, createWishInDb } from "@/lib/serverDb";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Bộ nhớ đệm Idempotency: Lưu mã giao dịch đã xử lý trong 24 giờ để chống replay attack
const processedTransactions = new Map<string, number>();

function isTransactionProcessed(txId: string): boolean {
  const now = Date.now();
  // Dọn dẹp các transaction cũ hơn 24 giờ
  processedTransactions.forEach((ts, id) => {
    if (now - ts > 24 * 60 * 60 * 1000) {
      processedTransactions.delete(id);
    }
  });

  if (processedTransactions.has(txId)) {
    return true;
  }
  processedTransactions.set(txId, now);
  return false;
}

/**
 * POST /api/webhook/payment
 * Webhook lắng nghe biến động số dư ngân hàng tự động (SePay / PayOS / Casso)
 * Bảo vệ: Bắt buộc Webhook Secret Token + Chống Replay + An toàn bảo mật thông tin
 */
export async function POST(request: NextRequest) {
  try {
    const webhookToken = process.env.PAYMENT_WEBHOOK_TOKEN;
    const isProd = process.env.NODE_ENV === "production";

    // 1. Kiểm tra bí mật Webhook
    if (isProd && !webhookToken) {
      console.error("LỖI: PAYMENT_WEBHOOK_TOKEN chưa được cấu hình trên môi trường Production!");
      return NextResponse.json(
        { success: false, message: "Payment webhook endpoint is not configured with secure credentials" },
        { status: 503 }
      );
    }

    if (webhookToken) {
      const authHeader = request.headers.get("authorization") || "";
      const apiKeyHeader = request.headers.get("x-api-key") || "";

      let bearerToken = "";
      if (authHeader.toLowerCase().startsWith("bearer ")) {
        bearerToken = authHeader.substring(7).trim();
      } else if (authHeader) {
        bearerToken = authHeader.trim();
      }

      const receivedToken = bearerToken || apiKeyHeader;
      if (!receivedToken) {
        return NextResponse.json(
          { success: false, message: "Unauthorized Webhook Request (Missing Token)" },
          { status: 401 }
        );
      }

      // So sánh Constant-Time chống Timing Attack
      let match = false;
      try {
        const receivedBuffer = Buffer.from(receivedToken);
        const expectedBuffer = Buffer.from(webhookToken);
        if (receivedBuffer.length === expectedBuffer.length) {
          match = crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
        }
      } catch {
        match = false;
      }

      if (!match) {
        return NextResponse.json(
          { success: false, message: "Unauthorized Webhook Request (Invalid Token)" },
          { status: 401 }
        );
      }
    }

    const payload = await request.json();

    // 2. Chuẩn hóa dữ liệu từ SePay / PayOS / Casso
    const amount = Number(payload.amountIn || payload.amount || payload.transferAmount || 0);
    const content = String(payload.content || payload.description || payload.orderCode || "").trim();
    const transferDate = payload.transactionDate || payload.when || new Date().toISOString();
    const referenceCode = String(
      payload.referenceCode || payload.id || payload.transactionId || `${transferDate}_${amount}_${content.slice(0, 10)}`
    );

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Số tiền giao dịch không hợp lệ" },
        { status: 400 }
      );
    }

    // 3. Chống Replay Attack & Xử lý trùng lặp giao dịch
    if (isTransactionProcessed(referenceCode)) {
      return NextResponse.json({
        success: true,
        message: "Giao dịch đã được ghi nhận trước đó (Idempotent)",
        alreadyProcessed: true,
      });
    }

    // 4. Phân tích nội dung chuyển khoản để nhận diện thiệp cưới
    // Cú pháp quy ước: "MC [SLUG] [TÊN KHÁCH] mung hai ban"
    let matchedCardId: string | null = null;
    const cardMatch = content.match(/MC\s+([a-zA-Z0-9_-]+)/i);

    if (cardMatch && cardMatch[1]) {
      const slugCandidate = cardMatch[1].toLowerCase();
      const card = await getCardByIdOrSlugFromDb(slugCandidate);
      if (card) {
        matchedCardId = card.id;
        const formattedAmount = new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount);

        const senderName = String(payload.senderName || payload.accountName || "Khách mừng cưới Online").trim();

        // Ghi nhận vào Sổ lưu bút thiệp cưới
        await createWishInDb({
          cardId: card.id,
          name: senderName.slice(0, 100),
          content: `${content.slice(0, 200)} (Mừng cưới: ${formattedAmount})`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Xử lý thông báo thanh toán thành công",
      processed: {
        matchedCardId,
        referenceCode,
        amount,
        transferDate,
      },
    });
  } catch (error: any) {
    console.error("Lỗi /api/webhook/payment:", error?.message || "Lỗi xử lý");
    return NextResponse.json(
      { success: false, message: "Lỗi xử lý webhook thanh toán" },
      { status: 500 }
    );
  }
}
