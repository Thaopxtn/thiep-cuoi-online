# Ngữ cảnh kỹ thuật của công cụ tạo thiệp

Đối chiếu với working tree ngày 27/10/2026. Số dòng có thể thay đổi; tìm bằng tên hàm/component trước khi sửa.

## Nền tảng và điểm chạy

- Next.js App Router, React, TypeScript strict, Tailwind, lucide-react. Phiên bản khai báo xem `package.json`; build baseline thực tế báo **Next.js 14.2.35**.
- Máy bàn giao: Windows/PowerShell; Node **v24.11.1**, npm **11.6.2**. Đây là phiên bản đã chạy, không phải yêu cầu nâng/hạ runtime.
- `npm run dev`: localhost cổng **3005**. `npm run start`: chạy bản build trên cùng cổng.
- `npm test`: Vitest, môi trường **node**, không phải trình duyệt. Alias `@/` → `src/`.
- `next.config.mjs`: build kiểm tra type nhưng `eslint.ignoreDuringBuilds = true`. Có build thành công không có nghĩa lint đã pass.
- README cũ nói Craft.js, nhưng manifest hiện không khai báo Craft.js; editor thực tế xử lý node và tương tác trong các component nội bộ. Dựa vào code/manifest, không lập kế hoạch cài Craft.js từ mô tả cũ.

## Luồng cần hoàn thiện

Đây là luồng đích; editor/wizard hiện chưa tuân thủ đầy đủ, đặc biệt ở bước tải card private và gọi publish. Xem TASKS.md để biết các đoạn còn thiếu.

1. `/templates`: chọn mẫu, đăng nhập, gọi `cloneTemplateToNewCard()`.
2. `POST /api/cards/clone`: tạo ID/slug riêng, owner, trạng thái draft; phải lưu DB thành công mới trả card.
3. `/design-template/{card.id}?clonedFrom=...`: chỉnh nodes và metadata thiệp.
4. `PUT /api/cards/{card.id}`: lưu có xác thực và kiểm tra owner; local cache phục vụ khôi phục nhưng không chứng minh server đã lưu.
5. `GET /api/cards/{card.id}` kèm auth: lấy bản gốc đầy đủ cho owner, kể cả draft.
6. `POST /api/cards/{card.id}/publish`: endpoint riêng đã có, xác nhận xuất bản rồi trả public URL + QR.
7. `/show/{card.slug}` và `GET /api/show/{card.slug}`: trải nghiệm khách, DTO public, tương tác RSVP/wishes.

Luồng tạo nhanh `QuickCreateWizardModal` là nhánh khác từ `/templates`; phải dùng cùng hợp đồng lưu/xuất bản, không báo hoàn thành trước server.

## Bản đồ file cần đọc

### Editor và nguồn state

- `src/app/design-template/[id]/page.tsx`: component điều phối. Các mốc: autosave 224; loader 294; Undo/Redo 541/555; builder tạo card khoảng 1800–1974; album 1981; manual save 1995; settings 2021; preview 2050; publish 2057/2080; import JSON 2176; handlers hiệu ứng 2320–2358.
- `src/components/editor/EditorCanvas.tsx`: render node và thao tác chọn/kéo/resize/xoay/group; gắn `EditorFixedModulesCanvas` tại khoảng 3065.
- `EditorLeftRail.tsx`, `EditorLeftDrawer.tsx`: chọn công cụ, module, media, theme/hiệu ứng.
- `EditorTopContextualBar.tsx`, `EditorRightInspector.tsx`, `FixedModuleInspector.tsx`: thuộc tính đối tượng và module cố định.
- `EditorFixedModulesCanvas.tsx`, `EditorFixedModuleEditModal.tsx`: phần tương tác/module được render theo metadata card.
- `EditorAutoFillModal.tsx`, `EditorWeddingSettingsModal.tsx`: nhập dữ liệu cưới và đồng bộ vào nội dung.
- `EditorHeader.tsx`, `EditorBottomBar.tsx`, `EditorLivePreviewModal.tsx`, `EditorPublishModal.tsx`, `EditorPublishWarningModal.tsx`: lưu, xem trước, xuất bản.
- `EffectConfigPanel.tsx`, `ModuleStyleVisualPreview.tsx`: các file mới chưa tracked tại thời điểm bàn giao; cần giữ cùng source.

### Schema, chuyển đổi, persistence

- **Schema `WeddingCard` đặt trong `src/data/initialCards.ts:39`**, không có thư mục `src/types` riêng. `weddingCardService.ts` re-export type này.
- `src/lib/weddingCardService.ts`: đọc cache (107), `saveCard` (143), `saveCardAsync` (211), clone (453); `fetchCardFromServer` (69) hiện gọi public endpoint.
- `src/lib/apiClient.ts`: wrapper Bearer token, refresh 401 và thông báo hết phiên; ưu tiên dùng cơ chế hiện có.
- `src/context/AuthContext.tsx`, `src/lib/serverAuth.ts`: session phía client, xác minh auth/owner phía server.
- `src/lib/serverDb.ts`: backend offline JSON và Supabase, map đọc (115), upsert ghi (237), nodes được nén LZUTF8 Base64 vào `pageData`.
- `src/lib/cardDto.ts`: projection public, lọc thông tin chủ thiệp/RSVP riêng tư. Projection public không phải schema đầy đủ để editor ghi ngược.
- `src/app/api/cards/clone/route.ts`, `src/app/api/cards/[id]/route.ts`, `src/app/api/cards/[id]/publish/route.ts`: các contract clone, load/save, publish.
- `supabase_schema.sql`, `supabase_schema_v2.sql`, `supabase_production_migration.sql`: đọc trước nếu cần điều chỉnh persistence; không tự chạy migration lên dữ liệu đang dùng.

### Module, renderer, ảnh

- `src/lib/unifiedModulesRegistry.ts`, `fixedModulesCatalog.ts`, `modulePresetsCatalog.ts`, `availableModules.ts`: danh mục module và preset.
- `src/lib/blockLayoutEngine.ts`: tính bố cục khối; `moduleHelpers.ts`, `textSyncService.ts`, `templateExtractor.ts`: tạo/sync nội dung.
- `src/lib/decorativeLockService.ts`: giữ họa tiết trang trí của mẫu, phân biệt ảnh thay được và decor.
- `src/components/CardNodeRenderer.tsx`, `PhotoBoxFrameRenderer.tsx`: render node/khung ảnh ở preview/show.
- `src/app/show/[slug]/page.tsx`, `src/components/show/InteractiveSections.tsx`, `LuxuryEnvelopeModal.tsx`, `CinematicEffectsOverlay.tsx`, `FallingPetals.tsx`: trải nghiệm cuối của khách.
- `src/lib/effectsCatalog.ts`, `framesCatalog.ts`, `stickersCatalog.ts`, `loveStoryConstants.ts`: các catalog mới; không bỏ vì chưa tracked.
- `src/lib/imageCompression.ts`, `backgroundRemoval.ts`, `mediaLibraryService.ts`, `src/app/api/upload/route.ts`: đường xử lý/upload ảnh cần smoke test khi sửa editor.

## Hai lớp dữ liệu cần giữ đồng bộ

`nodes` chứa cây canvas: text, ảnh, khối/module trên canvas và thuộc tính bố cục. `WeddingCard` còn chứa dữ liệu ngoài nodes: couple/events/album, nhạc, các `show*`, `loveStory`, `fixedModuleStyles`, phong bì và hiệu ứng.

History hiện lưu nodes; fixed module dùng metadata. Sửa một lớp không tự đồng nghĩa lớp kia được lưu/undo. Cần kiểm tra toàn bộ chuỗi snapshot → cache → API → serialize DB → hydrate → DTO → renderer.

ID của mẫu, ID thiệp riêng và public slug có thể khác nhau. Không lấy `templateId` làm public URL cho bản sao; không tạo thiệp mới chỉ vì GET thiệp riêng không tải được.

Các giá trị `false`, chuỗi rỗng cho thông tin người dùng xóa và `album: []` cần được xử lý có chủ ý. Tránh fallback `||` đưa nội dung mẫu, số điện thoại hoặc tài khoản ngân hàng demo trở lại thiệp khách.

## Cache và môi trường

- Browser: `zenlove_auth_user`, `zenlove_cards_<uid>`, `card_<id>`, `card_slug_<slug>`; có cache upload riêng. Không đưa nội dung các key vào báo cáo.
- Backend: `serverDb.ts:63` xác định DB có cấu hình. Không có DB thì ghi vào `src/data/cards-local-db.json`; khi có DB thì đọc/ghi Supabase. Hai đường này đang bảo toàn dữ liệu khác nhau, phải test riêng.
- `show/[slug]/page.tsx:341–349` ưu tiên return local nếu nodes đủ lớn; cùng browser có thể trông đúng dù server chưa lưu.
- Loader editor hiện ưu tiên local/INITIAL_CARDS rồi fallback sang API mẫu; cần đường load card server riêng cho context mới.

Chỉ tên biến cấu hình cần biết: `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`; tùy nhánh có các biến R2 trong `.env.example`. Script QA còn đọc `BASE_URL`, `ADMIN_PASSCODE`, `ADMIN_API_KEY`. Chỉ kiểm tra có/thiếu biến, không in giá trị hay dùng mặc định trong source như thông tin đăng nhập thật.

Build baseline nạp `.env.local`, nhưng lượt bàn giao không đọc giá trị và không xác minh dịch vụ, tài khoản hay schema đang chạy. Có cấu hình không có nghĩa cloud flow đã được kiểm chứng.
