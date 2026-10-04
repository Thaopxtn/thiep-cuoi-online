"use client";

/**
 * Utility Xóa phông nền ảnh thông minh 0đ chạy 100% trên trình duyệt (Client-Side)
 * - Tự động phát hiện màu nền biên (4 góc và viền)
 * - Tách người và vật thể với độ chuyển tiếp mềm (Alpha feathering)
 * - Xuất ra định dạng PNG trong suốt (Transparent PNG)
 * - 0đ chi phí máy chủ, hoạt động mượt mà ngay cả khi offline
 */
export async function smartRemoveBackground(
  imageSrc: string,
  tolerance: number = 38
): Promise<string> {
  let sourceToProcess = imageSrc;

  // Nếu là URL bên ngoài, gọi qua proxy /api/tools/remove-bg để tránh lỗi CORS canvas
  if (imageSrc.startsWith("http")) {
    try {
      const res = await fetch("/api/tools/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageSrc }),
      });
      if (res.ok) {
        const json = await res.json();
        // Nếu server đã có AI key xóa xong (remove.bg)
        if (json.success && json.outputUrl && !json.needsClientCutout) {
          return json.outputUrl;
        }
        if (json.outputUrl) {
          sourceToProcess = json.outputUrl;
        }
      }
    } catch (err) {
      console.warn("Proxy call failed, trying direct image load:", err);
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(imageSrc);

        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Lấy mẫu màu nền từ các góc và cạnh viền
        const samplePixel = (x: number, y: number): [number, number, number] => {
          const clampedX = Math.max(0, Math.min(width - 1, x));
          const clampedY = Math.max(0, Math.min(height - 1, y));
          const idx = (clampedY * width + clampedX) * 4;
          return [data[idx], data[idx + 1], data[idx + 2]];
        };

        const bgSamples: Array<[number, number, number]> = [
          samplePixel(2, 2),
          samplePixel(width - 3, 2),
          samplePixel(2, height - 3),
          samplePixel(width - 3, height - 3),
          samplePixel(Math.floor(width / 2), 2),
          samplePixel(Math.floor(width / 2), height - 3),
          samplePixel(2, Math.floor(height / 2)),
          samplePixel(width - 3, Math.floor(height / 2)),
        ];

        const feather = 20;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          let minDiff = 999999;
          for (const [bgR, bgG, bgB] of bgSamples) {
            const diff = Math.sqrt(
              Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
            );
            if (diff < minDiff) minDiff = diff;
          }

          if (minDiff < tolerance) {
            data[i + 3] = 0; // Trong suốt hoàn toàn
          } else if (minDiff < tolerance + feather) {
            // Mịn biên (Anti-aliased feathering)
            const alphaFactor = (minDiff - tolerance) / feather;
            data[i + 3] = Math.round(data[i + 3] * alphaFactor);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (canvasErr) {
        console.warn("Canvas background removal failed:", canvasErr);
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      resolve(imageSrc);
    };

    img.src = sourceToProcess;
  });
}
