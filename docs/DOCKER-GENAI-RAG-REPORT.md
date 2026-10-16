# Báo cáo Docker, Gen AI và RAG LLM

Ngày nghiệm thu kỹ thuật: 16/10/2026. Ba khóa mới dùng cùng luồng học từng bước của BytePath; sáu khóa cũ giữ ID, bản nháp, điểm và lịch sử thưởng.

## Học liệu đã bổ sung

| Khóa | Buổi bắt buộc | Mở rộng | Mẫu thực hành | Ảnh nguồn |
|---|---:|---:|---:|---:|
| Docker | 24 | 6 | 24 | 20 |
| Gen AI | 24 | 6 | 24 | 11 |
| RAG & LLM | 28 | 6 | 22 | 16 |

Toàn bộ hệ thống có chín khóa, 340 buổi (308 buổi học và 32 kiểm tra), 2.464 vị trí hoạt động trong luồng học; 156 mẹo và 217 chủ đề phỏng vấn. Các mẫu biến thể có seed cố định trong lượt; ôn và làm lại sử dụng ngân hàng đã kiểm chứng. Các phần giải thích, ví dụ, thuật ngữ và lỗi hiểu nhầm được biên soạn theo chủ đề, phần đọc sâu thu gọn. Catalog nguồn lưu SHA-256 và ánh xạ bài sử dụng; mọi ảnh mới đều đã được đọc và kiểm kê.

Docker có sơ đồ image → container, ánh xạ cổng, network và volume; điện thoại dùng các khối trạng thái có chữ lớn. Gen AI có token chọn được, cột xác suất/trọng số, mặt nạ causal, ngân sách context và thử ngưỡng. RAG có pipeline nguồn/chia đoạn/truy xuất/ngữ cảnh/bằng chứng, chia đoạn có overlap, vector 2D và kết quả xếp hạng. Hình có trạng thái tính từ dữ liệu, điều khiển bước/chạy/dừng/reset/đổi dữ liệu và chế độ giảm chuyển động.

Các hiệu đính quan trọng: Docker stop khác remove; EXPOSE không tự publish; latest không bảo đảm mới nhất; exit137 chưa chứng minh OOM; token không có độ dài cố định; top-p đạt hoặc vượt ngưỡng; temperature thấp/schema đúng/RAG không bảo đảm sự thật; vector giả lập không được mô tả là embedding ngữ nghĩa từ LLM thực. Chi tiết và nguồn kiểm chứng nằm trong module từng khóa.

## Bằng chứng kiểm thử

| Hạng mục | Kết quả |
|---|---|
| Bộ kiểm thử toàn ứng dụng | 224/224 đạt, không bỏ qua kiểm thử |
| Ngân hàng học và kiểm tra | 200 seed mỗi buổi của cả chín khóa; tám hoạt động và phân bố câu hỏi khái niệm/truy vết/lỗi/vận dụng giữ đúng |
| Docker | 200 seed cho cả 24 mẫu; đo trạng thái cuối độc lập với báo cáo mục tiêu; lời giải tương đương, no-op, lệnh sai, port collision và giữ dữ liệu |
| Gen AI/RAG | 200 seed mỗi mẫu đối chiếu Python tham chiếu độc lập, đầu vào biên, số thực, nghiệm tương đương và đầu ra không hợp lệ |
| Python trong sandbox thật | 46 mẫu, 138 bộ dữ liệu chấm đúng; trường pass do chương trình tự trả không được tin |
| API và dữ liệu | Học xuyên 76 buổi bắt buộc tới ba cuối khóa; kiểm ngưỡng 80%, code bắt buộc, thưởng không lặp, khóa độc lập, lưu/resume và backup |
| Trình duyệt Chromium | Sáu buổi mẫu: Docker1/13, Gen AI1/7, RAG1/10; desktop1440×1000, mobile390×844, bàn phím, giảm chuyển động, reload và editor Docker; không tràn ngang hoặc lỗi JavaScript |
| TypeScript/build | Đạt; Vite cảnh báo kích thước chunk Monaco đã có, editor được tải riêng |
| Xuất bản an toàn | Kiểm source và frontend không chứa API key thật hoặc dữ liệu cá nhân |

Log tái hiện nằm trong thư mục output (không đẩy Git): new-courses-final-tests.log, new-courses-browser.log, new-courses-runtime-report.json, new-courses-types.log, new-courses-build.log; ảnh kiểm tra nằm tại output/playwright/new-*. Các test tái chạy được trong tests/docker-course.test.mjs, genai-course.test.mjs, rag-course.test.mjs và docker-genai-rag-api.test.mjs.

## Giới hạn và vận hành

Docker là mô phỏng có phạm vi lệnh/Dockerfile/Compose được công bố; không thực thi shell, gọi Docker daemon hay mở cổng máy. Gen AI/RAG dùng dữ liệu và quy tắc nhỏ, không huấn luyện hoặc gọi LLM để quyết định điểm. Python chạy bằng Pyodide trong Chromium cách ly; Gemini chỉ trợ giảng theo cấu hình hiện có. Lỗi hạ tầng giữ trạng thái cần chấm lại.

Kiểm thử kỹ thuật và rà soát nội dung không thay thế học thử với người mới. Chưa có nghiên cứu người dùng để khẳng định mọi người học đều hiểu; đánh giá tiếp bằng bài vận dụng và kịch bản BEGINNER-PILOT.md. Điểm cuối khóa xác nhận các kỹ năng khách quan theo đặc tả, không đánh giá trọn vẹn chất lượng văn tự do hoặc khả năng vận hành production.

Quy trình phát hành: build vào thư mục staging, sao lưu hồ sơ riêng, chỉ thay backend khi không có job chấm, giữ asset có hash cũ cho tab đang mở, kiểm tra lại địa chỉ công khai và dữ liệu hiện có sau cập nhật. Không thay tên miền hoặc mật khẩu.

## Đã phát hành

Đã cập nhật tại https://hoc.bytepath.workers.dev và kiểm tra lại qua HTTPS: đủ chín khóa, ba khóa mới có luồng 15 bước và tám hoạt động; frontend mới được phục vụ, API riêng tư vẫn yêu cầu đăng nhập, runner Python và Docker mô phỏng sẵn sàng. Mật khẩu hiện có hoạt động; tiến độ, bài làm, bản nháp và ledger thưởng đã đối chiếu với bản sao lưu trước phát hành và giữ nguyên. Phiên đăng nhập kiểm tra riêng đã được đăng xuất, không tác động phiên người học.
