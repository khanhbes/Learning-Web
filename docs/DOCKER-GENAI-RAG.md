# Docker, Gen AI và RAG LLM

## Phạm vi và cách học

Ba khóa bổ sung vào cùng hồ sơ BytePath; tiến độ, bản nháp, bài kiểm tra và cuối khóa riêng. XP, kim cương, năng lượng, vật phẩm và lịch ôn dùng các quy tắc hiện có. Học liệu dựa trên 47 ảnh trong `study documents/`: Docker 20, Gen AI 11, RAG LLM 16. Catalog từng khóa lưu SHA-256 và liên kết bài sử dụng nguồn.

| Khóa | Bắt buộc | Mở rộng | Thực hành |
|---|---:|---:|---|
| Docker | 24 | 6 | Lệnh trên trạng thái image/container/network/volume ảo |
| Gen AI | 24 | 6 | Python, bảng token và phép tính nhỏ đã xác định |
| RAG LLM | 28 | 6 | Python, tài liệu nhỏ, truy xuất, trích dẫn và đánh giá |

Mỗi buổi học dùng luồng hướng dẫn hiện có: tình huống → ví dụ → làm cùng → tự thử → vận dụng → code/lệnh → kiểm tra. Tám hoạt động có dữ liệu cố định theo seed; phần thuật ngữ, đọc sâu và nguồn có thể mở khi cần. Kiến thức cần đạt 80% và bài code/lệnh bắt buộc phải đạt. Bài kiểm tra tổng hợp có 10 câu và hai bài bắt buộc; cuối khóa có ba chức năng cùng bài luận và rubric khách quan.

## Định hướng hình ảnh

Không gian sáng, ít chữ trên mỗi bước; hình lớn chỉ tập trung vào một thay đổi. Giữ font, Bitty và hệ thống điều hướng của BytePath. Trang khóa học có minh họa riêng: image tạo container; xác suất token; tài liệu đi qua truy xuất tới trích dẫn.

Trình tự trình bày: câu hỏi thực tế và hình chính, một phép thử ngắn, diễn giải kết quả sát hình, rồi nút tiếp tục. Công thức, dữ liệu gốc và chi tiết triển khai mở dần.

Chuyển động có mục đích: tài nguyên đổi trạng thái sau lệnh; cột xác suất thay đổi theo tham số; đoạn tài liệu được tô và di chuyển qua các bước truy xuất. Mọi mô phỏng dừng khi người học đọc, có bước trước/sau và reset; điều khiển dùng được bằng bàn phím, tôn trọng giảm chuyển động.

## Phạm vi mô phỏng và chấm

- Docker là trình mô phỏng giáo dục trong bộ nhớ. Không chạy shell, mở cổng, tải image hay truy cập filesystem máy. Lệnh ngoài phạm vi được báo rõ; không giả báo đã thực thi thành công. Mục tiêu được kiểm tra từ trạng thái cuối và dữ liệu cần giữ.
- Gen AI không dùng kết quả LLM tự do để tính điểm. Token/vector/đầu ra mô hình được cho trong đề; phép tính và hợp đồng được chấm bằng checker độc lập với chương trình nộp.
- RAG dùng tập tài liệu nhỏ và các quy tắc truy xuất được nêu rõ. Vector đơn giản hoặc đã cấp sẵn phục vụ việc hiểu thuật toán; không được mô tả là embedding ngữ nghĩa từ mô hình lớn.
- Python chạy bằng Pyodide trong Chromium cách ly hiện có. Không cần cài Docker hay tải mô hình mới. Gemini chỉ góp ý khi người học yêu cầu và vẫn bị chặn trong lượt kiểm tra.
- Luận tự do nhận góp ý; không tuyên bố chấm khách quan toàn bộ chất lượng văn bản. Các bài mô phỏng không chứng nhận kinh nghiệm vận hành production.

## Vận hành

Khóa được đăng ký trong `content/registry.mjs`; nội dung và nguồn nằm tại `content/docker`, `content/genai`, `content/rag`, thiết kế hướng dẫn tại `content/pedagogy`. Thêm khóa không đổi ID, seed, đáp án đã lưu hoặc thưởng của khóa cũ. Backup v2 bổ sung trạng thái các khóa mới theo registry.

Xem báo cáo kiểm chứng và phát hành trong `DOCKER-GENAI-RAG-REPORT.md`. Việc kiểm thử kỹ thuật không thay thế lượt học thử với người mới; dùng kịch bản trong `BEGINNER-PILOT.md` với các buổi nhập môn mới để đánh giá khả năng vận dụng.
