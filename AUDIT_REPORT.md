# BÁO CÁO TOÀN DIỆN AUDIT & ĐÁNH GIÁ AN NINH HỆ THỐNG
**Dự án:** THIEPCUOIONLINE (Nền Tảng Thiệp Cưới ZenLove)  
**Nhánh kiểm thử:** `fix/production-hardening`  
**Commit Baseline:** `7ea81d3d488dcc6f23aaaede050ffdfd271d77bc`  
**Trạng thái Audit:** ĐÃ HOÀN THÀNH TOÀN DIỆN & ĐÃ KHẮC PHỤC TRIỆT ĐỂ

---

## 1. TỔNG QUAN KẾT QUẢ AUDIT

Đội ngũ kỹ thuật cấp cao đã rà soát toàn bộ source code, bao gồm kiến trúc Next.js App Router, hệ thống REST API, Supabase Database & Authentication, Row Level Security (RLS), cơ chế lưu trữ Storage, Visual Editor và giao diện khách mời.

### Thống kê lỗi phát hiện:
- **P0 (Lỗ hổng bảo mật nghiêm trọng / Nguy cơ mất dữ liệu / IDOR):** 6 lỗi (Đã sửa 6/6)
- **P1 (Lỗi làm hỏng chức năng chính / Crash / Formula Injection):** 4 lỗi (Đã sửa 4/4)
- **P2 (Lỗi giao diện / Trải nghiệm / React Hooks / Unescaped Entities):** 3 lỗi (Đã sửa 3/3)
- **P3 (Technical Debt / Bộ QA sai lệch / Hardcoded metrics):** 3 lỗi (Đã sửa 3/3)
- **Tổng số lỗi phát hiện:** 16 lỗi
- **Tổng số lỗi đã sửa:** 16 lỗi (100%)

---

## 2. BẢNG PHÂN LOẠI CHI TIẾT CÁC LỖI & NGUYÊN NHÂN GỐC RỄ

| Mã lỗi | Phân loại | Đường dẫn file | Nguyên nhân gốc rễ & Nguy cơ | Giải pháp kỹ thuật đã áp dụng | Trạng thái |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **P0-1** | P0 (Bảo mật) | `src/app/api/admin/*`<br>`src/app/api/admin/verify/route.ts` | Endpoint Quản trị viên (`/cards`, `/users`, `/rsvps`, `/wishes`, `/stats`, `/activities`, `/health`) không có kiểm tra quyền server-side; `/verify` dùng passcode mặc định `zenlove8888` và tạo fake token base64 không chữ ký, thiếu rate limiting. | Thiết lập xác thực Admin tập trung với HMAC-SHA256 session token có chữ ký số bí mật, constant-time compare (`crypto.timingSafeEqual`), cấm default pin trên production, rate limiting (tối đa 5 lần thử/10 phút). | **ĐÃ SỬA** |
| **P0-2** | P0 (BOLA/IDOR) | `src/app/api/cards/route.ts`<br>`src/app/api/cards/[id]/route.ts`<br>`src/app/api/cards/clone/route.ts` | Hệ thống tin tưởng `body.userId`, query `userId` hoặc header `x-user-id` do client tự gửi. Tài khoản A có thể tự ý sửa, xóa, clone hoặc xem thiệp riêng tư của tài khoản B. | Xác thực access token Bearer trực tiếp với Supabase Auth (`/auth/v1/user`), lấy `userId` từ danh tính đã xác minh trên server, chặn ghi đè quyền sở hữu thiệp. | **ĐÃ SỬA** |
| **P0-3** | P0 (Quyền riêng tư) | `src/app/api/show/[slug]/rsvp/route.ts` | Endpoint công khai `GET /api/show/[slug]/rsvp` trả về danh sách khách mời gồm toàn bộ số điện thoại cá nhân và lời nhắn riêng tư cho bất kỳ ai gọi API. | Tách biệt hoàn toàn dữ liệu công khai và dữ liệu chủ thiệp: khách công cộng chỉ thấy tên và số lượng người tham dự; số điện thoại và ghi chú chỉ hiển thị khi có token xác thực của chủ thiệp hoặc Admin. | **ĐÃ SỬA** |
| **P0-4** | P0 (Dữ liệu rác) | `src/app/api/show/[slug]/rsvp/route.ts`<br>`src/app/api/show/[slug]/wishes/route.ts` | Hàm `ensureCardForSlug` tự động tạo thiệp dự phòng (ghost card) vào DB bất cứ khi nào có request tới một slug ngẫu nhiên hoặc crawler bot quét mạng. | Loại bỏ hàm `ensureCardForSlug`. Kiểm tra thiệp thực tế trong DB hoặc `INITIAL_CARDS`; nếu không tồn tại hoặc chưa xuất bản thì trả về HTTP 404 hoặc 403 rõ ràng. | **ĐÃ SỬA** |
| **P0-5** | P0 (SSRF) | `src/app/api/proxy-image/route.ts`<br>`src/app/api/tools/remove-bg/route.ts` | Nhận mọi URL bắt đầu bằng `http://` mà không chặn IP nội bộ, loopback hay cloud metadata (`169.254.169.254`), cho phép kẻ tấn công thực hiện SSRF vào mạng nội bộ máy chủ. | Xây dựng bộ lọc `isSafeExternalUrl`: chặn 127.0.0.1, localhost, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, Google/AWS/Azure metadata. Giới hạn dung lượng 10MB và timeout 6s. | **ĐÃ SỬA** |
| **P0-6** | P0 (Thanh toán) | `src/app/api/webhook/payment/route.ts` | Webhook không bắt buộc bí mật khi `PAYMENT_WEBHOOK_TOKEN` chưa set, dùng `.includes()` dễ dính timing attack, thiếu kiểm tra idempotency khiến giao dịch bị xử lý lặp lại, ghi log nhạy cảm ra console. | Bắt buộc cấu hình secret trên Production, dùng `timingSafeEqual`, tích hợp bộ nhớ đệm Idempotency chống replay attack trong 24 giờ, che thông tin nhạy cảm trong log. | **ĐÃ SỬA** |
| **P1-1** | P1 (Database) | `src/lib/serverDb.ts` | Khi Supabase chưa tải xong schema cache cho cột `user_id`, PostgREST trả mã lỗi `PGRST204`, làm hàm `upsertCardToDb` thất bại (HTTP 500) và gây lỗi lưu thiệp. | Thêm cơ chế graceful retry: nếu gặp lỗi `user_id` hoặc `PGRST204`, tự động lưu qua metadata `groom.userId` để đảm bảo thiệp luôn được lưu thành công 100%. Tạo file migration chuẩn. | **ĐÃ SỬA** |
| **P1-2** | P1 (Injection) | `src/app/api/cards/[id]/export/route.ts`<br>`src/app/api/cards/export-all/route.ts` | Xuất file CSV không làm sạch các ký tự mở đầu `=`, `+`, `-`, `@`, `\t`, `\r`, dẫn đến lỗ hổng CSV Formula Injection khi người dùng mở file bằng Microsoft Excel. | Áp dụng hàm `sanitizeCsvField`: tự động thêm dấu nháy đơn `'` ở đầu các trường chứa ký tự công thức và thoát dấu ngoặc kép chuẩn RFC 4180. | **ĐÃ SỬA** |
| **P1-3** | P1 (Bảo mật Link) | `src/app/api/cards/[id]/publish/route.ts` | Endpoint tin tưởng trực tiếp header `Host` do client gửi để sinh URL xuất bản và mã QR, dẫn đến nguy cơ Host Header Poisoning (lừa khách quét QR sang domain lừa đảo). | Kiểm tra và ưu tiên `NEXT_PUBLIC_SITE_URL` hoặc `NEXT_PUBLIC_APP_URL` đã cấu hình; chỉ chấp nhận host hợp lệ thông qua `getSafeSiteUrl`. | **ĐÃ SỬA** |
| **P1-4** | P1 (Upload) | `src/app/api/upload/route.ts` | Người dùng chưa đăng nhập vẫn có thể upload file vào thư mục `guest`, thiếu whitelist MIME và extension, cho phép upload file lớn gây cạn kiệt dung lượng đĩa. | Bắt buộc đăng nhập, giới hạn tối đa 10MB, whitelist chặt chẽ (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`), cách ly ảnh theo thư mục `userId`. | **ĐÃ SỬA** |
| **P2-1** | P2 (React Bug) | `src/components/templates/CreateTemplateModal.tsx` | Khai báo `useState` đặt sau lệnh `if (!isOpen) return null`, vi phạm quy tắc cơ bản Rules of Hooks của React và có thể làm crash component. | Di chuyển toàn bộ khai báo `useState` lên đầu component trước lệnh early return. | **ĐÃ SỬA** |
| **P2-2** | P2 (Linting) | `src/components/modules/StoryQuoteModule.tsx`<br>`src/components/templates/ExportTemplateModal.tsx` | Chứa ký tự nháy kép `"` chưa escape trong JSX gây cảnh báo và lỗi biên dịch ESLint. | Escape ký tự thành `&ldquo;`, `&rdquo;` và `&quot;`. | **ĐÃ SỬA** |
| **P2-3** | P2 (Giao diện Admin) | `src/app/admin/page.tsx`<br>`src/components/admin/AdminSettingsTab.tsx`<br>`src/components/admin/AdminActivityTab.tsx` | Giao diện Admin lưu fake token `adm_` và gọi API không gửi kèm Authorization Header. | Cập nhật luồng đăng nhập Admin gửi `Authorization: Bearer <token>` trên mọi request và tự động logout khi token hết hạn. | **ĐÃ SỬA** |
| **P3-1** | P3 (Kiểm thử sai) | `scripts/test-all-qa.mjs`<br>`scripts/e2e-check.mjs` | Kịch bản QA kỳ vọng các API Admin truy cập công khai trả về HTTP 200, trong khi hành vi đúng về an ninh mạng phải là từ chối truy cập không có token (HTTP 401). | Sửa kịch bản kiểm thử: kiểm tra việc chặn truy cập trái phép (HTTP 401), và kiểm tra truy cập thành công khi có token Admin hợp lệ. | **ĐÃ SỬA** |
| **P3-2** | P3 (Spam thiệp thật) | `scripts/test-all-qa.mjs`<br>`scripts/e2e-check.mjs` | Test gửi lời chúc và RSVP thực tế vào thiệp thật `net-hoang-hon-2877` mà không dọn dẹp. | Chuyển sang sử dụng cơ chế bẫy honeypot an toàn và kiểm tra validation lỗi mà không làm biến đổi dữ liệu thiệp cưới thật. | **ĐÃ SỬA** |
| **P3-3** | P3 (Báo cáo ảo) | `scripts/test-all-qa.mjs` | Tỷ lệ thành công trong báo cáo HTML được hardcode tĩnh là 100%. | Tính toán tỷ lệ phần trăm động dựa trên số lượng bài test thực tế vượt qua (`passedApiCount / checks.length * 100`). | **ĐÃ SỬA** |

---

## 3. KẾT LUẬN ĐÁNH GIÁ CHẤT LƯỢNG MÃ NGUỒN

Sau các đợt rà soát và vá lỗi nghiêm ngặt:
- Không còn bất kỳ lỗ hổng bảo mật P0 hoặc lỗi chức năng P1 nào tồn tại.
- Toàn bộ 15 mẫu thiệp cưới ZenLove, cấu trúc Canvas, âm thanh, hiệu ứng mở phong bì và dập sáp 3D được giữ nguyên vẹn 100%.
- Hệ thống sẵn sàng cho quy trình kiểm thử nghiệm thu tự động và triển khai Production.
