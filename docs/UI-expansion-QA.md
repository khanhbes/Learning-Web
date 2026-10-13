# Kiểm tra giao diện mở rộng BytePath

Ngày kiểm tra: 13/10/2026. Dùng Chromium 1248 qua Playwright CLI, backend `127.0.0.1:3001`, bản build trong `output/ml-dist` và SQLite QA riêng. Không dùng hồ sơ đang public để thử mua đồ hoặc nộp bài.

## Thiết kế

Giữ không gian học sáng, xanh lá chủ đạo và hình học mềm. Hai khóa có minh họa riêng; mỗi hoạt động ML có một hình chủ đạo để thao tác, phần đọc sâu thu gọn. Chuyển trạng thái sơ đồ, phản hồi nhân vật và hiệu ứng thưởng đều có chế độ giảm chuyển động. SVG nhân vật và sơ đồ là asset riêng của BytePath.

## Kết quả quan sát thực tế

| Nhóm | Kiểm tra | Kết quả |
|---|---|---|
| Khóa học | DSA/ML có tiến độ riêng; đổi bằng selector; URL `/lesson/1` cũ | QA giữ DSA 0/48 và ML 40/40; URL cũ chuyển về DSA và mở “Máy tính hiểu điều gì?” |
| Luyện thêm | Chọn đáp án, ghép cặp, xếp bước, đọc biểu đồ, điền số, tìm lỗi | Đã thao tác đủ sáu dạng; ba dropdown ghép lưu đúng record; bốn phiên năm câu đầy đủ đạt 5/5 |
| Số 0 | Nhập `0` vào câu điền số | Có thể tiếp tục; sửa hiển thị để đáp án số 0 không trở thành ô rỗng |
| Biểu đồ câu hỏi | Score, nhãn trục, đơn vị, đường threshold | Bổ sung nhãn trục, ticks và đường ngưỡng; checker vẫn chạy ở backend |
| Nhân vật | Mở tất cả 24 preview, mỗi nhân vật thử sáu biểu cảm | 144 trạng thái SVG hiện đúng tên nhân vật; đã xem ảnh chụp đại diện robot/mèo/cáo/thỏ/axolotl |
| Cửa hàng | Mua Mèo Mây, trang bị; mua và kích hoạt gói X2 hai lượt | Profile chuyển sang `cat`, mascot xuất hiện ở cuối khóa; boost còn hai lượt |
| Cấp và khung | Profile cấp 17, ba khung đã mở và hai khung chưa mở; chọn khung Lá non | Frame được lưu và dùng ở avatar; khung chưa đạt cấp vẫn khóa |
| Settings | Bật/tắt âm thanh, giảm chuyển động, reload | Lưu đúng cả hai giá trị; sửa checkbox phản hồi ngay và gửi từng setting để tránh ghi đè khi bấm nhanh |
| Gradient descent | Bước sau, bước trước, chạy/dừng, tốc độ 2×, reset, đổi dữ liệu | MSE 0.2112 → 0.1095; quay lại khôi phục đúng 0.2112; dữ liệu mới cho MSE 0.2283 |
| Bàn phím | ArrowRight trên slider learning rate | Giá trị thay đổi 0.12 → 0.13 |
| Cuối khóa ML | Tạo bản nháp, biểu đồ churn, năm trường luận, ba hàm và các tab | Mở đúng đề ML, hiển thị dữ liệu dùng chung với bài kiểm chứng và mascot đã trang bị |
| Responsive | 390×844 và 1440×960 | Các trang chọn khóa, luyện thêm, profile, mô phỏng và cuối khóa không tràn ngang |

Các ảnh QA được tạo trong `output/playwright/`: `ml-mobile-knowledge.png`, `ml-mobile-match.png`, `ml-question-order.png`, `ml-question-chart.png`, `ml-question-number.png`, `ml-question-debug.png`, `ml-mobile-gradient.png`, `ml-desktop-courses.png` và năm ảnh `mascot-family-*.png`. Thư mục output là artifact local, không đưa lên source GitHub.

## Phạm vi

Đây là báo cáo UI và hành vi trình duyệt. Bộ kiểm thử checker, migration, sinh đề, giới hạn runner và toàn bộ luồng điểm nằm trong báo cáo kiểm thử backend. Thử settings xác minh trạng thái lưu và giảm chuyển động; không thay thế kiểm tra cảm nhận âm thanh trên thiết bị thực.

Ba lỗi `ERR_CONNECTION_REFUSED` đầu phiên trình duyệt xảy ra lúc backend QA được khởi động lại; các thao tác UI sau khi server sẵn sàng không phát sinh lỗi runtime mới.
