# ZenLove · Design system ứng dụng

## Định hướng

Nền tảng thiệp cưới cho cặp đôi và khách mời Việt Nam. Giữ nhận diện rose, ảnh cưới làm điểm nhấn, nội dung rõ ràng và khoảng trống vừa đủ. Trang quản lý ưu tiên thao tác nhanh; thiệp khách tự thiết kế giữ màu và font của chính thiệp đó.

Không áp màu thương hiệu ứng dụng lên nội dung canvas. Không đổi stack hoặc thêm font chỉ để trang trông mới.

## Nguồn quy ước

`src/app/globals.css` chứa token gốc. `tailwind.config.ts` tham chiếu CSS variables và hỗ trợ opacity (`bg-zen-primary/10`). Thay token tại nguồn thay vì tạo bảng màu riêng ở từng component.

- Primary: `#c93447`; hover: `#b42b3c`. Chữ trắng trên hai màu này lần lượt khoảng 5,17:1 và 6,27:1.
- Foreground: `#1c171a`; muted: `#6b6265`.
- Surface: `#fffaf8`; nền chính: `#ffffff`; border: `#e7dedd`.
- Body: Be Vietnam Pro, fallback Inter/system. Heading: Playfair Display. Dancing Script dành cho chữ ký/ngữ cảnh thiệp, không dùng cho nội dung biểu mẫu.
- Body 16 px, line-height 1,5–1,75; heading theo kích thước màn hình. Nội dung văn bản dài giới hạn khoảng 65–80 ký tự mỗi dòng.
- Container tối đa 80 rem; lề co giãn 1–2 rem. Khoảng cách dùng thang 4/8 px. Control radius 12 px; CTA dạng pill; khối nội dung lớn tối đa 24 px.

## Thành phần dùng chung

- `Section` quản lý nền/khoảng cách; `SectionHeading` quản lý tiêu đề và mô tả. `.zen-container` dành cho vùng nội dung không dùng `Section`.
- `.zen-button` kết hợp `.zen-button-primary`, `.zen-button-secondary` hoặc `.zen-button-ghost`. CTA cao tối thiểu 44 px; trạng thái disabled/loading giữ tên truy cập.
- `.zen-control` cho lựa chọn, bộ lọc và thao tác thứ cấp. Trạng thái chọn dùng `aria-pressed` khi phù hợp.
- `Dialog` dùng native modal, giúp cô lập nền và quản lý focus. Dialog phải có tiêu đề/tên truy cập và nút đóng rõ ràng.
- Focus ring dùng primary, có khoảng cách với control; anchor section chừa vùng thanh điều hướng cố định. Không loại outline nếu chưa có thay thế đạt tương phản.

## Bố cục và nội dung

Trang chủ: lời mời tạo thiệp + ảnh mẫu → lợi ích → mẫu thiệp → giá minh bạch → hướng dẫn → phản hồi → FAQ → tạo thiệp. CTA dẫn tới đúng hành động. Không tự xoay tiêu đề hoặc liên tục thông báo thay đổi qua screen reader.

Giữ typography và màu nhất quán giữa các khối. Tránh biến mọi đoạn thành card hoặc thêm huy hiệu/số liệu không có nguồn. Tên nút và thông báo hoàn tất dùng cùng động từ.

Kiểm tra 320–1440 px, bàn phím, phóng to, `prefers-reduced-motion`, trạng thái lỗi/rỗng/loading và chuyển hướng sau đóng modal. Đây là chuẩn triển khai; chứng nhận WCAG toàn ứng dụng cần audit riêng.
