# Prompt tiếp tục hoàn thiện ZenLove

> Cập nhật 09/11/2026: đọc mục mới nhất `docs/CONTINUATION_PROGRESS.md` trước. QR check-in đã decode camera/ảnh/link, viewer có mã điểm danh SVG local, Bulk invitations dùng CRM thật với stable IDs và legacy import rõ ràng. Mốc mới: **532 unit tests/62 files, 45 browser tests đạt +1 skip, 21 API +22 HTTP E2E, production build QA 228 trang**; còn 134 cảnh báo ảnh. Ba lỗi hosting camera/cache HTML/iframe đã sửa. Người dùng đã yêu cầu đưa lên web và chọn **Vercel**, không cần hỏi lại quyền triển khai; phải có kết nối Vercel khả dụng, xác minh schema Supabase bằng script read-only/staging và build lại với env thật. Không dùng `.next` QA cổng 3016 để deploy. Không viết lại các nhóm đã kiểm chứng; ưu tiên hạ tầng thật và thử camera trên thiết bị thật.

> Cập nhật 08/11/2026: đọc mục mới nhất của `docs/CONTINUATION_PROGRESS.md`, `docs/ENGINEERING_STANDARDS.md` và `design-system/zenlove/MASTER.md`. Quy chuẩn, tokens và các tương tác dùng chung đã được chuẩn hóa. Mốc mới: `npm run check` đạt 445 tests/58 files; production build QA đạt 228 trang; 13 UI tests đạt trên production build, 1 skip viewport sweep trùng. Còn 134 cảnh báo ảnh. Không viết lại các nhóm đã đạt; ưu tiên staging thực và mở rộng áp dụng thành phần chung theo từng luồng. `.next` hiện là build với khóa/origin QA, không dùng để triển khai thật.

> Cập nhật 04/11/2026: đọc `docs/CONTINUATION_PROGRESS.md` trước khi thực hiện các mục bên dưới. Những lỗi lưu/VIP, RSVP/CRM/check-in và editor trong prompt này đã có bản sửa và regression local; ưu tiên kiểm chứng Supabase staging thật và các phần còn mở trong tài liệu tiến độ, tránh làm lại các nhóm đã đạt. Mốc mới: 396 unit tests, 10 browser tests, 21 API checks, 22 HTTP E2E; chưa triển khai production.

Dán nội dung bên dưới vào phiên làm việc tiếp theo khi mở dự án `D:\luufilelaptrinh\thiepcuoiba`.

---

Bạn tiếp tục hoàn thiện dự án thiệp cưới ZenLove hiện có. Hãy trực tiếp kiểm tra, sửa mã và kiểm chứng đến khi hoàn thành từng nhóm việc; không dừng ở đánh giá hoặc đề xuất kế hoạch. Ưu tiên độ tin cậy và khả năng vận hành của các chức năng đang có trước khi thêm tính năng mới.

## 1. Đọc hiện trạng và bảo toàn công việc

- Đọc `AGENTS.md`, `README.md`, `package.json`, trạng thái Git và diff liên quan trước khi sửa.
- Workspace có nhiều thay đổi chưa commit và file mới chưa tracked. Giữ nguyên chúng; không reset, clean, checkout đè, tự stash hoặc thay toàn bộ editor. Không mặc định bản trên GitHub mới hơn nội dung trong máy.
- Nếu còn tồn tại, đọc `test-reports/qa-report.json`, mục `repairVerification`, và `test-reports/qa-report.html`. Các báo cáo này nằm ngoài Git nên có thể không có trên máy khác.
- `ANTIGRAVITY_PROMPT.md` và `docs/antigravity/*` là tài liệu lịch sử ngày 27/10/2026. Đối chiếu lại với mã hiện tại; không lặp lại các sửa chữa đã xong hoặc coi mô tả fallback cũ là yêu cầu thiết kế mới.

Mốc kiểm chứng gần nhất ngày 03/11/2026:

- 304/304 unit tests, 42 test files.
- 21/21 API checks và 22/22 HTTP E2E.
- Build production và TypeScript đạt, tạo 228 trang.
- Lint không có lỗi, còn 151 cảnh báo.
- Schema và production migration đã chạy hai lần thành công trên PostgreSQL 13 tạm; có kiểm tra quyền truy cập thật bằng SQL.
- Trình duyệt đã kiểm chứng album giữ thứ tự sau tải lại và album chủ động để trống không tự phục hồi ảnh mẫu.
- DB local giữ nguyên trong đợt sửa gần nhất.

Đây là kết quả lịch sử, không phải cam kết mọi luồng đã được kiểm chứng trên production. Chưa áp migration lên Supabase thật, chưa triển khai code mới, chưa thử OAuth tài khoản thật hoặc giao dịch ngân hàng thật. Một số API vẫn trả được HTTP 200 khi sử dụng dữ liệu mẫu/local sau lỗi kết nối Supabase.

## 2. Ưu tiên đầu tiên: kiểm chứng tích hợp trên môi trường thử riêng

- Xác định môi trường và quyền kết nối hiện có. Dùng database, tài khoản và thiệp thử riêng; không ghi thử vào dữ liệu khách hàng.
- Đối chiếu `supabase_schema.sql`, `supabase_production_migration.sql` và cấu hình thực tế. Migration gồm quyền ghi chỉ qua API, cột check-in RSVP và trạng thái claim/processed của webhook.
- Kiểm tra migration chạy lặp được, không xóa dữ liệu; xác nhận thứ tự triển khai tương thích giữa schema và code. `scripts/test-database-security.sql` chỉ dùng trên DB thử và tự rollback fixture.
- Kiểm tra cấu hình admin, OAuth redirect, storage, webhook secret và tài khoản nhận VIP. Không in giá trị bí mật ra log hoặc đưa vào tài liệu/commit.
- Trên môi trường thử, xác minh tài khoản A không đọc/sửa/xóa thiệp nháp hoặc RSVP của B; client không thể tự cấp admin/VIP hoặc bỏ qua giới hạn bằng Supabase REST trực tiếp.
- Không tự push, xuất bản thiệp khách hoặc triển khai production từ prompt này. Nếu thiếu kết nối staging, hoàn thành các phần local độc lập, chuẩn bị thao tác triển khai cụ thể và nêu đúng phần chưa được xác minh.

## 3. Hoàn thiện luồng dữ liệu còn thiếu

Tái hiện trước khi sửa; đây là các điểm cần kiểm chứng, không phải kết luận rằng toàn bộ luồng đều đang hỏng:

- Trong `src/lib/weddingCardService.ts`, kiểm tra `addRsvp`, `addWish` và `deleteCard`: hiện còn đường cập nhật local rồi gửi request nền. Xác minh cách báo lỗi, rollback, chờ server xác nhận và đồng bộ ID do server tạo; tránh khách mời biến mất sau reload hoặc thao tác tiếp theo dùng nhầm ID local.
- Đối chiếu RSVP trong dashboard với Guest CRM và trang `/checkin/[slug]`. Trang check-in hiện vẫn dùng `guestManagementService` lưu local. Bảo toàn khách nhập tay, phân nhóm, phân bàn và dữ liệu cũ khi bổ sung đồng bộ; không thay toàn bộ CRM bằng RSVP làm mất chức năng hiện có.
- Kiểm tra một thiệp từ chọn mẫu → clone → sửa → autosave/manual save → tải lại → preview → publish → mở trên trình duyệt khác không có localStorage.
- Bảo toàn `false`, chuỗi rỗng, mảng rỗng, nodes, album, nhạc, hiệu ứng và các công tắc hiển thị. Không dùng Public DTO làm dữ liệu gốc của editor đã xác thực.
- Kiểm tra mất mạng, phiên hết hạn, refresh token, chuyển nhanh giữa các thiệp và response hoàn tất sai thứ tự. Không báo lưu/xóa/xuất bản thành công trước khi server xác nhận.
- Tái hiện webhook kích hoạt VIP đồng thời với một lần lưu nội dung thiệp. Kiểm tra lần lưu dùng snapshot cũ có làm mất trạng thái VIP mới hay không; xử lý tại nơi lưu dữ liệu nếu có race, thay vì chỉ sửa giao diện.
- Kiểm chứng retry webhook, hai lần gửi đồng thời, claim hết hạn và lỗi sau khi đã lưu nghiệp vụ nhưng chưa ghi processed. Chỉ dùng payload giả lập hoặc sandbox của nhà cung cấp.

## 4. Hiệu năng, chất lượng và kiểm thử

- Điều tra timeout Supabase và độ trễ API admin. Phân biệt dữ liệu thật, dữ liệu mẫu và cache; không che lỗi hạ tầng bằng một trạng thái thành công gây hiểu nhầm. Đo trước/sau trên cùng điều kiện, không suy diễn số đo localhost thành SLA production.
- Ưu tiên cảnh báo React hooks có thể gây stale state hoặc chạy request lặp. Không tắt rule hoặc đổi dependency array máy móc để làm sạch log.
- Tối ưu ảnh và bundle dựa trên trang/luồng đo được. Giữ hành vi canvas, export ảnh, ảnh bên ngoài, kích thước layout và giao diện mobile; không thay hàng loạt thẻ ảnh nếu chưa kiểm tra tác động.
- Thay các test chỉ mô phỏng lại thuật toán hoặc kiểm tra object tự tạo bằng test gọi hàm/route thật với dependency được mock, khi chúng chưa chứng minh hành vi cần bảo vệ.
- Bổ sung browser regression cho các luồng vừa sửa. Chạy thử ở desktop và mobile; lưu bằng chứng cho kết quả quan trọng.
- Chuẩn bị CI tối thiểu cho cài đặt theo lockfile, unit tests, lint và build. Kiểm tra tương thích Node giữa môi trường phát triển, test và Docker từ `engines` thực tế trước khi thay phiên bản. Không nâng dependency hàng loạt ngoài phạm vi lỗi đã chứng minh.

## 5. Cách làm và tiêu chí hoàn thành

- Chia việc theo các luồng nhỏ, có thể kiểm chứng độc lập. Có thể giao song song các phần không sửa cùng file; kiểm tra lại khi tích hợp.
- Tận dụng component, service, kiểu dữ liệu và phong cách giao diện hiện có. Không viết lại dự án hoặc thêm abstraction chỉ để đổi cách tổ chức mã.
- Mỗi lỗi cần có trigger rõ, nguyên nhân, bản sửa và regression test có ý nghĩa. Chạy kiểm tra rẻ nhất phù hợp trước, mở rộng khi thay đổi ảnh hưởng luồng chung.
- Unit tests phải tiếp tục dùng dữ liệu cô lập. Không ghi `src/data/cards-local-db.json`, dữ liệu khách, backups hoặc cloud DB đang dùng trong quá trình test.
- Dùng `npm test`, `npm run lint`, `npm run build`; chạy `npm run test:e2e`/`npm run test:all` khi server thử đã sẵn sàng. Các bộ HTTP hiện chủ yếu kiểm tra contract, honeypot và request bị từ chối; chúng không thay thế kiểm thử lưu thật trên staging hoặc thao tác trình duyệt.
- Không xóa hoặc sửa dữ liệu mẫu chỉ để ép test đạt; sửa assertion chỉ khi chứng minh kỳ vọng cũ không đúng hợp đồng chức năng.
- Sau mỗi nhóm việc, ghi ngắn gọn vào `docs/CONTINUATION_PROGRESS.md`: lỗi đã tái hiện, file đã sửa, kiểm tra đã chạy và kết quả, phần chưa xác minh, việc tiếp theo. Không chép thông tin đăng nhập hoặc dữ liệu cá nhân vào báo cáo.
- Báo cáo cuối cần phân biệt: đã sửa trong mã nguồn, đã kiểm chứng trên local/staging, và đã triển khai thực tế. Nêu lệnh kiểm tra, kết quả, rủi ro còn lại và bước triển khai chưa thực hiện. Không tuyên bố dự án hoàn thiện hoặc an toàn production chỉ vì unit test/build đạt.

Hãy bắt đầu bằng đối chiếu hiện trạng, chọn vấn đề có ảnh hưởng lớn nhất còn tái hiện được và thực hiện bản sửa đầu tiên ngay trong lượt làm việc này.
