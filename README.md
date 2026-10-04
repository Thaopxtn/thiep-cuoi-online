# 💌 Nền Tảng Thiệp Cưới Online & Trình Biên Tập Tương Tác

Nền tảng tạo và quản lý thiệp cưới online số cao cấp với hiệu ứng mở phong bì sáp niêm phong, nhạc nền lãng mạn, quản lý khách mời RSVP và hộp mừng cưới mã QR ngân hàng.

---

## 🌟 Tính Năng Nổi Bật

- **Trình biên tập Studio kéo thả (Visual Editor):**
  - Tùy biến trực quan ảnh cưới, văn bản, font chữ, màu sắc theo thời gian thực.
  - Hỗ trợ xoay lật đa góc độ, căn chỉnh, tạo bóng đổ, bo viền ảnh.
  - Bộ hiệu ứng chuyển động phong phú: Bay lơ lửng, Nhún nhảy, Rung rinh, Nhịp tim, Lắc lư.
- **Trải nghiệm khách mời xem thiệp (Interactive Viewer):**
  - Hiệu ứng mở phong bì sáp niêm phong hoàng gia kèm nhạc nền lãng mạn.
  - Đồng hồ đếm ngược đến ngày cưới theo thời gian thực.
  - Sơ đồ bản đồ tiệc cưới tích hợp Google Maps chỉ đường 1 chạm.
  - Xác nhận tham dự (RSVP) trực tuyến tức thì.
  - Sổ lưu bút gửi lời chúc kèm hiệu ứng tim bay.
  - Hộp mừng cưới mã QR ngân hàng (VietQR) tự động sao chép số tài khoản.
- **Bảng điều khiển quản trị (Dashboard):**
  - Quản lý danh sách thiệp đã tạo.
  - Theo dõi lượt xem, danh sách khách mời tham dự và sổ lưu bút.
- **Tối ưu chi phí 0 ĐỒNG:**
  - Tự động nén ảnh WebP trên trình duyệt (giảm 95% dung lượng, 0đ CPU server).
  - Tích hợp Cloudflare R2 (10GB miễn phí, 0đ băng thông tải về).
  - Nén dữ liệu thiệp LZUTF8 lưu trữ Supabase (500MB miễn phí chứa 20.000+ thiệp).

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Styling & Animations:** Tailwind CSS, Animate.css Keyframes
- **Editor Engine:** Craft.js Core architecture
- **Compression:** Client-side HTML5 Canvas WebP Compressor, LZUTF8
- **Database:** Supabase PostgreSQL (REST API) & Local Fallback
- **Icons:** Lucide React

---

## 💻 Cài Đặt & Chạy Môi Trường Cục Bộ

1. Cài đặt các gói phụ thuộc:
```bash
npm install
```

2. Khởi chạy máy chủ phát triển:
```bash
npm run dev
```

3. Mở trình duyệt và truy cập: `http://localhost:3000`

---

## ☁️ Triển Khai Lên Vercel (Chi phí 0 VNĐ)

1. Đẩy mã nguồn lên kho lưu trữ GitHub của bạn.
2. Đăng nhập [Vercel](https://vercel.com) và nhập (Import) repository này.
3. Điền các biến môi trường từ `.env.example` (Supabase URL & Key).
4. Nhấn **Deploy** để có ngay đường link website hoạt động 24/7.
