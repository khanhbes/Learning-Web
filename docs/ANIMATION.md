# Chuyển động và màn ăn mừng BytePath

Giao diện giữ hình học SVG mềm, mascot ở trung tâm và nền sáng. Mỗi màn có một khoảnh khắc chính: chuẩn bị bài, xác nhận trả lời, qua bài, mở quà hoặc lên cấp. Tham khảo cách Duolingo dùng nhân vật và nhịp chuyển động để làm nổi bật cột mốc trong [bài viết thiết kế animation](https://blog.duolingo.com/streak-milestone-design-animation/); asset và code của BytePath được thiết kế riêng.

## Các điểm đã bổ sung

- Màn mở ứng dụng, đổi ngữ cảnh khóa, tải bài, editor, chấm code và gửi bài luận dùng `LoadingScene`. Mascot suy nghĩ, biểu tượng nổi, ba chấm và thanh chờ vô định. Trạng thái queued/running lấy từ job thật; không tự tạo phần trăm hoàn thành. Chuyển động chờ dừng khi tab bị ẩn.
- Màn qua bài/luyện/khóa dùng `CelebrationScene`: lấy đà, bật lên, vòng sáng/ngôi sao bung ra, điểm và phần thưởng xuất hiện. XP hiển thị tổng đã cấp; XP X2 chỉ là chú thích, không cộng lần nữa.
- Rương quà có SVG mở nắp, tia sáng và viên kim cương bật lên. Thưởng bảo vệ streak chuyển thành gem khi inventory đầy được hiển thị theo dữ liệu backend.
- Lên cấp có thanh XP đầy, số cấp chuyển, mascot ăn mừng và quà xuất hiện lần lượt; nhiều cấp được gộp. Sự kiện hoàn thành khóa được gọi đúng tên và có preview skin.
- Đáp án có phản hồi đúng/sai nhẹ; nút có phản hồi nhấn, modal mở bằng spring, trang chuyển nhanh và số gem/năng lượng thay đổi mượt.
- Hồ sơ có đường dẫn `/effects` để xem thử và phát lại các màn minh họa. Trang này không gọi API cấp thưởng.

## Khả năng truy cập và hiệu năng

CTA chính luôn dùng được; không bắt buộc chờ hết animation. Có bỏ qua hiệu ứng. Cài đặt giảm chuyển động và `prefers-reduced-motion` của hệ điều hành đều được tôn trọng; trạng thái cuối, số điểm, quà và điều khiển vẫn xuất hiện. Modal giữ focus/Tab/Escape. Không dùng nhấp nháy nhanh hoặc rung khi trả lời sai.

Ngôi sao/confetti có số lượng cố định 26, chạy một lần bằng transform/opacity; không có thư viện particle hoặc tài nguyên mạng mới. Mascot chớp mắt, tai/đuôi và các trạng thái dùng asset SVG hiện có. Âm thanh lên cấp giữ tùy chọn bật/tắt, phát khi người học bấm tiếp tục.

## Kiểm chứng

TypeScript và production build kiểm tra toàn bộ các điểm tích hợp. QA dùng SQLite riêng, không tạo thành tích vào hồ sơ đang phục vụ qua tunnel. Bằng chứng UI/skip/reduced-motion/mobile và phát hành được ghi trong `output/` sau khi kiểm tra thực tế.
