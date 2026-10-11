# DANH MỤC KIỂM TRA AN NINH & BẢO MẬT (SECURITY CHECKLIST)
**Dự án:** THIEPCUOIONLINE (ZenLove Wedding)  
**Tiêu chuẩn đánh giá:** OWASP API Security Top 10, CWE / SANS Top 25, Multi-Tenant Data Isolation  

---

## 1. BẢNG KIỂM TRA AN NINH HỆ THỐNG

| Hạng mục bảo mật | Rủi ro trước khi sửa | Cơ chế bảo vệ đã triển khai | Trạng thái |
| :--- | :--- | :--- | :---: |
| **API Admin Authentication** | Không có xác thực phía server, dùng mã PIN mặc định `zenlove8888`, client tự tạo fake token | Bắt buộc token HMAC-SHA256 có chữ ký server, so sánh thời gian an toàn `timingSafeEqual`, cấm mã mặc định trên production | **ĐẠT (VERIFIED)** |
| **Admin Brute-force Defense** | Không giới hạn số lần nhập sai PIN | Rate limiter in-memory: Tối đa 5 lần thử sai trong 10 phút, tự động khóa 15 phút (HTTP 429) | **ĐẠT (VERIFIED)** |
| **Broken Object-Level Auth (BOLA / IDOR)** | Tin tưởng `userId` do client gửi qua body, query hoặc header `x-user-id` | Xác minh token với Supabase Auth (`/auth/v1/user`), lấy `userId` trực tiếp từ JWT, cấm ghi đè ID thiệp | **ĐẠT (VERIFIED)** |
| **Draft Card Privacy** | Bản nháp có thể bị đọc bởi khách lạ | `GET /api/cards/[id]` yêu cầu xác thực tài khoản chủ sở hữu hoặc Admin nếu thiệp ở trạng thái `draft` | **ĐẠT (VERIFIED)** |
| **Card Publishing Ownership** | Bất kỳ ai cũng có thể xuất bản thiệp người khác | `POST /api/cards/[id]/publish` xác minh quyền sở hữu (`isCardOwner`) trước khi kích hoạt `published` | **ĐẠT (VERIFIED)** |
| **Host Header Poisoning** | Lấy host trực tiếp từ request header để sinh link và mã QR | Dùng `getSafeSiteUrl` ưu tiên `NEXT_PUBLIC_SITE_URL`, chỉ cho phép host hợp lệ | **ĐẠT (VERIFIED)** |
| **Guest Data Privacy** | Khách lạ xem được toàn bộ SĐT và ghi chú riêng của khách mời khác | Phân tách dữ liệu: ẩn SĐT và ghi chú riêng tư cho khách vãng lai; chỉ chủ thiệp hoặc Admin mới thấy | **ĐẠT (VERIFIED)** |
| **Ghost Card Elimination** | Hệ thống tự tạo thiệp rác vào database khi nhận slug lạ | Xóa bỏ `ensureCardForSlug`, trả về 404 cho thiệp không tồn tại, 403 cho thiệp chưa xuất bản | **ĐẠT (VERIFIED)** |
| **Server-Side Request Forgery (SSRF)** | Image proxy và AI xóa nền gọi tới mọi URL `http://` kể cả localhost và cloud metadata | Hàm `isSafeExternalUrl` chặn loopback (127.0.0.1, ::1), private IP (10.x, 192.168.x, 172.16-31.x), link-local (169.254.x), Google/AWS metadata | **ĐẠT (VERIFIED)** |
| **Payment Webhook Security** | Bỏ qua xác thực nếu chưa cấu hình token, thiếu chống replay, log nhạy cảm | Bắt buộc token trên production, dùng `timingSafeEqual`, lưu vết Idempotency trong 24 giờ chống gửi lặp | **ĐẠT (VERIFIED)** |
| **CSV Formula Injection (CWE-1236)** | Ký tự `=`, `+`, `-`, `@` ở đầu ô khiến Excel thực thi mã độc | Hàm `sanitizeCsvField` tự động thêm dấu nháy đơn `'` ở đầu trường và escape ngoặc kép chuẩn RFC 4180 | **ĐẠT (VERIFIED)** |
| **File Upload Security** | Cho phép upload không đăng nhập, thiếu whitelist định dạng | Bắt buộc đăng nhập, giới hạn 10MB, whitelist ảnh (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`), cách ly theo folder `userId` | **ĐẠT (VERIFIED)** |
| **Path Traversal on Storage** | Xóa file dựa trên đường dẫn client gửi | Sử dụng `path.basename` và cách ly theo thư mục `userId` của tài khoản | **ĐẠT (VERIFIED)** |
| **Input Validation & Anti-Spam** | Thiếu kiểm tra độ dài và định dạng SĐT, dễ bị spam bot | Kiểm tra regex số điện thoại Việt Nam, giới hạn độ dài tên và lời chúc, đặt bẫy honeypot cho bot | **ĐẠT (VERIFIED)** |

---

## 2. CHỨNG MINH KẾT QUẢ KIỂM THỬ AN NINH

Tất cả các cơ chế bảo mật trên đã được kiểm thử tự động và xác minh qua:
1. `src/lib/__tests__/securityAndAuth.test.ts` (8 unit test bảo mật riêng biệt)
2. `scripts/test-all-qa.mjs` (21 kịch bản API an ninh mạng)
3. `scripts/e2e-check.mjs` (13 kịch bản End-to-End)
