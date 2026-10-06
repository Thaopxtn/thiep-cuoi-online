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

    // 2. Kiểm tra tọa độ có bị lệch quá 5px không
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
