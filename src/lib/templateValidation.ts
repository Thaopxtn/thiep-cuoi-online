import { WeddingCard } from "@/data/initialCards";
import { generateVietQrUrl } from "@/lib/vietQrBankCodes";
import { addUploadedImagesToLibrary } from "@/lib/mediaLibraryService";
import { getRealWeddingPhotoSlots } from "@/lib/decorativeLockService";

export interface AutoFillFormData {
  // 1. Chú rể
  groomName: string;
  groomPhone?: string;
  groomFather?: string;
  groomMother?: string;
  groomBank?: string;
  groomAccount?: string;
  groomAccountName?: string;

  // 2. Cô dâu
  brideName: string;
  bridePhone?: string;
  brideFather?: string;
  brideMother?: string;
  brideBank?: string;
  brideAccount?: string;
  brideAccountName?: string;

  // 3. Thời gian & Ngày cưới
  weddingDate: string; // YYYY-MM-DD
  weddingTime: string; // HH:mm
  lunarDate: string; // Ngày âm lịch

  // 4. Địa điểm tiệc cưới
  venueName: string;
  address: string;
  mapUrl?: string;

  // 5. Hình ảnh
  groomPhoto?: string;
  bridePhoto?: string;
  coverPhoto?: string;
  additionalPhotos?: string[];
  albumPhotos?: string[];
}

export interface ValidationWarning {
  id: string;
  title: string;
  description: string;
  type: "name" | "photo" | "date" | "venue" | "qr";
  severity: "high" | "medium";
}

// Danh sách các tên mẫu mặc định phổ biến của các template
const DEFAULT_SAMPLE_NAMES = [
  "đức mạnh",
  "thùy dung",
  "lệ quyên",
  "minh trí",
  "thu hà",
  "minh quân",
  "mai linh",
  "hồng phong",
  "chú rể",
  "cô dâu",
  "groom",
  "bride",
  "nguyễn đức mạnh",
  "trần lệ quyên",
  "trần thùy dung",
];

// Danh sách các tài khoản ngân hàng mặc định của mẫu
const DEFAULT_SAMPLE_ACCOUNTS = [
  "240220038888",
  "190365824988",
  "0000000000",
  "123456789",
];

// Danh sách địa chỉ mẫu
const DEFAULT_SAMPLE_VENUES = [
  "trống đồng palace",
  "72 quán sứ",
  "trung tâm tiệc cưới trống đồng palace",
  "khách sạn daewoo",
];

/**
 * Kiểm tra xem thiệp cưới đã hoàn thiện thông tin chưa trước khi xuất bản
 */
export function validateTemplateCompletion(
  nodes: Record<string, any>,
  card?: WeddingCard | null
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // 1. KIỂM TRA TÊN CÔ DÂU & CHÚ RỂ
  const currentGroomName = (card?.groom?.name || "").trim().toLowerCase();
  const currentBrideName = (card?.bride?.name || "").trim().toLowerCase();

  const isGroomSample =
    !currentGroomName || DEFAULT_SAMPLE_NAMES.some((n) => currentGroomName.includes(n));
  const isBrideSample =
    !currentBrideName || DEFAULT_SAMPLE_NAMES.some((n) => currentBrideName.includes(n));

  // Kiểm tra thêm trong các TextBox trên canvas
  let hasReplacedNamesOnCanvas = false;
  if (!isGroomSample && !isBrideSample && currentGroomName && currentBrideName) {
    hasReplacedNamesOnCanvas = true;
  }

  if (isGroomSample || isBrideSample || !hasReplacedNamesOnCanvas) {
    warnings.push({
      id: "warning-name",
      title: "Tên Cô Dâu & Chú Rể chưa được thay đổi",
      description: `Thiệp vẫn đang dùng tên mẫu mặc định ("${card?.groom?.name || "Đức Mạnh"}" & "${card?.bride?.name || "Thùy Dung"}"). Vui lòng điền tên chính thức của hai bạn.`,
      type: "name",
      severity: "high",
    });
  }

  // 2. KIỂM TRA ẢNH CƯỚI MẪU TRÊN THIỆP (chỉ kiểm tra khung ảnh cưới thực sự)
  const realWeddingPhotoSlots = getRealWeddingPhotoSlots(nodes);

  let defaultPhotoCount = 0;
  realWeddingPhotoSlots.forEach((slot) => {
    const key = (slot.props?.imgKey || slot.props?.src || "").trim();
    // Ảnh mẫu gốc thường nằm trong uploads/ hoặc có chữ watermarked / chưa qua upload cá nhân
    const isLocalUserUpload =
      key.startsWith("/uploads/") ||
      key.startsWith("blob:") ||
      key.startsWith("data:") ||
      key.includes("res.cloudinary.com") ||
      (key.startsWith("uploads/") && !key.includes("watermark") && !key.includes("ngoai-troi") && !key.includes("trong-nha"));

    if (!isLocalUserUpload) {
      defaultPhotoCount++;
    }
  });

  if (defaultPhotoCount > 0) {
    warnings.push({
      id: "warning-photo",
      title: `Vẫn còn ${defaultPhotoCount} ảnh cưới mẫu chưa thay`,
      description: `Còn ${defaultPhotoCount} khung ảnh trên thiệp đang sử dụng ảnh mẫu mặc định có watermark hoặc ảnh người mẫu hệ thống.`,
      type: "photo",
      severity: "high",
    });
  }

  // 3. KIỂM TRA NGÀY CƯỚI & THỜI GIAN
  const weddingDateStr = card?.weddingDate || "";
  if (!weddingDateStr) {
    warnings.push({
      id: "warning-date",
      title: "Chưa thiết lập ngày cưới",
      description: "Bạn chưa chọn ngày tổ chức hôn lễ trên thiệp cưới.",
      type: "date",
      severity: "high",
    });
  } else {
    // Kiểm tra xem ngày cưới có phải ngày trong quá khứ quá xa không
    try {
      const wDate = new Date(weddingDateStr);
      const now = new Date();
      // Nếu ngày cưới đã qua hơn 1 tháng
      if (wDate.getTime() < now.getTime() - 30 * 24 * 3600 * 1000) {
        warnings.push({
          id: "warning-date-past",
          title: "Ngày cưới có thể ở quá khứ",
          description: `Ngày cưới hiện tại là ${weddingDateStr}. Hãy kiểm tra xem bạn đã cập nhật ngày cưới chính xác chưa.`,
          type: "date",
          severity: "medium",
        });
      }
    } catch {
      // bỏ qua lỗi parse date
    }
  }

  // 4. KIỂM TRA ĐỊA ĐIỂM TIỆC CƯỚI
  const currentVenue = (card?.events?.[0]?.venue || "").toLowerCase();
  const currentAddress = (card?.events?.[0]?.address || "").toLowerCase();
  const isVenueSample =
    !currentVenue || DEFAULT_SAMPLE_VENUES.some((v) => currentVenue.includes(v) || currentAddress.includes(v));

  if (isVenueSample) {
    warnings.push({
      id: "warning-venue",
      title: "Địa điểm tiệc cưới là địa chỉ mẫu",
      description: `Địa chỉ hiện tại ("${card?.events?.[0]?.venue || "Trống Đồng Palace"}") có thể là địa chỉ mẫu mặc định. Hãy cập nhật nơi tổ chức tiệc cưới thực tế của bạn.`,
      type: "venue",
      severity: "medium",
    });
  }

  // 5. KIỂM TRA MÃ QR & TÀI KHOẢN MỪNG CƯỚI (NẾU CÓ WIDGET GIFTQRBOX)
  const giftQrNodes = Object.values(nodes).filter(
    (n: any) => n.type?.resolvedName === "GiftQrBox"
  );
  if (giftQrNodes.length > 0) {
    let isQrSample = false;
    giftQrNodes.forEach((n: any) => {
      const acc = (n.props?.accountNumber || card?.groom?.accountNumber || "").trim();
      if (!acc || DEFAULT_SAMPLE_ACCOUNTS.includes(acc)) {
        isQrSample = true;
      }
    });

    if (isQrSample) {
      warnings.push({
        id: "warning-qr",
        title: "Tài khoản nhận mừng cưới (QR) là tài khoản mẫu",
        description: "Thiệp có tiện ích Mừng cưới VietQR nhưng số tài khoản ngân hàng chưa được thay bằng số tài khoản của bạn.",
        type: "qr",
        severity: "high",
      });
    }
  }

  return warnings;
}

/**
 * Thuật toán thông minh tự động thay thế toàn bộ thông tin và ảnh vào nodes trên canvas
 */
export function applyAutoFillToNodes(
  currentNodes: Record<string, any>,
  currentCard: WeddingCard | null,
  formData: AutoFillFormData
): {
  updatedNodes: Record<string, any>;
  updatedCard: Partial<WeddingCard>;
  stats: {
    textCount: number;
    photoCount: number;
    widgetCount: number;
  };
} {
  const updatedNodes = { ...currentNodes };
  let textCount = 0;
  let photoCount = 0;
  let widgetCount = 0;

  // Chuẩn bị dữ liệu thay thế
  const groomName = formData.groomName.trim();
  const brideName = formData.brideName.trim();
  const oldGroomName = (currentCard?.groom?.name || "Đức Mạnh").trim();
  const oldBrideName = (currentCard?.bride?.name || "Thùy Dung").trim();

  // Tách ngày dương lịch
  let day = "18";
  let month = "11";
  let year = "2026";
  if (formData.weddingDate) {
    const parts = formData.weddingDate.split("-");
    if (parts.length === 3) {
      year = parts[0];
      month = parts[1];
      day = parts[2];
    }
  }
  const formattedDateSlash = `${day}/${month}/${year}`;
  const formattedDateDot = `${day} . ${month} . ${year}`;
  const weddingTime = formData.weddingTime || "11:00";

  // Thu thập tất cả ảnh tải lên để lưu vào thư viện
  const uploadedUrlsToSave: string[] = [];
  if (formData.coverPhoto) uploadedUrlsToSave.push(formData.coverPhoto);
  if (formData.groomPhoto) uploadedUrlsToSave.push(formData.groomPhoto);
  if (formData.bridePhoto) uploadedUrlsToSave.push(formData.bridePhoto);
  if (formData.additionalPhotos) uploadedUrlsToSave.push(...formData.additionalPhotos);
  if (formData.albumPhotos) uploadedUrlsToSave.push(...formData.albumPhotos);
  if (uploadedUrlsToSave.length > 0) {
    addUploadedImagesToLibrary(uploadedUrlsToSave);
  }

  // 1. QUÉT VÀ THAY THẾ TEXTBOX
  Object.entries(updatedNodes).forEach(([id, node]: [string, any]) => {
    if (node.type?.resolvedName === "TextBox" && node.props?.text) {
      let text = String(node.props.text);
      let changed = false;

      // a. Thay thế cặp tên: A & B hoặc A và B
      if (groomName && brideName) {
        // Cặp tên hoa
        const upperCouple = `${groomName.toUpperCase()} & ${brideName.toUpperCase()}`;
        const normalCouple = `${groomName} & ${brideName}`;

        if (
          text.includes(oldGroomName) &&
          text.includes(oldBrideName)
        ) {
          text = text
            .replace(new RegExp(oldGroomName, "gi"), groomName)
            .replace(new RegExp(oldBrideName, "gi"), brideName);
          changed = true;
        } else if (
          text.includes("ĐỨC MẠNH & THÙY DUNG") ||
          text.includes("ĐỨC MẠNH & LỆ QUYÊN") ||
          text.includes("MINH TRÍ & THU HÀ")
        ) {
          text = upperCouple;
          changed = true;
        } else if (
          text.includes("Đức Mạnh & Thùy Dung") ||
          text.includes("Đức Mạnh & Lệ Quyên") ||
          text.includes("Minh Trí & Thu Hà")
        ) {
          text = normalCouple;
          changed = true;
        }
      }

      // b. Thay thế tên Chú rể đứng riêng
      if (groomName) {
        if (text.trim().toUpperCase() === oldGroomName.toUpperCase() || text.trim() === "ĐỨC MẠNH") {
          text = groomName.toUpperCase();
          changed = true;
        } else if (text.trim() === oldGroomName || text.trim() === "Đức Mạnh") {
          text = groomName;
          changed = true;
        } else if (text.includes(oldGroomName)) {
          text = text.replace(new RegExp(oldGroomName, "g"), groomName);
          changed = true;
        }
      }

      // c. Thay thế tên Cô dâu đứng riêng
      if (brideName) {
        if (text.trim().toUpperCase() === oldBrideName.toUpperCase() || text.trim() === "THÙY DUNG") {
          text = brideName.toUpperCase();
          changed = true;
        } else if (text.trim() === oldBrideName || text.trim() === "Thùy Dung") {
          text = brideName;
          changed = true;
        } else if (text.includes(oldBrideName)) {
          text = text.replace(new RegExp(oldBrideName, "g"), brideName);
          changed = true;
        }
      }

      // d. Thay thế ngày giờ tổ chức
      if (formData.weddingDate) {
        // Thay format dd/mm/yyyy
        if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(text)) {
          text = text.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, formattedDateSlash);
          changed = true;
        }
        // Thay format dd . mm . yyyy
        if (/\d{1,2}\s*\.\s*\d{1,2}\s*\.\s*\d{4}/.test(text)) {
          text = text.replace(/\d{1,2}\s*\.\s*\d{1,2}\s*\.\s*\d{4}/g, formattedDateDot);
          changed = true;
        }
        // Thay chữ năm 2026 hoặc 2025
        if (/năm\s*202[0-9]/i.test(text)) {
          text = text.replace(/năm\s*202[0-9]/gi, `năm ${year}`);
          changed = true;
        }
        // Thay Tháng 11 / Tháng 12
        if (/Tháng\s*\d{1,2}/i.test(text)) {
          text = text.replace(/Tháng\s*\d{1,2}/gi, `Tháng ${parseInt(month)}`);
          changed = true;
        }
        // Thay số ngày riêng lẻ dạng chữ lớn (VD: "18" hoặc "29")
        if (text.trim() === "18" || text.trim() === "29" || text.trim() === "20") {
          text = String(parseInt(day));
          changed = true;
        }
      }

      // Giờ cưới (VD: 11:00 hoặc 16:30)
      if (weddingTime) {
        if (/\d{1,2}:\d{2}/.test(text)) {
          text = text.replace(/\d{1,2}:\d{2}/g, weddingTime);
          changed = true;
        }
      }

      // Ngày âm lịch
      if (formData.lunarDate && text.includes("ngày") && text.includes("năm Bính Ngọ")) {
        text = formData.lunarDate;
        changed = true;
      }

      // e. Thay thế địa điểm tiệc cưới
      if (formData.venueName) {
        if (
          text.includes("Trống Đồng Palace") ||
          text.includes("Trung tâm Tiệc cưới") ||
          text.includes("Nhà Hàng Tiệc Cưới")
        ) {
          text = formData.venueName;
          changed = true;
        }
      }
      if (formData.address) {
        if (
          text.includes("72 Quán Sứ") ||
          text.includes("Hoàn Kiếm, Hà Nội")
        ) {
          text = formData.address;
          changed = true;
        }
      }

      // f. Thay thế bố mẹ nếu có
      if (formData.groomFather && text.includes("Nguyễn Văn Hùng")) {
        text = text.replace(/Nguyễn Văn Hùng/g, formData.groomFather);
        changed = true;
      }
      if (formData.groomMother && text.includes("Trần Thị Lan")) {
        text = text.replace(/Trần Thị Lan/g, formData.groomMother);
        changed = true;
      }
      if (formData.brideFather && text.includes("Lê Văn Thành")) {
        text = text.replace(/Lê Văn Thành/g, formData.brideFather);
        changed = true;
      }
      if (formData.brideMother && text.includes("Vũ Thị Mai")) {
        text = text.replace(/Vũ Thị Mai/g, formData.brideMother);
        changed = true;
      }

      if (changed) {
        updatedNodes[id] = {
          ...node,
          props: { ...node.props, text },
        };
        textCount++;
      }
    }
  });

  // 2. CẬP NHẬT CÁC WIDGET THÔNG MINH
  // a. VietQR Mừng cưới
  const groomBank = formData.groomBank || currentCard?.groom?.bankName || "MB BANK";
  const groomAcc = (formData.groomAccount || currentCard?.groom?.accountNumber || "").replace(/[^0-9]/g, "");
  const groomAccName = formData.groomAccountName || formData.groomName || currentCard?.groom?.accountName || "CHU RE";

  let realQrUrl = "";
  if (groomAcc) {
    realQrUrl = generateVietQrUrl(
      groomBank,
      groomAcc,
      groomAccName,
      undefined,
      `Mung cuoi ${groomName || "hai ban"}`
    );
  }

  Object.entries(updatedNodes).forEach(([id, node]: [string, any]) => {
    const type = node.type?.resolvedName;

    // CalendarBoxV2
    if (type === "CalendarBoxV2") {
      updatedNodes[id] = {
        ...node,
        props: {
          ...node.props,
          day: parseInt(day),
          month: parseInt(month),
          year: parseInt(year),
        },
      };
      widgetCount++;
    }

    // CountdownBoxV2
    if (type === "CountdownBoxV2") {
      updatedNodes[id] = {
        ...node,
        props: {
          ...node.props,
          targetDate: `${formData.weddingDate || "2026-11-18"}T${weddingTime}:00`,
        },
      };
      widgetCount++;
    }

    // MapBox
    if (type === "MapBox") {
      updatedNodes[id] = {
        ...node,
        props: {
          ...node.props,
          venueName: formData.venueName || node.props?.venueName || "Trung tâm Tiệc cưới",
          address: formData.address || node.props?.address || "Hà Nội",
          mapUrl: formData.mapUrl || node.props?.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(formData.address || formData.venueName || "")}`,
        },
      };
      widgetCount++;
    }

    // GiftQrBox
    if (type === "GiftQrBox" && realQrUrl) {
      updatedNodes[id] = {
        ...node,
        props: {
          ...node.props,
          imgKey: realQrUrl,
          bankName: groomBank,
          accountNumber: groomAcc,
          accountName: groomAccName,
        },
      };
      widgetCount++;
    }

    // CarouselBox
    if (type === "CarouselBox" && formData.albumPhotos && formData.albumPhotos.length > 0) {
      const newList = formData.albumPhotos.map((url, idx) => ({
        imageKey: url,
        src: url,
        caption: `Khoảnh khắc cưới ${idx + 1}`,
      }));
      updatedNodes[id] = {
        ...node,
        props: {
          ...node.props,
          imgList: newList,
        },
      };
      widgetCount++;
    }
  });

  // 3. TỰ ĐỘNG GÁN ẢNH CƯỚI VÀO CÁC PHOTOBOX TRÊN THIỆP
  // Thu thập danh sách ảnh người dùng đã cung cấp theo thứ tự ưu tiên
  const userPhotoPool: string[] = [];
  if (formData.coverPhoto) userPhotoPool.push(formData.coverPhoto);
  if (formData.groomPhoto) userPhotoPool.push(formData.groomPhoto);
  if (formData.bridePhoto) userPhotoPool.push(formData.bridePhoto);
  if (formData.additionalPhotos && formData.additionalPhotos.length > 0) {
    userPhotoPool.push(...formData.additionalPhotos);
  }

  if (userPhotoPool.length > 0) {
    // Chỉ lấy các khung ảnh cưới thực sự (loại trừ 100% phong bì, nắp phong bì, hoa và họa tiết trang trí)
    const realPhotoSlots = getRealWeddingPhotoSlots(updatedNodes);

    let poolIdx = 0;
    realPhotoSlots.forEach((slot) => {
      if (poolIdx < userPhotoPool.length) {
        const newImgUrl = userPhotoPool[poolIdx];
        const id = slot.id;
        const node = updatedNodes[id];
        if (node) {
          updatedNodes[id] = {
            ...node,
            props: {
              ...node.props,
              imgKey: newImgUrl,
              src: newImgUrl,
            },
          };
          photoCount++;
          poolIdx++;
        }
      }
    });
  }

  // 4. CHUẨN BỊ THÔNG TIN CARD CẬP NHẬT
  const updatedCard: Partial<WeddingCard> = {
    weddingDate: formData.weddingDate || currentCard?.weddingDate || "2026-11-18",
    weddingTime: formData.weddingTime || currentCard?.weddingTime || "11:00",
    lunarDate: formData.lunarDate || currentCard?.lunarDate || "",
    groom: {
      ...(currentCard?.groom || { title: "Chú Rể", phone: "" }),
      name: groomName || currentCard?.groom?.name || "Đức Mạnh",
      phone: formData.groomPhone || currentCard?.groom?.phone || "",
      parents:
        formData.groomFather && formData.groomMother
          ? `Ông ${formData.groomFather} & Bà ${formData.groomMother}`
          : currentCard?.groom?.parents || "",
      bankName: groomBank,
      accountNumber: groomAcc,
      accountName: groomAccName,
      qrCode: realQrUrl || currentCard?.groom?.qrCode || "",
    },
    bride: {
      ...(currentCard?.bride || { title: "Cô Dâu", phone: "" }),
      name: brideName || currentCard?.bride?.name || "Thùy Dung",
      phone: formData.bridePhone || currentCard?.bride?.phone || "",
      parents:
        formData.brideFather && formData.brideMother
          ? `Ông ${formData.brideFather} & Bà ${formData.brideMother}`
          : currentCard?.bride?.parents || "",
      bankName: formData.brideBank || currentCard?.bride?.bankName || "TECHCOMBANK",
      accountNumber: (formData.brideAccount || currentCard?.bride?.accountNumber || "").replace(/[^0-9]/g, ""),
      accountName: formData.brideAccountName || brideName || currentCard?.bride?.accountName || "CO DAU",
    },
    events: [
      {
        id: "evt-main",
        title: "Lễ Thành Hôn",
        time: `${weddingTime} • ${formattedDateSlash}`,
        venue: formData.venueName || currentCard?.events?.[0]?.venue || "Trung tâm Tiệc cưới",
        address: formData.address || currentCard?.events?.[0]?.address || "Hà Nội",
        mapUrl: formData.mapUrl || currentCard?.events?.[0]?.mapUrl || "",
      },
    ],
  };

  if (formData.coverPhoto) {
    updatedCard.coverImage = formData.coverPhoto;
  }
  if (formData.albumPhotos && formData.albumPhotos.length > 0) {
    updatedCard.album = formData.albumPhotos;
  }

  return {
    updatedNodes,
    updatedCard,
    stats: {
      textCount,
      photoCount,
      widgetCount,
    },
  };
}
