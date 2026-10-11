import { describe, it, expect } from "vitest";
import {
  ZENLOVE_TEMPLATES,
  findZenloveTemplate,
} from "@/data/zenloveTemplates";
import { getTemplateBySlugOrId } from "../templateUnifiedService";
import {
  normalizeToSlug,
  generateBrandedWeddingSlug,
  buildShareableWeddingUrl,
  isValidSlug,
  parseBrandedSlug,
} from "../brandedSlug";

describe("Đánh Số Thứ Tự & Tra Cứu Toàn Bộ Mẫu Thiệp (207 Mẫu)", () => {
  it("toàn bộ 207 mẫu đều có orderNumber tuần tự từ 1 đến 207 không trùng lặp", () => {
    expect(ZENLOVE_TEMPLATES.length).toBeGreaterThanOrEqual(207);

    const orderNumbers = ZENLOVE_TEMPLATES.map((t) => t.orderNumber);
    // Kiểm tra không có mẫu nào thiếu orderNumber
    expect(orderNumbers.every((num) => typeof num === "number" && num > 0)).toBe(true);

    // Kiểm tra tính tuần tự
    for (let i = 0; i < ZENLOVE_TEMPLATES.length; i++) {
      expect(ZENLOVE_TEMPLATES[i].orderNumber).toBe(i + 1);
    }

    // Kiểm tra không trùng lặp
    const uniqueOrders = new Set(orderNumbers);
    expect(uniqueOrders.size).toBe(ZENLOVE_TEMPLATES.length);
  });

  it("mỗi mẫu đều có code dạng mau-XX và displayCode dạng Mẫu XX chuẩn quy cách", () => {
    // Mẫu 1 (Son Duyên)
    const first = ZENLOVE_TEMPLATES[0];
    expect(first.orderNumber).toBe(1);
    expect(first.code).toBe("mau-01");
    expect(first.displayCode).toBe("Mẫu 01");

    // Mẫu thứ 10
    const tenth = ZENLOVE_TEMPLATES[9];
    expect(tenth.orderNumber).toBe(10);
    expect(tenth.code).toBe("mau-10");
    expect(tenth.displayCode).toBe("Mẫu 10");

    // Mẫu thứ 100 trở đi có 3 chữ số
    if (ZENLOVE_TEMPLATES.length >= 100) {
      const hundredth = ZENLOVE_TEMPLATES[99];
      expect(hundredth.orderNumber).toBe(100);
      expect(hundredth.code).toBe("mau-100");
      expect(hundredth.displayCode).toBe("Mẫu 100");
    }
  });

  it("findZenloveTemplate tra cứu chính xác theo số thứ tự (số nguyên và chuỗi)", () => {
    const found1 = findZenloveTemplate(1);
    expect(found1).toBeDefined();
    expect(found1?.orderNumber).toBe(1);
    expect(found1?.code).toBe("mau-01");

    const found01Str = findZenloveTemplate("01");
    expect(found01Str).toBeDefined();
    expect(found01Str?.orderNumber).toBe(1);

    const found1Str = findZenloveTemplate("1");
    expect(found1Str).toBeDefined();
    expect(found1Str?.orderNumber).toBe(1);

    const found5 = findZenloveTemplate(5);
    expect(found5).toBeDefined();
    expect(found5?.orderNumber).toBe(5);
  });

  it("findZenloveTemplate tra cứu chính xác theo mã 'mau-01', 'mau-1', 'mẫu 1'", () => {
    const byCode = findZenloveTemplate("mau-01");
    expect(byCode).toBeDefined();
    expect(byCode?.orderNumber).toBe(1);

    const byShortCode = findZenloveTemplate("mau-1");
    expect(byShortCode).toBeDefined();
    expect(byShortCode?.orderNumber).toBe(1);

    const byDisplayCode = findZenloveTemplate("Mẫu 01");
    expect(byDisplayCode).toBeDefined();
    expect(byDisplayCode?.orderNumber).toBe(1);

    const byVietnameseText = findZenloveTemplate("mẫu 1");
    expect(byVietnameseText).toBeDefined();
    expect(byVietnameseText?.orderNumber).toBe(1);
  });

  it("findZenloveTemplate vẫn tương thích 100% với slug và UUID cũ", () => {
    const sample = ZENLOVE_TEMPLATES[0];
    const bySlug = findZenloveTemplate(sample.slug);
    expect(bySlug).toBeDefined();
    expect(bySlug?.id).toBe(sample.id);

    const byId = findZenloveTemplate(sample.id);
    expect(byId).toBeDefined();
    expect(byId?.slug).toBe(sample.slug);
  });

  it("getTemplateBySlugOrId hỗ trợ tra cứu theo mã mẫu mau-01 và số thứ tự", () => {
    const unifiedByCode = getTemplateBySlugOrId("mau-01");
    expect(unifiedByCode).not.toBeNull();
    expect(unifiedByCode?.code).toBe("mau-01");
    expect(unifiedByCode?.displayCode).toBe("Mẫu 01");
    expect(unifiedByCode?.orderNumber).toBe(1);

    const unifiedByNum = getTemplateBySlugOrId("1");
    expect(unifiedByNum).not.toBeNull();
    expect(unifiedByNum?.orderNumber).toBe(1);
  });
});

describe("Tạo Đường Dẫn URL Chia Sẻ Chuẩn Thương Hiệu (Branded Wedding Slug)", () => {
  it("normalizeToSlug loại bỏ dấu tiếng Việt và chuẩn hóa thành chuỗi URL an toàn", () => {
    expect(normalizeToSlug("Nguyễn Tuấn")).toBe("nguyen-tuan");
    expect(normalizeToSlug("Đức Mạnh & Thùy Dung")).toBe("duc-manh-thuy-dung");
    expect(normalizeToSlug("Lê Hoàng Nam - Mai Phương")).toBe("le-hoang-nam-mai-phuong");
    expect(normalizeToSlug("Vũ Trọng Phụng & Bích Câu @ 2026!")).toBe("vu-trong-phung-bich-cau-2026");
    expect(normalizeToSlug("")).toBe("");
    expect(normalizeToSlug(null)).toBe("");
  });

  it("generateBrandedWeddingSlug tạo đúng format: Tên người dùng + zenlove + mã mẫu", () => {
    const slug1 = generateBrandedWeddingSlug({
      userName: "Nguyễn Tuấn",
      websiteName: "zenlove",
      templateCode: "mau-01",
    });
    expect(slug1).toBe("nguyen-tuan-zenlove-mau01");

    const slug2 = generateBrandedWeddingSlug({
      userName: "Trần Mai Anh",
      websiteName: "zenlove",
      templateCode: "05",
    });
    expect(slug2).toBe("tran-mai-anh-zenlove-mau05");
  });

  it("generateBrandedWeddingSlug fallback sang tên cặp đôi nếu không có userName riêng", () => {
    const slug = generateBrandedWeddingSlug({
      groomName: "Đức Mạnh",
      brideName: "Thùy Dung",
      websiteName: "zenlove",
      templateCode: "mau-01",
    });
    expect(slug).toBe("duc-manh-thuy-dung-zenlove-mau01");
  });

  it("generateBrandedWeddingSlug hỗ trợ customSuffix hoặc hậu tố ngẫu nhiên tránh trùng link", () => {
    const slugWithCustomYear = generateBrandedWeddingSlug({
      userName: "Nguyễn Tuấn",
      websiteName: "zenlove",
      templateCode: "mau01",
      customSuffix: "2026",
    });
    expect(slugWithCustomYear).toBe("nguyen-tuan-zenlove-mau01-2026");

    const slugWithUniqueSuffix = generateBrandedWeddingSlug({
      groomName: "Đức Mạnh",
      brideName: "Thùy Dung",
      websiteName: "zenlove",
      templateCode: "mau01",
      includeUniqueSuffix: true,
    });
    // Format: duc-manh-thuy-dung-zenlove-mau01-XXXX (4 số)
    expect(slugWithUniqueSuffix).toMatch(/^duc-manh-thuy-dung-zenlove-mau01-\d{4}$/);
  });

  it("buildShareableWeddingUrl ghép URL đầy đủ và chuẩn xác", () => {
    const url = buildShareableWeddingUrl("https://zenlove.me", "nguyen-tuan-zenlove-mau01");
    expect(url).toBe("https://zenlove.me/show/nguyen-tuan-zenlove-mau01");

    const localhostUrl = buildShareableWeddingUrl("http://localhost:3005/", "duc-manh-thuy-dung-zenlove-mau01");
    expect(localhostUrl).toBe("http://localhost:3005/show/duc-manh-thuy-dung-zenlove-mau01");
  });

  it("isValidSlug kiểm tra chính xác tính hợp lệ của đường dẫn", () => {
    expect(isValidSlug("nguyen-tuan-zenlove-mau01")).toBe(true);
    expect(isValidSlug("duc-manh-thuy-dung")).toBe(true);
    expect(isValidSlug("ab")).toBe(false); // Quá ngắn
    expect(isValidSlug("nguyen tuan")).toBe(false); // Có khoảng trắng
    expect(isValidSlug("nguyen@tuan")).toBe(false); // Có ký tự đặc biệt
    expect(isValidSlug("")).toBe(false);
  });

  it("parseBrandedSlug bóc tách chính xác tên người dùng, tên web, mã mẫu và thông tin khác", () => {
    const res1 = parseBrandedSlug("nguyen-van-thao-zenlove-mau15");
    expect(res1.isBranded).toBe(true);
    expect(res1.userPart).toBe("nguyen-van-thao");
    expect(res1.websitePart).toBe("zenlove");
    expect(res1.templateCode).toBe("mau15");
    expect(res1.templateOrder).toBe(15);
    expect(res1.suffix).toBeUndefined();

    const res2 = parseBrandedSlug("thaoh-zenlove-mau01-2026");
    expect(res2.isBranded).toBe(true);
    expect(res2.userPart).toBe("thaoh");
    expect(res2.websitePart).toBe("zenlove");
    expect(res2.templateCode).toBe("mau01");
    expect(res2.templateOrder).toBe(1);
    expect(res2.suffix).toBe("2026");

    const res3 = parseBrandedSlug("thao-zenlove-mau207");
    expect(res3.isBranded).toBe(true);
    expect(res3.userPart).toBe("thao");
    expect(res3.templateCode).toBe("mau207");
    expect(res3.templateOrder).toBe(207);

    // Slug thông thường
    const resNormal = parseBrandedSlug("hong-phong");
    expect(resNormal.isBranded).toBe(false);
  });
});
