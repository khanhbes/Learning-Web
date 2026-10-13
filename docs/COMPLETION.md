# Bàn giao BytePath — 13/10/2026

Phương án hiện tại theo lựa chọn của người dùng: chạy local, chấm bằng test/checker có sẵn trên WebAssembly, Gemini chỉ trợ giảng và phản hồi. Không cần Docker hoặc Botkeep để học và chấm code. Ngày 13/10/2026, người dùng đã cấu hình key và một yêu cầu trợ giảng qua API thật đã trả lời thành công.

## Phạm vi đã hoàn thiện

| Phần của plan | Kết quả trong source |
|---|---|
| Học liệu | Danh mục 62 ảnh với SHA-256, nguồn trong buổi học, sổ hiệu đính, 48 buổi bắt buộc + 12 nâng cao, 30 bài phỏng vấn và 61 mẫu code |
| Giảng dễ hiểu | Ví dụ đời thường, phản ví dụ, hướng dẫn thuật toán/độ phức tạp riêng từng mẫu, code Python/C++, nhớ lại và lịch trình gợi ý; bài code mở rộng có nội dung riêng |
| Minh họa | 28 chủ đề SVG có góc nhìn Nhìn/Thử/Ghi nhớ; mảng, con trỏ, cửa sổ, hashing, stack/queue, danh sách, cây/đồ thị, DP, bit, Big-O, Trie, topo và greedy |
| Mô phỏng | Chạy/dừng/từng bước/tốc độ/reset/dữ liệu mới/trường hợp biên; tám sorting, bốn traversal cây, trạng thái đệ quy, N-Queens và phụ thuộc DP; mô tả văn bản, bàn phím và giảm chuyển động |
| Bài tập đa dạng | Sắp bước bằng kéo hoặc nút, ghép cặp, nhập kết quả, sửa lỗi; tám câu luyện, viết code, kiểm tra kiến thức và bài luận có cấu trúc |
| Lưu bài | Vị trí hoạt động/đoạn giảng, tab và đáp án lab, bản nháp code theo ngôn ngữ, bản nháp luận/lịch sử, khôi phục khi tải lại, xuất/nhập dữ liệu |
| Chấm và mở khóa | ≥80% kiến thức và code bắt buộc; test biên/tài nguyên cho mọi mẫu, checker nhiều nghiệm, seed/phiên bản/fixture cố định; giữ kết quả tốt nhất, lỗi hạ tầng không đánh fail |
| Cuối khóa | Ba chức năng tiên quyết/priority queue/prefix sum, năm phần luận, truy vết/khái niệm/test phát hiện lỗi mẫu; pass ≥80 và cả ba code đạt |
| Game | XP/gem/năng lượng/streak Asia/Saigon, nhiệm vụ có thể hoàn thành, cửa hàng/hộp quà chống nhận trùng, huy hiệu chương/sửa lỗi/trường hợp biên, giải đấu mô phỏng 19 bot có seed cố định |
| Trợ giảng | Gemini ở backend, giới hạn ứng dụng và xử lý lỗi, chặn trợ giúp trong kiểm tra, gợi ý soạn sẵn khi thiếu key, phản hồi luận theo schema; AI không sửa điểm |
| Vận hành | SQLite local, script Start/Stop Windows, runtime offline sau lần tải đầu, tài liệu backup và giới hạn runner |

## Bằng chứng kiểm thử

- `npm test`: 48 test qua, 0 lỗi, 0 bỏ qua.
- `npm run build`: TypeScript và build frontend thành công.
- [Báo cáo lời giải](../output/wasm-solution-verification.json): 12.748 trường hợp cho từng Python/C++, 61 mẫu + một cài đặt BFS thay thế, 200 seed/mẫu và fixture mẫu/biên/tài nguyên; không có kết quả sai.
- [Báo cáo hành trình](../output/course-e2e-report.json): 48 buổi đạt, 55 submission, capstone 100/100, mở 12 buổi nâng cao, thưởng chống lặp và khôi phục backup. Kiểm thử dùng SQLite cách ly, không thay tiến độ người dùng.
- Playwright kiểm tra bốn lab, bàn phím, lưu/khôi phục tab và bản nháp, cây lớn 127 node, N-Queens, Radix/Heap Sort, hàng đợi vòng, công tắc bit, DP và màn hình rộng 390 px. Hết năng lượng hiển thị nguyên nhân và đường hồi phục thay vì treo màn hình tải. Script/ảnh nằm trong `output/playwright/`; phản hồi API chấm của lab được kiểm tra thật.

## Cách mở

Chạy `Start BytePath.cmd`, mở **http://127.0.0.1:3001**. Dừng bằng `Stop BytePath.cmd`; tiến độ nằm trong `.data/bytepath.sqlite`. Xem [LOCAL.md](LOCAL.md) để cấu hình Gemini, sao lưu và khởi động lại.

## Phần để sau và giới hạn xác nhận

Đã gọi `/api/tutor` với key do người dùng cấu hình ngày 13/10/2026: HTTP 200, `available=true`, model `gemini-3.5-flash-lite`, giải thích đúng ví dụ cộng 3 và 5 trả 8. Báo cáo không chứa key tại `output/gemini-live-verification.json`. Phản hồi rubric JSON, quota và timeout được kiểm tra bằng phản hồi mô phỏng; chưa kiểm thử rubric với API thật hoặc benchmark toàn bộ chất lượng model. Học và chấm khách quan vẫn dùng được khi thiếu AI. Trạng thái billing dựa trên xác nhận của người dùng, không suy ra từ một lời gọi thành công.

Thời lượng 45–60 phút là ước lượng thiết kế, chưa đo với người mới. Test hữu hạn xác nhận theo đặc tả và dữ liệu đã lưu, không chứng minh mọi code bất kỳ đúng. C++ chạy Clang 8/C++17 trên WebAssembly với giới hạn native đã công bố. Mô phỏng rất dài có thể rút gọn phần giữa và thông báo rõ. Nội dung minh họa/chuyển thể được gắn nhãn bổ sung, không giả là nguyên văn ảnh nguồn. Chi tiết ở [QUALITY.md](QUALITY.md).
