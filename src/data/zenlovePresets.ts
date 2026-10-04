import { TemplateItem } from "./templates/types";
import { ZENLOVE_TEMPLATES, ZenLoveTemplate } from "./zenloveTemplates";

export function convertZenLoveToTemplateItem(z: ZenLoveTemplate): TemplateItem {
  let category: TemplateItem["category"] = "wedding";
  if (z.categorySlug === "thiep-tot-nghiep") category = "graduation";
  else if (z.categorySlug === "thiep-sinh-nhat") category = "birthday";
  else if (z.categorySlug === "thiep-ky-niem") category = "anniversary";
  else if (z.categorySlug === "thiep-su-kien" || z.categorySlug === "thiep-moi-tat-nien") category = "event";

  return {
    id: z.id,
    title: z.name,
    slug: z.slug,
    category,
    categoryName: z.categoryName || "Thiệp cưới",
    image: z.imageUrl,
    scrollPercent: "45%",
    scrollDuration: "2.8s",
    tag: z.targetPageType === "FORM" ? "BIỂU MẪU" : z.templateType === "hot" ? "HOT" : z.templateType === "new" ? "MỚI" : "TỰ DO",
    likes: z.likeCount || 0,
    views: z.viewCount || 0,
    description: z.description || `Mẫu thiệp ${z.categoryName} đẹp sang trọng và tinh tế từ ZenLove.`,
    type: category === "wedding" ? "wedding" : category === "graduation" ? "graduation" : "general",
    recipe: "standard-envelope",
    defaultData: {
      eventTitle: z.name,
      person1: category === "wedding" ? "Hoàng Nam" : category === "graduation" ? "Minh Anh" : "Thanh Tùng",
      person2: category === "wedding" ? "Ánh Tuyết" : undefined,
      date: "20.12.2026",
      time: "11:30",
      venue: "Trung tâm Tiệc cưới Grand Palace",
      address: "142/18 Cộng Hòa, Phường 4, Quận Tân Bình, TP. Hồ Chí Minh",
      mapUrl: "https://maps.google.com",
      quote: "Tình yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng.",
      invitationBody: "Trân trọng kính mời quý khách và gia đình tới tham dự buổi tiệc chung vui cùng chúng tôi.",
      signature: "Rất hân hạnh được đón tiếp!",
      mainPhoto: z.imageUrl,
      albumPhotos: [
        z.imageUrl,
        "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop"
      ],
      musicTitle: "A Thousand Years - Christina Perri",
      musicUrl: "https://res.cloudinary.com/dsi9iqgmw/video/upload/v1711234567/romantic-wedding.mp3",
      bankInfo: {
        bankName: "Vietcombank",
        accountNumber: "998877665544",
        accountHolder: "HOANG NAM",
      },
      initialWishes: [
        {
          id: "w-1",
          name: "Gia đình Bác Thành",
          message: "Chúc hai cháu trăm năm hạnh phúc, mãi mãi son sắt mặn nồng!",
          time: "10 phút trước",
        },
        {
          id: "w-2",
          name: "Nhóm Bạn Thân Đại Học",
          message: "Chúc mừng ngày vui của hai bạn! Chúc cặp đôi luôn vui vẻ, ngập tràn tiếng cười!",
          time: "1 giờ trước",
        }
      ],
    },
  };
}

export const ZENLOVE_PRESET_TEMPLATES: TemplateItem[] = ZENLOVE_TEMPLATES.map(convertZenLoveToTemplateItem);
