"use client";

import { useState } from "react";
import { ChevronDown, Send } from "lucide-react";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      id: "faq-question-1",
      question: "ZenLove là gì?",
      answer: [
        "ZenLove là nền tảng tạo thiệp cưới online miễn phí, hiện đại và tinh tế.",
        "Bạn có thể tạo thiệp cưới online miễn phí với hàng trăm mẫu đẹp tại ZenLove chỉ với vài bước cơ bản.",
        "Thiết kế tinh tế, hiện đại, dễ tùy chỉnh và chia sẻ ngay lập tức.",
      ],
    },
    {
      id: "faq-question-2",
      question: "Tạo Thiệp Cưới Online Trên Nền Tảng Của ZenLove Có MIỄN PHÍ Không?",
      answer: [
        "Chúng tôi có gói miễn phí với đầy đủ tính năng để tạo thiệp online đẹp và chuyên nghiệp.",
        "Bạn có thể tạo, tuỳ chỉnh và chia sẻ thiệp hoàn toàn miễn phí.",
        "Ngoài ra, chúng tôi cũng có các gói trả phí với những tính năng nâng cao để đáp ứng nhu cầu đa dạng của người dùng.",
      ],
    },
    {
      id: "faq-question-3",
      question: "Có Cần Tạo Và Đăng Nhập Tài Khoản Để Thiết Kế Thiệp Cưới Online Không?",
      answer: [
        "Có, bạn cần tạo tài khoản và đăng nhập để có thể thiết kế và lưu trữ thiệp cưới của mình.",
        "Việc đăng ký rất đơn giản và hoàn toàn miễn phí.",
        "Bạn có thể đăng ký bằng email hoặc tài khoản mạng xã hội.",
      ],
    },
    {
      id: "faq-question-4",
      question: "Khách Mời Có Cần Đăng Nhập Để Xem Thiệp Cưới Không?",
      answer: [
        "Không, khách mời không cần đăng nhập hay tạo tài khoản để xem thiệp cưới.",
        "Họ chỉ cần click vào link thiệp mà bạn chia sẻ là có thể xem ngay lập tức trên bất kỳ thiết bị nào.",
      ],
    },
    {
      id: "faq-question-5",
      question: "Tạo Nhiều Mẫu Thiệp Cưới Trên Một Tài Khoản Có Được Không?",
      answer: [
        "Có, bạn có thể tạo nhiều mẫu thiệp cưới khác nhau trên cùng một tài khoản.",
        "Hệ thống cho phép bạn lưu trữ và quản lý tất cả các thiết kế của mình một cách dễ dàng.",
      ],
    },
    {
      id: "faq-question-6",
      question: "Thông Tin Của Người Dùng Và Khách Mời Được Quản Lý Như Thế Nào?",
      answer: [
        "ZenLove cam kết bảo mật thông tin người dùng theo tiêu chuẩn cao nhất.",
        "Tất cả thông tin cá nhân và dữ liệu khách mời được mã hóa và lưu trữ an toàn.",
        "Chúng tôi không chia sẻ thông tin với bên thứ ba mà không có sự đồng ý của bạn.",
      ],
    },
    {
      id: "faq-question-7",
      question: "Khách mời có thể gửi quà mừng qua thiệp không?",
      answer: [
        "Có. ZenLove hỗ trợ hiển thị thông tin nhận tiền mừng hoặc mã QR ngân hàng do người tạo thiệp cung cấp.",
        "Khi khách mời chuyển tiền, giao dịch được thực hiện trực tiếp giữa khách mời và tài khoản nhận tiền do người tạo thiệp cung cấp.",
        "ZenLove không nhận, giữ hoặc chuyển tiền thay cho các bên.",
      ],
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section
      id="faq"
      className="bg-white py-12"
      role="region"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="slide-up text-center mb-6 md:mb-8">
          <h2
            id="faq-heading"
            className="text-2xl md:text-3xl text-zen-black font-heading font-bold"
          >
            CÂU HỎI THƯỜNG GẶP
          </h2>
          <p className="mt-3 text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Mọi thắc mắc về tạo thiệp, gửi thiệp, nhận lời chúc và quản lý khách
            mời trên ZenLove đều được giải đáp tại đây.
          </p>
        </div>

        <div className="slide-up max-w-3xl mx-auto">
          <h3 className="sr-only">Danh mục câu hỏi thường gặp về ZenLove</h3>
          <div className="divide-y divide-gray-100">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div key={faq.id} className="faq-item border-b border-gray-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between gap-4 py-4 md:py-5 text-left group"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    id={faq.id}
                  >
                    <span
                      className={`text-sm md:text-base leading-snug transition-colors duration-200 font-medium ${
                        isOpen ? "text-zen-primary font-bold" : "text-gray-800 group-hover:text-zen-black"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <span
                      className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${
                        isOpen
                          ? "bg-zen-primary/10 text-zen-primary rotate-180"
                          : "bg-gray-100 text-gray-500 group-hover:bg-zen-primary/5 group-hover:text-zen-primary"
                      }`}
                      aria-hidden="true"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${idx}`}
                    aria-labelledby={faq.id}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                    role="region"
                  >
                    <div className="overflow-hidden">
                      <div className="pb-4 md:pb-5 pr-10">
                        <div className="space-y-1.5">
                          {faq.answer.map((para, pIdx) => (
                            <p
                              key={pIdx}
                              className="text-sm md:text-base leading-relaxed text-gray-600 m-0"
                            >
                              {para}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="slide-up text-center mt-10 md:mt-14">
          <p className="text-sm text-gray-500 mb-3">
            Vẫn còn thắc mắc? Zeny luôn sẵn sàng hỗ trợ bạn.
          </p>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-zen-black shadow-sm transition-all duration-200 hover:border-zen-primary/40 hover:bg-zen-primary/5 hover:text-zen-primary hover:-translate-y-0.5"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Liên hệ Zenlove trên Facebook (mở trong tab mới)"
            title="Liên hệ Zenlove trên Facebook"
            href="https://fb.com/zenlove.me"
          >
            <span>Zen ơi, giúp tôi</span>
            <Send className="w-3.5 h-3.5 text-zen-primary" />
          </a>
        </div>
      </div>
    </section>
  );
}
