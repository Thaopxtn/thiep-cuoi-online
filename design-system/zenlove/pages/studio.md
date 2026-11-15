# ZenLove Studio

Áp dụng cho `/design-template/[id]`. Kế thừa MASTER; chỉ điều chỉnh phần giao diện phần mềm, không thay màu, font, vị trí hoặc nội dung thiệp.

## Định hướng đã chọn

Studio dành cho người Việt tự thiết kế thiệp: tác phẩm ở giữa, công cụ ở hai cạnh, trạng thái lưu luôn rõ. Tránh giao diện mỗi bảng một màu và các thanh nổi che tác phẩm.

- Màu: surface `#ffffff`, workspace `#eef0f3`, border `#dde1e7`, text `#18212f`, muted `#5d6878`; accent kế thừa primary rose của ZenLove. Nguồn token: lớp components trong `src/app/globals.css`, phạm vi `.zen-studio`.
- Chữ: Be Vietnam Pro/system cho phần mềm. Tên tài liệu và heading 14px, control/nhãn 12–14px; không dùng font cưới cho nút ứng dụng.
- Khung: header → rail72 / library288 / artboard co giãn / inspector312 → điều khiển viewport nằm trong cột artboard. Trên mobile: header hai hàng, canvas, điều khiển viewport, thanh5công cụ; thư viện là dialog.
- Control tối thiểu44px, radius8px. Đường phân chia nhẹ xác định vùng công việc; accent chỉ dành cho hành động chính hoặc lựa chọn. Không dùng gradient hoặc badge trang trí cho mọi công cụ.
- Thư viện trả lời “thêm gì”; inspector trả lời “đang sửa gì”; canvas giữ nguyên nội dung thật. Không có lựa chọn thì hướng dẫn chọn đối tượng; chọn module thì hiển thị đúng module.
- Nhãn truy cập cho nút icon; lựa chọn dùng `aria-pressed`; popover đóng bằng Escape và trả focus. Trạng thái lưu dựa trên phản hồi hiện có, không giả trạng thái thành công.

Kết quả tra cứu UI/UX gợi ý hướng tối giản cho công cụ chuyên nghiệp nhưng trả pattern marketing và palette tím/tối không phù hợp. Không áp dụng chúng; ưu tiên hợp đồng studio này và nhận diện đã có.

## Ranh giới đợt đầu

Chuẩn hóa shell, navigation, panel chrome và viewport; gom lịch sử node thành một state machine. Các bộ chọn style/preset, thanh định dạng, layer model và renderer còn được chuyển dần theo tiến độ trong `docs/STUDIO_UPGRADE_PROGRESS.md`. Không coi đây là chứng nhận toàn phần mềm đạt WCAG hoặc hoàn thành kiến trúc editor.
