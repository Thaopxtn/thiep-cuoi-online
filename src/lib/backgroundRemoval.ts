"use client";

/**
 * AI-Inspired Smart Background Removal & Subject Preservation (Client-Side)
 * - Tự động phát hiện màu da người (Human Skin Tone: YCbCr & RGB) để bảo vệ khuôn mặt & cơ thể
 * - Bảo vệ vùng trọng tâm nhân vật (Subject Core Zone & Silhouette Preservation)
 * - Ma trận phân tách thời gian thực (Real-time Live Separation Map) cho thanh trượt 60fps
 * - Làm mềm viền mượt mà (Anti-aliased Alpha Feathering), loại bỏ răng cưa
 * - 0đ chi phí máy chủ, hoạt động 100% offline trên trình duyệt
 */

export interface CutoutOptions {
  tolerance?: number;
  feather?: number;
  protectSkin?: boolean;
  protectCenter?: boolean;
  personProtection?: number; // 0 to 100
}

export interface SeparationPrecomputedData {
  width: number;
  height: number;
  bgDiff: Float32Array;
  subjectConfidence: Uint8Array;
  skinMap: Uint8Array;
  isOuterBackground?: Uint8Array;
  faceCenterX: number;
  faceCenterY: number;
  hasSkin: boolean;
}

/**
 * Kiểm tra xem một pixel có thuộc dải màu da người hay không
 */
export function isSkinPixel(r: number, g: number, b: number): boolean {
  if (r < 60 || g < 40 || b < 20) return false;
  // Quy tắc tương quan RGB cơ bản
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  if (diff < 15) return false;
  if (!(r > g && g >= b)) return false;

  // Chuyển đổi không gian màu YCbCr chuẩn ITU-R BT.601
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  return cb >= 75 && cb <= 135 && cr >= 128 && cr <= 180;
}

/**
 * Tính khoảng cách màu sắc Euclidean giữa 2 pixel RGB
 */
function colorDist(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
}

/**
 * Tính toán trước bản đồ phân tách nhân vật & nền (Precomputed Map)
 * Chạy 1 lần duy nhất khi ảnh nạp vào để hỗ trợ thanh trượt phản hồi 60fps tức thì!
 */
export function precomputeSeparationMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): SeparationPrecomputedData {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  const skinMap = new Uint8Array(totalPixels);
  const subjectConfidence = new Uint8Array(totalPixels);
  const bgDiff = new Float32Array(totalPixels);

  const skinXs: number[] = [];
  const skinYs: number[] = [];

  // 1. Quét tìm tất cả các pixel da người
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (isSkinPixel(data[idx], data[idx + 1], data[idx + 2])) {
        const pos = y * width + x;
        skinMap[pos] = 1;
        skinXs.push(x);
        skinYs.push(y);
      }
    }
  }

  const skinCount = skinXs.length;
  const hasSkin = skinCount > 30;

  let minSkinX = width * 0.25;
  let maxSkinX = width * 0.75;
  let minSkinY = height * 0.15;
  let maxSkinY = height * 0.6;
  let faceCenterX = width * 0.5;
  let faceCenterY = height * 0.35;

  if (hasSkin) {
    skinXs.sort((a, b) => a - b);
    skinYs.sort((a, b) => a - b);

    // Lọc nhiễu đốm da ngoại lai bằng phân vị 3% và 97%
    const p3 = Math.floor(skinCount * 0.03);
    const p97 = Math.min(skinCount - 1, Math.floor(skinCount * 0.97));
    minSkinX = skinXs[p3];
    maxSkinX = skinXs[p97];

    const p3y = Math.floor(skinCount * 0.03);
    const p97y = Math.min(skinCount - 1, Math.floor(skinCount * 0.97));
    minSkinY = skinYs[p3y];
    maxSkinY = skinYs[p97y];

    faceCenterX = (minSkinX + maxSkinX) / 2;
    faceCenterY = (minSkinY + maxSkinY) / 2;
  }

  // 2. Xây dựng Silhouette Cone (Vùng thân người và trang phục cô dâu chú rể)
  const headTop = hasSkin
    ? Math.max(0, minSkinY - (maxSkinY - minSkinY) * 0.35)
    : height * 0.1;
  const headWidth = Math.max(80, maxSkinX - minSkinX);
  const shoulderHalfWidth = headWidth * 0.7 + 45;

  for (let y = 0; y < height; y++) {
    if (y < headTop) {
      // Khoảng không gian trên đầu (phông trần, bầu trời)
      for (let x = 0; x < width; x++) {
        const pos = y * width + x;
        subjectConfidence[pos] = skinMap[pos] ? 100 : 0;
      }
      continue;
    }

    const verticalProgress = Math.min(1, (y - headTop) / (height - headTop));
    // Mở rộng dần từ ngực xuống chân váy/áo
    const currentHalfWidth = shoulderHalfWidth + verticalProgress * (width * 0.22);

    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      if (skinMap[pos]) {
        subjectConfidence[pos] = 100;
        continue;
      }

      const distFromCenter = Math.abs(x - faceCenterX);
      if (distFromCenter < currentHalfWidth) {
        // Bên trong vùng thân người (váy cưới, áo vest)
        const centerProximity = 1 - distFromCenter / currentHalfWidth;
        subjectConfidence[pos] = Math.round(75 + centerProximity * 25);
      } else if (distFromCenter < currentHalfWidth + 35) {
        // Vùng chuyển tiếp mép tay / viền voan
        const edgeRatio = 1 - (distFromCenter - currentHalfWidth) / 35;
        subjectConfidence[pos] = Math.round(25 + edgeRatio * 45);
      } else {
        subjectConfidence[pos] = 0;
      }
    }
  }

  // 3. Lấy các mẫu màu nền đại diện sạch (Ưu tiên viền trên & các góc trên, tuyệt đối không lấy góc dưới có váy/áo)
  const bgCandidates: Array<[number, number, number]> = [];

  // 12 điểm viền trên
  for (let i = 0; i < 12; i++) {
    const x = Math.floor((width * (i + 0.5)) / 12);
    const y = Math.min(8, Math.max(1, Math.floor(height * 0.01)));
    const idx = (y * width + x) * 4;
    bgCandidates.push([data[idx], data[idx + 1], data[idx + 2]]);
  }

  // 2 góc trên
  for (const [cx, cy] of [[2, 2], [width - 3, 2]]) {
    const idx = (cy * width + cx) * 4;
    bgCandidates.push([data[idx], data[idx + 1], data[idx + 2]]);
  }

  // Viền 2 bên trên cao (y < 12% chiều cao, nơi người không đứng)
  for (let i = 1; i <= 3; i++) {
    const y = Math.floor(height * (i * 0.03));
    const lIdx = (y * width + 4) * 4;
    bgCandidates.push([data[lIdx], data[lIdx + 1], data[lIdx + 2]]);
    const rIdx = (y * width + (width - 5)) * 4;
    bgCandidates.push([data[rIdx], data[rIdx + 1], data[rIdx + 2]]);
  }

  // Lọc bỏ bất kỳ mẫu nào rơi vào màu da người
  const bgPalette: Array<[number, number, number]> = [];
  for (const [r, g, b] of bgCandidates) {
    if (isSkinPixel(r, g, b)) continue;
    bgPalette.push([r, g, b]);
  }

  if (bgPalette.length === 0) {
    bgPalette.push([230, 230, 230]);
  }

  // 4. Tính khoảng cách màu sắc nhỏ nhất tới nền cho từng pixel (siêu nhanh ~20ms)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      const idx = pos * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      let minD = 999999;
      for (let p = 0; p < bgPalette.length; p++) {
        const [bgr, bgg, bgb] = bgPalette[p];
        const d = colorDist(r, g, b, bgr, bgg, bgb);
        if (d < minD) {
          minD = d;
          if (d <= 4) break;
        }
      }
      bgDiff[pos] = minD;
    }
  }

  // 5. Phân tích phông nền ngoài kết nối biên (Border-Connected Flood Fill)
  // Bắt đầu từ hàng trên cùng và 2 góc trên, lan xuống dưới dọc theo phông nền studio
  const isOuterBackground = new Uint8Array(totalPixels);
  const floodQueue = new Int32Array(totalPixels);
  let fHead = 0;
  let fTail = 0;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < Math.min(5, height); y++) {
      const pos = y * width + x;
      if (skinMap[pos] === 0) {
        isOuterBackground[pos] = 1;
        floodQueue[fTail++] = pos;
      }
    }
  }

  const floodThreshold = 46;
  while (fHead < fTail) {
    const pos = floodQueue[fHead++];
    const x = pos % width;
    const y = Math.floor(pos / width);

    const n1 = x > 0 ? pos - 1 : -1;
    const n2 = x < width - 1 ? pos + 1 : -1;
    const n3 = y > 0 ? pos - width : -1;
    const n4 = y < height - 1 ? pos + width : -1;

    const neighbors = [n1, n2, n3, n4];
    for (let i = 0; i < 4; i++) {
      const nPos = neighbors[i];
      if (nPos >= 0 && isOuterBackground[nPos] === 0 && skinMap[nPos] === 0) {
        if (bgDiff[nPos] <= floodThreshold) {
          isOuterBackground[nPos] = 1;
          floodQueue[fTail++] = nPos;
        }
      }
    }
  }

  return {
    width,
    height,
    bgDiff,
    subjectConfidence,
    skinMap,
    isOuterBackground,
    faceCenterX,
    faceCenterY,
    hasSkin,
  };
}

/**
 * Tính toán Mask thời gian thực từ thanh trượt (Live Slider Preview - 60fps)
 * @param precomputed Dữ liệu tính toán trước
 * @param cutoutLevel Mức tách nền (5 đến 95, default 40)
 * @param personProtection Mức bảo vệ người & váy áo (0 đến 100, default 80)
 * @param feather Độ mịn viền (0 đến 10)
 */
export function computeMaskFromSliders(
  precomputed: SeparationPrecomputedData,
  cutoutLevel: number,
  personProtection: number = 80,
  feather: number = 2
): Uint8ClampedArray {
  const { width, height, bgDiff, subjectConfidence, skinMap, isOuterBackground } = precomputed;
  const total = width * height;
  const mask = new Uint8ClampedArray(total);

  // Quy đổi cutoutLevel (5 -> 95) sang ngưỡng màu cơ bản (12 -> 82)
  const baseThreshold = 12 + (cutoutLevel / 100) * 70;
  // Trọng số bảo vệ người: từ 0 đến 1.8
  const protectWeight = (personProtection / 100) * 1.5;

  for (let pos = 0; pos < total; pos++) {
    // Da người bảo vệ tuyệt đối 100%
    if (skinMap[pos]) {
      mask[pos] = 255;
      continue;
    }

    const diff = bgDiff[pos];
    const conf = subjectConfidence[pos];
    const isOuter = isOuterBackground ? isOuterBackground[pos] === 1 : true;

    // Vùng thân người nằm bên trong (Váy cưới, áo vest, hoa cưới)
    // Nếu không thuộc phông nền biên ngoài lan vào -> Bảo vệ tối đa không bao giờ đục lỗ váy
    if (!isOuter && conf > 20) {
      mask[pos] = 255;
      continue;
    }

    // Điểm số phân tách: Tăng đáng kể độ khó xóa nếu pixel nằm trong vùng thân người
    const subjectBonus = (conf / 100) * 65 * protectWeight;
    const effectiveDiff = diff + subjectBonus;

    if (effectiveDiff <= baseThreshold) {
      mask[pos] = 0; // Nền
    } else {
      mask[pos] = 255; // Người / Váy / Áo
    }
  }

  // Làm mịn viền nếu có feather
  if (feather > 0) {
    const finalMask = new Uint8ClampedArray(mask);
    const rad = Math.min(4, Math.max(1, Math.round(feather)));

    for (let y = rad; y < height - rad; y += 1) {
      for (let x = rad; x < width - rad; x += 1) {
        const pos = y * width + x;
        if (mask[pos] > 0) {
          let bgCount = 0;
          let totalCount = 0;
          for (let dy = -rad; dy <= rad; dy++) {
            for (let dx = -rad; dx <= rad; dx++) {
              totalCount++;
              if (mask[(y + dy) * width + (x + dx)] === 0) {
                bgCount++;
              }
            }
          }
          if (bgCount > 0) {
            const ratio = (totalCount - bgCount) / totalCount;
            finalMask[pos] = Math.round(255 * ratio);
          }
        }
      }
    }
    return finalMask;
  }

  return mask;
}

/**
 * Chấm tẩy vùng thông minh 1-chạm (Magic Wand Flood Fill)
 * Xóa toàn bộ mảng nền nối liền nhau từ điểm người dùng bấm chuột (kẽ tay, nách, khoảng trống giữa 2 người)
 * @param maskCanvas Canvas chứa mặt nạ alpha hiện tại
 * @param originalImg Element ảnh gốc hoặc canvas ảnh gốc
 * @param clickX Tọa độ X
 * @param clickY Tọa độ Y
 * @param tolerance Độ nhạy màu (10 đến 60, mặc định 32)
 */
export function magicWandErase(
  maskCanvas: HTMLCanvasElement,
  originalImg: HTMLImageElement | HTMLCanvasElement,
  clickX: number,
  clickY: number,
  tolerance: number = 32
): boolean {
  const width = maskCanvas.width;
  const height = maskCanvas.height;
  if (clickX < 0 || clickX >= width || clickY < 0 || clickY >= height) return false;

  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) return false;

  // Lấy dữ liệu màu ảnh gốc
  let origCtx: CanvasRenderingContext2D | null = null;
  if (typeof (originalImg as any)?.getContext === "function") {
    origCtx = (originalImg as any).getContext("2d");
  } else if (typeof document !== "undefined") {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tctx = tempCanvas.getContext("2d");
    if (tctx) {
      tctx.drawImage(originalImg as any, 0, 0, width, height);
      origCtx = tctx;
    }
  }

  if (!origCtx) return false;

  const maskImgData = maskCtx.getImageData(0, 0, width, height);
  const origImgData = origCtx.getImageData(0, 0, width, height);
  const maskData = maskImgData.data;
  const origData = origImgData.data;

  const total = width * height;
  const startPos = clickY * width + clickX;
  const startIdx = startPos * 4;

  const targetR = origData[startIdx];
  const targetG = origData[startIdx + 1];
  const targetB = origData[startIdx + 2];

  // Tuyệt đối không cho phép bấm xóa trúng da người (bảo vệ mặt, cổ, cánh tay)
  if (isSkinPixel(targetR, targetG, targetB)) {
    return false;
  }

  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  queue[tail++] = startPos;
  visited[startPos] = 1;

  const tolSq = tolerance * tolerance * 3;

  while (head < tail) {
    const pos = queue[head++];
    const idx = pos * 4;
    // Đặt alpha của mask về 0 (xóa nền hoàn toàn)
    maskData[idx + 3] = 0;

    const x = pos % width;
    const y = Math.floor(pos / width);

    // 4 điểm lân cận
    const n1 = x > 0 ? pos - 1 : -1;
    const n2 = x < width - 1 ? pos + 1 : -1;
    const n3 = y > 0 ? pos - width : -1;
    const n4 = y < height - 1 ? pos + width : -1;

    const neighbors = [n1, n2, n3, n4];
    for (let i = 0; i < 4; i++) {
      const nPos = neighbors[i];
      if (nPos >= 0 && visited[nPos] === 0) {
        visited[nPos] = 1;
        const nIdx = nPos * 4;

        const r = origData[nIdx];
        const g = origData[nIdx + 1];
        const b = origData[nIdx + 2];

        // Ngừng lan nếu gặp da người
        if (isSkinPixel(r, g, b)) continue;

        const dr = r - targetR;
        const dg = g - targetG;
        const db = b - targetB;
        const distSq = dr * dr + dg * dg + db * db;

        if (distSq <= tolSq) {
          queue[tail++] = nPos;
        }
      }
    }
  }

  maskCtx.putImageData(maskImgData, 0, 0);
  return tail > 0;
}

/**
 * Xóa phông vùng chữ nhật (Box / Rectangle Erase Tool)
 * Cho phép người dùng kéo thả chuột để xóa nhanh một vùng phông nền còn sót
 * (kẽ hở giữa 2 người, góc trên, khoảng trống thừa)
 * @param maskCanvas Canvas chứa mặt nạ alpha hiện tại
 * @param originalImg Element ảnh gốc hoặc canvas ảnh gốc (để kiểm tra màu da)
 * @param x1 Tọa độ X góc 1
 * @param y1 Tọa độ Y góc 1
 * @param x2 Tọa độ X góc 2
 * @param y2 Tọa độ Y góc 2
 * @param options Tùy chọn bảo vệ da người (mặc định true)
 */
export function boxEraseArea(
  maskCanvas: HTMLCanvasElement,
  originalImg: HTMLImageElement | HTMLCanvasElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: { protectSkin?: boolean } = {}
): boolean {
  const width = maskCanvas.width;
  const height = maskCanvas.height;
  const protectSkin = options.protectSkin ?? true;

  const minX = Math.max(0, Math.min(Math.round(x1), Math.round(x2)));
  const maxX = Math.min(width - 1, Math.max(Math.round(x1), Math.round(x2)));
  const minY = Math.max(0, Math.min(Math.round(y1), Math.round(y2)));
  const maxY = Math.min(height - 1, Math.max(Math.round(y1), Math.round(y2)));

  if (minX > maxX || minY > maxY) return false;

  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) return false;

  if (!protectSkin) {
    maskCtx.clearRect(minX, minY, maxX - minX + 1, maxY - minY + 1);
    return true;
  }

  let origCtx: CanvasRenderingContext2D | null = null;
  if (typeof (originalImg as any)?.getContext === "function") {
    origCtx = (originalImg as any).getContext("2d");
  } else if (typeof document !== "undefined") {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tctx = tempCanvas.getContext("2d");
    if (tctx) {
      tctx.drawImage(originalImg as any, 0, 0, width, height);
      origCtx = tctx;
    }
  }

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const maskImgData = maskCtx.getImageData(minX, minY, boxW, boxH);
  const maskData = maskImgData.data;

  let origData: Uint8ClampedArray | null = null;
  if (origCtx) {
    origData = origCtx.getImageData(minX, minY, boxW, boxH).data;
  }

  let clearedCount = 0;
  for (let by = 0; by < boxH; by++) {
    for (let bx = 0; bx < boxW; bx++) {
      const idx = (by * boxW + bx) * 4;

      if (origData) {
        const r = origData[idx];
        const g = origData[idx + 1];
        const b = origData[idx + 2];
        if (isSkinPixel(r, g, b)) {
          continue;
        }
      }

      maskData[idx + 3] = 0;
      clearedCount++;
    }
  }

  maskCtx.putImageData(maskImgData, minX, minY);
  return clearedCount > 0;
}

/**
 * Tạo mặt nạ Alpha Mask (0: trong suốt / nền, 255: nhân vật giữ lại)
 */
export function generateSubjectMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: CutoutOptions = {}
): Uint8ClampedArray {
  const tolerance = options.tolerance ?? 40;
  const personProtection = options.personProtection ?? 85;
  const feather = options.feather ?? 2;

  const precomputed = precomputeSeparationMap(ctx, width, height);
  return computeMaskFromSliders(precomputed, tolerance, personProtection, feather);
}

/**
 * Hàm xóa phông thông minh chính (smartRemoveBackground)
 */
export async function smartRemoveBackground(
  imageSrc: string,
  tolerance: number = 40
): Promise<string> {
  // Prefer neural segmentation for the one-click action. The legacy canvas
  // path below remains available only as a compatibility fallback if the model
  // cannot be loaded on an older browser or offline session.
  if (typeof window !== "undefined") {
    try {
      const { loadCutoutImage, segmentSubject } = await import("@/lib/subjectCutout");
      const original = await loadCutoutImage(imageSrc);
      const cutout = await segmentSubject(original);
      const canvas = document.createElement("canvas");
      canvas.width = cutout.naturalWidth;
      canvas.height = cutout.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Segment output already contains alpha. Return it directly at the
        // inference resolution instead of applying a color heuristic.
        ctx.drawImage(cutout, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png");
      }
    } catch (neuralError) {
      console.warn("Neural background removal unavailable; using compatibility fallback:", neuralError);
    }
  }
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

        const mask = generateSubjectMask(ctx, width, height, {
          tolerance,
          feather: 2,
          protectSkin: true,
          protectCenter: true,
          personProtection: 85,
        });

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < mask.length; i++) {
          data[i * 4 + 3] = mask[i];
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
