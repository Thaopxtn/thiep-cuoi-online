"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import ArcCarousel from "./ArcCarousel";
import ZenlovePreviewModal from "@/components/templates/ZenlovePreviewModal";
import { ZENLOVE_TEMPLATES, ZenLoveTemplate } from "@/data/zenloveTemplates";
import { cloneTemplateToNewCard } from "@/lib/weddingCardService";
import { useAuth } from "@/context/AuthContext";

interface TemplateCarouselItem {
  category?: string;
  id: string;
  name: string;
  image: string;
  slug: string;
}

const TEMPLATE_ITEMS: TemplateCarouselItem[] = [
  {
    id: "son-duyen",
    category: "traditional",
    name: "Son Duyên",
    image:
      "https://cdn-resource.zenlove.me/templates/4e91a4ea-9e62-43d8-bf37-34e2eef30e2e/long_4e91a4ea-9e62-43d8-bf37-34e2eef30e2e.webp?format=webp&quality=80",
    slug: "son-duyen",
  },
  {
    id: "green-love",
    category: "modern",
    name: "Green Love",
    image:
      "https://cdn-resource.zenlove.me/templates/c8f12a36-7810-4495-bc81-74dbb5a24804/long_c8f12a36-7810-4495-bc81-74dbb5a24804.webp?format=webp&quality=80",
    slug: "green-love",
  },
  {
    id: "sen-ngay-hy",
    category: "traditional",
    name: "Sen Ngày Hỷ",
    image:
      "https://cdn-resource.zenlove.me/templates/a9195353-7ba5-4a2b-9611-5868025d3f02/long_a9195353-7ba5-4a2b-9611-5868025d3f02.webp?format=webp&quality=80",
    slug: "sen-ngay-hy",
  },
  {
    id: "hen-uoc",
    category: "traditional",
    name: "Hẹn Ước",
    image:
      "https://cdn-resource.zenlove.me/templates/4ec76647-a5ef-4f58-8160-d20febb9e84a/long_4ec76647-a5ef-4f58-8160-d20febb9e84a.webp?format=webp&quality=80",
    slug: "hen-uoc",
  },
  {
    id: "hong-phong",
    category: "modern",
    name: "Hồng Phong",
    image:
      "https://cdn-resource.zenlove.me/templates/8c5055d8-30db-4b38-8831-e11063e3d352/long_8c5055d8-30db-4b38-8831-e11063e3d352.webp?format=webp&quality=80",
    slug: "hong-phong",
  },
  {
    id: "moc-am",
    category: "vintage",
    name: "Mộc Ấm",
    image:
      "https://cdn-resource.zenlove.me/templates/1f422dc5-7795-48c4-8e1a-48cc8421dbc3/long_1f422dc5-7795-48c4-8e1a-48cc8421dbc3.webp?format=webp&quality=80",
    slug: "moc-am",
  },
  {
    id: "dong-xanh",
    category: "vintage",
    name: "Đồng Xanh",
    image:
      "https://cdn-resource.zenlove.me/templates/24d88c9e-159b-4888-9c77-c3ed775035b6/long_24d88c9e-159b-4888-9c77-c3ed775035b6.webp?format=webp&quality=80",
    slug: "dong-xanh",
  },
  {
    id: "net-thuong",
    category: "vintage",
    name: "Nét Thương",
    image:
      "https://cdn-resource.zenlove.me/templates/de48d917-df7d-4ab9-a553-be6e8fd84c04/long_de48d917-df7d-4ab9-a553-be6e8fd84c04.webp?format=webp&quality=80",
    slug: "net-thuong",
  },
  {
    id: "loi-hen-kem",
    category: "vintage",
    name: "Lời Hẹn Kem",
    image:
      "https://cdn-resource.zenlove.me/templates/3d7badec-67c8-4eb3-90a4-bf96d2948ec8/long_3d7badec-67c8-4eb3-90a4-bf96d2948ec8.webp?format=webp&quality=80",
    slug: "loi-hen-kem",
  },
  {
    id: "sac-cuoi-be",
    category: "vintage",
    name: "Sắc Cưới Be",
    image:
      "https://cdn-resource.zenlove.me/templates/3410d8c2-6141-4c75-8848-445353a884b5/long_3410d8c2-6141-4c75-8848-445353a884b5.webp?format=webp&quality=80",
    slug: "sac-cuoi-be",
  },
  {
    id: "loi-hen-co-dien",
    category: "traditional",
    name: "Lời Hẹn Cổ Điển",
    image:
      "https://cdn-resource.zenlove.me/templates/3b6728a2-bb39-4331-82f6-410eca19f9db/long_3b6728a2-bb39-4331-82f6-410eca19f9db.webp?format=webp&quality=80",
    slug: "loi-hen-co-dien",
  },
  {
    id: "nang-trang-ngoi",
    category: "modern",
    name: "Nắng Trắng Ngời",
    image:
      "https://cdn-resource.zenlove.me/templates/917772d9-d56c-43ca-b671-12f7023f01ce/long_917772d9-d56c-43ca-b671-12f7023f01ce.jpg?format=webp&quality=80",
    slug: "nang-trang-ngoi",
  },
  {
    id: "trang-tinh-khoi",
    category: "modern",
    name: "Trắng Tinh Khôi",
    image:
      "https://cdn-resource.zenlove.me/templates/f97f767a-b8c2-438d-80e9-89651095e93e/long_f97f767a-b8c2-438d-80e9-89651095e93e.webp?format=webp&quality=80",
    slug: "trang-tinh-khoi",
  },
  {
    id: "hong-yeu-thuong",
    category: "modern",
    name: "Hồng Yêu Thương",
    image:
      "https://cdn-resource.zenlove.me/templates/453f372e-5d22-474e-b947-0a833ba1bb66/long_453f372e-5d22-474e-b947-0a833ba1bb66.webp?format=webp&quality=80",
    slug: "hong-yeu-thuong",
  },
  {
    id: "sac-dem-hen",
    category: "vintage",
    name: "Sắc Đêm Hẹn",
    image:
      "https://cdn-resource.zenlove.me/templates/c0031611-6847-4945-b7f5-f98ddaf5f1ee/long_c0031611-6847-4945-b7f5-f98ddaf5f1ee.webp?format=webp&quality=80",
    slug: "sac-dem-hen",
  },
  {
    id: "la-mong-o-liu",
    category: "vintage",
    name: "Lá Mộng Ô Liu",
    image:
      "https://cdn-resource.zenlove.me/templates/c026f536-0230-4d5e-80af-7533f26eed61/long_c026f536-0230-4d5e-80af-7533f26eed61.webp?format=webp&quality=80",
    slug: "la-mong-o-liu",
  },
  {
    id: "khung-may-trang",
    category: "vintage",
    name: "Khung Mây Trắng",
    image:
      "https://cdn-resource.zenlove.me/templates/8b92bbcd-83d7-46d9-b522-8c61042b0342/long_8b92bbcd-83d7-46d9-b522-8c61042b0342.png?format=webp&quality=80",
    slug: "khung-may-trang",
  },
  {
    id: "nang-luu-yeu",
    category: "vintage",
    name: "Nắng Lưu Yêu",
    image:
      "https://cdn-resource.zenlove.me/templates/43498986-ba34-4bcf-857a-0a4caa8d7dcb/long_43498986-ba34-4bcf-857a-0a4caa8d7dcb.webp?format=webp&quality=80",
    slug: "nang-luu-yeu",
  },
  {
    id: "xanh-nhu-loi-hen",
    category: "vintage",
    name: "Xanh Như Lời Hẹn",
    image:
      "https://cdn-resource.zenlove.me/templates/82f29721-5471-4784-b3f8-bee9afa7c790/long_82f29721-5471-4784-b3f8-bee9afa7c790.webp?format=webp&quality=80",
    slug: "xanh-nhu-loi-hen",
  },
  {
    id: "net-chu-tinh-nhan",
    category: "modern",
    name: "Nét Chữ Tình Nhân",
    image:
      "https://cdn-resource.zenlove.me/templates/b546553f-34a8-4313-a259-a79933725b70/long_b546553f-34a8-4313-a259-a79933725b70.webp?format=webp&quality=80",
    slug: "net-chu-tinh-nhan",
  },
];

export default function TemplatesSection() {
  const router = useRouter();
  const { isLoggedIn, openLoginModal } = useAuth();
  const [previewTemplate, setPreviewTemplate] = useState<ZenLoveTemplate | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<"all" | "traditional" | "modern" | "vintage">("all");

  const filteredItems = React.useMemo(() => {
    if (selectedStyle === "all") return TEMPLATE_ITEMS;
    return TEMPLATE_ITEMS.filter((item) => item.category === selectedStyle);
  }, [selectedStyle]);


  const handleCardClick = (item: TemplateCarouselItem) => {
    const found = ZENLOVE_TEMPLATES.find(
      (t) => t.slug === item.slug || t.id === item.id
    );
    if (found) {
      setPreviewTemplate(found);
    } else {
      setPreviewTemplate({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: `Mẫu thiệp cưới online ${item.name} đẹp tinh tế và hiện đại từ ZenLove.`,
        categoryId: "e5a1eb86-bbde-4d17-b9f3-22a55ef0bcf2",
        categoryName: "Thiệp cưới",
        categorySlug: "thiep-cuoi",
        imageUrl: item.image,
        templateType: "free",
        targetPageType: "CANVAS",
        likeCount: 99,
        viewCount: 1200,
        usageCount: 88,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    if (!isLoggedIn) {
      openLoginModal("Vui lòng đăng nhập để bắt đầu tạo thiệp cưới với mẫu này", {
        type: "clone_template",
        templateId,
      });
      return;
    }
    try {
      const card = await cloneTemplateToNewCard(templateId);
      router.push(`/design-template/${card.id}?clonedFrom=${templateId}`);
    } catch (e: any) {
      console.error("Clone template failed:", e);
      alert(e?.message || "Không thể khởi tạo mẫu thiệp cưới. Vui lòng thử lại!");
    }
  };

  return (
    <Section id="templates" bg="subtle" padding="lg" ariaLabel="Kho mẫu thiệp cưới">
      <AnimateOnScroll animation="fade-up">
        <SectionHeading
          eyebrow="Kho mẫu đa dạng"
          title={
            <>
              Chọn mẫu &amp; bắt đầu tạo thiệp mời của bạn
            </>
          }
          description="Khám phá các thiết kế từ truyền thống đến hiện đại. Xem trước và chọn một mẫu phù hợp với câu chuyện của hai bạn."
        />
      </AnimateOnScroll>

      {/* Style Filter Controls */}
      <AnimateOnScroll animation="fade-up" delay={100}>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "all", label: "Tất cả mẫu" },
            { id: "traditional", label: "Á Đông & Truyền thống" },
            { id: "modern", label: "Hiện đại & Tối giản" },
            { id: "vintage", label: "Vintage & Cổ điển" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={selectedStyle === cat.id}
              onClick={() => setSelectedStyle(cat.id as any)}
              className="zen-control cursor-pointer text-xs font-semibold"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </AnimateOnScroll>

      {/* 3D Arc Carousel with animation */}
      <AnimateOnScroll animation="fade-up" delay={150}>
        <div className="mx-auto mt-10 max-w-[1500px]">
          <ArcCarousel
            key={selectedStyle}
            items={filteredItems}
            label="Mẫu thiệp cưới online"
            cardWidth={220}
            visibleCards={7}
            caption={false}
            renderCard={(item) => (
              <button
                type="button"
                onClick={() => handleCardClick(item)}
                title={`Xem mẫu thiệp cưới ${item.name}`}
                className="group/arc-card block w-full rounded-2xl text-left cursor-pointer transition-transform duration-300 motion-safe:hover:scale-[1.02]"
              >
                <span
                  className="relative block overflow-hidden rounded-2xl border border-rose-100/80 bg-gray-100 shadow-[0_14px_32px_-12px_rgba(0,0,0,0.35)] [aspect-ratio:1000/1470]"
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
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-semibold drop-shadow-sm">
                      {item.name}
                    </span>
                  </span>
                </span>
              </button>
            )}
          />
        </div>
      </AnimateOnScroll>

      {/* Action Button */}
      <AnimateOnScroll animation="fade-up" delay={250}>
        <div className="mt-12 flex justify-center">
          <Link
            className="zen-button zen-button-primary"
            href="/templates"
          >
            <span>Khám phá toàn bộ mẫu thiệp</span>
            <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
        </div>
      </AnimateOnScroll>

      {/* Interactive Modal Previewing Real Cloned Template */}
      {previewTemplate && (
        <ZenlovePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUse={handleUseTemplate}
        />
      )}
    </Section>
  );
}
