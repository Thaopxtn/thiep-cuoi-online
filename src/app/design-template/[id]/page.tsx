"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import EditorHeader from "@/components/editor/EditorHeader";
import EditorLeftRail, { EditorToolTab } from "@/components/editor/EditorLeftRail";
import EditorLeftDrawer from "@/components/editor/EditorLeftDrawer";
import EditorCanvas from "@/components/editor/EditorCanvas";
import EditorRightInspector, { SelectedElementData } from "@/components/editor/EditorRightInspector";
import EditorPublishModal from "@/components/editor/EditorPublishModal";
import EditorShortcutsModal from "@/components/editor/EditorShortcutsModal";
import EditorLivePreviewModal from "@/components/editor/EditorLivePreviewModal";
import ZenlovePreviewModal from "@/components/templates/ZenlovePreviewModal";
import { getTemplateById, TEMPLATES_DATA } from "@/data/templatesData";
import { getStoredTemplateById, saveCustomTemplate } from "@/lib/templateStorage";
import { ZENLOVE_TEMPLATES, ZenLoveTemplate } from "@/data/zenloveTemplates";
import { saveCard, getCardByIdOrSlug, WeddingCard } from "@/lib/weddingCardService";
import { smartRemoveBackground } from "@/lib/backgroundRemoval";
import { convertFormTemplateToCanvasNodes } from "@/lib/templateFormAdapter";
import {
  addUploadedImagesToLibrary,
  addUploadedImageToLibrary,
  getSavedUploadedImages,
  extractImagesFromNodes,
} from "@/lib/mediaLibraryService";

export default function DesignTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId =
    (params?.id as string) || "8c5055d8-30db-4b38-8831-e11063e3d352";

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
  const [isSaved, setIsSaved] = useState(true);

  // Persistent music and toast state
  const [currentMusic, setCurrentMusic] = useState<{ title: string; url: string }>({
    title: "Beautiful In White - Shane Filan",
    url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);

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
        if (existingCard.templateName) setTemplateName(existingCard.templateName);
        // Tự động khôi phục ảnh của thiệp cưới vào Thư viện ảnh đã tải lên
        if (Array.isArray(existingCard.album) && existingCard.album.length > 0) {
          addUploadedImagesToLibrary(existingCard.album);
        }
        if (existingCard.coverImage) {
          addUploadedImageToLibrary(existingCard.coverImage);
        }
        if (existingCard.nodes) {
          const nodePhotos = extractImagesFromNodes(existingCard.nodes);
          if (nodePhotos.length > 0) {
            addUploadedImagesToLibrary(nodePhotos);
          }
        }
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
          setNodes(cardNodes);
          setHistory([cardNodes]);
          setHistoryIndex(0);

          // Select initial photo
          const targetPhotoNode = cardNodes["U4ZPPsHPXy"]
            ? ["U4ZPPsHPXy", cardNodes["U4ZPPsHPXy"]]
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
            setNodes(fetchedNodes);
            setHistory([fetchedNodes]);
            setHistoryIndex(0);

            // Sync music from template nodes or metadata
            if (fetchedNodes["ROOT"]?.props?.musicUrl) {
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

            // Select initial photo element (prioritizes U4ZPPsHPXy matching user's screenshot!)
            const targetPhotoNode = fetchedNodes["U4ZPPsHPXy"]
              ? ["U4ZPPsHPXy", fetchedNodes["U4ZPPsHPXy"]]
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

  // Update element properties
  const handleUpdateProps = (elementId: string, updatedProps: Record<string, any>) => {
    setNodes((prev) => {
      const existing = prev[elementId];
      if (!existing) return prev;
      const nextNode = {
        ...existing,
        props: { ...existing.props, ...updatedProps },
      };
      const newNodes = { ...prev, [elementId]: nextNode };
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
        const card = buildCardFromCurrentState();
        saveCard(card);
        setIsSaved(true);
        showToast("💾 Đã lưu bản thiết kế thiệp cưới!");
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

    // Extract names if customized in TextBox
    let groomName = existing?.groom?.name || "Đức Mạnh";
    let brideName = existing?.bride?.name || "Thùy Dung";
    Object.values(nodes).forEach((n: any) => {
      if (n.type?.resolvedName === "TextBox" && typeof n.props?.text === "string") {
        const text = n.props.text.replace(/<[^>]*>/g, "").trim();
        if ((text.includes("&") || text.includes("và")) && text.length < 50) {
          const parts = text.split(/&|và/);
          if (parts[0]?.trim()) groomName = parts[0].trim();
          if (parts[1]?.trim()) brideName = parts[1].trim();
        }
      }
    });

    // Extract hero cover photo from nodes
    let coverImage = existing?.coverImage || "";
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

    // Tự động gom toàn bộ ảnh từ canvas và thư viện ảnh tải lên vào Album thiệp
    const nodePhotos = extractImagesFromNodes(nodes);
    const libraryPhotos = getSavedUploadedImages().filter(
      (url) => !url.includes("images.unsplash.com")
    );
    const mergedAlbum = Array.from(
      new Set(
        [
          coverImage,
          ...(existing?.album || []),
          ...nodePhotos,
          ...libraryPhotos,
        ].filter((u) => Boolean(u) && typeof u === "string" && u.trim().length > 0)
      )
    );

    const cardToSave: WeddingCard = {
      id: existing?.id || templateId,
      slug: existing?.slug || slug,
      name: existing?.name || `Thiệp Cưới ${templateName} - ${groomName} & ${brideName}`,
      templateId: existing?.templateId || templateId,
      templateName,
      status: "published",
      updatedAt: new Date().toLocaleDateString("vi-VN"),
      views: existing?.views || 100,
      coverImage: coverImage || existing?.coverImage || currentZenloveTemplate?.imageUrl || "",
      story:
        existing?.story ||
        "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương.",
      weddingDate: existing?.weddingDate || "2026-11-18",
      weddingTime: existing?.weddingTime || "11:00",
      lunarDate: existing?.lunarDate || "Ngày 10 tháng 10 năm Bính Ngọ",
      groom: {
        name: groomName,
        title: "Chú Rể",
        phone: existing?.groom?.phone || "0912.345.678",
        parents: existing?.groom?.parents || "Ông Nguyễn Văn Hùng & Bà Trần Thị Lan",
        bankName: existing?.groom?.bankName || "MB BANK",
        accountNumber: existing?.groom?.accountNumber || "240220038888",
        qrCode: existing?.groom?.qrCode,
      },
      bride: {
        name: brideName,
        title: "Cô Dâu",
        phone: existing?.bride?.phone || "0987.654.321",
        parents: existing?.bride?.parents || "Ông Lê Văn Thành & Bà Vũ Thị Mai",
        bankName: existing?.bride?.bankName || "TECHCOMBANK",
        accountNumber: existing?.bride?.accountNumber || "190365824988",
        qrCode: existing?.bride?.qrCode,
      },
      events: existing?.events || [
        {
          id: "evt-1",
          title: "Lễ Vu Quy (Nhà Gái)",
          time: "08:30 • 18/11/2026",
          venue: "Tư gia Nhà Gái",
          address: "Số 45 Tràng Tiền, Hoàn Kiếm, Hà Nội",
        },
        {
          id: "evt-2",
          title: "Lễ Thành Hôn (Nhà Trai)",
          time: "10:00 • 18/11/2026",
          venue: "Tư gia Nhà Trai",
          address: "Số 88 Hoàng Hoa Thám, Ba Đình, Hà Nội",
        },
        {
          id: "evt-3",
          title: "Tiệc Cưới Chung Vui",
          time: "11:30 • 18/11/2026",
          venue: "Trung tâm Tiệc cưới Trống Đồng Palace",
          address: "72 Quán Sứ, Hoàn Kiếm, Hà Nội",
        },
      ],
      album: mergedAlbum.length > 0 ? mergedAlbum : (existing?.album || []),
      musicTitle:
        currentMusic.title ||
        existing?.musicTitle ||
        currentZenloveTemplate?.musicName ||
        "Thiên đường với người thương",
      musicUrl:
        currentMusic.url ||
        existing?.musicUrl ||
        currentZenloveTemplate?.musicUrl ||
        "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
      rsvps: existing?.rsvps || [],
      wishes: existing?.wishes || [],
      nodes,
    };

    return cardToSave;
  };

  // Preview Handler - Saves current nodes and opens live smartphone preview modal
  const handlePreview = () => {
    const card = buildCardFromCurrentState();
    saveCard(card);
    setIsSaved(true);
    setIsLivePreviewOpen(true);
  };

  // Publish Handler - Saves card and opens shareable QR code publish modal
  const handlePublish = () => {
    const card = buildCardFromCurrentState();
    saveCard(card);
    setIsSaved(true);
    setIsPublishModalOpen(true);
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
        onPreview={handlePreview}
        onPublish={handlePublish}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
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
          activeTab={activeLeftTab}
          isOpen={isLeftDrawerOpen}
          onClose={() => setIsLeftDrawerOpen(false)}
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
        cardSlug={templateId === "8c5055d8-30db-4b38-8831-e11063e3d352" ? "hong-phong" : templateId}
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
    </div>
  );
}
