import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, createWishInDb, activateCardVipInDb } from "@/lib/serverDb";
import { recordActivity } from "@/lib/activityService";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Bộ nhớ đệm Idempotency runtime (24h)
const runtimeProcessedTransactions = new Map<string, number>();

type PaymentClaimResult = "claimed" | "already_processed" | "unavailable";

function getPaymentDbConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "",
  };
}

/**
 * Claim giao dịch bằng unique key trong database.
 * INSERT ... ON CONFLICT là atomic nên hai webhook đồng thời chỉ một request được xử lý.
 */
async function claimPaymentTransaction(
  txId: string,
  amount: number,
  content: string
): Promise<PaymentClaimResult> {
  const now = Date.now();
  // Dọn dẹp cache cũ > 24 giờ
  runtimeProcessedTransactions.forEach((ts, id) => {
    if (now - ts > 24 * 60 * 60 * 1000) {
      runtimeProcessedTransactions.delete(id);
    }
  });

  if (runtimeProcessedTransactions.has(txId)) {
    return "already_processed";
  }

  const { url: supabaseUrl, serviceKey } = getPaymentDbConfig();

  if (!supabaseUrl || !serviceKey) {
    if (process.env.NODE_ENV === "production") return "unavailable";
    runtimeProcessedTransactions.set(txId, now);
    return "claimed";
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/payment_transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: JSON.stringify({
        reference_code: txId,
        amount,
        content: content.slice(0, 500),
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Không thể claim payment transaction:", res.status, await res.text());
      return "unavailable";
    }

    const rows = await res.json().catch(() => []);
    if (Array.isArray(rows) && rows.length > 0) {
      return "claimed";
    }

    runtimeProcessedTransactions.set(txId, now);
    return "already_processed";
  } catch (err) {
    console.error("Lỗi claim persistent idempotency:", err);
    return "unavailable";
  }
}

/** Xóa claim nếu nghiệp vụ phía sau thất bại để webhook có thể retry an toàn. */
async function releasePaymentClaim(txId: string): Promise<void> {
  runtimeProcessedTransactions.delete(txId);
  const { url: supabaseUrl, serviceKey } = getPaymentDbConfig();
  if (!supabaseUrl || !serviceKey) return;

  try {
    await fetch(
      `${supabaseUrl}/rest/v1/payment_transactions?reference_code=eq.${encodeURIComponent(txId)}`,
      {
        method: "DELETE",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: "no-store",
      }
    );
  } catch (err) {
    console.error("Lỗi release payment claim:", err);
  }
}

/**
 * Đánh dấu giao dịch đã được xử lý THÀNH CÔNG (Chỉ gọi sau khi nghiệp vụ hoàn tất)
 */
async function markPaymentProcessed(
  txId: string,
  amount: number,
  cardId?: string,
  content?: string
): Promise<void> {
  runtimeProcessedTransactions.set(txId, Date.now());

  recordActivity({
    type: "payment_webhook" as any,
    title: `Xử lý webhook thanh toán thành công (${amount.toLocaleString("vi-VN")}đ)`,
    actorName: "Payment Gateway",
    actorType: "system",
    targetId: txId,
    targetName: cardId || "System",
    details: content ? content.slice(0, 200) : "Đã xử lý biến động số dư thành công",
    metadata: { amount, txId, cardId },
  });
}

/**
 * POST /api/webhook/payment
 * Webhook lắng nghe biến động số dư ngân hàng tự động (SePay / PayOS / Casso)
 * Bảo vệ: Bắt buộc Webhook Secret Token + Chống Replay + Durable Idempotency
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

    // 3. Chống Replay Attack: claim atomically trong database
    const claimResult = await claimPaymentTransaction(referenceCode, amount, content);
    if (claimResult === "already_processed") {
      return NextResponse.json({
        success: true,
        message: "Giao dịch đã được ghi nhận trước đó (Idempotent)",
        alreadyProcessed: true,
      });
    }
    if (claimResult === "unavailable") {
      return NextResponse.json(
        { success: false, message: "Không thể xác nhận giao dịch an toàn, vui lòng thử lại" },
        { status: 503 }
      );
    }

    // 4. Phân tích nội dung chuyển khoản để nhận diện thiệp cưới
    let matchedCardId: string | null = null;
    let isVipUpgrade = false;

    // A. Nhận diện cú pháp Kích hoạt / Nâng cấp gói VIP: "VIP [SLUG]" hoặc "ZENLOVE VIP [SLUG]"
    const vipMatch = content.match(/(?:VIP|ZENLOVE\s*VIP|NANG\s*CAP)\s+([a-zA-Z0-9_-]+)/i);
    if (vipMatch && vipMatch[1]) {
      const slugCandidate = vipMatch[1].toLowerCase();
      const vipResult = await activateCardVipInDb(slugCandidate, payload);
      if (vipResult.success && vipResult.card) {
        matchedCardId = vipResult.card.id;
        isVipUpgrade = true;

        recordActivity({
          type: "card_upgrade" as any,
          title: `Tự động mở khóa VIP cho thiệp "${vipResult.card.name}" qua VietQR (${amount.toLocaleString("vi-VN")}đ)`,
          actorName: String(payload.senderName || payload.accountName || "Khách hàng VietQR").trim(),
          actorType: "user",
          targetId: vipResult.card.id,
          targetName: vipResult.card.name,
          details: `Giao dịch ${referenceCode} đã kích hoạt gói VIP vĩnh viễn và xóa watermark ZenLove thành công`,
          metadata: { amount, referenceCode, slug: vipResult.card.slug },
        });
      }
    }

    // B. Nhận diện cú pháp Mừng cưới Online: "MC [SLUG] [LỜI CHÚC]"
    const cardMatch = content.match(/MC\s+([a-zA-Z0-9_-]+)/i);
    if (cardMatch && cardMatch[1] && !isVipUpgrade) {
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
        const savedWish = await createWishInDb({
          cardId: card.id,
          name: senderName.slice(0, 100),
          content: `${content.slice(0, 200)} (Mừng cưới: ${formattedAmount})`,
        });
        if (!savedWish) {
          await releasePaymentClaim(referenceCode);
          return NextResponse.json(
            { success: false, message: "Không thể ghi nhận lời chúc, vui lòng thử lại" },
            { status: 503 }
          );
        }
      }
    }

    // 5. CHỈ đánh dấu giao dịch đã hoàn tất SAU KHI nghiệp vụ chạy thành công
    await markPaymentProcessed(referenceCode, amount, matchedCardId || undefined, content);

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
