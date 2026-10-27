# Backlog sửa công cụ tạo thiệp

Tất cả task dưới đây **chưa triển khai** trong lượt bàn giao. Đây là bằng chứng đọc code; Antigravity cần viết test/tái hiện để xác nhận biểu hiện runtime. P0 là mức ưu tiên đề xuất trong phạm vi editor, không phải tuyên bố đã xảy ra sự cố production.

Thứ tự: **E01 → E02 → E03 → E04 → E05 → E06 → E07**. Có thể ghép thay đổi nhỏ dùng chung, nhưng giữ bằng chứng riêng cho từng tiêu chí.

## E01 — P0: snapshot đầy đủ và một đường lưu nhất quán

**Bằng chứng**

- `page.tsx:224–249`: timer autosave đóng trên state của render hiện tại. Album (1981–1991), import (2176–2192), effect/envelope/cinematic (2320–2358), inspector (2423–2425) setState rồi gọi trigger mà không truyền snapshot mới. Chờ 1500ms không tự cập nhật closure.
- Builder `page.tsx:1885–1974` dựng object whitelist nhưng không đưa `envelopeTheme`, `cinematicFx` vào; trong khi UI có handler thay hai trường này. Cần audit các trường còn lại theo schema, không chỉ vá hai trường.
- `weddingCardService.ts:143–205`: `saveCard()` vừa ghi local vừa PUT nền. `saveCardAsync()` PUT rồi gọi `saveCard()` tại 229. Autosave/manual lại gọi cả hai; nhánh thành công có thể tạo ba PUT cho một thao tác.

**Thực hiện**

1. Tạo snapshot nhất quán cho state mới nhất; phân biệt giá trị có chủ ý với fallback, giữ các trường metadata cũ khi chỉnh nodes.
2. Tách local cache khỏi network; giữ tương thích các caller khác sau khi rà tìm toàn repo.
3. Quy định xử lý save đang chạy, thay đổi mới, timer cũ, kết quả trả về sai thứ tự, lỗi server và unmount/chuyển card.
4. `saved` chỉ ứng với đúng revision server đã xác nhận. Local/offline có trạng thái riêng và còn khả năng thử lại.

**Đạt khi**

- Thay album/effect/module rồi chờ autosave, readback đúng giá trị cuối; không cần thao tác phụ để kích lưu.
- Một lệnh lưu logic không phát sinh PUT trùng từ cache; thay đổi mới không bị response/timer cũ ghi đè hoặc đánh dấu đã lưu sai.
- Đổi phong bì/cinematic, save, reload giữ nguyên. `false`, `[]`, nội dung xóa được bảo toàn theo contract.
- Có regression test fake timers + mock transport với phản hồi chậm/đảo thứ tự; không chỉ so sánh object tự tạo trong test.

## E02 — P0: round-trip DB và DTO không mất dữ liệu

**Bằng chứng**

- `WeddingCard` ở `src/data/initialCards.ts:81–127` khai báo nhiều trường editor.
- `serverDb.ts:115–170` và payload 258–291 bỏ `showEvents`, `showCalendar`, `showLoveStory`, `showAlbum`, `envelopeTheme`, `ambientEffect`, `effectConfig`, `cinematicFx`, `loveStory`, `fixedModuleStyles`, các nội dung RSVP/wishes tùy chỉnh.
- Backend offline JSON giữ object, nên test local có thể không phát hiện đường Supabase mất trường.
- `cardDto.ts:96–151` có nhiều trường mới nhưng chưa đưa `effectConfig`, `rsvpTitle`, `rsvpMessage`, `wishesTitle`, `wishesDescription` vào projection. Cần xác định renderer nào tiêu thụ từng trường.

**Thực hiện**

- Lập mapping từng trường từ schema tới storage/readback/public renderer; không đẩy nguyên private object ra public.
- Chọn cách lưu phù hợp schema hiện có hoặc chuẩn bị migration tương thích ngược nếu thực sự cần. Đọc các file SQL, không giả định DB đã có cột mới.
- Có default cho thiệp cũ, không mất trạng thái `false` và mảng rỗng. Giữ ownership và phần private.

**Đạt khi**

- Test đi qua hàm ghi/đọc hoặc API với DB transport mock thực, bao phủ cả offline và đường Supabase.
- Các cấu hình cần hiển thị còn nguyên sau serialize/hydrate và DTO; trường private vẫn được lọc đúng.
- Khi có tài khoản thử nghiệm: server readback từ context sạch khớp snapshot, không dựa cache để kết luận.

## E03 — P0: save, preview và publish có trạng thái đúng

**Bằng chứng**

- Clone route tạo draft tại `src/app/api/cards/clone/route.ts:184`.
- Builder editor luôn gán `status: "published"` tại `page.tsx:1891`, kể cả autosave/preview.
- `proceedPublish` mở modal tại 2086 rồi mới await `saveCardAsync` tại 2088; lỗi không ngăn modal chia sẻ. Endpoint publish chuyên biệt đã tồn tại nhưng đường này chưa dùng.
- `QuickCreateWizardModal.tsx:136–143`: đặt published, gọi `saveCard()` không await, đóng và redirect public show.

**Thực hiện**

- Giữ trạng thái card khi lưu/xem trước; clone mới vẫn draft. Không tự đổi published cũ về draft.
- Chuẩn hóa publish server-confirmed; dùng endpoint hiện có hoặc một contract thống nhất được kiểm thử, trả URL của đúng card.
- Lưu snapshot cuối trước xuất bản, không để autosave cũ ghi ngược trạng thái. Chống bấm lặp và xử lý thất bại có thể thử lại.
- Wizard dùng chung cơ chế đáng tin cậy. Nếu nút hứa tạo và chia sẻ, phải chờ lưu/xuất bản thành công rồi mới chuyển trang.
- Builder hiện còn các fallback điện thoại/tài khoản demo (1907–1927); không đưa thông tin demo vào thiệp thật khi người dùng chưa nhập hoặc đã xóa.

**Đạt khi**

- Save/preview draft vẫn draft và khách không xem được; publish thành công mới có link/QR sẵn sàng chia sẻ.
- 401/403/500/offline không báo đã xuất bản, không chuyển sang trang xem như đã hoàn thành, không mất nội dung.
- Chỉ owner/admin hợp lệ sửa/xuất bản; không bỏ guard để làm flow chạy được.

## E04 — P1: mở lại thiệp khi không có local cache

**Bằng chứng**

- Loader editor `page.tsx:300` gọi `getCardByIdOrSlug()`. Helper `weddingCardService.ts:107–119` đọc local/INITIAL_CARDS; fallback editor gọi API mẫu bằng route ID.
- `fetchCardFromServer()` tại 69 dùng `/api/show` không Bearer, không phù hợp để hydrate bản nháp private. `GET /api/cards/[id]` hỗ trợ owner.
- `toPublicCardDTO()` gán status published, nên không dùng nó làm trạng thái gốc khi edit draft.
- Show page ưu tiên local nodes rồi return tại 341–349, có thể che lỗi server và giữ dữ liệu cũ.

**Thực hiện / tiêu chí đạt**

- Phân biệt route đang mở card riêng hay template; ưu tiên load bản server có auth cho card, với loading/error/403/404 rõ ràng.
- Cache chỉ fallback theo chính sách xác định, không âm thầm biến lỗi load thành mẫu mặc định hay card mới.
- Đăng nhập cùng owner trong context mới mở lại card đúng ID/nodes/metadata/draft; khách context sạch chỉ đọc published.
- Quyết định cách revalidate viewer mà không phá khả năng preview offline; test cache cũ và cập nhật từ trình duyệt khác.

## E05 — P1: Undo/Redo gắn với persistence

**Bằng chứng**

- `page.tsx:541–567`: Undo/Redo đổi nodes/history nhưng không kích hoặc hủy autosave của lần chỉnh trước.
- History tại 90–92 chỉ có nodes, không chứa metadata/album/effect/module style.

**Thực hiện / tiêu chí đạt**

- Undo/Redo phải lưu đúng trạng thái người dùng đang nhìn; timer cũ không phục hồi thao tác đã Undo.
- Test sửa → Undo trước 1500ms → chờ → reload; sửa → autosave → Undo → reload; Redo tương tự; Undo rồi sửa mới phải bỏ nhánh redo cũ.
- Xác định phạm vi history rõ ràng. Nếu mở rộng Undo ra metadata/module thì test snapshot đầy đủ; nếu giữ giới hạn phải thể hiện nhất quán trong UX, không tuyên bố mọi thay đổi đều Undo được.

## E06 — P1: preview, link chia sẻ và show khớp nhau

**Bằng chứng**

- `EditorLivePreviewModal.tsx:16–22,94` chỉ nhận nodes và render `CardNodeRenderer`; thiếu card data cho fixed modules/effects.
- EditorCanvas gắn fixed modules tại 3065; show có interactive sections riêng. Ba nơi dễ cho kết quả khác nhau.
- `page.tsx:2507` truyền template ID/slug mẫu vào preview URL; publish modal dùng card slug tại 2483.

**Thực hiện / tiêu chí đạt**

- Dùng lại renderer/dữ liệu chung khi phù hợp, không sao chép thêm một cây render thiếu chức năng.
- Preview phản ánh snapshot hiện tại, không cần publish ngầm. Link mở tab/QR luôn trỏ đúng card slug và tôn trọng quyền xem draft.
- Bật/tắt mọi fixed section, đổi style, album, love story, nhạc/phong bì/effect: so sánh editor, preview và public show sau lưu.
- Kiểm tra không xuất hiện section lặp giữa nodes có sẵn và fixed modules.

## E07 — P2: hoàn thiện tương tác và kiểm thử layout

Sau khi dữ liệu ổn định, chạy browser checklist trong TEST_PLAN.md; chỉ sửa lỗi tái hiện được.

- Chọn/sửa text tiếng Việt, thay ảnh đúng slot, drag/resize/rotate, multi-select, layer/lock, duplicate/delete, zoom.
- Module cố định chọn/sửa được; drawer/inspector/modal hoạt động trên desktop và mobile, không che thao tác lưu/chia sẻ.
- Giữ décor đã khóa; mẫu khác Hồng Phong không bị áp décor của mẫu Hồng Phong.
- `blockLayoutEngine.ts:116–143` tìm va chạm ban đầu rồi đẩy xuống dưới; cần test có khối khác ở vị trí mới để xác minh có còn chồng. Đây là giả thuyết cần test, chưa có browser repro.
- Xóa hết album không được tự phục hồi ảnh cũ; kiểm tra fallback ở builder khoảng 1853 và loader album 304–316.
- Upload/tách nền lỗi có phản hồi và còn ảnh gốc; không làm mất nội dung thiệp.

**Đạt khi:** kịch bản người dùng trong TEST_PLAN.md có bằng chứng chạy, desktop/mobile dùng được, không console error chưa giải thích và không regression dữ liệu/lưu/xuất bản.
