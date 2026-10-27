# Kế hoạch kiểm thử và nghiệm thu editor

Kết quả lượt bàn giao nằm trong BASELINE.md. Các case bên dưới là **kế hoạch cho Antigravity**, chưa được đánh dấu pass.

## Chuẩn bị

1. Đọc `git status`; giữ nguyên dữ liệu và thay đổi đang có.
2. Dùng một tài khoản/thiệp thử nghiệm riêng. Tên gợi ý: `QA Editor 20261027`; dữ liệu cưới và ảnh tự tạo, không dùng dữ liệu khách để thử mutation.
3. Có một mẫu Hồng Phong, một mẫu khác có ảnh/nodes, một card clone có `id`, `slug` và `templateId` khác nhau.
4. Phân biệt đường offline JSON và đường Supabase. Mock DB có thể xác minh contract, nhưng không được gọi là nghiệm thu Supabase thật.
5. Khi chạy API/browser, khởi động server cổng 3005 và ghi rõ URL/mode. Không chạy dev và build cùng lúc dùng chung `.next`; kiểm tra server có sẵn trước khi khởi động.

Nếu dependencies đã có, dùng luôn. Trên máy mới dùng lockfile của dự án (`npm ci`), không tự nâng dependency để xử lý lỗi nghiệp vụ.

## Lệnh hiện có

```powershell
npm run dev
```

Chạy kiểm tra ở terminal khác từ root dự án:

```powershell
# Nhóm editor thuần logic, chọn thêm/bớt theo file thực sự sửa
npm test -- src/lib/__tests__/blockLayoutEngine.test.ts src/lib/__tests__/canvaDesignTools.test.ts src/lib/__tests__/moduleHelpersAndRealData.test.ts src/lib/__tests__/textSyncService.test.ts src/lib/__tests__/unifiedModulesAndLoveStory.test.ts src/lib/__tests__/cinematicMotionFx.test.ts

# Sau khi hoàn thành luồng cốt lõi
npm test
npm run build

# Smoke/QA API: cần server chạy, cấu hình tài khoản test phù hợp
$env:BASE_URL = 'http://localhost:3005'
npm run test:e2e
npm run test:all
```

`test:e2e`/`test:all` không điều khiển chuột hoặc kiểm tra canvas. Chúng tham chiếu slug mẫu cố định và phần admin; đọc script trước khi chạy, dùng dữ liệu thử. Không sửa expected result chỉ để phù hợp môi trường thiếu tài khoản.

`npm run lint` có sẵn nhưng chưa chạy trong baseline. Build bỏ qua lint; nếu sửa TSX cần kiểm tra lint phù hợp phạm vi và ghi riêng lỗi có sẵn.

### Workaround lỗi temp trên Windows của lượt bàn giao

Lần chạy đầu gặp ENOENT trong thư mục tạm sandbox. Lần chạy sau chỉ thay TEMP/TMP trong tiến trình terminal đã chạy đầy đủ các suite:

```powershell
New-Item -ItemType Directory -Path 'scratch\antigravity-test-temp' -Force | Out-Null
$env:TEMP = (Resolve-Path -LiteralPath 'scratch\antigravity-test-temp').Path
$env:TMP = $env:TEMP
npm test
```

`scratch/` đã được ignore. Thay đổi env này chỉ áp dụng terminal hiện tại; không cần ghi vào `.env.local` hoặc config dự án. Nếu môi trường mới không có ENOENT thì không cần workaround.

Test DNS `securityAndAuth.test.ts:68` gọi domain công khai thật. Baseline lookup `google.com` trả `ENOTFOUND`. Có thể làm test deterministic bằng mock DNS và kiểm tra cả public/private IP cùng lỗi DNS; không đổi hàm bảo vệ sang cho phép khi DNS thất bại, không bỏ assertion.

## Regression tự động cần bổ sung khi sửa

### Snapshot và save coordinator — E01/E05

- Đổi album/effect/metadata rồi advance fake timer: payload phải là state mới nhất, không phải render trước.
- Kích liên tiếp nhiều thao tác trong thời gian debounce: chỉ lưu snapshot cuối theo chính sách đã chọn.
- Một lần lưu không phát sinh request thứ hai từ helper cập nhật cache.
- Request A chậm, B mới hơn: kết quả cuối và trạng thái saved thuộc B. Test cả phía client và hợp đồng backend nếu chạy song song.
- Đang save A, người dùng sửa B: không đánh dấu B đã lưu khi mới có ACK của A.
- Lỗi 401/403/500, timeout/offline: giữ bản sửa, báo trạng thái đúng, retry không nhân bản card.
- Timer của card cũ không ghi sang card mới; unmount được xử lý.
- Undo/Redo trước/sau debounce, Undo rồi sửa mới: snapshot lưu đúng và redo branch bị cắt khi cần.

### Persistence và DTO — E02/E04

- Đi qua production serializer/upsert và hydrator với mock fetch/storage; đừng chỉ JSON.stringify object tự dựng.
- Bao phủ cả backend JSON và payload/readback Supabase; không ghi vào file dữ liệu khách khi test.
- Round-trip các trường: nodes, couple/events, album, music, toàn bộ `show*`, loveStory, fixedModuleStyles, envelopeTheme, ambientEffect/effectConfig, cinematicFx, nội dung RSVP/wishes.
- Kiểm tra `false`, mảng rỗng, giá trị bị xóa, dữ liệu cũ thiếu trường và giữ thông tin không liên quan khi sửa nodes.
- Public DTO không lộ userId hay phone/note riêng của RSVP; thông tin hộp mừng được ẩn theo contract. Không xuất nguyên private card để sửa thiếu field.
- Owner load draft qua auth endpoint; người khác/khách bị chặn; 404 không được tạo card thay thế.

### Draft/publish/wizard — E03/E06

- Clone → save/preview vẫn draft; published cũ giữ nguyên khi lưu.
- Publish phải có ACK; 401/403/500 không hiển thị thành công hoặc public QR như đã sẵn sàng.
- Save snapshot cuối rồi publish; autosave cũ không đổi ngược trạng thái/dữ liệu.
- Wizard chờ hoàn tất, chống submit lặp, không redirect khi lưu thất bại.
- Public URL dùng đúng card slug, không template ID hoặc slug mẫu.

## Browser checklist

Mỗi case ghi trạng thái `PASS / FAIL / BLOCKED / NOT RUN`, môi trường, card test, expected/actual và ảnh/video hoặc network evidence. Dùng browser/tool sẵn có trong Antigravity; không giả định MCP liệt kê trong AGENTS.md chắc chắn đang kết nối.

### B01 — Tạo thiệp riêng từ mẫu

- Vào `/templates`, chọn mẫu, đăng nhập nếu cần, tạo card.
- Xác nhận ID/slug mới, đúng owner, không sửa mẫu gốc; lần mở editor đầu không mất nodes/ảnh.
- Nếu clone API lỗi: có thông báo, không âm thầm coi mẫu là card đã tạo thành công.

### B02 — Chỉnh sửa nội dung và ảnh

- Sửa tên tiếng Việt có dấu, ngày/giờ, gia đình, địa điểm, sự kiện; kiểm tra auto-fill không sửa nhầm text trang trí.
- Thay ảnh vào đúng slot, crop/frame, thêm/xóa/reorder album; xóa toàn bộ album rồi reload.
- Kiểm tra dữ liệu điện thoại/bank chưa nhập hoặc bị xóa không được thay bằng demo.
- Drag/resize/rotate, chọn nhiều, duplicate/delete/layer/lock/zoom; décor khóa đúng, không lỗi tọa độ sau zoom.

### B03 — Autosave, lưu thủ công và tải lại

- Đổi liên tiếp text + album + effect trong một nhịp debounce; xem payload và số mutation trong Network.
- Chờ lưu rồi reload, đối chiếu cả nodes và metadata. Lặp với manual save.
- Sửa rồi Undo trước debounce; reload phải giữ trạng thái Undo. Lặp Undo sau save và Redo.
- Giả lập offline/500/401 lúc đang sửa; nội dung còn nguyên, trạng thái không nói saved/published sai; thử lại sau khi hồi phục.

### B04 — Module và preview

- Bật/tắt events, calendar, love story, album, RSVP, wishes, gift box; sửa nội dung/style từng phần.
- Đổi nhạc, phong bì, ambient effect, cinematicFx; xem preview và trang thực sau lưu.
- Không thiếu/lặp module, không phục hồi giá trị bị tắt/xóa. Kiểm tra nút mở tab và QR đúng card.

### B05 — Context mới và xuất bản

- Mở context mới, đăng nhập cùng owner, vào `/design-template/{card.id}` khi cache chưa có: dữ liệu server phải tải đúng.
- Khách context riêng không xem được draft.
- Publish và chờ server ACK, mở URL/QR từ context khách sạch; nội dung khớp bản vừa lưu.
- Chỉnh card đã published từ browser A, mở lại/revalidate browser B; không bị cache cũ giữ nội dung sai.
- Một tài khoản test khác không sửa/xuất bản card owner.

### B06 — Tạo nhanh và giao diện

- Wizard hoàn tất đủ bước; thử response chậm, lỗi và nhấn nút lặp. Chỉ chuyển trang sau khi server hoàn tất.
- Kiểm tra ở desktop khoảng 1440×900 và mobile 390×844, thêm 360px nếu layout tràn.
- Drawer/inspector/modal không che nút chính; scroll, focus, bàn phím nhập text và bàn phím Undo/Redo dùng được.
- Upload/tách nền thành công/lỗi không làm mất ảnh gốc hoặc state. Ghi rõ nếu thiếu dịch vụ để kiểm tra.
- Không có hydration/runtime error chưa giải thích. Lưu screenshot của editor, preview, show và tình huống save lỗi.

## Điều kiện hoàn thành đợt sửa

- E01–E06 có regression chứng minh nguyên nhân đã sửa; E07 đã kiểm tra và sửa các lỗi tái hiện trong phạm vi.
- Luồng B01 → B05 chạy thật trên thiệp test; B06 kiểm tra wizard/mobile. Nếu thiếu quyền/dịch vụ thì ghi BLOCKED đúng phần, không đánh dấu hoàn tất toàn bộ.
- Build pass; full test có kết quả và phân loại mọi failure, không che lỗi bằng skip hoặc sửa bảo vệ sản phẩm.
- Các thay đổi nằm trong phạm vi editor và phụ thuộc trực tiếp; dữ liệu/thay đổi có sẵn được giữ.
- PROGRESS.md được cập nhật để lượt tiếp theo hiểu việc đã làm và việc còn lại.
