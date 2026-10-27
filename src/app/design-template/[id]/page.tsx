"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import EditorHeader from "@/components/editor/EditorHeader";
import EditorLeftRail, { EditorToolTab } from "@/components/editor/EditorLeftRail";
import EditorLeftDrawer from "@/components/editor/EditorLeftDrawer";
import EditorCanvas from "@/components/editor/EditorCanvas";
import EditorRightInspector, { SelectedElementData } from "@/components/editor/EditorRightInspector";
import dynamic from "next/dynamic";
import type { FixedModuleId } from "@/components/editor/EditorFixedModuleEditModal";

const EditorPublishModal = dynamic(() => import("@/components/editor/EditorPublishModal"), { ssr: false });
const EditorShortcutsModal = dynamic(() => import("@/components/editor/EditorShortcutsModal"), { ssr: false });
const EditorLivePreviewModal = dynamic(() => import("@/components/editor/EditorLivePreviewModal"), { ssr: false });
const EditorWeddingSettingsModal = dynamic(() => import("@/components/editor/EditorWeddingSettingsModal"), { ssr: false });
const EditorAutoFillModal = dynamic(() => import("@/components/editor/EditorAutoFillModal"), { ssr: false });
const EditorPublishWarningModal = dynamic(() => import("@/components/editor/EditorPublishWarningModal"), { ssr: false });
const EditorBackgroundCutoutModal = dynamic(() => import("@/components/editor/EditorBackgroundCutoutModal"), { ssr: false });
const EditorFixedModuleEditModal = dynamic(() => import("@/components/editor/EditorFixedModuleEditModal"), { ssr: false });
const ZenlovePreviewModal = dynamic(() => import("@/components/templates/ZenlovePreviewModal"), { ssr: false });
import { getTemplateById, TEMPLATES_DATA } from "@/data/templatesData";
import { ZENLOVE_TEMPLATES, ZenLoveTemplate, findZenloveTemplate } from "@/data/zenloveTemplates";
import { saveCard, saveCardAsync, getCardByIdOrSlug, fetchCardForEditor, WeddingCard } from "@/lib/weddingCardService";
import { apiFetch } from "@/lib/apiClient";
import { DEFAULT_LOVE_STORY } from "@/components/show/InteractiveSections";
import { generateBrandedWeddingSlug } from "@/lib/brandedSlug";
import { useAuth } from "@/context/AuthContext";
import { smartRemoveBackground } from "@/lib/backgroundRemoval";
import { getSafeImageUrl } from "@/lib/imageUtils";
import { WeddingFrameItem } from "@/lib/framesCatalog";
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
import {
  findNextSafePosition,
  shiftNodesBelow,
  autoArrangeAllBlocks,
  resolveOverlapForMovedNode,
} from "@/lib/blockLayoutEngine";
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
import { ModulePresetItem } from "@/lib/modulePresetsCatalog";
import { applyComboToNodes, applyStaggerToNodes, AnimationCombo } from "@/lib/animationCatalog";
import FallingPetals from "@/components/FallingPetals";
import { EffectConfig } from "@/lib/effectsCatalog";
import { weddingSounds } from "@/lib/soundEffects";
import LuxuryEnvelopeModal from "@/components/show/LuxuryEnvelopeModal";
import CinematicEffectsOverlay from "@/components/show/CinematicEffectsOverlay";

export default function DesignTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const routeTemplateId = (params?.id as string) || "8c5055d8-30db-4b38-8831-e11063e3d352";
  const [templateId, setTemplateId] = useState<string>(routeTemplateId);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState<boolean>(false);

  // Sync state if route params change externally
  useEffect(() => {
    if (params?.id && params.id !== templateId) {
      setTemplateId(params.id as string);
    }
  }, [params?.id]);
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
  const [selectedElements, setSelectedElements] = useState<SelectedElementData[]>([]);

  // Left tools state
  const [activeLeftTab, setActiveLeftTab] = useState<EditorToolTab>("image");
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);

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
  // 3D Luxury Envelope Live Preview in Studio
  const [isPreviewEnvelopeOpen, setIsPreviewEnvelopeOpen] = useState(false);
  const [isPreviewEnvelopeOpening, setIsPreviewEnvelopeOpening] = useState(false);

  const handleOpenEnvelopePreview = () => {
    if (isPreviewEnvelopeOpening) return;
    setIsPreviewEnvelopeOpening(true);
    weddingSounds.playEnvelopeOpen();
    setTimeout(() => {
      setIsPreviewEnvelopeOpen(false);
      setIsPreviewEnvelopeOpening(false);
    }, 1300);
  };
  // Manual Cutout Modal state
  const [isCutoutModalOpen, setIsCutoutModalOpen] = useState(false);
  const [cutoutTargetId, setCutoutTargetId] = useState<string | null>(null);
  const [cutoutTargetUrl, setCutoutTargetUrl] = useState<string | null>(null);
  const [cutoutInitialResult, setCutoutInitialResult] = useState<string | null>(null);
  const [customCardData, setCustomCardData] = useState<WeddingCard | null>(null);
  const [cardAlbum, setCardAlbum] = useState<string[]>([]);
  const [activeFixedModuleConfigId, setActiveFixedModuleConfigId] = useState<FixedModuleId | null>(null);
  const [selectedFixedModuleId, setSelectedFixedModuleId] = useState<FixedModuleId | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "offline" | "error">("saved");
  const [isPublishing, setIsPublishing] = useState(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const revisionRef = useRef(0);
  const lastSavedRevisionRef = useRef(0);
  const isAlbumInitializedRef = useRef(false);
  const isSaved = saveStatus === "saved" || saveStatus === "offline";
  const [effectConfig, setEffectConfig] = useState<EffectConfig>({
    type: "petals",
    enabled: true,
    density: 28,
    speed: 1.0,
    size: 1.0,
    opacity: 0.85,
    direction: "down",
  });

  // Persistent music and toast state
  const [currentMusic, setCurrentMusic] = useState<{ title: string; url: string }>({
    title: "Beautiful In White - Shane Filan",
    url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [hasLocalSession, setHasLocalSession] = useState(false);
  const [hasDismissedAuthGuard, setHasDismissedAuthGuard] = useState(false);

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

  const handleSelectFixedModule = (moduleId: FixedModuleId | null) => {
    setSelectedElement(null);
    setSelectedElements([]);
    setSelectedFixedModuleId(moduleId);
  };

  const handleSelectElement = (el: SelectedElementData | null) => {
    setSelectedElement(el);
    setSelectedElements(el ? [el] : []);
    if (el) {
      setSelectedFixedModuleId(null);
    }
  };

  const handleSelectElements = (elements: SelectedElementData[]) => {
    setSelectedElements(elements);
    setSelectedElement(elements.length > 0 ? elements[elements.length - 1] : null);
    if (elements.length > 0) {
      setSelectedFixedModuleId(null);
    }
  };

  const handleToggleSelectElement = (el: SelectedElementData) => {
    setSelectedElements((prev) => {
      const exists = prev.some((item) => item.id === el.id);
      let updated: SelectedElementData[];
      if (exists) {
        updated = prev.filter((item) => item.id !== el.id);
      } else {
        updated = [...prev, el];
      }
      setSelectedElement(updated.length > 0 ? updated[updated.length - 1] : null);
      return updated;
    });
  };

  // Kích hoạt cơ chế tự động lưu ngầm (Real Debounced Autosave với revision coordinator)
  const triggerDebouncedAutosave = useCallback(
    (customNodes?: Record<string, any>) => {
      revisionRef.current += 1;
      const targetRevision = revisionRef.current;
      setSaveStatus("saving");
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(async () => {
        try {
          const card = buildCardFromCurrentState(customNodes);
          // 1. Lưu đồng bộ tức thì vào Local Cache
          saveCard(card);

          // 2. Nếu đã đăng nhập, đồng bộ ngầm lên máy chủ Supabase
          if (isAuthenticated) {
            const res = await saveCardAsync(card);
            if (res.success) {
              if (revisionRef.current === targetRevision) {
                lastSavedRevisionRef.current = targetRevision;
                setSaveStatus("saved");
              }
            } else {
              setSaveStatus("offline");
            }
          } else {
            setSaveStatus("offline");
          }
        } catch (e) {
          console.error("Autosave error:", e);
          setSaveStatus("offline");
        }
      }, 1500);
    },
    [isAuthenticated, templateId]
  );

  // Push new state to history
  const pushHistory = useCallback(
    (newNodes: Record<string, any>) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newNodes];
      });
      setHistoryIndex((prev) => prev + 1);
      triggerDebouncedAutosave(newNodes);
    },
    [historyIndex, triggerDebouncedAutosave]
  );

  // Cảnh báo người dùng nếu rời trang khi có thay đổi chưa lưu an toàn
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === "saving" || saveStatus === "error") {
        e.preventDefault();
        e.returnValue = "Bạn có thay đổi chưa được lưu an toàn. Bạn có chắc muốn rời trang?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  // Tự động tối ưu giao diện trên thiết bị di động (Mobile Responsive Initialization)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const mobileZoom = Number(Math.max(0.45, Math.min(0.85, (window.innerWidth - 24) / 500)).toFixed(2));
        setZoomLevel(mobileZoom);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch real template nodes from API
  useEffect(() => {
    let isMounted = true;

    const applyCardToEditor = (cardToApply: WeddingCard) => {
      setCustomCardData(cardToApply);
      isAlbumInitializedRef.current = true;
      if (Array.isArray(cardToApply.album)) {
        setCardAlbum(cardToApply.album);
      } else {
        const initialPhotos = Array.from(
          new Set(
            [
              cardToApply.coverImage,
              ...extractImagesFromNodes(cardToApply.nodes || {}),
              ...getSavedUploadedImages(),
            ].filter((u): u is string => Boolean(u) && typeof u === "string" && u.trim().length > 0)
          )
        );
        if (initialPhotos.length > 0) setCardAlbum(initialPhotos);
      }
      if (cardToApply.templateName) setTemplateName(cardToApply.templateName);
      if (cardToApply.musicUrl) {
        setCurrentMusic({
          title: cardToApply.musicTitle || "Bản nhạc cưới",
          url: cardToApply.musicUrl,
        });
      }
      if (cardToApply.effectConfig) {
        setEffectConfig(cardToApply.effectConfig);
      } else if (cardToApply.ambientEffect) {
        setEffectConfig((prev) => ({
          ...prev,
          type: cardToApply.ambientEffect as any,
          enabled: true,
        }));
      }
      if (cardToApply.nodes && Object.keys(cardToApply.nodes).length > 2) {
        let cardNodes = cardToApply.nodes;
        if (!cardNodes.ROOT) {
          cardNodes = convertFormTemplateToCanvasNodes(cardNodes, cardToApply);
        }
        const targetTplId = cardToApply.templateId || templateId;
        const { repairedNodes: repairedCardNodes } = repairAndLockDecorativeNodes(cardNodes, targetTplId);
        cardNodes = repairedCardNodes;
        setNodes(cardNodes);
        setHistory([cardNodes]);
        setHistoryIndex(0);

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
      }
    };

    async function loadTemplate() {
      setIsLoadingTemplate(true);
      try {
        // 1. Kiểm tra local cache để hiển thị tức thì (Optimistic UI)
        const localCard = getCardByIdOrSlug(templateId);
        if (localCard) {
          applyCardToEditor(localCard);
        }

        // 2. Thử nạp bản gốc từ Server API (hỗ trợ clean context, draft của owner)
        let activeCard: WeddingCard | null = localCard || null;
        if (templateId) {
          const serverRes = await fetchCardForEditor(templateId);
          if (serverRes.success && serverRes.card) {
            if (!isMounted) return;
            activeCard = serverRes.card;
            applyCardToEditor(serverRes.card);
            saveCard(serverRes.card);
          } else if (serverRes.status === 403) {
            if (!isMounted) return;
            showToast("⚠️ Bạn không có quyền chỉnh sửa thiệp cưới này.");
            return;
          }
        }

        if (activeCard) {
          // B01: Đảm bảo lần mở editor đầu tiên không bị mất nodes/ảnh nếu thiệp chưa có nodes lưu
          if (!activeCard.nodes || Object.keys(activeCard.nodes).length <= 2) {
            const clonedFromParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("clonedFrom") : null;
            const tplIdToFetch = activeCard.templateId || clonedFromParam || templateId;
            try {
              const res = await fetch(`/api/zenlove-template/${tplIdToFetch}`);
              if (res.ok) {
                const json = await res.json();
                if (json.success && json.data?.parsedNodes) {
                  let fetchedNodes = json.data.parsedNodes;
                  if (!fetchedNodes.ROOT) {
                    fetchedNodes = convertFormTemplateToCanvasNodes(fetchedNodes, json.data);
                  }
                  const { repairedNodes } = repairAndLockDecorativeNodes(fetchedNodes, tplIdToFetch);
                  setNodes(repairedNodes);
                  setHistory([repairedNodes]);
                  setHistoryIndex(0);
                  const updatedWithNodes = { ...activeCard, nodes: repairedNodes };
                  setCustomCardData(updatedWithNodes);
                  saveCard(updatedWithNodes);
                  saveCardAsync(updatedWithNodes).catch(() => {});
                }
              }
            } catch (err) {
              console.warn("Lỗi nạp template nodes cho card:", err);
            }
          }
          showToast(`✨ Đã mở thiệp cưới: "${activeCard.name}"`);
          return;
        } else {
          setCustomCardData(null);
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

              const initialPhotos = Array.from(
                new Set(
                  [
                    foundMeta?.imageUrl || json.data?.thumbnail || "",
                    ...extractImagesFromNodes(fetchedNodes),
                    ...getSavedUploadedImages(),
                  ].filter((u): u is string => Boolean(u) && typeof u === "string" && u.trim().length > 0)
                )
              );
              if (initialPhotos.length > 0) {
                setCardAlbum((prev) => (prev && prev.length > 0 ? prev : initialPhotos));
              }
              showToast(`✨ Đã nạp mẫu: "${foundMeta?.name || json.data?.name || templateName}"`);
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
      } finally {
        if (isMounted) {
          setIsLoadingTemplate(false);
        }
      }
    }

    loadTemplate();

    return () => {
      isMounted = false;
    };
  }, [templateId]);

  // Support browser Back/Forward navigation without full reload
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const segments = window.location.pathname.split("/").filter(Boolean);
        const last = segments[segments.length - 1];
        if (last && last !== templateId && last !== "design-template") {
          setTemplateId(last);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [templateId]);

  // Undo / Redo handlers với persistence coordinator
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
      triggerDebouncedAutosave(prevNodes);
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
      triggerDebouncedAutosave(nextNodes);
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
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        if (selectedElements && selectedElements.length > 1) {
          e.preventDefault();
          handleDuplicateMultiple(selectedElements.map((el) => el.id));
          showToast(`✨ Đã nhân bản ${selectedElements.length} phần tử!`);
        } else if (selectedElement) {
          e.preventDefault();
          handleDuplicateElement(selectedElement.id);
          showToast("✨ Đã nhân bản phần tử!");
        }
      }
      // Lock / Unlock: Ctrl + L
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l" && selectedElement) {
        e.preventDefault();
        const currentLocked = Boolean(selectedElement.props?.locked);
        handleUpdateProps(selectedElement.id, { locked: !currentLocked });
        showToast(currentLocked ? "🔓 Đã mở khóa phần tử!" : "🔒 Đã khóa cố định phần tử!");
      }
      // Layer Reordering: ] (Bring forward) or [ (Send backward)
      else if ((e.key === "]" || (e.ctrlKey && e.key === "]")) && selectedElement) {
        e.preventDefault();
        const currentZ = Number(selectedElement.props?.zIndex) || 1;
        handleUpdateProps(selectedElement.id, { zIndex: currentZ + 1 });
        showToast(`⬆️ Đã đưa lên lớp ${currentZ + 1}`);
      } else if ((e.key === "[" || (e.ctrlKey && e.key === "[")) && selectedElement) {
        e.preventDefault();
        const currentZ = Number(selectedElement.props?.zIndex) || 1;
        handleUpdateProps(selectedElement.id, { zIndex: Math.max(1, currentZ - 1) });
        showToast(`⬇️ Đã lùi về lớp ${Math.max(1, currentZ - 1)}`);
      }
      // Delete: Delete or Backspace
      else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElements && selectedElements.length > 1) {
          e.preventDefault();
          const count = selectedElements.length;
          handleDeleteMultiple(selectedElements.map((el) => el.id));
          showToast(`🗑️ Đã xóa ${count} phần tử!`);
        } else if (selectedElement) {
          e.preventDefault();
          handleDeleteElement(selectedElement.id);
          showToast("🗑️ Đã xóa phần tử!");
        }
      }
      // Deselect or close modals: Escape
      else if (e.key === "Escape") {
        setSelectedElement(null);
        setSelectedElements([]);
        setIsPublishModalOpen(false);
        setIsLivePreviewOpen(false);
        setIsShortcutsModalOpen(false);
      }
      // Nudge with Arrow Keys (1px, or 10px with Shift)
      else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const isMulti = selectedElements && selectedElements.length > 1;
        if (isMulti) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0;
          let dy = 0;
          if (e.key === "ArrowUp") dy = -step;
          if (e.key === "ArrowDown") dy = step;
          if (e.key === "ArrowLeft") dx = -step;
          if (e.key === "ArrowRight") dx = step;

          selectedElements.forEach((el) => {
            const curL = Number(nodes[el.id]?.props?.left ?? 0);
            const curT = Number(nodes[el.id]?.props?.top ?? 0);
            handleUpdateProps(el.id, { left: curL + dx, top: curT + dy });
          });
        } else if (selectedElement) {
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history, selectedElement, selectedElements, nodes]);

  // Canva-style Fit to Screen calculation (hỗ trợ cả Mobile & Desktop)
  const handleFitToScreen = () => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      const targetZoom = Number(Math.max(0.5, Math.min(1.0, (window.innerWidth - 24) / 500)).toFixed(2));
      setZoomLevel(targetZoom);
      showToast(`🔍 Đã căn vừa chiều rộng điện thoại (${Math.round(targetZoom * 100)}%)`);
    } else {
      const availableHeight = window.innerHeight - 150;
      const rootProps = nodes["ROOT"]?.props || {};
      const rootH = Number(rootProps.height) || 1600;
      const targetZoom = Math.max(0.4, Math.min(1.25, availableHeight / rootH));
      setZoomLevel(Number(targetZoom.toFixed(2)));
      showToast(`🔍 Đã căn chỉnh vừa màn hình (${Math.round(targetZoom * 100)}%)`);
    }
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

  // Add new text from left drawer with anti-overlap positioning
  const handleAddText = (text: string, type: "heading" | "subheading" | "body") => {
    const newId = `text_${Date.now()}`;
    const fontSize = type === "heading" ? 32 : type === "subheading" ? 22 : 16;
    const width = 400;
    const height = 50;
    const gap = 16;
    const shiftAmount = height + gap;

    setNodes((prev) => {
      let targetTop = 400;
      let shiftThresholdY = 400;
      const selectedNode = selectedElement ? prev[selectedElement.id] : null;

      if (selectedNode) {
        const selTop = Number(selectedNode.props?.top ?? 0);
        const selHeight = Number(selectedNode.props?.height ?? 50);
        targetTop = selTop + selHeight + gap;
        shiftThresholdY = selTop + selHeight;
      } else {
        const safe = findNextSafePosition(prev, width, height, 400, 50, gap);
        targetTop = safe.top;
        shiftThresholdY = safe.top;
      }

      // Đẩy các phần tử phía dưới xuống để tránh đè lên
      const newNodes = shiftNodesBelow(prev, shiftThresholdY, shiftAmount);

      const newNode = {
        type: { resolvedName: "TextBox" },
        props: {
          top: targetTop,
          left: 50,
          width,
          height,
          text,
          fontSize,
          color: "#1c171a",
          textAlign: "center",
          zIndex: 25,
        },
      };

      newNodes[newId] = newNode;
      pushHistory(newNodes);
      setSelectedElement({ id: newId, type: "TextBox", props: newNode.props });
      setSelectedElements([{ id: newId, type: "TextBox", props: newNode.props }]);
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

    if (!targetUrl || !targetId || selectedElement?.type !== "PhotoBox") {
      const realSlots = getRealWeddingPhotoSlots(nodes, templateId);
      if (realSlots.length > 0) {
        targetId = realSlots[0].id;
        targetUrl = realSlots[0].props?.imgKey || realSlots[0].props?.src;
        setSelectedElement({ id: targetId, type: "PhotoBox", props: realSlots[0].props });
      }
    }

    if (!targetUrl || !targetId) {
      showToast("Vui lòng chọn một ảnh trên thiệp để xóa phông nền");
      return;
    }

    const safeUrl = getSafeImageUrl(targetUrl);

    try {
      setIsRemovingBg(true);
      showToast("✨ Đang dùng AI tách phông nền ảnh cưới...");
      const transparentPng = await smartRemoveBackground(safeUrl);

      handleUpdateProps(targetId, {
        imgKey: transparentPng,
        src: transparentPng,
        hasBoxShadow: true,
        boxShadow: { blur: 15, color: "rgba(229,65,83,0.3)" },
      });
      setCutoutTargetId(targetId);
      setCutoutTargetUrl(safeUrl);
      setCutoutInitialResult(transparentPng);
      showToast("✨ Đã tách nền nhân vật! Bấm 'Chỉnh sửa bằng tay' nếu muốn vẽ lại.");
    } catch (err) {
      console.error("Lỗi xóa nền:", err);
      showToast("Không thể xóa nền ảnh này, vui lòng thử lại");
    } finally {
      setIsRemovingBg(false);
    }
  };

  // Open manual cutout refinement modal
  const handleOpenManualCutout = () => {
    let targetId = selectedElement?.type === "PhotoBox" ? selectedElement.id : null;
    let targetUrl = selectedElement?.props?.imgKey || selectedElement?.props?.src;

    if (!targetId || !targetUrl) {
      const realSlots = getRealWeddingPhotoSlots(nodes, templateId);
      if (realSlots.length > 0) {
        targetId = realSlots[0].id;
        targetUrl = realSlots[0].props?.imgKey || realSlots[0].props?.src;
        setSelectedElement({ id: targetId, type: "PhotoBox", props: realSlots[0].props });
      }
    }

    if (!targetUrl || !targetId) {
      showToast("Vui lòng chọn một ảnh trên thiệp để chỉnh sửa xóa nền");
      return;
    }

    const safeUrl = getSafeImageUrl(targetUrl);
    setCutoutTargetId(targetId);
    setCutoutTargetUrl(safeUrl);
    setCutoutInitialResult(safeUrl.startsWith("data:image/png") ? safeUrl : null);
    setIsCutoutModalOpen(true);
  };

  // Apply final refined cutout from modal to the PhotoBox
  const handleApplyCutout = (finalCutoutDataUrl: string) => {
    if (!cutoutTargetId) return;

    handleUpdateProps(cutoutTargetId, {
      imgKey: finalCutoutDataUrl,
      src: finalCutoutDataUrl,
      hasBoxShadow: true,
      boxShadow: { blur: 15, color: "rgba(229,65,83,0.3)" },
    });

    addUploadedImageToLibrary(finalCutoutDataUrl);
    showToast("✨ Đã cập nhật ảnh nhân vật vào thiệp!");
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

  // Add stock decoration / sticker (supports drag drop pos)
  const handleAddStock = (
    stockUrl: string,
    name: string,
    pos?: { left?: number; top?: number; x?: number; y?: number }
  ) => {
    const newId = `stock_${Date.now()}`;
    setNodes((prev) => {
      let targetLeft = pos ? (pos.left ?? pos.x ?? 175) : 175;
      let targetTop = pos ? (pos.top ?? pos.y ?? 400) : 400;

      if (!pos) {
        const safe = findNextSafePosition(prev, 150, 150, 400, 175, 20);
        targetTop = safe.top;
        targetLeft = safe.left;
      }

      const newNode = {
        type: { resolvedName: "PhotoBox" },
        props: {
          top: targetTop,
          left: targetLeft,
          width: 150,
          height: 150,
          imgKey: stockUrl,
          src: stockUrl,
          zIndex: 40,
          alt: name,
          isDecorative: false,
          isReplaceable: false,
        },
      };

      const newNodes = { ...prev, [newId]: newNode };
      pushHistory(newNodes);
      setSelectedElement({ id: newId, type: "PhotoBox", props: newNode.props });
      setSelectedElements([{ id: newId, type: "PhotoBox", props: newNode.props }]);
      return newNodes;
    });
  };

  // Add Wedding Frame (Khung ảnh nghệ thuật kéo thả Canva-style với chống đè thông minh)
  const handleAddFrame = (
    frame: WeddingFrameItem,
    pos?: { left?: number; top?: number; x?: number; y?: number }
  ) => {
    const newId = `frame_${Date.now()}`;
    const frameW = frame.defaultWidth;
    const frameH = frame.defaultHeight;
    const gap = 20;

    setNodes((prev) => {
      let targetLeft = pos
        ? (pos.left ?? pos.x ?? Math.max(0, Math.round((500 - frameW) / 2)))
        : Math.max(0, Math.round((500 - frameW) / 2));
      let targetTop = pos ? (pos.top ?? pos.y ?? 350) : 350;
      let shiftThresholdY = targetTop;

      if (!pos) {
        const selectedNode = selectedElement ? prev[selectedElement.id] : null;
        if (selectedNode) {
          const selTop = Number(selectedNode.props?.top ?? 0);
          const selHeight = Number(selectedNode.props?.height ?? 100);
          targetTop = selTop + selHeight + gap;
          shiftThresholdY = selTop + selHeight;
        } else {
          const safe = findNextSafePosition(prev, frameW, frameH, 350, targetLeft, gap);
          targetTop = safe.top;
          shiftThresholdY = safe.top;
        }
      }

      const baseNodes = !pos ? shiftNodesBelow(prev, shiftThresholdY, frameH + gap) : prev;

      const newNode = {
        type: { resolvedName: "PhotoBox" },
        props: {
          top: targetTop,
          left: targetLeft,
          width: frameW,
          height: frameH,
          imgKey: frame.defaultImgKey,
          src: frame.defaultImgKey,
          alt: frame.name,
          frameType: frame.frameType,
          borderRadius: frame.borderRadius,
          borderSize: frame.borderSize || 0,
          borderStyle: frame.borderStyle || "solid",
          borderColor: frame.borderColor || "#d4af37",
          hasBoxShadow: frame.hasBoxShadow ?? true,
          boxShadow: frame.boxShadow,
          zIndex: 35,
          isReplaceable: true,
        },
      };

      const newNodes = { ...baseNodes, [newId]: newNode };
      pushHistory(newNodes);
      setSelectedElement({ id: newId, type: "PhotoBox", props: newNode.props });
      setSelectedElements([{ id: newId, type: "PhotoBox", props: newNode.props }]);
      return newNodes;
    });
  };

  // Co dãn bảng vẽ tại vị trí bên trong / Dời toàn bộ phần tử phía dưới xuống hoặc lên
  const handleShiftElementsBelow = (thresholdY: number, deltaY: number) => {
    setNodes((prev) => {
      const newNodes = { ...prev };
      let count = 0;
      const excludeIds = new Set([
        ...(selectedElements?.map((el) => el.id) || []),
        ...(selectedElement ? [selectedElement.id] : []),
      ]);

      Object.keys(newNodes).forEach((id) => {
        if (id === "ROOT" || excludeIds.has(id)) return;
        const node = newNodes[id];
        const top = Number(node?.props?.top ?? 0);
        if (top >= thresholdY) {
          newNodes[id] = {
            ...node,
            props: {
              ...node.props,
              top: Math.max(0, top + deltaY),
            },
          };
          count++;
        }
      });

      // Mở rộng chiều cao canvas gốc nếu đẩy xuống
      if (deltaY > 0 && newNodes["ROOT"]?.props) {
        newNodes["ROOT"] = {
          ...newNodes["ROOT"],
          props: {
            ...newNodes["ROOT"].props,
            height: Math.max(1400, Number(newNodes["ROOT"].props.height || 1400) + deltaY),
          },
        };
      }

      if (count > 0) {
        pushHistory(newNodes);
      }
      return newNodes;
    });
  };

  // Chèn khoảng trống bố cục (Insert Spacer Gap)
  const handleAddSpacer = (height: number, atY?: number) => {
    const threshold =
      atY !== undefined
        ? atY
        : selectedElement
        ? Number(nodes[selectedElement.id]?.props?.top ?? 0) +
          Number(nodes[selectedElement.id]?.props?.height ?? 100)
        : 600;
    handleShiftElementsBelow(threshold, height);
  };

  // Nhân bản nhiều đối tượng cùng lúc (Duplicate Multi-Selection)
  const handleDuplicateMultiple = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setNodes((prev) => {
      const newNodes = { ...prev };
      const duplicatedElements: SelectedElementData[] = [];
      const offset = 24;

      ids.forEach((id) => {
        const original = prev[id];
        if (!original || id === "ROOT") return;
        const newId = `${id}_copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const duplicated = {
          ...original,
          props: {
            ...original.props,
            top: Number(original.props?.top ?? 0) + offset,
            left: Number(original.props?.left ?? 0) + offset,
          },
        };
        newNodes[newId] = duplicated;
        duplicatedElements.push({
          id: newId,
          type: duplicated.type?.resolvedName || "Element",
          props: duplicated.props,
        });
      });

      pushHistory(newNodes);
      if (duplicatedElements.length > 0) {
        setSelectedElements(duplicatedElements);
        setSelectedElement(duplicatedElements[0]);
      }
      return newNodes;
    });
  };

  // Xóa nhiều đối tượng cùng lúc (Delete Multi-Selection)
  const handleDeleteMultiple = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setNodes((prev) => {
      const newNodes = { ...prev };
      ids.forEach((id) => {
        if (id !== "ROOT") {
          delete newNodes[id];
        }
      });
      pushHistory(newNodes);
      setSelectedElements([]);
      setSelectedElement(null);
      return newNodes;
    });
  };

  // Căn gióng nhiều đối tượng (Align Multi-Selection)
  const handleAlignMultiple = (
    ids: string[],
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom"
  ) => {
    if (!ids || ids.length < 2) return;
    setNodes((prev) => {
      const validNodes = ids
        .map((id) => ({ id, node: prev[id] }))
        .filter((item) => item.node && item.id !== "ROOT");
      if (validNodes.length < 2) return prev;

      let minLeft = Infinity;
      let maxRight = -Infinity;
      let minTop = Infinity;
      let maxBottom = -Infinity;

      validNodes.forEach(({ node }) => {
        const l = Number(node.props?.left ?? 0);
        const t = Number(node.props?.top ?? 0);
        const w = Number(node.props?.width ?? 100);
        const h = Number(node.props?.height ?? 100);
        minLeft = Math.min(minLeft, l);
        maxRight = Math.max(maxRight, l + w);
        minTop = Math.min(minTop, t);
        maxBottom = Math.max(maxBottom, t + h);
      });

      const groupCenterX = minLeft + (maxRight - minLeft) / 2;
      const groupCenterY = minTop + (maxBottom - minTop) / 2;

      const newNodes = { ...prev };
      validNodes.forEach(({ id, node }) => {
        const w = Number(node.props?.width ?? 100);
        const h = Number(node.props?.height ?? 100);
        let newLeft = Number(node.props?.left ?? 0);
        let newTop = Number(node.props?.top ?? 0);

        if (alignment === "left") newLeft = minLeft;
        else if (alignment === "center") newLeft = Math.round(groupCenterX - w / 2);
        else if (alignment === "right") newLeft = maxRight - w;
        else if (alignment === "top") newTop = minTop;
        else if (alignment === "middle") newTop = Math.round(groupCenterY - h / 2);
        else if (alignment === "bottom") newTop = maxBottom - h;

        newNodes[id] = {
          ...node,
          props: {
            ...node.props,
            left: newLeft,
            top: newTop,
          },
        };
      });

      pushHistory(newNodes);
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
    // Smart vertical layout reflow & push-down
    const widgetHeight = Number(defaultProps.height || 180);
    const gap = 24;
    const shiftAmount = widgetHeight + gap;

    let targetTop: number;
    let shiftThresholdY: number;
    const selectedNode = selectedElement ? nodes[selectedElement.id] : null;

    if (selectedNode) {
      // 1. Có phần tử đang chọn: Chèn ngay bên dưới phần tử đang chọn
      const selTop = Number(selectedNode.props?.top ?? 0);
      const selHeight = Number(selectedNode.props?.height ?? 100);
      targetTop = selTop + selHeight + gap;
      shiftThresholdY = selTop + selHeight;
    } else {
      // 2. Không có phần tử nào đang chọn: Chèn vào vị trí trọng tâm hiện tại người dùng đang nhìn trên Canvas
      let viewportCenterY = 400;
      if (typeof document !== "undefined") {
        const scrollArea = document.getElementById("canvas-main-scroll-area");
        if (scrollArea) {
          const currentZoom = zoomLevel || 1;
          const visibleCenter = (scrollArea.scrollTop + (scrollArea.clientHeight / 2) - 80) / currentZoom;
          if (visibleCenter > 50) {
            viewportCenterY = Math.round(visibleCenter);
          }
        }
      }

      const nonDecorativeNodes = Object.entries(nodes).filter(
        ([id, n]) => id !== "ROOT" && !isDecorativeNode(id, n)
      );

      const coveringNode = nonDecorativeNodes.find(([, n]) => {
        const t = Number(n?.props?.top ?? 0);
        const h = Number(n?.props?.height ?? 100);
        return t <= viewportCenterY && (t + h) >= viewportCenterY;
      });

      if (coveringNode) {
        const covTop = Number(coveringNode[1]?.props?.top ?? 0);
        const covHeight = Number(coveringNode[1]?.props?.height ?? 100);
        targetTop = covTop + covHeight + gap;
        shiftThresholdY = covTop + covHeight;
      } else {
        const nodesAboveCenter = nonDecorativeNodes.filter(
          ([, n]) => Number(n.props?.top ?? 0) + Number(n.props?.height ?? 100) <= viewportCenterY
        );

        if (nodesAboveCenter.length > 0) {
          const maxBottomAbove = nodesAboveCenter.reduce((max, [, n]) => {
            const b = Number(n.props?.top ?? 0) + Number(n.props?.height ?? 100);
            return Math.max(max, b);
          }, 0);
          targetTop = Math.max(viewportCenterY - Math.round(widgetHeight / 2), maxBottomAbove + gap);
        } else {
          targetTop = Math.max(100, viewportCenterY - Math.round(widgetHeight / 2));
        }
        shiftThresholdY = targetTop;
      }
    }

    const newNode = {
      type: { resolvedName: widgetType },
      props: {
        ...defaultProps,
        ...(customProps || {}),
        top: targetTop,
        left: Math.max(0, Math.round((500 - (defaultProps.width || 420)) / 2)),
      },
    };

    setNodes((prev) => {
      const newNodes = { ...prev };

      // Tự động đẩy tất cả các phần tử ở phía dưới xuống dưới
      Object.keys(newNodes).forEach((id) => {
        if (id === "ROOT") return;
        if (selectedElement && id === selectedElement.id) return;
        const node = newNodes[id];
        const top = Number(node.props?.top ?? 0);
        if (top >= shiftThresholdY) {
          newNodes[id] = {
            ...node,
            props: {
              ...node.props,
              top: top + shiftAmount,
            },
          };
        }
      });

      // Nới rộng chiều cao tổng của Canvas (ROOT)
      if (newNodes["ROOT"]) {
        const currentCanvasHeight = Number(newNodes["ROOT"].props?.height ?? 1200);
        newNodes["ROOT"] = {
          ...newNodes["ROOT"],
          props: {
            ...newNodes["ROOT"].props,
            height: currentCanvasHeight + shiftAmount,
          },
        };
      }

      newNodes[newId] = newNode;
      pushHistory(newNodes);
      setSelectedElement({ id: newId, type: widgetType, props: newNode.props });
      setSelectedFixedModuleId(null);
      return newNodes;
    });

    if (selectedNode) {
      showToast(`✨ Đã chèn tiện ích bên dưới phần tử đang chọn và tự động đẩy bố cục phía sau xuống!`);
    } else {
      showToast(`✨ Đã chèn tiện ích vào vị trí đang xem và tự động đẩy bố cục phía dưới xuống!`);
    }

    setTimeout(() => {
      const element = document.getElementById(`canvas-node-${newId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

  // Add styled module preset with smart magnetic alignment & vertical layout reflow
  const handleAddModulePreset = (preset: ModulePresetItem) => {
    const newId = `preset_${Date.now()}`;
    const width = preset.defaultWidth || 440;
    const height = preset.defaultHeight || 180;
    const gap = 24;
    const shiftAmount = height + gap;

    // Smart magnetic alignment: center horizontally (x = (500 - width) / 2)
    const targetLeft = Math.max(0, Math.round((500 - width) / 2));

    // Smart positioning & vertical reflow:
    // 1. Nếu có phần tử đang chọn: chèn ngay bên dưới phần tử đó, đẩy toàn bộ các phần tử phía sau xuống dưới!
    // 2. Nếu không có phần tử đang chọn: chèn vào vị trí trọng tâm hiện tại người dùng đang nhìn trên Canvas!
    let targetTop: number;
    let shiftThresholdY: number;
    const selectedNode = selectedElement ? nodes[selectedElement.id] : null;

    if (selectedNode) {
      const selTop = Number(selectedNode.props?.top ?? 0);
      const selHeight = Number(selectedNode.props?.height ?? 100);
      targetTop = selTop + selHeight + gap;
      shiftThresholdY = selTop + selHeight;
    } else {
      let viewportCenterY = 400;
      if (typeof document !== "undefined") {
        const scrollArea = document.getElementById("canvas-main-scroll-area");
        if (scrollArea) {
          const currentZoom = zoomLevel || 1;
          const visibleCenter = (scrollArea.scrollTop + (scrollArea.clientHeight / 2) - 80) / currentZoom;
          if (visibleCenter > 50) {
            viewportCenterY = Math.round(visibleCenter);
          }
        }
      }

      const nonDecorativeNodes = Object.entries(nodes).filter(
        ([id, n]) => id !== "ROOT" && !isDecorativeNode(id, n)
      );

      const coveringNode = nonDecorativeNodes.find(([, n]) => {
        const t = Number(n?.props?.top ?? 0);
        const h = Number(n?.props?.height ?? 100);
        return t <= viewportCenterY && (t + h) >= viewportCenterY;
      });

      if (coveringNode) {
        const covTop = Number(coveringNode[1]?.props?.top ?? 0);
        const covHeight = Number(coveringNode[1]?.props?.height ?? 100);
        targetTop = covTop + covHeight + gap;
        shiftThresholdY = covTop + covHeight;
      } else {
        const nodesAboveCenter = nonDecorativeNodes.filter(
          ([, n]) => Number(n.props?.top ?? 0) + Number(n.props?.height ?? 100) <= viewportCenterY
        );

        if (nodesAboveCenter.length > 0) {
          const maxBottomAbove = nodesAboveCenter.reduce((max, [, n]) => {
            const b = Number(n.props?.top ?? 0) + Number(n.props?.height ?? 100);
            return Math.max(max, b);
          }, 0);
          targetTop = Math.max(viewportCenterY - Math.round(height / 2), maxBottomAbove + gap);
        } else {
          targetTop = Math.max(100, viewportCenterY - Math.round(height / 2));
        }
        shiftThresholdY = targetTop;
      }
    }

    const effect = preset.blockEffect;
    const defaultTransition = effect
      ? {
          effectEnabled: true,
          effectType: effect.entranceEffect,
          effectDuration: effect.entranceDuration,
          effectDelay: effect.entranceDelay || 0,
          effectEasing: "cubic-bezier(0.16, 1, 0.3, 1)",
        }
      : { effectEnabled: true, effectType: "fadeInUp", effectDuration: 1.2 };

    const defaultContinuous = effect
      ? {
          type: effect.continuousEffect,
          duration: effect.continuousDuration || 3.0,
          delay: 0,
        }
      : { type: "none", duration: 3, delay: 0 };

    const newNode = {
      type: { resolvedName: preset.type },
      props: {
        ...preset.defaultProps,
        transition: preset.defaultProps?.transition || defaultTransition,
        continuousAnimation: preset.defaultProps?.continuousAnimation || defaultContinuous,
        left: targetLeft,
        top: targetTop,
        width,
        height,
        zIndex: 50,
      },
    };

    setNodes((prev) => {
      const newNodes = { ...prev };

      // Tự động đẩy tất cả các layout/phần tử nằm phía dưới xuống dưới
      Object.keys(newNodes).forEach((id) => {
        if (id === "ROOT") return;
        if (selectedElement && id === selectedElement.id) return;
        const node = newNodes[id];
        const top = Number(node.props?.top ?? 0);
        if (top >= shiftThresholdY) {
          newNodes[id] = {
            ...node,
            props: {
              ...node.props,
              top: top + shiftAmount,
            },
          };
        }
      });

      // Nới rộng chiều cao tổng của Canvas (ROOT) để không bị cắt cụt
      if (newNodes["ROOT"]) {
        const currentCanvasHeight = Number(newNodes["ROOT"].props?.height ?? 1200);
        newNodes["ROOT"] = {
          ...newNodes["ROOT"],
          props: {
            ...newNodes["ROOT"].props,
            height: currentCanvasHeight + shiftAmount,
          },
        };
      }

      newNodes[newId] = newNode;
      pushHistory(newNodes);
      setSelectedElement({ id: newId, type: preset.type, props: newNode.props });
      setSelectedFixedModuleId(null);
      return newNodes;
    });

    if (selectedNode) {
      showToast(`✨ Đã chèn khối "${preset.name}" bên dưới phần tử đang chọn và tự động đẩy bố cục phía sau xuống!`);
    } else {
      showToast(`✨ Đã chèn khối "${preset.name}" vào vị trí đang xem và tự động đẩy bố cục phía dưới xuống!`);
    }

    setTimeout(() => {
      const element = document.getElementById(`canvas-node-${newId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

  // Tự động giãn cách và chống đè tất cả các khối nội dung trên bảng vẽ (1-click Auto Layout)
  const handleAutoArrangeAllBlocks = () => {
    setNodes((prev) => {
      const { newNodes, movedCount } = autoArrangeAllBlocks(prev, 24);
      if (movedCount > 0) {
        pushHistory(newNodes);
        showToast(`🪄 Đã tự động giãn cách ${movedCount} khối, đảm bảo không còn khối nào đè lên nhau!`);
        return newNodes;
      } else {
        showToast(`✨ Bố cục hiện tại đã rất gọn gàng và không có khối nào đè lên nhau.`);
        return prev;
      }
    });
  };

  // Tự động đẩy dời các khối bị đè khi một khối vừa được di chuyển/thả chuột
  const handleResolveOverlap = (elementId: string) => {
    setNodes((prev) => {
      const { updatedNodes, hasOverlaps } = resolveOverlapForMovedNode(prev, elementId, 20);
      if (hasOverlaps) {
        pushHistory(updatedNodes);
        showToast(`🛡️ Đã tự động đẩy các khối bên dưới để tránh đè lên khối vừa di chuyển.`);
        return updatedNodes;
      }
      return prev;
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

  // Switch template in-place without reloading the entire page
  const handleSelectTemplate = (tpl: ZenLoveTemplate) => {
    try {
      weddingSounds.playSoftClick();
    } catch {}

    if (tpl.id === templateId) {
      showToast(`Mẫu "${tpl.name}" đang được mở`);
      return;
    }

    // 1. Cập nhật URL trình duyệt (SPA Navigation) mà không reload toàn bộ trang
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/design-template/${tpl.id}`);
    }

    // 2. Kích hoạt state templateId để nạp dữ liệu template mới
    setTemplateId(tpl.id);
    setCurrentZenloveTemplate(tpl);
    setTemplateName(tpl.name);
    setSelectedFixedModuleId(null);

    // 3. Giữ nguyên tab "Mẫu thiệp" và mở Left Drawer
    setActiveLeftTab("templates");
    setIsLeftDrawerOpen(true);

    showToast(`✨ Đang nạp mẫu: "${tpl.name}"...`);
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
  function buildCardFromCurrentState(customNodesOverride?: Record<string, any>) {
    const slug = templateId === "8c5055d8-30db-4b38-8831-e11063e3d352" ? "hong-phong" : templateId;
    const existing = getCardByIdOrSlug(templateId) || getCardByIdOrSlug(slug);
    const activeNodes = customNodesOverride || nodes;

    // Trích xuất thông tin thực tế từ template nodes và metadata
    const extracted = extractWeddingDetailsFromTemplate(activeNodes, currentZenloveTemplate);

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

    const photoNodes = Object.values(activeNodes).filter(
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

    // Album thiệp cưới: Ưu tiên state cardAlbum do người dùng sắp xếp trong Studio
    const userUploadedPhotos = getSavedUploadedImages();
    const mergedAlbum = Array.from(
      new Set(
        [
          coverImage,
          ...(cardAlbum.length > 0 ? cardAlbum : (existing?.album || [])),
          ...userUploadedPhotos,
        ].filter((u) => Boolean(u) && typeof u === "string" && u.trim().length > 0)
      )
    );

    let finalAlbum: string[];
    if (isAlbumInitializedRef.current) {
      finalAlbum = cardAlbum;
    } else if (cardAlbum.length > 0) {
      finalAlbum = cardAlbum;
    } else if (Array.isArray(existing?.album)) {
      finalAlbum = existing.album;
    } else {
      finalAlbum = mergedAlbum;
    }

    if (finalAlbum.length > 0 && finalAlbum[0]) {
      coverImage = finalAlbum[0];
    }

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
      status: base?.status || existing?.status || "draft",
      updatedAt: new Date().toLocaleDateString("vi-VN"),
      views: base?.views !== undefined ? base.views : (existing?.views !== undefined ? existing.views : 0),
      userId: currentUserId,
      coverImage: coverImage || currentZenloveTemplate?.imageUrl || extracted.coverImage || "",
      story:
        base?.story !== undefined
          ? base.story
          : (existing?.story !== undefined
            ? existing.story
            : (extracted.story || "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương.")),
      weddingDate,
      weddingTime,
      lunarDate,
      showGiftBox: base?.showGiftBox !== undefined ? base.showGiftBox : (existing?.showGiftBox !== undefined ? existing.showGiftBox : true),
      showWishes: base?.showWishes !== undefined ? base.showWishes : (existing?.showWishes !== undefined ? existing.showWishes : true),
      showRsvp: base?.showRsvp !== undefined ? base.showRsvp : (existing?.showRsvp !== undefined ? existing.showRsvp : true),
      showCalendar: base?.showCalendar !== undefined ? base.showCalendar : (existing?.showCalendar !== undefined ? existing.showCalendar : true),
      showEvents: base?.showEvents !== undefined ? base.showEvents : (existing?.showEvents !== undefined ? existing.showEvents : true),
      showLoveStory: base?.showLoveStory !== undefined ? base.showLoveStory : (existing?.showLoveStory !== undefined ? existing.showLoveStory : true),
      showAlbum: base?.showAlbum !== undefined ? base.showAlbum : (existing?.showAlbum !== undefined ? existing.showAlbum : true),
      loveStory: base?.loveStory !== undefined ? base.loveStory : (existing?.loveStory !== undefined ? existing.loveStory : DEFAULT_LOVE_STORY),
      envelopeTheme: base?.envelopeTheme || existing?.envelopeTheme || "traditional",
      ambientEffect: effectConfig.type,
      effectConfig: effectConfig,
      cinematicFx: base?.cinematicFx || existing?.cinematicFx,
      groom: {
        userId: currentUserId,
        name: base?.groom?.name !== undefined ? base.groom.name : groomName,
        title: "Chú Rể",
        phone: base?.groom?.phone !== undefined ? base.groom.phone : (existing?.groom?.phone !== undefined ? existing.groom.phone : ""),
        parents: base?.groom?.parents !== undefined ? base.groom.parents : (existing?.groom?.parents !== undefined ? existing.groom.parents : (extracted.parentsGroom || "")),
        bankName: base?.groom?.bankName !== undefined ? base.groom.bankName : (existing?.groom?.bankName !== undefined ? existing.groom.bankName : ""),
        accountNumber: base?.groom?.accountNumber !== undefined ? base.groom.accountNumber : (existing?.groom?.accountNumber !== undefined ? existing.groom.accountNumber : ""),
        accountName: base?.groom?.accountName !== undefined ? base.groom.accountName : (existing?.groom?.accountName !== undefined ? existing.groom.accountName : (base?.groom?.name || groomName)),
        qrCode: base?.groom?.qrCode || existing?.groom?.qrCode,
      },
      bride: {
        name: base?.bride?.name !== undefined ? base.bride.name : brideName,
        title: "Cô Dâu",
        phone: base?.bride?.phone !== undefined ? base.bride.phone : (existing?.bride?.phone !== undefined ? existing.bride.phone : ""),
        parents: base?.bride?.parents !== undefined ? base.bride.parents : (existing?.bride?.parents !== undefined ? existing.bride.parents : (extracted.parentsBride || "")),
        bankName: base?.bride?.bankName !== undefined ? base.bride.bankName : (existing?.bride?.bankName !== undefined ? existing.bride.bankName : ""),
        accountNumber: base?.bride?.accountNumber !== undefined ? base.bride.accountNumber : (existing?.bride?.accountNumber !== undefined ? existing.bride.accountNumber : ""),
        accountName: base?.bride?.accountName !== undefined ? base.bride.accountName : (existing?.bride?.accountName !== undefined ? existing.bride.accountName : (base?.bride?.name || brideName)),
        qrCode: base?.bride?.qrCode || existing?.bride?.qrCode,
      },
      events: base?.events !== undefined ? base.events : (existing?.events !== undefined ? existing.events : [
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
      ]),
      album: finalAlbum,
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
      rsvps: base?.rsvps || existing?.rsvps || [],
      wishes: base?.wishes || existing?.wishes || [],
      fixedModuleStyles: base?.fixedModuleStyles || existing?.fixedModuleStyles,
      rsvpTitle: base?.rsvpTitle !== undefined ? base.rsvpTitle : existing?.rsvpTitle,
      rsvpMessage: base?.rsvpMessage !== undefined ? base.rsvpMessage : existing?.rsvpMessage,
      wishesTitle: base?.wishesTitle !== undefined ? base.wishesTitle : existing?.wishesTitle,
      wishesDescription: base?.wishesDescription !== undefined ? base.wishesDescription : existing?.wishesDescription,
      isVip: base?.isVip !== undefined ? base.isVip : existing?.isVip,
      plan: base?.plan || existing?.plan,
      vipUnlockedAt: base?.vipUnlockedAt || existing?.vipUnlockedAt,
      showWatermark: base?.showWatermark !== undefined ? base.showWatermark : existing?.showWatermark,
      nodes: activeNodes,
    };

    return cardToSave;
  };

  // Album Handler - Cập nhật danh sách ảnh trong album cưới và đồng bộ ảnh bìa
  const handleUpdateAlbum = (newAlbum: string[]) => {
    setCardAlbum(newAlbum);
    setCustomCardData((prev) => {
      const base = prev || buildCardFromCurrentState();
      return {
        ...base,
        album: newAlbum,
        coverImage: newAlbum[0] || base.coverImage,
      };
    });
    triggerDebouncedAutosave();
  };

  // Manual Save Handler - Saves current state and syncs to Supabase server
  const handleManualSave = async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    revisionRef.current += 1;
    const targetRevision = revisionRef.current;
    const card = buildCardFromCurrentState();
    setSaveStatus("saving");
    saveCard(card);

    if (!isAuthenticated) {
      setSaveStatus("offline");
      showToast("💾 Đã lưu cục bộ trên thiết bị của bạn!");
      return;
    }

    showToast("⏳ Đang lưu bản thiết kế lên máy chủ...");
    const res = await saveCardAsync(card);
    if (res.success) {
      if (revisionRef.current === targetRevision) {
        lastSavedRevisionRef.current = targetRevision;
        setSaveStatus("saved");
      }
      showToast("💾 Đã lưu và đồng bộ lên máy chủ thành công!");
    } else {
      setSaveStatus("offline");
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
    setSaveStatus("saving");
    showToast("⏳ Đang lưu cài đặt lên máy chủ...");
    if (updatedCard.templateName) {
      setTemplateName(updatedCard.templateName);
    }
    const res = await saveCardAsync(updatedCard);
    setSaveStatus(res.success ? "saved" : "offline");
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
    setIsLivePreviewOpen(true);
  };

  // Publish Handler - Saves card, syncs to server and opens shareable QR code publish modal
  const handlePublish = async () => {
    if (isPublishing) return;
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
    if (isPublishing) return;
    setIsPublishing(true);
    setSaveStatus("saving");
    showToast("⏳ Đang lưu và xuất bản thiệp lên máy chủ...");
    try {
      const card = cardToPublish || buildCardFromCurrentState();
      const saveRes = await saveCardAsync(card);
      if (!saveRes.success) {
        showToast("⚠️ Không thể lưu bản thiết kế: " + (saveRes.message || "Lỗi mạng"));
        setSaveStatus("offline");
        return;
      }

      const pubRes = await apiFetch(`/api/cards/${card.id}/publish`, {
        method: "POST",
      });

      if (!pubRes.ok) {
        const errData = await pubRes.json().catch(() => ({}));
        showToast("⚠️ Xuất bản thất bại: " + (errData.message || `Lỗi HTTP ${pubRes.status}`));
        setSaveStatus("error");
        return;
      }

      const pubData = await pubRes.json();
      const publishedCard: WeddingCard = {
        ...card,
        status: "published",
        slug: pubData.card?.slug || card.slug,
      };

      setCustomCardData(publishedCard);
      saveCard(publishedCard);
      lastSavedRevisionRef.current = revisionRef.current;
      setSaveStatus("saved");
      showToast("🚀 Thiệp cưới đã xuất bản thành công!");

      setIsPublishModalOpen(true);
    } catch (err: any) {
      console.error("Publish error:", err);
      showToast("⚠️ Có lỗi xảy ra trong quá trình xuất bản.");
      setSaveStatus("offline");
    } finally {
      setIsPublishing(false);
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

  // Export JSON backup for design preservation
  const handleExportJsonBackup = () => {
    try {
      const currentCard = buildCardFromCurrentState();
      const backupData = {
        version: "zenlove-v1",
        exportedAt: new Date().toISOString(),
        templateId,
        templateName,
        card: currentCard,
        nodes,
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zenlove-backup-${(templateName || "thiep-cuoi").replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("💾 Đã tải file sao lưu thiết kế (.json) thành công!");
    } catch (err) {
      console.error(err);
      showToast("Không thể tải file sao lưu, vui lòng thử lại.");
    }
  };

  // Restore design from JSON backup
  const handleImportJsonBackup = (jsonData: any) => {
    try {
      if (!jsonData || typeof jsonData !== "object") {
        throw new Error("Dữ liệu sao lưu không hợp lệ");
      }
      const importedNodes = jsonData.nodes || jsonData.card?.nodes;
      if (importedNodes && typeof importedNodes === "object") {
        setNodes(importedNodes);
        pushHistory(importedNodes);
      }
      if (jsonData.card) {
        setCustomCardData(jsonData.card);
      }
      if (jsonData.templateName) {
        setTemplateName(jsonData.templateName);
      }
      triggerDebouncedAutosave();
      showToast("✨ Đã khôi phục thiết kế từ file sao lưu thành công!");
    } catch (err) {
      console.error(err);
      showToast("Lỗi: File JSON không đúng định dạng sao lưu ZenLove!");
    }
  };

  const handleToggleFixedModuleCanvas = (key: keyof WeddingCard, value: boolean) => {
    setCustomCardData((prev) => {
      const base = prev || buildCardFromCurrentState();
      const updated = { ...base, [key]: value };
      saveCard(updated);
      saveCardAsync(updated).catch(() => {});
      return updated;
    });
    showToast(`${value ? "✓ Đã bật hiển thị" : "✕ Đã tắt"} khối trên bảng thiết kế!`);
  };

  const handleSaveFixedModuleConfig = (updatedCard: WeddingCard) => {
    setCustomCardData(updatedCard);
    saveCard(updatedCard);
    saveCardAsync(updatedCard).catch(() => {});
    showToast("✨ Đã cập nhật thông tin & kiểu mẫu khối cố định!");
  };

  if (!isClientMounted) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#18181b] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-medium tracking-wide">
            Đang khởi tạo ZenLove Studio...
          </p>
        </div>
      </div>
    );
  }

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
        saveStatus={saveStatus}
        isPublishing={isPublishing}
        onRetrySave={handleManualSave}
      />

      {/* ================= 2. WORKSPACE BODY (Rail + Drawer + Canvas + Inspector) ================= */}
      <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden relative">
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
          cardAlbum={cardAlbum.length > 0 ? cardAlbum : (customCardData?.album || [])}
          onUpdateAlbum={handleUpdateAlbum}
          activeTab={activeLeftTab}
          isOpen={isLeftDrawerOpen}
          onClose={() => setIsLeftDrawerOpen(false)}
          onSelectTab={(tab) => {
            setActiveLeftTab(tab);
            if (!isLeftDrawerOpen) setIsLeftDrawerOpen(true);
          }}
          onOpenAutoFillModal={() => setIsAutoFillModalOpen(true)}
          onApplyAutoFill={handleApplyAutoFill}
          onSelectElement={handleSelectElement}
          onRepairDecorations={handleRepairDecorations}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
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
          onAddFrame={handleAddFrame}
          onAddSpacer={handleAddSpacer}
          onShiftElementsBelow={handleShiftElementsBelow}
          onRemoveBackground={handleRemoveBackground}
          onOpenManualCutout={handleOpenManualCutout}
          isRemovingBackground={isRemovingBg}
          onExportPng={handleExportCardImage}
          onExportJson={handleExportJsonBackup}
          onImportJson={handleImportJsonBackup}
          currentMusic={currentMusic}
          onChangeMusic={handleChangeMusic}
          onAddWidget={handleAddWidget}
          onAddModulePreset={handleAddModulePreset}
          currentTemplateId={templateId}
          isLoadingTemplate={isLoadingTemplate}
          onSelectTemplate={handleSelectTemplate}
          onApplyThemePreset={handleApplyThemePreset}
          onOpenSettings={() => {
            setActiveLeftTab("widgets");
            setIsLeftDrawerOpen(true);
          }}
          onOpenModuleConfig={handleSelectFixedModule}
          onSelectFixedModule={handleSelectFixedModule}
          currentEffectConfig={effectConfig}
          onChangeEffectConfig={(newConf) => {
            setEffectConfig(newConf);
            setCustomCardData((prev) => {
              const base = prev || buildCardFromCurrentState();
              return {
                ...base,
                ambientEffect: newConf.type,
                effectConfig: newConf,
              };
            });
            triggerDebouncedAutosave();
          }}
          onToggleEffect={(effName) => {
            setEffectConfig((prev) => ({
              ...prev,
              type: effName as any,
              enabled: true,
            }));
            triggerDebouncedAutosave();
          }}
          onChangeEnvelopeTheme={(theme) => {
            setCustomCardData((prev) => {
              const base = prev || buildCardFromCurrentState();
              return {
                ...base,
                envelopeTheme: theme as any,
              };
            });
            triggerDebouncedAutosave();
          }}
          onChangeCinematicFx={(fx) => {
            setCustomCardData((prev) => {
              const base = prev || buildCardFromCurrentState();
              return {
                ...base,
                cinematicFx: fx,
              };
            });
            triggerDebouncedAutosave();
          }}
          onPreviewEnvelope={() => {
            setIsPreviewEnvelopeOpen(true);
            setIsPreviewEnvelopeOpening(false);
          }}
        />

        {/* Center Canvas (Blueprint Grid + Mobile Viewport + Bounding Box + Multi-Selection + Canvas Splitter) */}
        <EditorCanvas
          nodes={nodes}
          selectedElement={selectedElement}
          selectedElements={selectedElements}
          onSelectElement={handleSelectElement}
          onSelectElements={handleSelectElements}
          onToggleSelectElement={handleToggleSelectElement}
          onUpdateElementProps={handleUpdateProps}
          onDeleteElement={handleDeleteElement}
          onDeleteMultipleElements={handleDeleteMultiple}
          onDuplicateElement={handleDuplicateElement}
          onDuplicateMultipleElements={handleDuplicateMultiple}
          onAlignMultipleElements={handleAlignMultiple}
          onShiftElementsBelow={handleShiftElementsBelow}
          onAutoArrangeBlocks={handleAutoArrangeAllBlocks}
          onResolveOverlap={handleResolveOverlap}
          onAddFrame={handleAddFrame}
          onAddSpacer={handleAddSpacer}
          onAddStock={handleAddStock}
          onAddWidget={handleAddWidget}
          onAddModulePreset={handleAddModulePreset}
          zoomLevel={zoomLevel}
          onZoomIn={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
          onZoomOut={() => setZoomLevel((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
          onResetZoom={() => setZoomLevel(0.85)}
          onSetZoomLevel={(z) => setZoomLevel(z)}
          onFitToScreen={handleFitToScreen}
          onQuickReplacePhoto={handleQuickReplacePhoto}
          onOpenImageDrawer={() => {
            setActiveLeftTab("image");
            setIsLeftDrawerOpen(true);
          }}
          onRemoveBackground={handleRemoveBackground}
          onOpenManualCutout={handleOpenManualCutout}
          onOpenPreview={handlePreview}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          isLeftDrawerOpen={isLeftDrawerOpen}
          card={customCardData || buildCardFromCurrentState()}
          onOpenFixedModulesTab={() => {
            setActiveLeftTab("widgets");
            setIsLeftDrawerOpen(true);
          }}
          onToggleFixedModule={handleToggleFixedModuleCanvas}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenModuleConfig={handleSelectFixedModule}
          selectedFixedModuleId={selectedFixedModuleId}
          onSelectFixedModule={handleSelectFixedModule}
          effectConfig={effectConfig}
        />

        {/* Right Properties Inspector (Settings & Effects tabs) */}
        <EditorRightInspector
          selectedElement={selectedElement}
          onUpdateProps={handleUpdateProps}
          selectedFixedModuleId={selectedFixedModuleId}
          card={customCardData || buildCardFromCurrentState()}
          onUpdateCard={(updated) => {
            setCustomCardData(updated);
            triggerDebouncedAutosave();
          }}
          onToggleFixedModule={handleToggleFixedModuleCanvas}
          onCloseFixedModule={() => setSelectedFixedModuleId(null)}
          onOpenAlbumDrawer={() => {
            setActiveLeftTab("image");
            setIsLeftDrawerOpen(true);
          }}
          onReplaceImage={() => {
            setActiveLeftTab("image");
            setIsLeftDrawerOpen(true);
          }}
          onRemoveBackground={handleRemoveBackground}
          onOpenManualCutout={handleOpenManualCutout}
          isRemovingBackground={isRemovingBg}
          onApplyComboToAll={(combo) => {
            setNodes((prev) => {
              const next = applyComboToNodes(prev, combo, true);
              pushHistory(next);
              return next;
            });
            showToast(`✨ Đã áp dụng Combo "${combo.name}" cho toàn bộ thiệp!`);
          }}
          onApplyStaggerAll={(stepDelay) => {
            setNodes((prev) => {
              const next = applyStaggerToNodes(prev, stepDelay);
              pushHistory(next);
              return next;
            });
            showToast(`🌊 Đã tạo hiệu ứng so le (${stepDelay}s) cho toàn bộ thiệp!`);
          }}
          onOpenTab={(tab) => {
            setActiveLeftTab(tab);
            setIsLeftDrawerOpen(true);
          }}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenPreview={handlePreview}
          onPublish={handlePublish}
          onDeselectElement={() => {
            setSelectedElement(null);
            setSelectedFixedModuleId(null);
          }}
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
        onOpenAlbumEditor={() => {
          setActiveLeftTab("image");
          setIsLeftDrawerOpen(true);
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
        slugOrId={customCardData?.slug || buildCardFromCurrentState().slug}
        card={customCardData || buildCardFromCurrentState()}
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
        onFixWarning={(type) => {
          if (type === "photo") {
            setActiveLeftTab("image");
            setIsLeftDrawerOpen(true);
          } else if (type === "qr") {
            setIsSettingsModalOpen(true);
          } else {
            setActiveLeftTab("autofill");
            setIsLeftDrawerOpen(true);
          }
        }}
      />

      {/* 6. MANUAL BACKGROUND CUTOUT & REFINEMENT MODAL */}
      <EditorBackgroundCutoutModal
        isOpen={isCutoutModalOpen}
        onClose={() => setIsCutoutModalOpen(false)}
        imageUrl={cutoutTargetUrl || ""}
        initialCutoutUrl={cutoutInitialResult || undefined}
        onApply={handleApplyCutout}
      />

      {/* 7. FIXED MODULE CONFIG & STYLE VARIANT MODAL */}
      <EditorFixedModuleEditModal
        isOpen={Boolean(activeFixedModuleConfigId)}
        onClose={() => setActiveFixedModuleConfigId(null)}
        moduleId={activeFixedModuleConfigId}
        card={customCardData || buildCardFromCurrentState()}
        onSaveCard={handleSaveFixedModuleConfig}
      />

      {/* 8. LIVE PREVIEW: 3D LUXURY ENVELOPE WITH WAX SEAL */}
      {isPreviewEnvelopeOpen && (
        <LuxuryEnvelopeModal
          isOpen={false}
          isOpening={isPreviewEnvelopeOpening}
          onOpen={handleOpenEnvelopePreview}
          guestName="Khách Quý VIP"
          groomName={buildCardFromCurrentState().groom?.name || "Chú Rể"}
          brideName={buildCardFromCurrentState().bride?.name || "Cô Dâu"}
          weddingDate={buildCardFromCurrentState().weddingDate}
          venue={buildCardFromCurrentState().events?.[0]?.venue || "Trung tâm tiệc cưới"}
          coverImage={buildCardFromCurrentState().coverImage}
          theme={buildCardFromCurrentState().envelopeTheme || "cream"}
          customSealSymbol={buildCardFromCurrentState().cinematicFx?.sealSymbol}
        />
      )}

      {/* 8. AUTH GUARD OVERLAY FOR STUDIO CANVAS */}
      {isClientMounted && !isAuthenticated && !hasDismissedAuthGuard && (
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
                onClick={() => setHasDismissedAuthGuard(true)}
                className="w-full py-3 px-6 rounded-full bg-rose-50 hover:bg-rose-100 text-zen-primary font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>✨ Trải nghiệm thiết kế thử ngay</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/templates")}
                className="w-full py-2.5 px-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
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
