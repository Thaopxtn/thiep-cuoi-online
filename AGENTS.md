# Dự Án Thiệp Cưới ZenLove - Quy Ước Lập Trình & Kiểm Thử Tự Động

Đọc và áp dụng [quy chuẩn kỹ thuật chung](docs/ENGINEERING_STANDARDS.md) trước khi sửa mã.
Giao diện ứng dụng tuân theo [design system ZenLove](design-system/zenlove/MASTER.md).
Giữ nguyên thay đổi chưa commit, dữ liệu thiệp và thiết kế do người dùng tạo.

## Lệnh Kiểm Thử Nhanh
- `npm run check`: Kiểm tra TypeScript, ESLint và toàn bộ unit tests theo cùng một cổng chất lượng.
- `npm test`: Chạy toàn bộ unit tests và regression tests với Vitest.
- `npm run test:watch`: Chế độ tự động chạy lại test khi file mã nguồn thay đổi (TDD mode).
- `npm run test:e2e`: Kịch bản kiểm thử tự động toàn diện hệ thống (Health Check, API Cards, API Show, RSVP, Wishes, Dashboard, Admin Activities).
- `npm run test:all`: Bộ QA tổng hợp (unit tests, API contracts, performance audit, báo cáo HTML).
- `npm run test:ui`: Kiểm tra giao diện và bàn phím desktop/mobile trong môi trường QA riêng, không cần PostgreSQL.
- `npm run build`: Kiểm tra tính toàn vẹn và tối ưu sản phẩm production.

## Các MCP Server Được Tích Hợp
- `puppeteer`: Kiểm thử giao diện và tương tác trình duyệt.
- `git`: Quản trị phiên bản mã nguồn tự động.
- `sequentialthinking`: Suy luận logic từng bước cho gỡ lỗi chuyên sâu.
- `fetch`: Kiểm tra endpoint và nạp dữ liệu ngoài.
- `memory`: Lưu trữ ngữ cảnh dự án bền vững.
