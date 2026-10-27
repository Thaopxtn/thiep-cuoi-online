# Baseline bàn giao — 27/10/2026

Đây là kết quả **đã chạy** trước khi Antigravity sửa editor. Các báo cáo cũ ở root không thay thế kết quả này.

## Workspace

- Root: `D:\luufilelaptrinh\thiepcuoiba`.
- Branch: `main`.
- HEAD: `5409db1631def4f01cae89d6c74c1b68b4391a95` — `feat(presets): attach tailored visual entrance and continuous motion effects to all module presets`.
- Có **56 file modified và 43 file untracked** trước khi thêm bộ bàn giao, đếm bằng `git status --porcelain=v1 --untracked-files=all`. Có editor, API, catalog, test và dữ liệu trong số này. Đơn vị đếm khác `git status --short` gộp thư mục.
- Danh sách: [git-status-before.txt](baseline/git-status-before.txt). Thống kê diff tracked: [git-diff-numstat-before.txt](baseline/git-diff-numstat-before.txt). Hai file này chỉ ghi đường dẫn/số dòng, không chứa patch hoặc dữ liệu khách.
- Node v24.11.1, npm 11.6.2, Windows/PowerShell. Không có listener cổng 3005 tại lúc kiểm tra trước build.

Lượt bàn giao chỉ thêm prompt/tài liệu/log; không chủ động sửa logic ứng dụng, commit, push hay thao tác xuất bản thiệp.

## Kết quả đã chạy

### `npm run build` — PASS, exit 0

- Compile thành công, kiểm tra TypeScript, sinh **349/349** static pages, hoàn thành tối ưu và build traces.
- Next.js thực tế báo **14.2.35**, nạp `.env.local`.
- Build bỏ qua lint theo config. Chưa chạy lint riêng.
- Log: [build.log](baseline/build.log).

Build không xác minh kéo thả editor, quyền của tài khoản, cloud readback hoặc dịch vụ media.

### `npm test` lần đầu — FAIL, exit 1

- 14 file pass, 17 file fail; 106 test pass, 1 test fail trong phần chạy được.
- 16 suite fail lúc import với `ENOENT` trong thư mục tạm Windows sandbox của Vitest/Vite.
- Một assertion DNS trong `securityAndAuth.test.ts:68` nhận false khi kỳ vọng true cho domain công khai.
- Log: [unit-tests.log](baseline/unit-tests.log).

Đây không phải kết luận 16 suite có lỗi nghiệp vụ; chúng chưa chạy được vì lỗi file tạm.

### `npm test` với TEMP/TMP trong workspace — FAIL, exit 1

- Chỉ thay env trong tiến trình terminal, không sửa mã/config ứng dụng.
- Chạy đủ **31 file / 232 test**: **30 file pass, 1 file fail; 231 test pass, 1 test fail**. Không còn ENOENT.
- Failure còn lại: `securityAndAuth.test.ts:68`, test xác thực DNS bất đồng bộ.
- Probe độc lập `dns.promises.lookup('google.com', { all: true })` trả **`ENOTFOUND`** trong môi trường này. Bằng chứng phù hợp với giới hạn DNS tại thời điểm chạy; chưa kết luận test pass ở môi trường khác.
- Hàm sản phẩm chặn URL khi DNS lỗi theo fail-closed; không được đổi thành cho phép để làm test pass.
- Workaround chạy lại được ghi ở TEST_PLAN.md.
- Log: [unit-tests-workspace-temp.log](baseline/unit-tests-workspace-temp.log).

## Chưa chạy / chưa xác minh

- Không chạy browser UI, drag/resize, ảnh chụp giao diện, test tạo/lưu/publish thật.
- Không chạy `npm run test:e2e`, `npm run test:all`, `npm run lint`.
- Không dùng tài khoản người dùng/admin, không kiểm tra giá trị biến bí mật hoặc tình trạng Supabase/R2.
- Không áp migration; không sửa dữ liệu JSON offline hay thiệp cloud bằng request nghiệp vụ.
- Các rủi ro E01–E07 là phát hiện code để agent tiếp theo xác nhận và sửa, không phải kết quả runtime đã tái hiện.

Kết quả có cấu trúc để máy đọc: [results.json](baseline/results.json).
