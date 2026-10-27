import { ClipboardCheck, ImagePlus, Link2, UsersRound, Sparkles } from "lucide-react";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

const benefits = [
  {
    icon: ImagePlus,
    title: "Chọn mẫu nhanh",
    description: "Lọc theo dịp cưới, phong cách Vintage, Hiện đại hay Tối giản và tone màu để tìm đúng mẫu thiệp ưng ý ngay từ lần đầu.",
  },
  {
    icon: ClipboardCheck,
    title: "Tùy chỉnh rõ ràng",
    description: "Thêm ảnh cưới, nội dung hai bên gia đình, lịch trình hôn lễ và bản đồ trong không gian chỉnh sửa trực quan.",
  },
  {
    icon: Link2,
    title: "Gửi bằng một link",
    description: "Chia sẻ thiệp cưới qua Zalo, Messenger hoặc bất kỳ mạng xã hội nào với bản xem trước hình ảnh (OG Image) sang trọng.",
  },
  {
    icon: UsersRound,
    title: "Theo dõi phản hồi",
    description: "Biết ai đã xác nhận tham dự (RSVP), nhận sổ lưu bút chúc mừng và xem chi tiết danh sách khách mời trong bảng điều khiển.",
  },
];

const frictionPoints = [
  {
    title: "Mất thời gian in ấn & gửi từng thiệp",
    description: "Một đường link thông minh giúp bạn gửi lời mời đến hàng trăm khách trong 1 chạm mà vẫn trang trọng, chỉn chu.",
  },
  {
    title: "Khó tổng hợp số lượng khách tham dự",
    description: "Khách xác nhận RSVP trực tiếp, hệ thống tự động gom thành danh sách khoa học, xuất file Excel tức thì.",
  },
  {
    title: "Thiếu không gian để kể câu chuyện tình yêu",
    description: "Album ảnh cưới, timeline tình yêu, bản đồ Google Maps và nhạc nền lãng mạn tạo nên trải nghiệm cảm xúc trọn vẹn.",
  },
];

export default function BenefitsSection() {
  return (
    <Section id="solution" bg="warm" padding="lg" ariaLabel="Lợi ích vượt trội">
      <AnimateOnScroll animation="fade-up">
        <SectionHeading
          eyebrow="Tất cả trong một nền tảng"
          title={
            <>
              Từ lời mời đầu tiên đến danh sách khách tham dự
              <span className="mt-2 block font-signature text-4xl font-bold text-zen-primary sm:text-5xl lg:text-6xl">
                đều nhẹ nhàng &amp; tinh tế hơn
              </span>
            </>
          }
          description="ZenLove giúp bạn kiến tạo một tấm thiệp cưới có câu chuyện riêng, gửi đi nhanh chóng và kiểm soát trọn vẹn mọi phản hồi của khách mời."
        />
      </AnimateOnScroll>

      <div className="mt-14 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
        {/* Left card: Pain points solved */}
        <AnimateOnScroll animation="fade-right" delay={100} className="h-full">
          <div className="h-full rounded-[2.25rem] border border-rose-100/80 bg-white p-7 sm:p-9 shadow-[0_16px_45px_rgba(123,45,54,0.06)] flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-zen-primary bg-rose-50 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Giải pháp hiện đại</span>
              </div>
              <h3 className="mt-4 max-w-sm font-heading text-2xl leading-tight text-gray-900 sm:text-3xl">
                Ngày trọng đại xứng đáng có một lời mời thật riêng.
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Tạm biệt những bối rối thường gặp khi chuẩn bị đám cưới truyền thống.
              </p>
            </div>

            <div className="mt-8 space-y-3.5">
              {frictionPoints.map((point, index) => (
                <div
                  key={point.title}
                  className="group flex gap-3.5 rounded-2xl bg-[#fff7f5] p-4 transition-all duration-300 hover:bg-[#ffefe9] hover:translate-x-1"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-zen-primary group-hover:bg-zen-primary group-hover:text-white transition-colors">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{point.title}</h4>
                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-gray-600">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimateOnScroll>

        {/* Right card grid: Benefits */}
        <div id="features" className="grid gap-4 sm:grid-cols-2">
          {benefits.map(({ icon: Icon, title, description }, index) => (
            <AnimateOnScroll
              key={title}
              animation="fade-up"
              delay={150 + index * 80}
              className="h-full"
            >
              <article className="group h-full flex flex-col justify-between rounded-[1.75rem] border border-gray-100/90 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_36px_rgba(229,65,83,0.09)] hover:border-rose-100">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 text-zen-primary ring-1 ring-rose-100/60 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-5.5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-heading text-xl font-bold text-gray-900 group-hover:text-zen-primary transition-colors">
                    {title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-gray-600">
                    {description}
                  </p>
                </div>
              </article>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </Section>
  );
}
