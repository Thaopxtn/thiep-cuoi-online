# Dự Án Thiệp Cưới ZenLove - Quy Ước Lập Trình & Kiểm Thử Tự Động

## Lệnh Kiểm Thử Nhanh
- `npm test`: Chạy toàn bộ Unit Tests với Vitest (siêu nhanh < 1.5s).
- `npm run test:watch`: Chế độ tự động chạy lại test khi file mã nguồn thay đổi (TDD mode).
- `npm run test:e2e`: Kịch bản kiểm thử tự động toàn diện hệ thống (Health Check, API Cards, API Show, RSVP, Wishes, Dashboard, Admin Activities).
- `npm run test:all`: Bộ QA Tester tổng hợp All-in-One (Unit tests, 15 API contracts, Performance audit, xuất báo cáo HTML).
- `npm run build`: Kiểm tra tính toàn vẹn và tối ưu sản phẩm production.

## Các MCP Server Được Tích Hợp
- `puppeteer`: Kiểm thử giao diện và tương tác trình duyệt.
- `git`: Quản trị phiên bản mã nguồn tự động.
- `sequentialthinking`: Suy luận logic từng bước cho gỡ lỗi chuyên sâu.
- `fetch`: Kiểm tra endpoint và nạp dữ liệu ngoài.
- `memory`: Lưu trữ ngữ cảnh dự án bền vững.
