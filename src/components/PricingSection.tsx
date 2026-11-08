"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import {
  Check,
  Sparkles,
  Crown,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export default function PricingSection() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const faqId = useId();

  const toggleFaq = (index: number) => {
    setActiveFaq((active) => active === index ? null : index);
  };

  const pricingFaqs = [
    {
      q: "Gói VIP thanh toán một lần là dùng được bao lâu?",
      a: "Bạn chỉ cần thanh toán một lần duy nhất 99.000đ, thiệp cưới của bạn sẽ được lưu trữ vĩnh viễn trên hệ thống và không bao giờ bị khóa hay hết hạn.",
    },
    {
      q: "Kích hoạt gói VIP qua VietQR có tự động không?",
      a: "Có! Hệ thống tích hợp Napas VietQR 24/7, tự động kiểm tra biến động số dư và kích hoạt gói VIP cho thiệp của bạn chỉ sau 10 - 30 giây kể từ khi chuyển khoản thành công.",
    },
    {
      q: "Khách mừng cưới qua VietQR thì tiền về đâu?",
      a: "Tiền mừng cưới sẽ chuyển thẳng trực tiếp 100% vào số tài khoản ngân hàng cá nhân của cô dâu chú rể. ZenLove không giữ tiền và không thu bất kỳ phí giao dịch nào.",
    },
    {
      q: "Tôi có thể chỉnh sửa lại thông tin sau khi đã thanh toán VIP không?",
      a: "Hoàn toàn được! Bạn có thể thay đổi ảnh cưới, giờ giấc, địa điểm hay danh sách khách mời bất kỳ lúc nào mà không phát sinh thêm bất cứ chi phí nào.",
    },
  ];

  return (
    <Section id="pricing" bg="white" padding="lg" ariaLabel="Bảng giá dịch vụ">
      <AnimateOnScroll animation="fade-up">
        <SectionHeading
          eyebrow="Bảng giá minh bạch · Không phụ phí ẩn"
          title={
            <>
              Chi phí nhỏ cho niềm vui
              <span className="mt-2 block font-signature text-4xl font-bold text-zen-primary sm:text-5xl lg:text-6xl">
                trọn vẹn ngày chung đôi
              </span>
            </>
          }
          description="Tạo thiệp hoàn toàn miễn phí hoặc nâng cấp gói VIP chỉ với 99.000đ để sở hữu toàn bộ tính năng cao cấp không giới hạn."
        />
      </AnimateOnScroll>

      {/* Pricing Cards Grid */}
      <div className="mt-14 grid gap-8 lg:grid-cols-3 lg:items-stretch max-w-7xl mx-auto">
        {/* Tier 1: Gói Cơ Bản (0đ) */}
        <AnimateOnScroll animation="fade-up" delay={50} className="h-full">
          <div className="h-full rounded-[2.25rem] border border-gray-200/90 bg-white p-7 sm:p-9 shadow-[0_12px_36px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_45px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <span>Trải nghiệm cơ bản</span>
              </div>
              <h3 className="mt-4 font-heading text-2xl font-bold text-gray-900">
                Gói Miễn Phí
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Tự do sáng tạo thiệp cưới online và chia sẻ với bạn bè mà không tốn một đồng chi phí nào.
              </p>

              {/* Price */}
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                  0đ
                </span>
                <span className="text-sm font-semibold text-gray-500">
                  / vĩnh viễn
                </span>
              </div>

              {/* Features List */}
              <div className="mt-8 pt-6 border-t border-gray-100 space-y-3.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Bao gồm tính năng:
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Kho 200+ mẫu thiệp cưới phong cách đa dạng</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Mở phong bì hoàng gia &amp; dấu sáp niêm phong 3D</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Đếm ngược ngày cưới &amp; Lịch ngày cưới</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Chỉ đường Google Maps dẫn tận nơi tổ chức</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Nhạc nền đám cưới lãng mạn du dương</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Chia sẻ không giới hạn qua Zalo, Facebook</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-gray-400">
                    <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5">✕</span>
                    <span className="line-through">Có logo thương hiệu ZenLove chân trang</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-9 pt-4">
              <Link
                href="/templates"
                className="zen-button zen-button-secondary w-full"
              >
                <span>Bắt đầu tạo miễn phí</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </AnimateOnScroll>

        {/* Tier 2: Gói VIP Trọn Gói (99K) - POPULAR */}
        <AnimateOnScroll animation="fade-up" delay={150} className="h-full">
          <div className="h-full rounded-[2.25rem] border-2 border-rose-400/90 bg-gradient-to-b from-rose-50/40 via-white to-white p-7 sm:p-9 shadow-[0_20px_50px_rgba(229,65,83,0.14)] relative flex flex-col justify-between z-10">
            {/* Top Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-zen-primary via-rose-500 to-amber-500 text-white text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span>Đầy đủ tính năng</span>
            </div>

            <div>
              {/* Header */}
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zen-primary bg-rose-100/80 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trọn gói hoàn hảo</span>
              </div>
              <h3 className="mt-4 font-heading text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>Gói VIP Trọn Đời</span>
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Tận hưởng trọn vẹn đặc quyền chuyên nghiệp, xóa sạch logo và quản lý mừng cưới thông minh.
              </p>

              {/* Price */}
              <div className="mt-6 flex flex-wrap items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-zen-primary tracking-tight">
                  99.000đ
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Chỉ trả 1 lần
                </span>
              </div>

              {/* Features List */}
              <div className="mt-8 pt-6 border-t border-rose-100 space-y-3.5">
                <p className="text-xs font-bold text-zen-primary uppercase tracking-wider">
                  Tất cả tính năng Gói Miễn Phí, cộng thêm:
                </p>
                <ul className="space-y-3 text-sm text-gray-800">
                  <li className="flex items-start gap-2.5 font-semibold text-gray-900">
                    <Check className="w-4 h-4 text-zen-primary shrink-0 mt-0.5" />
                    <span>XÓA HOÀN TOÀN logo bản quyền ZenLove</span>
                  </li>
                  <li className="flex items-start gap-2.5 font-semibold text-gray-900">
                    <Check className="w-4 h-4 text-zen-primary shrink-0 mt-0.5" />
                    <span>Hộp mừng cưới VietQR chuẩn Napas 24/7 (Tiền về thẳng STK của bạn)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Quản lý khách mời RSVP thời gian thực (Xác nhận đi/không, số người)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Cá nhân hóa lời mời 1 chạm Zalo cho từng người thân, bạn bè</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Tải ảnh thiệp cưới 4K &amp; Story 9:16 chia sẻ Zalo/Facebook</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Sổ lưu bút lời chúc &amp; Sổ mừng cưới trực tuyến</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Hiệu ứng điện ảnh: Cánh hoa rơi, bướm bay, pháo hoa lung linh</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Kích hoạt tự động ngay sau 10 giây qua VietQR</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-9 pt-4">
              <Link
                href="/templates"
                className="zen-button zen-button-primary w-full"
              >
                <span>Tạo thiệp &amp; Mở khóa VIP</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </AnimateOnScroll>

        {/* Tier 3: Gói Thiết Kế Riêng Theo Yêu Cầu (299K) */}
        <AnimateOnScroll animation="fade-up" delay={250} className="h-full">
          <div className="h-full rounded-[2.25rem] border border-gray-200/90 bg-white p-7 sm:p-9 shadow-[0_12px_36px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_45px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full">
                <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                <span>Thiết kế riêng A-Z</span>
              </div>
              <h3 className="mt-4 font-heading text-2xl font-bold text-gray-900">
                Gói Thiết Kế Hộ
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Đội ngũ chuyên viên ZenLove thiết kế trọn gói theo thông tin và hình ảnh bạn gửi, bàn giao trong 24 giờ.
              </p>

              {/* Price */}
              <div className="mt-6 flex flex-wrap items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                  299.000đ
                </span>
                <span className="text-sm line-through text-gray-400">
                  599.000đ
                </span>
                <span className="text-xs font-bold text-gray-500">
                  / trọn gói
                </span>
              </div>

              {/* Features List */}
              <div className="mt-8 pt-6 border-t border-gray-100 space-y-3.5">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Bao gồm toàn bộ Gói VIP, cộng thêm:
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2.5 font-semibold text-gray-900">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Chuyên viên thiết kế trọn gói từ A-Z theo yêu cầu</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Cắt ghép, tách nền AI &amp; chỉnh tone màu ảnh cưới</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Viết nội dung Câu chuyện tình yêu (Love Story) cảm xúc</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Bàn giao đường link thiệp hoàn chỉnh trong vòng 24 giờ</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Chỉnh sửa không giới hạn số lần cho đến ngày cưới</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Hỗ trợ 1-kèm-1 qua Zalo riêng bất cứ khi nào bạn cần</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-9 pt-4">
              <a
                href="https://zalo.me/0823312212"
                target="_blank"
                rel="noopener noreferrer"
                className="zen-button zen-button-secondary w-full"
              >
                <MessageCircle className="w-4 h-4 text-amber-700" />
                <span>Nhắn tin Zalo đặt thiết kế</span>
              </a>
            </div>
          </div>
        </AnimateOnScroll>
      </div>

      {/* Trust & Guarantee Banner */}
      <AnimateOnScroll animation="fade-up" delay={200} className="mt-14 max-w-4xl mx-auto">
        <div className="rounded-3xl bg-rose-50/70 border border-rose-100 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-zen-primary shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-gray-900">
                Hỗ trợ tạo thiệp và thanh toán
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Nếu bạn gặp bất kỳ khó khăn nào trong quá trình tạo thiệp hoặc thanh toán, đội ngũ ZenLove luôn sẵn sàng hỗ trợ trực tiếp qua Zalo <strong>0823.312.212</strong>.
              </p>
            </div>
          </div>
          <a
            href="https://zalo.me/0823312212"
            target="_blank"
            rel="noopener noreferrer"
            className="zen-button zen-button-secondary shrink-0"
          >
            <span>Nhắn Zalo ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </AnimateOnScroll>

      {/* Pricing FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h3 className="font-heading text-xl font-bold text-center text-gray-900 mb-6 flex items-center justify-center gap-2">
          <HelpCircle className="w-5 h-5 text-zen-primary" />
          <span>Câu hỏi thường gặp về gói dịch vụ</span>
        </h3>
        <div className="space-y-3">
          {pricingFaqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-2xl bg-white overflow-hidden transition-colors"
            >
              <h4>
                <button
                  type="button"
                  id={`${faqId}-question-${idx}`}
                  aria-expanded={activeFaq === idx}
                  aria-controls={`${faqId}-answer-${idx}`}
                  onClick={() => toggleFaq(idx)}
                  className="w-full min-h-11 p-5 text-left font-bold text-sm sm:text-base text-gray-900 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50"
                >
                  <span>{faq.q}</span>
                  <span aria-hidden="true" className="text-gray-600 text-lg shrink-0">
                    {activeFaq === idx ? "−" : "+"}
                  </span>
                </button>
              </h4>
              <div
                id={`${faqId}-answer-${idx}`}
                role="region"
                aria-labelledby={`${faqId}-question-${idx}`}
                hidden={activeFaq !== idx}
                className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3"
              >
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
