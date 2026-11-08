import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteConfig";

const guideUrl = `${getSiteUrl()}/tao-thiep-cuoi-online`;

export const metadata: Metadata = {
  title: "Cách tạo thiệp cưới online chỉ với 5 bước đơn giản | ZenLove",
  description:
    "Hướng dẫn chi tiết 5 bước tự tạo thiệp cưới online tại nhà: chọn mẫu, chỉnh sửa thông tin, xem trước, tạo link chia sẻ, gửi cho khách mời. Kèm ảnh minh họa từng bước.",
  keywords: [
    "cách tạo thiệp cưới online",
    "hướng dẫn tạo thiệp cưới",
    "làm thiệp cưới online tại nhà",
    "các bước tạo thiệp cưới điện tử",
    "hướng dẫn thiệp cưới có RSVP",
    "cách ghi tên khách mời lên thiệp",
    "tự thiết kế thiệp cưới online",
    "hướng dẫn thanh toán thiệp cưới",
  ],
  alternates: {
    canonical: guideUrl,
  },
  openGraph: {
    title: "Cách tạo thiệp cưới online chỉ với 5 bước đơn giản | ZenLove",
    description:
      "Hướng dẫn chi tiết 5 bước tự tạo thiệp cưới online tại nhà: chọn mẫu, chỉnh sửa thông tin, xem trước, tạo link chia sẻ, gửi cho khách mời. Kèm ảnh minh họa từng bước.",
    url: guideUrl,
    siteName: "ZenLove",
    locale: "vi_VN",
    type: "website",
  },
};

export default function TaoThiepCuoiOnlineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
