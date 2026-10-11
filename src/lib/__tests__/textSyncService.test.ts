import { describe, it, expect } from "vitest";
import { syncCardDataToCanvasNodes, LINKED_TEXT_GROUPS } from "../textSyncService";
import type { WeddingCard } from "@/data/initialCards";

describe("textSyncService - syncCardDataToCanvasNodes", () => {
  const mockCard: WeddingCard = {
    id: "test-card-1",
    slug: "test-card-slug",
    name: "Thiệp Cưới Mẫu",
    templateId: "tpl-1",
    templateName: "Hồng Phong",
    status: "published",
    updatedAt: "11/10/2026",
    views: 10,
    coverImage: "https://example.com/cover.jpg",
    story: "Câu chuyện tình yêu",
    weddingDate: "2026-12-25",
    weddingTime: "11:30",
    lunarDate: "Ngày 16 tháng 11 năm Bính Ngọ",
    groom: {
      name: "Thế Hùng",
      title: "Chú Rể",
      phone: "0912345678",
      bankName: "MB BANK",
      accountNumber: "123456789",
    },
    bride: {
      name: "Thanh Trúc",
      title: "Cô Dâu",
      phone: "0987654321",
      bankName: "TECHCOMBANK",
      accountNumber: "987654321",
    },
    events: [],
    album: [],
    musicTitle: "Beautiful In White",
    musicUrl: "",
    rsvps: [],
    wishes: [],
  };

  const initialNodes = {
    ROOT: {
      type: { resolvedName: "CanvasContainer" },
      props: {},
    },
    // Paired names node
    tb_names: {
      type: { resolvedName: "TextBox" },
      props: {
        text: "Minh Vinh & Kim Hạnh",
      },
    },
    // Linked group groom node (from LINKED_TEXT_GROUPS)
    SQCFifGgBp: {
      type: { resolvedName: "TextBox" },
      props: {
        text: "Minh Vinh",
      },
    },
    // Linked group bride node (from LINKED_TEXT_GROUPS)
    lxV9NGM9_a: {
      type: { resolvedName: "TextBox" },
      props: {
        text: "Kim Hạnh",
      },
    },
    // Linked group day node
    idNEbCBqsR: {
      type: { resolvedName: "TextBox" },
      props: {
        text: "18",
      },
    },
    // Non-text node
    other_node: {
      type: { resolvedName: "ImageBlock" },
      props: {
        src: "https://example.com/photo.jpg",
      },
    },
  };

  it("should sync groom and bride names into paired TextBox nodes", () => {
    const { syncedNodes, hasChanges } = syncCardDataToCanvasNodes(mockCard, initialNodes);
    expect(hasChanges).toBe(true);
    expect(syncedNodes.tb_names.props.text).toBe("Thế Hùng & Thanh Trúc");
  });

  it("should sync linked groom and bride individual nodes", () => {
    const { syncedNodes } = syncCardDataToCanvasNodes(mockCard, initialNodes);
    expect(syncedNodes.SQCFifGgBp.props.text).toBe("Thế Hùng");
    expect(syncedNodes.lxV9NGM9_a.props.text).toBe("Thanh Trúc");
  });

  it("should sync wedding day into linked date node", () => {
    const { syncedNodes } = syncCardDataToCanvasNodes(mockCard, initialNodes);
    expect(syncedNodes.idNEbCBqsR.props.text).toBe("25");
  });

  it("should preserve non-text nodes intact", () => {
    const { syncedNodes } = syncCardDataToCanvasNodes(mockCard, initialNodes);
    expect(syncedNodes.other_node.props.src).toBe("https://example.com/photo.jpg");
    expect(syncedNodes.ROOT).toEqual(initialNodes.ROOT);
  });
});
