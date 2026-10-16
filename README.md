# BytePath

Website học CNTT tiếng Việt, gồm **DSA (48 buổi bắt buộc + 12 nâng cao)**, **ML (40 + 12)**, **DA (28 + 8)**, **Git/GitHub (24 + 6)**, **AI Agent (24 + 8)**, **Đại số tuyến tính (28 + 8)**, **Docker (24 + 6)**, **Gen AI (24 + 6)** và **RAG LLM (28 + 6)**. DSA thực hành Python/C++; ML, DA, AI Agent và Đại số thực hành Python, bài SQL dùng SQLite thực; Git và Docker dùng terminal mô phỏng. Gen AI và RAG thực hành Python trên dữ liệu nhỏ, không cần API hoặc tải mô hình lớn. Mỗi khóa có tiến độ, bài kiểm tra và bài luận cuối khóa riêng. Học liệu dựa trên 62 ảnh DSA, 65 ảnh ML, 10 ảnh DA, 10 ảnh Git, 8 ảnh AI Agent, 10 ảnh Đại số, 20 ảnh Docker, 11 ảnh Gen AI và 16 ảnh RAG LLM trong `study documents/`; danh mục, ánh xạ và SHA-256 nằm trong module nội dung từng khóa.

Bài học có minh họa SVG, mô phỏng từng bước, biểu đồ hồi quy/gradient/classification/clustering/PCA, bảng DA có lọc/nhóm/pivot/join và đồ thị commit Git tương tác. AI Agent có sơ đồ quan sát–bộ nhớ–kế hoạch–công cụ, dự đoán bước tiếp theo và trạng thái đã kiểm chứng. Đại số có kéo vector, biến đổi lưới, chiếu, khử Gauss, eigen, SVD và PCA. Trang Mẹo & Phỏng vấn có **156 mẹo, 217 chủ đề** và thưởng kim cương theo hạn mức chung. Hồ sơ dùng chung XP, 30 cấp, 25 skin/mascot gồm Bitty miễn phí và 24 diện mạo cũ, gói X2 theo lượt và vật phẩm. Vị trí học và bản nháp được lưu để tiếp tục. Xem [báo cáo hai khóa mới](docs/AGENT-LINEAR-REPORT.md), [học liệu AI Agent](docs/AI-AGENT.md), [học liệu Đại số](docs/LINEAR-ALGEBRA.md), [báo cáo DA/Git](docs/DA-GIT-REPORT.md), [học liệu ML](docs/ML-CONTENT.md) và [thiết kế hoạt động trực quan](docs/DESIGN-NOTES.md).

Màn chờ có mascot chuyển động; qua bài, lên cấp và mở rương có màn ăn mừng riêng. Xem thử/phát lại tại **Hồ sơ → Xem thử hiệu ứng của Byte** (`/effects`). Có bỏ qua, giảm chuyển động và cài đặt âm thanh. Chi tiết ở [ANIMATION.md](docs/ANIMATION.md).

**Luồng học cho người mới:** 308 buổi học có từng bước từ tình huống, ví dụ đã giải, tám hoạt động làm cùng/tự làm đến code và vận dụng. Hình, số và trace dùng chung dữ liệu ví dụ; nội dung đọc sâu được thu gọn. 15 bài bổ trợ Python/toán mở ngay trong bài và ghi nhớ giữa các khóa. Mục lục phân biệt đã xem/đã thử, lưu vị trí khi tải lại. Xem [báo cáo thiết kế bài giảng](docs/TEACHING-REPORT.md), [rà soát 340 buổi](docs/TEACHING-AUDIT.md) và [kịch bản học thử](docs/BEGINNER-PILOT.md). Tạo lại bảng rà soát bằng `node scripts/audit-teaching.mjs --write`.

**Bitty** là mascot chính mới: mèo robot với 27 biểu cảm, sáu chuyển cảnh, sân khấu sáng/tối và SVG dự phòng khi Rive không hoạt động. Xem tại `/mascot` hoặc liên kết trong phòng hiệu ứng. File `.riv` thật 100.022 byte, runtime/WASM cùng origin; giữ React/Vite và mọi skin đã sở hữu. Lựa chọn skin riêng vẫn được giữ. Rig, keyframe, state machine, hướng dẫn Rive và code có trong [BITTY-CONCEPT.md](docs/BITTY-CONCEPT.md), [BITTY-MOTION.md](docs/BITTY-MOTION.md) và [BITTY-RIVE.md](docs/BITTY-RIVE.md). Dựng lại binary bằng `node scripts/build-bitty-rive.mjs` sau khi cài official Rive CLI 1.5.1; không cần CLI để chạy asset đã bàn giao.

Ba khóa Docker/Gen AI/RAG có [hướng dẫn và phạm vi mô phỏng](docs/DOCKER-GENAI-RAG.md), [báo cáo kiểm thử](docs/DOCKER-GENAI-RAG-REPORT.md).

## Cách chạy trên máy

Máy cần Windows và Node.js 24 trở lên để chạy đầy đủ cả hai runner. Runner dùng WebAssembly, **không cần Docker**. Trong workspace:

```powershell
npm.cmd ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run runner:setup
npm.cmd run ml:setup
npm.cmd run build
npm.cmd start
```

Mở http://127.0.0.1:3001. Hoặc chạy `Start BytePath.cmd` / `Stop BytePath.cmd`: launcher tạo `.env` nếu chưa có, chuẩn bị dependency/runtime/build khi thiếu và đợi server sẵn sàng. Bản build và runtime đã được chuẩn bị trong workspace này. Chỉ tải dependency/runtime lần đầu; nội dung, editor, mô phỏng và runner có thể dùng offline sau đó. Gemini cần mạng. Hướng dẫn cấu hình API và vận hành ở [LOCAL.md](docs/LOCAL.md).

## Truy cập online

Nếu cần link public tạm thời từ máy này, dùng **Start Public BytePath.cmd** / **Stop Public BytePath.cmd** theo [TUNNEL.md](docs/TUNNEL.md). Máy phải bật và có mạng; link/mật khẩu ở `.data/public/access.txt`, không đưa lên GitHub.

Địa chỉ hiện tại: **https://hoc.bytepath.workers.dev**. Backend vẫn chạy trên máy Windows; Cloudflare chuyển tiếp truy cập qua tunnel có mật khẩu.

Xem [hướng dẫn Botkeep](docs/BOTKEEP.md) và `.env.botkeep.example`. Repository: [khanhbes/Learning-Web](https://github.com/khanhbes/Learning-Web). Nhánh `main` chứa source; workflow kiểm thử/build rồi tạo **`botkeep-deploy`** có frontend build sẵn. Chọn nhánh này trong source GitHub của Botkeep, install `npm ci --omit=dev`, startup `node --v8-pool-size=1 scripts/cloud-start.mjs`. Runtime được tải và xác minh khi khởi động lần đầu, không cần upload ZIP vượt 5 MB.

Botkeep có thể chạy giao diện, backend, SQLite và runner DSA. **Runner ML hiện dùng Windows Job Object nên chưa hỗ trợ Linux/Botkeep.** Bản đầy đủ đang dùng máy Windows và tunnel. Một người dùng đăng nhập bằng mật khẩu riêng; đây chưa phải hệ thống nhiều tài khoản. Chưa xuất bản lên tài khoản Botkeep của bạn.

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

ML, DA, AI Agent và Đại số dùng **Pyodide 314.0.7 / Python 3.14** trong Chromium headless có sandbox, kèm NumPy, pandas, SciPy, scikit-learn và matplotlib được khóa phiên bản. DA chạy SQL bằng SQLite `:memory:` riêng; bài Agent dùng fixture xác định, không cần gọi API; Đại số công khai sai số và chấp nhận nghiệm tương đương theo đặc tả. Windows Job Object giới hạn cả job ở 1 GB; khởi tạo tối đa 120 giây, thực thi 30 giây, output 2 MB. Chỉ nạp package cần dùng; mạng ngoài, filesystem host, cookie ứng dụng và API key không được cấp cho runner. Thiếu runtime hoặc vượt tài nguyên trả trạng thái cần chấm lại. Xem [chuẩn bị và giới hạn runner](docs/ML-RUNTIME.md).

Git/GitHub dùng mô hình repository ảo, không chạy shell hay sửa repository trên máy. Lệnh trong allowlist thay đổi working tree, index, commit, nhánh và remote ảo; checker đối chiếu trạng thái mục tiêu. Giới hạn 120 dòng, đầu vào 64 KB và đầu ra 2 MB. Phạm vi lệnh hỗ trợ được công khai trong bài và [GIT-CONTENT.md](docs/GIT-CONTENT.md).

## AI

Mẫu `.env` mặc định chọn Gemini. Nhập `GEMINI_API_KEY` và đặt `GEMINI_FREE_TIER_CONFIRMED=1` sau khi xác nhận project Free Tier với billing tắt, rồi khởi động lại server. Khi chưa có key, gợi ý soạn sẵn theo ba cấp vẫn dùng được. Đặt `BYTEPATH_AI=off` để tắt AI; Ollama là lựa chọn phụ qua `ollama`. Gemini chỉ nhận ngữ cảnh khi bấm hỏi/nhận xét; key chỉ ở backend, không xuất trong backup hoặc bundle frontend.

Để giữ miễn phí, dùng project Gemini Free Tier với billing tắt, đặt `GEMINI_FREE_TIER_CONFIRMED=1`; ứng dụng không tự chuyển model. Giới hạn ứng dụng tối đa 20 lượt/ngày, có thể giảm bằng `GEMINI_DAILY_LIMIT`. Quota Google có thể thấp hơn và phụ thuộc project; lỗi 429 trả về gợi ý soạn sẵn, không thay điểm. Key API không cho ứng dụng tự xác minh trạng thái billing: bạn cần kiểm tra Free Tier trong AI Studio.

Theo điều khoản Gemini Free Tier, nội dung gửi đi có thể dùng để cải thiện sản phẩm. Không gửi dữ liệu nhạy cảm. Xem [giá/quota](https://ai.google.dev/gemini-api/docs/pricing), [quota theo project](https://ai.google.dev/gemini-api/docs/rate-limits), [điều khoản dữ liệu](https://ai.google.dev/gemini-api/terms).

## Backup và phát triển

Trong Hồ sơ, xuất JSON trước khi khôi phục/chuyển server. Bản sao chứa tiến độ, lịch sử đề, code, điểm, ledger và bản nháp; không chứa mật khẩu đăng nhập hoặc Gemini key. Import chỉ chạy khi không còn job đang chấm. Bản nháp có thêm bản giữ trong trình duyệt và tự thử đồng bộ lại khi backend trở lại.

Backup v2 lưu riêng từng khóa. Backup v1 được chuyển vào DSA trong giao dịch, giữ lịch sử và vật phẩm; các phần thưởng đã nhận không được cấp lại.

SQLite ở `.data/bytepath.sqlite`; khi sao chép file trực tiếp, dừng server trước và giữ dữ liệu WAL liên quan. Không xóa `.data` khi cập nhật source. Không đưa `.env`, `.data`, `node_modules` vào ZIP chia sẻ.

```powershell
npm.cmd run dev
npm.cmd test
node scripts/verify-solutions.mjs --wasm
node scripts/verify-course-e2e.mjs
python scripts/package-cloud.py
```

Kiểm thử E2E dùng SQLite trong bộ nhớ, không mở khóa giả hay cộng điểm vào dữ liệu người dùng. Báo cáo trong `output/`; xem [ghi chú học liệu và kiểm thử](docs/QUALITY.md).
