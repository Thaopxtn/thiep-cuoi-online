import Link from "next/link";
import { Sparkles, Send, CheckCircle2 } from "lucide-react";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export default function CtaBanner() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24" aria-label="Bắt đầu tạo thiệp">
      <AnimateOnScroll animation="fade-up">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-[#fff6f4] via-white to-[#fff8f7] px-6 py-12 text-center sm:px-12 sm:py-16 border border-rose-100 shadow-[0_20px_50px_rgba(229,65,83,0.08)]">
          {/* Subtle Ambient Blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 -top-20 size-72 rounded-full bg-rose-200/40 blur-3xl" />
            <div className="absolute -right-20 -bottom-20 size-72 rounded-full bg-pink-200/40 blur-3xl" />
            <div className="absolute left-1/2 top-0 -translate-x-1/2 size-96 rounded-full bg-amber-100/30 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-3xl">
            {/* Pill Badge */}
            <div className="mx-auto mb-4 inline-flex items-center gap-2 text-sm font-semibold text-zen-primary">
              <Sparkles aria-hidden="true" className="size-4" />
              <span>Khởi tạo miễn phí ngay hôm nay</span>
            </div>

            {/* Heading */}
            <h2 className="mx-auto mt-2 font-heading text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl leading-tight">
              Sẵn sàng tạo thiệp cưới online cho ngày vui của bạn?
            </h2>

            {/* Description */}
            <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-gray-600">
              Chỉ mất vài phút để sở hữu tấm thiệp cưới điện tử hiện đại, tinh tế và sẵn sàng gửi lời mời trọn vẹn đến từng vị khách quý.
            </p>

            {/* Trust Points */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-600 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Không giới hạn khách mời</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Không quảng cáo làm phiền</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Hoàn toàn miễn phí</span>
              </span>
            </div>

            {/* Action Button */}
            <div className="mt-8 flex justify-center">
              <Link
                className="zen-button zen-button-primary"
                href="/templates"
              >
                <span>Bắt đầu tạo thiệp cưới ngay</span>
                <Send aria-hidden="true" className="size-4 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </AnimateOnScroll>
    </section>
  );
}
