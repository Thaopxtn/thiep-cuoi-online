/**
 * Chuyển đổi dữ liệu template dạng FORM (26 keys của ZenLove) sang cây Canvas Craft.js Nodes
 * Đảm bảo ĐẦY ĐỦ 100% tất cả các section từ trên xuống dưới:
 * - Màn hình chính & Ảnh bìa Hero
 * - Thông tin hai họ & Lời ngỏ
 * - Chương trình hôn lễ (Lễ Vu Quy & Lễ Thành Hôn)
 * - Đồng hồ đếm ngược & Lịch ngày cưới
 * - Lịch trình ngày cưới (Timeline chi tiết các mốc giờ)
 * - Quy định trang phục (Dress Code swatches)
 * - Toàn bộ Album ảnh cưới (Gallery grid đa ảnh)
 * - Bản đồ chỉ đường Google Maps
 * - Xác nhận tham dự (RSVP)
 * - Hộp mừng cưới & Tài khoản ngân hàng hai họ (VietQR)
 * - Ảnh kỷ niệm kết thúc thiệp to đẹp (Ending Photo) & Lời cảm ơn sâu sắc
 */

import { resolveBankCode, generateVietQrUrl } from "./vietQrBankCodes";

function resolveUrl(url?: string): string {
  if (!url || typeof url !== "string") return "";
  const clean = url.trim();
  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("blob:") ||
    clean.startsWith("data:") ||
    clean.startsWith("/uploads") ||
    clean.startsWith("/assets")
  ) {
    return clean;
  }
  if (clean.startsWith("/")) {
    return `https://cdn-resource.zenlove.me${clean}`;
  }
  return `https://cdn-resource.zenlove.me/${clean}`;
}

export function convertFormTemplateToCanvasNodes(
  formData: Record<string, any>,
  meta?: { id?: string; name?: string; imageUrl?: string; slug?: string }
): Record<string, any> {
  const basicInfo = formData.basicInfo || {};
  const groom = basicInfo.groomFullName || basicInfo.groomShortName || "Huỳnh Minh Vinh";
  const bride = basicInfo.brideFullName || basicInfo.brideShortName || "Mai Kim Hạnh";
  const groomShort = basicInfo.groomShortName || groom.split(" ").slice(-1)[0] || "Minh Vinh";
  const brideShort = basicInfo.brideShortName || bride.split(" ").slice(-1)[0] || "Kim Hạnh";

  // Ngày cưới
  const weddingDateData = formData.weddingDate || {};
  const dateStr = weddingDateData.date || "2027-09-12T11:30:00.000Z";
  const dateObj = new Date(dateStr);
  const day = dateObj.getDate() || 12;
  const month = dateObj.getMonth() + 1 || 9;
  const year = dateObj.getFullYear() || 2027;
  const hour = weddingDateData.hour || 11;
  const minute = weddingDateData.minute || 30;
  const formattedTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  // Ảnh bìa chính (Hero Photo)
  let heroImage = "";
  if (formData.mainScreen?.imagePath && Array.isArray(formData.mainScreen.imagePath) && formData.mainScreen.imagePath[0]) {
    heroImage = resolveUrl(formData.mainScreen.imagePath[0]);
  } else if (meta?.imageUrl) {
    heroImage = resolveUrl(meta.imageUrl);
  } else if (formData.endingPhoto?.fileKey) {
    heroImage = resolveUrl(formData.endingPhoto.fileKey);
  } else {
    heroImage = "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800";
  }

  // Lời ngỏ
  const introDesc = formData.introMent?.description
    ? formData.introMent.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : "Chúng tôi đã gặp được người khiến mỗi ngày trở nên dịu dàng hơn. Từ những điều bình dị, yêu thương lớn lên và trở thành lời hẹn ước trăm năm.";

  // Địa điểm
  const loc = formData.weddingLocation?.locations?.[0] || {};
  const venueTitle = loc.title || "Trung tâm Tiệc cưới Trống Đồng Palace";
  const venueAddress = loc.address || "Số 72 Quán Sứ, Hoàn Kiếm, Hà Nội";
  const mapUrl = loc.mapUrl || "https://maps.google.com/?q=Ho+Chi+Minh";

  // Màu sắc chủ đạo từ theme
  const theme = formData.theme || {};
  let bgColor = "#fcf9f5";
  let primaryColor = "#6b3b59";
  let textColor = "#2c2420";

  if (theme.backgroundColor?.includes("purple")) {
    bgColor = "#fbf8fb";
    primaryColor = "#5a2d52";
  } else if (theme.backgroundColor?.includes("green")) {
    bgColor = "#f7faf7";
    primaryColor = "#2d5238";
  } else if (theme.backgroundColor?.includes("red")) {
    bgColor = "#fdf7f7";
    primaryColor = "#781b24";
  } else if (theme.backgroundColor?.includes("blue")) {
    bgColor = "#f6f8fb";
    primaryColor = "#1f3a5f";
  } else if (theme.backgroundColor?.includes("gold") || theme.backgroundColor?.includes("yellow")) {
    bgColor = "#fdfbf5";
    primaryColor = "#8a651a";
  }

  // Danh sách các node Craft.js
  const nodes: Record<string, any> = {};
  const childNodeIds: string[] = [];

  let currentTop = 60;

  // 1. Tag đầu thiệp
  const idTopTag = "node_top_tag";
  nodes[idTopTag] = {
    type: { resolvedName: "TextBox" },
    props: {
      top: currentTop,
      left: 40,
      width: 420,
      height: 30,
      text: "SAVE THE DATE",
      fontFamily: "font-cinzel",
      fontSize: 13,
      color: primaryColor,
      textAlign: "center",
      letterSpacing: 4,
      zIndex: 10,
    },
  };
  childNodeIds.push(idTopTag);
  currentTop += 45;

  // 2. Tiêu đề tên Cô Dâu & Chú Rể
  const idTitle = "node_couple_title";
  nodes[idTitle] = {
    type: { resolvedName: "TextBox" },
    props: {
      top: currentTop,
      left: 20,
      width: 460,
      height: 70,
      text: `${groomShort} & ${brideShort}`,
      fontFamily: "font-great-vibes",
      fontSize: 42,
      color: primaryColor,
      textAlign: "center",
      zIndex: 12,
    },
  };
  childNodeIds.push(idTitle);
  currentTop += 80;

  // 3. Thời gian tóm tắt
  const idDateSubtitle = "node_date_sub";
  nodes[idDateSubtitle] = {
    type: { resolvedName: "TextBox" },
    props: {
      top: currentTop,
      left: 50,
      width: 400,
      height: 25,
      text: `${day} • THÁNG ${month} • ${year}`,
      fontFamily: "font-cinzel",
      fontSize: 14,
      color: textColor,
      textAlign: "center",
      letterSpacing: 3,
      zIndex: 12,
    },
  };
  childNodeIds.push(idDateSubtitle);
  currentTop += 45;

  // 4. Ảnh cưới chính Hero
  if (heroImage) {
    const idHeroPhoto = "node_hero_photo";
    nodes[idHeroPhoto] = {
      type: { resolvedName: "PhotoBox" },
      props: {
        top: currentTop,
        left: 45,
        width: 410,
        height: 520,
        imgKey: heroImage,
        src: heroImage,
        isReplaceable: true,
        previewKey: true,
        zIndex: 14,
        borderRadius: [24, 24, 24, 24],
        borderSize: 3,
        borderColor: "#ffffff",
        hasBoxShadow: true,
      },
    };
    childNodeIds.push(idHeroPhoto);
    currentTop += 545;
  }

  // 5. Lời ngỏ mời cưới
  const idIntro = "node_intro_quote";
  nodes[idIntro] = {
    type: { resolvedName: "TextBox" },
    props: {
      top: currentTop,
      left: 40,
      width: 420,
      height: 100,
      text: introDesc,
      fontFamily: "font-cormorant",
      fontSize: 18,
      color: textColor,
      textAlign: "center",
      lineHeight: 1.6,
      zIndex: 15,
    },
  };
  childNodeIds.push(idIntro);
  currentTop += 120;

  // 6. Thông tin gia đình hai bên
  const idFamily = "node_family_info";
  const fatherG = basicInfo.groomFatherName ? `Ông ${basicInfo.groomFatherName}` : "Ông Huỳnh Minh Quân";
  const motherG = basicInfo.groomMatherName ? `Bà ${basicInfo.groomMatherName}` : "Bà Trịnh Bảo Nhung";
  const fatherB = basicInfo.brideFatherName ? `Ông ${basicInfo.brideFatherName}` : "Ông Mai Văn Hùng";
  const motherB = basicInfo.brideMatherName ? `Bà ${basicInfo.brideMatherName}` : "Bà Lê Thị Mai";

  nodes[idFamily] = {
    type: { resolvedName: "TextBox" },
    props: {
      top: currentTop,
      left: 30,
      width: 440,
      height: 120,
      text: `<div style="display:flex; justify-content:space-around; font-size:13px; line-height:1.7;">
        <div><b>NHÀ TRAI</b><br/>${fatherG}<br/>${motherG}<br/><span style="color:${primaryColor}; font-weight:bold;">${groom}</span></div>
        <div><b>NHÀ GÁI</b><br/>${fatherB}<br/>${motherB}<br/><span style="color:${primaryColor}; font-weight:bold;">${bride}</span></div>
      </div>`,
      fontSize: 14,
      color: textColor,
      textAlign: "center",
      zIndex: 16,
    },
  };
  childNodeIds.push(idFamily);
  currentTop += 140;

  // 7. Thông tin chi tiết các buổi hôn lễ (Ceremonies: Lễ Vu Quy & Lễ Thành Hôn)
  const ceremoniesList = Array.isArray(formData.ceremonies?.lists) ? formData.ceremonies.lists : [];
  if (ceremoniesList.length > 0) {
    const idCeremonyTitle = "node_ceremonies_title";
    nodes[idCeremonyTitle] = {
      type: { resolvedName: "TextBox" },
      props: {
        top: currentTop,
        left: 40,
        width: 420,
        height: 35,
        text: formData.ceremonies?.title || "CHƯƠNG TRÌNH HÔN LỄ",
        fontFamily: "font-cinzel",
        fontSize: 16,
        color: primaryColor,
        textAlign: "center",
        letterSpacing: 3,
        zIndex: 16,
      },
    };
    childNodeIds.push(idCeremonyTitle);
    currentTop += 45;

    ceremoniesList.forEach((c: any, cIdx: number) => {
      const idCeremonyCard = `node_ceremony_${cIdx}`;
      const cName = c.name || (cIdx === 0 ? "Lễ Vu Quy" : "Lễ Thành Hôn");
      const cDate = c.date || `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const cTime = c.time || formattedTime;
      const cLunar = c.lunarDate ? `<div style="font-size:11px; color:#888; margin-top:2px; font-style:italic;">${c.lunarDate}</div>` : "";
      const cLoc = c.location ? `<div style="font-size:12px; color:#555; margin-top:4px;">📍 ${c.location}</div>` : "";

      nodes[idCeremonyCard] = {
        type: { resolvedName: "TextBox" },
        props: {
          top: currentTop,
          left: 40,
          width: 420,
          height: 105,
          text: `<div style="padding:14px 18px; background:rgba(255,255,255,0.75); border:1px solid rgba(212,175,55,0.3); border-radius:18px; text-align:center; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
            <div style="font-size:14px; font-weight:bold; color:${primaryColor}; letter-spacing:1px; text-transform:uppercase;">${cName}</div>
            <div style="font-size:15px; font-weight:bold; color:${textColor}; margin-top:4px;">⏰ ${cTime} • ${cDate}</div>
            ${cLunar}
            ${cLoc}
          </div>`,
          fontSize: 13,
          color: textColor,
          textAlign: "center",
          zIndex: 17,
        },
      };
      childNodeIds.push(idCeremonyCard);
      currentTop += 120;
    });
    currentTop += 15;
  }

  // 8. Đồng hồ đếm ngược Countdown
  const idCountdown = "node_countdown";
  nodes[idCountdown] = {
    type: { resolvedName: "CountdownBoxV2" },
    props: {
      top: currentTop,
      left: 40,
      width: 420,
      height: 110,
      targetDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${formattedTime}:00`,
      zIndex: 18,
    },
  };
  childNodeIds.push(idCountdown);
  currentTop += 130;

  // 9. Lịch cưới Calendar
  const idCalendar = "node_calendar";
  nodes[idCalendar] = {
    type: { resolvedName: "CalendarBoxV2" },
    props: {
      top: currentTop,
      left: 50,
      width: 400,
      height: 180,
      day,
      month,
      year,
      zIndex: 20,
    },
  };
  childNodeIds.push(idCalendar);
  currentTop += 205;

  // 10. Lịch trình ngày cưới (Wedding Timeline)
  const timelineItems = formData.weddingTimeline?.items || formData.timeline?.items || [];
  if (Array.isArray(timelineItems) && timelineItems.length > 0) {
    const idTimelineTitle = "node_timeline_title";
    nodes[idTimelineTitle] = {
      type: { resolvedName: "TextBox" },
      props: {
        top: currentTop,
        left: 40,
        width: 420,
        height: 35,
        text: formData.weddingTimeline?.title || formData.timeline?.title || "LỊCH TRÌNH NGÀY CƯỚI",
        fontFamily: "font-cinzel",
        fontSize: 16,
        color: primaryColor,
        textAlign: "center",
        letterSpacing: 3,
        zIndex: 20,
      },
    };
    childNodeIds.push(idTimelineTitle);
    currentTop += 45;

    const timelineHtml = timelineItems.map((item: any) => `
      <div style="display:flex; align-items:center; gap:16px; padding:10px 0; border-bottom:1px dashed rgba(0,0,0,0.08);">
        <div style="min-width:65px; font-weight:bold; font-size:13px; color:${primaryColor}; text-align:right;">${item.time || "10:00"}</div>
        <div style="width:10px; height:10px; border-radius:50%; background:${primaryColor}; flex-shrink:0;"></div>
        <div style="font-weight:600; font-size:14px; color:${textColor};">${item.title || "Sự kiện cưới"}</div>
      </div>
    `).join("");

    const idTimelineCard = "node_timeline_card";
    const timelineHeight = Math.max(160, timelineItems.length * 52 + 35);
    nodes[idTimelineCard] = {
      type: { resolvedName: "TextBox" },
      props: {
        top: currentTop,
        left: 40,
        width: 420,
        height: timelineHeight,
        text: `<div style="padding:16px 20px; background:rgba(255,255,255,0.8); border:1px solid rgba(0,0,0,0.06); border-radius:20px; box-shadow:0 6px 20px rgba(0,0,0,0.03);">
          ${timelineHtml}
        </div>`,
        fontSize: 13,
        color: textColor,
        zIndex: 21,
      },
    };
    childNodeIds.push(idTimelineCard);
    currentTop += timelineHeight + 35;
  }

  // 11. Quy định trang phục (Dress Code)
  const dressCode = formData.dressCode;
  if (dressCode && (Array.isArray(dressCode.colors) && dressCode.colors.length > 0)) {
    const idDressTitle = "node_dress_title";
    nodes[idDressTitle] = {
      type: { resolvedName: "TextBox" },
      props: {
        top: currentTop,
        left: 40,
        width: 420,
        height: 35,
        text: dressCode.title || "DRESS CODE TRANG PHỤC",
        fontFamily: "font-cinzel",
        fontSize: 15,
        color: primaryColor,
        textAlign: "center",
        letterSpacing: 3,
        zIndex: 21,
      },
    };
    childNodeIds.push(idDressTitle);
    currentTop += 40;

    const colorsHtml = (dressCode.colors || []).map((c: any) => `
      <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
        <div style="width:36px; height:36px; border-radius:50%; background:${c.color || '#fff'}; border:2px solid rgba(0,0,0,0.12); box-shadow:0 3px 8px rgba(0,0,0,0.1);"></div>
        <span style="font-size:11px; font-weight:600; color:#555;">${c.label || ""}</span>
      </div>
    `).join("");

    const idDressCard = "node_dress_card";
    nodes[idDressCard] = {
      type: { resolvedName: "TextBox" },
      props: {
        top: currentTop,
        left: 40,
        width: 420,
        height: 125,
        text: `<div style="padding:16px; background:rgba(255,255,255,0.75); border:1px solid rgba(0,0,0,0.06); border-radius:20px; text-align:center;">
          <p style="font-size:12px; color:#666; margin-bottom:12px; line-height:1.4;">${dressCode.description || "Để bức hình kỷ niệm thêm trọn vẹn, quý khách vui lòng lựa chọn trang phục theo tông màu:"}</p>
          <div style="display:flex; justify-content:center; gap:22px;">
            ${colorsHtml}
          </div>
        </div>`,
        fontSize: 12,
        color: textColor,
        textAlign: "center",
        zIndex: 22,
      },
    };
    childNodeIds.push(idDressCard);
    currentTop += 150;
  }

  // 12. Album ảnh cưới (Wedding Photo Gallery)
  const rawGalleryList: string[] = [];
  if (Array.isArray(formData.gallery?.imageList)) {
    formData.gallery.imageList.forEach((img: string) => {
      if (img && typeof img === "string") rawGalleryList.push(img);
    });
  }
  if (Array.isArray(formData.middleImages?.items)) {
    formData.middleImages.items.forEach((item: any) => {
      if (item?.image1) rawGalleryList.push(item.image1);
      if (item?.image2) rawGalleryList.push(item.image2);
    });
  }

  const uniqueGallery = Array.from(new Set(rawGalleryList.filter(Boolean))).map(resolveUrl);

  if (uniqueGallery.length > 0) {
    const idGalleryTitle = "node_gallery_title";
    nodes[idGalleryTitle] = {
      type: { resolvedName: "TextBox" },
      props: {
        top: currentTop,
        left: 40,
        width: 420,
        height: 35,
        text: formData.gallery?.title || "KHOẢNH KHẮC HẠNH PHÚC",
        fontFamily: "font-cinzel",
        fontSize: 16,
        color: primaryColor,
        textAlign: "center",
        letterSpacing: 3,
        zIndex: 22,
      },
    };
    childNodeIds.push(idGalleryTitle);
    currentTop += 45;

    // Hiển thị lưới ảnh cưới 2 cột (PhotoBox) để người dùng có thể nhấp vào thay thế bất kỳ ảnh nào trong Studio
    const displayGallery = uniqueGallery.slice(0, 12);
    const colWidth = 202;
    const colHeight = 270;
    const gap = 16;
    const startLeft = 40;

    displayGallery.forEach((photoUrl, pIdx) => {
      const isCol0 = pIdx % 2 === 0;
      const colX = isCol0 ? startLeft : startLeft + colWidth + gap;
      const rowY = currentTop + Math.floor(pIdx / 2) * (colHeight + gap);

      const idGalleryPhoto = `node_gallery_photo_${pIdx}`;
      nodes[idGalleryPhoto] = {
        type: { resolvedName: "PhotoBox" },
        props: {
          top: rowY,
          left: colX,
          width: colWidth,
          height: colHeight,
          imgKey: photoUrl,
          src: photoUrl,
          isReplaceable: true,
          zIndex: 23,
          borderRadius: [16, 16, 16, 16],
          borderSize: 2,
          borderColor: "#ffffff",
          hasBoxShadow: true,
        },
      };
      childNodeIds.push(idGalleryPhoto);
    });

    const totalRows = Math.ceil(displayGallery.length / 2);
    currentTop += totalRows * (colHeight + gap) + 35;
  }

  // 13. Bản đồ & Địa điểm tổ chức
  const idMap = "node_map";
  nodes[idMap] = {
    type: { resolvedName: "MapBox" },
    props: {
      top: currentTop,
      left: 40,
      width: 420,
      height: 210,
      venueName: venueTitle,
      address: venueAddress,
      mapUrl,
      zIndex: 24,
    },
  };
  childNodeIds.push(idMap);
  currentTop += 235;

  // 14. Xác nhận tham dự (RSVP)
  const idRsvp = "node_rsvp";
  nodes[idRsvp] = {
    type: { resolvedName: "RsvpBoxV2" },
    props: {
      top: currentTop,
      left: 40,
      width: 420,
      height: 380,
      zIndex: 26,
    },
  };
  childNodeIds.push(idRsvp);
  currentTop += 405;

  // 15. Hộp mừng cưới & Tài khoản hai họ (VietQR)
  const accountGroups = Array.isArray(formData.account?.groupList) ? formData.account.groupList : [];
  if (accountGroups.length > 0) {
    const idBankTitle = "node_bank_title";
    nodes[idBankTitle] = {
      type: { resolvedName: "TextBox" },
      props: {
        top: currentTop,
        left: 40,
        width: 420,
        height: 35,
        text: formData.account?.title || "HỘP MỪNG CƯỚI",
        fontFamily: "font-cinzel",
        fontSize: 16,
        color: primaryColor,
        textAlign: "center",
        letterSpacing: 3,
        zIndex: 27,
      },
    };
    childNodeIds.push(idBankTitle);
    currentTop += 45;

    const accountsHtml = accountGroups.map((group: any) => {
      const gTitle = group.title || "Mừng cưới";
      const accList = (group.accountList || []).map((acc: any) => {
        const rawBank = acc.bank || "MB";
        const bankCode = resolveBankCode(rawBank);
        const rawNum = String(acc.number || "").replace(/[^0-9]/g, "");
        const isBride = gTitle.toLowerCase().includes("gái") || gTitle.toLowerCase().includes("dâu");
        const num = rawNum && rawNum !== "0000000000" ? rawNum : (isBride ? "190365824988" : "240220038888");
        const bankName = rawNum && rawNum !== "0000000000" ? rawBank : (isBride ? "TECHCOMBANK" : "MB BANK");
        const name = acc.name || (isBride ? "THÙY DUNG" : "ĐỨC MẠNH");
        const qrUrl = generateVietQrUrl(bankName, num, name, undefined, `Mung cuoi ${name}`);
        return `
          <div style="background:#fff; border-radius:14px; padding:12px; border:1px solid rgba(0,0,0,0.06); text-align:center; box-shadow:0 3px 10px rgba(0,0,0,0.03);">
            <img src="${qrUrl}" alt="VietQR ${name}" style="width:130px; height:150px; object-fit:contain; margin:0 auto 8px; border-radius:8px;" />
            <div style="font-weight:bold; font-size:13px; color:#111;">${bankName}</div>
            <div style="font-size:12px; color:#555; margin-top:2px;">STK: <b style="color:#d93849;">${num}</b></div>
            <div style="font-size:11px; color:#777; margin-top:2px; text-transform:uppercase;">${name}</div>
          </div>
        `;
      }).join("");

      return `
        <div style="margin-bottom:14px;">
          <div style="font-weight:bold; font-size:13px; color:${primaryColor}; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px; text-align:center;">${gTitle}</div>
          <div style="display:grid; grid-template-columns:${(group.accountList || []).length > 1 ? '1fr 1fr' : '1fr'}; gap:10px;">
            ${accList}
          </div>
        </div>
      `;
    }).join("");

    const idBankCard = "node_bank_card";
    const bankCardHeight = Math.max(260, accountGroups.length * 215);
    nodes[idBankCard] = {
      type: { resolvedName: "TextBox" },
      props: {
        top: currentTop,
        left: 40,
        width: 420,
        height: bankCardHeight,
        text: `<div style="padding:18px; background:rgba(255,255,255,0.85); border:1px solid rgba(212,175,55,0.3); border-radius:24px; box-shadow:0 8px 25px rgba(0,0,0,0.04);">
          <p style="font-size:12px; color:#666; text-align:center; margin-bottom:14px; line-height:1.5;">${formData.account?.description?.replace(/\r?\n/g, '<br/>') || "Sự hiện diện của quý vị là món quà quý giá nhất. Quý vị cũng có thể gửi lời chúc và quà mừng qua số tài khoản:"}</p>
          ${accountsHtml}
        </div>`,
        fontSize: 12,
        color: textColor,
        zIndex: 28,
      },
    };
    childNodeIds.push(idBankCard);
    currentTop += bankCardHeight + 35;
  } else {
    // Fallback QR chuẩn VietQR thật 100%
    const idGift = "node_gift_qr";
    const fallbackQrUrl = generateVietQrUrl("MB BANK", "240220038888", "ĐỨC MẠNH", undefined, "Mung cuoi hai ban");
    nodes[idGift] = {
      type: { resolvedName: "GiftQrBox" },
      props: {
        top: currentTop,
        left: 40,
        width: 420,
        height: 260,
        modalTitle: "Hộp Quà Mừng Cưới Yêu Thương",
        imgKey: fallbackQrUrl,
        bankName: "MB BANK",
        accountNumber: "240220038888",
        accountName: "ĐỨC MẠNH",
        zIndex: 28,
      },
    };
    childNodeIds.push(idGift);
    currentTop += 285;
  }

  // 16. Ảnh kỷ niệm kết thúc thiệp lớn (Ending Photo)
  const endingPhoto = formData.endingPhoto;
  const endingImgUrl = endingPhoto?.fileKey ? resolveUrl(endingPhoto.fileKey) : null;
  if (endingImgUrl) {
    const idEndingPhoto = "node_ending_photo";
    nodes[idEndingPhoto] = {
      type: { resolvedName: "PhotoBox" },
      props: {
        top: currentTop,
        left: 45,
        width: 410,
        height: 520,
        imgKey: endingImgUrl,
        src: endingImgUrl,
        isReplaceable: true,
        zIndex: 29,
        borderRadius: [24, 24, 24, 24],
        borderSize: 3,
        borderColor: "#ffffff",
        hasBoxShadow: true,
      },
    };
    childNodeIds.push(idEndingPhoto);
    currentTop += 545;
  }

  // 17. Lời cảm ơn kết thúc
  const endingMent = endingPhoto?.ment
    ? endingPhoto.ment.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : "Cảm ơn vì đã luôn yêu thương và là một phần trong ngày hạnh phúc nhất của chúng tôi!";

  const idThankYou = "node_thank_you";
  nodes[idThankYou] = {
    type: { resolvedName: "TextBox" },
    props: {
      top: currentTop,
      left: 40,
      width: 420,
      height: 110,
      text: `<div style="text-align:center; padding:16px;">
        <p style="font-family:'Parisienne', cursive; font-size:26px; color:${primaryColor}; margin-bottom:8px;">Thank You!</p>
        <p style="font-size:14px; color:${textColor}; line-height:1.6; font-style:italic;">"${endingMent}"</p>
      </div>`,
      fontFamily: "font-parisienne",
      fontSize: 20,
      color: primaryColor,
      textAlign: "center",
      zIndex: 30,
    },
  };
  childNodeIds.push(idThankYou);
  currentTop += 135;

  // Tự động gán texture hình nền chuẩn tiệc cưới sang trọng
  let bgImage: string | undefined = undefined;
  if (formData.theme?.backgroundImage) {
    bgImage = resolveUrl(formData.theme.backgroundImage);
  } else {
    const bgCol = String(bgColor).toLowerCase();
    if (
      bgCol.includes("590310") ||
      bgCol.includes("7c151a") ||
      bgCol.includes("991b1b") ||
      bgCol.includes("red") ||
      bgCol.includes("7f1d1d")
    ) {
      bgImage = "https://cdn-resource.zenlove.me/resources/background/mj63stx45kzeibis.webp";
    } else {
      bgImage = "https://cdn-resource.zenlove.me/resources/background/mldw1mdn28infjta.png";
    }
  }

  // Tạo Node ROOT hoàn chỉnh
  nodes["ROOT"] = {
    type: { resolvedName: "Container" },
    isCanvas: true,
    props: {
      backgroundColor: bgColor,
      backgroundImage: bgImage,
      backgroundOpacity: 1,
      opacity: 1,
      isWebview: false,
      editorViewportWidth: 500,
      width: 500,
      height: Math.max(5400, currentTop + 160),
      musicTitle: formData.backgroundMusic?.name || "Bản nhạc cưới",
      musicUrl: formData.backgroundMusic?.fileKey
        ? resolveUrl(formData.backgroundMusic.fileKey)
        : "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    },
    displayName: "Container",
    custom: { displayName: "App" },
    hidden: false,
    nodes: childNodeIds,
    linkedNodes: {},
  };

  return nodes;
}
