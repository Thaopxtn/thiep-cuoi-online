import { describe, it, expect, vi } from "vitest";
import { isSkinPixel, generateSubjectMask, magicWandErase, boxEraseArea } from "../backgroundRemoval";

describe("AI Background Removal & Skin Protection", () => {
  it("nhận diện chính xác màu da người (Human Skin Tones)", () => {
    // Da sáng / hồng hào châu Á
    expect(isSkinPixel(235, 185, 150)).toBe(true);
    // Da vàng ngà / trung tính
    expect(isSkinPixel(210, 160, 120)).toBe(true);
    // Da rám nắng
    expect(isSkinPixel(170, 115, 80)).toBe(true);

    // Không phải màu da:
    // Màu trắng (Váy cưới / Phông nền)
    expect(isSkinPixel(255, 255, 255)).toBe(false);
    // Màu đen (Áo vest / Chữ)
    expect(isSkinPixel(10, 10, 10)).toBe(false);
    // Màu xanh lá cây (Cây cỏ ngoại cảnh)
    expect(isSkinPixel(50, 180, 50)).toBe(false);
    // Màu xanh da trời (Bầu trời)
    expect(isSkinPixel(80, 140, 220)).toBe(false);
    // Màu xám (Tường)
    expect(isSkinPixel(150, 150, 150)).toBe(false);
  });

  it("generateSubjectMask bảo vệ vùng da người và tạo alpha mask", () => {
    const width = 100;
    const height = 100;
    const pixelData = new Uint8ClampedArray(width * height * 4);

    // Điền toàn bộ bằng màu nền xanh lá (green screen)
    for (let i = 0; i < width * height; i++) {
      pixelData[i * 4] = 40;
      pixelData[i * 4 + 1] = 200;
      pixelData[i * 4 + 2] = 40;
      pixelData[i * 4 + 3] = 255;
    }

    // Ở giữa đặt nhân vật có khuôn mặt da người (x=45..55, y=30..40)
    for (let y = 30; y <= 40; y++) {
      for (let x = 45; x <= 55; x++) {
        const idx = (y * width + x) * 4;
        pixelData[idx] = 230;     // R (da)
        pixelData[idx + 1] = 180; // G (da)
        pixelData[idx + 2] = 140; // B (da)
        pixelData[idx + 3] = 255;
      }
    }

    const mockCtx = {
      getImageData: vi.fn().mockReturnValue({
        width,
        height,
        data: pixelData,
      }),
    } as unknown as CanvasRenderingContext2D;

    const mask = generateSubjectMask(mockCtx, width, height, {
      tolerance: 40,
      protectSkin: true,
      protectCenter: true,
      feather: 0,
    });

    expect(mask.length).toBe(width * height);

    // Điểm góc (0,0) phải là NỀN (0)
    expect(mask[0]).toBe(0);

    // Điểm khuôn mặt (x=50, y=35) PHẢI ĐƯỢC BẢO VỆ (255)
    const facePos = 35 * width + 50;
    expect(mask[facePos]).toBe(255);
  });

  it("magicWandErase xóa sạch mảng nền kết nối từ điểm bấm và dừng trước biên da người", () => {
    const width = 20;
    const height = 20;

    const maskData = new Uint8ClampedArray(width * height * 4);
    // Ban đầu mask toàn bộ là đục (alpha = 255)
    for (let i = 0; i < maskData.length; i += 4) {
      maskData[i] = 255;
      maskData[i + 1] = 255;
      maskData[i + 2] = 255;
      maskData[i + 3] = 255;
    }

    const origData = new Uint8ClampedArray(width * height * 4);
    // Điền màu trắng studio [240, 240, 240]
    for (let i = 0; i < origData.length; i += 4) {
      origData[i] = 240;
      origData[i + 1] = 240;
      origData[i + 2] = 240;
      origData[i + 3] = 255;
    }

    // Đặt biên da người ở cột x = 10 (ngăn lan sang nửa phải)
    for (let y = 0; y < height; y++) {
      const idx = (y * width + 10) * 4;
      origData[idx] = 230;     // Da người
      origData[idx + 1] = 180;
      origData[idx + 2] = 140;
    }

    const mockMaskCtx = {
      getImageData: vi.fn().mockReturnValue({ data: maskData }),
      putImageData: vi.fn(),
    };
    const mockMaskCanvas = {
      width,
      height,
      getContext: vi.fn().mockReturnValue(mockMaskCtx),
    } as unknown as HTMLCanvasElement;

    const mockOrigCtx = {
      getImageData: vi.fn().mockReturnValue({ data: origData }),
    };
    const mockOrigCanvas = {
      width,
      height,
      getContext: vi.fn().mockReturnValue(mockOrigCtx),
    } as unknown as HTMLCanvasElement;

    // Bấm vào điểm (2, 2) thuộc nửa bên trái
    const result = magicWandErase(mockMaskCanvas, mockOrigCanvas, 2, 2, 30);
    expect(result).toBe(true);

    // Điểm (2, 2) phải bị xóa (alpha = 0)
    const idx2_2 = (2 * width + 2) * 4;
    expect(maskData[idx2_2 + 3]).toBe(0);

    // Điểm da người ở (10, 2) KHÔNG bị xóa
    const idx10_2 = (2 * width + 10) * 4;
    expect(maskData[idx10_2 + 3]).toBe(255);

    // Điểm bên kia biên da (15, 2) KHÔNG bị xóa vì flood fill không vượt qua được biên
    const idx15_2 = (2 * width + 15) * 4;
    expect(maskData[idx15_2 + 3]).toBe(255);
  });

  it("boxEraseArea xóa sạch vùng chữ nhật được kéo và bảo vệ da người bên trong khung", () => {
    const width = 30;
    const height = 30;

    const maskData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < maskData.length; i += 4) {
      maskData[i] = 255;
      maskData[i + 1] = 255;
      maskData[i + 2] = 255;
      maskData[i + 3] = 255;
    }

    const origData = new Uint8ClampedArray(width * height * 4);
    // Điền màu phông xám trắng
    for (let i = 0; i < origData.length; i += 4) {
      origData[i] = 235;
      origData[i + 1] = 235;
      origData[i + 2] = 235;
      origData[i + 3] = 255;
    }

    // Đặt một bàn tay da người ở giữa (x=14..16, y=14..16)
    for (let y = 14; y <= 16; y++) {
      for (let x = 14; x <= 16; x++) {
        const idx = (y * width + x) * 4;
        origData[idx] = 225;     // Da
        origData[idx + 1] = 175;
        origData[idx + 2] = 135;
      }
    }

    const mockMaskCtx = {
      getImageData: vi.fn().mockImplementation((x, y, w, h) => {
        const subData = new Uint8ClampedArray(w * h * 4);
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
            const srcIdx = ((y + row) * width + (x + col)) * 4;
            const destIdx = (row * w + col) * 4;
            subData[destIdx] = maskData[srcIdx];
            subData[destIdx + 1] = maskData[srcIdx + 1];
            subData[destIdx + 2] = maskData[srcIdx + 2];
            subData[destIdx + 3] = maskData[srcIdx + 3];
          }
        }
        return { data: subData };
      }),
      putImageData: vi.fn().mockImplementation((imgData, x, y) => {
        const w = 11;
        const h = 11;
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
            const srcIdx = (row * w + col) * 4;
            const destIdx = ((y + row) * width + (x + col)) * 4;
            maskData[destIdx + 3] = imgData.data[srcIdx + 3];
          }
        }
      }),
    };

    const mockMaskCanvas = {
      width,
      height,
      getContext: vi.fn().mockReturnValue(mockMaskCtx),
    } as unknown as HTMLCanvasElement;

    const mockOrigCtx = {
      getImageData: vi.fn().mockImplementation((x, y, w, h) => {
        const subData = new Uint8ClampedArray(w * h * 4);
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
            const srcIdx = ((y + row) * width + (x + col)) * 4;
            const destIdx = (row * w + col) * 4;
            subData[destIdx] = origData[srcIdx];
            subData[destIdx + 1] = origData[srcIdx + 1];
            subData[destIdx + 2] = origData[srcIdx + 2];
            subData[destIdx + 3] = origData[srcIdx + 3];
          }
        }
        return { data: subData };
      }),
    };

    const mockOrigCanvas = {
      width,
      height,
      getContext: vi.fn().mockReturnValue(mockOrigCtx),
    } as unknown as HTMLCanvasElement;

    // Kéo hộp từ (10, 10) đến (20, 20) (kích thước 11x11)
    const success = boxEraseArea(mockMaskCanvas, mockOrigCanvas, 10, 10, 20, 20, { protectSkin: true });
    expect(success).toBe(true);

    // Điểm phông nền (10, 10) bên trong khung phải bị xóa
    const idx10_10 = (10 * width + 10) * 4;
    expect(maskData[idx10_10 + 3]).toBe(0);

    // Điểm da người (15, 15) bên trong khung PHẢI ĐƯỢC BẢO VỆ
    const idx15_15 = (15 * width + 15) * 4;
    expect(maskData[idx15_15 + 3]).toBe(255);

    // Điểm phông ngoài khung (5, 5) giữ nguyên
    const idx5_5 = (5 * width + 5) * 4;
    expect(maskData[idx5_5 + 3]).toBe(255);
  });
});
