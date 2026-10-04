# 💌 Nền Tảng Thiệp Cưới Online & Trình Biên Tập Tương Tác Số 1

Nền tảng tạo và quản lý thiệp cưới online cao cấp với hiệu ứng mở phong bì thư sáp niêm phong hoàng gia, nhạc nền lãng mạn, quản lý khách mời RSVP thời gian thực, sổ lưu bút chúc mừng, hộp mừng cưới VietQR chuẩn Napas 24/7 và hệ thống backend độc lập kết nối trực tiếp Supabase Database (0đ chi phí vận hành).

---

## 🌟 Tính Năng Nổi Bật

### 1. Trình biên tập Studio kéo thả (Visual Editor)
- Tùy biến trực quan ảnh cưới, văn bản, font chữ, màu sắc theo thời gian thực.
- Hỗ trợ xoay lật đa góc độ, căn chỉnh tự do, tạo bóng đổ, bo góc viền ảnh.
- Bộ hiệu ứng chuyển động phong phú: Bay lơ lửng (`float`), Nhún nhảy (`bounce`), Rung rinh (`wobble`), Nhịp tim (`pulse`), Lắc lư (`wiggle`).
- Tách nền ảnh tự động bằng AI (**✨ Xóa nền**).

### 2. Trải nghiệm khách mời xem thiệp (Interactive Guest Viewer)
- **Hiệu ứng mở phong bì**: Sáp niêm phong hoàng gia mở nắp kèm nhạc nền tự động.
- **Đồng hồ đếm ngược**: Tự động tính ngày giờ đến lễ thành hôn theo thời gian thực.
- **Bản đồ chỉ đường**: Tích hợp Google Maps 1 chạm đến tư gia nhà trai, nhà gái và trung tâm tiệc cưới.
- **Xác nhận tham dự (RSVP)**: Khách điền tên, SĐT, số người đi cùng -> Đồng bộ trực tiếp vào cơ sở dữ liệu.
- **Sổ lưu bút trực tuyến**: Khách gửi thông điệp yêu thương kèm hiệu ứng tim bay.
- **Hộp mừng cưới VietQR chuẩn Napas 24/7**: Tự động sinh mã QR ngân hàng có logo, tên chủ tài khoản và lời nhắn chuyển khoản.

### 3. Bảng điều khiển quản trị (Dashboard)
- Quản lý danh sách thiệp cưới đã tạo.
- Thống kê lượt xem, tổng số khách mời xác nhận tham dự và tổng số lời chúc mừng.
- **Xuất dữ liệu Excel (CSV)**: Tải về danh sách khách mời (UTF-8 BOM chuẩn 100% tiếng Việt) chỉ với 1 click.

### 4. Tối ưu chi phí 0 ĐỒNG / THÁNG
- **Nén ảnh WebP client**: Giảm 95% dung lượng ảnh tải lên (0đ CPU máy chủ).
- **Lưu trữ ảnh**: Hỗ trợ đồng thời Supabase Storage (1GB miễn phí) và Cloudflare R2 (0đ phí băng thông).
- **Thuật toán LZUTF8**: Nén toàn bộ cây cấu trúc thiệp thành chuỗi Base64 siêu nhẹ, 1 database miễn phí chứa hơn 20.000 đám cưới.

---

## 🔌 Danh Sách API Endpoints (Backend Architecture)

| Nhóm API | Method & Path | Chức năng |
| :--- | :--- | :--- |
| **Quản lý thiệp** | `GET /api/cards` | Lấy danh sách thiệp cưới người dùng |
| | `POST /api/cards` | Tạo thiệp mới từ mẫu hoặc sao chép |
| | `GET /api/cards/[id]` | Lấy chi tiết thiệp & giải nén LZUTF8 cây thiết kế |
| | `PUT /api/cards/[id]` | Tự động lưu bản thiết kế (Auto-save) lên Supabase |
| | `DELETE /api/cards/[id]` | Xóa thiệp và toàn bộ RSVP/wishes liên quan |
| | `POST /api/cards/[id]/publish` | Xuất bản thiệp, kích hoạt link công khai `/show/[slug]` |
| | `GET /api/cards/export-all` | Xuất danh sách khách mời ra file Excel (CSV) |
| | `GET /api/cards/[id]/export` | Xuất khách mời của 1 thiệp ra file Excel |
| **Khách tương tác** | `GET /api/show/[slug]` | Trả dữ liệu thiệp cưới cho khách xem |
| | `POST /api/show/[slug]/rsvp` | Khách gửi xác nhận tham dự vào DB |
| | `POST /api/show/[slug]/wishes` | Khách gửi lời chúc vào Sổ lưu bút DB |
| | `POST /api/show/[slug]/view` | Tự động tăng số lượt xem thiệp |
| **Kho mẫu độc lập** | `GET /api/templates` | Lấy 207+ templates nội bộ (lọc danh mục, tìm kiếm) |
| | `GET /api/templates/[id]` | Chi tiết mẫu thiệp nội bộ không phụ thuộc ZenLove |
| **Tiện ích & AI** | `GET /api/tools/vietqr` | Sinh mã VietQR chuyển khoản Napas 24/7 |
| | `POST /api/tools/remove-bg` | Tách phông nền ảnh AI |
| | `POST /api/upload` | Upload ảnh nén WebP lên R2 / Supabase Storage |
| | `POST /api/webhook/payment` | Webhook tự động ghi nhận tiền mừng cưới SePay/PayOS |
| **Xác thực** | `GET /api/auth/google` | Khởi tạo phiên Đăng nhập Google qua Supabase OAuth |
| | `/auth/callback` | Tiếp nhận phiên đăng nhập và chuyển hướng về Dashboard |

---

## 🚀 Công Nghệ Sử Dụng

- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Giao diện & Chuyển động**: Tailwind CSS, Animate.css Keyframes
- **Lõi Editor**: Craft.js Core Engine
- **Nén dữ liệu**: Client Canvas WebP Compressor, LZUTF8
- **Cơ sở dữ liệu**: Supabase PostgreSQL (REST API với Service Role Key)
- **Icons**: Lucide React

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

1. Cài đặt các gói phụ thuộc:
```bash
npm install
```

2. Cấu hình biến môi trường:
Sao chép `.env.example` thành `.env.local` và điền URL & Key của Supabase:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3005
```

3. Khởi tạo cơ sở dữ liệu trên Supabase:
- Mở mục **SQL Editor** trên Supabase Dashboard.
- Sao chép toàn bộ nội dung tệp [`supabase_schema.sql`](./supabase_schema.sql) và nhấn **Run**.

4. Khởi chạy máy chủ phát triển:
```bash
npm run dev
```
Truy cập: `http://localhost:3005`

---

## ☁️ Triển Khai Lên Vercel (Miễn Phí 100%)

1. Đẩy mã nguồn lên repository GitHub của bạn: [`https://github.com/Thaopxtn/thiep-cuoi-online`](https://github.com/Thaopxtn/thiep-cuoi-online)
2. Truy cập [Vercel](https://vercel.com/new) và nhấn **Import** dự án `thiep-cuoi-online`.
3. Trong phần **Environment Variables**, thêm các biến cấu hình từ `.env.local`.
4. Nhấn **Deploy**. Sau 1 phút website của bạn sẽ hoạt động chính thức trên toàn cầu.
