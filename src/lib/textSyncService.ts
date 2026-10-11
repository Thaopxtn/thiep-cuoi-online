/**
 * Dịch vụ tự động đồng bộ hai chiều cho các trường văn bản liên quan trong thiệp cưới
 */

import { WeddingCard } from "@/data/initialCards";

// Định nghĩa các nhóm node liên quan lặp lại trong mẫu thiệp cưới Hồng Phong
export interface TextSyncGroup {
  id: string;
  field: "groomName" | "brideName" | "weddingDay" | "weddingMonth" | "weddingYear" | "lunarDate";
  label: string;
  nodeIds: string[];
}

export const LINKED_TEXT_GROUPS: TextSyncGroup[] = [
  {
    id: "group-groom-name",
    field: "groomName",
    label: "Tên Chú Rể",
    nodeIds: ["SQCFifGgBp", "wGk0GJqtnt"], // Bìa thiệp & Khung Lễ Thành Hôn
  },
  {
    id: "group-bride-name",
    field: "brideName",
    label: "Tên Cô Dâu",
    nodeIds: ["lxV9NGM9_a", "K7-srzclHc"], // Bìa thiệp & Khung Lễ Thành Hôn
  },
  {
    id: "group-wedding-day",
    field: "weddingDay",
    label: "Ngày cưới (Dương lịch)",
    nodeIds: ["idNEbCBqsR", "q8sGsrcjYH"], // Ngày lễ cưới & Ngày tiệc cưới
  },
  {
    id: "group-wedding-month",
    field: "weddingMonth",
    label: "Tháng cưới (Dương lịch)",
    nodeIds: ["VWhHrL3qvb", "A6SqlrSM2E"], // Tháng lễ cưới & Tháng tiệc cưới
  },
  {
    id: "group-wedding-year",
    field: "weddingYear",
    label: "Năm cưới",
    nodeIds: ["DtVx52EZAU", "06wpm_i4mZ"], // Năm lễ cưới & Năm tiệc cưới
  },
  {
    id: "group-lunar-date",
    field: "lunarDate",
    label: "Ngày cưới (Âm lịch)",
    nodeIds: ["3PIRPm3lcW", "J16W4fR1Bt"], // Âm lịch lễ cưới & Âm lịch tiệc cưới
  },
];

/**
 * Kiểm tra xem một node có thuộc nhóm liên kết đồng bộ hay không
 */
export function getLinkedTextGroup(nodeId: string): TextSyncGroup | null {
  for (const group of LINKED_TEXT_GROUPS) {
    if (group.nodeIds.includes(nodeId)) {
      return group;
    }
  }
  return null;
}

/**
 * Tự động đồng bộ các node văn bản cùng nhóm khi có một node thay đổi nội dung text
 */
export function syncLinkedTextNodes(
  updatedNodeId: string,
  updatedText: string,
  currentNodes: Record<string, any>,
  currentCard?: WeddingCard | null
): {
  syncedNodes: Record<string, any>;
  hasChanges: boolean;
  syncedField?: string;
  updatedCardPatch?: Partial<WeddingCard>;
} {
  const group = getLinkedTextGroup(updatedNodeId);
  if (!group) {
    return { syncedNodes: currentNodes, hasChanges: false };
  }

  const syncedNodes = { ...currentNodes };
  let hasChanges = false;
  const updatedCardPatch: Partial<WeddingCard> = {};

  // Lấy text thuần để đồng bộ vào Card metadata
  const plainText = (updatedText || "").replace(/<[^>]+>/g, "").trim();

  // 1. Cập nhật các node khác trong cùng nhóm
  group.nodeIds.forEach((id) => {
    if (id !== updatedNodeId && syncedNodes[id]) {
      const existingText = syncedNodes[id]?.props?.text || "";
      if (existingText !== updatedText) {
        syncedNodes[id] = {
          ...syncedNodes[id],
          props: {
            ...syncedNodes[id].props,
            text: updatedText,
          },
        };
        hasChanges = true;
      }
    }
  });

  // 2. Đồng bộ tương ứng vào Card metadata nếu có
  if (plainText) {
    if (group.field === "groomName") {
      updatedCardPatch.groom = {
        title: "Chú rể",
        phone: "",
        ...(currentCard?.groom || {}),
        name: plainText,
      };
    } else if (group.field === "brideName") {
      updatedCardPatch.bride = {
        title: "Cô dâu",
        phone: "",
        ...(currentCard?.bride || {}),
        name: plainText,
      };
    } else if (group.field === "lunarDate") {
      updatedCardPatch.lunarDate = plainText;
    }
  }

  return {
    syncedNodes,
    hasChanges,
    syncedField: group.label,
    updatedCardPatch: Object.keys(updatedCardPatch).length > 0 ? updatedCardPatch : undefined,
  };
}

/**
 * Tự động đồng bộ thông tin cô dâu, chú rể, ngày cưới từ WeddingCard vào toàn bộ cây Canvas nodes
 */
export function syncCardDataToCanvasNodes(
  card: Partial<WeddingCard>,
  currentNodes: Record<string, any>
): { syncedNodes: Record<string, any>; hasChanges: boolean } {
  if (!currentNodes || Object.keys(currentNodes).length === 0) {
    return { syncedNodes: currentNodes, hasChanges: false };
  }

  const syncedNodes = { ...currentNodes };
  let hasChanges = false;

  const groom = card.groom?.name?.trim();
  const bride = card.bride?.name?.trim();
  const dateStr = card.weddingDate; // YYYY-MM-DD
  const lunar = card.lunarDate?.trim();

  let day = "";
  let month = "";
  let year = "";
  if (dateStr && dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      year = parts[0];
      month = String(parseInt(parts[1], 10));
      day = String(parseInt(parts[2], 10));
    }
  }

  // 1. Cập nhật theo nhóm LINKED_TEXT_GROUPS nếu có
  LINKED_TEXT_GROUPS.forEach((group) => {
    let targetText = "";
    if (group.field === "groomName" && groom) targetText = groom;
    else if (group.field === "brideName" && bride) targetText = bride;
    else if (group.field === "weddingDay" && day) targetText = day;
    else if (group.field === "weddingMonth" && month) targetText = `tháng ${month}`;
    else if (group.field === "weddingYear" && year) targetText = `năm ${year}`;
    else if (group.field === "lunarDate" && lunar) targetText = lunar;

    if (targetText) {
      group.nodeIds.forEach((nodeId) => {
        if (syncedNodes[nodeId] && syncedNodes[nodeId].type?.resolvedName === "TextBox") {
          const currentText = syncedNodes[nodeId].props?.text || "";
          if (currentText !== targetText) {
            syncedNodes[nodeId] = {
              ...syncedNodes[nodeId],
              props: {
                ...syncedNodes[nodeId].props,
                text: targetText,
              },
            };
            hasChanges = true;
          }
        }
      });
    }
  });

  // 2. Tự động đồng bộ các node ghép tên "A & B" hoặc "A và B"
  if (groom && bride) {
    Object.entries(syncedNodes).forEach(([id, node]: [string, any]) => {
      if (node.type?.resolvedName === "TextBox" && typeof node.props?.text === "string") {
        const text = node.props.text.replace(/<[^>]*>/g, "").trim();
        if ((text.includes("&") || text.includes("và")) && text.length < 50 && !text.includes("Save")) {
          const connector = text.includes("&") ? "&" : "và";
          const newText = `${groom} ${connector} ${bride}`;
          if (text !== newText) {
            syncedNodes[id] = {
              ...node,
              props: {
                ...node.props,
                text: newText,
              },
            };
            hasChanges = true;
          }
        }
      }
    });
  }

  return { syncedNodes, hasChanges };
}

