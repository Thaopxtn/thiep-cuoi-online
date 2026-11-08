"use client";

import { useState } from "react";
import { ChevronDown, Send } from "lucide-react";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      id: "faq-question-1",
      question: "ZenLove là gì và hoạt động như thế nào?",
      answer: [
        "ZenLove là nền tảng công nghệ tạo thiệp cưới online độc lập, sang trọng và hoàn toàn miễn phí.",
        "Bạn chỉ cần chọn mẫu ưng ý, cá nhân hóa hình ảnh cô dâu chú rể, địa điểm và lịch trình rồi nhận ngay một đường link chuyên nghiệp để gửi đến khách mời qua Zalo, Messenger, Facebook.",
      ],
    },
    {
      id: "faq-question-2",
      question: "Tạo thiệp cưới online trên ZenLove có thực sự MIỄN PHÍ không?",
      answer: [
        "Hoàn toàn MIỄN PHÍ 100% với gói cơ bản đầy đủ tính năng: thiết kế trực quan, hiệu ứng mở phong bì hoàng gia, đồng hồ đếm ngược, bản đồ Google Maps và hộp mừng cưới VietQR.",
        "Bạn chỉ trả phí khi có nhu cầu nâng cấp các gói cao cấp như tên miền thương hiệu riêng hoặc hiệu ứng đặc biệt độc quyền.",
      ],
    },
    {
      id: "faq-question-3",
      question: "Tôi có cần tạo tài khoản để thiết kế thiệp cưới không?",
      answer: [
        "Có, việc đăng ký tài khoản chỉ mất 5 giây thông qua Đăng nhập Google.",
        "Tài khoản giúp bạn lưu trữ bản vẽ, tự động sao lưu đám mây an toàn, chỉnh sửa nội dung bất cứ lúc nào và quản lý danh sách khách mời RSVP thời gian thực.",
      ],
    },
    {
      id: "faq-question-4",
      question: "Khách mời có cần tải app hay đăng nhập để xem thiệp không?",
      answer: [
        "Hoàn toàn không. Khách mời chỉ cần nhấn vào đường link bạn gửi để mở thiệp ngay lập tức trên mọi trình duyệt (Safari, Chrome, Zalo webview, Messenger webview) với tốc độ tải trang cực nhanh dưới 1 giây.",
      ],
    },
    {
      id: "faq-question-5",
      question: "Tính năng mừng cưới qua VietQR hoạt động ra sao?",
      answer: [
        "ZenLove hỗ trợ tích hợp mã VietQR chuẩn Napas 24/7 của mọi ngân hàng Việt Nam.",
        "Khách mời có thể quét mã trực tiếp trên màn hình để chuyển khoản thẳng vào tài khoản của cô dâu / chú rể. ZenLove không can thiệp, không thu bất kỳ khoản phí giao dịch nào.",
      ],
    },
    {
      id: "faq-question-6",
      question: "Thông tin cá nhân và hình ảnh cưới có được bảo mật không?",
      answer: [
        "ZenLove cam kết bảo mật thông tin theo tiêu chuẩn hiện đại. Dữ liệu của bạn được mã hóa và lưu trữ an toàn trên hạ tầng đám mây cao cấp.",
        "Chúng tôi tuyệt đối không chia sẻ thông tin khách mời hay số điện thoại cho bất kỳ bên thứ ba nào.",
      ],
    },
    {
      id: "faq-question-7",
      question: "Tôi có thể xuất danh sách khách xác nhận tham dự (RSVP) ra Excel không?",
      answer: [
        "Có! Bảng điều khiển (Dashboard) của ZenLove cho phép bạn theo dõi trực tiếp ai đi một mình, ai đi cùng người thân, lời chúc của khách và xuất toàn bộ danh sách ra file Excel (CSV chuẩn tiếng Việt UTF-8) chỉ với 1 click.",
      ],
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <Section
      id="faq"
      bg="white"
      padding="lg"
      ariaLabel="Câu hỏi thường gặp"
    >
      <AnimateOnScroll animation="fade-up">
        <SectionHeading
          eyebrow="Giải đáp thắc mắc"
          title="Câu hỏi thường gặp"
          description="Mọi thắc mắc về tạo thiệp cưới, gửi link, xác nhận tham dự và hộp mừng cưới VietQR đều được giải đáp chi tiết tại đây."
        />
      </AnimateOnScroll>

      <div className="mt-12 max-w-3xl mx-auto space-y-3.5">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <AnimateOnScroll
              key={faq.id}
              animation="fade-up"
              delay={idx * 50}
            >
              <div
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "border-rose-200/90 bg-rose-50/20 shadow-[0_8px_24px_rgba(229,65,83,0.06)]"
                    : "border-gray-100 bg-[#fafafa]/60 hover:border-gray-200 hover:bg-white"
                }`}
              >
                <h3>
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left group cursor-pointer"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={faq.id}
                >
                  <span
                    className={`text-sm sm:text-base leading-snug font-semibold transition-colors duration-200 ${
                      isOpen ? "text-zen-primary" : "text-gray-900 group-hover:text-zen-primary"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <span
                    className={`shrink-0 inline-flex items-center justify-center size-8 rounded-full transition-all duration-300 ${
                      isOpen
                        ? "bg-zen-primary text-white rotate-180 shadow-xs"
                        : "bg-gray-100 text-gray-500 group-hover:bg-rose-50 group-hover:text-zen-primary"
                    }`}
                    aria-hidden="true"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>
                </h3>

                <div
                  id={`faq-answer-${idx}`}
                  aria-labelledby={faq.id}
                  aria-hidden={!isOpen}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                  role="region"
                >
                  <div className="overflow-hidden">
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 border-t border-rose-100/50">
                      <div className="space-y-2 mt-3">
                        {faq.answer.map((para, pIdx) => (
                          <p
                            key={pIdx}
                            className="text-sm leading-relaxed text-gray-600 m-0"
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          );
        })}
      </div>

      {/* Support Action */}
      <AnimateOnScroll animation="fade-up" delay={300}>
        <div className="text-center mt-12 pt-8 border-t border-gray-100 max-w-xl mx-auto">
          <p className="text-sm text-gray-600 mb-3.5">
            Bạn có câu hỏi riêng hoặc cần hỗ trợ tạo thiệp trọn gói?
          </p>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-800 shadow-2xs transition-all duration-200 hover:border-zen-primary/50 hover:bg-rose-50/50 hover:text-zen-primary hover:-translate-y-0.5"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Liên hệ hỗ trợ qua Facebook"
            href="https://fb.com/zenlove.me"
          >
            <span>Nhắn tin tư vấn với ZenLove</span>
            <Send className="w-3.5 h-3.5 text-zen-primary" />
          </a>
        </div>
      </AnimateOnScroll>
    </Section>
  );
}
