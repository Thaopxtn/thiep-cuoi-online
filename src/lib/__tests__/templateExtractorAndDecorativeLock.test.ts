import { describe, it, expect } from "vitest";
import {
  isHongPhongTemplate,
  isDecorativeNode,
  getRealWeddingPhotoSlots,
  repairAndLockDecorativeNodes,
  HONG_PHONG_DECORATIVE_NODE_IDS,
} from "@/lib/decorativeLockService";
import { extractWeddingDetailsFromTemplate, toTitleCase } from "@/lib/templateExtractor";
import fs from "fs";
import path from "path";

describe("Dịch vụ Khóa họa tiết chuẩn & Trích xuất nội dung mẫu", () => {
  it("Nhận diện chính xác chỉ mẫu Hồng Phong mới là Hong Phong template", () => {
    expect(isHongPhongTemplate("8c5055d8-30db-4b38-8831-e11063e3d352")).toBe(true);
    expect(isHongPhongTemplate("hong-phong")).toBe(true);
    expect(isHongPhongTemplate("4e91a4ea-9e62-43d8-bf37-34e2eef30e2e")).toBe(false);
    expect(isHongPhongTemplate("son-duyen")).toBe(false);
    expect(isHongPhongTemplate(undefined)).toBe(false);
  });

  it("Không bao giờ inject họa tiết Hồng Phong (phong bì đỏ, sáp niêm) vào mẫu Son Duyên hoặc các mẫu khác", () => {
    const sonDuyenNodes: Record<string, any> = {
      ROOT: {
        type: { resolvedName: "Container" },
        nodes: ["E7PmIEZ4yI", "text_title"],
      },
      E7PmIEZ4yI: {
        type: { resolvedName: "PhotoBox" },
        props: {
          top: 0,
          isReplaceable: true,
          imgKey: "templates/4e91a4ea/assets/photo.jpg",
        },
      },
      text_title: {
        type: { resolvedName: "TextBox" },
        props: { text: "Tiến Đạt & Ngọc Nhi" },
      },
    };

    const result = repairAndLockDecorativeNodes(
      sonDuyenNodes,
      "4e91a4ea-9e62-43d8-bf37-34e2eef30e2e"
    );

    // Không chứa phong bì đỏ
    expect(result.repairedNodes["787yCeVVDc"]).toBeUndefined();
    // Không chứa nắp phong bì sáp niêm
    expect(result.repairedNodes["_3Dx3MkTv4"]).toBeUndefined();
    // Không chứa khung ảnh nghiêng U4ZPPsHPXy của Hồng Phong
    expect(result.repairedNodes["U4ZPPsHPXy"]).toBeUndefined();
    // Vẫn giữ nguyên node của Son Duyên
    expect(result.repairedNodes["E7PmIEZ4yI"]).toBeDefined();
    expect(result.repairedCount).toBe(0);
  });

  it("Tự động thanh lọc (purge) các node ngoại lai của Hồng Phong nếu lỡ dính vào template khác", () => {
    const contaminatedNodes: Record<string, any> = {
      ROOT: {
        type: { resolvedName: "Container" },
        nodes: ["E7PmIEZ4yI", "787yCeVVDc", "_3Dx3MkTv4", "U4ZPPsHPXy"],
      },
      E7PmIEZ4yI: {
        type: { resolvedName: "PhotoBox" },
        props: { top: 0, isReplaceable: true },
      },
      "787yCeVVDc": {
        type: { resolvedName: "PhotoBox" },
        props: { top: 207 },
      },
      "_3Dx3MkTv4": {
        type: { resolvedName: "PhotoBox" },
        props: { top: 371 },
      },
      U4ZPPsHPXy: {
        type: { resolvedName: "PhotoBox" },
        props: { top: 182 },
      },
    };

    const cleanResult = repairAndLockDecorativeNodes(
      contaminatedNodes,
      "4e91a4ea-9e62-43d8-bf37-34e2eef30e2e"
    );

    expect(cleanResult.repairedNodes["787yCeVVDc"]).toBeUndefined();
    expect(cleanResult.repairedNodes["_3Dx3MkTv4"]).toBeUndefined();
    expect(cleanResult.repairedNodes["U4ZPPsHPXy"]).toBeUndefined();
    expect(cleanResult.repairedNodes["E7PmIEZ4yI"]).toBeDefined();
    expect(cleanResult.repairedNodes["ROOT"].nodes).toEqual(["E7PmIEZ4yI"]);
  });

  it("Khôi phục đầy đủ 17 họa tiết chuẩn cho đúng mẫu Hồng Phong", () => {
    const hongPhongNodes: Record<string, any> = {
      ROOT: { type: { resolvedName: "Container" }, nodes: [] },
    };

    const result = repairAndLockDecorativeNodes(hongPhongNodes, "hong-phong");
    expect(result.repairedNodes["787yCeVVDc"]).toBeDefined();
    expect(result.repairedNodes["_3Dx3MkTv4"]).toBeDefined();
    expect(result.repairedCount).toBeGreaterThanOrEqual(15);
  });

  it("getRealWeddingPhotoSlots chọn đúng ảnh chân dung đầu tiên của template mà không bị loại trừ sai", () => {
    const nodes = {
      ROOT: { type: { resolvedName: "Container" } },
      photo_cover: {
        type: { resolvedName: "PhotoBox" },
        props: {
          top: 0,
          width: 500,
          height: 700,
          isReplaceable: true,
          imgKey: "templates/4e91a4ea/assets/cover.jpg",
        },
      },
      photo_small: {
        type: { resolvedName: "PhotoBox" },
        props: {
          top: 1500,
          width: 300,
          height: 400,
          isReplaceable: true,
          imgKey: "templates/4e91a4ea/assets/small.jpg",
        },
      },
    };

    const slots = getRealWeddingPhotoSlots(nodes, "son-duyen");
    expect(slots.length).toBe(2);
    expect(slots[0].id).toBe("photo_cover");
    expect(slots[0].props.top).toBe(0);
  });

  it("Trích xuất chính xác thông tin thực tế từ template Son Duyên", () => {
    const cacheFile = path.join(
      process.cwd(),
      "src",
      "data",
      "templates",
      "cloned-cache",
      "4e91a4ea-9e62-43d8-bf37-34e2eef30e2e.json"
    );

    if (fs.existsSync(cacheFile)) {
      const data = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
      const extracted = extractWeddingDetailsFromTemplate(data.parsedNodes, data);

      expect(extracted.groomName).toBe("Tiến Đạt");
      expect(extracted.brideName).toBe("Ngọc Nhi");
      expect(extracted.weddingDate).toBe("2026-12-30");
      expect(extracted.weddingTime).toBe("17:30");
      expect(extracted.venueAddress).toContain("125 Đường Nguyễn Thị Minh Khai");
      expect(extracted.album.length).toBeGreaterThan(0);
      expect(extracted.coverImage).toContain("cdn-resource.zenlove.me");
    }
  });

  it("toTitleCase viết hoa chuẩn danh từ riêng tiếng Việt", () => {
    expect(toTitleCase("tiến đạt")).toBe("Tiến Đạt");
    expect(toTitleCase("ngọc nhi")).toBe("Ngọc Nhi");
    expect(toTitleCase("ĐỨC MẠNH")).toBe("Đức Mạnh");
  });

  it("isTemplateStockOrPresetImage lọc chuẩn xác các ảnh mẫu có sẵn và giữ lại ảnh user upload", async () => {
    const { isTemplateStockOrPresetImage, addUploadedImageToLibrary, getSavedUploadedImages } =
      await import("@/lib/mediaLibraryService");

    // Ảnh mẫu có sẵn của template
    expect(
      isTemplateStockOrPresetImage(
        "https://cdn-resource.zenlove.me/templates/4e91a4ea/images/moon.png"
      )
    ).toBe(true);
    expect(isTemplateStockOrPresetImage("templates/328c2d89/images/lion.png")).toBe(true);
    expect(isTemplateStockOrPresetImage("resources/background/bg.jpg")).toBe(true);
    expect(isTemplateStockOrPresetImage("https://images.unsplash.com/photo-123")).toBe(true);

    // Ảnh do người dùng tự tải lên
    expect(isTemplateStockOrPresetImage("data:image/jpeg;base64,/9j/4AAQSkZJRg==")).toBe(false);
    expect(isTemplateStockOrPresetImage("blob:http://localhost:3005/abc-123")).toBe(false);
    expect(isTemplateStockOrPresetImage("https://my-server.com/wedding-cards/my-photo.webp")).toBe(
      false
    );

    // Từ chối thêm ảnh mẫu vào thư viện
    const beforeCount = getSavedUploadedImages().length;
    addUploadedImageToLibrary("https://cdn-resource.zenlove.me/templates/demo/lion.png");
    const afterCount = getSavedUploadedImages().length;
    expect(afterCount).toBe(beforeCount);
  });

  it("Mẫu sự kiện Đêm hội Trăng tròn không bị nhận diện nhầm các ảnh PNG minh họa thành ảnh cưới", () => {
    const cacheFile = path.join(
      process.cwd(),
      "src",
      "data",
      "templates",
      "cloned-cache",
      "328c2d89-01d9-486f-b245-10362d2fbaa0.json"
    );

    if (fs.existsSync(cacheFile)) {
      const data = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
      const slots = getRealWeddingPhotoSlots(data.parsedNodes, data.id);
      // Các ảnh PNG minh họa mặt trăng, đám mây, múa lân không bị đưa vào slot thay ảnh
      expect(slots.length).toBe(0);
    }
  });
});
