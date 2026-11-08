"use client";

import React, { useState, useEffect, useMemo, useRef, useId, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  QrCode,
  Users,
  Search,
  CheckCircle2,
  Camera,
  X,
  ChevronLeft,
  UtensilsCrossed,
  Sparkles,
  UserCheck,
  Upload,
} from "lucide-react";
import { fetchCardForEditor, WeddingCard } from "@/lib/weddingCardService";
import {
  GuestItem,
  fetchGuestsForCard,
  checkInGuestAsync,
  GUEST_GROUPS,
} from "@/lib/guestManagementService";
import { weddingSounds } from "@/lib/soundEffects";
import Dialog from "@/components/ui/Dialog";
import { useQrScanner } from "@/hooks/useQrScanner";
import { decodeQrImage } from "@/lib/qrImageDecoder";
import { resolveGuestCheckInQr } from "@/lib/guestCheckInQr";

export default function ReceptionCheckInPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [card, setCard] = useState<WeddingCard | null>(null);
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "checked_in" | "pending">("all");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraRequested, setCameraRequested] = useState(false);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [manualQr, setManualQr] = useState("");
  const [scannedGuestAlert, setScannedGuestAlert] = useState<GuestItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const activeSlug = useRef(slug);
  activeSlug.current = slug;
  const mutationPending = useRef<symbol | null>(null);
  const qrTaskPending = useRef<symbol | null>(null);
  const scannerSession = useRef(0);
  const scannerOpenRef = useRef(false);
  const loadedSlug = useRef<string | null>(null);
  const dataSession = useRef(0);
  const mounted = useRef(true);
  const guestsRef = useRef(guests);
  guestsRef.current = guests;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scannerId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToastMessage(msg);
    toastTimeout.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      scannerOpenRef.current = false;
      scannerSession.current += 1;
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  // Load card info
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setGuests([]);
    guestsRef.current = [];
    setCard(null);
    loadedSlug.current = null;
    dataSession.current += 1;
    scannerOpenRef.current = false;
    scannerSession.current += 1;
    qrTaskPending.current = null;
    mutationPending.current = null;
    setScannerOpen(false);
    setCameraRequested(false);
    setQrBusy(false);
    setSavingId(null);
    setScannedGuestAlert(null);
    async function load() {
      try {
        const result = await fetchCardForEditor(slug);
        if (!result.success || !result.card || !result.isOwner) throw new Error(result.message || "Vui lòng đăng nhập bằng tài khoản chủ thiệp để điểm danh");
        const data = await fetchGuestsForCard(result.card);
        if (!cancelled) {
          loadedSlug.current = slug;
          guestsRef.current = data;
          setCard(result.card);
          setGuests(data);
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Không thể tải danh sách điểm danh");
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [slug, refreshVersion]);

  // Statistics
  const stats = useMemo(() => {
    const total = guests.length;
    const checkedIn = guests.filter((g) => g.checkedIn).length;
    const pending = total - checkedIn;
    const totalSeats = guests
      .filter((g) => g.checkedIn)
      .reduce((sum, g) => sum + (g.responseGuests ?? g.estimatedGuests ?? 1), 0);
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
        (filterMode === "checked_in" && g.checkedIn) ||
        (filterMode === "pending" && !g.checkedIn);

      return matchSearch && matchFilter;
    });
  }, [guests, searchQuery, filterMode]);

  const closeScanner = () => {
    scannerOpenRef.current = false;
    scannerSession.current += 1;
    qrTaskPending.current = null;
    setScannerOpen(false);
    setCameraRequested(false);
    setQrBusy(false);
  };

  const openScanner = () => {
    if (!card || loading || mutationPending.current) return;
    scannerSession.current += 1;
    scannerOpenRef.current = true;
    setQrError(null);
    setManualQr("");
    setCameraRequested(true);
    setScannerOpen(true);
  };

  const persistCheckIn = async (guest: GuestItem, checkedIn: boolean, qrSession?: number) => {
    if (!card || loading || loadedSlug.current !== slug || mutationPending.current) return false;
    if (guest.cardId !== card.id || (qrSession === undefined && qrTaskPending.current)) return false;
    const requestSlug = slug;
    const requestDataSession = dataSession.current;
    const operation = Symbol("check-in");
    mutationPending.current = operation;
    setSavingId(guest.id);
    setLoadError(null);
    try {
      const next = await checkInGuestAsync(card, guest, checkedIn);
      if (!mounted.current || activeSlug.current !== requestSlug || dataSession.current !== requestDataSession) return false;
      const confirmed = next.find((item) => item.id === guest.id && item.cardId === card.id && !item.deletedAt);
      if (!confirmed || Boolean(confirmed.checkedIn) !== checkedIn) {
        throw new Error("Máy chủ chưa xác nhận điểm danh. Hãy làm mới danh sách trước khi thử lại.");
      }
      guestsRef.current = next;
      setGuests(next);
      const showResult = qrSession === undefined || scannerSession.current === qrSession;
      if (checkedIn && showResult) {
        if (qrSession !== undefined) closeScanner();
        try {
          weddingSounds.playChime();
          navigator.vibrate?.([40, 30, 60]);
        } catch {}
        setScannedGuestAlert(confirmed);
        showToast(`Đã điểm danh đón tiếp: "${confirmed.name}".`);
      } else if (!checkedIn) {
        showToast(`Đã hủy điểm danh của "${confirmed.name}".`);
      }
      return true;
    } catch (error) {
      if (mounted.current && activeSlug.current === requestSlug && dataSession.current === requestDataSession) {
        const message = error instanceof Error ? error.message : "Không thể lưu điểm danh";
        if (qrSession !== undefined && scannerSession.current === qrSession) setQrError(message);
        else setLoadError(message);
      }
      return false;
    } finally {
      if (mutationPending.current === operation) {
        mutationPending.current = null;
        if (mounted.current && activeSlug.current === requestSlug) setSavingId(null);
      }
    }
  };

  const submitQr = async (readValue: () => string | Promise<string>) => {
    if (!scannerOpenRef.current || !card || loading || loadedSlug.current !== slug || qrTaskPending.current || mutationPending.current) return;
    const operation = Symbol("read-qr");
    const session = scannerSession.current;
    const requestSlug = slug;
    qrTaskPending.current = operation;
    setCameraRequested(false);
    setQrBusy(true);
    setQrError(null);
    try {
      const value = await readValue();
      if (!mounted.current || activeSlug.current !== requestSlug || scannerSession.current !== session) return;
      const result = resolveGuestCheckInQr(value, card, guestsRef.current);
      if (!result.success) throw new Error(result.message);
      if (result.guest.checkedIn) {
        throw new Error(`"${result.guest.name}" đã được điểm danh. Mã QR này không thay đổi trạng thái đã đến.`);
      }
      await persistCheckIn(result.guest, true, session);
    } catch (error) {
      if (mounted.current && activeSlug.current === requestSlug && scannerSession.current === session) {
        setQrError(error instanceof Error ? error.message : "Không thể đọc mã QR. Hãy thử lại.");
      }
    } finally {
      if (qrTaskPending.current === operation) {
        qrTaskPending.current = null;
        if (mounted.current && activeSlug.current === requestSlug) setQrBusy(false);
      }
    }
  };

  const scanner = useQrScanner({
    enabled: scannerOpen && cameraRequested,
    scope: `${slug}:${cameraAttempt}`,
    onDecode: (value) => submitQr(() => value),
  });

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-12">
      {loading && <p role="status" className="px-4 py-3 text-sm text-gray-600">Đang tải danh sách điểm danh…</p>}
      {loadError && <div role="alert" className="px-4 py-3 text-sm text-rose-700 bg-rose-50">{loadError}</div>}
      {/* Toast Alert */}
      {toastMessage && (
        <div role="status" className="fixed top-4 right-4 z-50 bg-stone-900 text-amber-200 px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-400/40 text-sm font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/show/${slug}`}
            aria-label="Quay lại thiệp cưới"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5">
              <span>Điểm danh tại sảnh cưới</span>
              <span className="px-2 py-0.5 whitespace-nowrap rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                {loading ? "Đang tải" : loadError ? "Cần đồng bộ" : "Đã tải"}
              </span>
            </h1>
            <p className="text-[11px] text-gray-500">
              {card ? `${card.groom?.name} & ${card.bride?.name}` : "Hôn lễ thành hôn"} • {card?.events?.[0]?.venue || "Sảnh đón tiệc"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">
        <button type="button" disabled={loading || qrBusy || Boolean(savingId)} onClick={() => setRefreshVersion((value) => value + 1)} className="min-h-11 px-3 py-2 text-sm border rounded-xl disabled:opacity-50">Làm mới</button>
        <button
          type="button"
          disabled={!card || loading || qrBusy || Boolean(savingId)}
          onClick={openScanner}
          className="min-h-11 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Quét mã QR</span>
        </button>
        </div>
      </header>

      <Dialog isOpen={scannerOpen} onClose={closeScanner} labelledBy={`${scannerId}-title`} describedBy={`${scannerId}-description`}>
        <section className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id={`${scannerId}-title`} className="text-lg font-bold flex items-center gap-2">
              <QrCode aria-hidden="true" className="size-5 text-emerald-700" />
              Quét mã điểm danh
            </h2>
            <button type="button" onClick={closeScanner} aria-label="Đóng bảng quét mã QR" className="min-h-11 min-w-11 flex items-center justify-center rounded-full hover:bg-gray-100">
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <p id={`${scannerId}-description`} className="text-sm text-gray-600">
            Dùng mã điểm danh riêng của khách trong thiệp này. Liên kết chỉ có tên khách không dùng để điểm danh tự động.
          </p>
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-950">
            <video ref={scanner.videoRef} className="h-full w-full object-contain" playsInline muted aria-label="Camera quét mã điểm danh" />
            {scanner.status === "starting" && <p role="status" className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-white">Đang yêu cầu quyền truy cập camera…</p>}
            {scanner.status === "scanning" && <div aria-hidden="true" className="pointer-events-none absolute inset-8 rounded-xl border-2 border-emerald-400" />}
            {(scanner.status === "idle" || scanner.status === "error") && <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-gray-200">Camera đang tắt. Bạn có thể chọn ảnh QR hoặc dán liên kết mời.</p>}
          </div>
          {scanner.error && cameraRequested && <p role="alert" className="text-sm text-rose-700">{scanner.error}</p>}
          {qrError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{qrError}</p>}
          {qrBusy && <p role="status" className="text-sm font-semibold text-emerald-800">{savingId ? "Đang chờ máy chủ xác nhận điểm danh…" : "Đang đọc mã QR…"}</p>}
          <button
            type="button"
            disabled={qrBusy || Boolean(savingId)}
            className="zen-button zen-button-secondary w-full disabled:opacity-50"
            onClick={() => {
              setQrError(null);
              if (cameraRequested && scanner.status !== "error") setCameraRequested(false);
              else { setCameraAttempt((value) => value + 1); setCameraRequested(true); }
            }}
          >
            <Camera aria-hidden="true" className="size-4" />
            {cameraRequested && scanner.status !== "error" ? "Tắt camera" : "Bật lại camera"}
          </button>
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <label htmlFor={`${scannerId}-image`} className="flex items-center gap-2 text-sm font-semibold"><Upload aria-hidden="true" className="size-4" />Chọn ảnh mã QR</label>
            <input
              id={`${scannerId}-image`}
              type="file"
              accept="image/*"
              disabled={qrBusy || Boolean(savingId)}
              className="w-full min-h-11 rounded-xl border border-gray-300 p-2 text-sm disabled:opacity-50"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (file) void submitQr(() => decodeQrImage(file));
              }}
            />
            <p className="text-xs text-gray-600">Ảnh tối đa 10 MB, được đọc trực tiếp trên thiết bị của bạn.</p>
          </div>
          <form className="border-t border-gray-200 pt-4 space-y-2" onSubmit={(event) => { event.preventDefault(); void submitQr(() => manualQr); }}>
            <label htmlFor={`${scannerId}-link`} className="block text-sm font-semibold">Liên kết hoặc nội dung mã QR</label>
            <textarea id={`${scannerId}-link`} value={manualQr} onChange={(event) => setManualQr(event.target.value)} disabled={qrBusy || Boolean(savingId)} rows={2} className="w-full rounded-xl border border-gray-300 p-3 text-base disabled:opacity-50" placeholder="Dán liên kết mời có mã khách…" />
            <button type="submit" disabled={!manualQr.trim() || qrBusy || Boolean(savingId)} className="zen-button zen-button-primary w-full disabled:opacity-50">Điểm danh từ liên kết</button>
          </form>
        </section>
      </Dialog>

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
            <label htmlFor={`${scannerId}-search`} className="sr-only">Tìm khách theo tên, số điện thoại hoặc bàn tiệc</label>
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id={`${scannerId}-search`}
              type="text"
              placeholder="Tìm nhanh theo tên, số bàn tiệc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-11 pl-9 pr-3 py-2 text-base bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              aria-pressed={filterMode === "all"}
              className={`flex-1 sm:flex-none min-h-11 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
              aria-pressed={filterMode === "checked_in"}
              className={`flex-1 sm:flex-none min-h-11 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
              aria-pressed={filterMode === "pending"}
              className={`flex-1 sm:flex-none min-h-11 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
              const isDone = Boolean(guest.checkedIn);
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
                        • {guest.responseGuests ?? guest.estimatedGuests ?? 1} khách
                      </span>
                    </div>
                  </div>

                  {/* 1-Tap Check-in Button */}
                  <button
                    type="button"
                    onClick={() => void persistCheckIn(guest, !guest.checkedIn)}
                    aria-label={`${guest.checkedIn ? "Hủy điểm danh" : "Điểm danh"} ${guest.name}`}
                    disabled={loading || qrBusy || Boolean(savingId)}
                    className={`min-h-11 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 disabled:opacity-50 ${
                      isDone
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{savingId === guest.id ? "Đang lưu…" : isDone ? "Đã đến" : "Check-in"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Success Modal when a guest is checked in */}
      {scannedGuestAlert && (
        <Dialog isOpen={Boolean(scannedGuestAlert)} onClose={() => setScannedGuestAlert(null)} labelledBy={`${scannerId}-success-title`} describedBy={`${scannerId}-success-name`}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 text-center animate-scale-up space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
              🎉
            </div>

            <div>
              <h2 id={`${scannerId}-success-title`} className="text-sm font-bold text-emerald-700">
                Điểm danh thành công!
              </h2>
              <h3 id={`${scannerId}-success-name`} className="text-xl font-bold text-gray-900 mt-1">{scannedGuestAlert.name}</h3>
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
              className="w-full min-h-11 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-bold transition-all active:scale-95 cursor-pointer"
            >
              Hoàn tất & Tiếp tục đón khách
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
