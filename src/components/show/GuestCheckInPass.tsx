"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Download, QrCode, X } from "lucide-react";
import Dialog from "@/components/ui/Dialog";
import { parseGuestCheckInQr } from "@/lib/guestCheckInQr";

interface GuestCheckInPassProps {
  cardId: string;
  cardSlug: string;
}

/** Builds a pass locally; the reception desk still verifies the guest on its server. */
export default function GuestCheckInPass({ cardId, cardSlug }: GuestCheckInPassProps) {
  const titleId = useId();
  const search = useSearchParams()?.toString() || "";
  const [passUrl, setPassUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOpen(false);
    setImageUrl(null);
    const parsed = parseGuestCheckInQr(window.location.href);
    if (!parsed.success || (parsed.payload.cardId && parsed.payload.cardId !== cardId)
        || (parsed.payload.cardSlug !== cardSlug && parsed.payload.cardSlug !== cardId)) {
      setPassUrl(null);
      return;
    }
    const url = new URL(`/show/${encodeURIComponent(cardSlug)}`, window.location.origin);
    url.searchParams.set("cardId", cardId);
    url.searchParams.set("guestId", parsed.payload.guestId);
    setPassUrl(url.href);
  }, [cardId, cardSlug, search]);

  useEffect(() => {
    if (!open || !passUrl) return;
    let active = true;
    setImageUrl(null);
    setError(null);
    void import("qrcode-generator").then(({ default: qrcode }) => {
      const code = qrcode(0, "M");
      code.addData(passUrl);
      code.make();
      const svg = code.createSvgTag({ cellSize: 8, margin: 32, scalable: true });
      if (active) setImageUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    }).catch(() => {
      if (active) setError("Không thể tạo mã điểm danh. Hãy đóng và mở lại mã.");
    });
    return () => { active = false; };
  }, [open, passUrl]);

  if (!passUrl) return null;

  return (
    <div className="border-b border-zen-border bg-zen-surface px-4 py-3 text-center">
      <button type="button" className="zen-button zen-button-secondary" onClick={() => setOpen(true)}>
        <QrCode aria-hidden="true" className="size-4" />
        Mã điểm danh
      </button>
      <Dialog isOpen={open} onClose={() => setOpen(false)} labelledBy={titleId}>
        <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center text-zen-black shadow-xl">
          <button type="button" aria-label="Đóng mã điểm danh" onClick={() => setOpen(false)}
            className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full hover:bg-zen-subtle">
            <X aria-hidden="true" className="size-5" />
          </button>
          <h2 id={titleId} className="pr-6 text-xl font-semibold">Mã điểm danh của bạn</h2>
          <p className="mt-3 text-sm leading-relaxed text-zen-muted">Trình mã này cho bàn đón tiếp khi đến dự tiệc.</p>
          {imageUrl ? (
            <>
              <Image src={imageUrl} unoptimized width={288} height={288}
                alt="Mã QR điểm danh khách mời" className="mx-auto my-4 h-auto w-full max-w-72" />
              <a href={imageUrl} download="Ma-diem-danh.svg" className="zen-button zen-button-primary">
                <Download aria-hidden="true" className="size-4" />Tải mã QR
              </a>
            </>
          ) : error ? <p role="alert" className="my-6 text-sm text-rose-700">{error}</p>
            : <p role="status" className="my-6 text-sm text-zen-muted">Đang tạo mã điểm danh…</p>}
        </div>
      </Dialog>
    </div>
  );
}
