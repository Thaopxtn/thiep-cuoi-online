/**
 * Chuyển đổi dữ liệu template dạng FORM (26 keys của ZenLove) sang cây Canvas Craft.js Nodes
 */
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

  // Ảnh bìa chính
  let heroImage = meta?.imageUrl || "";
  if (formData.mainScreen?.imagePath && Array.isArray(formData.mainScreen.imagePath) && formData.mainScreen.imagePath[0]) {
    const rawPath = formData.mainScreen.imagePath[0].replace(/^\//, "");
    heroImage = rawPath.startsWith("http") ? rawPath : `https://cdn-resource.zenlove.me/${rawPath}`;
  } else if (formData.endingPhoto?.fileKey) {
    const rawPath = formData.endingPhoto.fileKey.replace(/^\//, "");
    heroImage = rawPath.startsWith("http") ? rawPath : `https://cdn-resource.zenlove.me/${rawPath}`;
  }

  // Ảnh phụ / Gallery
  let secondaryImage = "";
  if (formData.middleImages?.items && Array.isArray(formData.middleImages.items) && formData.middleImages.items[0]?.image1) {
    const rawPath = formData.middleImages.items[0].image1.replace(/^\//, "");
    secondaryImage = rawPath.startsWith("http") ? rawPath : `https://cdn-resource.zenlove.me/${rawPath}`;
  } else if (formData.endingPhoto?.fileKey) {
    const rawPath = formData.endingPhoto.fileKey.replace(/^\//, "");
    secondaryImage = rawPath.startsWith("http") ? rawPath : `https://cdn-resource.zenlove.me/${rawPath}`;
  }

  // Lời ngỏ
  const introDesc = formData.introMent?.description
    ? formData.introMent.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : "Chúng tôi đã gặp được người khiến mỗi ngày trở nên dịu dàng hơn. Từ những điều bình dị, yêu thương lớn lên và trở thành lời hẹn ước trăm năm.";

  // Địa điểm
  const loc = formData.weddingLocation?.locations?.[0] || {};
  const venueTitle = loc.title || "Tư gia Nhà Gái";
  const venueAddress = loc.address || "123 Đường Hạnh Phúc, TP. Hồ Chí Minh";
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

  // 7. Đồng hồ đếm ngược Countdown
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

  // 8. Lịch cưới Calendar
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

  // 9. Ảnh kỷ niệm thứ hai (nếu có)
  if (secondaryImage) {
    const idPhoto2 = "node_secondary_photo";
    nodes[idPhoto2] = {
      type: { resolvedName: "PhotoBox" },
      props: {
        top: currentTop,
        left: 45,
        width: 410,
        height: 480,
        imgKey: secondaryImage,
        src: secondaryImage,
        isReplaceable: true,
        zIndex: 22,
        borderRadius: [20, 20, 20, 20],
        borderSize: 2,
        borderColor: "#ffffff",
        hasBoxShadow: true,
      },
    };
    childNodeIds.push(idPhoto2);
    currentTop += 505;
  }

  // 10. Bản đồ & Địa điểm tổ chức
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

  // 11. Xác nhận tham dự (RSVP)
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

  // 12. Hộp mừng cưới online (VietQR)
  const idGift = "node_gift_qr";
  nodes[idGift] = {
    type: { resolvedName: "GiftQrBox" },
    props: {
      top: currentTop,
      left: 40,
      width: 420,
      height: 260,
      modalTitle: "Hộp Quà Mừng Cưới Yêu Thương",
      zIndex: 28,
    },
  };
  childNodeIds.push(idGift);
  currentTop += 285;

  // 13. Lời cảm ơn kết thúc
  const idThankYou = "node_thank_you";
  nodes[idThankYou] = {
    type: { resolvedName: "TextBox" },
    props: {
      top: currentTop,
      left: 40,
      width: 420,
      height: 80,
      text: "Cảm ơn vì đã luôn yêu thương và là một phần trong ngày hạnh phúc nhất của chúng tôi!",
      fontFamily: "font-parisienne",
      fontSize: 22,
      color: primaryColor,
      textAlign: "center",
      zIndex: 30,
    },
  };
  childNodeIds.push(idThankYou);
  currentTop += 120;

  // Tạo Node ROOT hoàn chỉnh
  nodes["ROOT"] = {
    type: { resolvedName: "Container" },
    isCanvas: true,
    props: {
      backgroundColor: bgColor,
      opacity: 1,
      isWebview: false,
      editorViewportWidth: 500,
      width: 500,
      height: Math.max(3800, currentTop + 80),
      musicTitle: formData.backgroundMusic?.name || "Marry You - Bruno Mars",
      musicUrl: formData.backgroundMusic?.fileKey
        ? (formData.backgroundMusic.fileKey.startsWith("http")
            ? formData.backgroundMusic.fileKey
            : `https://cdn-resource.zenlove.me/${formData.backgroundMusic.fileKey.replace(/^\//, "")}`)
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
