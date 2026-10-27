# Bàn giao Antigravity: công cụ tạo thiệp

Ngày bàn giao: **27/10/2026**, múi giờ Asia/Bangkok. Bộ này chuẩn bị để AI khác tiếp tục sửa mã trong cùng workspace; không chứa bản sao source hoặc thông tin đăng nhập.

## Cách dùng

1. Mở toàn bộ thư mục `D:\luufilelaptrinh\thiepcuoiba` trong Antigravity.
2. Dán nội dung prompt ở [ANTIGRAVITY_PROMPT.md](../../ANTIGRAVITY_PROMPT.md).
3. Yêu cầu agent bắt đầu E01 trong [TASKS.md](TASKS.md), làm lần lượt theo phụ thuộc và cập nhật [PROGRESS.md](PROGRESS.md).

Nếu chuyển sang máy khác, cần cả source đang làm và file chưa tracked; chỉ checkout HEAD hoặc chỉ gửi bộ tài liệu này sẽ thiếu các phần editor hiện có. Chuyển cấu hình bí mật qua kênh riêng, không đưa vào bộ bàn giao.

## Các file trong bộ

- [CONTEXT.md](CONTEXT.md): kiến trúc thực tế, nguồn dữ liệu, file cần đọc, môi trường chạy.
- [TASKS.md](TASKS.md): 7 nhóm việc có bằng chứng mã nguồn và tiêu chí hoàn thành.
- [TEST_PLAN.md](TEST_PLAN.md): test cần bổ sung, quy trình browser, định nghĩa hoàn thành.
- [BASELINE.md](BASELINE.md): HEAD, trạng thái workspace, kết quả build/unit và những gì chưa chạy.
- [PROGRESS.md](PROGRESS.md): sổ theo dõi để agent tiếp theo ghi kết quả.
- `baseline/`: log kiểm tra và danh sách thay đổi có sẵn trước khi viết tài liệu.

## Phạm vi của lượt bàn giao này

Đã đọc code liên quan, đối chiếu luồng editor/API/viewer và chạy baseline. **Chưa sửa logic ứng dụng, chưa kiểm thử giao diện, chưa triển khai các task E01–E07.** Các vấn đề được đánh dấu là bằng chứng tĩnh hoặc cần tái hiện, tránh để agent tiếp theo hiểu là đã có kiểm chứng browser.

Ưu tiên là người dùng chỉnh xong có thể lưu thật, mở lại đúng và chia sẻ đúng. Các chức năng trang chủ, kinh doanh, quản trị và tính năng ngoài editor không nằm trong đợt này.
