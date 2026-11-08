import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Eye } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pb-12 pt-20 md:pb-16 md:pt-28"
    >
      <div className="relative mx-auto max-w-7xl px-0 py-6 sm:px-6 md:mt-2 md:py-12 lg:px-8">
        <div className="absolute inset-0 overflow-hidden md:left-[45%]" aria-hidden="true">
          <Image
            src="/assets/landing/hero-pc.webp"
            alt=""
            width={1083}
            height={1169}
            priority
            sizes="(min-width: 1280px) 704px, (min-width: 776px) 55vw, 100vw"
            className="h-auto w-full"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-white/90 md:bg-[linear-gradient(103deg,#fff_42%,rgba(255,255,255,0)_100%)]"
          aria-hidden="true"
        />

        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-[36.25rem] md:my-12">
            <p className="mb-5 text-sm font-semibold text-zen-primary">
              Tạo thiệp cưới online miễn phí
            </p>
            <h1
              id="hero-heading"
              className="font-heading text-4xl leading-[1.2] tracking-[-0.02em] text-zen-black sm:text-5xl lg:text-[3.5rem]"
            >
              Lời mời trọn vẹn,
              <br />
              cho ngày chung đôi.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg">
              Chọn mẫu thiệp, kể câu chuyện của hai bạn và gửi lời mời đến từng
              người thân. Bản đồ, nhạc nền và xác nhận tham dự cùng ở trong một
              đường dẫn.
            </p>

            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-gray-600">
              {[
                "Cá nhân hóa lời mời",
                "Chia sẻ qua Zalo, Facebook",
                "Quản lý khách tham dự",
              ].map((feature) => (
                <li key={feature} className="inline-flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-zen-primary" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/templates"
                id="hero-btn-start"
                className="zen-button zen-button-primary w-full sm:w-auto"
              >
                Bắt đầu tạo thiệp miễn phí
                <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
              </Link>
              <Link
                href="/show/thao-le-zenlove-mau01-2026?to=Khách+Quý"
                id="hero-btn-demo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Xem thiệp mẫu thực tế (mở trong thẻ mới)"
                className="zen-button zen-button-secondary w-full sm:w-auto"
              >
                <Eye aria-hidden="true" className="size-4 shrink-0" />
                Xem thiệp mẫu thực tế
              </Link>
              <Link
                href="/tao-thiep-cuoi-online"
                id="hero-btn-guides"
                className="zen-button zen-button-ghost w-full sm:w-auto"
              >
                Hướng dẫn tạo thiệp
              </Link>
            </div>
            <p className="mt-6 border-t border-gray-100 pt-5 text-sm leading-relaxed text-gray-600">
              Xem trước và chỉnh sửa trước khi xuất bản. Chọn gói dịch vụ phù hợp
              khi bạn cần thêm tính năng.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
