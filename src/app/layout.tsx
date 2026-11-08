import type { Metadata } from "next";
import { Inter, Playfair_Display, Dancing_Script } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import LoginModal from "@/components/auth/LoginModal";
import { getSiteUrl } from "@/lib/siteConfig";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-heading",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin", "vietnamese"],
  variable: "--font-signature",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ZenLove - Nền Tảng Tạo Thiệp Cưới Online Miễn Phí & Tinh Tế",
    template: "%s | ZenLove Wedding",
  },
  description:
    "Tạo thiệp cưới online cao cấp chỉ với 5 phút, mở phong bì sáp niêm phong hoàng gia, nhạc nền lãng mạn, quản lý khách mời RSVP thời gian thực và hộp mừng cưới VietQR chuẩn Napas 24/7.",
  keywords: [
    "thiệp cưới online",
    "mẫu thiệp cưới đẹp",
    "tạo thiệp cưới miễn phí",
    "quản lý khách mời rsvp",
    "thiệp cưới số",
    "vietqr đám cưới",
  ],
  authors: [{ name: "ZenLove Team" }],
  creator: "ZenLove",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "ZenLove Wedding",
    title: "ZenLove - Nền Tảng Tạo Thiệp Cưới Online Miễn Phí & Tinh Tế",
    description:
      "Tạo thiệp cưới online cao cấp chỉ với 5 phút, mở phong bì sáp niêm phong hoàng gia, nhạc nền lãng mạn, quản lý khách mời RSVP thời gian thực.",
    images: [
      {
        url: "/assets/logo/logo-6.svg",
        width: 800,
        height: 800,
        alt: "ZenLove Wedding Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZenLove - Nền Tảng Tạo Thiệp Cưới Online Miễn Phí & Tinh Tế",
    description:
      "Tạo thiệp cưới online cao cấp chỉ với 5 phút, mở phong bì sáp niêm phong hoàng gia, nhạc nền lãng mạn.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${playfair.variable} ${dancingScript.variable}`}>
      <head>
        <link rel="preconnect" href="https://cdn-resource.zenlove.me" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://img.vietqr.io" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                function isExtensionError(msg, src, err) {
                  var s = (String(src || '')) + ' ' + (String(msg || '')) + ' ' + (err && err.stack ? String(err.stack) : '');
                  return s.indexOf('chrome-extension://') !== -1 ||
                         s.indexOf('moz-extension://') !== -1 ||
                         s.indexOf('safari-extension://') !== -1 ||
                         s.indexOf('M_ID') !== -1 ||
                         s.indexOf('eppiocemhmnlbhjplcgkofciiegomcon') !== -1;
                }
                window.addEventListener('error', function(e) {
                  if (isExtensionError(e.message, e.filename, e.error)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e.reason;
                  var stack = reason && reason.stack ? reason.stack : '';
                  var msg = reason && reason.message ? reason.message : String(reason || '');
                  if (isExtensionError(msg, '', reason)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-rose-100 selection:text-zen-black">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:px-4 focus:py-3 focus:bg-zen-primary focus:text-white focus:text-sm focus:font-semibold focus:rounded-full focus:shadow-lg"
        >
          Chuyển đến nội dung chính
        </a>
        <AuthProvider>
          {children}
          <LoginModal />
        </AuthProvider>
      </body>
    </html>
  );
}
