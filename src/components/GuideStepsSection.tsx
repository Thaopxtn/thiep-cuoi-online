"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutTemplate, Edit3, Send, Play, X, ArrowRight, Check } from "lucide-react";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

const steps = [
  {
    step: "01",
    icon: LayoutTemplate,
    title: "Chọn mẫu thiệp ưng ý",
    description: "Khám phá kho mẫu phong phú được phân loại theo phong cách, tone màu và chủ đề. Xem trước giao diện thực tế trên di động.",
    highlight: "207+ Mẫu có sẵn",
  },
  {
    step: "02",
    icon: Edit3,
    title: "Cá nhân hóa nội dung",
    description: "Tải ảnh cưới, thay đổi thông tin cô dâu chú rể, địa điểm tổ chức kèm Google Maps và số tài khoản nhận mừng VietQR.",
    highlight: "Trình biên tập kéo thả",
  },
  {
    step: "03",
    icon: Send,
    title: "Gửi thiệp & Theo dõi RSVP",
    description: "Nhận đường link thiệp riêng biệt để chia sẻ qua Zalo, Messenger. Khách xác nhận tham dự sẽ được cập nhật thời gian thực.",
    highlight: "Tự động thống kê",
  },
];

export default function GuideStepsSection() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <Section
      id="create-page-10min"
      bg="white"
      padding="lg"
      ariaLabel="Hướng dẫn tạo thiệp trong 10 phút"
    >
      <AnimateOnScroll animation="fade-up">
        <SectionHeading
          eyebrow="Đơn giản &amp; Nhanh chóng"
          title={
            <>
              Tạo thiệp cưới online chỉ trong{" "}
              <span className="font-signature font-bold text-zen-primary text-4xl sm:text-5xl lg:text-6xl">
                10 phút
              </span>
            </>
          }
          description="Quy trình 3 bước trực quan giúp bất kỳ ai cũng có thể tự tay tạo nên tấm thiệp cưới hoàn hảo mà không cần kỹ năng thiết kế."
        />
      </AnimateOnScroll>

      {/* Responsive layout: Steps + Video */}
      <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        {/* Steps Column */}
        <div className="space-y-4 sm:space-y-5">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <AnimateOnScroll
                key={item.step}
                animation="fade-up"
                delay={index * 120}
              >
                <div className="group relative flex items-start gap-4 sm:gap-5 rounded-2xl sm:rounded-3xl border border-gray-100 bg-[#fafafa]/80 p-5 sm:p-6 transition-all duration-300 hover:bg-white hover:border-rose-100 hover:shadow-[0_12px_32px_rgba(229,65,83,0.06)] hover:-translate-y-0.5">
                  {/* Step Number & Icon */}
                  <div className="flex size-13 sm:size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100/70 text-zen-primary shadow-2xs group-hover:scale-105 transition-transform">
                    <Icon className="size-6 text-zen-primary" />
                    <span className="text-[10px] font-black tracking-widest text-zen-primary/70 uppercase mt-0.5">
                      {item.step}
                    </span>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-heading text-lg sm:text-xl font-bold text-gray-900 group-hover:text-zen-primary transition-colors">
                        {item.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-zen-primary">
                        <Check className="size-3" />
                        {item.highlight}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>

        {/* Video Card (Unified Responsive) */}
        <AnimateOnScroll animation="fade-left" delay={200} className="flex justify-center">
          <div className="relative w-full max-w-[340px] sm:max-w-[380px]">
            {/* Decorative background glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-rose-400/20 via-pink-400/20 to-amber-300/20 rounded-[2.5rem] blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />

            <div className="relative aspect-[9/16] max-h-[520px] w-full overflow-hidden rounded-[2rem] border-4 border-white bg-slate-900 shadow-2xl">
              <Image
                src="/assets/landing/thumbnai-10min-home.webp"
                alt="Video hướng dẫn tạo thiệp cưới trên ZenLove"
                fill
                sizes="(max-width: 768px) 340px, 380px"
                className="object-cover transition-transform duration-700 hover:scale-105"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

              {/* Play Button Trigger */}
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className="group/btn absolute inset-0 flex flex-col items-center justify-center p-6 text-center focus:outline-none cursor-pointer"
                aria-label="Phát video hướng dẫn"
              >
                <div className="flex size-16 sm:size-18 items-center justify-center rounded-full bg-white/95 text-zen-primary shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300 group-hover/btn:scale-115 group-hover/btn:bg-white group-hover/btn:shadow-[0_12px_40px_rgba(229,65,83,0.5)]">
                  <Play className="size-7 fill-current ml-1 text-zen-primary" />
                </div>
                <div className="mt-4 text-white">
                  <p className="text-sm sm:text-base font-bold drop-shadow-md">
                    Xem video hướng dẫn thực tế
                  </p>
                  <p className="text-xs text-white/80 mt-1">
                    Thời lượng: 3 phút · Thao tác chi tiết
                  </p>
                </div>
              </button>
            </div>
          </div>
        </AnimateOnScroll>
      </div>

      {/* Action Buttons */}
      <AnimateOnScroll animation="fade-up" delay={300}>
        <div className="mt-12 text-center flex flex-col items-center justify-center gap-2">
          <Link
            className="group inline-flex items-center gap-2 bg-zen-primary hover:bg-[#d93849] text-white px-9 py-3.5 rounded-full font-bold shadow-[0_10px_28px_rgba(229,65,83,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(229,65,83,0.4)]"
            title="Bắt đầu tạo thiệp cưới online ngay trên Zenlove"
            aria-label="Bắt đầu tạo thiệp cưới online ngay trên Zenlove"
            href="/templates"
          >
            <span>Bắt đầu tạo thiệp của bạn</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            className="text-xs sm:text-sm text-gray-500 hover:text-zen-primary transition-colors underline-offset-4 hover:underline mt-1"
            title="Xem bài viết cẩm nang hướng dẫn chi tiết"
            href="/tao-thiep-cuoi-online"
          >
            Đọc bài viết hướng dẫn chi tiết từng bước →
          </Link>
        </div>
      </AnimateOnScroll>

      {/* Video Modal */}
      {videoOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-3xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-scale-up">
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-4 right-4 z-20 text-white bg-black/60 hover:bg-black/90 rounded-full p-2.5 transition-colors cursor-pointer"
              aria-label="Đóng video"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src="https://www.youtube.com/embed/X1Hsga9kzDQ?autoplay=1"
              title="Hướng dẫn tạo thiệp cưới ZenLove"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </Section>
  );
}
