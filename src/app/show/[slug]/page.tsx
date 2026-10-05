"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Volume2,
  VolumeX,
  Music,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Send,
  CheckCircle,
  Copy,
  Share2,
  QrCode,
  Sparkles,
  ChevronDown,
  Navigation,
  Check,
  User,
  Phone,
  MessageCircle,
  ExternalLink,
  Gift,
  Download,
} from "lucide-react";
import {
  getCardByIdOrSlug,
  fetchCardFromServer,
  addRsvp,
  addWish,
  incrementCardViews,
  WeddingCard,
} from "@/lib/weddingCardService";
import { generateVietQrUrl } from "@/lib/vietQrBankCodes";
import FallingPetals from "@/components/FallingPetals";
import CardNodeRenderer from "@/components/CardNodeRenderer";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";
import { convertFormTemplateToCanvasNodes } from "@/lib/templateFormAdapter";

export default function ShowInvitationPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "hong-phong";

  // Card state
  const [card, setCard] = useState<WeddingCard | null>(null);

  // Đảm bảo card.nodes luôn là Canvas Nodes đầy đủ 100% (tự động convert nếu là form 26 keys)
  const activeNodes = React.useMemo(() => {
    if (!card?.nodes) return undefined;
    if (card.nodes.ROOT) return card.nodes;
    if (card.nodes.basicInfo || card.nodes.theme) {
      return convertFormTemplateToCanvasNodes(card.nodes, {
        id: card.id,
        name: card.name,
        imageUrl: card.coverImage,
        slug: card.slug,
      });
    }
    return card.nodes;
  }, [card?.nodes, card?.id, card?.name, card?.coverImage, card?.slug]);

  // Envelope state (opened or closed & 3D opening animation)
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [isEnvelopeOpening, setIsEnvelopeOpening] = useState(false);
  const [petalsEnabled, setPetalsEnabled] = useState(true);

  // Gift QR Modal & Toast state
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [activeGiftTab, setActiveGiftTab] = useState<"groom" | "bride">("groom");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 42,
    hours: 14,
    minutes: 36,
    seconds: 52,
  });

  const setupCountdown = (found: WeddingCard) => {
    if (found.weddingDate) {
      const target = new Date(`${found.weddingDate}T${found.weddingTime || "11:00"}:00`).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }
  };

  // Helper to extract custom names from nodes
  const extractNamesFromNodes = (nodes?: Record<string, any>) => {
    let groom = "Chú Rể";
    let bride = "Cô Dâu";
    if (!nodes) return { groom, bride };

    Object.values(nodes).forEach((n: any) => {
      if (n.type?.resolvedName === "TextBox" && typeof n.props?.text === "string") {
        const text = n.props.text.replace(/<[^>]*>/g, "").trim();
        if ((text.includes("&") || text.includes("và")) && text.length < 50) {
          const parts = text.split(/&|và/);
          if (parts[0]?.trim()) groom = parts[0].trim();
          if (parts[1]?.trim()) bride = parts[1].trim();
        }
      }
    });
    return { groom, bride };
  };

  // Load card data (first local, then fresh from server, then ZenLove template catalog)
  useEffect(() => {
    let active = true;

    // 1. Kiểm tra bộ nhớ cục bộ (nếu người dùng vừa chỉnh sửa trong Editor)
    const found = getCardByIdOrSlug(slug);
    if (found) {
      setCard(found);
      setupCountdown(found);
      if (found.nodes && Object.keys(found.nodes).length > 2) {
        // Đã có đầy đủ thiết kế tùy biến
        incrementCardViews(slug);
        return;
      }
    }

    // 2. Tải từ cơ sở dữ liệu Supabase Backend
    fetchCardFromServer(slug).then((serverCard) => {
      if (!active) return;
      if (serverCard) {
        setCard(serverCard);
        setupCountdown(serverCard);
        if (serverCard.nodes && Object.keys(serverCard.nodes).length > 2) {
          return;
        }
      }

      // 3. Nếu chưa có nodes thiết kế: Tải nodes trực tiếp từ API ZenLove Template
      fetch(`/api/zenlove-template/${slug}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!active) return;
          if (data?.success && data?.data?.parsedNodes) {
            const meta = ZENLOVE_TEMPLATES.find((t) => t.id === slug || t.slug === slug);
            setCard((prev) => {
              const nodes = data.data.parsedNodes;
              let { groom, bride } = extractNamesFromNodes(nodes);

              // Xử lý mẫu dạng FORM (như Đồng Xanh,...)
              if (nodes?.basicInfo) {
                const b = nodes.basicInfo;
                if (b.groomFullName || b.groomShortName) {
                  groom = b.groomFullName || b.groomShortName;
                }
                if (b.brideFullName || b.brideShortName) {
                  bride = b.brideFullName || b.brideShortName;
                }
              }

              let coverImage = meta?.imageUrl || data.data.thumbnail || "";
              if (nodes?.endingPhoto?.fileKey) {
                const fk = nodes.endingPhoto.fileKey.replace(/^\//, "");
                coverImage = fk.startsWith("http") ? fk : `https://cdn-resource.zenlove.me/${fk}`;
              }

              let weddingDate = "2026-11-18";
              let weddingTime = "11:00";
              if (nodes?.weddingDate?.date) {
                try {
                  const d = new Date(nodes.weddingDate.date);
                  weddingDate = d.toISOString().split("T")[0];
                  if (nodes.weddingDate.hour !== undefined) {
                    weddingTime = `${String(nodes.weddingDate.hour).padStart(2, "0")}:${String(nodes.weddingDate.minute || 0).padStart(2, "0")}`;
                  }
                } catch {}
              }

              let story = "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương.";
              if (nodes?.introMent?.description) {
                story = nodes.introMent.description.replace(/<[^>]*>/g, " ").trim();
              }

              let events = prev?.events || [];
              if (nodes?.weddingLocation?.locations && nodes.weddingLocation.locations.length > 0) {
                events = nodes.weddingLocation.locations.map((loc: any, idx: number) => ({
                  id: loc.id || `loc-${idx}`,
                  title: loc.title || "Địa điểm hôn lễ",
                  time: `${weddingTime} • ${weddingDate}`,
                  venue: loc.roadAddress || loc.displayAddress || "Tư gia",
                  address: loc.roadAddress || loc.displayAddress || "",
                  mapUrl: `https://maps.google.com/?q=${encodeURIComponent(loc.roadAddress || loc.displayAddress || "")}`,
                }));
              }

              const newCard: WeddingCard = {
                id: slug,
                slug: slug,
                name: data.data.name || meta?.name || "Thiệp Cưới",
                templateId: meta?.id || slug,
                templateName: data.data.name || meta?.name || "ZenLove",
                status: "published",
                updatedAt: new Date().toLocaleDateString("vi-VN"),
                views: 120,
                coverImage,
                story,
                weddingDate,
                weddingTime,
                lunarDate: "Ngày 10 tháng 10 năm Bính Ngọ",
                groom: {
                  name: prev?.groom?.name && prev.groom.name !== "Chú Rể" ? prev.groom.name : groom,
                  title: "Chú Rể",
                  phone: prev?.groom?.phone || "0912.345.678",
                  parents: nodes?.basicInfo?.groomParentTitle
                    ? `${nodes.basicInfo.groomParentTitle} ${nodes.basicInfo.groomFatherName || ""} & ${nodes.basicInfo.groomMatherName || ""}`
                    : undefined,
                },
                bride: {
                  name: prev?.bride?.name && prev.bride.name !== "Cô Dâu" ? prev.bride.name : bride,
                  title: "Cô Dâu",
                  phone: prev?.bride?.phone || "0987.654.321",
                  parents: nodes?.basicInfo?.brideParentTitle
                    ? `${nodes.basicInfo.brideParentTitle} ${nodes.basicInfo.brideFatherName || ""} & ${nodes.basicInfo.brideMatherName || ""}`
                    : undefined,
                },
                events: events.length > 0 ? events : prev?.events || [],
                album: prev?.album || [],
                musicTitle: data.data.musicName || meta?.musicName || "Nhạc cưới",
                musicUrl: data.data.musicUrl || meta?.musicUrl || "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
                rsvps: prev?.rsvps || [],
                wishes: prev?.wishes || [],
                nodes,
              };

              setupCountdown(newCard);
              return newCard;
            });
          }
        })
        .catch(() => {});
    });

    incrementCardViews(slug);
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio playback toggle
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  const handleOpenEnvelope = () => {
    if (isEnvelopeOpening) return;
    setIsEnvelopeOpening(true);
    if (audioRef.current && !isPlayingAudio) {
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
    setTimeout(() => {
      setIsEnvelopeOpen(true);
      setIsEnvelopeOpening(false);
    }, 1150);
  };

  // RSVP Form state
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpPhone, setRsvpPhone] = useState("");
  const [rsvpAttending, setRsvpAttending] = useState<"yes" | "no">("yes");
  const [rsvpGuestsCount, setRsvpGuestsCount] = useState(1);
  const [rsvpNote, setRsvpNote] = useState("");
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpBotTrap, setRsvpBotTrap] = useState(""); // Honeypot chống bot tự động

  // Guestbook & Personalization state (?to=... or ?guest=...)
  const [guestNameParam, setGuestNameParam] = useState<string>("");
  const [isShareGuestModalOpen, setIsShareGuestModalOpen] = useState(false);
  const [customGuestInput, setCustomGuestInput] = useState("");
  const [copiedGuestLink, setCopiedGuestLink] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [guestWish, setGuestWish] = useState("");
  const [wishBotTrap, setWishBotTrap] = useState(""); // Honeypot chống bot tự động
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Read guest name from query parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const guest =
        sp.get("to") ||
        sp.get("guest") ||
        sp.get("khach") ||
        sp.get("k") ||
        "";
      if (guest) {
        setGuestNameParam(guest);
        setRsvpName(guest);
        setGuestName(guest);
        setCustomGuestInput(guest);
      }
    }
  }, []);

  const handleSendRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    // Chống bot spam nếu honeypot bị điền
    if (rsvpBotTrap) {
      setRsvpSubmitted(true);
      return;
    }
    if (!card || !rsvpName.trim() || !rsvpPhone.trim()) return;
    addRsvp(card.id, {
      name: rsvpName.trim(),
      phone: rsvpPhone.trim(),
      attending: rsvpAttending === "yes",
      guests: rsvpAttending === "yes" ? rsvpGuestsCount : 0,
      note: rsvpNote.trim(),
    });
    setRsvpSubmitted(true);
    // Refresh card
    setCard(getCardByIdOrSlug(card.id) || card);
  };

  const handleSendWish = (e: React.FormEvent) => {
    e.preventDefault();
    // Chống bot spam nếu honeypot bị điền
    if (wishBotTrap) {
      setGuestName("");
      setGuestWish("");
      return;
    }
    if (!card || !guestName.trim() || !guestWish.trim()) return;
    addWish(card.id, guestName.trim(), guestWish.trim());
    setGuestName("");
    setGuestWish("");
    // Refresh card
    setCard(getCardByIdOrSlug(card.id) || card);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard?.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedBank(type);
      setTimeout(() => setCopiedBank(null), 2000);
    }
  };

  const getVietQrUrl = (bankName?: string, accountNumber?: string, name?: string, customQr?: string): string => {
    if (customQr && customQr.startsWith("http") && !customQr.includes("api.qrserver.com")) {
      return customQr;
    }
    if (!accountNumber) return "";
    return generateVietQrUrl(bankName, accountNumber, name, undefined, `Mung cuoi ${name || ""}`);
  };

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#511419] text-amber-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-amber-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs uppercase tracking-widest font-semibold">Đang mở thiệp cưới...</p>
        </div>
      </div>
    );
  }

  const { groom: displayGroom, bride: displayBride } = extractNamesFromNodes(activeNodes || card.nodes);
  const groomName = card.groom.name && card.groom.name !== "Chú Rể" ? card.groom.name : displayGroom;
  const brideName = card.bride.name && card.bride.name !== "Cô Dâu" ? card.bride.name : displayBride;

  return (
    <div className="min-h-screen bg-[#f3efe6] flex flex-col items-center justify-start relative text-gray-800 selection:bg-rose-100 selection:text-zen-primary">
      {/* Background Wedding Audio with automatic failover */}
      <audio
        ref={audioRef}
        src={card.musicUrl || "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3"}
        loop
        preload="auto"
        onError={() => {
          if (audioRef.current && !audioRef.current.src.includes("mixkit.co")) {
            audioRef.current.src = "https://assets.mixkit.co/music/preview/mixkit-wedding-waltz-237.mp3";
            if (isPlayingAudio) audioRef.current.play().catch(() => {});
          }
        }}
      />

      {/* Falling Rose Petals HTML5 Canvas Engine */}
      <FallingPetals density={26} active={petalsEnabled} />

      {/* Floating Vinyl Record Audio Player + Petals Toggle */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {/* Falling Petals Toggle Button */}
        <button
          type="button"
          onClick={() => setPetalsEnabled(!petalsEnabled)}
          className={`p-2 rounded-full backdrop-blur-md border shadow-lg transition-all ${
            petalsEnabled
              ? "bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100"
              : "bg-white/80 text-gray-400 border-gray-200 hover:bg-white"
          }`}
          title={petalsEnabled ? "Tắt hiệu ứng hoa rơi" : "Bật hiệu ứng hoa rơi"}
        >
          <Sparkles className={`w-4 h-4 ${petalsEnabled ? "animate-spin" : ""}`} />
        </button>

        {/* Vinyl Record Player Card */}
        <div
          onClick={toggleAudio}
          className="bg-white/90 backdrop-blur-md pl-1.5 pr-3 py-1.5 rounded-full border border-amber-900/15 shadow-xl flex items-center gap-2.5 cursor-pointer hover:bg-white transition-all group select-none relative"
        >
          {/* Spinning Vinyl Record Disk */}
          <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
            <div
              className={`w-9 h-9 rounded-full bg-[#111111] border border-amber-500/40 shadow-md flex items-center justify-center transition-all ${
                isPlayingAudio ? "animate-vinyl-spin" : ""
              }`}
              style={{
                backgroundImage:
                  "radial-gradient(circle, #2a2a2a 1px, transparent 1px), radial-gradient(circle, #2a2a2a 1px, #141414 1px)",
                backgroundSize: "6px 6px, 100% 100%",
              }}
            >
              {/* Center Album Label */}
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border border-white flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-black"></div>
              </div>
            </div>

            {/* Tonearm needle indicator */}
            <div
              className={`absolute top-0 -right-0.5 w-1 h-4 bg-amber-400 origin-top rounded-full shadow-xs transition-transform duration-500 ${
                isPlayingAudio ? "rotate-25" : "-rotate-45 opacity-60"
              }`}
            />
          </div>

          {/* Dancing Equalizer Bars + Title */}
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-[11px] font-bold text-gray-800 truncate max-w-[100px] leading-tight">
              {isPlayingAudio ? (card.musicTitle || "Nhạc cưới") : "Phát nhạc"}
            </span>
            <div className="flex items-end gap-0.5 h-3 mt-0.5">
              <span className={`w-0.5 rounded-full bg-rose-500 ${isPlayingAudio ? "animate-eq-1" : "h-1"}`} />
              <span className={`w-0.5 rounded-full bg-amber-500 ${isPlayingAudio ? "animate-eq-2" : "h-2"}`} />
              <span className={`w-0.5 rounded-full bg-rose-500 ${isPlayingAudio ? "animate-eq-3" : "h-1"}`} />
              <span className={`w-0.5 rounded-full bg-amber-500 ${isPlayingAudio ? "animate-eq-4" : "h-2"}`} />
            </div>
          </div>

          {/* Musical Notes Floating when playing */}
          {isPlayingAudio && (
            <>
              <span className="absolute -top-3 right-1 text-rose-500 font-bold text-xs animate-bounce pointer-events-none">♪</span>
              <span className="absolute -top-5 right-5 text-amber-500 font-bold text-sm animate-pulse pointer-events-none">♫</span>
            </>
          )}
        </div>
      </div>

      {/* Top Floating Buttons (Home + Personalized Guest Link Generator) */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-2">
        <Link
          href="/"
          className="px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-gray-200 shadow-sm flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-zen-primary transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-zen-primary"></span>
          <span>ZenLove</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            setCustomGuestInput(guestNameParam || "");
            setIsShareGuestModalOpen(true);
          }}
          className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Tạo link thiệp mời riêng cho từng khách mời"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mời khách riêng</span>
        </button>
      </div>

      {/* ================= 3D ENVELOPE MODAL (IF CLOSED) ================= */}
      {!isEnvelopeOpen && (
        <div className={`fixed inset-0 z-50 bg-[#25080c]/90 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-opacity duration-700 ${isEnvelopeOpening ? "pointer-events-none" : ""}`}>
          {/* Architectural Sketch Background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://cdn-resource.zenlove.me/resources/mldw1mdn28infjta.png')",
            }}
          />

          {/* The 3D Envelope Physics Wrapper */}
          <div className="w-full max-w-[360px] perspective-envelope relative animate-scale-in">
            <div className="relative w-full h-[250px] transform-style-3d">
              {/* Envelope Back Paper / Lining */}
              <div className="absolute inset-0 bg-[#3d0d12] rounded-2xl border border-amber-500/30 shadow-2xl overflow-hidden" />

              {/* Sliding Invitation Letter inside the envelope */}
              <div
                className={`envelope-letter-slide absolute inset-x-4 top-3 bottom-3 bg-[#fffefb] rounded-xl border border-amber-900/15 shadow-xl p-5 text-center flex flex-col justify-between z-10 ${
                  isEnvelopeOpening ? "envelope-letter-up" : ""
                }`}
              >
                <div className="border border-amber-700/20 rounded-lg p-3 h-full flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800">
                    Thiệp Mời Thành Hôn
                  </span>
                  <div className="my-auto py-2">
                    {guestNameParam && (
                      <div className="inline-block bg-amber-100/80 border border-amber-300 rounded-full px-2.5 py-0.5 mb-1.5 text-[11px] font-semibold text-[#511419] shadow-2xs">
                        Kính mời: <strong className="font-serif text-xs">{guestNameParam}</strong>
                      </div>
                    )}
                    <h2 className="text-3xl font-great-vibes text-[#511419] font-normal leading-tight">
                      {groomName}
                    </h2>
                    <span className="text-xs text-amber-800 font-serif italic">&</span>
                    <h2 className="text-3xl font-great-vibes text-[#511419] font-normal leading-tight">
                      {brideName}
                    </h2>
                  </div>
                  <div className="text-[10px] text-gray-600 font-medium border-t border-amber-700/10 pt-2">
                    <p className="font-bold text-[#511419]">{card.weddingDate}</p>
                    <p className="truncate text-gray-500">{card.events?.[0]?.venue || "Trung tâm tiệc cưới"}</p>
                  </div>
                </div>
              </div>

              {/* Envelope Front Pocket (Burgundy folded flaps) */}
              <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-end">
                <div
                  className="w-full h-[180px] bg-gradient-to-t from-[#480f14] via-[#511419] to-[#5d161d] rounded-b-2xl border-b border-x border-amber-500/30 shadow-[0_-8px_20px_rgba(0,0,0,0.35)] relative overflow-hidden"
                  style={{
                    clipPath: "polygon(0 0, 50% 35%, 100% 0, 100% 100%, 0 100%)",
                  }}
                >
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-center w-full px-4">
                    {guestNameParam ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/30 via-amber-300/40 to-amber-400/30 border border-amber-300/60 shadow-md backdrop-blur-xs">
                        <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                        <span className="text-[11px] font-bold tracking-wide font-serif text-amber-200">
                          Kính mời: {guestNameParam}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] tracking-widest uppercase font-serif text-amber-300/80 font-semibold">
                        ZenLove Wedding
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3D Top Flap with Wax Seal Stamp */}
              <div
                className={`envelope-flap-3d absolute top-0 inset-x-0 h-[150px] z-30 origin-top cursor-pointer ${
                  isEnvelopeOpening ? "envelope-flap-open" : ""
                }`}
                onClick={handleOpenEnvelope}
              >
                {/* Flap triangle */}
                <div
                  className="w-full h-full bg-gradient-to-b from-[#6b1b22] via-[#561318] to-[#450e12] rounded-t-2xl shadow-lg border-t border-x border-amber-400/40 relative flex items-end justify-center pb-2"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  }}
                >
                  <div className="absolute inset-0 bg-black/10" />
                </div>

                {/* 3D Wax Seal Stamp (Con dấu sáp đỏ viền vàng) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEnvelope();
                  }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 border-2 border-amber-200/80 shadow-[0_10px_25px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer group z-40"
                  title="Chạm để mở thiệp cưới"
                >
                  <div className="w-10 h-10 rounded-full border border-amber-200/60 bg-gradient-to-br from-[#7a1c24] to-[#4a0d12] flex items-center justify-center shadow-inner">
                    <Heart className="w-5 h-5 text-amber-300 fill-amber-300 group-hover:scale-110 transition-transform drop-shadow" />
                  </div>
                </button>
              </div>
            </div>

            {/* Guide text */}
            <div className="mt-14 text-center">
              <p className="text-xs text-amber-200/90 font-medium animate-bounce flex items-center justify-center gap-1.5">
                <span>💌</span>
                <span>Chạm vào con dấu để mở thiệp cưới</span>
                <span>💌</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN MOBILE INVITATION CONTAINER ================= */}
      <main className="w-full max-w-[480px] bg-white shadow-2xl min-h-screen relative flex flex-col overflow-hidden pb-32">
        {/* Personalized Welcome Banner if guest param exists */}
        {guestNameParam && (
          <div className="w-full bg-gradient-to-r from-[#511419] via-[#6d1a21] to-[#511419] text-white py-2.5 px-4 shadow-md flex items-center justify-between text-xs z-30 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-amber-300 text-sm shrink-0">💌</span>
              <span className="truncate">
                Trân trọng kính mời: <strong className="text-amber-300 font-serif text-sm">{guestNameParam}</strong>
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200/90 bg-black/30 px-2 py-0.5 rounded-full shrink-0">
              Khách Quý
            </span>
          </div>
        )}
        {/* Dynamic Nodes Canvas (Hiển thị đúng 100% bản vẽ tùy biến của người dùng) */}
        {activeNodes && activeNodes["ROOT"] && Object.keys(activeNodes).length > 2 ? (
          <div className="w-full relative z-10">
            <CardNodeRenderer
              nodes={activeNodes}
              onOpenGiftQr={() => setIsGiftModalOpen(true)}
              onRsvpSuccess={(data) => {
                if (!card) return;
                addRsvp(card.id, {
                  name: data.name,
                  phone: data.phone || "---",
                  attending: data.attending ?? true,
                  guests: 1,
                  note: data.note || "",
                });
                setToastMessage("🎉 Đã gửi xác nhận tham dự thành công!");
                setTimeout(() => setToastMessage(null), 3500);
                setCard(getCardByIdOrSlug(card.id) || card);
              }}
            />
          </div>
        ) : (
          <>
            {/* Background Architectural Palace Sketch */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none bg-repeat-y bg-top"
              style={{
                backgroundImage:
                  "url('https://cdn-resource.zenlove.me/resources/mldw1mdn28infjta.png')",
                backgroundSize: "100% auto",
              }}
            />

            {/* Top Header */}
            <div className="pt-8 pb-4 px-6 text-center relative z-10">
              <p className="text-[11px] uppercase tracking-widest text-amber-800 font-bold mb-1">
                Save The Date
              </p>
              <div className="w-12 h-0.5 bg-amber-700/30 mx-auto mb-4"></div>

              {/* Groom & Bride Typography */}
              <h1 className="text-4xl sm:text-5xl font-great-vibes text-[#511419] font-normal tracking-wide leading-tight drop-shadow-xs">
                {groomName}
              </h1>
              <div className="my-1 flex items-center justify-center gap-3">
                <span className="w-8 h-px bg-amber-700/40"></span>
                <Heart className="w-4 h-4 text-zen-primary fill-zen-primary" />
                <span className="w-8 h-px bg-amber-700/40"></span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-great-vibes text-[#511419] font-normal tracking-wide leading-tight drop-shadow-xs">
                {brideName}
              </h1>

              <p className="text-xs text-gray-500 mt-3 font-medium">
                Ngày trọng đại: <strong className="text-gray-900 font-semibold">{card.weddingDate}</strong>
              </p>
              {card.lunarDate && (
                <p className="text-[11px] text-gray-400 mt-0.5 italic">
                  ({card.lunarDate})
                </p>
              )}
            </div>

            {/* Hero Photo with Envelope Framing */}
            <div className="px-6 py-2 relative z-10">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-white aspect-3/4 bg-gray-100 group">
                <img
                  src={card.coverImage}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#511419] rotate-45 flex items-end justify-center pb-1 text-[10px] text-amber-200 font-bold">
                  WEDDING
                </div>
              </div>
            </div>

            {/* Romantic Quote */}
            <div className="px-8 py-6 text-center relative z-10">
              <p className="text-base sm:text-lg text-gray-700 italic font-parisienne leading-relaxed">
                "{card.story}"
              </p>
            </div>

            {/* Countdown Timer */}
            <section className="px-6 py-6 bg-gradient-to-b from-[#fbf6f0] to-white mx-4 rounded-2xl border border-amber-900/10 shadow-xs relative z-10 text-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3">
                Đếm ngược ngày chung đôi
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: timeLeft.days, label: "Ngày" },
                  { val: timeLeft.hours, label: "Giờ" },
                  { val: timeLeft.minutes, label: "Phút" },
                  { val: timeLeft.seconds, label: "Giây" },
                ].map((t, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl py-2 px-1 shadow-xs border border-gray-100 flex flex-col items-center"
                  >
                    <span className="text-xl sm:text-2xl font-bold font-cormorant text-[#511419]">
                      {String(t.val).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Event Schedule */}
            <section className="px-6 py-8 relative z-10 space-y-6">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#511419] tracking-wider">
                  Chương Trình Hôn Lễ
                </h2>
                <div className="w-10 h-0.5 bg-amber-700/40 mx-auto mt-2"></div>
              </div>

              <div className="space-y-4">
                {card.events.map((evt) => (
                  <div
                    key={evt.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-zen-primary text-xs font-bold uppercase tracking-wider mb-2">
                      <Clock className="w-4 h-4" />
                      <span>{evt.time}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-base">
                      {evt.title}
                    </h4>
                    <div className="mt-2 flex items-start gap-2 text-xs text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span>{evt.address || evt.venue}</span>
                    </div>
                    {evt.mapUrl && (
                      <a
                        href={evt.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-zen-primary text-xs font-bold hover:bg-rose-100 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Chỉ đường Google Maps</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ================= RSVP FORM (Xác nhận tham dự) ================= */}
        <section id="rsvp-section" className="px-6 py-8 bg-[#faf7f2] relative z-10 border-y border-amber-900/10">
          <div className="text-center mb-6">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Xác Nhận Tham Dự
            </span>
            <h2 className="text-2xl font-cormorant font-bold text-[#511419] mt-1">
              Lời Hẹn Chung Vui
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Sự hiện diện của bạn là niềm hạnh phúc lớn nhất của chúng mình!
            </p>
          </div>

          {rsvpSubmitted ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-emerald-200 shadow-xs animate-scale-in">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-gray-900 text-sm">
                Đã gửi xác nhận thành công!
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Cảm ơn bạn đã phản hồi. Hẹn gặp bạn trong ngày hạnh phúc của chúng mình nhé!
              </p>
              <button
                type="button"
                onClick={() => setRsvpSubmitted(false)}
                className="mt-3 text-xs text-zen-primary font-semibold hover:underline"
              >
                Gửi lại thông tin khác
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendRsvp} className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-3.5">
              {/* Anti-bot Honeypot field (hidden from genuine users) */}
              <input
                type="text"
                name="b_field_trap"
                value={rsvpBotTrap}
                onChange={(e) => setRsvpBotTrap(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden opacity-0 absolute -z-10 pointer-events-none"
                style={{ position: "absolute", left: "-9999px" }}
              />
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Họ và tên của bạn:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên của bạn..."
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Số điện thoại:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="0912..."
                    value={rsvpPhone}
                    onChange={(e) => setRsvpPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bạn sẽ tham dự chứ?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRsvpAttending("yes")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      rsvpAttending === "yes"
                        ? "border-zen-primary bg-rose-50 text-zen-primary"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    🎉 Chắc chắn rồi!
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpAttending("no")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      rsvpAttending === "no"
                        ? "border-gray-400 bg-gray-100 text-gray-800"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    💌 Tiếc quá bận rồi
                  </button>
                </div>
              </div>

              {rsvpAttending === "yes" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số người cùng tham dự:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRsvpGuestsCount(num)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          rsvpGuestsCount === num
                            ? "border-zen-primary bg-rose-50 text-zen-primary font-bold"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {num} người
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-zen-primary text-white text-xs font-bold shadow-md hover:bg-[#d93849] transition-all flex items-center justify-center gap-2"
              >
                <span>Xác nhận tham dự</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </section>

        {/* ================= BANKING GIFT QR BOX (Hộp mừng cưới online) ================= */}
        <section id="gift-section" className="px-6 py-8 relative z-10">
          <div className="text-center mb-6">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Hộp Mừng Cưới Online
            </span>
            <h2 className="text-2xl font-cormorant font-bold text-[#511419] mt-1">
              Gửi Quà Mừng Cưới
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Dành cho bạn bè, người thân ở xa muốn gửi lời chúc và món quà mừng đến đôi uyên ương.
            </p>
          </div>

          <div className="space-y-4">
            {/* Chú rể */}
            {card.groom.accountNumber && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200 p-1 flex items-center justify-center">
                  <img
                    src={getVietQrUrl(card.groom.bankName, card.groom.accountNumber, card.groom.name, card.groom.qrCode)}
                    alt={`QR ${card.groom.name}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    Mừng Chú Rể ({card.groom.name})
                  </p>
                  <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">
                    {card.groom.bankName} • {card.groom.accountNumber}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(card.groom.accountNumber!, "groom")}
                    className="mt-2 text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    {copiedBank === "groom" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép STK</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Cô dâu */}
            {card.bride.accountNumber && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200 p-1 flex items-center justify-center">
                  <img
                    src={getVietQrUrl(card.bride.bankName, card.bride.accountNumber, card.bride.name, card.bride.qrCode)}
                    alt={`QR ${card.bride.name}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    Mừng Cô Dâu ({card.bride.name})
                  </p>
                  <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">
                    {card.bride.bankName} • {card.bride.accountNumber}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(card.bride.accountNumber!, "bride")}
                    className="mt-2 text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    {copiedBank === "bride" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép STK</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= GUESTBOOK WISHES (Sổ lưu bút) ================= */}
        <section id="wishes-section" className="px-6 py-8 bg-[#faf7f2] relative z-10 border-t border-amber-900/10">
          <div className="text-center mb-6">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Sổ Lưu Bút
            </span>
            <h2 className="text-2xl font-cormorant font-bold text-[#511419] mt-1">
              Gửi Lời Chúc Mừng
            </h2>
          </div>

          <form onSubmit={handleSendWish} className="space-y-3 mb-6">
            {/* Anti-bot Honeypot field (hidden from genuine users) */}
            <input
              type="text"
              name="w_field_trap"
              value={wishBotTrap}
              onChange={(e) => setWishBotTrap(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden opacity-0 absolute -z-10 pointer-events-none"
              style={{ position: "absolute", left: "-9999px" }}
            />
            <input
              type="text"
              required
              placeholder="Tên của bạn..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-zen-primary"
            />
            <textarea
              required
              rows={2}
              placeholder="Gửi lời chúc phúc tốt đẹp nhất đến cặp đôi..."
              value={guestWish}
              onChange={(e) => setGuestWish(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-zen-primary resize-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#511419] text-amber-50 text-xs font-bold shadow-md hover:bg-[#3d0f13] transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Gửi lời chúc</span>
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            </button>
          </form>

          {/* Wishes Feed */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {card.wishes && card.wishes.length > 0 ? (
              card.wishes.map((w) => (
                <div
                  key={w.id}
                  className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-900">{w.name}</span>
                    <span className="text-gray-400">{w.createdAt}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{w.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc nhé!
              </p>
            )}
          </div>
        </section>

        {/* Bottom ZenLove Watermark & Commercial Ecosystem */}
        <div className="pt-8 pb-14 px-6 text-center text-xs text-gray-400 border-t border-gray-100 relative z-10 bg-white space-y-2.5">
          <p className="text-[11px] text-gray-500">
            Thiệp cưới online được tạo miễn phí bởi{" "}
            <Link href="/" className="font-bold text-zen-primary hover:underline">
              ZenLove.me
            </Link>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/templates"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-zen-primary px-3.5 py-1.5 rounded-full bg-gray-50 border border-gray-200 shadow-2xs"
            >
              <span>Tạo thiệp như mẫu này</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="/doi-tac-cuoi"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-zen-primary px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 shadow-2xs"
            >
              <span>🎁 Ưu đãi đối tác cưới</span>
            </Link>
          </div>
        </div>

        {/* Bottom Floating Share / Action Bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-gray-200 py-1.5 px-3 z-40 shadow-xl flex items-center justify-around gap-1">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("rsvp-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center text-gray-700 hover:text-zen-primary hover:bg-rose-50/60 transition-colors cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 text-zen-primary" />
            <span className="text-[10px] font-bold mt-0.5">RSVP</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGiftModalOpen(true)}
            className="flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center text-gray-700 hover:text-zen-primary hover:bg-rose-50/60 transition-colors cursor-pointer"
          >
            <Gift className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-bold mt-0.5">Mừng cưới</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("wishes-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center text-gray-700 hover:text-zen-primary hover:bg-rose-50/60 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-bold mt-0.5">Lời chúc</span>
          </button>

          <a
            href={card.events?.[0]?.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(card.events?.[0]?.venue || "Hà Nội")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center text-gray-700 hover:text-zen-primary hover:bg-rose-50/60 transition-colors cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-bold mt-0.5">Chỉ đường</span>
          </a>

          <button
            type="button"
            onClick={() => {
              copyToClipboard(window.location.href, "link");
              setToastMessage("Đã sao chép link thiệp cưới!");
              setTimeout(() => setToastMessage(null), 2500);
            }}
            className="flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center text-gray-700 hover:text-zen-primary hover:bg-rose-50/60 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-purple-600" />}
            <span className="text-[10px] font-bold mt-0.5">{copiedLink ? "Đã chép" : "Chia sẻ"}</span>
          </button>
        </div>
      </main>

      {/* ================= GIFT QR POPUP MODAL ================= */}
      {isGiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 border border-rose-100 relative animate-scale-in">
            <button
              type="button"
              onClick={() => setIsGiftModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center pt-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
                Mừng Cưới Online
              </span>
              <h3 className="text-xl font-cormorant font-bold text-[#511419] mt-0.5">
                Hộp Quà Chúc Phúc
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Quét mã VietQR hoặc sao chép STK để gửi quà mừng tới cặp đôi
              </p>
            </div>

            {/* Groom / Bride Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveGiftTab("groom")}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeGiftTab === "groom"
                    ? "bg-white text-[#511419] font-bold shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Mừng Chú Rể
              </button>
              <button
                type="button"
                onClick={() => setActiveGiftTab("bride")}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeGiftTab === "bride"
                    ? "bg-white text-[#511419] font-bold shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Mừng Cô Dâu
              </button>
            </div>

            {/* Groom Bank & QR */}
            {activeGiftTab === "groom" && (
              <div className="space-y-3 text-center">
                <div className="w-44 h-44 mx-auto bg-white rounded-2xl p-2 border-2 border-dashed border-amber-300 shadow-inner flex items-center justify-center">
                  <img
                    src={getVietQrUrl(card.groom.bankName, card.groom.accountNumber, card.groom.name, card.groom.qrCode)}
                    alt={`VietQR ${card.groom.name}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-800">
                    {card.groom.bankName || "MB BANK"}
                  </p>
                  <p className="text-sm font-mono font-bold text-[#511419]">
                    {card.groom.accountNumber || "240220038888"}
                  </p>
                  <p className="text-[11px] text-gray-500 uppercase font-semibold">
                    Chủ TK: {card.groom.name || "CHÚ RỂ"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(card.groom.accountNumber || "240220038888", "groom");
                    setToastMessage("Đã sao chép STK Chú Rể!");
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#511419] hover:bg-[#3d0f13] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedBank === "groom" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBank === "groom" ? "Đã sao chép số tài khoản!" : "Sao chép số tài khoản"}</span>
                </button>
              </div>
            )}

            {/* Bride Bank & QR */}
            {activeGiftTab === "bride" && (
              <div className="space-y-3 text-center">
                <div className="w-44 h-44 mx-auto bg-white rounded-2xl p-2 border-2 border-dashed border-rose-300 shadow-inner flex items-center justify-center">
                  <img
                    src={getVietQrUrl(card.bride.bankName, card.bride.accountNumber, card.bride.name, card.bride.qrCode)}
                    alt={`VietQR ${card.bride.name}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-800">
                    {card.bride.bankName || "TECHCOMBANK"}
                  </p>
                  <p className="text-sm font-mono font-bold text-[#511419]">
                    {card.bride.accountNumber || "190365824988"}
                  </p>
                  <p className="text-[11px] text-gray-500 uppercase font-semibold">
                    Chủ TK: {card.bride.name || "CÔ DÂU"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(card.bride.accountNumber || "190365824988", "bride");
                    setToastMessage("Đã sao chép STK Cô Dâu!");
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                  className="w-full py-2.5 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedBank === "bride" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBank === "bride" ? "Đã sao chép số tài khoản!" : "Sao chép số tài khoản"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL TẠO LINK MỜI RIÊNG CHO KHÁCH ================= */}
      {isShareGuestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">💌</span>
                <h3 className="text-base font-bold text-gray-900">Tạo Link Thiệp Mời Riêng</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareGuestModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Nhập tên khách mời để thiệp tự động in tên khách lên phong bì sáp hoàng gia và điền sẵn vào mục xác nhận tham dự (RSVP).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Tên khách mời:</label>
              <input
                type="text"
                placeholder="VD: Anh Tuấn & Bạn gái, Gia đình Bác Hùng..."
                value={customGuestInput}
                onChange={(e) => setCustomGuestInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary focus:ring-1 focus:ring-zen-primary"
              />
            </div>

            {/* Generated link preview */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Đường dẫn cá nhân hóa:
              </span>
              <p className="text-xs font-mono text-gray-800 break-all select-all">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/show/${slug}${
                      customGuestInput.trim() ? `?to=${encodeURIComponent(customGuestInput.trim())}` : ""
                    }`
                  : ""}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  const link = `${window.location.origin}/show/${slug}${
                    customGuestInput.trim() ? `?to=${encodeURIComponent(customGuestInput.trim())}` : ""
                  }`;
                  navigator.clipboard?.writeText(link);
                  setCopiedGuestLink(true);
                  setToastMessage("Đã sao chép link mời cá nhân hóa!");
                  setTimeout(() => {
                    setCopiedGuestLink(false);
                    setToastMessage(null);
                  }, 2500);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedGuestLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedGuestLink ? "Đã sao chép link!" : "Sao chép link mời"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  const link = `${window.location.origin}/show/${slug}${
                    customGuestInput.trim() ? `?to=${encodeURIComponent(customGuestInput.trim())}` : ""
                  }`;
                  const msg = `🌸 THIỆP MỜI THÀNH HÔN 🌸\nTrân trọng kính mời: ${customGuestInput.trim() || "Quý khách"}\nTới dự ngày vui cùng chúng mình tại:\n👉 ${link}\nSự hiện diện của bạn là niềm hạnh phúc lớn nhất của chúng mình!`;
                  navigator.clipboard?.writeText(msg);
                  setToastMessage("Đã sao chép mẫu tin nhắn Zalo kèm thiệp!");
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Sao chép lời mời Zalo soạn sẵn"
              >
                <span>💬 Chép mẫu Zalo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  const link = `${window.location.origin}/show/${slug}${
                    customGuestInput.trim() ? `?to=${encodeURIComponent(customGuestInput.trim())}` : ""
                  }`;
                  const qrDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(link)}`;
                  window.open(qrDownloadUrl, "_blank");
                }}
                className="py-2.5 px-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs border border-purple-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Tải mã QR độ nét cao 1000x1000 để in lên thiệp giấy"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải QR in thiệp (HD)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-white/20 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
