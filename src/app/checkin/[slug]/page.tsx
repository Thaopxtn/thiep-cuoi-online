"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  QrCode,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Camera,
  X,
  Volume2,
  ChevronLeft,
  UtensilsCrossed,
  Sparkles,
  RefreshCw,
  Phone,
  UserCheck,
} from "lucide-react";
import { fetchCardFromServer, WeddingCard } from "@/lib/weddingCardService";
import {
  GuestItem,
  getGuestsByCardId,
  updateGuest,
  GUEST_GROUPS,
} from "@/lib/guestManagementService";
import { weddingSounds } from "@/lib/soundEffects";

export default function ReceptionCheckInPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [card, setCard] = useState<WeddingCard | null>(null);
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "checked_in" | "pending">("all");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedGuestAlert, setScannedGuestAlert] = useState<GuestItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load card info
  useEffect(() => {
    async function load() {
      const c = await fetchCardFromServer(slug);
      if (c) {
        setCard(c);
        const data = getGuestsByCardId(c.id);
        setGuests(data);
      }
    }
    load();
  }, [slug]);

  // Statistics
  const stats = useMemo(() => {
    const total = guests.length;
    const checkedIn = guests.filter((g) => g.status === "confirmed").length;
    const pending = total - checkedIn;
    const totalSeats = guests
      .filter((g) => g.status === "confirmed")
      .reduce((sum, g) => sum + (g.estimatedGuests || 1), 0);
    const percent = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
    return { total, checkedIn, pending, totalSeats, percent };
  }, [guests]);

  // Filtered list
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        !searchQuery ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.phone && g.phone.includes(searchQuery)) ||
        (g.tableNumber && g.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchFilter =
        filterMode === "all" ||
        (filterMode === "checked_in" && g.status === "confirmed") ||
        (filterMode === "pending" && g.status !== "confirmed");

      return matchSearch && matchFilter;
    });
  }, [guests, searchQuery, filterMode]);

  // Check in action
  const handleCheckInGuest = (guest: GuestItem) => {
    if (!card) return;
    const newStatus = guest.status === "confirmed" ? "sent" : "confirmed";

    updateGuest(card.id, guest.id, { status: newStatus });
    const updatedList = getGuestsByCardId(card.id);
    setGuests(updatedList);

    if (newStatus === "confirmed") {
      try {
        weddingSounds.playChime();
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([40, 30, 60]);
        }
      } catch {}

      setScannedGuestAlert(guest);
      showToast(`✨ Đã điểm danh đón tiếp: "${guest.name}"!`);
    } else {
      showToast(`Đã hủy điểm danh của "${guest.name}".`);
    }
  };

  // Start / Stop camera
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch (err) {
      console.warn("Không thể mở camera:", err);
      showToast("Không thể truy cập camera. Vui lòng điểm danh bằng tìm kiếm tên!");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 select-none pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-amber-200 px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-400/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/show/${slug}`}
            className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5">
              <span>Điểm Danh Check-in Tại Sảnh Cưới</span>
              <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                Live
              </span>
            </h1>
            <p className="text-[11px] text-gray-500">
              {card ? `${card.groom?.name} & ${card.bride?.name}` : "Hôn lễ thành hôn"} • {card?.events?.[0]?.venue || "Sảnh đón tiệc"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={isCameraActive ? stopCamera : startCamera}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
            isCameraActive
              ? "bg-rose-500 hover:bg-rose-600 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{isCameraActive ? "Tắt Camera" : "Quét mã QR"}</span>
        </button>
      </header>

      {/* 2. Camera Viewfinder Modal / Overlay */}
      {isCameraActive && (
        <div className="fixed inset-0 z-40 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden border-2 border-emerald-400 shadow-2xl bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Target Reticle */}
            <div className="absolute inset-8 border border-white/40 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-emerald-400 rounded-xl animate-pulse flex items-center justify-center">
                <span className="text-[11px] text-white/80 font-bold bg-black/50 px-2 py-1 rounded-full">
                  Đặt mã QR vào khung
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={stopCamera}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white text-xs mt-4 text-center max-w-xs">
            Hướng camera vào mã QR trên thiệp mời của khách để tự động điểm danh và hiện số bàn tiệc.
          </p>
        </div>
      )}

      {/* 3. Live Attendance KPI Banner */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 sm:pt-6">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <UserCheck className="w-4 h-4 text-emerald-200" />
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-100">
                Tiến độ đón tiếp khách mời
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Đã đến: {stats.checkedIn} / {stats.total} khách ({stats.percent}%)
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1">
              Tổng số thực tế tại các bàn: <strong>{stats.totalSeats} người</strong> (tính cả người đi cùng)
            </p>
          </div>

          {/* Progress Circle / Pill */}
          <div className="bg-white/20 backdrop-blur-md px-5 py-3 rounded-2xl text-center shrink-0 border border-white/20">
            <span className="text-[10.5px] uppercase font-bold text-emerald-100 block">Còn lại</span>
            <span className="text-2xl font-black block">{stats.pending}</span>
            <span className="text-[10px] text-emerald-100 block">khách chưa check-in</span>
          </div>
        </div>
      </div>

      {/* 4. Search & Filters */}
      <div className="max-w-4xl mx-auto w-full px-4 mt-4">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm nhanh theo tên, số bàn tiệc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("checked_in")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === "checked_in"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Đã đến ({stats.checkedIn})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("pending")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === "pending"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Chưa đến ({stats.pending})
            </button>
          </div>
        </div>
      </div>

      {/* 5. Guests Check-in Grid */}
      <div className="max-w-4xl mx-auto w-full px-4 mt-4">
        {filteredGuests.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">Không tìm thấy khách mời</p>
            <p className="text-xs text-gray-400 mt-1">
              Thử tìm kiếm theo từ khóa khác hoặc xóa bộ lọc.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredGuests.map((guest) => {
              const isDone = guest.status === "confirmed";
              const grpMeta = GUEST_GROUPS.find((g) => g.id === guest.group) || GUEST_GROUPS[5];

              return (
                <div
                  key={guest.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isDone
                      ? "bg-emerald-50/40 border-emerald-200 shadow-2xs"
                      : "bg-white border-gray-200 hover:border-gray-300 shadow-2xs"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{guest.name}</h3>
                      <span className={`px-2 py-0.2 rounded-md text-[9.5px] font-bold border ${grpMeta.badgeColor}`}>
                        {grpMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs">
                      {guest.tableNumber ? (
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200/60 text-[11px] flex items-center gap-1">
                          <UtensilsCrossed className="w-3 h-3" />
                          <span>{guest.tableNumber}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Chưa xếp bàn</span>
                      )}
                      <span className="text-gray-500 font-medium text-[11px]">
                        • {guest.estimatedGuests || 1} khách
                      </span>
                    </div>
                  </div>

                  {/* 1-Tap Check-in Button */}
                  <button
                    type="button"
                    onClick={() => handleCheckInGuest(guest)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
                      isDone
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isDone ? "Đã đến" : "Check-in"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Success Modal when a guest is checked in */}
      {scannedGuestAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 text-center animate-scale-up space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
              🎉
            </div>

            <div>
              <span className="text-xs uppercase font-bold text-emerald-600 tracking-wider">
                Điểm danh thành công!
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1">{scannedGuestAlert.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Rất hân hạnh được đón tiếp bạn và gia đình!
              </p>
            </div>

            {scannedGuestAlert.tableNumber && (
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900">
                <span className="text-[11px] font-bold text-indigo-600 block uppercase">
                  Vị trí bàn tiệc đón tiếp:
                </span>
                <span className="text-lg font-black block mt-0.5">
                  {scannedGuestAlert.tableNumber}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setScannedGuestAlert(null)}
              className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Hoàn tất & Tiếp tục đón khách
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
