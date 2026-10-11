"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  CreditCard,
  QrCode,
  Calendar,
  Heart,
  MessageSquare,
  Settings,
  Sparkles,
  User,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
  Phone,
  Navigation,
  Music,
  Play,
  Pause,
  Volume2,
  Image as ImageIcon,
} from "lucide-react";
import { WeddingCard, WeddingEvent } from "@/data/initialCards";
import { generateVietQrUrl } from "@/lib/vietQrBankCodes";
import { syncCardDataToCanvasNodes } from "@/lib/textSyncService";
import { CURATED_WEDDING_SONGS, WeddingSong } from "@/lib/weddingMusicLibrary";

const POPULAR_BANKS = [
  { code: "MB", name: "MB Bank (Quân Đội)" },
  { code: "VCB", name: "Vietcombank (Ngoại Thương)" },
  { code: "TCB", name: "Techcombank (Kỹ Thương)" },
  { code: "CTG", name: "VietinBank (Công Thương)" },
  { code: "BIDV", name: "BIDV (Đầu Tư & Phát Triển)" },
  { code: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)" },
  { code: "ACB", name: "ACB (Á Châu)" },
  { code: "TPB", name: "TPBank (Tiên Phong)" },
  { code: "HDB", name: "HDBank (Phát Triển TP.HCM)" },
  { code: "STB", name: "Sacombank (Sài Gòn Thương Tín)" },
  { code: "VIB", name: "VIB (Quốc Tế)" },
  { code: "MSB", name: "MSB (Hàng Hải)" },
  { code: "SHB", name: "SHB (Sài Gòn - Hà Nội)" },
  { code: "OCB", name: "OCB (Phương Đông)" },
  { code: "SEAB", name: "SeABank (Đông Nam Á)" },
  { code: "NAB", name: "Nam A Bank (Nam Á)" },
];

interface EditorWeddingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: WeddingCard;
  onSave: (updatedCard: WeddingCard) => void;
}

export default function EditorWeddingSettingsModal({
  isOpen,
  onClose,
  card,
  onSave,
}: EditorWeddingSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"bank" | "general" | "sections" | "music" | "album">("bank");

  // Music state
  const [musicTitle, setMusicTitle] = useState(card.musicTitle || CURATED_WEDDING_SONGS[0].title);
  const [musicUrl, setMusicUrl] = useState(card.musicUrl || CURATED_WEDDING_SONGS[0].url);
  const [previewingSongId, setPreviewingSongId] = useState<string | null>(null);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);

  // Album state
  const [albumPhotos, setAlbumPhotos] = useState<string[]>(() => {
    if (card.album && card.album.length > 0) return card.album;
    return [
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800&auto=format&fit=crop",
    ];
  });
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  // Form states - Dâu Rể & Ngày Giờ
  const [groomName, setGroomName] = useState(card.groom.name || "");
  const [brideName, setBrideName] = useState(card.bride.name || "");
  const [groomPhone, setGroomPhone] = useState(card.groom.phone || "");
  const [bridePhone, setBridePhone] = useState(card.bride.phone || "");
  const [groomParents, setGroomParents] = useState(card.groom.parents || "");
  const [brideParents, setBrideParents] = useState(card.bride.parents || "");

  const [weddingDate, setWeddingDate] = useState(card.weddingDate || "2026-11-20");
  const [weddingTime, setWeddingTime] = useState(card.weddingTime || "11:00");
  const [lunarDate, setLunarDate] = useState(card.lunarDate || "");

  // Events & Sơ Đồ Danh Sách
  const [events, setEvents] = useState<WeddingEvent[]>(() => {
    if (card.events && card.events.length > 0) {
      return card.events;
    }
    return [
      {
        id: "evt-1",
        title: "Lễ Thành Hôn",
        time: `${card.weddingTime || "11:00"} • ${card.weddingDate || "2026-11-20"}`,
        venue: "Trung tâm Tiệc cưới Trống Đồng Palace",
        address: "Số 72 Quán Sứ, Hoàn Kiếm, Hà Nội",
        mapUrl: "https://maps.google.com/?q=72+Quan+Su+Hanoi",
      },
    ];
  });

  // Bank groom
  const [groomBank, setGroomBank] = useState(card.groom.bankName || "MB BANK");
  const [groomAccount, setGroomAccount] = useState(card.groom.accountNumber || "");
  const [groomAccountName, setGroomAccountName] = useState(
    card.groom.accountName || card.groom.name || ""
  );

  // Bank bride
  const [brideBank, setBrideBank] = useState(card.bride.bankName || "TECHCOMBANK");
  const [brideAccount, setBrideAccount] = useState(card.bride.accountNumber || "");
  const [brideAccountName, setBrideAccountName] = useState(
    card.bride.accountName || card.bride.name || ""
  );

  // Section Toggles
  const [showGiftBox, setShowGiftBox] = useState(card.showGiftBox !== false);
  const [showWishes, setShowWishes] = useState(card.showWishes !== false);
  const [showRsvp, setShowRsvp] = useState(card.showRsvp !== false);
  const [showEvents, setShowEvents] = useState(card.showEvents !== false);

  if (!isOpen) return null;

  // Event handlers
  const handleUpdateEvent = (index: number, patch: Partial<WeddingEvent>) => {
    setEvents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleGenerateMapUrl = (index: number) => {
    const target = events[index];
    const query = target.address || target.venue;
    if (query) {
      const autoUrl = `https://maps.google.com/?q=${encodeURIComponent(query)}`;
      handleUpdateEvent(index, { mapUrl: autoUrl });
    }
  };

  const handleAddEvent = () => {
    const nextIndex = events.length + 1;
    const defaultTitle =
      nextIndex === 2 ? "Lễ Vu Quy (Nhà Gái)" : nextIndex === 3 ? "Tiệc Cưới Chung Vui" : `Sự Kiện ${nextIndex}`;
    setEvents((prev) => [
      ...prev,
      {
        id: `evt-${Date.now()}`,
        title: defaultTitle,
        time: `${weddingTime} • ${weddingDate}`,
        venue: "Tư gia Nhà Gái",
        address: "",
        mapUrl: "",
      },
    ]);
  };

  const handleRemoveEvent = (index: number) => {
    if (events.length <= 1) return;
    setEvents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const cleanGroomAcc = groomAccount.replace(/[^0-9]/g, "");
    const cleanBrideAcc = brideAccount.replace(/[^0-9]/g, "");

    const groomQr = cleanGroomAcc
      ? generateVietQrUrl(
          groomBank,
          cleanGroomAcc,
          groomAccountName || groomName,
          undefined,
          `Mung cuoi ${groomAccountName || groomName}`
        )
      : card.groom.qrCode;

    const brideQr = cleanBrideAcc
      ? generateVietQrUrl(
          brideBank,
          cleanBrideAcc,
          brideAccountName || brideName,
          undefined,
          `Mung cuoi ${brideAccountName || brideName}`
        )
      : card.bride.qrCode;

    // Tự động cập nhật các node GiftQrBox trên canvas bằng mã VietQR thật mới
    let updatedNodes = card.nodes;
    if (updatedNodes && (groomQr || brideQr)) {
      const activeQr = groomQr || brideQr;
      const copyNodes = { ...updatedNodes };
      let changed = false;
      Object.entries(copyNodes).forEach(([nodeId, node]: [string, any]) => {
        if (node.type?.resolvedName === "GiftQrBox") {
          copyNodes[nodeId] = {
            ...node,
            props: {
              ...node.props,
              imgKey: activeQr,
              bankName: groomBank || brideBank,
              accountNumber: cleanGroomAcc || cleanBrideAcc,
              accountName: groomAccountName || brideAccountName || groomName,
            },
          };
          changed = true;
        }
      });
      if (changed) {
        updatedNodes = copyNodes;
      }
    }

    // Tự động đồng bộ tên dâu rể và ngày cưới vào tất cả các node văn bản trên canvas
    if (updatedNodes) {
      const { syncedNodes } = syncCardDataToCanvasNodes(
        {
          groom: { name: groomName || card.groom.name } as any,
          bride: { name: brideName || card.bride.name } as any,
          weddingDate,
          lunarDate,
        },
        updatedNodes
      );
      updatedNodes = syncedNodes;
    }

    // Chuẩn hóa danh sách sự kiện và link sơ đồ bản đồ
    const normalizedEvents: WeddingEvent[] = events.map((e, idx) => ({
      ...e,
      id: e.id || `evt-${idx + 1}`,
      title: e.title || `Sự Kiện ${idx + 1}`,
      time: e.time || `${weddingTime} • ${weddingDate}`,
      venue: e.venue || "Địa điểm tổ chức hôn lễ",
      address: e.address || "",
      mapUrl:
        e.mapUrl ||
        (e.address || e.venue
          ? `https://maps.google.com/?q=${encodeURIComponent(e.address || e.venue)}`
          : undefined),
    }));

    const updatedCard: WeddingCard = {
      ...card,
      weddingDate,
      weddingTime,
      lunarDate,
      showGiftBox,
      showWishes,
      showRsvp,
      showEvents,
      musicTitle,
      musicUrl,
      album: albumPhotos,
      groom: {
        ...card.groom,
        name: groomName || card.groom.name,
        phone: groomPhone,
        parents: groomParents,
        bankName: groomBank,
        accountNumber: cleanGroomAcc,
        accountName: groomAccountName || groomName,
        qrCode: groomQr,
      },
      bride: {
        ...card.bride,
        name: brideName || card.bride.name,
        phone: bridePhone,
        parents: brideParents,
        bankName: brideBank,
        accountNumber: cleanBrideAcc,
        accountName: brideAccountName || brideName,
        qrCode: brideQr,
      },
      nodes: updatedNodes,
      events: normalizedEvents,
    };

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setPreviewingSongId(null);
    onSave(updatedCard);
    onClose();
  };

  const handleCloseModal = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setPreviewingSongId(null);
    onClose();
  };

  // Preview VietQR URL
  const groomQrPreview =
    groomAccount &&
    generateVietQrUrl(
      groomBank,
      groomAccount,
      groomAccountName || groomName,
      undefined,
      `Mung cuoi ${groomAccountName || groomName}`
    );

  const brideQrPreview =
    brideAccount &&
    generateVietQrUrl(
      brideBank,
      brideAccount,
      brideAccountName || brideName,
      undefined,
      `Mung cuoi ${brideAccountName || brideName}`
    );

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-stone-900 to-zinc-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zen-primary text-white flex items-center justify-center shadow-xs">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Chỉnh sửa các mục cố định & Sơ đồ hôn lễ
              </h3>
              <p className="text-[11px] text-zinc-400">
                VietQR mừng cưới, Sơ đồ chỉ đường Google Maps, Sổ lưu bút & RSVP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 bg-stone-50/50 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "bank"
                ? "border-zen-primary text-zen-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Hộp Mừng Cưới (VietQR)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "general"
                ? "border-zen-primary text-zen-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Hôn Lễ & Sơ Đồ Chỉ Đường</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("music")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "music"
                ? "border-zen-primary text-zen-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Nhạc Nền (16+ Bản Tuyển Chọn)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("album")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "album"
                ? "border-zen-primary text-zen-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Album Ảnh Cưới ({albumPhotos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "sections"
                ? "border-zen-primary text-zen-primary"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bật/Tắt Các Mục Cố Định</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: BANK / QR SETTINGS */}
          {activeTab === "bank" && (
            <div className="space-y-6">
              {/* Toggle Hộp Mừng Cưới */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span>Hiển thị Hộp Mừng Cưới Online trên thiệp</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Khách có thể quét mã QR ngân hàng hoặc sao chép STK để gửi quà mừng.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGiftBox(!showGiftBox)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    showGiftBox ? "bg-emerald-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      showGiftBox ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* GRID 2 BÊN: CHÚ RỂ VÀ CÔ DÂU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. TÀI KHOẢN CHÚ RỂ */}
                <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="font-bold text-gray-900 text-xs uppercase text-indigo-600 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Mừng Chú Rể
                    </span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                      Nhà Trai
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Tên hiển thị / Chủ tài khoản:
                    </label>
                    <input
                      type="text"
                      value={groomAccountName}
                      onChange={(e) => setGroomAccountName(e.target.value.toUpperCase())}
                      placeholder="VD: NGUYEN VAN HUNG"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 uppercase font-semibold text-xs focus:border-zen-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Ngân hàng:
                    </label>
                    <select
                      value={groomBank}
                      onChange={(e) => setGroomBank(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold text-xs focus:border-zen-primary focus:outline-none bg-white cursor-pointer"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Số tài khoản ngân hàng:
                    </label>
                    <input
                      type="text"
                      value={groomAccount}
                      onChange={(e) => setGroomAccount(e.target.value)}
                      placeholder="VD: 240220038888"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono font-bold text-xs focus:border-zen-primary focus:outline-none"
                    />
                  </div>

                  {/* QR Preview Chú rể */}
                  {groomQrPreview && (
                    <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                      <img
                        src={groomQrPreview}
                        alt="QR Chú Rể"
                        className="w-16 h-16 rounded-lg border border-gray-200 object-contain p-0.5 bg-gray-50"
                      />
                      <div className="min-w-0 text-[11px] text-gray-500">
                        <span className="text-emerald-600 font-bold block">✓ VietQR tự động</span>
                        <span>Quét nhận tiền mừng chuẩn Napas 247</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. TÀI KHOẢN CÔ DÂU */}
                <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="font-bold text-gray-900 text-xs uppercase text-rose-600 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      Mừng Cô Dâu
                    </span>
                    <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                      Nhà Gái
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Tên hiển thị / Chủ tài khoản:
                    </label>
                    <input
                      type="text"
                      value={brideAccountName}
                      onChange={(e) => setBrideAccountName(e.target.value.toUpperCase())}
                      placeholder="VD: TRAN THI MAI LINH"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 uppercase font-semibold text-xs focus:border-zen-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Ngân hàng:
                    </label>
                    <select
                      value={brideBank}
                      onChange={(e) => setBrideBank(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold text-xs focus:border-zen-primary focus:outline-none bg-white cursor-pointer"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Số tài khoản ngân hàng:
                    </label>
                    <input
                      type="text"
                      value={brideAccount}
                      onChange={(e) => setBrideAccount(e.target.value)}
                      placeholder="VD: 190365824988"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono font-bold text-xs focus:border-zen-primary focus:outline-none"
                    />
                  </div>

                  {/* QR Preview Cô dâu */}
                  {brideQrPreview && (
                    <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                      <img
                        src={brideQrPreview}
                        alt="QR Cô Dâu"
                        className="w-16 h-16 rounded-lg border border-gray-200 object-contain p-0.5 bg-gray-50"
                      />
                      <div className="min-w-0 text-[11px] text-gray-500">
                        <span className="text-emerald-600 font-bold block">✓ VietQR tự động</span>
                        <span>Quét nhận tiền mừng chuẩn Napas 247</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL WEDDING INFO & SƠ ĐỒ CHỈ ĐƯỜNG */}
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* 1. THÔNG TIN DÂU RỂ */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
                <h4 className="font-bold text-gray-900 text-xs uppercase flex items-center gap-1.5 text-zen-primary">
                  <User className="w-3.5 h-3.5" />
                  <span>Thông Tin Cô Dâu & Chú Rể</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Tên Chú Rể:
                    </label>
                    <input
                      type="text"
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      placeholder="VD: Đức Mạnh"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-zen-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Tên Cô Dâu:
                    </label>
                    <input
                      type="text"
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      placeholder="VD: Thùy Dung"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-zen-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Số điện thoại Chú Rể:
                    </label>
                    <input
                      type="tel"
                      value={groomPhone}
                      onChange={(e) => setGroomPhone(e.target.value)}
                      placeholder="VD: 0912.345.678"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-zen-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Số điện thoại Cô Dâu:
                    </label>
                    <input
                      type="tel"
                      value={bridePhone}
                      onChange={(e) => setBridePhone(e.target.value)}
                      placeholder="VD: 0987.654.321"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-zen-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Phụ huynh Nhà Trai:
                    </label>
                    <input
                      type="text"
                      value={groomParents}
                      onChange={(e) => setGroomParents(e.target.value)}
                      placeholder="VD: Ông Nguyễn Văn Hùng & Bà Trần Thị Lan"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-zen-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Phụ huynh Nhà Gái:
                    </label>
                    <input
                      type="text"
                      value={brideParents}
                      onChange={(e) => setBrideParents(e.target.value)}
                      placeholder="VD: Ông Lê Văn Thành & Bà Vũ Thị Mai"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-zen-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. THỜI GIAN HÔN LỄ */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
                <h4 className="font-bold text-gray-900 text-xs uppercase flex items-center gap-1.5 text-amber-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Thời Gian Tổ Chức Hôn Lễ</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Ngày cưới dương lịch:
                    </label>
                    <input
                      type="date"
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-zen-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Giờ tổ chức chính:
                    </label>
                    <input
                      type="time"
                      value={weddingTime}
                      onChange={(e) => setWeddingTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-zen-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Ngày âm lịch:
                    </label>
                    <input
                      type="text"
                      value={lunarDate}
                      onChange={(e) => setLunarDate(e.target.value)}
                      placeholder="VD: Ngày 10 tháng 10 năm Bính Ngọ"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-zen-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. DANH SÁCH SỰ KIỆN & SƠ ĐỒ CHỈ ĐƯỜNG GOOGLE MAPS */}
              <div className="p-4 rounded-2xl bg-stone-50/80 border border-amber-900/15 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs uppercase flex items-center gap-1.5 text-zen-primary">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Chương Trình Hôn Lễ & Sơ Đồ Chỉ Đường (Google Maps)</span>
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Khách mời có thể bấm nút chỉ đường Google Maps để dẫn đường trực tiếp tới hôn lễ.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEvent}
                    className="px-3 py-1.5 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white text-[11px] font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm sự kiện</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {events.map((evt, index) => (
                    <div
                      key={evt.id || index}
                      className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-800 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                          Địa điểm #{index + 1}
                        </span>
                        {events.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEvent(index)}
                            className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                            title="Xóa sự kiện này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-gray-700 block mb-1">
                            Tên sự kiện:
                          </label>
                          <input
                            type="text"
                            value={evt.title}
                            onChange={(e) => handleUpdateEvent(index, { title: e.target.value })}
                            placeholder="VD: Lễ Vu Quy, Lễ Thành Hôn, Tiệc Cưới..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-zen-primary focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-gray-700 block mb-1">
                            Thời gian tổ chức:
                          </label>
                          <input
                            type="text"
                            value={evt.time}
                            onChange={(e) => handleUpdateEvent(index, { time: e.target.value })}
                            placeholder="VD: 11:00 • 18/11/2026"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-zen-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-gray-700 block mb-1">
                            Tên địa điểm / Trung tâm tiệc cưới:
                          </label>
                          <input
                            type="text"
                            value={evt.venue}
                            onChange={(e) => handleUpdateEvent(index, { venue: e.target.value })}
                            placeholder="VD: Trống Đồng Palace / Tư gia Nhà Gái"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-zen-primary focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-gray-700 block mb-1">
                            Địa chỉ cụ thể:
                          </label>
                          <input
                            type="text"
                            value={evt.address}
                            onChange={(e) => handleUpdateEvent(index, { address: e.target.value })}
                            placeholder="VD: 72 Quán Sứ, Hoàn Kiếm, Hà Nội"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-zen-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Link Sơ đồ / Google Maps */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-gray-700">
                            Đường link chỉ đường Google Maps:
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleGenerateMapUrl(index)}
                              className="text-[11px] text-zen-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                              title="Tạo link Google Maps từ địa chỉ trên"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Tạo link tự động</span>
                            </button>
                            {evt.mapUrl && (
                              <a
                                href={evt.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Xem thử vị trí ↗</span>
                              </a>
                            )}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={evt.mapUrl || ""}
                          onChange={(e) => handleUpdateEvent(index, { mapUrl: e.target.value })}
                          placeholder="VD: https://maps.google.com/?q=72+Quan+Su+Hanoi hoặc dán link Google Maps"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-zen-primary focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECTION TOGGLES */}
          {activeTab === "sections" && (
            <div className="space-y-4">
              <p className="text-gray-500 text-xs">
                Bạn có thể tự do bật hoặc tắt các phần cố định xuất hiện ở cuối thiệp mời:
              </p>

              {/* 1. Hộp mừng cưới */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Hộp Mừng Cưới Online (VietQR)</h4>
                    <p className="text-[11px] text-gray-500">
                      Hiển thị số tài khoản và mã VietQR nhận tiền mừng của Chú rể và Cô dâu
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGiftBox(!showGiftBox)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    showGiftBox ? "bg-emerald-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      showGiftBox ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 2. Sơ đồ & Chương trình hôn lễ */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Chương Trình Hôn Lễ & Sơ Đồ Chỉ Đường</h4>
                    <p className="text-[11px] text-gray-500">
                      Hiển thị danh sách địa điểm hôn lễ, tiệc cưới và nút chỉ đường Google Maps
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEvents(!showEvents)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    showEvents ? "bg-emerald-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      showEvents ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 3. Form RSVP */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Xác Nhận Tham Dự (RSVP)</h4>
                    <p className="text-[11px] text-gray-500">
                      Thu thập phản hồi khách có thể tham dự hay không và số người đi cùng
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRsvp(!showRsvp)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    showRsvp ? "bg-emerald-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      showRsvp ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 4. Sổ lưu bút */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Sổ Lưu Bút (Gửi Lời Chúc Mừng)</h4>
                    <p className="text-[11px] text-gray-500">
                      Cho phép khách mời nhập lời chúc phúc gửi tới hai bạn
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWishes(!showWishes)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    showWishes ? "bg-emerald-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      showWishes ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: NHẠC NỀN ĐÁM CƯỚI (16+ BÀI TUYỂN CHỌN) */}
          {activeTab === "music" && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-zen-primary" />
                    <span>Bài hát đang chọn: {musicTitle}</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Nhạc nền tự động phát du dương khi khách mở thiệp cưới.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-rose-200 rounded-full text-[11px] font-bold text-rose-700 shadow-2xs">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Âm thanh chất lượng cao 320kbps</span>
                  </span>
                </div>
              </div>

              {/* Tùy chỉnh link MP3 riêng */}
              <div className="p-3.5 rounded-2xl bg-white border border-gray-200 space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Hoặc dán đường dẫn MP3 riêng của hai bạn:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/bai-hat-cua-chung-ta.mp3"
                    value={musicUrl}
                    onChange={(e) => {
                      setMusicUrl(e.target.value);
                      setMusicTitle("Bài hát riêng (Tùy chỉnh)");
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-zen-primary shadow-2xs"
                  />
                  {musicUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        if (previewingSongId === "custom") {
                          previewAudioRef.current?.pause();
                          setPreviewingSongId(null);
                        } else {
                          if (previewAudioRef.current) {
                            previewAudioRef.current.src = musicUrl;
                            previewAudioRef.current.play().catch(() => {});
                            setPreviewingSongId("custom");
                          }
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1 shrink-0"
                    >
                      {previewingSongId === "custom" ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-zen-primary" />
                          <span>Dừng thử</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Nghe thử link</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Danh sách 16 bài hát tuyển chọn */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                    Danh Sách 16 Bài Hát Đám Cưới Tuyển Chọn:
                  </h4>
                  <span className="text-[11px] text-gray-400">Bấm nút ▶ để nghe thử trước</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {CURATED_WEDDING_SONGS.map((song) => {
                    const isSelected = musicUrl === song.url;
                    const isPreviewing = previewingSongId === song.id;

                    return (
                      <div
                        key={song.id}
                        onClick={() => {
                          setMusicTitle(song.title);
                          setMusicUrl(song.url);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-rose-50/80 border-zen-primary shadow-xs ring-1 ring-zen-primary"
                            : "bg-white hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                              {song.genre}
                            </span>
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">
                              {song.mood}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {song.duration}
                            </span>
                          </div>
                          <h5 className="font-bold text-xs text-gray-900 truncate">
                            {song.title}
                          </h5>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">
                            {song.artist} • {song.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              if (isPreviewing) {
                                previewAudioRef.current?.pause();
                                setPreviewingSongId(null);
                              } else {
                                if (previewAudioRef.current) {
                                  previewAudioRef.current.src = song.url;
                                  previewAudioRef.current.play().catch(() => {});
                                  setPreviewingSongId(song.id);
                                }
                              }
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isPreviewing
                                ? "bg-zen-primary text-white scale-110 shadow-sm"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                            title={isPreviewing ? "Tạm dừng" : "Nghe thử bài này"}
                          >
                            {isPreviewing ? (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMusicTitle(song.title);
                              setMusicUrl(song.url);
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-emerald-600 text-white"
                                : "border border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600"
                            }`}
                            title="Chọn làm nhạc nền thiệp cưới"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ALBUM ẢNH CƯỚI (PHOTO GALLERY) */}
          {activeTab === "album" && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>Album Ảnh Cưới ({albumPhotos.length} ảnh)</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Khách có thể bấm vào từng ảnh để phóng to Lightbox xem từng bức hình kỷ niệm.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full shrink-0">
                  Phóng to Lightbox sắc nét
                </span>
              </div>

              {/* Thêm ảnh mới */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Thêm liên kết ảnh mới vào album:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Dán link ảnh (https://images.unsplash.com/... hoặc link ảnh cưới)"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-zen-primary shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPhotoUrl.trim()) {
                        setAlbumPhotos((prev) => [...prev, newPhotoUrl.trim()]);
                        setNewPhotoUrl("");
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm ảnh</span>
                  </button>
                </div>
              </div>

              {/* Danh sách ảnh trong album */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                    Các Ảnh Trong Album Cưới:
                  </h4>
                  <span className="text-[11px] text-gray-400">
                    Di chuột để xem ảnh và nút xóa
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[350px] overflow-y-auto p-1">
                  {albumPhotos.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-2xs hover:shadow-md transition-all"
                    >
                      <img
                        src={url}
                        alt={`Ảnh cưới ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute(
                            "src",
                            "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop"
                          );
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAlbumPhotos((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm"
                          title="Xóa ảnh này khỏi album"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-2 text-[10px] font-bold text-white drop-shadow-md">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden preview audio element */}
        <audio
          ref={previewAudioRef}
          onEnded={() => setPreviewingSongId(null)}
          onError={() => setPreviewingSongId(null)}
          className="hidden"
        />

        {/* Footer Buttons */}
        <div className="p-4 bg-stone-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-5 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white font-bold shadow-md shadow-zen-primary/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Lưu cài đặt thiệp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
