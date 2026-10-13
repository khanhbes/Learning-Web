# Chạy BytePath local và dùng Gemini trợ giảng

Website, tiến độ SQLite và chấm code chạy trên máy của bạn tại http://127.0.0.1:3001. Python/C++ chạy trong WebAssembly với test/checker có sẵn; AI không quyết định điểm, pass/fail hoặc mở khóa. Không cần Docker, Botkeep hay tải model AI.

DSA và ML có tiến độ riêng. ML dùng Python 3.14/Pyodide cùng NumPy, pandas, SciPy, scikit-learn và matplotlib trong Chromium cách ly. Xem [chuẩn bị runner ML](ML-RUNTIME.md), [học liệu](ML-CONTENT.md) và [cấp độ/vật phẩm](MULTI-COURSE-GAME.md). Khởi động lần đầu cần mạng để tải tài nguyên; chấm và học sau đó dùng offline.

## Khởi động

Máy cần Node.js 24 trở lên. Chạy `Start BytePath.cmd` ở thư mục dự án, đợi thông báo sẵn sàng rồi mở địa chỉ trên. Launcher tạo `.env` từ `.env.example` nếu chưa có, cài dependency/runtime/build khi thiếu. Nó luôn dùng local tại cổng 3001 và runner WebAssembly, giữ nguyên key trong `.env`.

Để dừng, chạy `Stop BytePath.cmd`. Sau khi sửa `.env`, dừng rồi khởi động lại. Bấm Start khi web đang chạy không tạo server thứ hai.

Nếu muốn chạy bằng terminal từ thư mục dự án:

```powershell
# Chỉ sao chép nếu chưa có .env, tránh ghi đè API key đã nhập.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd ci
npm.cmd run runner:setup
npm.cmd run ml:setup
npm.cmd run build
npm.cmd start
```

Terminal phải giữ mở; dùng Ctrl+C để dừng server chạy bằng `npm start`. Script Stop chỉ dừng tiến trình do launcher Start tạo.

## Bật trợ giảng Gemini

Mở file `.env` ở thư mục gốc bằng editor và nhập:

```dotenv
BYTEPATH_MODE=local
PORT=3001
BYTEPATH_RUNNER=wasm
BYTEPATH_AI=gemini
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_API_KEY=dan-key-cua-ban-vao-day
GEMINI_FREE_TIER_CONFIRMED=1
GEMINI_DAILY_LIMIT=20
```

Chỉ đặt `GEMINI_FREE_TIER_CONFIRMED=1` khi project đang ở Free Tier, billing tắt. Không cần gửi key trong chat. `.env` đã được loại khỏi Git và gói chia sẻ. Key do backend đọc, không nhập vào frontend hay dùng biến `VITE_*`.

Khởi động lại, mở Hồ sơ để xem trạng thái trợ giảng; trong bài học bấm hỏi Byte. AI hỗ trợ giải thích khái niệm, gợi ý và lỗi công khai, nhận xét bài luận đã nộp. Trợ giảng bị chặn trong lượt kiểm tra tính điểm. Không có lời gọi Gemini tự động để chấm bài.

Ứng dụng giới hạn tối đa 20 yêu cầu/ngày, có thể giảm bằng `GEMINI_DAILY_LIMIT`. Quota Google thực tế phụ thuộc project; mất mạng, hết quota hoặc phản hồi lỗi thì dùng gợi ý soạn sẵn, phần chấm local vẫn hoạt động. API key không tự chứng minh billing đang tắt. Xem [billing](https://ai.google.dev/gemini-api/docs/billing) và [giá Free Tier](https://ai.google.dev/gemini-api/docs/pricing). Theo [điều khoản Gemini](https://ai.google.dev/gemini-api/terms), nội dung gửi qua dịch vụ miễn phí có thể được dùng cải thiện sản phẩm.

## Dữ liệu và xử lý lỗi

- Tiến độ và bài làm nằm trong `.data/bytepath.sqlite`; giữ nguyên `.data` khi cập nhật ứng dụng.
- Xuất JSON tại Hồ sơ để backup; key không nằm trong bản sao này.
- Khi không khởi động được, xem `.data/server-error.log` và `.data/server.log`.
- Nếu báo thiếu runtime, chạy `npm.cmd run runner:setup`; cần mạng khi tải lần đầu.
- Nếu cổng 3001 đã được ứng dụng khác dùng, đóng ứng dụng đó trước. Website không mở cho máy khác trong mạng LAN.
- Để học không cần API, đặt `BYTEPATH_AI=off` rồi khởi động lại. Nội dung, editor, mô phỏng và chấm code dùng offline sau khi dependency/runtime đã được tải.
