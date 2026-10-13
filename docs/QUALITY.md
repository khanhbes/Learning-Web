# Học liệu và kiểm chứng

## Nội dung

`content/sources.json` là danh mục 62 ảnh với mã tham chiếu, bộ tài liệu, trang, chủ đề và SHA-256. `content/sources-map.mjs` chứa sổ hiệu đính; màn hình Tài liệu cho xem ảnh gốc và phần sửa. Ảnh gốc không bị sửa.

Nội dung course → unit → lesson gồm 44 buổi giảng, kiểm tra tại buổi 13/26/38/48 và 12 buổi nâng cao. Mỗi bài có mục tiêu, kiến thức, ví dụ, phản ví dụ, độ phức tạp, mô phỏng, tám câu luyện, code bắt buộc và code mở rộng. Cả 56 buổi không phải kiểm tra có thêm bốn hoạt động tương tác: sắp bước, ghép cặp, nhập kết quả truy vết và sửa lỗi. `content/guides-v2.mjs` chứa hướng dẫn riêng cho cả 61 mẫu; bài mở rộng có mục giải thích, code và mô phỏng riêng. `content/curriculum.mjs` ghi nguồn và nhãn hiệu đính/bổ sung; `content/schema.mjs` kiểm tra cấu trúc và tham chiếu khi backend khởi động.

Minh họa SVG theo 28 chủ đề được đặt trước đoạn giải thích, với ba góc nhìn Nhìn/Thử/Ghi nhớ. Mô phỏng có trạng thái thực của thuật toán, điều khiển từng bước, đổi dữ liệu và chọn trường hợp biên. Cây có bốn cách duyệt; sorting có tám thuật toán. DP chỉ rõ ô phụ thuộc; N-Queens thể hiện đặt/thử/tháo quân; hàng đợi vòng, stack và bit có khu vực tự thao tác. Buổi 39 dùng BFS để đếm thành phần liên thông, không đòi Union-Find trước buổi nâng cao 54.

Các sửa chính có regression: Number of Islands 4 đảo, đường kính cây 5 cạnh, Dijkstra `[0,4,1,6,5]`. Big-O/Ω/Θ không đồng nghĩa xấu nhất/tốt nhất/trung bình. Nhãn đồ thị/con trỏ và chi phí Python/C++ được làm rõ theo triển khai.

Ngân hàng gồm 61 mẫu, trong đó 30 bài phỏng vấn từ tài liệu. Đáp án/checker có quy tắc nhiều nghiệm. Codec dùng định dạng BFS đã công bố. Bellman–Ford của bài code dùng DAG và trả distances; phát hiện chu trình âm được giải thích là phần mở rộng, không đánh đồng với hợp đồng đầu ra hiện tại.

## Báo cáo chạy thực tế

- `output/wasm-solution-verification.json`: 61 mẫu, 62 cài đặt (gồm BFS thay thế Union-Find), 200 seed/mẫu cùng sample, trường hợp biên được soạn riêng và fixture tài nguyên; **12.748/12.748** trường hợp đúng cho từng Python và C++ trên WebAssembly.
- `output/course-e2e-report.json`: API thật + runner thật + SQLite cách ly đi qua **48 buổi, 55 submission**, capstone **100/100**, mở 12 buổi nâng cao, kiểm tra thưởng chống lặp và khôi phục backup.
- `output/solution-verification.json`: kiểm chứng Docker trước khi đổi kiến trúc, 60 mẫu, 12.080 trường hợp/ngôn ngữ. Đây là bằng chứng lịch sử, không phải yêu cầu Docker để dùng bản mới.
- `npm test`: **48/48 test qua, không bỏ qua test**. Bao gồm nguồn/SHA, schema học liệu, seed/câu hỏi/đáp án nhiễu, checker nhiều nghiệm, đối chiếu vét cạn/Floyd, điều kiện 80%, API, nguồn code gắn pass, giao dịch, energy/streak/league, capstone, login cloud, quota/JSON/timeout Gemini và giới hạn runner. Các test mới đối chiếu trạng thái sorting/cây/DP/DSU, sinh bốn hoạt động tương tác trên 200 seed cho mỗi buổi, lưu và tiếp tục bài, không thưởng trùng, hàng đợi vòng và huy hiệu chương/sửa lỗi/trường hợp biên.

Các lượt mới dùng phiên bản đề `2026.10.13-v2`, có fixture biên và tài nguyên cho cả 61 mẫu. Job lưu bộ fixture trước khi chạy; API không trả expected output của test ẩn. Lượt cũ `2026.10.12-v1` vẫn tái tạo bộ test cũ, không bị đổi tiêu chí khi cập nhật nội dung. Fixture nhóm performance cho các bài có miền nhỏ dùng giá trị lớn nhất trong đặc tả; nhóm này không chứng minh Big-O hay khả năng chạy với dữ liệu ngoài miền công bố.

Test Gemini dùng phản hồi mô phỏng để kiểm tra thành công văn bản/JSON, quota, lỗi và timeout. Sau khi người dùng cấu hình key ngày 13/10/2026, đã kiểm tra thêm một yêu cầu trợ giảng qua backend với API thật: HTTP 200, `available=true`, câu trả lời đúng ví dụ 3+5=8; báo cáo tại `output/gemini-live-verification.json`. Chưa kiểm thử rubric JSON với API thật; lời gọi thành công không xác minh trạng thái billing. Màn hình desktop/mobile được kiểm tra bằng Playwright; ảnh QA ở `output/playwright`. Báo cáo phạm vi bàn giao ở [COMPLETION.md](COMPLETION.md).

## Giới hạn

Chấm code xác nhận đúng trên đặc tả và bộ test, không là chứng minh mọi chương trình bất kỳ. Không suy Big-O từ thời gian chạy. JSON Clone Graph xác minh cấu trúc, không chứng minh hai đối tượng độc lập địa chỉ. Checker Product Except Self không xác nhận người học tránh phép chia. Bài luận có kiểm chứng khách quan riêng; chất lượng lập luận tự do nhận phản hồi AI, không được tuyên bố chấm tuyệt đối.

WASM dùng profile thuật toán một luồng, không hệ tệp host/mạng, C++ không exception hoặc thư viện native tùy ý. Mô phỏng chạy thuật toán chuẩn, không chạy code học viên. Botkeep là môi trường triển khai mới nên phải kiểm tra tài nguyên/HTTPS sau upload trước khi xem deployment là hoàn tất.

Lịch trình 55 phút trong mỗi buổi là gợi ý phân bổ thời gian; chưa có thử nghiệm với người mới để xác nhận thời lượng hoặc hiệu quả học. Sơ đồ lớn cuộn trong vùng riêng và có trạng thái văn bản; mô phỏng quá dài giữ các bước đầu và kết quả cuối, thông báo rõ phần giữa đã rút gọn.
