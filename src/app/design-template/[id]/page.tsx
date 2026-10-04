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
      // Find template meta in ZENLOVE_TEMPLATES
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
            const fetchedNodes = json.data.parsedNodes;
            setNodes(fetchedNodes);
            setHistory([fetchedNodes]);
            setHistoryIndex(0);

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

  // Change background music
  const handleChangeMusic = (title: string, url: string) => {
    // Show toast or save music in toolbarSettings
    setIsSaved(false);
    setTimeout(() => setIsSaved(true), 800);
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

    const cardToSave: WeddingCard = {
      id: templateId,
      slug,
      name: `Thiệp Cưới ${templateName} - ${groomName} & ${brideName}`,
      templateId,
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
      album: existing?.album || [],
      musicTitle: existing?.musicTitle || currentZenloveTemplate?.musicName || "Thiên đường với người thương",
      musicUrl:
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
    <div className="h-screen w-screen flex flex-col bg-[#18181b] overflow-hidden font-sans">
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
          onAddText={handleAddText}
          onChangeMusic={handleChangeMusic}
          onSelectTemplate={handleSelectTemplate}
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
          onRemoveBackground={async () => {
            if (selectedElement && selectedElement.props?.imgKey) {
              try {
                const res = await fetch("/api/tools/remove-bg", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ imageUrl: selectedElement.props.imgKey }),
                });
                const data = await res.json();
                if (data.success && data.outputUrl) {
                  handleUpdateProps(selectedElement.id, {
                    imgKey: data.outputUrl,
                    hasBoxShadow: true,
                    boxShadow: { blur: 15, color: "rgba(229,65,83,0.3)" },
                  });
                }
              } catch (e) {
                console.error("Lỗi xóa nền AI:", e);
              }
            }
          }}
        />
      </div>

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
