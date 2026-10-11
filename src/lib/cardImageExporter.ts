/**
 * Tiện ích kết xuất ảnh thiệp cưới chất lượng cao (HD PNG)
 * Dùng để gửi trực tiếp qua Zalo, Messenger, Facebook Story hoặc in ấn
 */

import { WeddingCard } from "@/data/initialCards";
import { getSafeImageUrl } from "@/lib/imageUtils";

export interface CardExportOptions {
  mode?: "story" | "portrait"; // story: 1080x1920 (9:16 Zalo), portrait: 1200x1600 (3:4 in thiệp)
  scale?: number; // 1 hoặc 2 (Ultra HD)
  filename?: string;
}

/**
 * Tải ảnh an toàn không làm crash canvas khi dính CORS
 */
function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Thử lại không có crossOrigin nếu server không hỗ trợ CORS
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => resolve(null);
      fallbackImg.src = src;
    };
    img.src = src;
  });
}

/**
 * Vẽ thiệp cưới sang trọng lên HTML5 Canvas ở độ phân giải cao
 */
export async function renderWeddingCardToCanvas(
  card: WeddingCard,
  options: CardExportOptions = {}
): Promise<HTMLCanvasElement> {
  if (typeof document === "undefined") {
    throw new Error("renderWeddingCardToCanvas chỉ chạy trên trình duyệt");
  }

  const { mode = "story" } = options;

  const width = mode === "story" ? 1080 : 1200;
  const height = mode === "story" ? 1920 : 1600;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không thể khởi tạo 2D context cho Canvas");

  // 1. NỀN THIỆP: Màu kem hoàng gia & họa tiết tinh tế
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, "#FBF9F5");
  bgGrad.addColorStop(0.5, "#F7F3EC");
  bgGrad.addColorStop(1, "#EFE8DC");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Thử vẽ ảnh nền texture nếu có
  const bgImgSrc = card.nodes?.ROOT?.props?.backgroundImage;
  if (bgImgSrc) {
    const bgImg = await loadImageSafe(getSafeImageUrl(bgImgSrc));
    if (bgImg) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.drawImage(bgImg, 0, 0, width, height);
      ctx.restore();
    }
  }

  // 2. KHUNG VIỀN KIM LOẠI VÀNG VÀ HỌA TIẾT GÓC (Gold Luxury Borders)
  const margin = mode === "story" ? 48 : 56;
  const innerMargin = margin + 14;

  // Viền ngoài thanh mảnh
  ctx.strokeStyle = "#C5A880";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  // Viền trong đôi
  ctx.strokeStyle = "rgba(197, 168, 128, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(innerMargin, innerMargin, width - innerMargin * 2, height - innerMargin * 2);

  // Góc hoa văn trang trí hình vương miện / kim cương vàng
  const drawCornerDiamond = (x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#A88454";
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  drawCornerDiamond(innerMargin, innerMargin);
  drawCornerDiamond(width - innerMargin, innerMargin);
  drawCornerDiamond(innerMargin, height - innerMargin);
  drawCornerDiamond(width - innerMargin, height - innerMargin);

  // 3. TIÊU ĐỀ: "SAVE THE DATE" HOẶC "THIỆP CƯỚI"
  ctx.textAlign = "center";
  ctx.fillStyle = "#9A2A38"; // Đỏ rượu vang hoàng gia
  ctx.font = "italic 600 32px 'Playfair Display', Georgia, serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("SAVE OUR SPECIAL DATE", width / 2, margin + 90);

  ctx.fillStyle = "#8C7B67";
  ctx.font = "300 22px 'Montserrat', sans-serif";
  ctx.letterSpacing = "8px";
  ctx.fillText("TRÂN TRỌNG BÁO TIN HÔN LỄ", width / 2, margin + 140);

  // Dấu phân cách vàng óng
  ctx.strokeStyle = "#C5A880";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 120, margin + 170);
  ctx.lineTo(width / 2 + 120, margin + 170);
  ctx.stroke();

  // 4. ẢNH CẶP ĐÔI TRUNG TÂM HOẶC BIỂU TƯỢNG HÔN PHỐI
  const photoY = margin + 200;
  const photoW = mode === "story" ? 680 : 760;
  const photoH = mode === "story" ? 640 : 540;
  const photoX = (width - photoW) / 2;

  let photoDrawn = false;
  const coverUrl = card.coverImage ? getSafeImageUrl(card.coverImage) : null;
  if (coverUrl) {
    const coupleImg = await loadImageSafe(coverUrl);
    if (coupleImg) {
      ctx.save();
      // Khung bo tròn với viền vàng
      ctx.beginPath();
      const radius = 24;
      ctx.roundRect(photoX, photoY, photoW, photoH, radius);
      ctx.clip();

      // Vẽ ảnh giữ tỷ lệ phủ kín (cover)
      const imgRatio = coupleImg.width / coupleImg.height;
      const targetRatio = photoW / photoH;
      let sWidth = coupleImg.width;
      let sHeight = coupleImg.height;
      let sx = 0;
      let sy = 0;

      if (imgRatio > targetRatio) {
        sWidth = coupleImg.height * targetRatio;
        sx = (coupleImg.width - sWidth) / 2;
      } else {
        sHeight = coupleImg.width / targetRatio;
        sy = (coupleImg.height - sHeight) / 2;
      }

      ctx.drawImage(coupleImg, sx, sy, sWidth, sHeight, photoX, photoY, photoW, photoH);
      ctx.restore();

      // Viền vàng ngoài ảnh
      ctx.save();
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, radius);
      ctx.stroke();
      ctx.restore();

      photoDrawn = true;
    }
  }

  // Nếu không tải được ảnh cặp đôi thì vẽ Huy Hiệu Trái Tim & Nhẫn Cưới Tinh Xảo
  if (!photoDrawn) {
    ctx.save();
    ctx.fillStyle = "rgba(154, 42, 56, 0.05)";
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 24);
    ctx.fill();
    ctx.strokeStyle = "#C5A880";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Biểu tượng trái tim đôi
    ctx.fillStyle = "#9A2A38";
    ctx.font = "80px serif";
    ctx.fillText("❦", width / 2, photoY + photoH / 2 - 20);
    ctx.font = "italic 26px 'Playfair Display', serif";
    ctx.fillStyle = "#8C7B67";
    ctx.fillText("Together Forever", width / 2, photoY + photoH / 2 + 50);
    ctx.restore();
  }

  // 5. TÊN CÔ DÂU VÀ CHÚ RỂ (NỔI BẬT NHẤT)
  const groomName = card.groom?.name || "Chú Rể";
  const brideName = card.bride?.name || "Cô Dâu";

  const namesY = photoY + photoH + 80;

  ctx.fillStyle = "#5A141E"; // Đỏ đô quý tộc
  ctx.font = "bold 64px 'Playfair Display', 'Times New Roman', serif";
  ctx.fillText(groomName, width / 2, namesY);

  ctx.fillStyle = "#C5A880"; // Ký tự & màu vàng
  ctx.font = "italic 48px 'Playfair Display', serif";
  ctx.fillText("&", width / 2, namesY + 54);

  ctx.fillStyle = "#5A141E";
  ctx.font = "bold 64px 'Playfair Display', 'Times New Roman', serif";
  ctx.fillText(brideName, width / 2, namesY + 120);

  // 6. THỜI GIAN & ĐỊA ĐIỂM TỔ CHỨC
  const detailsY = namesY + 185;

  // Dòng kẻ mảnh
  ctx.strokeStyle = "rgba(197, 168, 128, 0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 180, detailsY);
  ctx.lineTo(width / 2 + 180, detailsY);
  ctx.stroke();

  // Ngày giờ
  const weddingDateStr = card.weddingDate || "2026-11-20";
  const timeStr = card.weddingTime || "11:00";
  const [y, m, d] = weddingDateStr.split("-");
  const formattedDate = d && m && y ? `${d}.${m}.${y}` : weddingDateStr;

  ctx.fillStyle = "#9A2A38";
  ctx.font = "600 36px 'Playfair Display', serif";
  ctx.letterSpacing = "3px";
  ctx.fillText(`${timeStr}  •  ${formattedDate}`, width / 2, detailsY + 50);

  if (card.lunarDate) {
    ctx.fillStyle = "#7D7060";
    ctx.font = "italic 22px 'Playfair Display', serif";
    ctx.letterSpacing = "1px";
    ctx.fillText(`(${card.lunarDate})`, width / 2, detailsY + 88);
  }

  // Địa điểm tiệc
  const firstEvent = card.events && card.events[0];
  const venue = firstEvent?.venue || "Trung tâm Tiệc cưới Trống Đồng Palace";
  const address = firstEvent?.address || "Số 72 Quán Sứ, Hoàn Kiếm, Hà Nội";

  ctx.fillStyle = "#2D2622";
  ctx.font = "bold 26px 'Montserrat', sans-serif";
  ctx.fillText(venue, width / 2, detailsY + 140);

  ctx.fillStyle = "#6B6056";
  ctx.font = "400 20px 'Montserrat', sans-serif";
  ctx.fillText(address, width / 2, detailsY + 175);

  // 7. FOOTER: MÃ QR XEM THIỆP TRỰC TUYẾN HOẶC LỜI CHÚC
  const footerY = height - margin - 110;
  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://thiep-cuoi-online.vercel.app";
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `${currentOrigin}/show/${card.slug || card.id}`
  )}`;

  const qrImg = await loadImageSafe(qrDataUrl);
  if (qrImg) {
    const qrSize = 110;
    const qrX = width / 2 - qrSize / 2;
    const qrY = footerY - 50;

    // Nền trắng cho QR
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);
    ctx.strokeStyle = "#C5A880";
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    ctx.fillStyle = "#8C7B67";
    ctx.font = "500 15px 'Montserrat', sans-serif";
    ctx.fillText("Quét mã QR để mở thiệp trực tuyến & gửi lời chúc", width / 2, qrY + qrSize + 24);
  }

  // Chữ ký thương hiệu ZenLove tinh tế
  ctx.fillStyle = "#B3A28F";
  ctx.font = "italic 13px 'Playfair Display', serif";
  ctx.fillText("ZenLove • Nền tảng thiệp cưới trực tuyến trang trọng", width / 2, height - margin - 15);

  return canvas;
}

/**
 * Tải ảnh thiệp cưới về máy tính / điện thoại dạng PNG HD
 */
export async function downloadCardImageAsPng(
  card: WeddingCard,
  options: CardExportOptions = {}
): Promise<string> {
  const canvas = await renderWeddingCardToCanvas(card, options);
  const dataUrl = canvas.toDataURL("image/png");

  const groomName = card.groom?.name?.replace(/\s+/g, "-") || "chu-re";
  const brideName = card.bride?.name?.replace(/\s+/g, "-") || "co-dau";
  const defaultFilename = `thiep-cuoi-${groomName}-${brideName}-${options.mode || "story"}.png`;
  const filename = options.filename || defaultFilename;

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}
