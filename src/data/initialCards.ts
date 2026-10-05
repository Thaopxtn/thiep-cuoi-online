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
    name: string;
    title: string;
    phone: string;
    parents?: string;
    bankName?: string;
    accountNumber?: string;
    qrCode?: string;
  };
  bride: {
    name: string;
    title: string;
    phone: string;
    parents?: string;
    bankName?: string;
    accountNumber?: string;
    qrCode?: string;
  };
  events: WeddingEvent[];
  album: string[];
  musicTitle: string;
  musicUrl: string;
  rsvps: WeddingRsvp[];
  wishes: WeddingWish[];
  nodes?: Record<string, any>;
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
      qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=240220038888-MBBANK",
    },
    bride: {
      name: "Thùy Dung",
      title: "Cô Dâu",
      phone: "0987.654.321",
      parents: "Ông Lê Văn Thành & Bà Vũ Thị Mai",
      bankName: "TECHCOMBANK",
      accountNumber: "190365824988",
      qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=190365824988-TECHCOMBANK",
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
      qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=0011004567890-VCB",
    },
    bride: {
      name: "Mai Linh",
      title: "Cô Dâu",
      phone: "0909.888.999",
      bankName: "VPBANK",
      accountNumber: "123456789",
      qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=123456789-VPB",
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
];
