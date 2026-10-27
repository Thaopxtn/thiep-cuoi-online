import { describe, it, expect } from "vitest";
import {
  isContentBlock,
  getBoxBounds,
  isOverlapping,
  findCollidingNodes,
  findNextSafePosition,
  autoArrangeAllBlocks,
  shiftNodesBelow,
  resolveOverlapForMovedNode,
} from "../blockLayoutEngine";

describe("Cơ chế Chống Đè Khối & Tự Động Giãn Cách Bố Cục (Block Layout & Anti-Collision Engine)", () => {
  it("1. isContentBlock lọc chuẩn các khối nội dung và bỏ qua ROOT, họa tiết khóa", () => {
    expect(isContentBlock("ROOT", { props: {} })).toBe(false);
    expect(isContentBlock("random_node", { props: { hidden: true } })).toBe(false);
    expect(isContentBlock("text_1", { props: { top: 100, height: 50 }, type: { resolvedName: "TextBox" } })).toBe(true);
    expect(isContentBlock("photo_1", { props: { top: 200, height: 300 }, type: { resolvedName: "PhotoBox" } })).toBe(true);
  });

  it("2. isOverlapping phát hiện va chạm hình chữ nhật chính xác", () => {
    const boxA = { top: 100, left: 50, width: 400, height: 100, bottom: 200, right: 450 };
    // Box B đè trực tiếp lên Box A
    const boxB = { top: 150, left: 50, width: 400, height: 100, bottom: 250, right: 450 };
    expect(isOverlapping(boxA, boxB)).toBe(true);

    // Box C nằm hoàn toàn bên dưới Box A
    const boxC = { top: 250, left: 50, width: 400, height: 100, bottom: 350, right: 450 };
    expect(isOverlapping(boxA, boxC)).toBe(false);

    // Với minGap = 60, Box C (cách 50px) bị coi là trong vùng va chạm
    expect(isOverlapping(boxA, boxC, 60)).toBe(true);
  });

  it("3. findCollidingNodes tìm đúng danh sách các khối đang đè lên nhau", () => {
    const mockNodes = {
      ROOT: { props: { height: 1000 } },
      block1: { props: { top: 100, left: 50, width: 400, height: 100 } },
      block2: { props: { top: 150, left: 50, width: 400, height: 100 } }, // Đè block1
      block3: { props: { top: 500, left: 50, width: 400, height: 100 } }, // Không đè
    };

    const targetBounds = getBoxBounds(mockNodes.block1);
    const colliding = findCollidingNodes("block1", targetBounds, mockNodes);
    expect(colliding).toContain("block2");
    expect(colliding).not.toContain("block3");
  });

  it("4. findNextSafePosition tính toán tọa độ chèn mới không bị đè lên khối có sẵn", () => {
    const mockNodes = {
      ROOT: { props: { height: 1200 } },
      block1: { props: { top: 400, left: 50, width: 400, height: 150 } }, // Đáy 550
    };

    // Khi chèn với preferredTop = 400 (vị trí đã bị chiếm)
    const safePos = findNextSafePosition(mockNodes, 400, 100, 400, 50, 20);
    // Vị trí mới phải ở dưới đáy khối cũ (550 + 20 = 570)
    expect(safePos.top).toBeGreaterThanOrEqual(570);
  });

  it("5. autoArrangeAllBlocks tự động giãn cách tất cả các khối và triệt tiêu 100% va chạm", () => {
    const overlappingNodes: Record<string, any> = {
      ROOT: { props: { height: 1000 } },
      b1: { props: { top: 100, left: 50, width: 400, height: 100 } }, // bottom 200
      b2: { props: { top: 120, left: 50, width: 400, height: 100 } }, // Đè lên b1!
      b3: { props: { top: 150, left: 50, width: 400, height: 100 } }, // Đè lên cả b1 và b2!
      b4: { props: { top: 700, left: 50, width: 400, height: 100 } }, // Đứng xa
    };

    const { newNodes, movedCount, newCanvasHeight } = autoArrangeAllBlocks(overlappingNodes, 24);

    expect(movedCount).toBeGreaterThanOrEqual(2);

    // Kiểm tra không còn bất kỳ cặp khối nào đè lên nhau
    const top1 = newNodes.b1.props.top;
    const top2 = newNodes.b2.props.top;
    const top3 = newNodes.b3.props.top;
    const top4 = newNodes.b4.props.top;

    expect(top2).toBeGreaterThanOrEqual(top1 + 100 + 24); // b2 dưới b1
    expect(top3).toBeGreaterThanOrEqual(top2 + 100 + 24); // b3 dưới b2
    expect(newCanvasHeight).toBeGreaterThan(1000); // Canvas đã tự động mở rộng
  });

  it("6. resolveOverlapForMovedNode tự động đẩy các khối phía dưới khi di chuyển 1 khối vào vùng xung đột", () => {
    const nodes: Record<string, any> = {
      ROOT: { props: { height: 1200 } },
      existingA: { props: { top: 300, left: 50, width: 400, height: 120 } },
      existingB: { props: { top: 500, left: 50, width: 400, height: 100 } },
    };

    // Giả sử existingA bị kéo xuống đè lên existingB
    nodes.existingA.props.top = 450; // bottom 570 đè lên existingB (500)

    const { updatedNodes, hasOverlaps } = resolveOverlapForMovedNode(nodes, "existingA", 20);
    expect(hasOverlaps).toBe(true);
    expect(updatedNodes.existingB.props.top).toBeGreaterThanOrEqual(450 + 120 + 20);
  });
});
