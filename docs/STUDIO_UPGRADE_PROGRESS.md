# Tiến độ nâng cấp ZenLove Studio

## Mục tiêu

Phát triển editor hiện có thành phần mềm thiết kế thiệp đồng bộ: tài liệu, layer, selection, history và renderer có hợp đồng rõ; thư viện/toolbar/inspector cùng design system; giữ dữ liệu và các luồng đang hoạt động.

Đọc `AGENTS.md`, `docs/ENGINEERING_STANDARDS.md`, `design-system/zenlove/MASTER.md` và `design-system/zenlove/pages/studio.md` trước mỗi đợt. Kiểm tra git status/diff; không ghi đè thay đổi mới của người dùng. Không chạy hai script untracked `scripts/xóa_update_ui_show.mjs` và `scripts/xóa_update_ui_templates.mjs`.

## Đợt 14–15/11/2026 — Nền tảng Studio

- Định hướng UI: studio sáng/trung tính, rose giữ nhận diện; tác phẩm giữ màu/font riêng.
- Đã đồng bộ header, rail, thư viện 288px và hai inspector 312px bằng token scoped trong `globals.css`. Header mobile hai hàng, đầy đủ undo/redo cả khoảng640–767px; thư viện mobile dùng Dialog chung, Escape/focus/inert. Bỏ dark-toggle chỉ đổi class mà không đổi toàn giao diện và phần trăm hoàn thiện không có cơ sở.
- Thanh viewport nằm trong cột canvas; popover phân lớp trên inspector, sheet mobile chừa chỗ cho viewport/navigation. Fit đọc kích thước tài liệu và vùng làm việc thật. Thanh định dạng có vùng cao cố định, không đẩy thiệp xuống sau khi chọn đối tượng.
- Node history dùng reducer/hook thuần, tối đa100 snapshot, bỏ bản trùng, cắt nhánh redo sau chỉnh sửa mới; command chạy một lần ngoài React updater. Undo/redo khôi phục selection đơn/đa, bỏ selection không còn tồn tại; giữ coordinator autosave và lưu metadata liên kết khi node snapshot không đổi.
- Phím Arrow/Delete/Backspace/Escape ở control không sửa canvas phía sau; Ctrl+S từ nút vẫn lưu được. Preview nhạc dừng khi đóng thư viện hoặc rời tab Nhạc.
- Đã chạy `npm run check`: **558 tests/65 files**, TypeScript/lint đạt; còn cảnh báo ảnh có sẵn. Build production QA đạt **228 trang**. Log: `test-reports/studio-check.log`, `studio-build.log`. Lượt browser đầu có48 đạt/2skip/2lỗi trong test Studio mới (locator textbox không phân biệt color input, bounding box đọc đúng lúc panel chuyển sang Dialog). Đã bổ sung nhãn textarea và chờ panel ổn định; kết quả xác nhận cuối sẽ bổ sung dưới đây. Không coi lượt có lỗi là toàn bộ browser đạt.

## Giới hạn cần làm tiếp

History hiện bao phủ **nodes**, chưa bao phủ toàn bộ metadata/modules của `WeddingCard`; chưa gộp kéo/resize thành một bước undo. Bộ font/color popover và các thẻ preset sâu vẫn còn cách viết cũ, cần chuyển sang hợp đồng typed và control dùng chung. Chưa hợp nhất renderer editor/preview/viewer hoặc chứng nhận WCAG toàn sản phẩm. Không thay thế toàn bộ mã hoạt động trong một lần.

## Kiểm chứng cuối 15/11/2026

- `npm run check`: **558/558 tests trong65 files**, TypeScript/lint đạt,134 cảnh báo ảnh có sẵn. Build bằng `node scripts/testing/start-qa-app.mjs build`: đạt228 trang với cấu hình QA giả. Không dùng bản `.next` này để phát hành trước khi build lại đúng cấu hình đích.
- Browser bằng Edge trên production build: xác nhận **50 case khác nhau đạt,2 skip có chủ đích** (hai viewport sweep chỉ chạy ở context desktop). Lượt đầy đủ cuối:49 đạt/2skip/1lỗi chờ CSS của test đăng nhập lúc server khởi động lạnh; thêm assertion chờ đúng một login trigger responsive rồi chạy lại test đó trên cả desktop/mobile:2/2 đạt. Không bật retry để che lỗi. Log: `test-reports/studio-browser.log`, `studio-browser-confirm.log`; lượt đầu có lỗi được giữ ở `studio-browser-first.log`.
- **5 case Studio đạt**: popup chuột/bàn phím/Escape và giữ selection; canvas không nhảy sau chọn; resize320/375/640/700/768/1024/1440px, thư viện Dialog trả focus; sửa chữ→undo→redo→save→reload, giữ màu/vị trí. Menu lưới được bấm thật khi sheet thuộc tính đang mở. Ảnh đã xem: `output/playwright/desktop-studio-1440.png`, `desktop-studio-workspace.png`, `mobile-studio-workspace.png`.
- Các case còn lại bao gồm save/publish, owner isolation, VIP đồng thời, CRM/RSVP/check-in, payment webhook giả lập, QR ảnh/camera giả lập và khả năng truy cập trang chủ. Chưa chạy lại SQL/HTTP CLI suites; chưa kiểm chứng OAuth, storage/CDN, ngân hàng thật hoặc thiết bị camera vật lý trong đợt này.
- SHA-256 của `customerCards.json`, `customerInvitations.ts`, `zenloveTemplates.ts` khớp đầu phiên; `cards-local-db.json` không tồn tại từ đầu và không bị tạo lại. Giữ nguyên hai script untracked của người dùng. Chưa commit/push/deploy. Bước ưu tiên tiếp theo là mục2 của lộ trình, tiếp tục bằng code có kiểm thử.
- Đã dừng Next QA, HTTP fixture và cluster PostgreSQL QA do phiên này mở. `git diff --check` đạt theo cấu hình Git hiện có. Không thay cấu hình Git của người dùng.

## Lộ trình tiếp theo theo thứ tự

1. Đọc kết quả kiểm chứng cuối của đợt shell/history dưới đây, xử lý vấn đề còn mở trước khi chuyển đợt. Các lượt tiếp theo không cần lặp lại kiểm tra đã đạt nếu không có thay đổi hoặc nghi vấn mới.
2. Đã có lõi typed cho node/layer, selection ID và command thêm/xóa/nhân bản/di chuyển/căn chỉnh trong đợt01:50 dưới đây. Còn hợp nhất toàn bộ WeddingCard/metadata/modules và gesture history; không đổi dữ liệu lưu khi chưa có adapter và migration an toàn.
3. Đồng bộ thanh định dạng và inspector fields, font/color controls và popover có focus đúng; bỏ control trùng, không để popup bị clip. Chuyển preset/module controls dần sang Studio tokens, giữ swatch của thiết kế.
4. Renderer dùng chung giữa editor, preview và viewer. Đối chiếu cùng một tài liệu ở ba chế độ; giữ album, nhạc, module, animation và responsive. Cần test round-trip dữ liệu và ảnh chụp trước/sau.
5. Hoàn thiện panel layers: tên, thứ tự, ẩn/khóa, chọn nhiều và phím tắt. Kiểm thử drag, bàn phím, resize và nhóm thao tác trong undo.
6. Regression đầy đủ save/reload/publish, VIP, RSVP/wishes, CRM và upload trên staging thật trước khi phát hành. Không coi fixture cục bộ là kiểm chứng OAuth/storage/thanh toán thật.

## Đợt lịch 01:50 ngày15/11/2026 — Lõi tài liệu và command

- Hạn mức đầu lượt cho phép làm việc (cửa sổ5giờ mới dùng1%); không tiêu thụ reset credit hoặc mua quota. Đọc lại trạng thái dirty của đợt trước, giữ toàn bộ thay đổi.
- Thêm `editorDocument.ts` với node/layer contract, type resolver, số hữu hạn và selection resolver dùng chung; `useEditorSelection` chỉ giữ ID/module, props luôn lấy từ tài liệu hiện tại. Node và fixed-module selection loại trừ nhau, nhiều toggle trong một batch giữ đúng thứ tự.
- `editorCommands.ts` xử lý insert/delete/duplicate/move/align thuần và bất biến. Sáu đường thêm mới đăng ký parent/ROOT, dùng ID UUID/random thay timestamp đơn lẻ; clone sâu dữ liệu mở rộng, bảo vệ ROOT/ID trùng, cập nhật nodes/linkedNodes của parent. Nhân bản nhóm không clone hậu duệ hai lần, không sửa graph gốc. Transform tôn trọng lock, layer khóa vẫn làm mốc căn chỉnh.
- Các thao tác keyboard một nhóm tạo đúng một history entry; selection không dùng props cũ sau align/undo. Sửa Shift-click bị toggle hai lần và click sau kéo nhóm làm mất selection. Browser đầu đã phát hiện toolbar dời bố cục che điểm click của layer tiếp theo; đổi control thu gọn thành nút ở cạnh phải, parent guide không chặn pointer toàn chiều ngang.
- Editor và public viewer đọc chung layer visibility/order; layer ẩn không hiện lại khi xem thiệp. Sửa các tọa độ/kích thước NaN do `Number(undefined) ?? fallback`, giữ0/numeric strings, giữ CSS height:auto và layer phẳng ngoài ROOT.nodes. Không đổi cấu trúc payload của API hoặc dữ liệu mẫu.
- Trước sửa, regression tái hiện 3 lỗi page (undo nhóm, ROOT refs khi copy/delete) và 1 lỗi renderer; lưu ở `studio-commands-before.log`, `studio-document-before.log`. Lượt browser đầu 7 đạt/1 skip/2 lỗi đã tái hiện công cụ dời bố cục chặn pointer; đã sửa và chạy lại toàn bộ, không dùng lượt có lỗi làm kết quả sạch.
- Kiểm chứng cuối: `npm run check` đạt **606/606 unit tests trong 67 files**, TypeScript/lint đạt (còn 134 cảnh báo ảnh có sẵn). Production QA build đạt **228 trang**. Toàn bộ browser Edge trên build cuối đạt **54/54 case chạy thực tế, 2 skip có chủ đích**, gồm 4 case command mới desktop/mobile, 5 case Studio cũ, lưu/xuất bản, VIP/CRM/RSVP/webhook và QR giả lập. Log: `test-reports/studio-command-check.log`, `studio-command-build.log`, `studio-command-browser.log`; báo cáo HTML đầy đủ ở `playwright-report/`.
- Unit regressions bao phủ group undo/redo branch, khóa vị trí, align rồi nudge với selection cũ, nhiều toggle trong một batch, hai lần thêm ảnh trong cùng timestamp, deep clone graph/falsy/custom data, ID trùng, cycle và finite/auto geometry ở cả editor/viewer. Browser bấm Shift chọn hai layer thật, di chuyển/undo một lần, tạo nhánh mới rồi lưu/reload; copy/delete qua context menu và đối chiếu ROOT từ API.
- QA database còn **0 thiệp** sau cleanup; SHA-256 ba file dữ liệu khớp đầu lượt, runtime DB không bị tạo lại, hai script untracked giữ nguyên. `git diff --check` đạt. Đã dừng riêng Next/HTTP fixture/PostgreSQL QA; không commit/push/deploy hoặc chạy migration production. Build `.next` vẫn dùng khóa/origin QA, cần build lại theo môi trường đích trước phát hành.
- Còn lại: history toàn bộ WeddingCard/modules, gesture kéo/resize coalescing, chuẩn hóa font/color/preset fields và phần renderer nội dung dùng chung; chưa xóa hết `any` trong các component cũ. Ưu tiên tiếp theo là mục 3 của lộ trình, song song chọn một lát cắt metadata/history có regression rõ. Không cần lặp lại toàn bộ kiểm tra đã đạt nếu code hoặc nghi vấn không đổi.

Mỗi đợt phải để lại một phần code sử dụng được, bằng chứng thực chạy, giới hạn và bước tiếp theo; không chỉ tạo kế hoạch hoặc thay màu hàng loạt.

## Lịch tiếp tục

### Phát hành ngày15/11

Studio đã được commit/push lên `Thaopxtn/thiep-cuoi-online` theo yêu cầu triển khai trực tiếp của người dùng; Vercel Git integration phát hành tại `https://thiep-cuoi-online-eight.vercel.app`. Đợt phát hành bổ sung sửa canonical localhost bằng production domain hệ thống và race carousel reduced-motion phát hiện trên CI. Kiểm chứng sửa lỗi:614 unit tests, build228 trang và12 lượt carousel desktop/mobile; xem mục phát hành trong CONTINUATION_PROGRESS và trạng thái GitHub/Vercel của HEAD để biết revision đang chạy.

Lượt lịch tự động tiếp theo vẫn không tự push/deploy. Ngoài lộ trình Studio, cần chuẩn bị sửa guest-photo wall dùng durable storage/server getter và đồng bộ giới hạn upload, kiểm chứng bằng QA/staging trước khi phát hành; không tự áp migration vào database production.

### Hậu kiểm ngày16/11

Yêu cầu triển khai trực tiếp đang dở được hoàn tất trước khi chuyển sang lượt nâng cấp Studio mới. Bản `66696da` đã được Vercel/CI xác nhận thành công và URL canonical thực tế đúng production. Hậu kiểm mobile phát hiện trang chủ có thể trượt ngang12px vì animation ngoài viewport; áp `overflow-x:clip` tại main trang chủ và kiểm thử normal motion. Bản vá đạt614 unit tests, build228 trang và33 UI cases/1skip; kết quả phát hành cuối xem GitHub/Vercel gắn HEAD. Không triển khai tính năng mới riêng của lịch hoặc sửa dữ liệu khách.

Automation `ti-p-t-c-n-ng-c-p-zenlove-studio` gắn với chat này, chạy **01:50 hằng ngày** theo giờ máy (Asia/Bangkok, đã xác nhận Windows UTC+07:00). Lượt16/11 đã bắt đầu; lần kế tiếp **17/11/2026**. Trước khi chạy phải đọc hạn mức; nếu vẫn giới hạn thì ghi nhận và chờ lượt lịch sau. Không tự mua quota/reset hoặc đổi model. Khi toàn bộ lộ trình đã hoàn tất và không còn lý do tiếp tục, xóa automation bằng công cụ chính thức và thông báo đã dừng lịch.

Không tự push/deploy hoặc áp migration production trong lượt được lên lịch. Dữ liệu kiểm thử dùng tài khoản, card và database có tiền tố QA riêng. Trạng thái lịch không đảm bảo máy sẽ thức hoặc ứng dụng đang mở tại giờ chạy.
