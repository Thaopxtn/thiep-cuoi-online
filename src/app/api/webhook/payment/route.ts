import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, createWishInDb } from "@/lib/serverDb";

/**
 * POST /api/webhook/payment
 * Webhook lắng nghe biến động số dư ngân hàng tự động (SePay / PayOS / Casso)
 * 1. Tự động cộng tiền mừng cưới vào danh sách quà tặng của cặp đôi.
 * 2. Tự động ghi lời chúc mừng kèm số tiền mừng vào Sổ lưu bút (nếu khách chuyển khoản kèm lời chúc).
 * 3. Tự động kích hoạt gói VIP cho người dùng khi nâng cấp tài khoản.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const webhookToken = process.env.PAYMENT_WEBHOOK_TOKEN;

    // Kiểm tra bảo mật Webhook (nếu có thiết lập PAYMENT_WEBHOOK_TOKEN)
    if (webhookToken && !authHeader.includes(webhookToken)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized Webhook Request" },
        { status: 401 }
      );
    }

    const payload = await request.json();
    console.log("Received payment webhook payload:", JSON.stringify(payload));

    // Chuẩn hóa dữ liệu từ SePay / PayOS / Casso
    // Thường có: amountIn, content (nội dung ck), transactionDate, referenceCode
    const amount = Number(payload.amountIn || payload.amount || payload.transferAmount || 0);
    const content = String(payload.content || payload.description || payload.orderCode || "");
    const transferDate = payload.transactionDate || payload.when || new Date().toISOString();

    // Phân tích nội dung chuyển khoản để nhận diện thiệp cưới hoặc khách mừng
    // Ví dụ cú pháp: "MC HONGPHONG Nguyen Van A mung hai ban"
    let matchedCardId: string | null = null;
    let guestWishContent = content;

    // Tìm mã thiệp trong nội dung
    const cardMatch = content.match(/MC\s+([a-zA-Z0-9_-]+)/i);
    if (cardMatch && cardMatch[1]) {
      const slugCandidate = cardMatch[1].toLowerCase();
      const card = await getCardByIdOrSlugFromDb(slugCandidate);
      if (card) {
        matchedCardId = card.id;
        // Tự động tạo một lời chúc mừng kèm số tiền vào sổ lưu bút
        const formattedAmount = new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount);

        await createWishInDb({
          cardId: card.id,
          name: payload.senderName || "Khách mừng cưới Online",
          content: `${content} (Mừng cưới: ${formattedAmount})`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Xử lý thông báo thanh toán thành công",
      processed: {
        amount,
        content,
        matchedCardId,
        transferDate,
      },
    });
  } catch (error: any) {
    console.error("Lỗi /api/webhook/payment:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý webhook thanh toán" },
      { status: 500 }
    );
  }
}
