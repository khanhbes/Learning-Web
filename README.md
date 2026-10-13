# BytePath

Website học DSA tiếng Việt: 48 buổi bắt buộc, 12 buổi nâng cao, robot Byte, mô phỏng, bài tập, editor Python/C++, kiểm tra và bài luận cuối khóa. Học liệu chuyển từ 62 ảnh gốc trong `DSA/`; danh mục và SHA-256 ở `content/sources.json`. 30 bài phỏng vấn được phân bổ trong khóa; tổng ngân hàng có 61 mẫu code.

Bài học có minh họa SVG theo chủ đề, mô phỏng từng bước, bốn kiểu luyện tương tác và khu vực tự thao tác stack/hàng đợi vòng/bit. Vị trí học và bản nháp được lưu để tiếp tục. Xem [báo cáo bàn giao](docs/COMPLETION.md) và [thiết kế hoạt động trực quan](docs/DESIGN-NOTES.md).

## Cách chạy trên máy

Máy cần Node.js 24 trở lên. Runner mặc định dùng WebAssembly, **không cần Docker**. Trong workspace:

```powershell
npm.cmd ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run runner:setup
npm.cmd run build
npm.cmd start
```

Mở http://127.0.0.1:3001. Hoặc chạy `Start BytePath.cmd` / `Stop BytePath.cmd`: launcher tạo `.env` nếu chưa có, chuẩn bị dependency/runtime/build khi thiếu và đợi server sẵn sàng. Bản build và runtime đã được chuẩn bị trong workspace này. Chỉ tải dependency/runtime lần đầu; nội dung, editor, mô phỏng và runner có thể dùng offline sau đó. Gemini cần mạng. Hướng dẫn cấu hình API và vận hành ở [LOCAL.md](docs/LOCAL.md).

## Đưa lên Botkeep

Nếu cần link public tạm thời từ máy này, dùng **Start Public BytePath.cmd** / **Stop Public BytePath.cmd** theo [TUNNEL.md](docs/TUNNEL.md). Máy phải bật và có mạng; link/mật khẩu ở `.data/public/access.txt`, không đưa lên GitHub.

Xem [hướng dẫn Botkeep](docs/BOTKEEP.md) và `.env.botkeep.example`. Repository: [khanhbes/Learning-Web](https://github.com/khanhbes/Learning-Web). Nhánh `main` chứa source; workflow kiểm thử/build rồi tạo **`botkeep-deploy`** có frontend build sẵn. Chọn nhánh này trong source GitHub của Botkeep, install `npm ci --omit=dev`, startup `node --v8-pool-size=1 scripts/cloud-start.mjs`. Runtime được tải và xác minh khi khởi động lần đầu, không cần upload ZIP vượt 5 MB.

Botkeep chạy cả giao diện, backend và SQLite. Một người dùng đăng nhập bằng mật khẩu riêng; đây chưa phải hệ thống nhiều tài khoản. Chưa tự động xuất bản lên tài khoản Botkeep của bạn.

## Chấm điểm

- Kiến thức chấm bằng mã đáp án; thứ tự đáp án được xáo nhưng không đổi đáp án đúng.
- Code nhận JSON qua `solve(data)` và return JSON. Test/checker nằm ngoài WebAssembly của bài nộp. Cặp Two Sum, thứ tự topo và các nghiệm khác đúng được chấp nhận.
- Buổi thường: ít nhất 4/5 câu và code bắt buộc đạt. Kiểm tra tổng hợp: ít nhất 8/10 và cả hai code đạt.
- Lượt mới cố định seed, phiên bản, câu hỏi và test. Tiếp tục bản nháp giữ đề. Kết quả tốt nhất và thưởng lần đầu được giữ.
- Bài cuối khóa: code 60, truy vết 20, khái niệm 10, test phát hiện lỗi mẫu 10. Cần ≥80, ba code đạt và đủ năm phần luận. AI không quyết định điểm hoặc pass/fail.
- Code đạt gắn với nguồn đã nộp; sửa bản đó cần chấm lại. Lỗi hạ tầng giữ lượt đang làm và báo chưa có kết quả.

Không khẳng định mọi chương trình hoặc luận tự do có thể được chấm tuyệt đối chính xác. Kết quả có thể tái hiện theo đề, checker và test đã lưu.

## Runner

Python **3.12.0** trên WASI và **Clang 8.0.1/C++17** trên WebAssembly. Đây là môi trường bài thuật toán: thư viện chuẩn dùng trong khóa, JSON, ListNode/TreeNode và helper đã có sẵn. Không truy cập hệ tệp host, mạng, process hoặc API ứng dụng. Python không có cầu nối JavaScript.

C++ dùng môi trường một luồng, không hỗ trợ exception/thread hay mọi thư viện native. Code cho môi trường này cần return kết quả, không in thêm stdout. Các giới hạn mặc định: memory Wasm 512 MB, output tổng 2 MB, chạy 12 giây, biên dịch/khởi tạo 120 giây; một job được chạy mỗi thời điểm. Timeout biên dịch/hạ tầng chưa quyết định fail. Giới hạn là theo cả batch test của một lượt nộp.

Docker runner cũ vẫn có thể dùng nếu chủ động đặt `BYTEPATH_RUNNER=docker` và build image qua `npm run runner:build`. Website không tự chạy code học viên bằng Python/g++ trực tiếp trên host.

## AI

Mẫu `.env` mặc định chọn Gemini. Nhập `GEMINI_API_KEY` và đặt `GEMINI_FREE_TIER_CONFIRMED=1` sau khi xác nhận project Free Tier với billing tắt, rồi khởi động lại server. Khi chưa có key, gợi ý soạn sẵn theo ba cấp vẫn dùng được. Đặt `BYTEPATH_AI=off` để tắt AI; Ollama là lựa chọn phụ qua `ollama`. Gemini chỉ nhận ngữ cảnh khi bấm hỏi/nhận xét; key chỉ ở backend, không xuất trong backup hoặc bundle frontend.

Để giữ miễn phí, dùng project Gemini Free Tier với billing tắt, đặt `GEMINI_FREE_TIER_CONFIRMED=1`; ứng dụng không tự chuyển model. Giới hạn ứng dụng tối đa 20 lượt/ngày, có thể giảm bằng `GEMINI_DAILY_LIMIT`. Quota Google có thể thấp hơn và phụ thuộc project; lỗi 429 trả về gợi ý soạn sẵn, không thay điểm. Key API không cho ứng dụng tự xác minh trạng thái billing: bạn cần kiểm tra Free Tier trong AI Studio.

Theo điều khoản Gemini Free Tier, nội dung gửi đi có thể dùng để cải thiện sản phẩm. Không gửi dữ liệu nhạy cảm. Xem [giá/quota](https://ai.google.dev/gemini-api/docs/pricing), [quota theo project](https://ai.google.dev/gemini-api/docs/rate-limits), [điều khoản dữ liệu](https://ai.google.dev/gemini-api/terms).

## Backup và phát triển

Trong Hồ sơ, xuất JSON trước khi khôi phục/chuyển server. Bản sao chứa tiến độ, lịch sử đề, code, điểm, ledger và bản nháp; không chứa mật khẩu đăng nhập hoặc Gemini key. Import chỉ chạy khi không còn job đang chấm. Bản nháp có thêm bản giữ trong trình duyệt và tự thử đồng bộ lại khi backend trở lại.

SQLite ở `.data/bytepath.sqlite`; khi sao chép file trực tiếp, dừng server trước và giữ dữ liệu WAL liên quan. Không xóa `.data` khi cập nhật source. Không đưa `.env`, `.data`, `node_modules` vào ZIP chia sẻ.

```powershell
npm.cmd run dev
npm.cmd test
node scripts/verify-solutions.mjs --wasm
node scripts/verify-course-e2e.mjs
python scripts/package-cloud.py
```

Kiểm thử E2E dùng SQLite trong bộ nhớ, không mở khóa giả hay cộng điểm vào dữ liệu người dùng. Báo cáo trong `output/`; xem [ghi chú học liệu và kiểm thử](docs/QUALITY.md).
