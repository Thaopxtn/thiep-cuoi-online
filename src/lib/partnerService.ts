import fs from "fs/promises";
import path from "path";
import { recordActivity } from "./activityService";

export interface PartnerApplication {
  id: string;
  brandName: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  website?: string;
  message?: string;
  status: "pending" | "contacted" | "approved" | "rejected";
  createdAt: string;
}

const PARTNERS_FILE = path.join(process.cwd(), "src", "data", "partner-applications.json");

/**
 * Đọc toàn bộ danh sách đơn đăng ký đối tác cưới
 */
export async function getPartnerApplications(): Promise<PartnerApplication[]> {
  try {
    const content = await fs.readFile(PARTNERS_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return [];
    }
    console.error("Lỗi đọc danh sách đối tác đăng ký:", err);
    return [];
  }
}

/**
 * Lưu đơn đăng ký đối tác mới và kích hoạt ghi nhận sự kiện hoạt động hệ thống
 */
export async function savePartnerApplication(data: {
  brandName: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  website?: string;
  message?: string;
}): Promise<PartnerApplication> {
  const list = await getPartnerApplications();

  const newApp: PartnerApplication = {
    id: `partner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    brandName: data.brandName.trim(),
    category: data.category.trim(),
    contactName: data.contactName.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    website: data.website?.trim() || "",
    message: data.message?.trim() || "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  list.unshift(newApp);

  try {
    await fs.mkdir(path.dirname(PARTNERS_FILE), { recursive: true });
    await fs.writeFile(PARTNERS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi ghi file partner-applications.json:", err);
  }

  // Ghi nhật ký vào Trung tâm Quản trị Admin
  try {
    recordActivity({
      type: "partner_registration",
      title: "Đối tác cưới mới đăng ký hợp tác",
      actorName: newApp.contactName,
      actorEmail: newApp.email,
      actorType: "user",
      targetName: newApp.brandName,
      targetId: newApp.id,
      details: `Lĩnh vực: ${newApp.category} • SĐT: ${newApp.phone}${newApp.message ? ` • Ưu đãi: "${newApp.message}"` : ""}`,
      metadata: {
        category: newApp.category,
        website: newApp.website,
        phone: newApp.phone,
      },
    });
  } catch (err) {
    console.error("Lỗi ghi nhận activity đối tác:", err);
  }

  return newApp;
}


/**
 * Cập nhật trạng thái xử lý của đơn đăng ký đối tác
 */
export async function updatePartnerApplicationStatus(
  id: string,
  status: "pending" | "contacted" | "approved" | "rejected"
): Promise<PartnerApplication | null> {
  const list = await getPartnerApplications();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  list[idx].status = status;

  try {
    await fs.mkdir(path.dirname(PARTNERS_FILE), { recursive: true });
    await fs.writeFile(PARTNERS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi cập nhật partner-applications.json:", err);
  }

  return list[idx];
}

/**
 * Xóa một đơn đăng ký đối tác
 */
export async function deletePartnerApplication(id: string): Promise<boolean> {
  const list = await getPartnerApplications();
  const filtered = list.filter((a) => a.id !== id);
  if (filtered.length === list.length) return false;

  try {
    await fs.mkdir(path.dirname(PARTNERS_FILE), { recursive: true });
    await fs.writeFile(PARTNERS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Lỗi xóa đơn partner-applications.json:", err);
    return false;
  }
}
