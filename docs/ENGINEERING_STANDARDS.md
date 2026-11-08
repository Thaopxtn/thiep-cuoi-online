# Quy chuẩn kỹ thuật ZenLove

Đây là quy ước chung cho mã mới và phần mã được chỉnh sửa. Cải tiến dần theo từng luồng nghiệp vụ; không thay hàng loạt tệp đang hoạt động chỉ để đổi cách viết.

## Ranh giới kiến trúc

- `src/app`: route, metadata và điều phối trang. Route API xác thực, kiểm tra đầu vào và chuyển nghiệp vụ sang service/repository.
- `src/components`: giao diện theo tính năng. Thành phần dùng chung nằm trong `ui`; tái sử dụng `Section`, `SectionHeading`, `Dialog` và các lớp `zen-button`.
- `src/lib`: nghiệp vụ và tích hợp. Mã phía máy chủ mang tiền tố `server`; không import chúng vào Client Component. Không đưa service role key vào mã trình duyệt hoặc biến `NEXT_PUBLIC_*`.
- `src/data`: danh mục và dữ liệu mẫu. Không dùng dữ liệu mẫu để che lỗi kết nối hoặc làm cho kiểm thử đạt.
- Giữ Server Component mặc định; chỉ thêm `"use client"` ở nơi cần state, sự kiện hoặc API trình duyệt. Tên component/type dùng PascalCase; hàm/biến dùng camelCase; boolean mô tả trạng thái rõ ràng.

## Hợp đồng dữ liệu

- TypeScript strict là bắt buộc. Dùng `unknown` và kiểm tra kiểu tại biên dữ liệu; tránh `any`, ép kiểu hai lần và tắt kiểm tra để vượt lỗi.
- Đọc có phân quyền phải dùng dữ liệu máy chủ đã xác nhận. Public DTO chỉ dành cho khách xem; không ghi ngược lên bản thiết kế riêng của chủ thiệp.
- Chỉ báo lưu, xóa, xuất bản hoặc thanh toán thành công sau phản hồi xác nhận. Lỗi HTTP, timeout và lỗi đọc JSON cần được xử lý có chủ đích.
- Giữ đúng `false`, `0`, `""` và `[]`. Chỉ dùng giá trị mặc định khi trường thực sự thiếu; ưu tiên `??` khi giá trị falsy hợp lệ.
- Tách nội dung thiệp khỏi owner/VIP/lượt xem và dữ liệu thanh toán. Ghi nội dung/VIP qua RPC nguyên tử hiện có; không quay về ghi cả snapshot khi thiếu migration.
- Không dùng cache cũ để quyết định quyền. Service worker chỉ lưu tài nguyên tĩnh cùng origin được cho phép; không lưu HTML, API, RSC hoặc trang riêng tư.
- Metadata, canonical URL, robots và sitemap lấy origin từ `getSiteUrl()` trong `src/lib/siteConfig.ts`. Biến `NEXT_PUBLIC_SITE_URL` là origin HTTP(S), không có path/query/thông tin đăng nhập. URL nguồn tham khảo bên ngoài vẫn được giữ riêng.

## Giao diện và tương tác

- Áp dụng [design system](../design-system/zenlove/MASTER.md). Màu ứng dụng lấy từ CSS tokens/Tailwind, không thêm màu tùy ý ở từng nút.
- Chuẩn thiết kế hướng tới WCAG 2.2 AA: tương phản chữ thường ít nhất 4,5:1, focus rõ, thao tác được bằng bàn phím, không mất nội dung khi phóng to. Chưa được coi toàn ứng dụng đạt chuẩn nếu chưa audit đầy đủ.
- Dùng nút cho thao tác, link cho điều hướng. Nút icon có tên truy cập; input có label; lỗi gắn với trường liên quan. Vùng chạm chính tối thiểu 44×44 px theo quy ước sản phẩm.
- Modal mới dùng `Dialog`: focus bên trong, Escape để đóng, khóa cuộn nền và trả focus về nơi mở. Không tự tạo overlay thiếu hành vi bàn phím.
- Chuyển động tự động phải có cách dừng và tôn trọng `prefers-reduced-motion`. Nội dung trùng để chạy carousel không được xuất hiện trong thứ tự Tab hoặc cây truy cập.
- Bố cục thích ứng từ 320 px; kiểm tra thêm 375, 768, 1024 và 1440 px. Nội dung, CTA và biểu mẫu không bị cắt hoặc tràn ngang.
- Dùng tiếng Việt rõ ràng, thuật ngữ nhất quán: “Tạo thiệp”, “Lưu thay đổi”, “Xem trước”, “Xuất bản”. Không đưa chi tiết triển khai hoặc số liệu chưa xác minh vào lời giới thiệu sản phẩm.

## Kiểm chứng và hoàn tất

1. Đọc diff và kiểm thử gần phần cần sửa; tái hiện lỗi trước khi sửa hành vi quan trọng.
2. Chạy kiểm tra mục tiêu trước, rồi `npm run check`. ESLint coi sai Hooks và dependency của effect là lỗi.
3. Chạy `npm run build` sau thay đổi ảnh hưởng routing, UI dùng chung hoặc cấu hình. Không bỏ lỗi TypeScript/lint chỉ để build thành công.
4. Kiểm tra trình duyệt desktop/mobile cho tương tác đã sửa. Dùng dữ liệu QA riêng cho test có ghi; không dùng thiệp khách, tài khoản thật hoặc giao dịch thật để thử.
5. Thay đổi persistence cần regression test và kiểm thử PostgreSQL/fixture theo README. Không tạo test chỉ lặp lại chi tiết CSS hoặc implementation.
6. Ghi rõ lệnh đã chạy, giới hạn và việc còn cần staging trong tài liệu tiến độ. Không tự commit/push/deploy hoặc chạy migration production khi chưa được giao.

Không reset, clean, stash hoặc ghi đè thay đổi có sẵn. Không thêm dependency, abstraction hoặc thay stack khi chưa có nhu cầu được chứng minh.

Tham chiếu: [WCAG: tương phản](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [WAI: modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [MDN: Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache).
