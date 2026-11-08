import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, createWishInDb, activateCardVipInDb } from "@/lib/serverDb";
import { recordActivity } from "@/lib/activityService";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Bộ nhớ đệm Idempotency runtime (24h)
const runtimeProcessedTransactions = new Map<string, number>();
const runtimeClaimedTransactions = new Map<string, { token: string; claimedAt: number }>();
const CLAIM_LEASE_MS = 5 * 60 * 1000;
const VIP_PRICE = 99000;

type PaymentClaimResult =
  | { status: "claimed"; token: string }
  | { status: "already_processed" | "unavailable" };

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
    return { status: "already_processed" };
  }

  const { url: supabaseUrl, serviceKey } = getPaymentDbConfig();
  const token = crypto.randomUUID();

  if (!supabaseUrl || !serviceKey) {
    if (process.env.NODE_ENV === "production") return { status: "unavailable" };
    const existing = runtimeClaimedTransactions.get(txId);
    if (existing && now - existing.claimedAt < CLAIM_LEASE_MS) return { status: "unavailable" };
    runtimeClaimedTransactions.set(txId, { token, claimedAt: now });
    return { status: "claimed", token };
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
        processed_at: null,
        claimed_at: new Date(now).toISOString(),
        claim_token: token,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Không thể claim payment transaction:", res.status, await res.text());
      return { status: "unavailable" };
    }

    const rows = await res.json().catch(() => []);
    if (Array.isArray(rows) && rows.length > 0) {
      return { status: "claimed", token };
    }

    const referenceFilter = `reference_code=eq.${encodeURIComponent(txId)}`;
    const existingRes = await fetch(`${supabaseUrl}/rest/v1/payment_transactions?${referenceFilter}&select=processed_at,claimed_at`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    });
    if (!existingRes.ok) return { status: "unavailable" };
    const existingRows = await existingRes.json();
    if (!Array.isArray(existingRows) || existingRows.length !== 1) return { status: "unavailable" };
    if (existingRows[0].processed_at) {
      runtimeProcessedTransactions.set(txId, now);
      return { status: "already_processed" };
    }

    // Recover a request that crashed after claiming; the conditional PATCH is atomic.
    const cutoff = new Date(now - CLAIM_LEASE_MS).toISOString();
    if (!existingRows[0].claimed_at || Date.parse(existingRows[0].claimed_at) >= now - CLAIM_LEASE_MS) {
      return { status: "unavailable" };
    }
    const reclaimRes = await fetch(`${supabaseUrl}/rest/v1/payment_transactions?${referenceFilter}&processed_at=is.null&claimed_at=lt.${encodeURIComponent(cutoff)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: "return=representation" },
      body: JSON.stringify({ claim_token: token, claimed_at: new Date(now).toISOString() }),
      cache: "no-store",
    });
    if (!reclaimRes.ok) return { status: "unavailable" };
    const reclaimed = await reclaimRes.json();
    return Array.isArray(reclaimed) && reclaimed.length === 1 ? { status: "claimed", token } : { status: "unavailable" };
  } catch (err) {
    console.error("Lỗi claim persistent idempotency:", err);
    return { status: "unavailable" };
  }
}

/** Xóa claim nếu nghiệp vụ phía sau thất bại để webhook có thể retry an toàn. */
async function releasePaymentClaim(txId: string, token: string): Promise<void> {
  if (runtimeClaimedTransactions.get(txId)?.token === token) runtimeClaimedTransactions.delete(txId);
  const { url: supabaseUrl, serviceKey } = getPaymentDbConfig();
  if (!supabaseUrl || !serviceKey) return;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/payment_transactions?reference_code=eq.${encodeURIComponent(txId)}&claim_token=eq.${encodeURIComponent(token)}&processed_at=is.null`,
      {
        method: "DELETE",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) console.error("Không thể release payment claim:", res.status);
  } catch (err) {
    console.error("Lỗi release payment claim:", err);
  }
}

/**
 * Đánh dấu giao dịch đã được xử lý THÀNH CÔNG (Chỉ gọi sau khi nghiệp vụ hoàn tất)
 */
async function markPaymentProcessed(
  txId: string,
  token: string,
  amount: number,
  cardId?: string,
  content?: string
): Promise<boolean> {
  const { url: supabaseUrl, serviceKey } = getPaymentDbConfig();
  if (supabaseUrl && serviceKey) {
    const res = await fetch(`${supabaseUrl}/rest/v1/payment_transactions?reference_code=eq.${encodeURIComponent(txId)}&claim_token=eq.${encodeURIComponent(token)}&processed_at=is.null`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: "return=representation" },
      body: JSON.stringify({ processed_at: new Date().toISOString(), card_id: cardId || null }),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length !== 1) return false;
  } else if (runtimeClaimedTransactions.get(txId)?.token !== token) {
    return false;
  }
  runtimeClaimedTransactions.delete(txId);
  runtimeProcessedTransactions.set(txId, Date.now());

  try {
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
  } catch (err) {
    console.warn("Không thể ghi nhật ký thanh toán:", err);
  }
  return true;
}

/**
 * POST /api/webhook/payment
 * Webhook lắng nghe biến động số dư ngân hàng tự động (SePay / PayOS / Casso)
 * Bảo vệ: Bắt buộc Webhook Secret Token + Chống Replay + Durable Idempotency
 */
export async function POST(request: NextRequest) {
  let activeClaim: { id: string; token: string } | null = null;
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
    const amount = Number(payload.amountIn ?? payload.amount ?? payload.transferAmount ?? 0);
    const content = String(payload.content || payload.description || payload.orderCode || "").trim();
    const transferDate = payload.transactionDate || payload.when || new Date().toISOString();
    const referenceCode = String(
      payload.referenceCode || payload.id || payload.transactionId || ""
    ).trim();

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Số tiền giao dịch không hợp lệ" },
        { status: 400 }
      );
    }

    const direction = String(payload.transferType ?? payload.direction ?? "").trim().toLowerCase();
    if ((direction && !["in", "incoming", "credit", "receive", "received"].includes(direction)) || Number(payload.amountOut || 0) > 0) {
      return NextResponse.json({ success: false, message: "Chỉ ghi nhận giao dịch tiền vào" }, { status: 400 });
    }

    const vipMatch = content.match(/(?:VIP|ZENLOVE\s*VIP|NANG\s*CAP)\s+([a-zA-Z0-9_-]+)/i);
    const cardMatch = content.match(/MC\s+([a-zA-Z0-9_-]+)/i);
    if (!vipMatch && !cardMatch) {
      return NextResponse.json({ success: true, ignored: true, message: "Giao dịch không có nội dung cần xử lý" });
    }
    if (!referenceCode) {
      return NextResponse.json({ success: false, message: "Thiếu mã giao dịch duy nhất" }, { status: 400 });
    }
    if (vipMatch) {
      if (amount !== VIP_PRICE) {
        return NextResponse.json({ success: false, message: "Số tiền nâng cấp VIP phải là 99.000đ" }, { status: 400 });
      }
      const normalizeAccount = (value: unknown) => String(value ?? "").replace(/[\s.-]/g, "");
      const expectedAccount = normalizeAccount(process.env.PAYMENT_ACCOUNT_NUMBER);
      const receivedAccount = normalizeAccount(payload.accountNumber ?? payload.account_number ?? payload.destinationAccountNumber ?? payload.receivingAccount);
      if (expectedAccount && receivedAccount !== expectedAccount) {
        return NextResponse.json({ success: false, message: "Tài khoản nhận thanh toán không hợp lệ" }, { status: 400 });
      }
    }

    // 3. Chống Replay Attack: claim atomically trong database
    const claimResult = await claimPaymentTransaction(referenceCode, amount, content);
    if (claimResult.status === "already_processed") {
      return NextResponse.json({
        success: true,
        message: "Giao dịch đã được ghi nhận trước đó (Idempotent)",
        alreadyProcessed: true,
      });
    }
    if (claimResult.status !== "claimed") {
      return NextResponse.json(
        { success: false, message: "Không thể xác nhận giao dịch an toàn, vui lòng thử lại" },
        { status: 503 }
      );
    }
    activeClaim = { id: referenceCode, token: claimResult.token };

    // 4. Phân tích nội dung chuyển khoản để nhận diện thiệp cưới
    let matchedCardId: string | null = null;
    let isVipUpgrade = false;

    // A. Nhận diện cú pháp Kích hoạt / Nâng cấp gói VIP: "VIP [SLUG]" hoặc "ZENLOVE VIP [SLUG]"
    if (vipMatch && vipMatch[1]) {
      const slugCandidate = vipMatch[1].toLowerCase();
      const vipResult = await activateCardVipInDb(slugCandidate, payload);
      if (vipResult.success && vipResult.card) {
        matchedCardId = vipResult.card.id;
        isVipUpgrade = true;

        try { recordActivity({
          type: "card_upgrade" as any,
          title: `Tự động mở khóa VIP cho thiệp "${vipResult.card.name}" qua VietQR (${amount.toLocaleString("vi-VN")}đ)`,
          actorName: String(payload.senderName || payload.accountName || "Khách hàng VietQR").trim(),
          actorType: "user",
          targetId: vipResult.card.id,
          targetName: vipResult.card.name,
          details: `Giao dịch ${referenceCode} đã kích hoạt gói VIP vĩnh viễn và xóa watermark ZenLove thành công`,
          metadata: { amount, referenceCode, slug: vipResult.card.slug },
        }); } catch (err) { console.warn("Không thể ghi nhật ký nâng cấp VIP:", err); }
      } else {
        await releasePaymentClaim(referenceCode, activeClaim.token);
        activeClaim = null;
        return NextResponse.json({ success: false, message: "Chưa thể lưu kích hoạt VIP, vui lòng thử lại" }, { status: 503 });
      }
    }

    // B. Nhận diện cú pháp Mừng cưới Online: "MC [SLUG] [LỜI CHÚC]"
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
          id: `payment_${crypto.createHash("sha256").update(referenceCode).digest("hex")}`,
          cardId: card.id,
          name: senderName.slice(0, 100),
          content: `${content.slice(0, 200)} (Mừng cưới: ${formattedAmount})`,
        });
        if (!savedWish) {
          await releasePaymentClaim(referenceCode, activeClaim.token);
          activeClaim = null;
          return NextResponse.json(
            { success: false, message: "Không thể ghi nhận lời chúc, vui lòng thử lại" },
            { status: 503 }
          );
        }
      } else {
        await releasePaymentClaim(referenceCode, activeClaim.token);
        activeClaim = null;
        return NextResponse.json({ success: false, message: "Chưa tìm thấy thiệp nhận mừng cưới, vui lòng thử lại" }, { status: 503 });
      }
    }

    // 5. CHỈ đánh dấu giao dịch đã hoàn tất SAU KHI nghiệp vụ chạy thành công
    const processed = await markPaymentProcessed(referenceCode, activeClaim.token, amount, matchedCardId || undefined, content);
    if (!processed) {
      await releasePaymentClaim(referenceCode, activeClaim.token);
      activeClaim = null;
      return NextResponse.json({ success: false, message: "Chưa thể xác nhận hoàn tất giao dịch, vui lòng thử lại" }, { status: 503 });
    }
    activeClaim = null;

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
    if (activeClaim) await releasePaymentClaim(activeClaim.id, activeClaim.token);
    console.error("Lỗi /api/webhook/payment:", error?.message || "Lỗi xử lý");
    return NextResponse.json(
      { success: false, message: "Lỗi xử lý webhook thanh toán" },
      { status: 500 }
    );
  }
}
