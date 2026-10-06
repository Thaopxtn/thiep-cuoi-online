"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ArrowRight,
  Play,
  X,
  CheckCircle,
  Gift,
  Palette,
  Clock,
  ShieldCheck,
  ChevronDown,
  Eye,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/FloatingSupport";
import ZenlovePreviewModal from "@/components/templates/ZenlovePreviewModal";
import { ZENLOVE_TEMPLATES, ZenLoveTemplate } from "@/data/zenloveTemplates";
import { cloneTemplateToNewCard } from "@/lib/weddingCardService";

interface StepItem {
  number: number;
  title: string;
  desc: string;
  image: string;
  ctaText?: string;
  ctaHref?: string;
}

const STEPS: StepItem[] = [
  {
    number: 1,
    title: "Chọn mẫu thiệp",
    desc: "Khám phá kho mẫu thiệp cưới đa dạng phong cách, phù hợp mọi chủ đề.",
    image: "/assets/cach-tao-thiep-cuoi-online/buoc-1.webp",
    ctaText: "Khám phá mẫu thiệp",
    ctaHref: "/templates",
  },
  {
    number: 2,
    title: "Tùy chỉnh nội dung",
    desc: "Nhập thông tin của bạn: tên cô dâu chú rể, ngày cưới, địa điểm, lời mời...",
    image: "/assets/cach-tao-thiep-cuoi-online/buoc-2.webp",
  },
  {
    number: 3,
    title: "Cá nhân hóa thiết kế",
    desc: "Thay đổi màu sắc, font chữ, hình ảnh, icon... để tạo nên thiệp cưới mang dấu ấn riêng.",
    image: "/assets/cach-tao-thiep-cuoi-online/buoc-3.webp",
  },
  {
    number: 4,
    title: "Xem trước & Lưu lại",
    desc: "Xem trước thiệp với giao diện đẹp mắt trên mọi thiết bị và lưu lại khi bạn hài lòng.",
    image: "/assets/cach-tao-thiep-cuoi-online/buoc-4.webp",
  },
  {
    number: 5,
    title: "Gửi thiệp cho khách mời",
    desc: "Chia sẻ thiệp qua link, Zalo, Facebook, Instagram, Email... dễ dàng.",
    image: "/assets/cach-tao-thiep-cuoi-online/buoc-5.webp",
  },
];

const WHY_CHOOSE_ITEMS = [
  {
    icon: Gift,
    title: "Miễn phí",
    desc: "Tạo và gửi thiệp online hoàn toàn miễn phí.",
  },
  {
    icon: Palette,
    title: "Đẹp & Đa dạng",
    desc: "Hàng trăm mẫu thiệp đẹp, cập nhật liên tục.",
  },
  {
    icon: Clock,
    title: "Nhanh chóng",
    desc: "Tạo thiệp chỉ trong vài phút, tiết kiệm thời gian.",
  },
  {
    icon: ShieldCheck,
    title: "Bảo mật",
    desc: "Thông tin của bạn được bảo mật tuyệt đối.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Có Cần Tạo Và Đăng Nhập Tài Khoản Để Thiết Kế Thiệp Cưới Online Không?",
    a: "Có, bạn cần tạo tài khoản và đăng nhập để có thể thiết kế và lưu trữ thiệp cưới của mình. Việc đăng ký rất đơn giản và hoàn toàn miễn phí. Bạn có thể đăng ký bằng email hoặc tài khoản mạng xã hội.",
  },
  {
    q: "Tạo Thiệp Cưới Online Trên Nền Tảng Của ZenLove Có MIỄN PHÍ Không?",
    a: "Chúng tôi có gói miễn phí với đầy đủ tính năng để tạo thiệp online đẹp và chuyên nghiệp. Bạn có thể tạo, tuỳ chỉnh và chia sẻ thiệp hoàn toàn miễn phí. Ngoài ra, chúng tôi cũng có các gói trả phí với những tính năng nâng cao để đáp ứng nhu cầu đa dạng của người dùng.",
  },
  {
    q: "Khách Mời Có Cần Đăng Nhập Để Xem Thiệp Cưới Không?",
    a: "Không, khách mời không cần đăng nhập hay tạo tài khoản để xem thiệp cưới. Họ chỉ cần click vào link thiệp mà bạn chia sẻ là có thể xem ngay lập tức trên bất kỳ thiết bị nào.",
  },
  {
    q: "Tạo Nhiều Mẫu Thiệp Cưới Trên Một Tài Khoản Có Được Không?",
    a: "Có, bạn có thể tạo nhiều mẫu thiệp cưới khác nhau trên cùng một tài khoản. Hệ thống cho phép bạn lưu trữ và quản lý tất cả các thiết kế của mình một cách dễ dàng.",
  },
  {
    q: "Thiệp đã tạo có thể chỉnh sửa lại sau khi đã tạo link chia sẻ không?",
    a: "Có, bạn có thể chỉnh sửa thiệp bất cứ lúc nào sau khi đã tạo link chia sẻ.",
  },
  {
    q: "Tôi có thể sử dụng công cụ tạo thiệp cưới online của ZenLove trên điện thoại không?",
    a: "Có, công cụ của chúng tôi được thiết kế để hoạt động tốt trên cả máy tính và điện thoại di động. Bạn có thể tạo và chỉnh sửa thiệp cưới trực tiếp từ trình duyệt trên điện thoại của mình.",
  },
  {
    q: "Có hỗ trợ khách hàng nếu tôi gặp khó khăn khi sử dụng công cụ tạo thiệp cưới online không?",
    a: "Có, chúng tôi có đội ngũ hỗ trợ khách hàng sẵn sàng giúp đỡ bạn nếu bạn gặp bất kỳ khó khăn nào khi sử dụng công cụ của chúng tôi. Bạn có thể liên hệ với chúng tôi qua email hoặc chat trực tiếp trên hotline/Zalo để được hỗ trợ nhanh chóng.",
  },
  {
    q: "Tôi có thể thanh toán bằng cách nào?",
    a: "Khi nâng cấp gói dịch vụ hoặc mua các addons bổ trợ chúng tôi sẽ cung cấp mã đơn hàng và thông tin thanh toán qua mã QR chuyển khoản - quét mã bằng app ngân hàng hoặc chuyển khoản thủ công. Đơn hàng sẽ được tự động hoàn thành sau vài giây. Chúng tôi hỗ trợ tất cả các ngân hàng tại Việt Nam và các ví điện tử.",
  },
];

export default function TaoThiepCuoiOnlinePage() {
  const router = useRouter();
  const [videoOpen, setVideoOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ZenLoveTemplate | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleUseTemplate = async (templateId: string) => {
    try {
      const card = await cloneTemplateToNewCard(templateId);
      router.push(`/dashboard/cards/${card.id}/edit`);
    } catch {
      router.push(`/dashboard/cards/new?template=${templateId}`);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // 8 Mẫu thiệp cưới nổi bật nhất
  const featuredTemplates = ZENLOVE_TEMPLATES.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-gray-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Tạo thiệp cưới online</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="min-h-[460px] overflow-hidden bg-gradient-to-b from-rose-50/40 via-white to-transparent">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl text-gray-900 leading-tight font-heading">
                  <span className="block font-signature text-primary text-3xl md:text-4xl mb-1 md:mb-2">
                    Cách tạo
                  </span>
                  <span className="relative inline-block font-bold">
                    thiệp cưới online
                  </span>
                  <span className="block font-signature text-primary text-3xl md:text-4xl mt-2 md:mt-3">
                    chỉ với 5 bước
                  </span>
                </h1>
              </div>

              <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
                Tự tay tạo thiệp cưới đẹp, độc đáo và gửi đến người thân, bạn bè chỉ trong vài phút cùng{" "}
                <span className="text-primary font-semibold">Zenlove.me</span>
              </p>

              <div>
                <Link
                  href="/templates"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-[#d93849] text-white font-semibold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-base"
                  title="Tạo thiệp cưới ngay"
                >
                  <span>Tạo thiệp cưới ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-primary">
                    <CheckCircle className="w-4 h-4 fill-primary text-white" />
                  </div>
                  <span>Dễ dàng thao tác</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-primary">
                    <CheckCircle className="w-4 h-4 fill-primary text-white" />
                  </div>
                  <span>Kho mẫu đa dạng, cập nhật liên tục</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-primary">
                    <CheckCircle className="w-4 h-4 fill-primary text-white" />
                  </div>
                  <span>Gửi thiệp online miễn phí</span>
                </div>
              </div>
            </div>

            {/* Right Video Thumbnail */}
            <div className="w-full md:max-w-[460px] flex-shrink-0">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl border-2 border-rose-100 bg-black group">
                <button
                  type="button"
                  onClick={() => setVideoOpen(true)}
                  className="w-full h-full relative block focus:outline-none focus:ring-4 focus:ring-primary/25"
                  aria-label="Phát video hướng dẫn tạo thiệp cưới"
                >
                  <img
                    src="/assets/cach-tao-thiep-cuoi-online/thumbnail-tao-thiep-cuoi-online-page.webp"
                    alt="Hướng dẫn tạo thiệp cưới trên ZenLove"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/15"></span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-primary shadow-2xl transition-transform group-hover:scale-110">
                      <Play className="w-7 h-7 fill-current ml-1 text-primary" />
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5 Steps Section */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-rose-400 text-2xl">🌿</span>
                <h2 className="text-2xl md:text-4xl font-heading font-bold text-gray-900">
                  5 bước tạo thiệp cưới online
                </h2>
                <span className="text-rose-400 text-2xl">🌿</span>
              </div>
              <p className="text-primary text-3xl font-signature leading-relaxed">
                siêu đơn giản
              </p>
            </div>

            <div className="space-y-12 md:space-y-16">
              {STEPS.map((step, idx) => {
                const isEven = idx % 2 === 1;
                return (
                  <div
                    key={step.number}
                    className="relative rounded-3xl p-4 md:p-8 hover:bg-rose-50/20 transition-colors"
                  >
                    <div
                      className={`flex flex-col ${
                        isEven ? "md:flex-row-reverse" : "md:flex-row"
                      } gap-8 md:gap-12 items-center`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="flex-shrink-0 w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-md">
                            {step.number}
                          </span>
                          <h3 className="font-heading font-bold text-gray-900 text-2xl md:text-3xl">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-gray-600 md:text-lg text-base leading-relaxed pl-14">
                          {step.desc}
                        </p>
                        {step.ctaText && step.ctaHref && (
                          <div className="pl-14 mt-4">
                            <Link
                              href={step.ctaHref}
                              className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline group"
                            >
                              <span>{step.ctaText}</span>
                              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 w-full max-w-lg">
                        <div className="overflow-hidden rounded-2xl shadow-lg border border-gray-100 bg-gray-50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                          <img
                            src={step.image}
                            alt={`Bước ${step.number}: ${step.title}`}
                            title={`Bước ${step.number}: ${step.title}`}
                            className="w-full h-auto object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Templates Grid */}
        <section className="py-14 md:py-20 bg-[#fafafa] border-t border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
                Mẫu thiệp cưới nổi bật
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Khám phá kho mẫu thiệp cưới đa dạng phong cách, phù hợp mọi chủ đề.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-rose-50">
                    <img
                      src={template.imageUrl}
                      alt={template.name}
                      title={`Mẫu thiệp cưới ${template.name}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTemplate(template)}
                        className="w-full max-w-[130px] py-2 px-3 bg-white text-gray-900 text-xs font-semibold rounded-full shadow-lg hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        <span>Xem mẫu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUseTemplate(template.id)}
                        className="w-full max-w-[130px] py-2 px-3 bg-primary text-white text-xs font-semibold rounded-full shadow-lg hover:bg-[#d93849] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Dùng mẫu</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 text-center">
                    <h3 className="font-heading font-bold text-gray-900 text-base truncate">
                      {template.name}
                    </h3>
                    <p className="text-xs text-primary font-medium uppercase tracking-wider mt-0.5">
                      Miễn phí
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold transition-all shadow-sm hover:shadow-md"
              >
                <span>Xem tất cả 20 mẫu thiệp cưới</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Zenlove */}
        <section className="py-14 md:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-3">
                Vì sao nên tạo thiệp cưới tại <span className="text-primary">Zenlove.me</span>?
              </h2>
              <div className="w-12 h-1 bg-rose-400 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
              {WHY_CHOOSE_ITEMS.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={index}
                    className="p-6 rounded-2xl bg-rose-50/30 border border-rose-100/60 hover:bg-rose-50/60 transition-colors"
                  >
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 text-primary flex items-center justify-center shadow-sm">
                      <IconComponent className="w-7 h-7" />
                    </div>
                    <h3 className="font-heading font-bold text-gray-900 text-lg mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-14 md:py-20 bg-[#fafafa]">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-3">
                Câu hỏi thường gặp
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Giải đáp mọi thắc mắc của bạn về việc tạo và gửi thiệp cưới online
              </p>
            </div>

            <div className="space-y-3.5">
              {FAQ_ITEMS.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="border border-gray-200 bg-white rounded-2xl overflow-hidden transition-all duration-200 shadow-sm hover:border-rose-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-5 text-left font-medium text-gray-900 hover:text-primary transition-colors focus:outline-none"
                    >
                      <span className="font-heading font-semibold text-base md:text-lg pr-4">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm md:text-base text-gray-600 leading-relaxed border-t border-gray-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-6xl mx-auto px-4 mt-12 md:mt-16">
          <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-rose-100/80 rounded-3xl p-8 md:p-12 border border-rose-200/60 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
                Bắt đầu tạo thiệp cưới của bạn ngay hôm nay!
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Đơn giản – Nhanh chóng – Đẹp như mơ
              </p>
            </div>

            <Link
              href="/templates"
              className="bg-primary hover:bg-[#d93849] text-white font-semibold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-base whitespace-nowrap shrink-0"
              title="Tạo thiệp cưới online tại ZenLove"
            >
              Tạo thiệp cưới miễn phí →
            </Link>
          </div>
        </section>
      </main>

      {/* Video Modal */}
      {videoOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-4 right-4 z-20 text-white bg-black/60 hover:bg-black/90 rounded-full p-2 transition-colors"
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

      {/* Template Preview Modal */}
      {previewTemplate && (
        <ZenlovePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUse={(id) => handleUseTemplate(id)}
        />
      )}

      <Footer />
      <FloatingSupport />
    </div>
  );
}
