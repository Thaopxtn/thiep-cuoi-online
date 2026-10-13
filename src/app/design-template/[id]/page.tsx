"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import EditorHeader from "@/components/editor/EditorHeader";
import EditorLeftRail, { EditorToolTab } from "@/components/editor/EditorLeftRail";
import EditorLeftDrawer from "@/components/editor/EditorLeftDrawer";
import EditorCanvas from "@/components/editor/EditorCanvas";
import EditorRightInspector, { SelectedElementData } from "@/components/editor/EditorRightInspector";
import EditorPublishModal from "@/components/editor/EditorPublishModal";
import EditorShortcutsModal from "@/components/editor/EditorShortcutsModal";
import EditorLivePreviewModal from "@/components/editor/EditorLivePreviewModal";
import EditorWeddingSettingsModal from "@/components/editor/EditorWeddingSettingsModal";
import EditorAutoFillModal from "@/components/editor/EditorAutoFillModal";
import EditorPublishWarningModal from "@/components/editor/EditorPublishWarningModal";
import ZenlovePreviewModal from "@/components/templates/ZenlovePreviewModal";
import { getTemplateById, TEMPLATES_DATA } from "@/data/templatesData";
import { ZENLOVE_TEMPLATES, ZenLoveTemplate, findZenloveTemplate } from "@/data/zenloveTemplates";
import { saveCard, saveCardAsync, getCardByIdOrSlug, WeddingCard } from "@/lib/weddingCardService";
import { generateBrandedWeddingSlug } from "@/lib/brandedSlug";
import { useAuth } from "@/context/AuthContext";
import { smartRemoveBackground } from "@/lib/backgroundRemoval";
import { convertFormTemplateToCanvasNodes } from "@/lib/templateFormAdapter";
import { validateTemplateCompletion, ValidationWarning } from "@/lib/templateValidation";
import { getStoredTemplateById } from "@/lib/templateStorage";
import {
  addUploadedImagesToLibrary,
  addUploadedImageToLibrary,
  getSavedUploadedImages,
  extractImagesFromNodes,
} from "@/lib/mediaLibraryService";
import {
  repairAndLockDecorativeNodes,
  isDecorativeNode,
  getRealWeddingPhotoSlots,
} from "@/lib/decorativeLockService";
import { extractWeddingDetailsFromTemplate } from "@/lib/templateExtractor";
import { syncLinkedTextNodes } from "@/lib/textSyncService";
import { downloadCardImageAsPng } from "@/lib/cardImageExporter";
import {
  generateTimelineHtml,
  generateDressCodeHtml,
  generateCeremonyHtml,
  generateFamilyInfoHtml,
  generateBankCardHtml,
} from "@/lib/moduleHelpers";

export default function DesignTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId =
    (params?.id as string) || "8c5055d8-30db-4b38-8831-e11063e3d352";
  const { user, isLoggedIn, openLoginModal } = useAuth();

  // Template info
  const [templateName, setTemplateName] = useState<string>("Hồng Phong");
  const [currentZenloveTemplate, setCurrentZenloveTemplate] = useState<ZenLoveTemplate | null>(null);

  // Canvas nodes tree
  const [nodes, setNodes] = useState<Record<string, any>>({});
  const [history, setHistory] = useState<Array<Record<string, any>>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Selected element for inspector & canvas bounding box
  const [selectedElement, setSelectedElement] = useState<SelectedElementData | null>(null);

  // Left tools state
  const [activeLeftTab, setActiveLeftTab] = useState<EditorToolTab>("image");
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(true);

  // Zoom controls
  const [zoomLevel, setZoomLevel] = useState(0.85);

  // Modals state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [publishWarnings, setPublishWarnings] = useState<ValidationWarning[]>([]);
  const [customCardData, setCustomCardData] = useState<WeddingCard | null>(null);
  const [isSaved, setIsSaved] = useState(true);

  // Persistent music and toast state
  const [currentMusic, setCurrentMusic] = useState<{ title: string; url: string }>({
    title: "Beautiful In White - Shane Filan",
    url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [hasLocalSession, setHasLocalSession] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("zenlove_auth_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.id || parsed.email)) {
            setHasLocalSession(true);
            if (!isLoggedIn) {
              window.dispatchEvent(new CustomEvent("zenlove:auth-changed", { detail: parsed }));
            }
          }
        }
      } catch (e) {
        console.error("Lỗi đọc session dự phòng:", e);
      }
    }
  }, [isLoggedIn]);

  const isAuthenticated = isLoggedIn || hasLocalSession;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Push new state to history
  const pushHistory = useCallback(
    (newNodes: Record<string, any>) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newNodes];
      });
      setHistoryIndex((prev) => prev + 1);
      setIsSaved(false);
      setTimeout(() => setIsSaved(true), 1200);
    },
    [historyIndex]
  );

  // Fetch real template nodes from API
  useEffect(() => {
    let isMounted = true;

    async function loadTemplate() {
      // 1. Kiểm tra thiệp cưới đã clone / tùy biến trong weddingCardService
      const existingCard = getCardByIdOrSlug(templateId);
      if (existingCard) {
        setCustomCardData(existingCard);
        if (existingCard.templateName) setTemplateName(existingCard.templateName);
        if (existingCard.musicUrl) {
          setCurrentMusic({
            title: existingCard.musicTitle || "Bản nhạc cưới",
            url: existingCard.musicUrl,
          });
        }
        if (existingCard.nodes && Object.keys(existingCard.nodes).length > 2) {
          if (!isMounted) return;
          let cardNodes = existingCard.nodes;
          if (!cardNodes.ROOT) {
            cardNodes = convertFormTemplateToCanvasNodes(cardNodes, existingCard);
          }
          // Tự động khôi phục và khóa cố định các họa tiết trang trí chuẩn của template (chỉ áp dụng cho Hồng Phong, dọn dẹp các node ngoại lai cho mẫu khác)
          const targetTplId = existingCard.templateId || templateId;
          const { repairedNodes: repairedCardNodes } = repairAndLockDecorativeNodes(cardNodes, targetTplId);
          cardNodes = repairedCardNodes;
          setNodes(cardNodes);
          setHistory([cardNodes]);
          setHistoryIndex(0);

          // Select initial photo - ưu tiên ảnh cưới đầu tiên từ trên xuống của chính mẫu
          const realSlots = getRealWeddingPhotoSlots(cardNodes, targetTplId);
          const targetPhotoNode = realSlots[0]
            ? [realSlots[0].id, cardNodes[realSlots[0].id]]
            : Object.entries(cardNodes).find(
                ([, n]: [string, any]) =>
                  n.type?.resolvedName === "PhotoBox" &&
                  (n.props?.isReplaceable || n.props?.previewKey)
              );

          if (targetPhotoNode) {
            const [id, node] = targetPhotoNode as [string, any];
            setSelectedElement({
              id,
              type: "PhotoBox",
              props: node.props || {},
            });
          }
          showToast(`✨ Đã mở thiệp cưới: "${existingCard.name}"`);
          return;
        }
      }

      // 2. Tìm template meta trong ZENLOVE_TEMPLATES
      const foundMeta = ZENLOVE_TEMPLATES.find(
        (t) => t.id === templateId || t.slug === templateId
      );
      if (foundMeta) {
        setTemplateName(foundMeta.name);
        setCurrentZenloveTemplate(foundMeta);
      }

      try {
        const res = await fetch(`/api/zenlove-template/${templateId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.parsedNodes) {
            if (!isMounted) return;
            let fetchedNodes = json.data.parsedNodes;
            if (!fetchedNodes.ROOT) {
              fetchedNodes = convertFormTemplateToCanvasNodes(fetchedNodes, foundMeta || json.data);
            }
            // Tự động khôi phục và khóa cố định các họa tiết trang trí chuẩn của template (chỉ áp dụng cho Hồng Phong, dọn dẹp cho mẫu khác)
            const { repairedNodes: repairedFetchedNodes } = repairAndLockDecorativeNodes(fetchedNodes, templateId);
            fetchedNodes = repairedFetchedNodes;
            setNodes(fetchedNodes);
            setHistory([fetchedNodes]);
            setHistoryIndex(0);

            if (json.data?.name) {
              setTemplateName(json.data.name);
            }

            // Sync music from audioSettings, template nodes or metadata
            if (json.data?.audioSettings?.fileUrl) {
              setCurrentMusic({
                title: json.data.audioSettings.musicTitle || "Bản nhạc cưới",
                url: json.data.audioSettings.fileUrl,
              });
            } else if (fetchedNodes["ROOT"]?.props?.musicUrl) {
              setCurrentMusic({
                title: fetchedNodes["ROOT"].props.musicTitle || "Bản nhạc cưới",
                url: fetchedNodes["ROOT"].props.musicUrl,
              });
            } else if (foundMeta?.musicUrl) {
              setCurrentMusic({
                title: foundMeta.musicName || "Thiên đường với người thương",
                url: foundMeta.musicUrl,
              });
            }

            // Select initial photo element - chọn đúng ảnh chân dung đầu tiên từ trên xuống của chính template
            const realSlots = getRealWeddingPhotoSlots(fetchedNodes, templateId);
            const targetPhotoNode = realSlots[0]
              ? [realSlots[0].id, fetchedNodes[realSlots[0].id]]
              : Object.entries(fetchedNodes).find(
                  ([id, n]: [string, any]) =>
                    n.type?.resolvedName === "PhotoBox" &&
                    (n.props?.isReplaceable || n.props?.previewKey)
                );

            if (targetPhotoNode) {
              const [id, node] = targetPhotoNode as [string, any];
              setSelectedElement({
                id,
                type: "PhotoBox",
                props: node.props || {},
              });
            }
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch template API, using fallback preset:", err);
      }

      // Fallback: check stored or presets
      const local = getStoredTemplateById(templateId) || getTemplateById(templateId);
      if (local && isMounted) {
        setTemplateName(local.title);
        // Create basic nodes tree
        const initialNodes: Record<string, any> = {
          ROOT: {
            type: { resolvedName: "Container" },
            props: {
              width: 500,
              height: 4800,
              backgroundColor: "#fffbfa",
            },
          },
          photo_hero: {
            type: { resolvedName: "PhotoBox" },
            props: {
              top: 180,
              left: 120,
              width: 260,
              height: 350,
              imgKey: local.image,
              isReplaceable: true,
              zIndex: 10,
              borderRadius: [16, 16, 16, 16],
            },
          },
          text_title: {
            type: { resolvedName: "TextBox" },
            props: {
              top: 560,
              left: 50,
              width: 400,
              height: 60,
              text: local.title,
              fontSize: 36,
              color: "#1c171a",
              textAlign: "center",
              zIndex: 12,
            },
          },
        };
        setNodes(initialNodes);
        setHistory([initialNodes]);
        setHistoryIndex(0);
        setSelectedElement({
          id: "photo_hero",
          type: "PhotoBox",
          props: initialNodes.photo_hero.props,
        });
      }
    }

    loadTemplate();

    return () => {
      isMounted = false;
    };
  }, [templateId]);

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevNodes = history[historyIndex - 1];
      setNodes(prevNodes);
      setHistoryIndex(historyIndex - 1);
      if (selectedElement && prevNodes[selectedElement.id]) {
        setSelectedElement({
          ...selectedElement,
          props: prevNodes[selectedElement.id].props,
        });
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextNodes = history[historyIndex + 1];
      setNodes(nextNodes);
      setHistoryIndex(historyIndex + 1);
      if (selectedElement && nextNodes[selectedElement.id]) {
        setSelectedElement({
          ...selectedElement,
          props: nextNodes[selectedElement.id].props,
        });
      }
    }
  };

  // Update element properties with two-way smart sync
  const handleUpdateProps = (elementId: string, updatedProps: Record<string, any>) => {
    setNodes((prev) => {
      const existing = prev[elementId];
      if (!existing) return prev;

      // Bảo vệ: Nếu là họa tiết trang trí của mẫu, tuyệt đối không cho phép đổi imgKey
      if (
        isDecorativeNode(elementId, existing) &&
        updatedProps.imgKey &&
        updatedProps.imgKey !== existing.props.imgKey
      ) {
        showToast("🔒 Họa tiết trang trí của mẫu đã được khóa cố định!");
        return prev;
      }

      const nextNode = {
        ...existing,
        props: { ...existing.props, ...updatedProps },
      };
      let newNodes = { ...prev, [elementId]: nextNode };

      // ================= ĐỒNG BỘ HAI CHIỀU THÔNG MINH CHO VĂN BẢN (Text Synchronization) =================
      if (typeof updatedProps.text === "string") {
        const { syncedNodes, hasChanges, syncedField, updatedCardPatch } = syncLinkedTextNodes(
          elementId,
          updatedProps.text,
          newNodes,
          customCardData
        );
        if (hasChanges) {
          newNodes = syncedNodes;
          if (syncedField) {
            showToast(`✨ Đã tự động đồng bộ ${syncedField} trên toàn bộ thiệp!`);
          }
        }
        if (updatedCardPatch) {
          setCustomCardData((prevCard) => {
            const current = prevCard || buildCardFromCurrentState();
            const merged = { ...current, ...updatedCardPatch };
            saveCard(merged);
            saveCardAsync(merged).catch(() => {});
            return merged;
          });
        }
      }

      pushHistory(newNodes);

      if (selectedElement?.id === elementId) {
        setSelectedElement({
          ...selectedElement,
          props: nextNode.props,
        });
      }
      return newNodes;
    });
  };

  // Khôi phục & Khóa toàn bộ họa tiết trang trí chuẩn của mẫu
  const handleRepairDecorations = () => {
    const { repairedNodes, repairedCount } = repairAndLockDecorativeNodes(nodes, templateId);
    setNodes(repairedNodes);
    pushHistory(repairedNodes);
    if (repairedCount > 0) {
      showToast(`🛡️ Đã khôi phục và khóa cố định ${repairedCount} họa tiết trang trí chuẩn của mẫu!`);
    } else {
      showToast(`🛡️ Đã chuẩn hóa và làm sạch cấu trúc họa tiết chuẩn của mẫu!`);
    }
  };

  // Delete element
  const handleDeleteElement = (elementId: string) => {
    setNodes((prev) => {
      const copy = { ...prev };
      delete copy[elementId];
      pushHistory(copy);
      setSelectedElement(null);
      return copy;
    });
  };

  // Duplicate element
  const handleDuplicateElement = (elementId: string) => {
    setNodes((prev) => {
      const source = prev[elementId];
      if (!source) return prev;
      const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const duplicated = {
        ...source,
        props: {
          ...source.props,
          top: (source.props?.top || 0) + 20,
          left: (source.props?.left || 0) + 20,
        },
      };
      const newNodes = { ...prev, [newId]: duplicated };
      pushHistory(newNodes);
      setSelectedElement({
        id: newId,
        type: duplicated.type?.resolvedName || "Widget",
        props: duplicated.props,
      });
      return newNodes;
    });
  };

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S, Delete, Duplicate, Nudge, Deselect)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Undo: Ctrl + Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl + Y or Ctrl + Shift + Z
      else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))
      ) {
        e.preventDefault();
        handleRedo();
      }
      // Save: Ctrl + S
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSave();
      }
      // Duplicate: Ctrl + D
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selectedElement) {
        e.preventDefault();
        handleDuplicateElement(selectedElement.id);
        showToast("✨ Đã nhân bản phần tử!");
      }
      // Delete: Delete or Backspace
      else if ((e.key === "Delete" || e.key === "Backspace") && selectedElement) {
        e.preventDefault();
        handleDeleteElement(selectedElement.id);
        showToast("🗑️ Đã xóa phần tử!");
      }
      // Deselect or close modals: Escape
      else if (e.key === "Escape") {
        setSelectedElement(null);
        setIsPublishModalOpen(false);
        setIsLivePreviewOpen(false);
        setIsShortcutsModalOpen(false);
      }
      // Nudge with Arrow Keys (1px, or 10px with Shift)
      else if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        selectedElement
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const currentLeft = Number(selectedElement.props?.left ?? 0);
        const currentTop = Number(selectedElement.props?.top ?? 0);
        let newLeft = currentLeft;
        let newTop = currentTop;

        if (e.key === "ArrowUp") newTop -= step;
        if (e.key === "ArrowDown") newTop += step;
        if (e.key === "ArrowLeft") newLeft -= step;
        if (e.key === "ArrowRight") newLeft += step;

        handleUpdateProps(selectedElement.id, { left: newLeft, top: newTop });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history, selectedElement, nodes]);

  // Add new image from left drawer
  const handleAddImage = (url: string) => {
    const newId = `photo_${Date.now()}`;
    const newNode = {
      type: { resolvedName: "PhotoBox" },
      props: {
        top: 300,
        left: 100,
        width: 300,
        height: 400,
        imgKey: url,
        zIndex: 20,
        borderRadius: [10, 10, 10, 10],
      },
    };
    setNodes((prev) => {
      const newNodes = { ...prev, [newId]: newNode };
      pushHistory(newNodes);
      setSelectedElement({ id: newId, type: "PhotoBox", props: newNode.props });
      return newNodes;
    });
  };

  // Add new text from left drawer
  const handleAddText = (text: string, type: "heading" | "subheading" | "body") => {
    const newId = `text_${Date.now()}`;
    const fontSize = type === "heading" ? 32 : type === "subheading" ? 22 : 16;
    const newNode = {
      type: { resolvedName: "TextBox" },
      props: {
        top: 400,
        left: 50,
        width: 400,
        height: 50,
        text,
        fontSize,
        color: "#1c171a",
        textAlign: "center",
        zIndex: 25,
      },
    };
    setNodes((prev) => {
      const newNodes = { ...prev, [newId]: newNode };
      pushHistory(newNodes);
      setSelectedElement({ id: newId, type: "TextBox", props: newNode.props });
      return newNodes;
    });
  };

  // Change background music with full persistence
  const handleChangeMusic = (title: string, url: string) => {
    setCurrentMusic({ title, url });
    setNodes((prev) => {
      const root = prev["ROOT"] || { type: { resolvedName: "GeometricBox" }, props: {} };
      const updatedProps = { ...root.props, musicTitle: title, musicUrl: url };
      const newNodes = { ...prev, ROOT: { ...root, props: updatedProps } };
      pushHistory(newNodes);
      return newNodes;
    });

    const currentCard = buildCardFromCurrentState();
    currentCard.musicTitle = title;
    currentCard.musicUrl = url;
    saveCard(currentCard);

    // Sync to Supabase in background
    fetch(`/api/cards/${currentCard.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentCard),
    }).catch(() => {});

    showToast(`🎵 Đã chọn nhạc nền: "${title}"`);
  };

  // AI Background Removal for Wedding Photo (0đ zero-cost)
  const handleRemoveBackground = async () => {
    let targetId = selectedElement?.id;
    let targetUrl = selectedElement?.props?.imgKey || selectedElement?.props?.src;

    if (!targetUrl) {
      const firstPhoto = Object.entries(nodes).find(
        ([, n]: [string, any]) =>
          n.type?.resolvedName === "PhotoBox" && (n.props?.imgKey || n.props?.src)
      );
      if (firstPhoto) {
        targetId = firstPhoto[0];
        targetUrl = firstPhoto[1].props?.imgKey || firstPhoto[1].props?.src;
        setSelectedElement({ id: targetId, type: "PhotoBox", props: firstPhoto[1].props });
      }
    }

    if (!targetUrl || !targetId) {
      showToast("Vui lòng chọn một ảnh trên thiệp để xóa phông nền");
      return;
    }

    try {
      setIsRemovingBg(true);
      showToast("✨ Đang dùng AI tách phông nền ảnh cưới...");
      const transparentPng = await smartRemoveBackground(targetUrl);

      handleUpdateProps(targetId, {
        imgKey: transparentPng,
        src: transparentPng,
        hasBoxShadow: true,
        boxShadow: { blur: 15, color: "rgba(229,65,83,0.3)" },
      });
      showToast("✨ Đã tách phông nền thành công (0đ chi phí)!");
    } catch (err) {
      console.error("Lỗi xóa nền:", err);
      showToast("Không thể xóa nền ảnh này, vui lòng thử lại");
    } finally {
      setIsRemovingBg(false);
    }
  };

  // Change background styling (Color, texture, image)
  const handleChangeBackground = ({
    color,
    image,
    opacity,
  }: {
    color?: string;
    image?: string;
    opacity?: number;
  }) => {
    setNodes((prev) => {
      const root = prev["ROOT"] || { type: { resolvedName: "GeometricBox" }, props: {} };
      const updatedProps = { ...root.props };
      if (color !== undefined) updatedProps.backgroundColor = color;
      if (image !== undefined) updatedProps.backgroundImage = image;
      if (opacity !== undefined) updatedProps.backgroundOpacity = opacity;
      const newNodes = {
        ...prev,
        ROOT: {
          ...root,
          props: updatedProps,
        },
      };
      pushHistory(newNodes);
      return newNodes;
    });
  };

  // Add stock decoration / sticker
  const handleAddStock = (stockUrl: string, name: string) => {
    const newId = `stock_${Date.now()}`;
    const newNode = {
      type: { resolvedName: "PhotoBox" },
      props: {
        top: 400,
        left: 175,
        width: 150,
        height: 150,
        imgKey: stockUrl,
        src: stockUrl,
        zIndex: 40,
        alt: name,
      },
    };
    setNodes((prev) => {
      const newNodes = { ...prev, [newId]: newNode };
      pushHistory(newNodes);
      setSelectedElement({ id: newId, type: "PhotoBox", props: newNode.props });
      return newNodes;
    });
  };

  // Add interactive wedding widget (Countdown, Map, QR, RSVP, Calendar)
  const handleAddWidget = (widgetType: string, customProps?: Record<string, any>) => {
    const newId = `widget_${Date.now()}`;
    let defaultProps: Record<string, any> = {
      top: 500,
      left: 40,
      width: 420,
      height: 180,
      zIndex: 50,
    };
    if (widgetType === "CountdownBoxV2") {
      defaultProps = { ...defaultProps, height: 120, targetDate: "2026-11-18T11:00:00" };
    } else if (widgetType === "CalendarBoxV2") {
      defaultProps = { ...defaultProps, width: 320, left: 90, height: 220, day: 29, month: 12, year: 2026 };
    } else if (widgetType === "GiftQrBox") {
      defaultProps = {
        ...defaultProps,
        height: 260,
        modalTitle: "Hộp Quà Mừng Cưới",
        imgKey:
          customProps?.imgKey ||
          "https://img.vietqr.io/image/MB-240220038888-compact2.jpg?amount=0&addInfo=Mung%20cuoi%20hai%20ban&accountName=NGUYEN%20VAN%20HUNG",
      };
    } else if (widgetType === "RsvpBoxV2") {
      defaultProps = { ...defaultProps, height: 220, titleText: "Xác nhận tham dự" };
    } else if (widgetType === "MapBox") {
      defaultProps = {
        ...defaultProps,
        height: 200,
        venueName: "Trung tâm Tiệc cưới Trống Đồng Palace",
        address: "72 Quán Sứ, Hoàn Kiếm, Hà Nội",
        mapUrl: "https://maps.google.com/?q=21.0254,105.8458",
      };
    } else if (widgetType === "TimelineBox") {
      const defaultItems = [
        { id: "1", time: "10:00", title: "Đón khách" },
        { id: "2", time: "10:30", title: "Photo Booth" },
        { id: "3", time: "11:00", title: "Làm lễ thành hôn" },
        { id: "4", time: "11:30", title: "Cắt bánh & Rót rượu" },
        { id: "5", time: "12:00", title: "Khai tiệc mừng" },
        { id: "6", time: "13:30", title: "Tiễn khách" },
      ];
      defaultProps = {
        ...defaultProps,
        height: 290,
        title: "LỊCH TRÌNH NGÀY CƯỚI",
        items: defaultItems,
        text: generateTimelineHtml(defaultItems),
      };
    } else if (widgetType === "DressCodeBox") {
      const defaultColors = [
        { color: "#D7CCB8", label: "Be" },
        { color: "#FFFFFF", label: "Trắng" },
        { color: "#7BA7D9", label: "Xanh pastel" },
      ];
      const desc = "Để bức hình kỷ niệm thêm trọn vẹn, quý khách vui lòng lựa chọn trang phục theo tông màu:";
      defaultProps = {
        ...defaultProps,
        height: 150,
        title: "QUY ĐỊNH TRANG PHỤC",
        colors: defaultColors,
        description: desc,
        text: generateDressCodeHtml(defaultColors, desc),
      };
    } else if (widgetType === "CeremonyBox") {
      const ceremonyData = {
        ceremonyName: "Lễ Thành Hôn",
        time: "11:30",
        date: "2027-09-15",
        lunarDate: "(Tức ngày 15 tháng 8 năm Đinh Mùi)",
        location: "Trung Tâm Tiệc Cưới Trống Đồng",
      };
      defaultProps = {
        ...defaultProps,
        height: 160,
        ...ceremonyData,
        text: generateCeremonyHtml(ceremonyData),
      };
    } else if (widgetType === "FamilyInfoBox") {
      const familyData = {
        groomFather: "Ông Ngô Hữu Việt",
        groomMother: "Bà Lê Ngọc Linh",
        groomName: "Ngô Gia Dũng",
        brideFather: "Ông Đặng Đức Quân",
        brideMother: "Bà Hồ Mỹ Anh",
        brideName: "Đặng Thanh Nhung",
      };
      defaultProps = {
        ...defaultProps,
        height: 140,
        ...familyData,
        text: generateFamilyInfoHtml(familyData),
      };
    } else if (widgetType === "BankCardBox") {
      const bankData = {
        title: "HỘP MỪNG CƯỚI",
        description: "Sự hiện diện của quý vị là món quà quý giá nhất. Quý vị cũng có thể gửi lời chúc và quà mừng qua số tài khoản:",
        groomBank: {
          bankName: "MB BANK",
          accountNumber: "240220038888",
          accountHolder: "ĐỨC MẠNH",
        },
        brideBank: {
          bankName: "TECHCOMBANK",
          accountNumber: "190365824988",
          accountHolder: "THÙY DUNG",
        },
      };
      defaultProps = {
        ...defaultProps,
        height: 340,
        ...bankData,
        text: generateBankCardHtml(bankData),
      };
    }
    const newNode = {
      type: { resolvedName: widgetType },
      props: { ...defaultProps, ...(customProps || {}) },
    };
    setNodes((prev) => {
      const newNodes = { ...prev, [newId]: newNode };
      pushHistory(newNodes);
      setSelectedElement({ id: newId, type: widgetType, props: newNode.props });
      return newNodes;
    });
  };

  // 1-Click theme preset applicator
  const handleApplyThemePreset = (preset: {
    name: string;
    backgroundColor: string;
    primaryColor: string;
    textColor: string;
    fontFamily?: string;
  }) => {
    setNodes((prev) => {
      const updated = { ...prev };
      if (updated["ROOT"]) {
        updated["ROOT"] = {
          ...updated["ROOT"],
          props: {
            ...updated["ROOT"].props,
            backgroundColor: preset.backgroundColor,
          },
        };
      }
      Object.entries(updated).forEach(([id, node]: [string, any]) => {
        if (node.type?.resolvedName === "TextBox") {
          const p = node.props || {};
          const isHeading = (p.fontSize || 0) >= 22;
          updated[id] = {
            ...node,
            props: {
              ...p,
              color: isHeading ? preset.primaryColor : preset.textColor,
            },
          };
        }
      });
      pushHistory(updated);
      return updated;
    });
  };

  // Switch template
  const handleSelectTemplate = (tpl: ZenLoveTemplate) => {
    router.push(`/design-template/${tpl.id}`);
  };

  // Quick replace photo from floating bottom bar
  const handleQuickReplacePhoto = (index: number) => {
    const photoEntries = Object.entries(nodes).filter(
      ([, n]) => n.type?.resolvedName === "PhotoBox" && (n.props?.isReplaceable || n.props?.previewKey || n.props?.width > 120)
    );
    if (photoEntries[index]) {
      const [id, node] = photoEntries[index];
      setSelectedElement({ id, type: "PhotoBox", props: node.props || {} });
      setActiveLeftTab("image");
      setIsLeftDrawerOpen(true);
    }
  };

  // Operational Card Builder - Extract couple info, photos, and current customized canvas nodes
  const buildCardFromCurrentState = () => {
    const slug = templateId === "8c5055d8-30db-4b38-8831-e11063e3d352" ? "hong-phong" : templateId;
    const existing = getCardByIdOrSlug(templateId) || getCardByIdOrSlug(slug);

    // Trích xuất thông tin thực tế từ template nodes và metadata
    const extracted = extractWeddingDetailsFromTemplate(nodes, currentZenloveTemplate);

    let groomName = existing?.groom?.name || extracted.groomName;
    let brideName = existing?.bride?.name || extracted.brideName;
    let weddingDate = existing?.weddingDate || extracted.weddingDate;
    let weddingTime = existing?.weddingTime || extracted.weddingTime;
    let lunarDate = existing?.lunarDate || extracted.lunarDate;
    let venueAddress = existing?.events?.[0]?.address || extracted.venueAddress;
    let venueName = existing?.events?.[0]?.venue || extracted.venueName;

    // Extract hero cover photo from nodes or template preview image
    let coverImage =
      existing?.coverImage ||
      currentZenloveTemplate?.imageUrl ||
      extracted.coverImage ||
      "";

    const photoNodes = Object.values(nodes).filter(
      (n: any) => n.type?.resolvedName === "PhotoBox" && n.props?.imgKey
    );
    if (photoNodes.length > 0) {
      const hero = photoNodes.find((n: any) => (n.props.width || 0) > 200) || photoNodes[0];
      if (hero && hero.props?.imgKey) {
        coverImage = hero.props.imgKey.startsWith("http")
          ? hero.props.imgKey
          : `https://cdn-resource.zenlove.me/${hero.props.imgKey.replace(/^\//, "")}`;
      }
    }

    // Album thiệp cưới: Chỉ lưu ảnh bìa và các ảnh do chính người dùng tải lên
    const userUploadedPhotos = getSavedUploadedImages();
    const mergedAlbum = Array.from(
      new Set(
        [
          coverImage,
          ...(existing?.album || []),
          ...userUploadedPhotos,
        ].filter((u) => Boolean(u) && typeof u === "string" && u.trim().length > 0)
      )
    );

    const base = customCardData || existing;
    const currentUserId = base?.userId || existing?.userId || user?.id;

    // Branded slug chuẩn: [Tên người dùng] + [Tên web (zenlove)] + [Mã mẫu] + [thông tin khác nếu có]
    const templateMeta = currentZenloveTemplate || findZenloveTemplate(templateId) || (base?.templateId ? findZenloveTemplate(base.templateId) : undefined);
    const codeSlug = templateMeta?.code
      ? templateMeta.code.replace(/-/g, "")
      : (templateMeta?.orderNumber ? `mau${String(templateMeta.orderNumber).padStart(2, "0")}` : "mau01");

    let computedSlug = base?.slug || existing?.slug;
    if (
      !computedSlug ||
      computedSlug === templateId ||
      computedSlug.length > 35 ||
      computedSlug.startsWith("card_") ||
      computedSlug.includes("-01d9-")
    ) {
      computedSlug = generateBrandedWeddingSlug({
        userName: user?.name || (user?.email ? user.email.split("@")[0] : undefined),
        groomName,
        brideName,
        websiteName: "zenlove",
        templateCode: codeSlug,
        customSuffix: weddingDate ? new Date(weddingDate).getFullYear().toString() : undefined,
      });
    }

    const cardToSave: WeddingCard = {
      id: base?.id || existing?.id || templateId,
      slug: computedSlug || slug,
      name: base?.name || existing?.name || `Thiệp Cưới ${templateName} - ${groomName} & ${brideName}`,
      templateId: base?.templateId || existing?.templateId || templateId,
      templateName,
      status: "published",
      updatedAt: new Date().toLocaleDateString("vi-VN"),
      views: base?.views || existing?.views || 100,
      userId: currentUserId,
      coverImage: coverImage || currentZenloveTemplate?.imageUrl || extracted.coverImage,
      story:
        base?.story ||
        existing?.story ||
        extracted.story ||
        "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương.",
      weddingDate,
      weddingTime,
      lunarDate,
      showGiftBox: base?.showGiftBox !== undefined ? base.showGiftBox : (existing?.showGiftBox !== undefined ? existing.showGiftBox : true),
      showWishes: base?.showWishes !== undefined ? base.showWishes : (existing?.showWishes !== undefined ? existing.showWishes : true),
      showRsvp: base?.showRsvp !== undefined ? base.showRsvp : (existing?.showRsvp !== undefined ? existing.showRsvp : true),
      groom: {
        userId: currentUserId,
        name: base?.groom?.name || groomName,
        title: "Chú Rể",
        phone: base?.groom?.phone || existing?.groom?.phone || "0912.345.678",
        parents: base?.groom?.parents || existing?.groom?.parents || extracted.parentsGroom || "Ông Nguyễn Văn Hùng & Bà Trần Thị Lan",
        bankName: base?.groom?.bankName || existing?.groom?.bankName || "MB BANK",
        accountNumber: base?.groom?.accountNumber || existing?.groom?.accountNumber || "240220038888",
        accountName: base?.groom?.accountName || existing?.groom?.accountName || base?.groom?.name || groomName,
        qrCode: base?.groom?.qrCode || existing?.groom?.qrCode,
      },
      bride: {
        name: base?.bride?.name || brideName,
        title: "Cô Dâu",
        phone: base?.bride?.phone || existing?.bride?.phone || "0987.654.321",
        parents: base?.bride?.parents || existing?.bride?.parents || extracted.parentsBride || "Ông Lê Văn Thành & Bà Vũ Thị Mai",
        bankName: base?.bride?.bankName || existing?.bride?.bankName || "TECHCOMBANK",
        accountNumber: base?.bride?.accountNumber || existing?.bride?.accountNumber || "190365824988",
        accountName: base?.bride?.accountName || existing?.bride?.accountName || base?.bride?.name || brideName,
        qrCode: base?.bride?.qrCode || existing?.bride?.qrCode,
      },
      events: base?.events || existing?.events || [
        {
          id: "evt-1",
          title: "Lễ Vu Quy (Nhà Gái)",
          time: `08:30 • ${weddingDate.split("-").reverse().join("/")}`,
          venue: "Tư gia Nhà Gái",
          address: venueAddress || "125 Đường Nguyễn Thị Minh Khai, P. Bến Thành, TP HCM",
        },
        {
          id: "evt-2",
          title: "Lễ Thành Hôn (Nhà Trai)",
          time: `${weddingTime} • ${weddingDate.split("-").reverse().join("/")}`,
          venue: venueName || "Tư gia Nhà Trai",
          address: venueAddress || "125 Đường Nguyễn Thị Minh Khai, P. Bến Thành, TP HCM",
        },
        {
          id: "evt-3",
          title: "Tiệc Cưới Chung Vui",
          time: `17:30 • ${weddingDate.split("-").reverse().join("/")}`,
          venue: "Trung tâm Tiệc cưới",
          address: venueAddress || "125 Đường Nguyễn Thị Minh Khai, P. Bến Thành, TP HCM",
        },
      ],
      album: mergedAlbum.length > 0 ? mergedAlbum : (existing?.album || []),
      musicTitle:
        currentMusic.title ||
        existing?.musicTitle ||
        extracted.musicTitle ||
        currentZenloveTemplate?.musicName ||
        "Thiên đường với người thương",
      musicUrl:
        currentMusic.url ||
        existing?.musicUrl ||
        extracted.musicUrl ||
        currentZenloveTemplate?.musicUrl ||
        "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
      rsvps: existing?.rsvps || [],
      wishes: existing?.wishes || [],
      nodes,
    };

    return cardToSave;
  };

  // Manual Save Handler - Saves current state and syncs to Supabase server
  const handleManualSave = async () => {
    if (!isAuthenticated) {
      openLoginModal("Vui lòng đăng nhập để lưu bản thiết kế thiệp cưới", {
        type: "clone_template",
        templateId,
      });
      return;
    }
    const card = buildCardFromCurrentState();
    setIsSaved(false);
    showToast("⏳ Đang lưu bản thiết kế lên máy chủ...");
    const res = await saveCardAsync(card);
    setIsSaved(true);
    if (res.success) {
      showToast("💾 Đã lưu và đồng bộ lên máy chủ thành công!");
    } else {
      showToast("💾 Đã lưu tạm thời trên máy (Ngoại tuyến)!");
    }
  };

  // Settings Handler - Updates bank, couple info & section toggles and syncs to server
  const handleSaveSettings = async (updatedCard: WeddingCard) => {
    if (!isAuthenticated) {
      openLoginModal("Vui lòng đăng nhập để lưu cài đặt thiệp cưới", {
        type: "clone_template",
        templateId,
      });
      return;
    }
    setCustomCardData(updatedCard);
    if (updatedCard.nodes && Object.keys(updatedCard.nodes).length > 0) {
      setNodes(updatedCard.nodes);
      pushHistory(updatedCard.nodes);
    }
    setIsSaved(false);
    showToast("⏳ Đang lưu cài đặt lên máy chủ...");
    if (updatedCard.templateName) {
      setTemplateName(updatedCard.templateName);
    }
    const res = await saveCardAsync(updatedCard);
    setIsSaved(true);
    if (res.success) {
      showToast("⚙️ Đã lưu cài đặt thông tin thiệp & Hộp mừng lên máy chủ!");
    } else {
      showToast("⚙️ Đã lưu cài đặt ngoại tuyến trên thiết bị!");
    }
  };

  // Preview Handler - Saves current nodes and opens live smartphone preview modal
  const handlePreview = () => {
    const card = buildCardFromCurrentState();
    saveCard(card);
    saveCardAsync(card).catch(() => {});
    setIsSaved(true);
    setIsLivePreviewOpen(true);
  };

  // Publish Handler - Saves card, syncs to server and opens shareable QR code publish modal
  const handlePublish = async () => {
    if (!isAuthenticated) {
      openLoginModal("Vui lòng đăng nhập để xuất bản và chia sẻ thiệp cưới", {
        type: "clone_template",
        templateId,
      });
      return;
    }
    const card = buildCardFromCurrentState();
    const warnings = validateTemplateCompletion(nodes, card);

    // CẢNH BÁO NẾU CHƯA ĐIỀN HẾT THÔNG TIN QUAN TRỌNG CÓ TRONG TEMPLATE
    if (warnings.length > 0) {
      setPublishWarnings(warnings);
      setIsWarningModalOpen(true);
      return;
    }

    proceedPublish(card);
  };

  const proceedPublish = async (cardToPublish?: WeddingCard) => {
    const card = cardToPublish || buildCardFromCurrentState();
    setCustomCardData(card);
    setIsSaved(false);
    showToast("⏳ Đang chuẩn bị xuất bản thiệp...");
    setIsPublishModalOpen(true);
    const res = await saveCardAsync(card);
    setIsSaved(true);
    if (res.success) {
      showToast("🚀 Thiệp đã sẵn sàng chia sẻ trực tuyến!");
    }
  };

  // Auto-Fill Handler - Applies form data across all template nodes & saves
  const handleApplyAutoFill = (
    updatedNodes: Record<string, any>,
    updatedCard: Partial<WeddingCard>,
    stats: { textCount: number; photoCount: number; widgetCount: number }
  ) => {
    setNodes(updatedNodes);
    pushHistory(updatedNodes);

    if (updatedCard.templateName) {
      setTemplateName(updatedCard.templateName);
    }

    const current = buildCardFromCurrentState();
    const merged: WeddingCard = {
      ...current,
      ...updatedCard,
      groom: {
        ...current.groom,
        ...(updatedCard.groom || {}),
      },
      bride: {
        ...current.bride,
        ...(updatedCard.bride || {}),
      },
      nodes: updatedNodes,
    };
    setCustomCardData(merged);
    saveCard(merged);
    saveCardAsync(merged).catch(() => {});

    showToast(
      `✨ Đã tự động điền ${stats.textCount} nội dung, ${stats.photoCount} ảnh & ${stats.widgetCount} tiện ích!`
    );
  };

  const handleExportCardImage = async () => {
    try {
      const currentCard = buildCardFromCurrentState();
      showToast("📸 Đang kết xuất ảnh thiệp cưới HD (PNG)...");
      await downloadCardImageAsPng(currentCard, { mode: "story" });
      showToast("✨ Đã tải ảnh thiệp cưới thành công!");
    } catch (err) {
      console.error(err);
      showToast("Không thể xuất ảnh, vui lòng thử lại sau.");
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#18181b] overflow-hidden font-sans relative">
      {/* ================= 1. TOP HEADER (Exact match to screenshot!) ================= */}
      <EditorHeader
        templateName={templateName}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleManualSave}
        onRepairDecorations={handleRepairDecorations}
        onExportImage={handleExportCardImage}
        onPreview={handlePreview}
        onPublish={handlePublish}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isSaved={isSaved}
      />

      {/* ================= 2. WORKSPACE BODY (Rail + Drawer + Canvas + Inspector) ================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leftmost Tool Rail (10 tools) */}
        <EditorLeftRail
          activeTab={activeLeftTab}
          onSelectTab={(tab) => {
            setActiveLeftTab(tab);
            setIsLeftDrawerOpen(true);
          }}
          isDrawerOpen={isLeftDrawerOpen}
          onToggleDrawer={() => setIsLeftDrawerOpen(!isLeftDrawerOpen)}
        />

        {/* Left Flyout Drawer (Upload dropzone, Text, Music, etc.) */}
        <EditorLeftDrawer
          nodes={nodes}
          card={buildCardFromCurrentState()}
          activeTab={activeLeftTab}
          isOpen={isLeftDrawerOpen}
          onClose={() => setIsLeftDrawerOpen(false)}
          onOpenAutoFillModal={() => setIsAutoFillModalOpen(true)}
          onApplyAutoFill={handleApplyAutoFill}
          onSelectElement={(el) => setSelectedElement(el)}
          onRepairDecorations={handleRepairDecorations}
          onAddImage={handleAddImage}
          selectedElement={selectedElement}
          onUpdateElementProps={handleUpdateProps}
          onAddText={handleAddText}
          currentBackground={{
            backgroundColor: nodes["ROOT"]?.props?.backgroundColor,
            backgroundImage: nodes["ROOT"]?.props?.backgroundImage,
            backgroundOpacity: nodes["ROOT"]?.props?.backgroundOpacity,
          }}
          onChangeBackground={handleChangeBackground}
          onAddStock={handleAddStock}
          onRemoveBackground={handleRemoveBackground}
          isRemovingBackground={isRemovingBg}
          currentMusic={currentMusic}
          onChangeMusic={handleChangeMusic}
          onAddWidget={handleAddWidget}
          onSelectTemplate={handleSelectTemplate}
          onApplyThemePreset={handleApplyThemePreset}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Center Canvas (Blueprint Grid + Mobile Viewport + Bounding Box) */}
        <EditorCanvas
          nodes={nodes}
          selectedElement={selectedElement}
          onSelectElement={(el) => setSelectedElement(el)}
          onUpdateElementProps={handleUpdateProps}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          zoomLevel={zoomLevel}
          onZoomIn={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
          onZoomOut={() => setZoomLevel((z) => Math.max(0.4, z - 0.1))}
          onResetZoom={() => setZoomLevel(0.85)}
          onQuickReplacePhoto={handleQuickReplacePhoto}
          onOpenImageDrawer={() => {
            setActiveLeftTab("image");
            setIsLeftDrawerOpen(true);
          }}
          isLeftDrawerOpen={isLeftDrawerOpen}
        />

        {/* Right Properties Inspector (Settings & Effects tabs) */}
        <EditorRightInspector
          selectedElement={selectedElement}
          onUpdateProps={handleUpdateProps}
          onReplaceImage={() => {
            setActiveLeftTab("image");
            setIsLeftDrawerOpen(true);
          }}
          onRemoveBackground={handleRemoveBackground}
          isRemovingBackground={isRemovingBg}
        />
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[999999] px-4 py-2.5 bg-zinc-900/95 text-white text-xs font-semibold rounded-2xl shadow-2xl border border-zinc-700/80 backdrop-blur-md flex items-center gap-2 animate-bounce-subtle">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= 3. MODALS ================= */}
      <EditorPublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        templateName={templateName}
        templateId={templateId}
        cardSlug={customCardData?.slug || buildCardFromCurrentState().slug}
        card={customCardData || buildCardFromCurrentState()}
        onSlugUpdated={(newSlug) => {
          setCustomCardData((prev: any) => {
            const current = prev || buildCardFromCurrentState();
            return { ...current, slug: newSlug };
          });
        }}
      />

      <EditorShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <EditorLivePreviewModal
        isOpen={isLivePreviewOpen}
        onClose={() => setIsLivePreviewOpen(false)}
        nodes={nodes}
        templateName={templateName}
        slugOrId={templateId === "8c5055d8-30db-4b38-8831-e11063e3d352" ? "hong-phong" : templateId}
      />

      <EditorWeddingSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        card={buildCardFromCurrentState()}
        onSave={handleSaveSettings}
      />

      {/* 4. AUTO-FILL FORM MODAL */}
      <EditorAutoFillModal
        isOpen={isAutoFillModalOpen}
        onClose={() => setIsAutoFillModalOpen(false)}
        card={buildCardFromCurrentState()}
        nodes={nodes}
        onApply={handleApplyAutoFill}
      />

      {/* 5. PRE-PUBLISH WARNING MODAL */}
      <EditorPublishWarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        warnings={publishWarnings}
        onOpenAutoFill={() => setIsAutoFillModalOpen(true)}
        onProceedPublish={() => proceedPublish()}
      />

      {/* 6. AUTH GUARD OVERLAY FOR STUDIO CANVAS */}
      {isClientMounted && !isAuthenticated && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-gray-100 animate-scale-up">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 text-zen-primary flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner font-bold">
              💌
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 mb-2">
              Đăng nhập để vào Studio
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
              Để bản thiết kế thiệp cưới của bạn được lưu an toàn vào tài khoản cá nhân, bảo toàn dữ liệu chỉnh sửa và xuất bản trực tuyến, vui lòng đăng nhập trước khi tiếp tục.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  openLoginModal("Vui lòng đăng nhập để bắt đầu thiết kế thiệp cưới", {
                    type: "clone_template",
                    templateId,
                  })
                }
                className="w-full py-3.5 px-6 rounded-full bg-zen-primary hover:bg-[#d93849] text-white font-bold text-sm shadow-lg shadow-zen-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Đăng nhập hoặc Đăng ký ngay</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/templates")}
                className="w-full py-3 px-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Quay lại kho mẫu thiệp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
