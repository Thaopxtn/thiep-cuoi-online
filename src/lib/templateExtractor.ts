/**
 * Trích xuất và chuẩn hóa thông tin thiệp cưới từ cây Canvas nodes và metadata template
 * Đảm bảo các mẫu khi clone hoặc mở thiết kế hiển thị chuẩn xác nội dung nguyên bản của mẫu đó,
 * thay vì các giá trị mặc định cố định.
 */

export interface ExtractedWeddingDetails {
  groomName: string;
  brideName: string;
  weddingDate: string; // YYYY-MM-DD
  weddingTime: string; // HH:mm
  lunarDate: string;
  venueName: string;
  venueAddress: string;
  coverImage: string;
  album: string[];
  musicTitle: string;
  musicUrl: string;
  parentsGroom?: string;
  parentsBride?: string;
  story?: string;
}

/**
 * Chuyển đổi chuỗi thành Title Case chuẩn tiếng Việt (vd: "tiến đạt" -> "Tiến Đạt")
 */
export function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Phân tích cây nodes và metadata để lấy chính xác thông tin nội dung của mẫu
 */
export function extractWeddingDetailsFromTemplate(
  nodes?: Record<string, any>,
  meta?: any
): ExtractedWeddingDetails {
  let groomName = "";
  let brideName = "";
  let weddingDate = "2026-11-18";
  let weddingTime = "11:00";
  let lunarDate = "Ngày 10 tháng 10 năm Bính Ngọ";
  let venueName = "Tư gia gia đình";
  let venueAddress = "";
  let parentsGroom = "";
  let parentsBride = "";
  let story = "";

  const coverImage =
    meta?.imageUrl ||
    "https://cdn-resource.zenlove.me/uploads/862861ad-96f7-4738-b17f-56ad4f5c1e28/QkFhLVRoQW4tVGlhbl8xNzg5OTE0NzgyOTM4X3hodWtzYWpiZzE.jpg";

  let musicTitle =
    meta?.musicName || meta?.audioSettings?.musicTitle || "Beautiful In White";
  let musicUrl =
    meta?.musicUrl ||
    meta?.audioSettings?.fileUrl ||
    "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3";

  // 1. Trường hợp mẫu dạng FORM có trường basicInfo
  if (nodes?.basicInfo) {
    const b = nodes.basicInfo;
    if (b.groomFullName || b.groomShortName) {
      groomName = toTitleCase(b.groomFullName || b.groomShortName);
    }
    if (b.brideFullName || b.brideShortName) {
      brideName = toTitleCase(b.brideFullName || b.brideShortName);
    }
    if (b.weddingDate) {
      const match = String(b.weddingDate).match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
      if (match) {
        weddingDate = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
      } else {
        const matchVn = String(b.weddingDate).match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/);
        if (matchVn) {
          weddingDate = `${matchVn[3]}-${matchVn[2].padStart(2, "0")}-${matchVn[1].padStart(2, "0")}`;
        }
      }
    }
    if (b.weddingTime) weddingTime = String(b.weddingTime);
    if (b.lunarDate) lunarDate = String(b.lunarDate);
    if (b.restaurantName) venueName = String(b.restaurantName);
    if (b.restaurantAddress) venueAddress = String(b.restaurantAddress);
    if (b.groomFatherName || b.groomMotherName) {
      parentsGroom = `Ông ${b.groomFatherName || ""} & Bà ${b.groomMotherName || ""}`.trim();
    }
    if (b.brideFatherName || b.brideMotherName) {
      parentsBride = `Ông ${b.brideFatherName || ""} & Bà ${b.brideMotherName || ""}`.trim();
    }

    // Đọc trường ngày cưới từ nodes.weddingDate
    if (nodes.weddingDate && typeof nodes.weddingDate === "object") {
      const wd = nodes.weddingDate;
      if (wd.date) {
        const d = new Date(wd.date);
        if (!isNaN(d.getTime())) {
          weddingDate = d.toISOString().split("T")[0];
        }
      }
      if (wd.hour !== undefined && wd.minute !== undefined) {
        weddingTime = `${String(wd.hour).padStart(2, "0")}:${String(wd.minute).padStart(2, "0")}`;
      }
    }

    // Đọc trường địa điểm từ nodes.weddingLocation
    if (nodes.weddingLocation?.locations?.[0]) {
      const loc = nodes.weddingLocation.locations[0];
      if (loc.displayAddress || loc.roadAddress || loc.address) {
        venueAddress = loc.displayAddress || loc.roadAddress || loc.address;
      }
      if (loc.title) {
        venueName = loc.title;
      }
    }

    // Đọc lời ngỏ từ nodes.introMent
    if (nodes.introMent?.description) {
      story = nodes.introMent.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
  }

  // 2. Phân tích các TextBox Craft.js Canvas
  const textBoxes = Object.values(nodes || {})
    .filter(
      (n: any) =>
        n?.type?.resolvedName === "TextBox" && typeof n.props?.text === "string"
    )
    .map((n: any) => ({
      text: n.props.text
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .trim(),
      top: Number(n.props.top) || 0,
    }))
    .sort((a, b) => a.top - b.top);

  // 2.1. Tìm tên Chú rể và Cô dâu
  if (!groomName || !brideName) {
    for (const tb of textBoxes) {
      const clean = tb.text;
      const lower = clean.toLowerCase();

      // Bỏ qua các dòng tiêu đề hoặc lời cảm ơn
      if (
        lower.includes("lời cảm ơn") ||
        lower.includes("ông") ||
        lower.includes("bà") ||
        lower.includes("save the date") ||
        lower.includes("trân trọng") ||
        clean.length > 55
      ) {
        continue;
      }

      if (clean.includes("&") || clean.includes(" và ") || clean.includes(" ♥ ")) {
        const parts = clean.split(/&|\bvà\b|♥/);
        const p0 = parts[0]?.trim();
        const p1 = parts[1]?.trim();
        if (
          p0 &&
          p1 &&
          p0.length >= 2 &&
          p1.length >= 2 &&
          p0.length <= 25 &&
          p1.length <= 25 &&
          !p0.toLowerCase().includes("tháng") &&
          !p1.toLowerCase().includes("tháng")
        ) {
          groomName = toTitleCase(p0);
          brideName = toTitleCase(p1);
          break;
        }
      }
    }
  }

  // 2.2. Tìm ngày tháng năm tổ chức
  for (const tb of textBoxes) {
    // DD.MM.YYYY hoặc DD/MM/YYYY
    const dMatch = tb.text.match(/\b(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})\b/);
    if (dMatch) {
      const y = dMatch[3];
      const m = dMatch[2].padStart(2, "0");
      const d = dMatch[1].padStart(2, "0");
      if (Number(y) >= 2024 && Number(y) <= 2040) {
        weddingDate = `${y}-${m}-${d}`;
        break;
      }
    }
  }

  // 2.3. Tìm giờ tổ chức
  for (const tb of textBoxes) {
    const tMatch = tb.text.match(/\b([012]?\d:[0-5]\d)\b/);
    if (tMatch) {
      weddingTime = tMatch[1];
      break;
    }
  }

  // 2.4. Tìm ngày âm lịch
  for (const tb of textBoxes) {
    if (
      tb.text.includes("Âm lịch") ||
      tb.text.includes("âm lịch") ||
      tb.text.includes("Tức ngày") ||
      tb.text.includes("Bính Ngọ") ||
      tb.text.includes("Giáp Thìn") ||
      tb.text.includes("Ất Tỵ")
    ) {
      lunarDate = tb.text.replace(/[()]/g, "").trim();
      break;
    }
  }

  // 2.5. Tìm địa chỉ nơi tổ chức
  for (const tb of textBoxes) {
    const txt = tb.text;
    if (
      (txt.includes("Đường") ||
        txt.includes("Phố") ||
        txt.includes("Quận") ||
        txt.includes("Phường") ||
        txt.includes("TP") ||
        txt.includes("Hà Nội") ||
        txt.includes("Hồ Chí Minh") ||
        txt.includes("Bến Thành")) &&
      txt.length > 10 &&
      txt.length < 120
    ) {
      venueAddress = txt;
      break;
    }
  }

  // 2.6. Tìm phụ mẫu hai bên
  for (const tb of textBoxes) {
    if (
      (tb.text.includes("Ông.") || tb.text.includes("Bà.") || tb.text.includes("Ông ")) &&
      tb.text.length < 80
    ) {
      if (!parentsGroom) {
        parentsGroom = tb.text;
      } else if (!parentsBride && tb.text !== parentsGroom) {
        parentsBride = tb.text;
      }
    }
  }

  // 2.7. Tìm lời ngỏ / câu chuyện tình yêu
  for (const tb of textBoxes) {
    if (
      (tb.text.toLowerCase().includes("tình yêu") ||
        tb.text.toLowerCase().includes("hạnh phúc") ||
        tb.text.toLowerCase().includes("hẹn nhau")) &&
      tb.text.length > 30 &&
      tb.text.length < 250
    ) {
      story = tb.text;
      break;
    }
  }

  // 3. Gom danh sách album ảnh: Chỉ chọn ảnh đại diện hoặc các khung ảnh cưới thực sự (isReplaceable: true)
  const photoUrls: string[] = [];
  if (coverImage) photoUrls.push(coverImage);

  Object.values(nodes || {}).forEach((n: any) => {
    if (n?.type?.resolvedName === "PhotoBox" && n.props?.imgKey) {
      // Chỉ lấy ảnh cưới thực sự (có cờ isReplaceable hoặc previewKey hoặc kích thước lớn và không phải sticker)
      const isRealPhoto = Boolean(n.props.isReplaceable || n.props.previewKey);
      if (isRealPhoto) {
        const key = String(n.props.imgKey).trim();
        const url = key.startsWith("http")
          ? key
          : `https://cdn-resource.zenlove.me/${key.replace(/^\//, "")}`;
        if (!photoUrls.includes(url)) {
          photoUrls.push(url);
        }
      }
    }
  });

  // Fallback an toàn nếu template không tìm thấy tên
  if (!groomName) groomName = meta?.name ? `Dâu Rể ${meta.name}` : "Tiến Đạt";
  if (!brideName) brideName = meta?.name ? `Mẫu ${meta.name}` : "Ngọc Nhi";

  return {
    groomName,
    brideName,
    weddingDate,
    weddingTime,
    lunarDate,
    venueName: venueName || "Tư gia Nhà Trai",
    venueAddress:
      venueAddress ||
      "125 Đường Nguyễn Thị Minh Khai, P. Bến Thành, TP Hồ Chí Minh",
    coverImage,
    album: photoUrls,
    musicTitle,
    musicUrl,
    parentsGroom: parentsGroom || "Ông Ngô Văn Đức & Bà Nguyễn Thị Nhài",
    parentsBride: parentsBride || "Ông Lê Văn Thành & Bà Vũ Thị Mai",
    story:
      story ||
      "Nhân danh tình yêu, hãy cùng đi hết quãng đời còn lại. Từ nay trở đi, đông có nắng ấm, còn mình có nhau!",
  };
}
