# ZenLove — Nền tảng thiệp cưới online

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
- **Lõi Editor**: trình biên tập React, dữ liệu node và canvas riêng của dự án
- **Nén dữ liệu**: Client Canvas WebP Compressor, LZUTF8
- **Cơ sở dữ liệu**: Supabase PostgreSQL (REST API với Service Role Key)
- **Icons**: Lucide React

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

Quy ước chung nằm trong [ENGINEERING_STANDARDS.md](docs/ENGINEERING_STANDARDS.md); màu sắc, typography và thành phần giao diện theo [design system ZenLove](design-system/zenlove/MASTER.md). CSS tokens là nguồn màu duy nhất cho UI ứng dụng; thiết kế thiệp của người dùng giữ tùy chỉnh riêng.

`npm run check` chạy TypeScript strict, ESLint và unit tests. `npm run typecheck` kiểm tra kiểu riêng; lỗi React Hooks được coi là lỗi lint. Sau thay đổi dùng chung, chạy thêm `npm run build` và kiểm chứng giao diện trong trình duyệt.

1. Dùng Node.js **24.11.1** theo `.nvmrc`, rồi cài đúng lockfile:
```bash
npm ci
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

`NEXT_PUBLIC_SITE_URL` phải là origin HTTP(S), không kèm path, query, fragment hoặc thông tin đăng nhập. Metadata, canonical URL, robots và sitemap dùng chung giá trị này; cấu hình không hợp lệ sẽ báo lỗi rõ trong quá trình build.

3. Khởi tạo cơ sở dữ liệu trên Supabase:
- Mở mục **SQL Editor** trên Supabase Dashboard.
- Sao chép toàn bộ nội dung tệp [`supabase_schema.sql`](./supabase_schema.sql) và nhấn **Run**.
- Tiếp tục chạy [`supabase_production_migration.sql`](./supabase_production_migration.sql) để cấu hình quyền sở hữu, quyền ghi chỉ qua API, cột check-in RSVP và trạng thái xử lý webhook. Dự án đã cài đặt cũng cần chạy lại migration này trước khi dùng bản cập nhật; migration không xóa dữ liệu hiện có.
- Chạy tiếp [`supabase_card_write_migration.sql`](./supabase_card_write_migration.sql) rồi [`supabase_guest_crm_migration.sql`](./supabase_guest_crm_migration.sql) **trước khi triển khai code mới**. Hai RPC ghi nội dung/VIP khóa từng thiệp để giữ metadata máy chủ; bảng CRM riêng giữ nhóm, bàn, ghi chú và dấu xóa. Code cố ý báo lỗi nếu thiếu RPC/bảng, không quay về ghi toàn bộ snapshot cũ. Đối với hệ thống đang hoạt động, kiểm chứng thứ tự này trên staging và sao lưu trước khi áp dụng production.

4. Khởi chạy máy chủ phát triển:
```bash
npm run dev
```
Truy cập: `http://localhost:3005`

### Chạy Docker Compose

Điền `ADMIN_PASSCODE` và `ADMIN_SESSION_SECRET` riêng trong `.env.local` rồi chạy:

```bash
docker compose --env-file .env.local up --build -d
```

Compose yêu cầu hai biến này và không có mật khẩu quản trị mặc định. Nếu đã triển khai bằng các giá trị cũ trong repository, thay passcode và khóa phiên trước khi khởi động lại.

### Lời mời cá nhân và điểm danh QR

1. Chủ thiệp tạo khách trong CRM hoặc nhập ở **Gửi thiệp mời cá nhân hóa**. Hai màn hình dùng chung danh sách đã lưu trên máy chủ; không tự thêm khách mẫu. Danh sách gửi thiệp cũ trên thiết bị được giữ lại và có nút nhập riêng vào CRM.
2. Sao chép liên kết riêng của khách. Link có `guestId` và `cardId`, còn tên/bàn chỉ dùng để hiển thị. Khách mở thiệp đã xuất bản và chọn **Mã điểm danh** để trình hoặc tải mã QR.
3. Chủ thiệp mở `/checkin/[slug]`, chọn **Quét mã QR**. Có thể dùng camera, ảnh QR hoặc dán link khi camera không khả dụng. Mã được giải mã trên thiết bị; ảnh và khung hình không được gửi tới dịch vụ QR bên ngoài.
4. Máy chủ xác nhận lưu rồi mới hiện thông báo điểm danh thành công. Quét lại một khách đã đến không hủy điểm danh. Mã thiệp khác, khách đã xóa, ID trùng hoặc mã chỉ có tên đều không tự chọn khách; vẫn có thể tìm khách thủ công.

Mã QR là thông tin tra cứu khách, không phải quyền truy cập CRM hoặc bằng chứng xác thực danh tính. API điểm danh vẫn yêu cầu tài khoản chủ thiệp. QR/link cũ chỉ có `to=` tiếp tục mở lời mời cá nhân nhưng cần tìm khách thủ công tại sảnh.

Các nút Zalo/SMS/email mở nội dung soạn sẵn để người dùng tự gửi. Trạng thái **Đã gửi** được cập nhật bằng thao tác riêng sau phản hồi xác nhận của máy chủ.

### Bộ kiểm thử cục bộ

`src/data/cards-local-db.json` là dữ liệu chạy cục bộ, không đưa vào Git hoặc Docker build context. Bản có sẵn trên máy được giữ nguyên; một checkout mới sẽ bắt đầu với danh sách cục bộ rỗng và tạo file khi lưu ở chế độ offline. Môi trường dùng Supabase lưu dữ liệu qua database đã cấu hình.

`npm run test:ui` chạy các bài giao diện và bàn phím trên desktop/mobile bằng khóa QA giả, không cần PostgreSQL và không gửi xác thực tới dịch vụ thật. Cài browser bằng `npx playwright install chromium`; Windows có thể dùng Edge đã cài với `$env:PLAYWRIGHT_CHANNEL='msedge'` trước khi chạy. Bộ UI dùng Next dev riêng ở `127.0.0.1:3017`; không chạy đồng thời với build hoặc dev khác trên cùng checkout. Ảnh kiểm tra lưu trong `output/playwright/`, báo cáo trong `playwright-report/ui/`.

Để chạy cùng bộ UI trên bản production với khóa giả: `node scripts/testing/start-ui-qa-app.mjs build`, đặt `ZENLOVE_UI_APP_MODE=start`, rồi chạy `npm run test:ui`. Build này dùng origin QA `http://127.0.0.1:3017`; khi triển khai thật cần build lại với cấu hình tên miền và dịch vụ của môi trường đích.

Service worker v2 chỉ lưu tài nguyên tĩnh cùng origin được cho phép. API, HTML, dữ liệu RSC và các trang dashboard/admin/editor/thiệp luôn dùng mạng; HTML thiệp không còn được mở từ cache offline để tránh hiện lại thiệp đã ngừng xuất bản. Khi kích hoạt, worker dọn cache ZenLove v1 và giữ cache của ứng dụng khác.

`npm run test:e2e` kiểm tra HTTP, validation và quyền truy cập; các request ghi dùng honeypot hoặc dữ liệu không hợp lệ để không tạo khách mời hay mở VIP trên thiệp thật. Các luồng lưu, thanh toán và sửa RSVP được kiểm tra bằng unit/integration test với dữ liệu mô phỏng. Unit test persistence dùng filesystem trong bộ nhớ, không ghi `cards-local-db.json` hoặc Supabase.

Các lệnh QA đọc cấu hình quản trị từ `.env.local` hoặc biến môi trường. Báo cáo hiệu năng đo hết HTTP response, có timeout và phân biệt endpoint lỗi với endpoint chậm; chưa thay thế đo trải nghiệm trình duyệt.

GitHub Actions chạy `npm ci`, `npm test`, `npm run lint` và `npm run build` cho push/pull request bằng cùng phiên bản Node với Docker. CI không dùng thông tin đăng nhập production; unit và route tests dùng dependency được mock. Workflow chưa thay thế kiểm thử tích hợp trên staging.

API quản trị `/api/admin/health`, `/api/admin/stats` và `/api/admin/activities` trả HTTP 503 cùng `status: "degraded"` khi chưa xác nhận được dữ liệu từ database. Database rỗng nhưng kết nối thành công vẫn là dữ liệu hợp lệ. Health probe giới hạn 2,5 giây kể cả thời gian đọc body; kết quả cấu hình storage/webhook không có nghĩa là đã thử kết nối hai dịch vụ này.

### Kiểm thử lưu thật trong PostgreSQL riêng

Tạo một database thử cục bộ có tên bắt đầu bằng `zenlove_qa_`, dùng tài khoản có quyền tạo role/schema. Không dùng database ứng dụng. Ví dụ PowerShell (thay cổng/mật khẩu theo database thử):

```powershell
$env:ZENLOVE_QA_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/zenlove_qa_local'
npm run test:db
npx playwright install chromium
npm run test:browser
```

`test:db` bootstrap tài khoản giả, chạy bốn migration hai lần, kiểm tra RLS/quyền RPC, CRM/tombstone và hai thứ tự ghi đồng thời với lock thật. Fixture trong các script SQL được rollback; fixture race được dọn sau kiểm tra. Scripts từ chối host từ xa, database không có tiền tố QA và query override. `psql` cần có trong PATH; Windows có thể đặt `ZENLOVE_QA_PSQL_BIN` (database runner) và `ZENLOVE_QA_PSQL` (HTTP fixture) trỏ tới executable PostgreSQL.

`test:browser` khởi động adapter HTTP cục bộ ở 55433 và Next ở 3016, dùng tài khoản A/B cùng khóa giả công khai trong `scripts/testing/qa-env.mjs`. Adapter chuyển request sang PostgreSQL với role thật; đây là công cụ QA, không thay thế Supabase Auth/PostgREST. Tests chạy Chromium desktop/mobile: clone, autosave/manual save, tải lại, xuất bản, xem không cache, kiểm tra A/B, VIP đồng thời, CRM/check-in nhiều thiết bị và lỗi lưu. Ảnh ngoài được thay bằng fixture trong browser; không kiểm chứng CDN/storage/OAuth/ngân hàng thật.

Để kiểm thử production build: `node scripts/testing/start-qa-app.mjs build`, đặt `ZENLOVE_QA_APP_MODE=start`, rồi `npm run test:browser`. Nếu Windows thiếu bộ nhớ native khi biên dịch, thử `NODE_OPTIONS='--max-old-space-size=1024 --max-semi-space-size=16'`. Không chạy build QA đồng thời với Next dev trên cùng checkout.

GitHub Actions có job PostgreSQL 15 riêng chạy migration/RLS/race và browser regression trên production build với khóa giả. Cần xem kết quả workflow thực tế sau khi đẩy code; cấu hình CI trong repository chưa đồng nghĩa đã chạy trên GitHub. Báo cáo browser ở `playwright-report/`, bằng chứng ảnh ở `output/playwright/`, log SQL ở `test-reports/continuation-db.log`; các artifact này được Git bỏ qua.

Trước khi đưa code mới lên môi trường đích, chạy [`scripts/check-release-schema.sql`](scripts/check-release-schema.sql) trong SQL Editor hoặc `psql -X -v ON_ERROR_STOP=1 -f scripts/check-release-schema.sql`. Script chỉ đọc system catalogs trong transaction read-only để kiểm tra bảng/cột/RPC/RLS/grants, không đọc nội dung thiệp hoặc áp migration. Kết quả này không thay thế kiểm thử function body, logic RLS, Auth và lưu dữ liệu trên staging.

Khi server QA ở 3016 và HTTP fixture đang chạy, `node scripts/testing/run-http-qa.mjs all` / `e2e` chạy hai bộ HTTP cũ bằng thiệp tổng hợp tạm và tự dọn sau kiểm thử. Không sao chép nội dung thiệp khách vào database thử. Database đã cấu hình là nguồn ghi duy nhất, kể cả ở dev; chỉ chế độ offline không có database mới ghi file local.

---

## ☁️ Triển Khai Lên Vercel (Miễn Phí 100%)

1. Đẩy mã nguồn lên repository GitHub của bạn: [`https://github.com/Thaopxtn/thiep-cuoi-online`](https://github.com/Thaopxtn/thiep-cuoi-online)
2. Truy cập [Vercel](https://vercel.com/new) và nhấn **Import** dự án `thiep-cuoi-online`.
3. Trong phần **Environment Variables**, thêm các biến cấu hình từ `.env.local`.
4. Nhấn **Deploy**. Sau 1 phút website của bạn sẽ hoạt động chính thức trên toàn cầu.
