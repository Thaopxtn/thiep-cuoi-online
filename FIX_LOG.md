# NHẬT KÝ CHI TIẾT CÁC THAY ĐỔI & VÁ LỖI (FIX LOG)
**Dự án:** THIEPCUOIONLINE (ZenLove Wedding)  
**Nhánh:** `fix/production-hardening`  
**Ngày thực hiện:** 12/10/2026  

---

## 1. DANH SÁCH FILE ĐÃ THAY ĐỔI & MỤC ĐÍCH

### 1.1. Module An Ninh Mạng & Xác Thực Mới
1. **`src/lib/securityUtils.ts` (MỚI)**
   - Hàm `isPrivateIp(ip)`: Xác định các dải mạng riêng tư (RFC 1918, RFC 3927 link-local, loopback, CGNAT, cloud metadata).
   - Hàm `isSafeExternalUrl(url)`: Ngăn chặn SSRF cho các tác vụ tải dữ liệu từ URL bên ngoài.
   - Hàm `sanitizeCsvField(val)`: Khắc phục lỗ hổng CSV Formula Injection (CWE-1236) bằng cách thoát các tiền tố nguy hiểm (`=`, `+`, `-`, `@`, `\t`, `\r`).
   - Hàm `getSafeSiteUrl(requestHost)`: Lấy URL ứng dụng chính xác, chống tấn công Host Header Poisoning.

2. **`src/lib/serverAuth.ts` (MỚI)**
   - `verifyUserAuth(request)`: Xác minh access token Bearer trực tiếp với Supabase Auth (`/auth/v1/user`), cache 60s để tối ưu hiệu năng.
   - `verifyAdminAuth(request)`: Xác thực Quản trị viên qua HMAC-SHA256 session token có chữ ký bí mật hoặc API Key.
   - `generateAdminSessionToken()`: Tạo token HMAC phiên làm việc có gắn timestamp và chữ ký số.
   - `checkAdminRateLimit(ip)` / `recordAdminFailedAttempt(ip)`: Bộ điều phối Rate Limiting chống Brute-force mã PIN (tối đa 5 lần thử/10 phút).
   - `isCardOwner(card, verifiedUserId)`: Xác thực quyền sở hữu đa người dùng (Multi-tenant BOLA protection).

---

### 1.2. Bảo Mật Toàn Bộ API Quản Trị Viên (Admin APIs)
3. **`src/app/api/admin/verify/route.ts`**
   - Loại bỏ hoàn toàn mã PIN mặc định `zenlove8888` trên môi trường Production.
   - Tích hợp Rate Limiting (HTTP 429 khi thử sai quá 5 lần).
   - Cấp token HMAC có chữ ký bảo mật thay vì fake token base64 không an toàn.
   - Bổ sung method `GET` để frontend kiểm tra tính hợp lệ của token hiện tại.

4. **`src/app/api/admin/cards/route.ts`**
   - Áp dụng `verifyAdminAuth` cho `GET`, `PATCH`, `DELETE`.
   - Trả về HTTP 401 khi không có quyền Quản trị viên hợp lệ.
   - Bảo vệ an toàn quyền xóa và thay đổi trạng thái thiệp trên toàn hệ thống.

5. **`src/app/api/admin/activities/route.ts`**
   - Áp dụng `verifyAdminAuth` cho `GET` (ngăn lộ vết duyệt web của người dùng).
   - Khử trùng (sanitize) và kiểm tra quyền trong `POST` nếu khai báo `actorType: 'admin'`.

6. **`src/app/api/admin/rsvps/route.ts`**
   - Áp dụng `verifyAdminAuth` cho `GET` và `DELETE`.
   - Ngăn chặn việc thu thập trái phép thông tin liên hệ của khách mời toàn sàn.

7. **`src/app/api/admin/wishes/route.ts`**
   - Áp dụng `verifyAdminAuth` cho `GET` và `DELETE`.

8. **`src/app/api/admin/users/route.ts`**
   - Áp dụng `verifyAdminAuth` cho `GET` (chặn trích xuất danh sách email và tài khoản).

9. **`src/app/api/admin/stats/route.ts`**
   - Áp dụng `verifyAdminAuth` cho `GET`.

10. **`src/app/api/admin/health/route.ts`**
    - Áp dụng `verifyAdminAuth` cho `GET`, bảo vệ thông tin endpoint cơ sở hạ tầng.

---

### 1.3. Bảo Vệ Quyền Sở Hữu Thiệp & Chống IDOR/BOLA
11. **`src/app/api/cards/route.ts`**
    - `GET`: Người dùng đăng nhập chỉ xem thiệp của chính mình; chặn khách vãng lai dò tìm thiệp bằng tham số `?userId=`.
    - `POST`: Gán `userId` từ danh tính đã xác minh trên server, chặn client tự gửi `userId` giả mạo.

12. **`src/app/api/cards/[id]/route.ts`**
    - `GET`: Chặn khách xem thiệp ở trạng thái `draft` (chỉ chủ thiệp hoặc Admin mới được xem nháp).
    - `PUT`: Xác minh quyền sở hữu (`isCardOwner`), cấm tài khoản A sửa thiết kế của tài khoản B, bảo toàn trường `userId`.
    - `DELETE`: Xác minh quyền sở hữu, ngăn tài khoản A xóa thiệp của tài khoản B.

13. **`src/app/api/cards/[id]/publish/route.ts`**
    - Xác minh quyền sở hữu thiệp trước khi cho phép chuyển sang trạng thái `published`.
    - Sử dụng `getSafeSiteUrl` để sinh link chia sẻ và mã QR an toàn, chống Host Header Injection.

14. **`src/app/api/cards/clone/route.ts`**
    - Lấy `userId` từ phiên đăng nhập đã xác minh, chặn giả mạo tài khoản khi clone mẫu.

15. **`src/app/api/cards/[id]/export/route.ts` & `src/app/api/cards/export-all/route.ts`**
    - Bắt buộc xác thực danh tính chủ thiệp trước khi xuất file CSV.
    - Áp dụng `sanitizeCsvField` ngăn chặn lỗ hổng CSV Formula Injection.

---

### 1.4. Bảo Vệ Dữ Liệu Khách Mời & Khắc Phục Lỗi Chức Năng
16. **`src/app/api/show/[slug]/rsvp/route.ts`**
    - Tách biệt dữ liệu: Khách công cộng chỉ xem tên và số khách tham dự; SĐT và ghi chú bị ẩn trừ khi chủ thiệp đăng nhập xem.
    - Loại bỏ hàm `ensureCardForSlug` tự tạo thiệp ma (ghost cards). Trả về 404 cho slug không tồn tại.
    - Bổ sung schema validation: kiểm tra độ dài tên (2-100 ký tự), format SĐT Việt Nam hợp lệ.

17. **`src/app/api/show/[slug]/wishes/route.ts`**
    - Loại bỏ việc tự sinh thiệp ma; yêu cầu thiệp phải tồn tại và đã xuất bản.
    - Validation nội dung lời chúc (2-1000 ký tự) và bẫy honeypot chống bot.

18. **`src/app/api/proxy-image/route.ts` & `src/app/api/tools/remove-bg/route.ts`**
    - Tích hợp `isSafeExternalUrl` chống SSRF, chặn IP nội bộ và cloud metadata.
    - Giới hạn dung lượng tối đa 10MB và timeout 6s.

19. **`src/app/api/webhook/payment/route.ts`**
    - Bắt buộc cấu hình secret trên Production, so sánh bằng `timingSafeEqual`.
    - Thêm bộ nhớ đệm Idempotency chống replay attack trong 24 giờ.

20. **`src/app/api/upload/route.ts`**
    - Bắt buộc đăng nhập, giới hạn kích thước 10MB, whitelist extension và MIME types ảnh, cách ly theo `userId`.

21. **`src/lib/serverDb.ts`**
    - Thêm cơ chế graceful retry cho `upsertCardToDb`: khi Supabase schema cache chưa nhận diện `user_id` (`PGRST204`), tự động lưu qua metadata an toàn, không làm crash ứng dụng.

---

### 1.5. Sửa Lỗi Giao Diện, React Hooks & Cấu Hình ESLint
22. **`src/components/templates/CreateTemplateModal.tsx`**
    - Đưa `useState` lên đầu component trước lệnh early return, tuân thủ nghiêm ngặt React Rules of Hooks.

23. **`src/components/modules/StoryQuoteModule.tsx` & `src/components/templates/ExportTemplateModal.tsx`**
    - Thoát các ký tự nháy kép chưa escape trong JSX.

24. **`src/app/admin/page.tsx` & các component Admin tab**
    - Đồng bộ `Authorization: Bearer <token>` trên mọi lệnh gọi API Admin.
    - Kiểm tra session server-side trên hook mount, tự động đăng xuất khi hết hạn.

25. **`supabase_production_migration.sql` (MỚI)**
    - Script migration an toàn có thể rollback, thiết lập chuẩn RLS cho `cards`, `rsvps`, `wishes`.

---

### 1.6. Cải Tiến Bộ Kịch Bản Kiểm Thử QA & E2E
26. **`scripts/test-all-qa.mjs` & `scripts/e2e-check.mjs`**
    - Sửa các test: assert HTTP 401 khi khách gọi API Admin.
    - Tích hợp kiểm thử SSRF, quyền riêng tư khách mời, chống ghost card.
    - Tính toán tỷ lệ pass rate động, không hardcode số liệu báo cáo.
27. **`src/lib/__tests__/securityAndAuth.test.ts` (MỚI)**
    - Bổ sung 8 unit tests kiểm thử an ninh: SSRF, CSV sanitization, HMAC tokens, BOLA checks, Rate limiter.
