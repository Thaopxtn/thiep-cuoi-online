import type { Metadata } from "next";
import { Inter, Playfair_Display, Dancing_Script } from "next/font/google";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thiep-cuoi-online.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Nền Tảng Tạo Thiệp Cưới Online Miễn Phí & Tinh Tế",
  description:
    "Tạo thiệp cưới online cao cấp chỉ với 5 phút, mở phong bì sáp niêm phong hoàng gia, nhạc nền lãng mạn, quản lý khách mời RSVP thời gian thực và hộp mừng cưới VietQR chuẩn Napas 24/7.",
  icons: {
    icon: "/favicon.ico",
  },
};

import { AuthProvider } from "@/context/AuthContext";
import LoginModal from "@/components/auth/LoginModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${playfair.variable} ${dancingScript.variable}`}>
      <head>
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
      </head>
      <body className="antialiased selection:bg-rose-100 selection:text-zen-primary">
        <AuthProvider>
          {children}
          <LoginModal />
        </AuthProvider>
      </body>
    </html>
  );
}
