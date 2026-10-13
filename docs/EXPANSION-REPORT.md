# Nghiệm thu mở rộng BytePath — 13/10/2026

## Phạm vi

Registry phục vụ DSA 48+12 và ML 40+12, giữ URL/API DSA cũ, có chọn khóa và tiến độ/ngôn ngữ/cuối khóa riêng. SQLite/backup v2 chuyển v1 sang DSA trong giao dịch; XP, inventory và ledger cũ giữ nguyên, quà cấp được cấp một lần.

Học liệu: 62 ảnh DSA giữ hash sau khi chuyển thư mục; 65 ảnh ML có danh mục/ánh xạ. ML có 48 mẫu code, 24 thí nghiệm thư viện, tám hoạt động/buổi, 35 chủ đề phỏng vấn, bốn kiểm tra và cuối khóa trên cùng dữ liệu churn giả lập. Xem ML-CONTENT.md để biết hiệu đính và giới hạn các bài nhỏ.

Trang mẹo/phỏng vấn có 40 mẹo/65 chủ đề, câu khách quan sinh biến thể, lịch ôn/bookmark, nhiều loại đáp án và phản hồi luận. Cửa hàng/inventory có 24 diện mạo riêng, ba gói X2, vé năng lượng, khung avatar và 30 cấp/quà. Không có thanh toán.

## Bằng chứng

- `output/test-final-expansion.log`: **80/80 test, không bỏ qua**, gồm DSA, ML, API, backup/migration, pass/fail, chống lặp, hạn mức và reward.
- 200 seed cho mỗi mẫu code; ML đối chiếu 9.600 seed với Python độc lập, test biên, 510 miền nhị phân baseline và 648 confusion case.
- 200 seed cho từng hoạt động ML của 52 buổi (10.400 lab); câu hỏi/ID/đáp án và đầu ra tương đương được kiểm tra.
- Luyện thêm: 210 mẫu × 200 seed, đáp án số đối chiếu độc lập; thử cap kim cương/XP, lịch ôn và nộp hai lần.
- `output/ml-runtime-report.json`: 384/384 bộ dữ liệu lời giải ML chạy trong Chromium; đúng accepted/sai rejected; không đọc host/.env, không có Node/API key, mạng ngoài bị chặn, timeout/output limit, package thiếu trả lỗi hạ tầng.
- `output/ml-demo-report.json`: 24/24 thí nghiệm dùng thư viện thật và 13 mốc số đạt trong năm nhóm package riêng, dưới giới hạn 1 GB.
- `output/ml-real-api-report.json`: bài ML1 và ba code cuối khóa qua API/runner thật, chấm đúng, thưởng không trùng và backup/draft ML giữ courseId. Các buổi 2–40 được thiết lập fixture trong script này; luồng mở khóa đủ 40 được kiểm tra riêng bằng API test với runner giả lập. Không đánh đồng hai loại bằng chứng.
- Frontend được TypeScript/build kiểm tra; ảnh QA desktop/mobile trong output/. Source/key/private SQLite không được đưa lên GitHub.
- `output/expansion-live-report.json`: kiểm tra HTTPS tại `https://hoc.bytepath.workers.dev` sau phát hành đạt. Đăng nhập bằng mật khẩu hiện có; API riêng từ chối truy cập chưa đăng nhập; bundle frontend trùng bản đã QA; ML runner sẵn sàng; backup chuyển v1 → v2 và giữ tiến độ, bài đã bắt đầu, XP, inventory, lịch sử nộp và ledger DSA.

## Phát hành

Bản mở rộng đã cập nhật vào backend Windows và frontend public ngày 13/10/2026. Có snapshot riêng trước migration tại `.data/public/ml-before-export.json`; snapshot không đưa lên GitHub. Tunnel cũ bị Cloudflare hủy đăng ký dù tiến trình còn chạy; launcher đã được sửa để kiểm tra đầu HTTPS và tạo lại kết nối. Worker đã cập nhật đích mới, giữ địa chỉ ngắn, mật khẩu và hồ sơ. Backend và trình duyệt QA riêng đã đóng sau nghiệm thu.

## Giới hạn vận hành

ML dùng Windows Job Object/Chromium sandbox, RAM cả job 1 GB, một job tại một thời điểm. Khởi tạo tối đa 120 giây, thuật toán 30 giây, đầu ra 2 MB. Chỉ nạp thư viện cần dùng; tổ hợp thư viện/mô hình quá lớn có thể vượt giới hạn và cần giảm phạm vi hoặc chấm lại. Một lần thử nạp cả năm thư viện cùng lúc đã vượt tài nguyên; các nhóm đúng nhu cầu bài và toàn bộ ví dụ của khóa đã qua. Không tăng RAM ngầm hoặc bỏ sandbox.

Website giữ `https://hoc.bytepath.workers.dev`, password và SQLite hiện có. Tunnel cần máy đang bật. Gemini cần mạng/key Free Tier; kiểm tra tích hợp dùng phản hồi giả lập, API Gemini thật đã được xác minh ở bản trước. Thay đổi lần này mở rộng ngữ cảnh ML; AI vẫn không quyết định điểm hoặc thưởng.

Monaco được tải riêng khi mở editor; chunk editor lớn là cảnh báo build, không phải lỗi. Phạm vi kiểm thử không chứng minh chấm đúng tuyệt đối mọi code/bài luận tùy ý. Chính thức chấm theo đặc tả/checker/phiên bản và bằng chứng được lưu.
