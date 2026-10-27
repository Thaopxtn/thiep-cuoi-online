/**
 * Bộ điều hướng và giải quyết va chạm khối trên bảng vẽ thiệp cưới (Block Layout & Anti-Collision Engine)
 * Đảm bảo các khối nội dung không bị đè lên nhau, tự động giãn cách và đẩy bố cục thông minh.
 */

import { isDecorativeNode } from "@/lib/decorativeLockService";

export interface BoxBounds {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

/**
 * Kiểm tra xem một node có phải là khối nội dung chính cần bảo vệ chống đè hay không.
 * (Bỏ qua ROOT, các họa tiết trang trí hoa văn nền / sticker đã khóa)
 */
export function isContentBlock(id: string, node: any): boolean {
  if (!node || id === "ROOT") return false;
  // Bỏ qua các họa tiết trang trí của mẫu (được thiết kế để nằm chìm/nổi ở góc)
  if (isDecorativeNode(id, node)) return false;
  // Bỏ qua các node bị ẩn hoặc không có kích thước
  if (node.props?.hidden === true) return false;
  return true;
}

/**
 * Lấy bounding box (tọa độ hình chữ nhật) của một node
 */
export function getBoxBounds(node: any): BoxBounds {
  const top = Number(node.props?.top ?? 0);
  const left = Number(node.props?.left ?? 0);
  const width = Math.max(1, Number(node.props?.width ?? 100));
  const height = Math.max(1, Number(node.props?.height ?? 100));
  return {
    top,
    left,
    width,
    height,
    bottom: top + height,
    right: left + width,
  };
}

/**
 * Kiểm tra 2 bounding box có đè lên nhau (va chạm) hay không (AABB Collision)
 * @param boxA Hộp thứ nhất
 * @param boxB Hộp thứ hai
 * @param minGap Khoảng cách đệm an toàn tối thiểu giữa 2 khối (mặc định 0px)
 */
export function isOverlapping(boxA: BoxBounds, boxB: BoxBounds, minGap = 0): boolean {
  // Nếu cách xa nhau theo trục ngang
  if (boxA.right < boxB.left || boxA.left > boxB.right) {
    return false;
  }
  // Nếu cách xa nhau theo trục dọc (xét cả khoảng đệm minGap)
  if (boxA.bottom + minGap <= boxB.top || boxA.top >= boxB.bottom + minGap) {
    return false;
  }
  return true;
}

/**
 * Tìm tất cả các khối nội dung đang va chạm / đè lên một khối mục tiêu
 */
export function findCollidingNodes(
  targetId: string,
  targetBounds: BoxBounds,
  nodes: Record<string, any>,
  minGap = 0
): string[] {
  const collidingIds: string[] = [];

  for (const [id, node] of Object.entries(nodes)) {
    if (id === targetId || !isContentBlock(id, node)) continue;
    const otherBounds = getBoxBounds(node);
    if (isOverlapping(targetBounds, otherBounds, minGap)) {
      collidingIds.push(id);
    }
  }

  return collidingIds;
}

/**
 * Tìm vị trí an toàn kế tiếp không bị đè lên bất kỳ khối nào
 */
export function findNextSafePosition(
  nodes: Record<string, any>,
  itemWidth = 400,
  itemHeight = 100,
  preferredTop = 400,
  preferredLeft?: number,
  minGap = 24
): { top: number; left: number; shiftAmount: number; shiftThresholdY: number } {
  const canvasWidth = 500;
  const targetLeft =
    preferredLeft !== undefined
      ? preferredLeft
      : Math.max(20, Math.round((canvasWidth - itemWidth) / 2));

  let candidateTop = preferredTop;
  let testBounds: BoxBounds = {
    top: candidateTop,
    left: targetLeft,
    width: itemWidth,
    height: itemHeight,
    bottom: candidateTop + itemHeight,
    right: targetLeft + itemWidth,
  };

  // Kiểm tra xem có khối nào va chạm tại candidateTop không
  const collisions = findCollidingNodes("__NEW__", testBounds, nodes, 4);

  if (collisions.length === 0) {
    return {
      top: candidateTop,
      left: targetLeft,
      shiftAmount: 0,
      shiftThresholdY: candidateTop,
    };
  }

  // Nếu có va chạm, tìm khối va chạm có đáy thấp nhất
  let maxCollisionBottom = candidateTop;
  for (const colId of collisions) {
    const colBounds = getBoxBounds(nodes[colId]);
    if (colBounds.bottom > maxCollisionBottom) {
      maxCollisionBottom = colBounds.bottom;
    }
  }

  // Đặt khối mới ngay dưới khối va chạm sâu nhất
  candidateTop = maxCollisionBottom + minGap;

  return {
    top: candidateTop,
    left: targetLeft,
    shiftAmount: itemHeight + minGap,
    shiftThresholdY: candidateTop,
  };
}

/**
 * Đẩy các khối phía dưới xuống một khoảng shiftAmount khi có khối mới chèn vào
 */
export function shiftNodesBelow(
  nodes: Record<string, any>,
  thresholdY: number,
  shiftAmount: number,
  excludeIds: string[] = []
): Record<string, any> {
  const updatedNodes = { ...nodes };
  const excludeSet = new Set(excludeIds);

  let maxBottom = 0;

  Object.entries(updatedNodes).forEach(([id, node]) => {
    if (id === "ROOT" || excludeSet.has(id)) return;

    const top = Number(node.props?.top ?? 0);
    const height = Number(node.props?.height ?? 100);

    if (top >= thresholdY) {
      const newTop = top + shiftAmount;
      updatedNodes[id] = {
        ...node,
        props: {
          ...node.props,
          top: newTop,
        },
      };
      if (newTop + height > maxBottom) {
        maxBottom = newTop + height;
      }
    } else {
      if (top + height > maxBottom) {
        maxBottom = top + height;
      }
    }
  });

  // Tự động mở rộng chiều cao canvas ROOT
  if (updatedNodes["ROOT"]) {
    const currentHeight = Number(updatedNodes["ROOT"].props?.height ?? 1200);
    const neededHeight = Math.max(currentHeight + shiftAmount, maxBottom + 120);
    updatedNodes["ROOT"] = {
      ...updatedNodes["ROOT"],
      props: {
        ...updatedNodes["ROOT"].props,
        height: Math.round(neededHeight),
      },
    };
  }

  return updatedNodes;
}

/**
 * Tự động sắp xếp và chống đè cho TẤT CẢ các khối nội dung trên thiệp cưới (Auto-Arrange All Blocks)
 * - Sắp xếp tuần tự từ trên xuống dưới
 * - Đảm bảo giữa 2 khối liền kề luôn có khoảng cách tối thiểu minGap (mặc định 24px)
 * - Không làm lệch vị trí ngang (left) của người dùng
 * - Giữ nguyên các họa tiết trang trí của mẫu
 */
export function autoArrangeAllBlocks(
  nodes: Record<string, any>,
  minGap = 24
): { newNodes: Record<string, any>; movedCount: number; newCanvasHeight: number } {
  const newNodes = { ...nodes };

  // 1. Thu thập tất cả các khối nội dung cần chống đè
  const contentItems: Array<{ id: string; top: number; height: number; bottom: number }> = [];

  for (const [id, node] of Object.entries(newNodes)) {
    if (!isContentBlock(id, node)) continue;
    const top = Number(node.props?.top ?? 0);
    const height = Math.max(20, Number(node.props?.height ?? 80));
    contentItems.push({
      id,
      top,
      height,
      bottom: top + height,
    });
  }

  // 2. Sắp xếp các khối theo thứ tự xuất hiện từ trên xuống dưới
  contentItems.sort((a, b) => a.top - b.top);

  let movedCount = 0;
  let currentBottomTracker = 0;

  // 3. Quét từng khối và đẩy xuống nếu bị đè lên khối phía trước
  for (let i = 0; i < contentItems.length; i++) {
    const item = contentItems[i];
    const node = newNodes[item.id];
    const currentTop = Number(node.props?.top ?? item.top);
    const height = item.height;

    if (i === 0) {
      currentBottomTracker = currentTop + height;
      continue;
    }

    // Nếu khối này có đỉnh nhỏ hơn đáy của khối trước + khoảng đệm minGap
    const requiredTop = currentBottomTracker + minGap;
    if (currentTop < requiredTop) {
      const deltaY = requiredTop - currentTop;
      const newTop = requiredTop;

      newNodes[item.id] = {
        ...node,
        props: {
          ...node.props,
          top: Math.round(newTop),
        },
      };

      currentBottomTracker = newTop + height;
      movedCount++;
    } else {
      currentBottomTracker = currentTop + height;
    }
  }

  // 4. Cập nhật chiều cao tổng thể của Canvas ROOT
  const canvasPaddingBottom = 160;
  const calculatedCanvasHeight = Math.max(1200, Math.round(currentBottomTracker + canvasPaddingBottom));

  if (newNodes["ROOT"]) {
    newNodes["ROOT"] = {
      ...newNodes["ROOT"],
      props: {
        ...newNodes["ROOT"].props,
        height: calculatedCanvasHeight,
      },
    };
  }

  return {
    newNodes,
    movedCount,
    newCanvasHeight: calculatedCanvasHeight,
  };
}

/**
 * Tự động đẩy các khối phía dưới ra xa khi một khối đang di chuyển bị đè lên các khối khác
 */
export function resolveOverlapForMovedNode(
  nodes: Record<string, any>,
  movedNodeId: string,
  minGap = 20
): { updatedNodes: Record<string, any>; hasOverlaps: boolean } {
  const movedNode = nodes[movedNodeId];
  if (!movedNode || !isContentBlock(movedNodeId, movedNode)) {
    return { updatedNodes: nodes, hasOverlaps: false };
  }

  const movedBounds = getBoxBounds(movedNode);
  const collidingIds = findCollidingNodes(movedNodeId, movedBounds, nodes, minGap);

  if (collidingIds.length === 0) {
    return { updatedNodes: nodes, hasOverlaps: false };
  }

  // Tìm các khối va chạm nằm ở vị trí ngang hàng hoặc thấp hơn
  const affectedNodes = collidingIds
    .map((id) => ({ id, bounds: getBoxBounds(nodes[id]) }))
    .filter((item) => item.bounds.bottom > movedBounds.top);

  if (affectedNodes.length === 0) {
    return { updatedNodes: nodes, hasOverlaps: false };
  }

  // Tính lượng đẩy: cần đẩy các khối bị đè xuống vị trí dưới đáy của movedNode
  const pushThreshold = movedBounds.top;
  const shiftAmount = Math.max(minGap, movedBounds.bottom + minGap - Math.min(...affectedNodes.map((a) => a.bounds.top)));

  const updatedNodes = shiftNodesBelow(nodes, pushThreshold, shiftAmount, [movedNodeId]);

  return { updatedNodes, hasOverlaps: true };
}
