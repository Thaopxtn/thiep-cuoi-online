import { getCardsFromDb, getAllRsvpsFromDb, getAllWishesFromDb, getUsersWithStatsFromDb } from "./serverDb";
import { INITIAL_CARDS } from "@/data/initialCards";

export type ActivityType =
  | "user_register"   // Đăng ký tài khoản mới
  | "user_login"      // Đăng nhập hệ thống
  | "card_create"     // Tạo / Clone thiệp mới
  | "card_update"     // Chỉnh sửa / Lưu thiết kế
  | "card_publish"    // Xuất bản thiệp mời
  | "card_delete"     // Xóa thiệp cưới
  | "card_view"       // Khách truy cập xem thiệp
  | "rsvp_submit"     // Khách gửi xác nhận tham dự
  | "wish_submit"     // Khách gửi lời chúc mừng
  | "template_view";  // Khách xem mẫu trong kho

export interface SystemActivity {
  id: string;
  timestamp: string; // ISO 8601
  type: ActivityType;
  title: string;
  actorName: string;
  actorEmail?: string;
  actorType: "user" | "guest" | "system";
  targetName?: string;
  targetId?: string;
  targetSlug?: string;
  details?: string;
  metadata?: Record<string, any>;
}

// In-memory runtime buffer lưu các sự kiện động
const MAX_BUFFER_SIZE = 1000;
let runtimeActivities: SystemActivity[] = [];

/**
 * Chuyển đổi an toàn bất kỳ giá trị ngày giờ nào sang chuỗi ISO 8601
 * Phòng ngừa lỗi RangeError: Invalid time value khi chuỗi ngày không chuẩn
 */
function safeToIsoString(rawDate?: any): string {
  if (!rawDate) return new Date().toISOString();
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {}
  return new Date().toISOString();
}

/**
 * Ghi nhận một sự kiện hoạt động mới trên toàn hệ thống
 */
export function recordActivity(
  activity: Omit<SystemActivity, "id" | "timestamp"> & { timestamp?: string }
): SystemActivity {
  const newActivity: SystemActivity = {
    ...activity,
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: activity.timestamp || new Date().toISOString(),
  };

  runtimeActivities.unshift(newActivity);
  if (runtimeActivities.length > MAX_BUFFER_SIZE) {
    runtimeActivities = runtimeActivities.slice(0, MAX_BUFFER_SIZE);
  }

  return newActivity;
}

/**
 * Lấy toàn bộ hoạt động của web và người dùng:
 * Tự động hợp nhất giữa sự kiện runtime với dữ liệu thực tế từ Database (Cards, Users, RSVPs, Wishes)
 */
export async function getAggregatedActivities(options?: {
  type?: string;
  limit?: number;
  search?: string;
  userId?: string;
}): Promise<SystemActivity[]> {
  const aggregated: SystemActivity[] = [...runtimeActivities];

  try {
    // Tải đồng thời 4 nguồn dữ liệu từ CSDL song song để tối ưu tốc độ (< 800ms)
    const [rawCards, rawRsvps, rawWishes, rawUsers] = await Promise.all([
      getCardsFromDb().catch(() => []),
      getAllRsvpsFromDb().catch(() => []),
      getAllWishesFromDb().catch(() => []),
      getUsersWithStatsFromDb().catch(() => []),
    ]);

    const cards = (rawCards && rawCards.length > 0) ? rawCards : INITIAL_CARDS;

    // 1. Thu thập từ thiệp cưới thực tế
    cards.forEach((card) => {
      const cardDate = safeToIsoString(card.updatedAt);

      aggregated.push({
        id: `card_act_${card.id}`,
        timestamp: cardDate,
        type: card.status === "published" ? "card_publish" : "card_create",
        title: card.status === "published" ? "Xuất bản thiệp cưới" : "Khởi tạo thiệp cưới mới",
        actorName: card.groom?.name || card.bride?.name || card.userId || "Người dùng ZenLove",
        actorType: "user",
        targetName: card.name,
        targetId: card.id,
        targetSlug: card.slug,
        details: `Mẫu "${card.templateName || "Hồng Phong"}" • Đã có ${card.views || 0} lượt xem`,
        metadata: {
          views: card.views || 0,
          userId: card.userId,
          status: card.status,
        },
      });

      // Nếu thiệp có lượt xem cao, thêm sự kiện xem thiệp
      if (card.views && card.views > 0) {
        aggregated.push({
          id: `view_act_${card.id}`,
          timestamp: cardDate,
          type: "card_view",
          title: "Khách truy cập xem thiệp",
          actorName: "Khách mời trực tuyến",
          actorType: "guest",
          targetName: card.name,
          targetId: card.id,
          targetSlug: card.slug,
          details: `Tổng cộng ${card.views} lượt xem trực tiếp qua đường link chia sẻ`,
        });
      }
    });

    // 2. Thu thập từ phản hồi RSVP thực tế
    const rsvpList = (rawRsvps && rawRsvps.length > 0) ? rawRsvps : cards.flatMap((c) => c.rsvps || []);

    rsvpList.forEach((r: any, idx: number) => {
      const rsvpTime = safeToIsoString(r.createdAt);
      const isAttending = r.attending !== false;

      aggregated.push({
        id: `rsvp_act_${r.id || idx}`,
        timestamp: rsvpTime,
        type: "rsvp_submit",
        title: isAttending ? "Khách gửi xác nhận tham dự" : "Khách thông báo vắng mặt",
        actorName: r.name || "Khách mời",
        actorType: "guest",
        targetName: r.cardName || "Thiệp cưới",
        targetSlug: r.cardSlug,
        details: isAttending
          ? `Số lượng: ${r.guests || 1} người tham gia${r.note ? ` • Ghi chú: "${r.note}"` : ""}`
          : `Không thể tham gia${r.note ? ` • Lý do: "${r.note}"` : ""}`,
        metadata: {
          phone: r.phone,
          attending: isAttending,
          guests: r.guests || 1,
        },
      });
    });

    // 3. Thu thập từ lời chúc mừng thực tế
    const wishList = (rawWishes && rawWishes.length > 0) ? rawWishes : cards.flatMap((c) => c.wishes || []);

    wishList.forEach((w: any, idx: number) => {
      const wishTime = safeToIsoString(w.createdAt);

      aggregated.push({
        id: `wish_act_${w.id || idx}`,
        timestamp: wishTime,
        type: "wish_submit",
        title: "Khách gửi lời chúc phúc",
        actorName: w.name || "Người thân",
        actorType: "guest",
        targetName: w.cardName || "Thiệp cưới",
        targetSlug: w.cardSlug,
        details: `"${w.content || "Chúc hai bạn trăm năm hạnh phúc!"}"`,
      });
    });

    // 4. Thu thập từ tài khoản người dùng đăng ký
    const users = rawUsers || [];
    users.forEach((u) => {
      const userDate = safeToIsoString(u.createdAt);

      aggregated.push({
        id: `user_act_${u.id}`,
        timestamp: userDate,
        type: "user_register",
        title: "Tài khoản người dùng mới",
        actorName: u.name || "Người dùng",
        actorEmail: u.email,
        actorType: "user",
        details: `Đăng ký qua ${u.provider === "google" ? "Google OAuth" : "Email"} • Đã tạo ${u.cardsCount} thiệp`,
        metadata: {
          userId: u.id,
          provider: u.provider,
        },
      });
    });
  } catch (err) {
    console.warn("Lỗi khi tổng hợp activities từ DB:", err);
  }

  // Khử trùng lặp ID
  const uniqueMap = new Map<string, SystemActivity>();
  aggregated.forEach((item) => {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });

  let result = Array.from(uniqueMap.values());

  // Sắp xếp theo thời gian mới nhất lên đầu
  result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Bộ lọc
  if (options?.type && options.type !== "all") {
    result = result.filter((a) => a.type === options.type);
  }

  if (options?.userId) {
    const targetUid = options.userId;
    result = result.filter((a) => a.metadata?.userId === targetUid || a.actorName.includes(targetUid));
  }

  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.actorName.toLowerCase().includes(q) ||
        (a.actorEmail && a.actorEmail.toLowerCase().includes(q)) ||
        (a.targetName && a.targetName.toLowerCase().includes(q)) ||
        (a.details && a.details.toLowerCase().includes(q))
    );
  }

  if (options?.limit && options.limit > 0) {
    result = result.slice(0, options.limit);
  }

  return result;
}
