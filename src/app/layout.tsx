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

export const metadata: Metadata = {
  metadataBase: new URL("https://zenlove.me"),
  title: "Tạo thiệp cưới online miễn phí, đẹp tinh tế | ZenLove",
  description:
    "ZenLove là nền tảng tạo thiệp cưới online miễn phí chỉ với 5 phút, thay vì gửi thiệp giấy truyền thống qua tay, giờ đây bạn có thể gửi thiệp mời chỉ qua một đường link. Bắt đầu ngay!",
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
      <body className="antialiased selection:bg-rose-100 selection:text-zen-primary">
        <AuthProvider>
          {children}
          <LoginModal />
        </AuthProvider>
      </body>
    </html>
  );
}
