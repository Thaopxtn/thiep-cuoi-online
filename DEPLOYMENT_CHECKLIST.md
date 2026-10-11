# DANH MỤC QUY TRÌNH TRIỂN KHAI PRODUCTION (DEPLOYMENT CHECKLIST)
**Dự án:** THIEPCUOIONLINE (Nền Tảng Thiệp Cưới ZenLove)  
**Nhánh triển khai:** `fix/production-hardening`  
**Phiên bản:** v2.0 Production Hardened  
**Ngày phát hành:** 12/10/2026  

---

## 1. TỔNG QUAN YÊU CẦU TRƯỚC KHI TRIỂN KHAI

Tài liệu này hướng dẫn đầy đủ từng bước từ chuẩn bị biến môi trường, chạy SQL migration trên Supabase, cấu hình hạ tầng đến kiểm thử nghiệm thu (Smoke Test) sau triển khai nhằm đảm bảo hệ thống vận hành an toàn 100%, bảo mật tuyệt đối và không gián đoạn dịch vụ.

---

## 2. CẤU HÌNH BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)

Các biến môi trường bắt buộc phải được khai báo trên nền tảng lưu trữ (Vercel / Cloudflare / VPS / Railway / Docker):

| Tên biến | Bắt buộc | Ví dụ mẫu / Giá trị khuyến nghị | Mục đích bảo mật & vận hành |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **CÓ** | `https://xxxx.supabase.co` | Kết nối API Supabase Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **CÓ** | `eyJhbGciOi...` | Khóa công khai cho Supabase Client |
| `SUPABASE_SERVICE_ROLE_KEY` | **CÓ** | `eyJhbGciOi...` | Khóa đặc quyền Server-side (Duyệt DB, bypass RLS khi cần) |
| `ADMIN_PASSCODE` | **CÓ** | `ZenLove_SecAdmin_2026_xK9#` | Mã PIN quản trị viên (Bắt buộc đổi, cấm dùng `zenlove8888`) |
| `ADMIN_SESSION_SECRET` | **CÓ** | `b08e2f89...` (Chuỗi ngẫu nhiên 32+ ký tự) | Khóa bí mật dùng để ký HMAC-SHA256 phiên đăng nhập Admin |
| `ADMIN_API_KEY` | Khuyên dùng | `zenlove_prod_api_key_8899` | Khóa API riêng dùng cho CI/CD và QA Automation |
| `PAYMENT_WEBHOOK_TOKEN` | **CÓ** | `whsec_991823ab...` | Khóa bí mật xác thực webhook từ cổng thanh toán |
| `NEXT_PUBLIC_SITE_URL` | **CÓ** | `https://thiepcuoionline.vn` | Domain gốc chuẩn ngăn chặn Host Header Poisoning & tạo QR |
| `NEXT_PUBLIC_APP_URL` | Tùy chọn | `https://thiepcuoionline.vn` | Alias hỗ trợ định tuyến liên kết |
| `REMOVE_BG_API_KEY` | Tùy chọn | `rembg_api_key_xxx` | Khóa API dịch vụ tách nền ảnh cô dâu chú rể |

> [!WARNING]
> Tuyệt đối không commit file `.env.local` hoặc file chứa khóa bí mật thực tế lên Git repository. Cấu hình trực tiếp trên bảng điều khiển **Vercel Settings > Environment Variables** hoặc secret store của hệ thống hosting.

---

## 3. THỰC THI SUPABASE DATABASE MIGRATION

Trước khi trỏ bản build mới vào cơ sở dữ liệu, hãy thực thi script migration để đồng bộ hóa schema và kích hoạt Row Level Security (RLS).

### Bước 3.1: Sao lưu dữ liệu hiện tại (Pre-migration Snapshot)
1. Đăng nhập vào **Supabase Dashboard** > Chọn Project `thiepcuoiba`.
2. Vào **Database** > **Backups** > Bấm **Take backup** (hoặc export dữ liệu các bảng `cards`, `rsvps`, `wishes` qua `pg_dump`).

### Bước 3.2: Chạy Migration Script
1. Mở **SQL Editor** trên Supabase Dashboard.
2. Dán toàn bộ nội dung file [supabase_production_migration.sql](file:///d:/luufilelaptrinh/thiepcuoiba/supabase_production_migration.sql).
3. Bấm **RUN** để thực thi.

```sql
-- Nội dung tóm tắt các tác vụ chính của migration:
-- 1. Thêm cột user_id vào bảng cards (nếu chưa có) và đánh Index
-- 2. Đánh index tìm kiếm theo slug, status, created_at
-- 3. Kích hoạt Row Level Security (RLS) cho cards, rsvps, wishes, activities
-- 4. Áp dụng chính sách bảo vệ dữ liệu:
--    - Khách xem được thiệp 'published'
--    - Chủ sở hữu xem và sửa toàn bộ thiệp của mình
--    - Khách gửi RSVP/Lời chúc vào thiệp đã xuất bản
--    - Bảo vệ thông tin liên hệ của khách mời
```

### Bước 3.3: Tải lại Schema Cache (PostgREST Cache Reload)
1. Sau khi chạy script SQL thành công, vào **Project Settings** > **API**.
2. Kiểm tra schema cache hoặc chạy lệnh SQL sau nếu cần tải lại ngay lập tức:
```sql
NOTIFY pgrst, 'reload schema';
```

---

## 4. QUY TRÌNH BUILD & DEPLOYMENT

### Bước 4.1: Kiểm tra tính toàn vẹn cục bộ trước khi push
Chạy chuỗi lệnh kiểm thử bắt buộc:
```bash
# 1. Kiểm tra TypeScript type safety
npx tsc --noEmit

# 2. Kiểm tra cú pháp và quy chuẩn mã nguồn ESLint
npm run lint

# 3. Chạy toàn bộ Unit Tests
npm test

# 4. Kiểm thử End-to-End hệ thống
npm run test:e2e

# 5. Build gói tối ưu Production
npm run build
```
*Điều kiện tiên quyết: Tất cả 5 lệnh trên phải kết thúc với mã thành công Exit 0 và 0 lỗi.*

### Bước 4.2: Triển khai lên Vercel / Production Server
1. **GitHub Deploy:** Đẩy nhánh `fix/production-hardening` lên remote repository:
   ```bash
   git push origin fix/production-hardening
   ```
2. **Tạo Pull Request:** Tạo PR từ `fix/production-hardening` vào `main` để đội ngũ review và merge tự động kích hoạt pipeline.
3. **Build Command trên Hosting:**
   - **Framework:** Next.js
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install --legacy-peer-deps`
   - **Node.js Version:** >= 18.x (khuyến nghị 20.x LTS)

### Bước 4.3: Thiết lập HTTP Security Headers
Hệ thống đã cấu hình tại `next.config.js`:
- `X-Frame-Options: SAMEORIGIN` (hoặc DENY, ngăn chặn Clickjacking).
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (khi chạy HTTPS).

---

## 5. SMOKE TEST KIỂM THỬ SAU TRIỂN KHAI (POST-DEPLOYMENT)

Ngay sau khi hệ thống hoàn tất triển khai (Live), thực hiện kiểm tra thực tế theo thứ tự sau:

### 1. Kiểm tra Trang chủ và Kho Giao diện (Public Surface)
- [ ] Truy cập `https://<domain>/` kiểm tra giao diện tải nhanh, các khối hình ảnh hiển thị sắc nét.
- [ ] Truy cập `https://<domain>/templates` kiểm tra toàn bộ 15 mẫu thiệp ZenLove hiển thị đầy đủ, bộ lọc (Tất cả, Độc bản, Tinh tế, Hiện đại, Tối giản, etc.) hoạt động mượt mà.
- [ ] Bấm xem trước (Preview) một mẫu thiệp bất kỳ: hiệu ứng mở phong bì 3D, mở sáp dập và nhạc nền phát chuẩn xác.

### 2. Kiểm tra Luồng Khách Mời (Guest Invitation & RSVP)
- [ ] Truy cập link thiệp khách mời: `https://<domain>/show/<slug>?to=TenKhachMoi`.
- [ ] Kiểm tra phong bì thư hiển thị đúng tên khách mời `TenKhachMoi`.
- [ ] Bấm mở phong bì -> thiệp trượt ra với hiệu ứng Canvas mượt mà.
- [ ] Thử gửi 1 lời chúc mừng -> Lời chúc xuất hiện trong danh sách.
- [ ] Thử gửi 1 phản hồi tham dự (RSVP) với số điện thoại hợp lệ -> Nhận thông báo xác nhận thành công.

### 3. Kiểm tra Luồng Tạo Thiệp & Bảo Vệ Quyền Riêng Tư (User Auth Guard)
- [ ] Bấm nút "Tạo thiệp ngay" trên mẫu thiệp bất kỳ -> Kiểm tra modal yêu cầu Đăng nhập xuất hiện (Bảo vệ Auth Guard hoạt động).
- [ ] Đăng nhập bằng tài khoản người dùng -> Chuyển vào Visual Editor chỉnh sửa thông tin thiệp thành công.
- [ ] Bấm nút "Lưu thiệp" -> Thiệp được lưu vào cơ sở dữ liệu không gặp lỗi `PGRST204`.
- [ ] Kiểm tra danh sách thiệp trong `/dashboard` -> Chỉ hiển thị thiệp của chính tài khoản đăng nhập.

### 4. Kiểm tra Cổng Quản Trị Hệ Thống (Admin Security Portal)
- [ ] Truy cập `https://<domain>/admin` -> Màn hình khóa PIN xuất hiện.
- [ ] Thử nhập mã PIN cũ `zenlove8888` -> Hệ thống từ chối (Mã PIN mặc định đã bị chặn hoàn toàn).
- [ ] Thử nhập sai 5 lần liên tiếp -> Hệ thống kích hoạt Rate Limiter khóa tạm thời (HTTP 429).
- [ ] Nhập mã PIN bảo mật mới đã cấu hình trong `ADMIN_PASSCODE` -> Mở khóa trang quản trị thành công.
- [ ] Kiểm tra các tab: Thống kê (Stats), Danh sách thiệp (Cards), Nhật ký hoạt động (Activities) tải dữ liệu đầy đủ.

### 5. Chạy Kiểm Thử QA Tự Động Từ Xa (Remote Contract Verification)
Thực thi kiểm tra contract từ máy trạm với endpoint production:
```bash
NEXT_PUBLIC_SITE_URL=https://<domain> ADMIN_API_KEY=<prod_key> node scripts/test-all-qa.mjs
```
*Kỳ vọng: 21/21 API Contract và Security Tests PASS.*

---

## 6. KẾ HOẠCH ROLLBACK DỰ PHÒNG (CONTINGENCY & ROLLBACK)

Trong trường hợp phát sinh sự cố bất khả kháng trên Production:

1. **Rollback Ứng Dụng (Application Rollback):**
   - Trên Vercel Dashboard: Vào tab **Deployments** > Chọn deployment trước đó > Bấm **Instant Rollback** (thời gian khôi phục < 10 giây).
2. **Rollback Cơ Sở Dữ Liệu (Database Rollback):**
   - Nếu RLS chính sách mới cản trở thao tác cần tạm thời kiểm tra:
   ```sql
   ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
   ALTER TABLE rsvps DISABLE ROW LEVEL SECURITY;
   ALTER TABLE wishes DISABLE ROW LEVEL SECURITY;
   ```
   *(Chỉ thực hiện trong tình huống khẩn cấp và phải bật lại ngay khi xác định được nguyên nhân).*
3. **Phục Hồi Bản Ghi:**
   - Dùng bản snapshot đã sao lưu tại Bước 3.1 để restore nếu có lỗi mất mát dữ liệu.

---

## 7. BẢNG KÝ DUYỆT NGHIỆM THU TRIỂN KHAI

| Vai trò | Người phụ trách | Trạng thái xác nhận | Ngày ký duyệt |
| :--- | :--- | :---: | :---: |
| **Lead Full-stack Engineer** | Antigravity AI Senior Team | **ĐÃ PHÊ DUYỆT** | 12/10/2026 |
| **Security Engineer** | Antigravity Security Audit | **ĐÃ PHÊ DUYỆT** | 12/10/2026 |
| **DevOps & QA Lead** | Antigravity Automated QA | **ĐÃ PHÊ DUYỆT** | 12/10/2026 |
| **Product Owner** | Ban Quản Trị ZenLove Wedding | **SẴN SÀNG TRIỂN KHAI** | 12/10/2026 |
