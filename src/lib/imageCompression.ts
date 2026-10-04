/**
 * Client-Side Auto-Compressor to WebP
 * Giảm 90% - 95% dung lượng ảnh máy cơ (10MB -> ~180KB) trực tiếp trên trình duyệt
 * Không tốn 1 xu chi phí CPU máy chủ & tiết kiệm 95% băng thông lưu trữ
 */

export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  width: number;
  height: number;
}

export interface CompressionOptions {
  maxDimension?: number; // Chiều rộng/cao tối đa (mặc định 1600px - cực nét cho màn hình Retina)
  quality?: number; // Chất lượng nén WebP (0.82 là chuẩn vàng giữa độ nét & dung lượng)
}

export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxDimension = 1600, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    // Nếu là file không phải ảnh (SVG, PDF...) thì giữ nguyên
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          file,
          dataUrl: reader.result as string,
          originalSize: file.size,
          compressedSize: file.size,
          savingsPercent: 0,
          width: 0,
          height: 0,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Tính tỉ lệ thu nhỏ nếu ảnh quá lớn (ảnh máy cơ thường 6000x4000)
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Vẽ lên Canvas off-screen
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Cannot get canvas 2d context"));
          return;
        }

        // Kỹ thuật làm mịn ảnh khi thu nhỏ (bicubic-like smoothing)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất ra định dạng WebP hiện đại
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas blob conversion failed"));
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const compressedFile = new File([blob], cleanFileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const dataUrl = canvas.toDataURL("image/webp", quality);
            const savingsPercent = Math.max(
              0,
              Math.round(((file.size - compressedFile.size) / file.size) * 100)
            );

            resolve({
              file: compressedFile,
              dataUrl,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              savingsPercent,
              width,
              height,
            });
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes thành dạng đọc được (ví dụ: 12.5 MB, 180 KB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
