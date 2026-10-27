import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZenLove - Nền Tảng Thiệp Cưới Online Thông Minh",
    short_name: "ZenLove Wedding",
    description: "Tạo thiệp cưới online đẹp nhất, quản lý khách mời RSVP và tương tác thời gian thực",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e11d48",
    icons: [
      {
        src: "/assets/logo/logo-6.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
