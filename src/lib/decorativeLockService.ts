/**
 * Dịch vụ nhận diện, khóa cố định và khôi phục các họa tiết trang trí của mẫu thiệp cưới
 */

import hongPhongTemplateNodes from "@/data/templates/hong-phong-nodes.json";

// Danh sách ID của các họa tiết trang trí chuẩn trong mẫu Hồng Phong
export const HONG_PHONG_DECORATIVE_NODE_IDS = new Set([
  "JQjjxgrXA2", // Lâu đài mờ nền 1 (top 263.26)
  "8QJ_4Clvpb", // Lâu đài mờ nền 2 (top 856.3)
  "xIJnHQSkwo", // Lâu đài mờ nền 3 (top 2123)
  "JgEBdxHfZy", // Lâu đài mờ nền 4 (top 1601.7)
  "j8XWrl-BWu", // Lâu đài mờ nền 5 (top 3671.39)
  "787yCeVVDc", // Phong bì nền sau (envelope-background, top 207)
  "_3Dx3MkTv4", // Nắp phong bì trước có dấu sáp (envelope-cover, top 371.91)
  "yWiFdVn2l8", // Cành hoa trang trí 1 (flower2-decoration, top 160.4)
  "dXaSrjTL32", // Cành hoa trang trí 2 (flower2-decoration, top 1279.05)
  "Ix_W-87lEX", // Cành hoa trang trí 3 (flower2-decoration, top 2942.7)
  "fUjogRrV_V", // Khung nền đỏ burgundy lễ cưới (top 1086)
  "BjmOdLvqxw", // Khung nền đỏ burgundy tiệc cưới (top 2711.32)
  "I9rlPGqQP8", // Đường kẻ phân cách (top 1228.1)
  "o5y5NJh_Ec", // Vòng tròn dress code 1
  "IWGlTdTL5O", // Vòng tròn dress code 2
  "f0OZ3QSJec", // Vòng tròn dress code 3
  "zXnAZIrkEr", // Dải chuyển màu bóng đen chân thiệp (top 5027)
]);

// Danh sách ID của các khung ảnh cưới THỰC SỰ của cô dâu chú rể (không được khóa)
export const REAL_WEDDING_PHOTO_IDS = new Set([
  "U4ZPPsHPXy", // Khung ảnh cưới 1 nhô ra từ trong phong bì (top 182.83, nghiêng 9.38 độ, viền trắng 6px)
  "nc326y93D4", // Khung ảnh cưới 2 chân dung lớn ở chân thiệp (top 4904)
  "QYTywxODxL", // Tiện ích Album ảnh cưới trượt Carousel
]);

/**
 * Metadata định danh tiếng Việt và vị trí trực quan cho từng thành phần trong mẫu Hồng Phong
 */
export const HONG_PHONG_ELEMENT_METADATA: Record<
  string,
  {
    name: string;
    group: "decorative" | "photos" | "texts" | "widgets";
    description: string;
  }
> = {
  // 1. Nhóm 17 Họa tiết trang trí CỐ ĐỊNH
  "JQjjxgrXA2": {
    name: "Lâu đài mờ nền 1 (Mở đầu)",
    group: "decorative",
    description: "Họa tiết lâu đài chìm phong cách châu Âu đầu trang thiệp",
  },
  "787yCeVVDc": {
    name: "Phong bì thư đỏ (Lớp nền)",
    group: "decorative",
    description: "Đáy phong bì thư đựng ảnh cưới bên trong",
  },
  "_3Dx3MkTv4": {
    name: "Nắp phong bì & Dấu sáp đỏ",
    group: "decorative",
    description: "Nắp phong bì tiền cảnh đè lên ảnh với con dấu sáp niêm phong nghệ thuật",
  },
  "yWiFdVn2l8": {
    name: "Cành hoa trang trí 1 (Đầu thiệp)",
    group: "decorative",
    description: "Cành hoa cẩm tú cầu trang trí góc bên trái phong bì",
  },
  "8QJ_4Clvpb": {
    name: "Lâu đài mờ nền 2 (Dưới tên Dâu Rể)",
    group: "decorative",
    description: "Họa tiết lâu đài chìm phía dưới khối tên mở đầu",
  },
  "dXaSrjTL32": {
    name: "Cành hoa trang trí 2 (Lễ cưới)",
    group: "decorative",
    description: "Cành hoa trang trí góc trên bên phải khung Lễ Thành Hôn",
  },
  "xIJnHQSkwo": {
    name: "Lâu đài mờ nền 3 (Album cưới)",
    group: "decorative",
    description: "Họa tiết lâu đài chìm phía sau khối Album ảnh cưới",
  },
  "Ix_W-87lEX": {
    name: "Cành hoa trang trí 3 (Tiệc cưới)",
    group: "decorative",
    description: "Cành hoa trang trí cạnh khung Tiệc Cưới",
  },
  "JgEBdxHfZy": {
    name: "Lâu đài mờ nền 4 (Thông tin lễ)",
    group: "decorative",
    description: "Họa tiết lâu đài chìm phần thời gian hôn lễ",
  },
  "j8XWrl-BWu": {
    name: "Lâu đài mờ nền 5 (Bản đồ tiệc)",
    group: "decorative",
    description: "Họa tiết lâu đài chìm phần bản đồ địa điểm cưới",
  },
  "fUjogRrV_V": {
    name: "Khung nền đỏ burgundy - Lễ Cưới",
    group: "decorative",
    description: "Khung nền màu đỏ rượu sang trọng khu vực Lễ Thành Hôn",
  },
  "BjmOdLvqxw": {
    name: "Khung nền đỏ burgundy - Tiệc Cưới",
    group: "decorative",
    description: "Khung nền màu đỏ rượu sang trọng khu vực Tiệc Cưới",
  },
  "I9rlPGqQP8": {
    name: "Đường kẻ phân cách trang trí",
    group: "decorative",
    description: "Đường kẻ thanh mảnh màu kem phân tách thông tin phụ mẫu hai bên",
  },
  "o5y5NJh_Ec": {
    name: "Ô màu Dresscode - Đen",
    group: "decorative",
    description: "Gợi ý trang phục màu Đen cho khách mời",
  },
  "IWGlTdTL5O": {
    name: "Ô màu Dresscode - Đỏ Đô",
    group: "decorative",
    description: "Gợi ý trang phục màu Đỏ Đô cho khách mời",
  },
  "f0OZ3QSJec": {
    name: "Ô màu Dresscode - Đỏ Burgundy",
    group: "decorative",
    description: "Gợi ý trang phục màu Đỏ Rượu Burgundy",
  },
  "zXnAZIrkEr": {
    name: "Dải gradient bóng mờ chân thiệp",
    group: "decorative",
    description: "Hiệu ứng chuyển màu đen mờ nghệ thuật phía dưới ảnh chân thiệp",
  },

  // 2. Nhóm 3 Ảnh cưới Dâu - Rể
  "U4ZPPsHPXy": {
    name: "Ảnh cưới trong phong bì thư",
    group: "photos",
    description: "Khung ảnh cưới chính 1 nhô ra từ phong bì, viền trắng 6px, xoay 9.38°",
  },
  "nc326y93D4": {
    name: "Ảnh cưới chân dung toàn cảnh",
    group: "photos",
    description: "Khung ảnh cưới chính 2 khổ lớn đặt trang trọng tại chân thiệp",
  },
  "QYTywxODxL": {
    name: "Album ảnh cưới trượt Carousel",
    group: "photos",
    description: "Bộ sưu tập ảnh cưới trượt ngang nhiều tấm lưu giữ kỷ niệm",
  },

  // 3. Nhóm Tiện ích tương tác (Widgets)
  "rC0h9xBzTD": {
    name: "Đồng hồ đếm ngược ngày cưới",
    group: "widgets",
    description: "Đếm ngược thời gian chính xác tới ngày trọng đại",
  },
  "O2V1zaJCKH": {
    name: "Lịch cưới nổi bật",
    group: "widgets",
    description: "Lịch tháng làm nổi bật ngày tổ chức đám cưới",
  },
  "MVY4zgcUbs": {
    name: "Nút thêm vào Google Calendar",
    group: "widgets",
    description: "Khách mời bấm để thêm sự kiện vào lịch điện thoại",
  },
  "rhfL5xbYor": {
    name: "Bản đồ chỉ đường địa điểm tiệc",
    group: "widgets",
    description: "Dẫn đường khách mời đến đúng trung tâm tiệc cưới",
  },
  "GSFr3_8DOf": {
    name: "Biểu mẫu xác nhận tham dự (RSVP)",
    group: "widgets",
    description: "Khách mời gửi phản hồi tham dự và số người đi cùng",
  },
  "XSmtYO1kcO": {
    name: "Hộp quà mừng cưới VietQR Napas 24/7",
    group: "widgets",
    description: "Tự tạo mã VietQR chuẩn ngân hàng để khách quét mừng cưới tức thì",
  },

  // 4. Nhóm TextBox tiêu biểu
  "eyUekz081r": {
    name: "Lời mở đầu: Save the date",
    group: "texts",
    description: "Lời mở đầu trên đỉnh thiệp cưới",
  },
  "SQCFifGgBp": {
    name: "Tên Chú Rể (Đức Mạnh)",
    group: "texts",
    description: "Họ tên Chú Rể nổi bật ở phần bìa thiệp",
  },
  "lzlNpHEGaX": {
    name: "Ký tự nối (&)",
    group: "texts",
    description: "Dấu nối giữa tên Chú Rể và Cô Dâu",
  },
  "lxV9NGM9_a": {
    name: "Tên Cô Dâu (Lệ Quyên)",
    group: "texts",
    description: "Họ tên Cô Dâu nổi bật ở phần bìa thiệp",
  },
  "bw2IVrSlsI": {
    name: "Tiêu đề: Thông tin lễ cưới",
    group: "texts",
    description: "Tiêu đề phân đoạn Lễ Thành Hôn",
  },
  "Gai3OqoloN": {
    name: "Thân phụ Nhà Trai (Bố Chú Rể)",
    group: "texts",
    description: "Họ tên Bố Chú Rể",
  },
  "n6hsa-v8Jz": {
    name: "Thân mẫu Nhà Trai (Mẹ Chú Rể)",
    group: "texts",
    description: "Họ tên Mẹ Chú Rể",
  },
  "wd5DISufNh": {
    name: "Thân phụ Nhà Gái (Bố Cô Dâu)",
    group: "texts",
    description: "Họ tên Bố Cô Dâu",
  },
  "WDNkXF3j0m": {
    name: "Thân mẫu Nhà Gái (Mẹ Cô Dâu)",
    group: "texts",
    description: "Họ tên Mẹ Cô Dâu",
  },
  "VV_ZQGzHOX": {
    name: "Quê quán Nhà Trai",
    group: "texts",
    description: "Địa chỉ / Quê quán gia đình Chú Rể",
  },
  "aD-y0xUCDH": {
    name: "Quê quán Nhà Gái",
    group: "texts",
    description: "Địa chỉ / Quê quán gia đình Cô Dâu",
  },
  "GzPK7r9kG2": {
    name: "Lời báo tin Lễ Thành Hôn",
    group: "texts",
    description: "Trân trọng báo tin lễ thành hôn của con chúng tôi",
  },
  "wGk0GJqtnt": {
    name: "Tên Chú Rể (Phần Lễ Thành Hôn)",
    group: "texts",
    description: "Họ tên Chú Rể trong khung Lễ Thành Hôn",
  },
  "K7-srzclHc": {
    name: "Tên Cô Dâu (Phần Lễ Thành Hôn)",
    group: "texts",
    description: "Họ tên Cô Dâu trong khung Lễ Thành Hôn",
  },
  "C6t10yoFu_": {
    name: "Địa điểm cử hành Hôn Lễ",
    group: "texts",
    description: "Lễ thành hôn được cử hành tại tư gia",
  },
  "do7dfYf5JP": {
    name: "Giờ tổ chức Lễ Thành Hôn",
    group: "texts",
    description: "Thời gian cử hành lễ thành hôn (VD: Vào lúc 13:30)",
  },
  "idNEbCBqsR": {
    name: "Ngày tổ chức Hôn Lễ (Dương lịch)",
    group: "texts",
    description: "Con số ngày tổ chức Lễ Thành Hôn",
  },
  "3PIRPm3lcW": {
    name: "Ngày tổ chức Hôn Lễ (Âm lịch)",
    group: "texts",
    description: "Ngày tháng năm Âm lịch cử hành hôn lễ",
  },
  "6JVMqK6hUL": {
    name: "Tiêu đề: Thông tin tiệc cưới",
    group: "texts",
    description: "Tiêu đề phân đoạn Tiệc Cưới",
  },
  "NuyEFaaXwj": {
    name: "Giờ tổ chức Tiệc Cưới",
    group: "texts",
    description: "Thời gian bắt đầu tiệc cưới (VD: Vào lúc 16:30)",
  },
  "q8sGsrcjYH": {
    name: "Ngày tổ chức Tiệc Cưới (Dương lịch)",
    group: "texts",
    description: "Con số ngày tổ chức Tiệc Cưới",
  },
  "J16W4fR1Bt": {
    name: "Ngày tổ chức Tiệc Cưới (Âm lịch)",
    group: "texts",
    description: "Ngày tháng năm Âm lịch tổ chức tiệc cưới",
  },
  "-cEO6c91P7": {
    name: "Tiêu đề: Tiệc cưới tổ chức tại",
    group: "texts",
    description: "Tiêu đề địa điểm nhà hàng / trung tâm tiệc cưới",
  },
  "Rex8FmVasP": {
    name: "Địa chỉ Trung tâm tiệc cưới",
    group: "texts",
    description: "Địa chỉ chi tiết nơi diễn ra tiệc cưới",
  },
  "hitN8LqtmA": {
    name: "Tiêu đề: Dress Code",
    group: "texts",
    description: "Gợi ý trang phục dự tiệc cưới",
  },
  "WHar76RPUf": {
    name: "Tiêu đề: Mừng cưới",
    group: "texts",
    description: "Tiêu đề khu vực gửi quà mừng và quét mã VietQR",
  },
  "rjCZL_9vmf": {
    name: "Lời kết: Thank You",
    group: "texts",
    description: "Lời cảm ơn trang trọng kết thúc thiệp cưới",
  },
  "Z3Lpk0DCqV": {
    name: "Lời cảm ơn của Gia đình",
    group: "texts",
    description: "Cảm ơn Quý Khách đã dành tình cảm cho gia đình",
  },
  "MvywsMs4mj": {
    name: "Dòng thương hiệu ZenLove",
    group: "texts",
    description: "Dấu ấn nền tảng thiệp cưới trực tuyến",
  },
};

/**
 * Kiểu dữ liệu thành phần đã phân loại rõ ràng
 */
export interface TemplateElementItem {
  id: string;
  name: string;
  group: "decorative" | "photos" | "texts" | "widgets";
  groupTitle: string;
  type: string;
  top: number;
  left: number;
  zIndex: number;
  isLocked: boolean;
  isReplaceable: boolean;
  description: string;
  previewText?: string;
  previewImage?: string;
  props: any;
}

/**
 * Phân loại toàn bộ các thành phần của template thành 4 nhóm rõ ràng
 */
export function classifyTemplateElements(nodes: Record<string, any>): {
  decorativeList: TemplateElementItem[];
  photosList: TemplateElementItem[];
  textsList: TemplateElementItem[];
  widgetsList: TemplateElementItem[];
  allList: TemplateElementItem[];
  stats: {
    total: number;
    decorative: number;
    photos: number;
    texts: number;
    widgets: number;
  };
} {
  const entries = Object.entries(nodes || {}).filter(([id]) => id !== "ROOT");

  const decorativeList: TemplateElementItem[] = [];
  const photosList: TemplateElementItem[] = [];
  const textsList: TemplateElementItem[] = [];
  const widgetsList: TemplateElementItem[] = [];
  const allList: TemplateElementItem[] = [];

  entries.forEach(([id, node]) => {
    const type = node?.type?.resolvedName || "Widget";
    const props = node?.props || {};
    const top = Number(props.top) || 0;
    const left = Number(props.left) || 0;
    const zIndex = Number(props.zIndex) || 1;
    const meta = HONG_PHONG_ELEMENT_METADATA[id];

    let group: "decorative" | "photos" | "texts" | "widgets" = "widgets";
    let groupTitle = "Tiện ích";
    let name = meta?.name || `Phần tử ${type}`;
    let isLocked = Boolean(props.locked);
    let isReplaceable = Boolean(props.isReplaceable);
    let previewText: string | undefined = undefined;
    let previewImage: string | undefined = props.imgKey || props.src;

    // 1. Kiểm tra nếu là Họa tiết trang trí
    if (isDecorativeNode(id, node)) {
      group = "decorative";
      groupTitle = "Họa tiết cố định";
      isLocked = true;
      isReplaceable = false;
      if (!meta) {
        if (type === "PhotoBox") name = "Họa tiết hình ảnh trang trí";
        else if (type === "GeometricBox") name = "Hình khối nền trang trí";
        else if (type === "LineBox") name = "Đường kẻ trang trí";
        else name = `Họa tiết ${type}`;
      }
    }
    // 2. Kiểm tra nếu là Khung ảnh cưới
    else if (type === "PhotoBox" || type === "CarouselBox") {
      group = "photos";
      groupTitle = "Ảnh cưới Dâu - Rể";
      isLocked = false;
      isReplaceable = true;
      if (type === "CarouselBox") {
        previewImage = props.imgList?.[0]?.imageKey || props.imgList?.[0]?.src;
      }
    }
    // 3. Kiểm tra nếu là Văn bản
    else if (type === "TextBox") {
      group = "texts";
      groupTitle = "Văn bản thiệp cưới";
      isLocked = false;
      isReplaceable = true;
      const cleanText = (props.text || "").replace(/<[^>]+>/g, "").trim();
      previewText = cleanText;
      if (!meta) {
        name = cleanText ? `"${cleanText.substring(0, 28)}"` : "Khung chữ";
      }
    }
    // 4. Tiện ích tương tác
    else {
      group = "widgets";
      groupTitle = "Tiện ích tương tác";
      isLocked = false;
      isReplaceable = true;
      if (type === "GiftQrBox") previewText = "Quét mã chuyển khoản Napas 24/7";
      else if (type === "CountdownBoxV2") previewText = "Đồng hồ đếm ngược";
      else if (type === "CalendarBoxV2") previewText = "Lịch ngày cưới";
      else if (type === "MapBox") previewText = props.address || "Bản đồ";
      else if (type === "RsvpBoxV2") previewText = "Xác nhận tham dự";
    }

    const item: TemplateElementItem = {
      id,
      name,
      group,
      groupTitle,
      type,
      top,
      left,
      zIndex,
      isLocked,
      isReplaceable,
      description: meta?.description || `${type} tại vị trí top ${Math.round(top)}px`,
      previewText,
      previewImage,
      props,
    };

    allList.push(item);

    if (group === "decorative") decorativeList.push(item);
    else if (group === "photos") photosList.push(item);
    else if (group === "texts") textsList.push(item);
    else widgetsList.push(item);
  });

  // Sắp xếp các danh sách theo thứ tự top từ trên xuống dưới
  const sortByTop = (a: TemplateElementItem, b: TemplateElementItem) => a.top - b.top;
  decorativeList.sort(sortByTop);
  photosList.sort(sortByTop);
  textsList.sort(sortByTop);
  widgetsList.sort(sortByTop);
  allList.sort(sortByTop);

  return {
    decorativeList,
    photosList,
    textsList,
    widgetsList,
    allList,
    stats: {
      total: allList.length,
      decorative: decorativeList.length,
      photos: photosList.length,
      texts: textsList.length,
      widgets: widgetsList.length,
    },
  };
}

/**
 * Kiểm tra xem một node có phải là họa tiết trang trí của template hay không
 */
export function isDecorativeNode(nodeId: string, node?: any): boolean {
  if (!nodeId) return false;

  // Nếu là khung ảnh cưới thực sự -> Không phải họa tiết trang trí
  if (REAL_WEDDING_PHOTO_IDS.has(nodeId)) {
    return false;
  }

  // Nếu nằm trong danh sách họa tiết mẫu Hồng Phong
  if (HONG_PHONG_DECORATIVE_NODE_IDS.has(nodeId)) {
    return true;
  }

  const props = node?.props || {};
  const type = node?.type?.resolvedName || "";

  // Các GeometricBox và LineBox trang trí
  if (type === "LineBox" || (type === "GeometricBox" && !props.isCustomUserBox)) {
    return true;
  }

  // Kiểm tra đường dẫn ảnh của PhotoBox
  const key = (props.imgKey || props.src || "").toLowerCase();
  if (
    key.includes("/templates/") ||
    key.includes("resources/background") ||
    key.includes("resources/heartelements") ||
    key.includes("envelope-") ||
    key.includes("castle-") ||
    key.includes("flower2-") ||
    key.includes("wax-seal") ||
    key.includes("decoration") ||
    props.locked === true
  ) {
    return true;
  }

  return false;
}

/**
 * Lấy danh sách các PhotoBox THỰC SỰ đại diện cho ảnh cưới của cô dâu chú rể
 * (Tách biệt hoàn toàn khỏi các họa tiết trang trí)
 */
export function getRealWeddingPhotoSlots(nodes: Record<string, any>): Array<{
  id: string;
  type: string;
  props: any;
  zIndex: number;
}> {
  const childNodes = Object.entries(nodes)
    .filter(([id]) => id !== "ROOT")
    .map(([id, node]: [string, any]) => ({
      id,
      type: node.type?.resolvedName || "Widget",
      props: node.props || {},
      zIndex: node.props?.zIndex || 1,
    }));

  const realPhotos = childNodes.filter((n) => {
    if (n.type !== "PhotoBox") return false;

    // Loại bỏ 100% tất cả các họa tiết trang trí
    if (isDecorativeNode(n.id, nodes[n.id])) {
      return false;
    }

    // Luôn chấp nhận các slot ảnh cưới đã định danh
    if (REAL_WEDDING_PHOTO_IDS.has(n.id)) {
      return true;
    }

    // Bỏ qua các sticker nhỏ
    const w = Number(n.props.width) || 0;
    const h = Number(n.props.height) || 0;
    if (w < 80 || h < 80) return false;

    return true;
  });

  // Sắp xếp từ trên xuống dưới theo tọa độ top
  return realPhotos.sort(
    (a, b) => (Number(a.props.top) || 0) - (Number(b.props.top) || 0)
  );
}

/**
 * Khôi phục toàn bộ họa tiết trang trí về ảnh gốc và tọa độ chuẩn xác của template,
 * đồng thời khóa cố định không cho di chuyển (locked: true).
 */
export function repairAndLockDecorativeNodes(
  currentNodes: Record<string, any>
): {
  repairedNodes: Record<string, any>;
  repairedCount: number;
} {
  const templateSource = hongPhongTemplateNodes as Record<string, any>;
  const repairedNodes = { ...currentNodes };
  let repairedCount = 0;

  HONG_PHONG_DECORATIVE_NODE_IDS.forEach((id) => {
    const originalNode = templateSource[id];
    if (!originalNode) return;

    const currentNode = repairedNodes[id] || {};
    const currentProps = currentNode.props || {};
    const origProps = originalNode.props || {};

    let needsRepair = false;

    // 1. Kiểm tra imgKey có bị sửa sai không
    if (origProps.imgKey && currentProps.imgKey !== origProps.imgKey) {
      needsRepair = true;
    }

    // 2. Kiểm tra tọa độ có bị lệch quá 2px không
    if (
      Math.abs((currentProps.top ?? 0) - (origProps.top ?? 0)) > 2 ||
      Math.abs((currentProps.left ?? 0) - (origProps.left ?? 0)) > 2 ||
      Math.abs((currentProps.width ?? 0) - (origProps.width ?? 0)) > 2 ||
      Math.abs((currentProps.height ?? 0) - (origProps.height ?? 0)) > 2 ||
      (currentProps.rotation ?? 0) !== (origProps.rotation ?? 0)
    ) {
      needsRepair = true;
    }

    // 3. Khôi phục lại đúng mẫu chuẩn và gắn cờ khóa locked: true
    repairedNodes[id] = {
      ...originalNode,
      props: {
        ...origProps,
        // Khóa cố định
        locked: true,
        isDecorative: true,
      },
    };

    if (needsRepair) {
      repairedCount++;
    }
  });

  // Đảm bảo khung ảnh cưới bên trong phong bì U4ZPPsHPXy giữ đúng tọa độ chuẩn
  if (repairedNodes["U4ZPPsHPXy"]) {
    const origU4 = templateSource["U4ZPPsHPXy"];
    if (origU4) {
      repairedNodes["U4ZPPsHPXy"] = {
        ...repairedNodes["U4ZPPsHPXy"],
        props: {
          ...repairedNodes["U4ZPPsHPXy"].props,
          top: origU4.props.top,
          left: origU4.props.left,
          width: origU4.props.width,
          height: origU4.props.height,
          rotation: origU4.props.rotation,
          borderSize: origU4.props.borderSize || 6,
          borderColor: origU4.props.borderColor || "rgba(255, 255, 255, 1.00)",
          zIndex: 9, // Nằm trên phong bì sau (zIndex 8) và dưới nắp phong bì (zIndex 11)
          isReplaceable: true,
          locked: false, // Ảnh cưới cho phép người dùng thay ảnh
        },
      };
    }
  }

  return { repairedNodes, repairedCount };
}
