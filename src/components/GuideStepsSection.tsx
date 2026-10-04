"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutTemplate, Edit3, Send, Play, X, ArrowRight } from "lucide-react";

export default function GuideStepsSection() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <section
      id="create-page-10min"
      className="py-10 md:py-12 bg-white"
      role="region"
      aria-labelledby="create-page-10min-title"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-0">
        <div className="slide-up text-center mb-6 md:mb-12">
          <h2
            id="create-page-10min-title"
            className="text-2xl md:text-4xl text-gray-900 font-heading mb-2"
          >
            Tạo thiệp cưới online trong{" "}
            <span className="text-primary font-signature font-bold text-3xl md:text-5xl">
              10 phút
            </span>
          </h2>
          <p className="text-sm md:text-lg text-gray-500">
            Dễ dàng thao tác · Kho mẫu đa dạng, cập nhật liên tục
          </p>
        </div>

        {/* Mobile Horizontal Stepper */}
        <div className="slide-up md:hidden flex justify-center items-start gap-2 mb-8 px-2">
          <div className="flex flex-col items-center flex-1 relative">
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mb-2 z-10 shadow-sm">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-900 text-center">
              Chọn mẫu
            </span>
            <span className="text-xs text-gray-500 text-center mt-0.5">
              Chọn thiệp yêu thích
            </span>
            <div className="absolute top-5 left-[60%] w-[80%] h-0.5 bg-primary/30"></div>
          </div>
          <div className="flex flex-col items-center flex-1 relative">
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mb-2 z-10 shadow-sm">
              <Edit3 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-900 text-center">
              Tùy chỉnh
            </span>
            <span className="text-xs text-gray-500 text-center mt-0.5">
              Thêm ảnh và nội dung
            </span>
            <div className="absolute top-5 left-[60%] w-[80%] h-0.5 bg-primary/30"></div>
          </div>
          <div className="flex flex-col items-center flex-1 relative">
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mb-2 z-10 shadow-sm">
              <Send className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-900 text-center">
              Gửi thiệp
            </span>
            <span className="text-xs text-gray-500 text-center mt-0.5">
              Gửi qua Zalo, FB
            </span>
          </div>
        </div>

        {/* Desktop Vertical Stepper + Video */}
        <div className="slide-up hidden md:flex md:justify-center gap-12 max-w-4xl mx-auto mb-10">
          <div className="relative flex flex-col justify-between flex-1 max-w-md py-2">
            <div className="absolute top-6 bottom-6 left-6 w-0.5 -translate-x-1/2 bg-primary/20"></div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-primary mb-0.5 uppercase tracking-wider">
                  Bước 1
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-heading">
                  Chọn mẫu
                </h3>
                <p className="text-gray-600 text-sm">
                  Kho mẫu đa dạng, cập nhật liên tục với nhiều chủ đề và phong
                  cách khác nhau.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                <Edit3 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-primary mb-0.5 uppercase tracking-wider">
                  Bước 2
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-heading">
                  Cá nhân hóa
                </h3>
                <p className="text-gray-600 text-sm">
                  Tùy chỉnh ảnh và nội dung dễ dàng với giao diện trực quan, thân
                  thiện với người dùng.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                <Send className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-primary mb-0.5 uppercase tracking-wider">
                  Bước 3
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-heading">
                  Gửi thiệp
                </h3>
                <p className="text-gray-600 text-sm">
                  Chia sẻ qua Zalo, Messenger ngay lập tức mà không cần tải về,
                  đảm bảo thiệp đến tay khách mời nhanh chóng và tiện lợi.
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Video Frame */}
          <div className="w-[300px] shrink-0">
            <div className="relative w-full" style={{ paddingBottom: "177%" }}>
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className="absolute top-0 left-0 w-full h-full rounded-2xl shadow-xl group overflow-hidden bg-black focus:outline-none focus:ring-4 focus:ring-primary/25 border-2 border-rose-100"
                aria-label="Phát video: Hướng dẫn tạo thiệp cưới trên ZenLove"
              >
                <img
                  src="/assets/landing/thumbnai-10min-home.webp"
                  alt="Hướng dẫn tạo thiệp cưới trên ZenLove"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10"></span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-primary shadow-xl transition-transform group-hover:scale-110">
                    <Play className="w-6 h-6 fill-current ml-0.5 text-zen-primary" />
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Video Frame */}
        <div className="slide-up flex justify-center mb-8 md:hidden">
          <div className="w-full max-w-[280px]">
            <div className="relative w-full" style={{ paddingBottom: "177%" }}>
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className="absolute top-0 left-0 w-full h-full rounded-xl shadow-lg group overflow-hidden bg-black focus:outline-none focus:ring-4 focus:ring-primary/25"
                aria-label="Phát video hướng dẫn"
              >
                <img
                  src="/assets/landing/thumbnai-10min-home.webp"
                  alt="Hướng dẫn tạo thiệp cưới"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-black/20"></span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg">
                    <Play className="w-5 h-5 fill-current ml-0.5 text-zen-primary" />
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="slide-up text-center">
          <Link
            className="inline-flex items-center gap-1.5 !bg-zen-primary text-white hover:text-white px-8 py-3 rounded-full font-bold shadow-md transition-all duration-300 hover:scale-105 hover:bg-[#d93849]"
            title="Tạo thiệp cưới online ngay trên Zenlove"
            aria-label="Tạo thiệp cưới online ngay trên Zenlove"
            href="/templates"
          >
            <span>Bắt đầu tạo thiệp</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>

        <div className="text-center mt-2.5">
          <a
            className="text-sm text-gray-500 italic hover:text-primary transition-colors underline-offset-4 hover:underline"
            title="Xem hướng dẫn chi tiết tạo thiệp trên ZenLove"
            aria-label="Xem hướng dẫn chi tiết tạo thiệp trên ZenLove"
            href="#faq"
          >
            Xem hướng dẫn chi tiết
          </a>
        </div>
      </div>

      {/* Video Modal */}
      {videoOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-4 right-4 z-20 text-white bg-black/50 hover:bg-black/80 rounded-full p-2"
              aria-label="Đóng video"
            >
              <X className="w-6 h-6" />
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
    </section>
  );
}
