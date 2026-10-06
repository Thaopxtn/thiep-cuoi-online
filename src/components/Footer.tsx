import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  const productLinks = [
    { title: "Mẫu thiệp online", href: "/templates" },
    { title: "Mẫu thiệp cưới online", href: "/templates" },
    { title: "Ưu đãi & Đối tác cưới", href: "/doi-tac-cuoi" },
    { title: "Blog cưới hỏi", href: "#blog" },
    { title: "Tiếp thị liên kết", href: "/doi-tac-cuoi" },
    { title: "Tạo thiệp trọn gói", href: "#packages" },
    { title: "Công cụ đám cưới", href: "#tools" },
  ];

  const legalLinks = [
    { title: "Thông tin doanh nghiệp", href: "#legal" },
    { title: "Chính sách bảo mật", href: "#privacy" },
    { title: "Điều khoản dịch vụ", href: "#terms" },
    { title: "Điều kiện giao dịch chung", href: "#terms-transaction" },
    { title: "Chính sách thanh toán", href: "#payment" },
    { title: "Chính sách hoàn tiền", href: "#refund" },
    { title: "Quy trình giao dịch", href: "#purchase-process" },
    { title: "Chính sách nội dung", href: "#content-policy" },
    { title: "Về ZenLove", href: "#about" },
  ];

  return (
    <footer
      id="footer"
      className="bg-white text-black pt-12 pb-10 border-t border-gray-200"
      role="contentinfo"
      aria-label="Thông tin về ZenLove"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-gray-700">
          {/* Column 1: Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Link
                href="/"
                className="group relative flex items-center justify-start cursor-pointer gap-1.5"
              >
                <img
                  src="/assets/logo/logo-6.svg"
                  className="h-9 w-auto"
                  alt="Zenlove"
                />
                <img
                  src="/assets/logo/text-logo-dark.svg"
                  className="h-5 w-auto object-contain"
                  style={{ height: "20px", width: "auto" }}
                  alt="Zenlove"
                />
                <span className="text-[10px] text-gray-500 font-mono bg-white/90 border border-gray-200 px-1 py-0.5 rounded shadow-sm ml-1">
                  v1.26.10a1
                </span>
              </Link>
            </div>
            <p className="mb-2.5 text-gray-600 leading-relaxed">
              Nền tảng tạo thiệp cưới online miễn phí, hiện đại và tinh tế, giúp
              cặp đôi lan tỏa lời mời một cách chuyên nghiệp.
            </p>
            <p className="text-gray-500 text-xs mt-3">
              Website:{" "}
              <span className="text-zen-black font-semibold">zenlove.me</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <a
                href="#create"
                className="text-zen-primary hover:underline font-medium"
              >
                tạo thiệp cưới online
              </a>
            </p>
          </div>

          {/* Column 2: Products */}
          <div>
            <p className="text-black font-bold mb-4 font-heading text-base">
              Sản phẩm
            </p>
            <ul className="space-y-2.5">
              {productLinks.map((item) => (
                <li key={item.title}>
                  <a
                    href={item.href}
                    className="text-gray-600 hover:text-zen-primary transition-colors text-sm"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <p className="text-black font-bold mb-4 font-heading text-base">
              Pháp lý
            </p>
            <ul className="space-y-2.5">
              {legalLinks.map((item) => (
                <li key={item.title}>
                  <a
                    href={item.href}
                    className="text-gray-600 hover:text-zen-primary transition-colors text-sm"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Social */}
          <div>
            <p className="text-black font-bold mb-4 font-heading text-base">
              Kết nối
            </p>
            <p className="mb-4 text-gray-600 leading-relaxed text-sm">
              Kết nối với chúng tôi để cập nhật xu hướng thiệp cưới mới nhất.
            </p>
            <div
              className="flex items-center gap-3"
              aria-label="Liên kết mạng xã hội ZenLove"
            >
              {/* Facebook */}
              <a
                href="https://www.facebook.com/zenlove.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-rose-50 hover:text-zen-primary flex items-center justify-center transition-colors text-gray-700"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/zenlove.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-rose-50 hover:text-zen-primary flex items-center justify-center transition-colors text-gray-700"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@zenlove.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-rose-50 hover:text-zen-primary flex items-center justify-center transition-colors text-gray-700"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.48V8.69a8.18 8.18 0 0 0 4.91 1.63V6.87a4.85 4.85 0 0 1-1-.18z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-gray-200 pt-6 flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4 text-center md:text-left">
            <img
              src="/assets/landing/DaThongBao_BCT.png"
              alt="Đã thông báo Bộ Công Thương"
              className="h-10 w-auto"
              loading="lazy"
            />
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong className="text-gray-800">HỘ KINH DOANH ZEN</strong>
                <span className="mx-1.5">·</span>
                Mã số hộ kinh doanh: 027200006453
              </p>
              <p>
                Địa chỉ: Làng Bất Lự, Xã Đại Đồng, Tỉnh Bắc Ninh
                <span className="mx-1.5">·</span>
                Điện thoại: 0823312212
                <span className="mx-1.5">·</span>
                Email: zenlove.support@gmail.com
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1 text-xs text-gray-600">
            <p>© 2026 ZenLove™. All Rights Reserved.</p>
            <div className="flex items-center gap-3">
              <button type="button" className="hover:underline text-gray-600">
                Cài đặt cookie
              </button>
              <div className="flex items-center gap-1">
                Made with love in Vietnam
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 inline" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
