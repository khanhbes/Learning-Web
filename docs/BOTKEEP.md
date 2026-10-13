# Đưa BytePath lên Botkeep Founder Free

Hiện dự án mặc định chạy local theo [LOCAL.md](LOCAL.md). Tài liệu này được giữ cho trường hợp muốn deploy sau; mẫu cấu hình cloud riêng ở `.env.botkeep.example`.

Giữ nguyên mục tiêu miễn phí: website + SQLite + runner WebAssembly trên Botkeep; Gemini Free Tier cho trợ giảng. Không tải Ollama/model và không cần Docker trên máy hoặc Botkeep.

## Thiết lập

1. Tạo workload **Node.js 24 trở lên** trong Botkeep. Có thể phân bổ toàn bộ pool Founder Free 2 GB RAM / 1,5 vCore cho BytePath để có chỗ biên dịch C++. Dung lượng ứng dụng/dependency/runtime thấp hơn pool lưu trữ 2 GB; cần giữ chỗ cho lịch sử bài và backup.
2. Upload ZIP `output/bytepath-botkeep.zip`. ZIP chứa `dist`, source, ảnh DSA và `.runtime`; không chứa bí mật hoặc tiến độ cá nhân.
3. Cài dependency với `npm ci --omit=dev`. Không build frontend trên server; ZIP đã có bản build. Startup: `node --v8-pool-size=1 server/index.mjs`.
4. Trong Network dùng port Botkeep cấp qua `SERVER_PORT`. Trong Domains tạo địa chỉ HTTPS và lấy origin (ví dụ `https://bytepath.example`).
5. Trong **Environment** nhập:

```dotenv
BYTEPATH_MODE=cloud
BYTEPATH_PUBLIC_ORIGIN=https://dia-chi-https-cua-ban
BYTEPATH_PASSWORD=mat-khau-rieng-dai-it-nhat-12-ky-tu
BYTEPATH_DB=.data/bytepath.sqlite
BYTEPATH_RUNNER=wasm
BYTEPATH_AI=gemini
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_API_KEY=key-free-tier-cua-ban
GEMINI_FREE_TIER_CONFIRMED=1
GEMINI_DAILY_LIMIT=20
```

Origin không có dấu `/` cuối. Không dùng các giá trị minh họa làm mật khẩu thật. Không đưa key vào source hoặc chat. Nếu cần tắt AI: `BYTEPATH_AI=off`.

6. Start workload, đọc Console. Mở domain, đăng nhập, chọn Python/C++ và tên. Trong Hồ sơ, kiểm tra runner sẵn sàng. Chạy mẫu bài cộng trước khi học tiếp.

Ứng dụng nghe `0.0.0.0` và `SERVER_PORT`, dùng cookie HttpOnly/Secure/SameSite và xác minh Origin. Mật khẩu bảo vệ API dữ liệu và ảnh nguồn; đây là bản cá nhân, một hồ sơ học.

## Kiểm tra sau deploy

- Mở domain ở trình duyệt chưa đăng nhập: thấy màn hình mật khẩu, không đọc được API tiến độ.
- Nộp `def solve(data): return data['a'] + data['b']` ở bài cộng; thử đổi sang C++ và nộp lại.
- Tải lại trang: code và tiến độ vẫn còn. Hoàn thành buổi mở buổi kế, nộp lại không thưởng lần nữa.
- Hỏi Byte sau khi cấu hình Gemini; nếu key/quota chưa sẵn sàng, điểm không thay đổi.
- Xuất JSON backup xuống máy, kiểm tra file không chứa key/mật khẩu. Giữ một bản ngoài Botkeep.

Hiệu năng trên pool Botkeep chia sẻ cần đo sau khi deploy; kết quả chạy local không là cam kết uptime hoặc thời gian phản hồi trên Botkeep. Nếu biên dịch bị thiếu tài nguyên, ứng dụng báo chưa có kết quả thay vì đánh trượt.

## Cập nhật

Xuất backup, dừng workload trước khi thay source. Giữ `.data` của server; ZIP không chứa `.data`. Upload bản build mới, cập nhật dependency khi lockfile thay đổi và start lại. Khi thay mật khẩu, session cũ bị vô hiệu hóa. Chỉ khôi phục backup khi job chấm đã kết thúc.

## Tài liệu

- [Botkeep hosting, port và HTTPS](https://botkeep.cloud/docs/hosting)
- [Botkeep resource pool và backup](https://botkeep.cloud/faq)
- [Gemini Free Tier và billing](https://ai.google.dev/gemini-api/docs/billing)
- [Gemini không chạy C++ bằng code execution tool](https://ai.google.dev/gemini-api/docs/code-execution)
