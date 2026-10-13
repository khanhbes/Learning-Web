# Nghiệm thu animation — 13/10/2026

QA chạy trên hai SQLite riêng: `.data/ml-ui-qa.sqlite` và `.data/motion-ui-qa.sqlite`. Không dùng hồ sơ public để tạo thành tích thử nghiệm.

| Kiểm tra thực tế | Kết quả |
|---|---|
| Năm màn xem thử `/effects` | Màn chờ, qua bài, mở quà, lên cấp, hoàn thành khóa đều hiển thị; xem lại và bỏ qua hoạt động |
| Xem thử và bỏ qua | XP/gem backend giữ nguyên; dữ liệu minh họa có nhãn rõ |
| Lên nhiều cấp | Event QA thật 17 → 20; ba quà, preview mascot và thanh XP xuất hiện theo nhịp |
| Footer level | Desktop 1280×720 và mobile 390×844 luôn nhìn thấy Tiếp tục/Bỏ qua; nội dung quà có thể cuộn |
| Giảm chuyển động | Phase cuối xuất hiện ngay, quà rõ, animation hero/halo tắt, confetti ẩn |
| Đổi cài đặt OS khi đang mở trang | Không cần reload: no-preference → reduce giữ rương ở tư thế mở, animation tắt; đổi giữa bộ đếm XP chốt đúng 50/50 |
| Rương bảo vệ streak | API thật thêm một vật phẩm; inventory đầy đổi thành 10 gem đúng |
| Nhiệm vụ | API thật thêm 15 gem; XP giữ nguyên; nhận lại bị backend từ chối |
| Quà hoàn thành khóa | Đúng tiêu đề hoàn thành khóa; không trình bày như vừa lên cấp; skin có preview |
| Chặng cuối ML | Nút Chặng tiếp bị khóa, không mở chặng ngoài registry |
| Phiên luyện kiến thức | 5/5, backend thưởng 20 XP/12 gem; scene dùng đúng giá trị. Lượt 4/5 có phản hồi đúng/sai tương ứng checker |
| Chấm code | Job thật accepted qua 13 test: mẫu, biên, ẩn và hiệu năng; màn gửi bài/hàng đợi/chấm lấy trạng thái thật, không có phần trăm giả |
| Feedback quiz | Chọn đúng rồi đổi sang sai qua API thật: màu xanh cũ biến mất, phản hồi mới khớp đáp án; không tràn ngang |
| Trường hợp code mẫu/code đạt | Màn ăn mừng không tự tạo XP/gem; test mẫu được gọi đúng phạm vi |
| Mobile | Các màn preview, gift, level, knowledge và code không tràn ngang tại 390×844 |

Ảnh QA ở `output/playwright/motion-*` và `output/playwright/reward-motion-*`. Các ảnh không được đưa vào source GitHub. TypeScript và production build đạt; lần build cuối ghi trong `output/build-motion-release.log`. Video QA không tạo do cache recorder thiếu ffmpeg; kiểm tra dùng thao tác trình duyệt, ảnh, trạng thái DOM và API thật.

Animation thay cách trình bày; không thay checker, rubric, mức thưởng hoặc điều kiện pass/fail. Snapshot riêng trước cập nhật ở `.data/public/motion-before-export.json`; snapshot trước migration ML vẫn được giữ nguyên. Kết quả kiểm tra đăng nhập, bundle public và dữ liệu sau phát hành lưu ở `output/motion-live-report.json`.

Đã phát hành tại `https://hoc.bytepath.workers.dev` ngày 13/10/2026. Kiểm tra HTTPS đạt: bundle trùng bản QA, đăng nhập bằng mật khẩu hiện có, API riêng vẫn yêu cầu đăng nhập; dữ liệu cả DSA/ML, XP, inventory và lịch sử nộp giữ nguyên. Chỉ thay frontend, backend và phiên đăng nhập đang chạy được giữ.
