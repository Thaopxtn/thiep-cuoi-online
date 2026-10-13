"use client";

export type CutoutProgress = (message: string) => void;

// Use the image proxy only for remote images, and require a real image (no placeholder).
export function cutoutSourceUrl(source: string): string {
  if (/^https?:\/\//i.test(source)) {
    return `/api/proxy-image?strict=1&url=${encodeURIComponent(source)}`;
  }
  if (source.startsWith('/api/proxy-image?')) {
    const url = new URL(source, 'http://localhost');
    url.searchParams.set('strict', '1');
    return `${url.pathname}${url.search}`;
  }
  return source;
}

export async function loadCutoutImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('Ảnh không có kích thước hợp lệ.'));
      } else if (image.naturalWidth * image.naturalHeight > 24_000_000) {
        reject(new Error('Vui lòng dùng ảnh tối đa 24 megapixel.'));
      } else resolve(image);
    };
    image.onerror = () => reject(new Error('Không tải được ảnh. Vui lòng thử lại hoặc chọn ảnh khác.'));
    image.src = cutoutSourceUrl(source);
  });
}

export function createCutoutCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** Neural segmentation. No color/skin heuristic fallback masquerading as success. */
export async function segmentSubject(
  original: HTMLImageElement,
  onProgress?: CutoutProgress,
): Promise<HTMLImageElement> {
  onProgress?.('Đang tải bộ tách nền AI… Lần đầu có thể mất một lúc.');
  // Keep the ONNX runtime out of the Next.js server bundle (it contains
  // browser-only import.meta code). The browser downloads the ESM bundle on
  // demand and caches it after the first use.
  type RemovalModule = { removeBackground: (input: Blob, config: Record<string, unknown>) => Promise<Blob> };
  const loadModule = new Function('return import("https://esm.sh/@imgly/background-removal@1.7.0?bundle")') as () => Promise<RemovalModule>;
  const { removeBackground } = await loadModule();
  // Bound inference memory while retaining original pixels for the final export.
  const scale = Math.min(1, 2048 / Math.max(original.naturalWidth, original.naturalHeight));
  const input = createCutoutCanvas(Math.max(1, Math.round(original.naturalWidth * scale)), Math.max(1, Math.round(original.naturalHeight * scale)));
  const ctx = input.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
  ctx.drawImage(original, 0, 0, input.width, input.height);
  const blob = await new Promise<Blob>((resolve, reject) => input.toBlob(
    value => value ? resolve(value) : reject(new Error('Không đọc được ảnh.')), 'image/png',
  ));
  const result = await removeBackground(blob, {
    model: 'isnet_fp16',
    device: 'cpu',
    output: { format: 'image/png', quality: 1 },
    progress: (key: string, current: number, total: number) => {
      if (key.startsWith('fetch:') && total > 0) {
        onProgress?.(`Đang tải dữ liệu AI: ${Math.round(current / total * 100)}%`);
      } else {
        onProgress?.('Đang tách nhân vật và xử lý đường viền…');
      }
    },
  });
  const url = URL.createObjectURL(result);
  try { return await loadCutoutImage(url); }
  finally { URL.revokeObjectURL(url); }
}

export function extractAlpha(pixels: Uint8ClampedArray): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(pixels.length / 4);
  for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3];
  return alpha;
}

export function hasSubject(alpha: Uint8ClampedArray): boolean {
  return alpha.some(value => value > 16);
}

export function exportSubject(original: HTMLImageElement, mask: HTMLCanvasElement): string {
  const canvas = createCutoutCanvas(original.naturalWidth, original.naturalHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể xuất ảnh.');
  ctx.drawImage(original, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}
