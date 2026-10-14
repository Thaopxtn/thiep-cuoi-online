import hongPhongNodes from "@/data/templates/hong-phong-nodes.json";

export interface WeddingEvent {
  id: string;
  title: string;
  time: string;
  venue: string;
  address: string;
  mapUrl?: string;
}

export interface WeddingRsvp {
  id: string;
  cardId: string;
  name: string;
  phone: string;
  attending: boolean;
  guests: number;
  note?: string;
  createdAt: string;
}

export interface WeddingWish {
  id: string;
  cardId: string;
  name: string;
  content: string;
  createdAt: string;
  likes?: number;
}

export interface WeddingCard {
  id: string;
  slug: string;
  name: string;
  templateId: string;
  templateName: string;
  status: "published" | "draft";
  updatedAt: string;
  views: number;
  coverImage: string;
  story: string;
  weddingDate: string; // YYYY-MM-DD
  weddingTime: string; // HH:mm
  lunarDate: string;
  groom: {
    userId?: string;
    name: string;
    title: string;
    phone: string;
    parents?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    qrCode?: string;
  };
  bride: {
    name: string;
    title: string;
    phone: string;
    parents?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    qrCode?: string;
  };
  events: WeddingEvent[];
  album: string[];
  musicTitle: string;
  musicUrl: string;
  rsvps: WeddingRsvp[];
  wishes: WeddingWish[];
  nodes?: Record<string, any>;
  userId?: string;
  showGiftBox?: boolean;
  showWishes?: boolean;
  showRsvp?: boolean;
  showEvents?: boolean;
  envelopeTheme?: "burgundy" | "cream" | "traditional";
  ambientEffect?: "petals" | "sparkles" | "hearts" | "confetti";
  loveStory?: Array<{
    id?: string;
    date: string;
    title: string;
    description: string;
    imageUrl?: string;
  }>;
  showCalendar?: boolean;
  showLoveStory?: boolean;
  isVip?: boolean;
  plan?: "free" | "vip" | "premium";
  vipUnlockedAt?: string;
  showWatermark?: boolean;
}

// Key operational templates
export const INITIAL_CARDS: WeddingCard[] = [
  {
    id: "8c5055d8-30db-4b38-8831-e11063e3d352",
    slug: "hong-phong",
    name: "Thiệp Cưới Hoàng Gia - Đức Mạnh & Thùy Dung",
    templateId: "8c5055d8-30db-4b38-8831-e11063e3d352",
    templateName: "Hồng Phong",
    status: "published",
    updatedAt: "04/10/2026",
    views: 1420,
    coverImage:
      "https://cdn-resource.zenlove.me/uploads/862861ad-96f7-4738-b17f-56ad4f5c1e28/QkFhLVRoQW4tVGlhbl8xNzg5OTE0NzgyOTM4X3hodWtzYWpiZzE.jpg?crop=0,0,1920,1080&format=webp&quality=80",
    story:
      "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương.",
    weddingDate: "2026-11-18",
    weddingTime: "11:00",
    lunarDate: "Ngày 10 tháng 10 năm Bính Ngọ",
    groom: {
      name: "Đức Mạnh",
      title: "Chú Rể",
      phone: "0912.345.678",
      parents: "Ông Nguyễn Văn Hùng & Bà Trần Thị Lan",
      bankName: "MB BANK",
      accountNumber: "240220038888",
      accountName: "NGUYEN VAN HUNG",
      qrCode: "https://img.vietqr.io/image/MB-240220038888-compact2.png?amount=0&addInfo=Mung%20cuoi%20hai%20ban&accountName=NGUYEN%20VAN%20HUNG",
    },
    bride: {
      name: "Thùy Dung",
      title: "Cô Dâu",
      phone: "0987.654.321",
      parents: "Ông Lê Văn Thành & Bà Vũ Thị Mai",
      bankName: "TECHCOMBANK",
      accountNumber: "190365824988",
      accountName: "LE THUY DUNG",
      qrCode: "https://img.vietqr.io/image/TCB-190365824988-compact2.png?amount=0&addInfo=Mung%20cuoi%20hai%20ban&accountName=LE%20THUY%20DUNG",
    },
    events: [
      {
        id: "evt-1",
        title: "Lễ Vu Quy (Nhà Gái)",
        time: "08:30 • 18/11/2026",
        venue: "Tư gia Nhà Gái",
        address: "Số 45 Tràng Tiền, Hoàn Kiếm, Hà Nội",
        mapUrl: "https://maps.google.com/?q=Trang+Tien+Hanoi",
      },
      {
        id: "evt-2",
        title: "Lễ Thành Hôn (Nhà Trai)",
        time: "10:00 • 18/11/2026",
        venue: "Tư gia Nhà Trai",
        address: "Số 88 Hoàng Hoa Thám, Ba Đình, Hà Nội",
        mapUrl: "https://maps.google.com/?q=Hoang+Hoa+Tham+Hanoi",
      },
      {
        id: "evt-3",
        title: "Tiệc Cưới Chung Vui",
        time: "11:30 • 18/11/2026",
        venue: "Trung tâm Tiệc cưới Trống Đồng Palace",
        address: "72 Quán Sứ, Hoàn Kiếm, Hà Nội",
        mapUrl: "https://maps.google.com/?q=Trong+Dong+Palace",
      },
    ],
    album: [
      "https://cdn-resource.zenlove.me/uploads/2ffce2d3-3d19-4c86-8bd1-e9e690a35ea4/SU1HMTIxMV8xNzkxMDgzMzMxNDc3XzNyenQ3MmZ1OWdr.jpg?crop=0,507,1216,811&format=webp&quality=80",
      "https://cdn-resource.zenlove.me/uploads/b364a8d8-10d8-49a6-9286-7f4d3cfca99b/dinh-hung-and-duong-quynh/MEUyQTQ3NTZfMTc5MTA5MDM2NzUxOV95anI5eWdwY2hn.jpg?crop=0,366,1216,811&format=webp&quality=80",
      "https://cdn-resource.zenlove.me/uploads/87df86de-2e11-4cd6-8da3-f733767cc173/RFNDMDYwNjctY29weV8xNzkwNDI5NjIzMTkwX3BmZmw1a3U3ZGc.jpg?crop=0,481,1216,811&format=webp&quality=80",
      "https://cdn-resource.zenlove.me/uploads/3992e215-f845-4074-b1cf-993aa7e42334/WklONTY3MV8xNzkxMDIxODUwNzkwX29nMmpxZHIxNGI.jpg?crop=101,0,1621,1216&format=webp&quality=80",
    ],
    musicTitle: "Thiên đường với người thương",
    musicUrl:
      "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    rsvps: [
      {
        id: "rsvp-1",
        cardId: "8c5055d8-30db-4b38-8831-e11063e3d352",
        name: "Nguyễn Văn Tuấn",
        phone: "0912345678",
        attending: true,
        guests: 2,
        note: "Chúc hai bạn trăm năm hạnh phúc!",
        createdAt: "04/10/2026 10:15",
      },
      {
        id: "rsvp-2",
        cardId: "8c5055d8-30db-4b38-8831-e11063e3d352",
        name: "Trần Thị Mai Anh",
        phone: "0987654321",
        attending: true,
        guests: 1,
        createdAt: "03/10/2026 19:30",
      },
      {
        id: "rsvp-3",
        cardId: "8c5055d8-30db-4b38-8831-e11063e3d352",
        name: "Lê Hoàng Long",
        phone: "0903112233",
        attending: false,
        guests: 0,
        note: "Tiếc quá mình bận công tác xa, chúc mừng đôi bạn nhé!",
        createdAt: "03/10/2026 15:00",
      },
    ],
    wishes: [
      {
        id: "wish-1",
        cardId: "8c5055d8-30db-4b38-8831-e11063e3d352",
        name: "Gia đình Bác Hùng",
        content:
          "Chúc hai cháu trăm năm hạnh phúc, răng long đầu bạc, vạn sự như ý và luôn đong đầy yêu thương!",
        createdAt: "Hôm nay 09:15",
      },
      {
        id: "wish-2",
        cardId: "8c5055d8-30db-4b38-8831-e11063e3d352",
        name: "Hội bạn thân Đại Học",
        content:
          "Chúc Mạnh và Dung mãi mãi mặn nồng, cùng nhau xây đắp tổ ấm ngập tràn tiếng cười!",
        createdAt: "Hôm qua 21:00",
      },
    ],
    nodes: hongPhongNodes,
  },
  {
    id: "4e91a4ea-9e62-43d8-bf37-34e2eef30e2e",
    slug: "mua-thu",
    name: "Thiệp Cưới Mùa Thu - Tuấn & Linh",
    templateId: "4e91a4ea-9e62-43d8-bf37-34e2eef30e2e",
    templateName: "Mùa Thu",
    status: "draft",
    updatedAt: "02/10/2026",
    views: 185,
    coverImage:
      "https://cdn-resource.zenlove.me/uploads/2ffce2d3-3d19-4c86-8bd1-e9e690a35ea4/SU1HMTIxMV8xNzkxMDgzMzMxNDc3XzNyenQ3MmZ1OWdr.jpg?crop=0,507,1216,811&format=webp&quality=80",
    story: "Cảm ơn em đã bước vào cuộc đời anh, cùng viết nên chương mới tươi đẹp.",
    weddingDate: "2026-12-25",
    weddingTime: "17:30",
    lunarDate: "Ngày 17 tháng 11 năm Bính Ngọ",
    groom: {
      name: "Anh Tuấn",
      title: "Chú Rể",
      phone: "0904.555.666",
      bankName: "VIETCOMBANK",
      accountNumber: "0011004567890",
      accountName: "TRAN ANH TUAN",
      qrCode: "https://img.vietqr.io/image/VCB-0011004567890-compact2.png?amount=0&addInfo=Mung%20cuoi%20hai%20ban&accountName=TRAN%20ANH%20TUAN",
    },
    bride: {
      name: "Mai Linh",
      title: "Cô Dâu",
      phone: "0909.888.999",
      bankName: "VPBANK",
      accountNumber: "123456789",
      accountName: "NGUYEN MAI LINH",
      qrCode: "https://img.vietqr.io/image/VPB-123456789-compact2.png?amount=0&addInfo=Mung%20cuoi%20hai%20ban&accountName=NGUYEN%20MAI%20LINH",
    },
    events: [
      {
        id: "evt-m1",
        title: "Tiệc Cưới Hoàng Gia",
        time: "17:30 • 25/12/2026",
        venue: "Riverside Palace, TP. Hồ Chí Minh",
        address: "360D Bến Vân Đồn, Phường 1, Quận 4, TP. Hồ Chí Minh",
      },
    ],
    album: [],
    musicTitle: "Beautiful In White",
    musicUrl:
      "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    rsvps: [],
    wishes: [],
  },
  {
    id: "aurora-luxury-001",
    slug: "aurora-luxury",
    name: "Aurora Luxury - Hoàng Khang & Ánh Tuyết",
    templateId: "aurora-luxury-001",
    templateName: "Aurora Luxury",
    status: "published",
    updatedAt: "13/10/2026",
    views: 890,
    envelopeTheme: "cream",
    ambientEffect: "sparkles",
    coverImage:
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
    story:
      "Giữa hàng triệu người trên thế giới, thật kỳ diệu khi chúng ta tìm thấy nhau và cùng thêu dệt nên giấc mơ hạnh phúc trăm năm ngọt ngào này.",
    weddingDate: "2026-11-28",
    weddingTime: "18:00",
    lunarDate: "Ngày 20 tháng 10 năm Bính Ngọ",
    groom: {
      name: "Hoàng Khang",
      title: "Chú Rể",
      phone: "0908.112.233",
      parents: "Ông Hoàng Văn Thái & Bà Đỗ Thị Cúc",
      bankName: "MB BANK",
      accountNumber: "999988886666",
      accountName: "HOANG KHANG",
    },
    bride: {
      name: "Ánh Tuyết",
      title: "Cô Dâu",
      phone: "0918.445.566",
      parents: "Ông Trần Đình Long & Bà Phạm Thị Lan",
      bankName: "TECHCOMBANK",
      accountNumber: "190388887777",
      accountName: "TRAN ANH TUYET",
    },
    events: [
      {
        id: "evt-al-1",
        title: "Lễ Hôn Phối Thánh Đường",
        time: "14:00 • 28/11/2026",
        venue: "Thánh Đường Cổ Kính",
        address: "Số 01 Công Xã Paris, Phường Bến Nghé, Quận 1, TP. HCM",
        mapUrl: "https://maps.google.com/?q=Notre+Dame+Cathedral+Saigon",
      },
      {
        id: "evt-al-2",
        title: "Dạ Tiệc Champagne Hoàng Gia",
        time: "18:00 • 28/11/2026",
        venue: "Park Hyatt Saigon Grand Ballroom",
        address: "Số 2 Lam Sơn, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        mapUrl: "https://maps.google.com/?q=Park+Hyatt+Saigon",
      },
    ],
    album: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800&auto=format&fit=crop",
    ],
    loveStory: [
      {
        id: "ls-1",
        date: "14 / 02 / 2021",
        title: "Định Mệnh Chạm Nhau",
        description: "Buổi chiều Paris tuyết trắng phủ, ánh mắt giao nhau qua tách cafe ấm nồng.",
        imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop",
      },
      {
        id: "ls-2",
        date: "20 / 10 / 2022",
        title: "Cái Nắm Tay Đầu Tiên",
        description: "Dưới tháp Eiffel rực rỡ ánh đèn, ta nhận ra nửa kia thuộc về mình trọn vẹn.",
        imageUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop",
      },
      {
        id: "ls-3",
        date: "24 / 12 / 2024",
        title: "Lời Hẹn Ước Vĩnh Cửu",
        description: "Chiếc nhẫn kim cương lấp lánh và lời thì thầm: 'Hãy cùng anh già đi nhé em!'.",
        imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600&auto=format&fit=crop",
      },
    ],
    musicTitle: "Until I Found You - Acoustic",
    musicUrl:
      "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    rsvps: [],
    wishes: [
      {
        id: "w-al-1",
        cardId: "aurora-luxury-001",
        name: "Hội bạn thân Doanh Nhân",
        content: "Chúc Khang và Tuyết một hôn lễ tuyệt mỹ, hạnh phúc thăng hoa và mãi giữ trọn nụ cười rạng rỡ này nhé!",
        createdAt: "Hôm nay 10:20",
        likes: 12,
      },
    ],
  },
  {
    id: "chung-doi-son-sat-002",
    slug: "chung-doi-son-sat",
    name: "Chung Đôi Son Sắt - Quốc Bảo & Thanh Trúc",
    templateId: "chung-doi-son-sat-002",
    templateName: "Chung Đôi Son Sắt",
    status: "published",
    updatedAt: "13/10/2026",
    views: 1240,
    envelopeTheme: "traditional",
    ambientEffect: "petals",
    coverImage:
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop",
    story:
      "Trăm năm kết tóc se duyên, sắc son tình nghĩa vẹn tròn trăm năm. Nguyện cùng người vượt qua bão giông, cùng xây tổ ấm an lành vững bền.",
    weddingDate: "2026-12-12",
    weddingTime: "11:00",
    lunarDate: "Ngày 04 tháng 11 năm Bính Ngọ",
    groom: {
      name: "Quốc Bảo",
      title: "Chú Rể",
      phone: "0903.667.889",
      parents: "Ông Nguyễn Quốc Dũng & Bà Lê Thị Kim",
      bankName: "VIETCOMBANK",
      accountNumber: "0071008899776",
      accountName: "NGUYEN QUOC BAO",
    },
    bride: {
      name: "Thanh Trúc",
      title: "Cô Dâu",
      phone: "0909.112.334",
      parents: "Ông Đặng Văn Minh & Bà Huỳnh Thị Nga",
      bankName: "ACB",
      accountNumber: "2233445566",
      accountName: "DANG THANH TRUC",
    },
    events: [
      {
        id: "evt-cd-1",
        title: "Lễ Vu Quy Nhà Gái",
        time: "08:00 • 12/12/2026",
        venue: "Tư gia Nhà Gái",
        address: "128 Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP. HCM",
      },
      {
        id: "evt-cd-2",
        title: "Lễ Thành Hôn & Tiệc Hỷ",
        time: "11:00 • 12/12/2026",
        venue: "Trung tâm Hội nghị The Adora Grand View",
        address: "421 Ngô Gia Tự, Phường 9, Quận 5, TP. Hồ Chí Minh",
        mapUrl: "https://maps.google.com/?q=The+Adora+Grand+View",
      },
    ],
    album: [
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
    ],
    loveStory: [
      {
        id: "ls-cd-1",
        date: "01 / 01 / 2020",
        title: "Hội Ngộ Đầu Xuân",
        description: "Gặp gỡ trong hội hoa xuân, duyên lành đưa lối tình nồng thắm duyên.",
      },
      {
        id: "ls-cd-2",
        date: "08 / 08 / 2023",
        title: "Lễ Đính Ước",
        description: "Hai bên nội ngoại đồng lòng, trầu cau dạm hỏi ước định chung đôi.",
      },
    ],
    musicTitle: "Ánh Nắng Của Anh - Violin Hòa Tấu",
    musicUrl:
      "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    rsvps: [],
    wishes: [
      {
        id: "w-cd-1",
        cardId: "chung-doi-son-sat-002",
        name: "Gia đình Cậu Mợ Ba",
        content: "Chúc hai cháu sắt son nghĩa vợ tình chồng, con đàn cháu đống, hạnh phúc trường cửu!",
        createdAt: "Hôm qua 18:30",
        likes: 18,
      },
    ],
  },
  {
    id: "pure-romance-003",
    slug: "pure-romance",
    name: "Pure Romance - Minh Triết & Ngọc Diệp",
    templateId: "pure-romance-003",
    templateName: "Pure Romance",
    status: "published",
    updatedAt: "13/10/2026",
    views: 650,
    envelopeTheme: "cream",
    ambientEffect: "hearts",
    coverImage:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop",
    story:
      "Tình yêu đơn giản là khi ở bên cạnh em, anh thấy lòng mình bình yên nhất. Hôm nay và mãi về sau, tay trong tay bước chung một con đường tràn ngập nắng mai.",
    weddingDate: "2026-12-20",
    weddingTime: "17:30",
    lunarDate: "Ngày 12 tháng 11 năm Bính Ngọ",
    groom: {
      name: "Minh Triết",
      title: "Chú Rể",
      phone: "0915.223.344",
      parents: "Ông Trần Minh Trí & Bà Nguyễn Thị Hạnh",
      bankName: "VPBANK",
      accountNumber: "8899001122",
      accountName: "TRAN MINH TRIET",
    },
    bride: {
      name: "Ngọc Diệp",
      title: "Cô Dâu",
      phone: "0938.556.677",
      parents: "Ông Vũ Ngọc Sơn & Bà Hoàng Bích Thủy",
      bankName: "MB BANK",
      accountNumber: "5566778899",
      accountName: "VU NGOC DIEP",
    },
    events: [
      {
        id: "evt-pr-1",
        title: "Lễ Thành Hôn Lãng Mạn",
        time: "17:30 • 20/12/2026",
        venue: "Chloe Gallery Living Dining Event",
        address: "02 - 06 Phan Văn Chương, Hồ Bán Nguyệt, Phú Mỹ Hưng, Quận 7, TP. HCM",
        mapUrl: "https://maps.google.com/?q=Chloe+Gallery+Saigon",
      },
    ],
    album: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800&auto=format&fit=crop",
    ],
    loveStory: [
      {
        id: "ls-pr-1",
        date: "20 / 05 / 2022",
        title: "Tình Cờ Hội Ngộ",
        description: "Gặp nhau trong một buổi triển lãm tranh nghệ thuật, câu chuyện bắt đầu từ bức hoạ đồng xanh.",
      },
      {
        id: "ls-pr-2",
        date: "14 / 02 / 2024",
        title: "Nguyện Ước Chung Đôi",
        description: "Bên bờ Hồ Bán Nguyệt, ta hứa cùng nhau đi qua mọi tháng năm bình yên.",
      },
    ],
    musicTitle: "I Do - 911 Band",
    musicUrl:
      "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    rsvps: [],
    wishes: [
      {
        id: "w-pr-1",
        cardId: "pure-romance-003",
        name: "Nhóm Bạn Đại Học Kiến Trúc",
        content: "Chúc Triết và Diệp trăm năm viên mãn, lúc nào cũng ngọt ngào và đáng yêu như thuở mới quen!",
        createdAt: "Hôm nay 08:45",
        likes: 9,
      },
    ],
  },
];
