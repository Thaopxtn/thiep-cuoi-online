"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ArcCarousel from "./ArcCarousel";

interface TemplateCarouselItem {
  id: string;
  name: string;
  image: string;
  slug: string;
}

const TEMPLATE_ITEMS: TemplateCarouselItem[] = [
  {
    id: "son-duyen",
    name: "Son Duyên",
    image:
      "https://cdn-resource.zenlove.me/templates/4e91a4ea-9e62-43d8-bf37-34e2eef30e2e/long_4e91a4ea-9e62-43d8-bf37-34e2eef30e2e.webp?format=webp&quality=80",
    slug: "son-duyen",
  },
  {
    id: "green-love",
    name: "Green Love",
    image:
      "https://cdn-resource.zenlove.me/templates/c8f12a36-7810-4495-bc81-74dbb5a24804/long_c8f12a36-7810-4495-bc81-74dbb5a24804.webp?format=webp&quality=80",
    slug: "green-love",
  },
  {
    id: "sen-ngay-hy",
    name: "Sen Ngày Hỷ",
    image:
      "https://cdn-resource.zenlove.me/templates/a9195353-7ba5-4a2b-9611-5868025d3f02/long_a9195353-7ba5-4a2b-9611-5868025d3f02.webp?format=webp&quality=80",
    slug: "sen-ngay-hy",
  },
  {
    id: "hen-uoc",
    name: "Hẹn Ước",
    image:
      "https://cdn-resource.zenlove.me/templates/4ec76647-a5ef-4f58-8160-d20febb9e84a/long_4ec76647-a5ef-4f58-8160-d20febb9e84a.webp?format=webp&quality=80",
    slug: "hen-uoc",
  },
  {
    id: "hong-phong",
    name: "Hồng Phong",
    image:
      "https://cdn-resource.zenlove.me/templates/8c5055d8-30db-4b38-8831-e11063e3d352/long_8c5055d8-30db-4b38-8831-e11063e3d352.webp?format=webp&quality=80",
    slug: "hong-phong",
  },
  {
    id: "moc-am",
    name: "Mộc Ấm",
    image:
      "https://cdn-resource.zenlove.me/templates/1f422dc5-7795-48c4-8e1a-48cc8421dbc3/long_1f422dc5-7795-48c4-8e1a-48cc8421dbc3.webp?format=webp&quality=80",
    slug: "moc-am",
  },
  {
    id: "dong-xanh",
    name: "Đồng Xanh",
    image:
      "https://cdn-resource.zenlove.me/templates/24d88c9e-159b-4888-9c77-c3ed775035b6/long_24d88c9e-159b-4888-9c77-c3ed775035b6.webp?format=webp&quality=80",
    slug: "dong-xanh",
  },
  {
    id: "net-thuong",
    name: "Nét Thương",
    image:
      "https://cdn-resource.zenlove.me/templates/de48d917-df7d-4ab9-a553-be6e8fd84c04/long_de48d917-df7d-4ab9-a553-be6e8fd84c04.webp?format=webp&quality=80",
    slug: "net-thuong",
  },
  {
    id: "loi-hen-kem",
    name: "Lời Hẹn Kem",
    image:
      "https://cdn-resource.zenlove.me/templates/3d7badec-67c8-4eb3-90a4-bf96d2948ec8/long_3d7badec-67c8-4eb3-90a4-bf96d2948ec8.webp?format=webp&quality=80",
    slug: "loi-hen-kem",
  },
  {
    id: "sac-cuoi-be",
    name: "Sắc Cưới Be",
    image:
      "https://cdn-resource.zenlove.me/templates/3410d8c2-6141-4c75-8848-445353a884b5/long_3410d8c2-6141-4c75-8848-445353a884b5.webp?format=webp&quality=80",
    slug: "sac-cuoi-be",
  },
  {
    id: "loi-hen-co-dien",
    name: "Lời Hẹn Cổ Điển",
    image:
      "https://cdn-resource.zenlove.me/templates/3b6728a2-bb39-4331-82f6-410eca19f9db/long_3b6728a2-bb39-4331-82f6-410eca19f9db.webp?format=webp&quality=80",
    slug: "loi-hen-co-dien",
  },
  {
    id: "nang-trang-ngoi",
    name: "Nắng Trắng Ngời",
    image:
      "https://cdn-resource.zenlove.me/templates/917772d9-d56c-43ca-b671-12f7023f01ce/long_917772d9-d56c-43ca-b671-12f7023f01ce.jpg?format=webp&quality=80",
    slug: "nang-trang-ngoi",
  },
  {
    id: "trang-tinh-khoi",
    name: "Trắng Tinh Khôi",
    image:
      "https://cdn-resource.zenlove.me/templates/f97f767a-b8c2-438d-80e9-89651095e93e/long_f97f767a-b8c2-438d-80e9-89651095e93e.webp?format=webp&quality=80",
    slug: "trang-tinh-khoi",
  },
  {
    id: "hong-yeu-thuong",
    name: "Hồng Yêu Thương",
    image:
      "https://cdn-resource.zenlove.me/templates/453f372e-5d22-474e-b947-0a833ba1bb66/long_453f372e-5d22-474e-b947-0a833ba1bb66.webp?format=webp&quality=80",
    slug: "hong-yeu-thuong",
  },
  {
    id: "sac-dem-hen",
    name: "Sắc Đêm Hẹn",
    image:
      "https://cdn-resource.zenlove.me/templates/c0031611-6847-4945-b7f5-f98ddaf5f1ee/long_c0031611-6847-4945-b7f5-f98ddaf5f1ee.webp?format=webp&quality=80",
    slug: "sac-dem-hen",
  },
  {
    id: "la-mong-o-liu",
    name: "Lá Mộng Ô Liu",
    image:
      "https://cdn-resource.zenlove.me/templates/c026f536-0230-4d5e-80af-7533f26eed61/long_c026f536-0230-4d5e-80af-7533f26eed61.webp?format=webp&quality=80",
    slug: "la-mong-o-liu",
  },
  {
    id: "khung-may-trang",
    name: "Khung Mây Trắng",
    image:
      "https://cdn-resource.zenlove.me/templates/8b92bbcd-83d7-46d9-b522-8c61042b0342/long_8b92bbcd-83d7-46d9-b522-8c61042b0342.png?format=webp&quality=80",
    slug: "khung-may-trang",
  },
  {
    id: "nang-luu-yeu",
    name: "Nắng Lưu Yêu",
    image:
      "https://cdn-resource.zenlove.me/templates/43498986-ba34-4bcf-857a-0a4caa8d7dcb/long_43498986-ba34-4bcf-857a-0a4caa8d7dcb.webp?format=webp&quality=80",
    slug: "nang-luu-yeu",
  },
  {
    id: "xanh-nhu-loi-hen",
    name: "Xanh Như Lời Hẹn",
    image:
      "https://cdn-resource.zenlove.me/templates/82f29721-5471-4784-b3f8-bee9afa7c790/long_82f29721-5471-4784-b3f8-bee9afa7c790.webp?format=webp&quality=80",
    slug: "xanh-nhu-loi-hen",
  },
  {
    id: "net-chu-tinh-nhan",
    name: "Nét Chữ Tình Nhân",
    image:
      "https://cdn-resource.zenlove.me/templates/b546553f-34a8-4313-a259-a79933725b70/long_b546553f-34a8-4313-a259-a79933725b70.webp?format=webp&quality=80",
    slug: "net-chu-tinh-nhan",
  },
];

export default function TemplatesSection() {
  return (
    <section id="templates" className="bg-[#fbfbfb] py-12">
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="template-animate flex flex-col gap-2 md:gap-0 items-center md:items-start">
            <h2
              id="templates-heading"
              className="text-center md:text-left text-2xl md:text-3xl text-gray-900 uppercase font-heading font-bold"
            >
              Chọn mẫu <br />
              &amp; Tạo thiệp mời của bạn
            </h2>
            <h3 className="sr-only">Các mẫu thiệp cưới online đẹp và miễn phí</h3>
            <h3 className="sr-only">Cá nhân hóa dễ dàng</h3>
            <h3 className="sr-only">Chia sẻ nhanh chóng</h3>
            <p className="text-center md:text-left text-gray-500 max-w-2xl mt-2 text-sm md:text-base">
              Bắt đầu trải nghiệm tự tạo thiệp Online của bạn ngay với nhiều lựa
              chọn phong phú — chọn mẫu, xem trước và tùy chỉnh chỉ trong vài bước.
            </p>
          </div>
        </div>

        {/* 3D Arc Carousel */}
        <div className="template-animate mx-auto mt-6 max-w-[1500px]">
          <ArcCarousel
            items={TEMPLATE_ITEMS}
            label="Mẫu thiệp cưới online"
            cardWidth={210}
            visibleCards={7}
            caption={false}
            renderCard={(item) => (
              <Link
                href="/templates"
                title={`Xem mẫu thiệp cưới ${item.name}`}
                className="group/arc-card block w-full rounded-2xl text-left"
              >
                <span
                  className="relative block overflow-hidden rounded-2xl border border-rose-100 bg-gray-100 shadow-[0_12px_28px_-14px_rgba(0,0,0,0.45)] [aspect-ratio:1000/1470]"
                  style={
                    {
                      "--image-scroll-percent": "40%",
                      "--scroll-duration": "2.8s",
                    } as React.CSSProperties
                  }
                >
                  <img
                    src={item.image}
                    alt={`Mẫu thiệp cưới ${item.name}`}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="h-auto w-full align-top [transform:translate3d(0,0,0)] transition-transform duration-200 ease-out group-hover/arc-card:[transition-duration:var(--scroll-duration)] group-hover/arc-card:[transition-timing-function:ease] motion-safe:group-hover/arc-card:[transform:translate3d(0,calc(var(--image-scroll-percent,0%)*-1),0)]"
                  />
                </span>
              </Link>
            )}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="template-animate flex justify-center mt-8">
            <Link
              className="bg-zen-primary hover:bg-[#d93849] text-white px-10 py-2.5 rounded-full font-medium shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              aria-label="Xem thêm mẫu thiệp"
              href="/templates"
            >
              <span className="font-bold">Xem thêm mẫu thiệp</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
