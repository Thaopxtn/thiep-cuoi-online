# Prompt tiếp tục phát triển công cụ tạo thiệp ZenLove

Dán nội dung bên dưới vào Antigravity sau khi mở workspace `D:\luufilelaptrinh\thiepcuoiba`.

---

Bạn tiếp tục làm việc trên dự án ZenLove hiện có. Mục tiêu là **hoàn thiện và sửa độ tin cậy của công cụ tạo thiệp**, từ chọn mẫu, tạo bản sao riêng, chỉnh sửa, lưu, tải lại, xem trước đến xuất bản và xem thiệp trên thiết bị khác.

Hãy thực hiện sửa mã và kiểm chứng, không dừng ở phân tích hoặc viết kế hoạch. Chưa cần phát triển thêm tính năng mới trước khi luồng cốt lõi hoạt động đúng.

## Đọc trước khi sửa

1. `AGENTS.md`: quy ước của dự án.
2. `docs/antigravity/README.md`: điểm bắt đầu và phạm vi bàn giao.
3. `docs/antigravity/BASELINE.md`: kết quả kiểm tra thực tế, giới hạn môi trường.
4. `docs/antigravity/CONTEXT.md`: luồng dữ liệu và vị trí mã nguồn.
5. `docs/antigravity/TASKS.md`: các vấn đề đã thấy trong code, thứ tự xử lý, tiêu chí hoàn thành.
6. `docs/antigravity/TEST_PLAN.md`: kiểm thử hồi quy và nghiệm thu giao diện.

Các tài liệu được ghi ngày 27/10/2026, dựa trên HEAD `5409db1631def4f01cae89d6c74c1b68b4391a95` **cùng toàn bộ thay đổi chưa commit**. Số dòng là mốc tìm kiếm, phải kiểm tra lại code hiện tại. Phát hiện đọc code chưa đồng nghĩa đã tái hiện qua trình duyệt.

## Yêu cầu thực hiện

- Chạy `git status` và đọc diff liên quan trước. Giữ các thay đổi hiện có, kể cả file chưa được Git theo dõi. Không reset, clean, checkout đè hoặc thay thế toàn bộ editor.
- Ưu tiên E01–E04: snapshot khi lưu và bảo toàn trường dữ liệu → round-trip DB/DTO → draft/publish → tải lại thiệp bằng dữ liệu server. Sau đó E05–E07: Undo/Redo, preview đồng nhất, UI/layout.
- Với mỗi lỗi: xác nhận đường đi thực tế, thêm regression test có ý nghĩa, sửa nguyên nhân, chạy kiểm tra phù hợp, cập nhật `docs/antigravity/PROGRESS.md`.
- Tách cập nhật local cache khỏi mutation network. Một lần lưu logic không tự phát sinh nhiều PUT giống nhau; xử lý request hoàn tất sai thứ tự và thay đổi mới phát sinh khi đang lưu.
- Dùng snapshot đầy đủ, nhất quán cho `nodes` và thông tin thiệp. Bảo toàn trường tùy chỉnh, giá trị `false`, mảng rỗng do người dùng chủ động xóa và trường chưa biết của dữ liệu cũ.
- Thiệp mới clone là `draft`. Save/preview không tự xuất bản; sửa thiệp đã xuất bản không tự thay đổi trạng thái. Chỉ hiển thị link/QR như đã xuất bản thành công sau khi server xác nhận.
- Phân biệt `card.id`, `card.slug`, `templateId` và slug của mẫu. Editor phải mở đúng thiệp đã lưu khi localStorage chưa có dữ liệu.
- Preview và trang khách phải phản ánh cùng nội dung: nodes, module cố định, album, câu chuyện, nhạc, phong bì, hiệu ứng và các công tắc hiển thị.
- Giữ auth/ownership, không dùng `x-user-id` hay profile local thay cho Bearer token đã xác minh. Không lấy Public DTO làm bản ghi gốc của editor.
- Tận dụng component, catalog, renderer và helper hiện có. Chỉ refactor phần cần thiết cho lỗi đang xử lý; giữ phong cách giao diện hiện tại và hỗ trợ desktop/mobile.

## Giới hạn phạm vi

Tập trung `src/app/design-template/[id]/page.tsx`, `src/components/editor/*`, services/types/DTO/API lưu thiệp, đường vào từ templates/wizard và renderer trang show khi liên quan trực tiếp. Không chuyển sang làm landing page, đối tác, check-in, dashboard, sổ tiền mừng hoặc nâng cấp dependency hàng loạt.

Không ghi đè dữ liệu khách, file `src/data/cards-local-db.json`, backups hoặc cache mẫu. Chỉ dùng thiệp/tài khoản thử nghiệm riêng cho thao tác ghi. Không chép `.env.local`, token, khóa hoặc nội dung dữ liệu khách vào báo cáo. Không deploy, push, áp migration lên DB đang dùng hoặc xuất bản thiệp khách trong quá trình sửa.

## Kiểm chứng và kết quả bàn giao

- Chạy nhóm test liên quan sau từng phần; chạy `npm test` và `npm run build` sau khi sửa xong luồng cốt lõi.
- Baseline build đã pass; build hiện bỏ qua lint. Unit baseline sau workaround thư mục tạm: **231 pass / 1 fail**, test còn lại phụ thuộc DNS công khai bị `ENOTFOUND` trong môi trường bàn giao. Không vô hiệu hóa bảo vệ SSRF hoặc bỏ test để biến báo cáo thành xanh.
- `npm run test:e2e` và `npm run test:all` là API smoke/QA, cần server cổng 3005; chúng không thay kiểm thử kéo thả editor trong browser.
- Kiểm thử browser thật tối thiểu: clone → sửa nhiều trường → autosave/manual save → reload → mở bằng context mới → preview → publish → khách xem đúng link. Thử cả 401, 500, offline và mạng chậm; chỉ báo pass khi đã thực sự chạy.
- Báo cáo cuối: lỗi nào đã sửa và bằng chứng, file đã đổi, lệnh và kết quả kiểm tra, link/ảnh kiểm chứng UI nếu có, việc còn lại. Phân biệt lỗi ứng dụng, giới hạn môi trường và phần chưa kiểm chứng.

Bắt đầu bằng kiểm tra trạng thái workspace và xử lý E01. Nếu môi trường thiếu tài khoản/token hoặc dịch vụ, tiếp tục sửa và test bằng mock transport/storage có kiểm soát; ghi rõ phần nghiệm thu thật chưa chạy, không giả lập thành công lên UI sản phẩm.
