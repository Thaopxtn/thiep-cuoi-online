"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { X, Users, Copy, Check, Share2, Plus, Trash2, FileSpreadsheet, CheckCircle2, Search, MessageSquare, Mail, Phone, RefreshCw } from "lucide-react";
import Dialog from "@/components/ui/Dialog";
import { fetchCardForEditor, type WeddingCard } from "@/lib/weddingCardService";
import { deleteGuestAsync, fetchGuestsForCard, getZaloSharePayload, GUEST_GROUPS, saveGuestAsync, type GuestGroup, type GuestItem } from "@/lib/guestManagementService";
import { formatEmailInvite, formatSmsInvite } from "@/lib/guestInvitationHelper";
import { importBulkInvitationGuests, importLegacyBulkGuests, readLegacyBulkGuests } from "@/lib/bulkInvitationService";

interface BulkGuestInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardSlug: string;
  cardTitle?: string;
  groomName?: string;
  brideName?: string;
  weddingDate?: string;
}

const hasSentInvitation = (guest: GuestItem) => guest.status !== "not_sent";
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Không thể đồng bộ khách mời. Vui lòng thử lại.";
const csvCell = (value: unknown) => {
  const text = String(value ?? "");
  return `"${(/^[=+\-@\t\r]/.test(text) ? "'" : "") + text.replace(/"/g, '""')}"`;
};

// Unmounting each session isolates pending requests when the owner changes cards
// or closes and reopens the dialog.
export default function BulkGuestInvitationModal(props: BulkGuestInvitationModalProps) {
  if (!props.isOpen) return null;
  return <BulkGuestInvitationContent key={props.cardSlug} {...props} />;
}

export function BulkGuestInvitationContent({
  onClose, cardSlug, cardTitle, groomName = "Chú Rể", brideName = "Cô Dâu", weddingDate,
}: BulkGuestInvitationModalProps) {
  const titleId = useId();
  const [card, setCard] = useState<WeddingCard | null>(null);
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [legacyRows, setLegacyRows] = useState<unknown[]>([]);
  const [legacyImported, setLegacyImported] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GuestGroup>("friends");
  const [filterGroup, setFilterGroup] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isImportMode, setIsImportMode] = useState(false);
  const revisionRef = useRef(0);
  const pendingRef = useRef(false);

  useEffect(() => {
    const revision = ++revisionRef.current;
    setLoading(true);
    setError(null);
    setNotice(null);
    setCard(null);
    setGuests([]);
    setLegacyRows([]);
    setLegacyImported(false);
    const load = async () => {
      try {
        const result = await fetchCardForEditor(cardSlug);
        if (!result.success || !result.card || !result.isOwner) {
          throw new Error(result.message || "Vui lòng đăng nhập bằng tài khoản chủ thiệp để quản lý lời mời.");
        }
        const confirmedGuests = await fetchGuestsForCard(result.card);
        if (revisionRef.current !== revision) return;
        setCard(result.card);
        setGuests(confirmedGuests);
        try { setLegacyRows(readLegacyBulkGuests(cardSlug)); }
        catch { setError("Không đọc được danh sách khách cũ trên thiết bị. Danh sách CRM vẫn dùng được và dữ liệu cũ được giữ nguyên."); }
      } catch (loadError) {
        if (revisionRef.current === revision) setError(errorMessage(loadError));
      } finally {
        if (revisionRef.current === revision) setLoading(false);
      }
    };
    void load();
    return () => { revisionRef.current += 1; };
  }, [cardSlug, reloadVersion]);

  useEffect(() => {
    if (!copiedId && !copiedAll) return;
    const timer = setTimeout(() => { setCopiedId(null); setCopiedAll(false); }, 2500);
    return () => clearTimeout(timer);
  }, [copiedId, copiedAll]);

  const busy = loading || pending;
  const filteredGuests = useMemo(() => guests.filter((guest) =>
    (filterGroup === "all" || guest.group === filterGroup) &&
    guest.name.toLocaleLowerCase("vi").includes(searchQuery.toLocaleLowerCase("vi"))
  ), [guests, filterGroup, searchQuery]);
  const sentCount = guests.filter(hasSentInvitation).length;

  const commitGuests = async (operation: (activeCard: WeddingCard) => Promise<GuestItem[]>, message: string) => {
    if (!card || loading || pendingRef.current) return false;
    const revision = revisionRef.current;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const confirmedGuests = await operation(card);
      if (revisionRef.current !== revision) return false;
      setGuests(confirmedGuests);
      setNotice(message);
      return true;
    } catch (mutationError) {
      if (revisionRef.current === revision) setError(errorMessage(mutationError));
      return false;
    } finally {
      pendingRef.current = false;
      if (revisionRef.current === revision) setPending(false);
    }
  };

  const handleBulkImport = async () => {
    if (!rawInput.trim()) return;
    if (await commitGuests((activeCard) => importBulkInvitationGuests(activeCard, rawInput, selectedGroup), "Đã lưu danh sách khách mời vào CRM.")) {
      setRawInput("");
      setIsImportMode(false);
    }
  };
  const handleLegacyImport = async () => {
    if (await commitGuests((activeCard) => importLegacyBulkGuests(activeCard, legacyRows), "Đã đồng bộ danh sách cũ. Bản gốc trên thiết bị vẫn được giữ lại.")) setLegacyImported(true);
  };
  const toggleSentStatus = async (guest: GuestItem) => {
    // Omit checkedIn on this write so changing invitation status does not reset
    // the server's checkedInAt timestamp or alter RSVP/check-in metadata.
    await commitGuests((activeCard) => saveGuestAsync(activeCard, {
      ...guest, status: hasSentInvitation(guest) ? "not_sent" : "sent", checkedIn: undefined,
    }, guest), "Đã cập nhật trạng thái gửi thiệp.");
  };

  const copyText = async (text: string): Promise<boolean> => {
    const revision = revisionRef.current;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Trình duyệt chưa cho phép sao chép. Bạn có thể mở đường dẫn của khách để chia sẻ.");
      await navigator.clipboard.writeText(text);
      return revisionRef.current === revision;
    } catch (copyError) {
      if (revisionRef.current === revision) setError(errorMessage(copyError));
      return false;
    }
  };
  const handleCopyGuestLink = async (guest: GuestItem) => {
    if (card && await copyText(getZaloSharePayload(guest, card).cardUrl)) setCopiedId(guest.id);
  };
  const handleCopyAllLinks = async () => {
    if (!card) return;
    const text = guests.map((guest) => `${guest.name}: ${getZaloSharePayload(guest, card).cardUrl}`).join("\n");
    if (await copyText(text)) setCopiedAll(true);
  };
  const handleSendViaZalo = (guest: GuestItem) => {
    if (!card) return;
    const payload = getZaloSharePayload(guest, card);
    window.open(payload.zaloUrl, "_blank", "noopener,noreferrer");
    setNotice("Sau khi gửi lời mời, bấm đánh dấu đã gửi để lưu trạng thái vào CRM.");
  };
  const inviteParams = (guest: GuestItem) => ({
    guestName: guest.name, groomName: card?.groom?.name || groomName,
    brideName: card?.bride?.name || brideName, weddingDate: card?.weddingDate || weddingDate,
    weddingVenue: card?.events?.[0]?.venue,
    guestLink: card ? getZaloSharePayload(guest, card).cardUrl : "",
  });
  const handleExportCsv = () => {
    if (!card) return;
    const rows = [
      ["Họ và tên", "Số điện thoại", "Email", "Nhóm", "Đã gửi", "Link thiệp cưới"],
      ...guests.map((guest) => [guest.name, guest.phone, guest.email,
        GUEST_GROUPS.find((group) => group.id === guest.group)?.label || "Khác",
        hasSentInvitation(guest) ? "Đã gửi" : "Chưa gửi", getZaloSharePayload(guest, card).cardUrl]),
    ];
    const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `danh-sach-khach-moi-${card.slug}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog isOpen onClose={onClose} labelledBy={titleId}>
      <div className="relative flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-zen-border bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zen-border bg-zen-surface px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Users aria-hidden="true" className="size-6 shrink-0 text-zen-primary" />
            <div>
              <h2 id={titleId} className="text-base font-bold text-zen-black">Gửi thiệp mời cá nhân hóa</h2>
              <p className="mt-1 text-xs text-zen-muted">{cardTitle || "Dùng chung danh sách khách mời và mã khách trong CRM."}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng danh sách lời mời" className="zen-control min-w-11 shrink-0 p-2"><X aria-hidden="true" className="size-4" /></button>
        </div>

        {loading && <p role="status" className="px-5 py-4 text-sm text-zen-muted">Đang tải danh sách khách mời…</p>}
        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-800">
          <span>{error}</span>
          <button type="button" disabled={busy} onClick={() => setReloadVersion((version) => version + 1)} className="zen-control"><RefreshCw aria-hidden="true" className="size-4" />Tải lại</button>
        </div>}
        {notice && <p role="status" className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">{notice}</p>}
        {pending && <p role="status" className="px-5 py-2 text-sm text-zen-muted">Đang lưu thay đổi…</p>}

        {card && legacyRows.length > 0 && !legacyImported && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zen-border bg-amber-50 px-5 py-3 text-sm text-amber-900">
          <p>Có {legacyRows.length} khách trong danh sách cũ trên thiết bị này. Bản gốc được giữ nguyên khi đồng bộ.</p>
          <button type="button" disabled={busy} onClick={() => void handleLegacyImport()} className="zen-control">Nhập danh sách cũ vào CRM</button>
        </div>}

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zen-border bg-zen-subtle p-4 text-xs">
          <p className="flex flex-wrap items-center gap-3 text-zen-muted"><span>Tổng khách: <strong className="text-zen-black">{guests.length}</strong></span><span>Đã gửi: {sentCount}</span><span>Chưa gửi: {guests.length - sentCount}</span></p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!card || busy} onClick={() => setIsImportMode((open) => !open)} aria-expanded={isImportMode} className="zen-control"><Plus aria-hidden="true" className="size-4" />{isImportMode ? "Đóng ô nhập" : "Nhập hàng loạt"}</button>
            <button type="button" onClick={() => void handleCopyAllLinks()} disabled={!card || busy || !guests.length} className="zen-control">{copiedAll ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}{copiedAll ? "Đã chép tất cả" : "Chép tất cả link"}</button>
            <button type="button" onClick={handleExportCsv} disabled={!card || busy || !guests.length} className="zen-control"><FileSpreadsheet aria-hidden="true" className="size-4" />Xuất CSV</button>
          </div>
        </div>

        {isImportMode && <div className="shrink-0 border-b border-zen-border bg-rose-50/30 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={`${titleId}-input`} className="text-sm font-semibold text-zen-black">Danh sách khách mời, mỗi người một dòng</label>
            <label className="flex items-center gap-2 text-xs text-zen-muted">Nhóm mặc định
              <select disabled={busy} value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value as GuestGroup)} className="zen-control">
                {GUEST_GROUPS.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
              </select>
            </label>
          </div>
          <textarea id={`${titleId}-input`} disabled={busy} value={rawInput} onChange={(event) => setRawInput(event.target.value)} rows={4}
            placeholder={"Nguyễn Văn An - 0912345678 - an@example.com\nTrần Thu Hà | bride | 0987654321\nLê Minh - Bàn 5"}
            className="w-full resize-y rounded-xl border border-zen-border bg-white p-3 text-sm leading-relaxed" />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-zen-muted">Hỗ trợ tên, số điện thoại, email và nhóm; chỉ thêm sau khi máy chủ xác nhận.</p>
            <button type="button" disabled={busy || !rawInput.trim()} onClick={() => void handleBulkImport()} className="zen-button zen-button-primary text-sm">Thêm vào danh sách</button>
          </div>
        </div>}

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zen-border px-4 py-3">
          <label className="flex items-center gap-2 text-xs text-zen-muted">Lọc nhóm
            <select value={filterGroup} onChange={(event) => setFilterGroup(event.target.value)} className="zen-control"><option value="all">Tất cả</option>{GUEST_GROUPS.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}</select>
          </label>
          <label className="relative min-w-0 flex-1 sm:max-w-64"><span className="sr-only">Tìm tên khách mời</span><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zen-muted" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm tên khách…" className="min-h-11 w-full rounded-xl border border-zen-border pl-9 pr-3 text-sm" /></label>
        </div>

        <div aria-busy={busy} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {!loading && !filteredGuests.length && <div className="py-10 text-center text-sm text-zen-muted"><Users aria-hidden="true" className="mx-auto mb-3 size-8" /><p>{card ? "Chưa có khách mời phù hợp. Dùng Nhập hàng loạt để thêm khách." : "Danh sách sẽ xuất hiện sau khi xác minh tài khoản chủ thiệp."}</p></div>}
          {card && filteredGuests.map((guest) => {
            const sent = hasSentInvitation(guest);
            const payload = getZaloSharePayload(guest, card);
            return <div key={guest.id} className={`flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between ${sent ? "border-emerald-100 bg-emerald-50/30" : "border-zen-border bg-white"}`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><strong className="break-words text-sm text-zen-black">{guest.name}</strong><span className="text-xs text-zen-muted">{GUEST_GROUPS.find((group) => group.id === guest.group)?.label || "Khác"}</span>{sent && <span className="text-xs font-semibold text-emerald-700">Đã gửi</span>}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-zen-muted">{guest.phone && <span className="inline-flex items-center gap-1"><Phone aria-hidden="true" className="size-3" />{guest.phone}</span>}{guest.email && <span className="break-all">{guest.email}</span>}{guest.tableNumber && <span>{guest.tableNumber}</span>}</div>
                <a href={payload.cardUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-xs text-zen-muted underline underline-offset-2 hover:text-zen-primary" title="Mở thiệp mời của khách trong thẻ mới">{payload.cardUrl}</a>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button type="button" disabled={busy} onClick={() => handleSendViaZalo(guest)} className="zen-control text-blue-700" aria-label={`Soạn lời mời Zalo cho ${guest.name}`}><Share2 aria-hidden="true" className="size-4" />Zalo</button>
                <button type="button" disabled={busy} onClick={() => window.location.assign(formatSmsInvite(inviteParams(guest)).smsUri)} className="zen-control" aria-label={`Soạn SMS cho ${guest.name}`}><MessageSquare aria-hidden="true" className="size-4" />SMS</button>
                <button type="button" disabled={busy} onClick={() => window.open(formatEmailInvite(inviteParams(guest)).mailtoUrl, "_blank", "noopener,noreferrer")} className="zen-control" aria-label={`Soạn email cho ${guest.name}`}><Mail aria-hidden="true" className="size-4" />Email</button>
                <button type="button" disabled={busy} onClick={() => void handleCopyGuestLink(guest)} className="zen-control min-w-11 p-2" aria-label={`Sao chép link của ${guest.name}`}>{copiedId === guest.id ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}</button>
                <button type="button" disabled={busy} onClick={() => void toggleSentStatus(guest)} aria-pressed={sent} className="zen-control min-w-11 p-2" aria-label={`${sent ? "Đánh dấu chưa gửi cho" : "Đánh dấu đã gửi cho"} ${guest.name}`}><CheckCircle2 aria-hidden="true" className="size-4" /></button>
                <button type="button" disabled={busy} onClick={() => void commitGuests((activeCard) => deleteGuestAsync(activeCard, guest), "Đã xóa khách mời khỏi danh sách.")} className="zen-control min-w-11 p-2 text-rose-700" aria-label={`Xóa khách mời ${guest.name}`}><Trash2 aria-hidden="true" className="size-4" /></button>
              </div>
            </div>;
          })}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-zen-border bg-zen-subtle px-5 py-3"><p className="text-xs text-zen-muted">Mở ứng dụng nhắn tin chưa có nghĩa là lời mời đã được gửi.</p><button type="button" onClick={onClose} className="zen-button zen-button-secondary text-sm">Hoàn tất</button></div>
      </div>
    </Dialog>
  );
}
