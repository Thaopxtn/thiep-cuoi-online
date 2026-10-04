import React from "react";

export default function FeaturesSection() {
  const features = [
    {
      title: "Thiết kế kéo thả nhanh chóng",
      desc: "Chỉ cần vài thao tác đơn giản, dễ dàng chỉnh sửa thông tin bạn có thể tạo và gửi thiệp cưới ngay lập tức mà không mất thời gian chờ đợi in ấn.",
    },
    {
      title: "Quản lý số lượng khách mời",
      desc: "Sau khi chia sẻ thiệp Online đến khách mời, các phản hồi tham dự và lời chúc sẽ được ghi nhận đẩy đủ dưới dạng danh sách.",
    },
    {
      title: "Đa dạng các mẫu thiệp online",
      desc: "Các thiết kế thiệp Online của ZenLove được cập nhật liên tục với nhiều lựa chọn khác nhau về phong cách và màu sắc.",
    },
    {
      title: "Dễ dàng chia sẻ trực tuyến",
      desc: "Gửi thiệp Online đến từng khách mời bất kể thời gian và khoảng cách địa lý bằng cách chia sẻ một đường liên kết đơn giản.",
    },
  ];

  return (
    <section
      id="features"
      className="pt-6 py-12 bg-white"
      role="region"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl mx-auto px-2 md:px-0">
        <h2 id="features-heading" className="sr-only">
          Tính năng nổi bật của ZenLove
        </h2>
        <ul
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-2 md:px-8 features-section-list list-none m-0 p-0"
          aria-labelledby="features-heading"
        >
          {features.map((feature, idx) => (
            <li
              key={idx}
              className="feature-card feature-item bg-white p-4 md:p-6 rounded-lg shadow-sm h-full relative group overflow-hidden border border-gray-100/80"
              tabIndex={0}
              aria-label={`${feature.title}: ${feature.desc}`}
            >
              <div className="relative" style={{ zIndex: 1 }}>
                <h3 className="text-base md:text-xl mb-2 md:mb-3 leading-tight font-heading text-gray-900 font-bold">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base leading-relaxed text-gray-700">
                  {feature.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
