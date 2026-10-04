import { TemplateModule } from "@/components/modules/types";
import { RecipeId, TemplateItem } from "./types";

export const RECIPES: Record<
  RecipeId,
  (d: TemplateItem["defaultData"], t: TemplateItem) => TemplateModule[]
> = {
  "red-wax-classic": (d, t) => [
    {
      id: "mod-red-wax-hero",
      type: "hero-red-wax-envelope",
      name: "Phong bì sáp đỏ dập hoa hồng",
      description:
        "Bì thư đỏ nhung cổ điển, con dấu sáp vàng hoa hồng 3D và ảnh cưới trồi lên",
      enabled: true,
      props: {
        title: d.eventTitle || "Thư Mời Cưới",
        person1: d.person1,
        person2: d.person2 || "Mai Lan",
        date: d.date,
        heroPhoto: d.mainPhoto,
      },
    },
    {
      id: "mod-parents-family",
      type: "parents-family-invitation",
      name: "Thông điệp hai họ & Save The Date",
      description:
        "Thông tin bố mẹ Nhà Trai, Nhà Gái và cụm ngày cưới Save The Date kèm 2 ảnh Polaroid",
      enabled: true,
      props: {
        introTitle: "THAM DỰ LỄ THÀNH HÔN CỦA GIA ĐÌNH CHÚNG TÔI:",
        groomName: d.person1 || "Nông Văn Sâm",
        brideName: d.person2 || "Ma Thị Mai Lan",
        saveDateDay: d.date.split(".")[0] || "29",
        saveDateMonth: d.date.split(".")[1] || "03",
      },
    },
    {
      id: "mod-wedding-schedule",
      type: "wedding-schedule-cards",
      name: "Lịch trình sự kiện & Lịch cưới",
      description:
        "2 thẻ sự kiện Lễ Thành Hôn, Tiệc Mừng và Lịch tháng 3 khoanh tròn ngày cưới",
      enabled: true,
      props: {
        event1Title: "LỄ THÀNH HÔN",
        event1Time: `${d.time || "10:00"} - Chủ Nhật`,
        event1Date: d.date || "29.03.2026",
        event1Lunar: "(Tức Ngày 11 Tháng 02 Năm Bính Ngọ)",
        event1Venue: d.venue || "Tại Tư Gia Nhà Trai",
        event2Title: "TIỆC MỪNG LỄ THÀNH HÔN",
        event2Time: `${d.time || "10:00"} - Chủ Nhật`,
        event2Date: d.date || "29.03.2026",
        event2Lunar: "(Tức Ngày 11 Tháng 02 Năm Bính Ngọ)",
        event2Venue: d.venue || "Tại Tư Gia Nhà Trai",
        calendarTitle: "Tháng 3 - 2026",
        selectedDay: parseInt(d.date.split(".")[0], 10) || 29,
      },
    },
    {
      id: "mod-venue",
      type: "venue-map",
      name: "Địa điểm tổ chức & Chỉ đường",
      description: "Bản đồ Google Maps vệ tinh và địa chỉ nhà trai",
      enabled: true,
      props: {
        title: "Địa Điểm Tổ Chức",
        venue: d.venue,
        address: d.address,
        date: d.date,
        time: d.time,
        mapUrl: d.mapUrl,
        theme: "wedding",
      },
    },
    {
      id: "mod-red-velvet-rsvp",
      type: "red-velvet-rsvp",
      name: "Xác nhận tham dự trực tuyến",
      description: "Form xác nhận tham dự 4 trường viền đỏ nhung và nút gửi ngay",
      enabled: true,
      props: {
        title: "Xác Nhận Tham Dự",
      },
    },
    {
      id: "mod-red-envelope-gift",
      type: "red-envelope-gift-card",
      name: "Hộp mừng cưới & Mã QR ngân hàng",
      description:
        "Thẻ mừng cưới mở popup chuyển khoản BIDV & Agribank kèm mã VietQR",
      enabled: true,
      props: {
        cardTitle: "Gửi Mừng Cưới",
        groomBank: {
          bankName: d.bankInfo?.bankName || "BIDV",
          accountNumber: d.bankInfo?.accountNumber || "1290457180",
          accountHolder: d.bankInfo?.accountHolder || "NONG VAN SAM",
        },
        brideBank: {
          bankName: "AGRIBANK",
          accountNumber: "8502281029435",
          accountHolder: "MAI THI LAN",
        },
      },
    },
    {
      id: "mod-photo-gallery",
      type: "photo-gallery-grid",
      name: "Album ảnh cưới & Lời cảm ơn",
      description: "Lưới ảnh 2 cột chất lượng cao và lời cảm ơn kết thiệp",
      enabled: true,
      props: {
        groomName: d.person1,
        brideName: d.person2 || "Mai Lan",
        date: d.date,
        closingTitle: "Rất Hân Hạnh Được Đón Tiếp!",
      },
    },
    {
      id: "mod-wishes",
      type: "wishes-stream",
      name: "Luồng lời chúc bay",
      description: "Bong bóng lời chúc trôi nổi trên màn hình",
      enabled: true,
      props: { maxVisible: 4 },
    },
  ],

  "sky-graduation": (d, t) => [
    {
      id: "mod-sky-countdown",
      type: "hero-sky-countdown",
      name: "Bầu trời mây & Đếm ngược",
      description:
        "Tiêu đề sự kiện, tên cử nhân, đồng hồ đếm ngược và ảnh đại diện",
      enabled: true,
      props: {
        eventTitle: d.eventTitle,
        person1: d.person1,
        date: d.date,
        time: d.time,
        mainPhoto: d.mainPhoto,
      },
    },
    {
      id: "mod-calendar",
      type: "calendar",
      name: "Lịch tháng tốt nghiệp",
      description: "Lịch tháng sự kiện có đánh dấu ngày quan trọng",
      enabled: true,
      props: {
        title: "Lịch Tốt Nghiệp",
        date: d.date,
        theme: "sky",
      },
    },
    {
      id: "mod-quote",
      type: "story-quote",
      name: "Tri ân sâu sắc",
      description: "Lời cảm ơn gia đình, bạn bè và thầy cô",
      enabled: true,
      props: {
        heading: "Hoàn thành hành trình",
        subheading: "Tri ân sâu sắc",
        quote: d.quote,
        theme: "sky",
      },
    },
    {
      id: "mod-invitation",
      type: "invitation-letter",
      name: "Thư mời bạn thân",
      description: "Lời nhắn thân mật và chữ ký kỷ niệm",
      enabled: true,
      props: {
        badge: "Thư Mời",
        salutation: "Bạn Thân Mến",
        body: d.invitationBody,
        signature: d.signature,
        theme: "sky",
      },
    },
    {
      id: "mod-venue",
      type: "venue-map",
      name: "Địa điểm & Bản đồ",
      description: "Thông tin nơi tổ chức và nút chỉ đường Google Maps",
      enabled: true,
      props: {
        title: "Địa điểm buổi lễ",
        venue: d.venue,
        address: d.address,
        date: d.date,
        time: d.time,
        mapUrl: d.mapUrl,
        theme: "sky",
      },
    },
    {
      id: "mod-wishes",
      type: "wishes-stream",
      name: "Luồng lời chúc bay",
      description: "Bong bóng lời chúc trôi nổi trên màn hình",
      enabled: true,
      props: {
        maxVisible: 4,
      },
    },
  ],

  "traditional-red": (d, t) => [
    {
      id: "mod-red-hero",
      type: "hero-traditional-red",
      name: "Bì thư đỏ & Chữ Hỷ vàng",
      description: "Thiệp cưới truyền thống đỏ thắm mạ vàng sang trọng",
      enabled: true,
      props: {
        eventTitle: d.eventTitle || "THIỆP MỜI CƯỚI",
        person1: d.person1,
        person2: d.person2 || "Diệu Lan",
        date: d.date,
        mainPhoto: d.mainPhoto,
        subTitle:
          d.invitationBody ||
          "Trân trọng kính mời tới dự lễ thành hôn của chúng tôi",
      },
    },
    {
      id: "mod-quote",
      type: "story-quote",
      name: "Lời thề nguyền son sắt",
      description: "Trăm năm tình viên mãn - Bạc đầu nghĩa phu thê",
      enabled: true,
      props: {
        heading: "Duyên Nợ Trăm Năm",
        subheading: "Hạnh phúc vẹn tròn",
        quote: d.quote,
        theme: "wedding",
      },
    },
    {
      id: "mod-calendar",
      type: "calendar",
      name: "Lịch ngày lành tháng tốt",
      description: "Đánh dấu ngày vui đại hỷ",
      enabled: true,
      props: {
        title: "Ngày Lễ Thành Hôn",
        date: d.date,
        theme: "wedding",
      },
    },
    {
      id: "mod-venue",
      type: "venue-map",
      name: "Địa điểm tiệc cưới",
      description: "Tư gia hai họ và trung tâm hội nghị tiệc cưới",
      enabled: true,
      props: {
        title: "Địa điểm tổ chức hôn lễ",
        venue: d.venue,
        address: d.address,
        date: d.date,
        time: d.time,
        mapUrl: d.mapUrl,
        theme: "wedding",
      },
    },
    {
      id: "mod-rsvp",
      type: "rsvp",
      name: "Xác nhận tham dự (RSVP)",
      description: "Xác nhận số lượng khách mời dự tiệc",
      enabled: true,
      props: {
        title: "Xác nhận chung vui",
        subtitle:
          "Sự hiện diện của quý vị là niềm vinh hạnh của hai bên gia đình",
        theme: "wedding",
      },
    },
    {
      id: "mod-gift",
      type: "gift-bank",
      name: "Hộp mừng cưới đỏ",
      description: "Mừng cưới chúc phúc cho tân lang tân nương",
      enabled: true,
      props: {
        title: "Hộp Mừng Cưới Chúc Phúc",
        subtitle: "Cảm ơn tấm lòng chân thành và lời chúc của bạn!",
        bankName: d.bankInfo?.bankName || "Techcombank",
        accountNumber: d.bankInfo?.accountNumber || "",
        accountHolder: d.bankInfo?.accountHolder || "",
        theme: "wedding",
      },
    },
    {
      id: "mod-wishes",
      type: "wishes-stream",
      name: "Luồng lời chúc bay",
      description: "Bong bóng lời chúc trôi nổi trên màn hình",
      enabled: true,
      props: { maxVisible: 4 },
    },
  ],

  "birthday-balloon": (d, t) => [
    {
      id: "mod-birthday-hero",
      type: "hero-birthday",
      name: "Sinh nhật tuổi mới & Nến",
      description: "Bóng bay, bánh kem lung linh và countdown ngày sinh nhật",
      enabled: true,
      props: {
        eventTitle: d.eventTitle || "Happy Birthday",
        person1: d.person1,
        age: 18,
        date: d.date,
        time: d.time,
        mainPhoto: d.mainPhoto,
      },
    },
    {
      id: "mod-quote",
      type: "story-quote",
      name: "Lời chúc tuổi mới",
      description: "Những lời chúc ngọt ngào nhất",
      enabled: true,
      props: {
        heading: "Bước sang tuổi mới",
        subheading: "Ngập tràn niềm vui & hạnh phúc",
        quote: d.quote,
        theme: "sky",
      },
    },
    {
      id: "mod-calendar",
      type: "calendar",
      name: "Lịch ngày sinh nhật",
      description: "Đánh dấu ngày đặc biệt",
      enabled: true,
      props: {
        title: "Lịch Tiệc Sinh Nhật",
        date: d.date,
        theme: "sky",
      },
    },
    {
      id: "mod-venue",
      type: "venue-map",
      name: "Địa điểm tiệc sinh nhật",
      description: "Nơi tụ họp bạn bè chung vui",
      enabled: true,
      props: {
        title: "Địa điểm buổi tiệc",
        venue: d.venue,
        address: d.address,
        date: d.date,
        time: d.time,
        mapUrl: d.mapUrl,
        theme: "sky",
      },
    },
    {
      id: "mod-gift",
      type: "gift-bank",
      name: "Hộp quà sinh nhật",
      description: "Tặng quà mừng tuổi mới",
      enabled: true,
      props: {
        title: "Hộp Quà Sinh Nhật",
        subtitle: "Cảm ơn bạn đã gửi quà và lời chúc mừng sinh nhật!",
        bankName: d.bankInfo?.bankName || "TPBank",
        accountNumber: d.bankInfo?.accountNumber || "",
        accountHolder: d.bankInfo?.accountHolder || "",
        theme: "sky",
      },
    },
    {
      id: "mod-wishes",
      type: "wishes-stream",
      name: "Luồng lời chúc bay",
      description: "Bong bóng lời chúc trôi nổi trên màn hình",
      enabled: true,
      props: { maxVisible: 4 },
    },
  ],

  "modern-minimal": (d, t) => [
    {
      id: "mod-modern-hero",
      type: "hero-modern-minimal",
      name: "Tối giản hiện đại (Editorial)",
      description: "Phong cách tạp chí thời trang Hàn Quốc thanh lịch",
      enabled: true,
      props: {
        eventTitle: d.eventTitle || "THE WEDDING OF",
        person1: d.person1,
        person2: d.person2 || "",
        date: d.date,
        time: d.time,
        mainPhoto: d.mainPhoto,
        venue: d.venue,
      },
    },
    {
      id: "mod-polaroid",
      type: "polaroid-tape",
      name: "Khoảnh khắc yêu thương",
      description: "Ảnh cưới dán băng keo vintage",
      enabled: true,
      props: {
        photo: d.mainPhoto,
        caption: "Together Forever",
        subtext: d.quote,
      },
    },
    {
      id: "mod-calendar",
      type: "calendar",
      name: "Lịch sự kiện cưới",
      description: "Lịch tháng thanh lịch",
      enabled: true,
      props: {
        title: "Lịch Cưới",
        date: d.date,
        theme: "wedding",
      },
    },
    {
      id: "mod-venue",
      type: "venue-map",
      name: "Địa điểm tổ chức",
      description: "Thông tin khách sạn và Google Maps",
      enabled: true,
      props: {
        title: "Địa điểm tổ chức",
        venue: d.venue,
        address: d.address,
        date: d.date,
        time: d.time,
        mapUrl: d.mapUrl,
        theme: "wedding",
      },
    },
    {
      id: "mod-rsvp",
      type: "rsvp",
      name: "Xác nhận tham dự",
      description: "Form RSVP trực tiếp",
      enabled: true,
      props: {
        title: "Xác nhận tham dự",
        subtitle: "Sự hiện diện của bạn là niềm vui trọn vẹn của chúng mình!",
        theme: "wedding",
      },
    },
    {
      id: "mod-gift",
      type: "gift-bank",
      name: "Hộp mừng cưới",
      description: "Số tài khoản và mã VietQR",
      enabled: true,
      props: {
        title: "Hộp Mừng Cưới",
        subtitle: "Cảm ơn tấm lòng chân thành của bạn!",
        bankName: d.bankInfo?.bankName || "BIDV",
        accountNumber: d.bankInfo?.accountNumber || "",
        accountHolder: d.bankInfo?.accountHolder || "",
        theme: "wedding",
      },
    },
    {
      id: "mod-wishes",
      type: "wishes-stream",
      name: "Luồng lời chúc bay",
      description: "Bong bóng lời chúc trôi nổi trên màn hình",
      enabled: true,
      props: { maxVisible: 4 },
    },
  ],

  "floral-rustic": (d, t) => [
    {
      id: "mod-floral-hero",
      type: "hero-floral-rustic",
      name: "Vòm hoa lá sân vườn Rustic",
      description: "Phong cách Bohemian hoa lá xanh mát lãng mạn",
      enabled: true,
      props: {
        eventTitle: d.eventTitle || "Save The Date",
        person1: d.person1,
        person2: d.person2 || "",
        date: d.date,
        mainPhoto: d.mainPhoto,
        quote: "We decided on forever",
      },
    },
    {
      id: "mod-quote",
      type: "story-quote",
      name: "Lời hẹn thề ngọt ngào",
      description: "Câu chuyện tình yêu chân thành",
      enabled: true,
      props: {
        heading: "Câu Chuyện Tình Yêu",
        subheading: "Về chung một mái nhà",
        quote: d.quote,
        theme: "wedding",
      },
    },
    {
      id: "mod-polaroid",
      type: "polaroid-tape",
      name: "Album ảnh vintage",
      description: "Khung ảnh cưới dán băng dính",
      enabled: true,
      props: {
        photo: d.mainPhoto,
        caption: "Love Story",
        subtext:
          "Hạnh phúc không phải là đích đến, mà là cùng nhau đi trên một con đường.",
      },
    },
    {
      id: "mod-venue",
      type: "venue-map",
      name: "Địa điểm tiệc cưới sân vườn",
      description: "Bản đồ chỉ đường tới tiệc cưới",
      enabled: true,
      props: {
        title: "Địa điểm tổ chức",
        venue: d.venue,
        address: d.address,
        date: d.date,
        time: d.time,
        mapUrl: d.mapUrl,
        theme: "wedding",
      },
    },
    {
      id: "mod-rsvp",
      type: "rsvp",
      name: "Xác nhận tham dự",
      description: "Form xác nhận tham dự tiệc",
      enabled: true,
      props: {
        title: "Xác nhận tham dự",
        subtitle: "Rất mong được đón tiếp bạn trong ngày trọng đại!",
        theme: "wedding",
      },
    },
    {
      id: "mod-gift",
      type: "gift-bank",
      name: "Hộp mừng cưới",
      description: "VietQR mừng cưới cô dâu chú rể",
      enabled: true,
      props: {
        title: "Hộp Mừng Cưới",
        subtitle: "Cảm ơn tấm lòng chân thành của bạn!",
        bankName: d.bankInfo?.bankName || "BIDV",
        accountNumber: d.bankInfo?.accountNumber || "",
        accountHolder: d.bankInfo?.accountHolder || "",
        theme: "wedding",
      },
    },
    {
      id: "mod-wishes",
      type: "wishes-stream",
      name: "Luồng lời chúc bay",
      description: "Bong bóng lời chúc trôi nổi trên màn hình",
      enabled: true,
      props: { maxVisible: 4 },
    },
  ],

  "luxury-gold": (d, t) => [
    {
      id: "mod-luxury-hero",
      type: "hero-luxury-gold",
      name: "Hoàng gia Luxury Gold",
      description: "Tone đen vàng kim quý phái, vương miện và ánh kim tuyến",
      enabled: true,
      props: {
        eventTitle: d.eventTitle || "ROYAL WEDDING INVITATION",
        person1: d.person1,
        person2: d.person2 || "Ngọc Vy",
        date: d.date,
        mainPhoto: d.mainPhoto,
        subTitle:
          d.invitationBody ||
          "Trân trọng kính mời quý khách đến dự lễ thành hôn của chúng tôi",
      },
    },
    {
      id: "mod-quote",
      type: "story-quote",
      name: "Thư mời trang trọng",
      description: "Lời mời chân tình gửi tới quý quan khách",
      enabled: true,
      props: {
        heading: "Our Royal Story",
        subheading: "Hôn Lễ Hoàn Hảo",
        quote: d.quote,
        theme: "wedding",
      },
    },
    {
      id: "mod-calendar",
      type: "calendar",
      name: "Lịch ngày hoàng đạo",
      description: "Lịch tổ chức hôn lễ sang trọng",
      enabled: true,
      props: {
        title: "Lịch Hôn Lễ",
        date: d.date,
        theme: "wedding",
      },
    },
    {
      id: "mod-venue",
      type: "venue-map",
      name: "Sảnh tiệc Grand Palace",
      description: "Thông tin trung tâm hội nghị tiệc cưới",
      enabled: true,
      props: {
        title: "Địa điểm tổ chức",
        venue: d.venue,
        address: d.address,
        date: d.date,
        time: d.time,
        mapUrl: d.mapUrl,
        theme: "wedding",
      },
    },
    {
      id: "mod-rsvp",
      type: "rsvp",
      name: "Xác nhận tham dự",
      description: "Form xác nhận tham dự tiệc cưới",
      enabled: true,
      props: {
        title: "Xác nhận tham dự",
        subtitle:
          "Sự hiện diện của quý vị là niềm vinh dự lớn nhất của chúng tôi!",
        theme: "wedding",
      },
    },
    {
      id: "mod-gift",
      type: "gift-bank",
      name: "Hộp mừng cưới",
      description: "VietQR mừng cưới",
      enabled: true,
      props: {
        title: "Hộp Mừng Cưới Hoàng Gia",
        subtitle: "Cảm ơn tấm lòng chân thành của quý vị!",
        bankName: d.bankInfo?.bankName || "Techcombank",
        accountNumber: d.bankInfo?.accountNumber || "",
        accountHolder: d.bankInfo?.accountHolder || "",
        theme: "wedding",
      },
    },
    {
      id: "mod-wishes",
      type: "wishes-stream",
      name: "Luồng lời chúc bay",
      description: "Bong bóng lời chúc trôi nổi trên màn hình",
      enabled: true,
      props: { maxVisible: 4 },
    },
  ],

  "standard-envelope": (d, t) => [
    {
      id: "mod-envelope",
      type: "hero-envelope",
      name: "Bì thư mở ảnh đôi",
      description: "Phong bì thiệp cưới mở ảnh cưới đôi, sao lấp lánh và hashtag",
      enabled: true,
      props: {
        eventTitle: d.eventTitle,
        person1: d.person1,
        person2: d.person2 || "",
        date: d.date,
        mainPhoto: d.mainPhoto,
        hashtags: ["#weddingForever"],
      },
    },
    {
      id: "mod-polaroid",
      type: "polaroid-tape",
      name: "Ảnh cưới dán băng dính",
      description: "Khung ảnh cưới vintage dán băng keo trong Scotch tape",
      enabled: true,
      props: {
        photo:
          d.albumPhotos && d.albumPhotos.length > 0
            ? d.albumPhotos[0]
            : d.mainPhoto,
        caption: "Forever",
        subtext: d.quote,
      },
    },
    {
      id: "mod-venue",
      type: "venue-map",
      name: "Địa điểm & Bản đồ tiệc cưới",
      description: "Thông tin khách sạn/nhà trai/nhà gái và Google Maps",
      enabled: true,
      props: {
        title: "Địa điểm tổ chức",
        venue: d.venue,
        address: d.address,
        date: d.date,
        time: d.time,
        mapUrl: d.mapUrl,
        theme: "wedding",
      },
    },
    {
      id: "mod-rsvp",
      type: "rsvp",
      name: "Xác nhận tham dự (RSVP)",
      description:
        "Form xác nhận khách mời tham dự một mình hay có người đi cùng",
      enabled: true,
      props: {
        title: "Xác nhận tham dự",
        subtitle: "Sự hiện diện của bạn là niềm vinh hạnh của chúng mình!",
        theme: "wedding",
      },
    },
    {
      id: "mod-gift",
      type: "gift-bank",
      name: "Hộp mừng cưới VietQR",
      description: "Số tài khoản và mã QR chuyển khoản ngân hàng",
      enabled: true,
      props: {
        title: "Hộp Mừng Cưới",
        subtitle: "Cảm ơn tấm lòng chân thành và lời chúc của bạn!",
        bankName: d.bankInfo?.bankName || "Vietcombank",
        accountNumber: d.bankInfo?.accountNumber || "",
        accountHolder: d.bankInfo?.accountHolder || "",
        theme: "wedding",
      },
    },
    {
      id: "mod-wishes",
      type: "wishes-stream",
      name: "Luồng lời chúc bay",
      description: "Bong bóng lời chúc trôi nổi trên màn hình",
      enabled: true,
      props: {
        maxVisible: 4,
      },
    },
  ],
};

/**
 * Fallback detection for legacy templates that do not have an explicit `recipe` set.
 * Exact match logic from original `generateDefaultModules`.
 */
export function inferLegacyRecipe(template: TemplateItem): RecipeId {
  const tid = template.id || "";
  const slug = template.slug || "";
  const title = template.title || "";

  // 0. Red Wax Classic
  if (
    tid === "thiep-cuoi-van-sam-mai-lan" ||
    slug.includes("van-sam-mai-lan") ||
    title.includes("Văn Sâm")
  ) {
    return "red-wax-classic";
  }

  // 1. Graduation
  if (
    tid === "718400d5-aa80-4c7f-93c5-a2e669eca56c" ||
    template.type === "graduation" ||
    template.category === "graduation"
  ) {
    return "sky-graduation";
  }

  // 2. Traditional Red
  if (
    tid === "0e710ebe-05e2-4bf7-9e35-5d43d610a442" ||
    tid === "template-red-invitation" ||
    slug === "template-6" ||
    title.includes("Thiệp Cưới Đỏ")
  ) {
    return "traditional-red";
  }

  // 3. Birthday
  if (
    tid === "bfbc03aa-9e39-4d64-8ee1-a9e992160d16" ||
    tid === "template-birthday-01" ||
    template.category === "birthday" ||
    slug.includes("sinh-nhat")
  ) {
    return "birthday-balloon";
  }

  // 4. Modern Minimalist (10 Pre, 39 Pre)
  if (
    tid === "44deae86-d256-438d-953b-08634f43f579" ||
    tid === "e23075c3-1628-449e-b7a4-9daaa43d3b76" ||
    tid === "template-wedding-10" ||
    tid === "template-wedding-39" ||
    slug.includes("10-pre") ||
    slug.includes("39-pre")
  ) {
    return "modern-minimal";
  }

  // 5. Floral Rustic
  if (
    tid === "593b487d-d421-4f1b-be42-6e5a6aee70c8" ||
    tid === "bbaaa1eb-9ce6-4a5f-bbf4-213c4e511475" ||
    tid === "template-wedding-48" ||
    tid === "template-wedding-70" ||
    slug.includes("48-pre") ||
    slug.includes("70-pre")
  ) {
    return "floral-rustic";
  }

  // 6. Luxury Gold Royal
  if (
    tid === "78eecff1-16cb-4027-a068-d06efd3a0429" ||
    tid === "template-wedding-881" ||
    slug.includes("881-pre") ||
    title.includes("881")
  ) {
    return "luxury-gold";
  }

  // 7. Standard Wedding
  return "standard-envelope";
}
