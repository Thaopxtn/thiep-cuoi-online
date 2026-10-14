import { ClipboardCheck, ImagePlus, Link2, UsersRound } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const benefits = [
  {
    icon: ImagePlus,
    title: "Chọn mẫu nhanh",
    description: "Lọc theo dịp, phong cách và tone màu để tìm đúng mẫu ngay từ lần đầu.",
  },
  {
    icon: ClipboardCheck,
    title: "Tùy chỉnh rõ ràng",
    description: "Thêm ảnh, nội dung và lịch trình trong một không gian chỉnh sửa trực quan.",
  },
  {
    icon: Link2,
    title: "Gửi bằng một link",
    description: "Chia sẻ thiệp qua Zalo, Messenger hoặc bất kỳ kênh nào bạn đang dùng.",
  },
  {
    icon: UsersRound,
    title: "Theo dõi phản hồi",
    description: "Biết ai đã xác nhận, nhận lời chúc và quản lý khách mời trong cùng một nơi.",
  },
];

const frictionPoints = [
  {
    title: "Mất thời gian gửi từng thiệp",
    description: "Một đường link giúp bạn gửi lời mời đến nhiều người mà vẫn giữ được sự chỉn chu.",
  },
  {
    title: "Khó theo dõi khách tham dự",
    description: "RSVP và lời chúc được gom thành danh sách dễ xem, dễ cập nhật.",
  },
  {
    title: "Thiếu không gian để kể câu chuyện",
    description: "Ảnh, lịch trình, bản đồ và lời nhắn được sắp xếp thành một trải nghiệm liền mạch.",
  },
];

export default function BenefitsSection() {
  return (
    <section id="solution" className="bg-[#fffaf8] py-16 sm:py-20" aria-labelledby="benefits-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Mọi thứ trong một nơi"
          title={
            <>
              Từ lời mời đầu tiên đến danh sách khách tham dự
              <span className="mt-2 block font-signature text-4xl font-bold text-zen-primary sm:text-5xl">
                đều nhẹ nhàng hơn
              </span>
            </>
          }
          description="ZenLove giúp bạn tạo một tấm thiệp có cá tính, gửi đi nhanh và vẫn nắm được những gì đang diễn ra sau khi chia sẻ."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="rounded-[2rem] border border-rose-100 bg-white p-6 shadow-[0_16px_45px_rgba(123,45,54,0.08)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Bạn đang chuẩn bị</p>
            <h3 className="mt-3 max-w-sm font-heading text-2xl leading-tight text-gray-900 sm:text-3xl">
              Một ngày vui xứng đáng có một lời mời thật riêng.
            </h3>
            <div className="mt-8 space-y-3">
              {frictionPoints.map((point, index) => (
                <div key={point.title} className="flex gap-3 rounded-2xl bg-[#fff6f3] p-4">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-zen-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{point.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="features" className="grid gap-3 sm:grid-cols-2">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1 sm:p-6"
              >
                <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-zen-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-heading text-xl text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
