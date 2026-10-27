import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  savePartnerApplication,
  getPartnerApplications,
  updatePartnerApplicationStatus,
  deletePartnerApplication,
} from "../partnerService";
import { POST, GET, PATCH, DELETE } from "@/app/api/partners/route";
import { NextRequest } from "next/server";

// Mock file system and activityService
vi.mock("fs/promises", () => {
  let virtualData = "[]";
  return {
    default: {
      readFile: vi.fn(async () => virtualData),
      writeFile: vi.fn(async (_path, content) => {
        virtualData = content;
      }),
      mkdir: vi.fn(async () => {}),
    },
  };
});

vi.mock("../activityService", () => ({
  recordActivity: vi.fn().mockImplementation((act) => act),
}));

describe("Partner Service & API - Đăng ký đối tác cưới và tiếp thị liên kết", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Lưu thông tin đăng ký đối tác mới và trả về cấu trúc chuẩn", async () => {
    const partner = await savePartnerApplication({
      brandName: "TuArt Wedding Studio",
      category: "studio",
      contactName: "Nguyễn Văn Tuấn",
      phone: "0912345678",
      email: "tuan@tuart.vn",
      website: "https://tuart.vn",
      message: "Tặng voucher 2 triệu cho cặp đôi",
    });

    expect(partner).toBeDefined();
    expect(partner.id).toMatch(/^partner_/);
    expect(partner.brandName).toBe("TuArt Wedding Studio");
    expect(partner.category).toBe("studio");
    expect(partner.status).toBe("pending");
    expect(partner.createdAt).toBeDefined();
  });

  it("Lấy danh sách các đối tác đã nộp đơn đăng ký", async () => {
    const list = await getPartnerApplications();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].brandName).toBe("TuArt Wedding Studio");
  });

  it("Cập nhật trạng thái đối tác (updatePartnerApplicationStatus)", async () => {
    const list = await getPartnerApplications();
    const targetId = list[0].id;
    const updated = await updatePartnerApplicationStatus(targetId, "approved");
    expect(updated).toBeDefined();
    expect(updated?.status).toBe("approved");
  });

  it("API POST /api/partners - Chặn đăng ký khi thiếu trường bắt buộc", async () => {
    const reqWithoutBrand = new NextRequest("http://localhost:3000/api/partners", {
      method: "POST",
      body: JSON.stringify({
        brandName: "",
        contactName: "Anh Nam",
        phone: "0901234567",
        email: "nam@test.com",
      }),
    });

    const res = await POST(reqWithoutBrand);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toContain("tên thương hiệu");
  });

  it("API POST /api/partners - Chặn đăng ký khi email không hợp lệ", async () => {
    const reqInvalidEmail = new NextRequest("http://localhost:3000/api/partners", {
      method: "POST",
      body: JSON.stringify({
        brandName: "White Palace",
        contactName: "Chị Lan",
        phone: "0901234567",
        email: "khong-co-a-cong",
      }),
    });

    const res = await POST(reqInvalidEmail);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toContain("email");
  });

  it("API POST /api/partners - Tiếp nhận thành công đơn đăng ký chuẩn", async () => {
    const validReq = new NextRequest("http://localhost:3000/api/partners", {
      method: "POST",
      body: JSON.stringify({
        brandName: "PNJ Jewelry Partner",
        category: "jewelry",
        contactName: "Phạm Hải",
        phone: "0988889999",
        email: "hai@pnj.com.vn",
        website: "https://pnj.com.vn",
        message: "Ưu đãi 15% nhẫn cưới",
      }),
    });

    const res = await POST(validReq);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.brandName).toBe("PNJ Jewelry Partner");
    expect(data.message).toContain("Đăng ký đối tác thành công");
  });

  it("API GET /api/partners - Trả về danh sách đối tác", async () => {
    const req = new NextRequest("http://localhost:3000/api/partners", {
      method: "GET",
    });

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.partners)).toBe(true);
  });

  it("API PATCH /api/partners - Cập nhật trạng thái đối tác thành công", async () => {
    const list = await getPartnerApplications();
    const id = list[0].id;

    const patchReq = new NextRequest("http://localhost:3000/api/partners", {
      method: "PATCH",
      body: JSON.stringify({ id, status: "contacted" }),
    });

    const res = await PATCH(patchReq);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.partner.status).toBe("contacted");
  });

  it("API DELETE /api/partners - Xóa đơn đăng ký đối tác thành công", async () => {
    const list = await getPartnerApplications();
    const id = list[0].id;

    const deleteReq = new NextRequest(`http://localhost:3000/api/partners?id=${id}`, {
      method: "DELETE",
    });

    const res = await DELETE(deleteReq);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
