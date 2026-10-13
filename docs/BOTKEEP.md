# Đưa BytePath lên Botkeep Founder Free

Source phát triển ở nhánh `main` của [khanhbes/Learning-Web](https://github.com/khanhbes/Learning-Web). GitHub Actions build và kiểm thử trước khi cập nhật nhánh `botkeep-deploy`, chứa source và frontend đã build. **Botkeep clone nhánh `botkeep-deploy`**, nên không cần upload ZIP vượt giới hạn 5 MB. Mẫu cấu hình cloud ở `.env.botkeep.example`; máy cá nhân tiếp tục chạy theo [LOCAL.md](LOCAL.md).

Giữ nguyên mục tiêu miễn phí: website + SQLite + runner WebAssembly trên Botkeep; Gemini Free Tier cho trợ giảng. Không tải Ollama/model và không cần Docker trên máy hoặc Botkeep.

## Thiết lập

1. Tạo workload **Node.js 24 trở lên** trong Botkeep. Có thể phân bổ toàn bộ pool Founder Free 2 GB RAM / 1,5 vCore cho BytePath để có chỗ biên dịch C++. Giữ dung lượng cho lịch sử bài và backup; kiểm tra mức sử dụng thực tế trong dashboard.
2. Chọn source **GitHub**, repository `https://github.com/khanhbes/Learning-Web`, branch **`botkeep-deploy`**, project root `/` (gốc repository). Chờ workflow [Build Botkeep deployment branch](https://github.com/khanhbes/Learning-Web/actions/workflows/botkeep.yml) thành công trước khi lấy bản mới. Repository public có thể chọn bằng URL theo hướng dẫn Botkeep.
3. Install command: `npm ci --omit=dev`. Startup command: `node --v8-pool-size=1 scripts/cloud-start.mjs`. Nếu panel chỉ có một ô command, dùng `npm ci --omit=dev && node --v8-pool-size=1 scripts/cloud-start.mjs`. Lần đầu script tải runtime từ upstream, đối chiếu SHA-256 rồi mở server; các lần sau dùng runtime đã có. Không build frontend trên Botkeep và không cần Docker/Python native. Không copy `.env` local lên server.
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

6. Start workload, đọc Console. Lần đầu cần mạng để tải runtime; nếu tải lỗi, script báo nguyên nhân và không mở server chấm thiếu runtime. Sau thông báo `BytePath cloud ready`, mở domain, đăng nhập, chọn Python/C++ và tên. Trong Hồ sơ, kiểm tra runner sẵn sàng. Chạy mẫu bài cộng trước khi học tiếp.

Ứng dụng nghe `0.0.0.0` và `SERVER_PORT`, dùng cookie HttpOnly/Secure/SameSite và xác minh Origin. Mật khẩu bảo vệ API dữ liệu và ảnh nguồn; đây là bản cá nhân, một hồ sơ học.

## Kiểm tra sau deploy

- Mở domain ở trình duyệt chưa đăng nhập: thấy màn hình mật khẩu, không đọc được API tiến độ.
- Nộp `def solve(data): return data['a'] + data['b']` ở bài cộng; thử đổi sang C++ và nộp lại.
- Tải lại trang: code và tiến độ vẫn còn. Hoàn thành buổi mở buổi kế, nộp lại không thưởng lần nữa.
- Hỏi Byte sau khi cấu hình Gemini; nếu key/quota chưa sẵn sàng, điểm không thay đổi.
- Xuất JSON backup xuống máy, kiểm tra file không chứa key/mật khẩu. Giữ một bản ngoài Botkeep.

Hiệu năng trên pool Botkeep chia sẻ cần đo sau khi deploy; kết quả chạy local không là cam kết uptime hoặc thời gian phản hồi trên Botkeep. Nếu biên dịch bị thiếu tài nguyên, ứng dụng báo chưa có kết quả thay vì đánh trượt.

## Cập nhật

Xuất backup, dừng workload trước khi thay source. Giữ `.data` và `.runtime` của server. Trong tab GitHub, preview/apply bản mới từ `botkeep-deploy`, chạy lại install command khi lockfile thay đổi rồi start. Không bật cập nhật tự động khi đang chấm bài. Khi thay mật khẩu, session cũ bị vô hiệu hóa. Chỉ khôi phục backup khi job chấm đã kết thúc.

Nhánh `botkeep-deploy` do workflow tạo lại từ `main`; sửa source ở `main`, không sửa trực tiếp nhánh deploy. GitHub là nơi lưu mã nguồn/build, **không phải địa chỉ web đang chạy backend**. Đường dẫn website đầy đủ do Domains của Botkeep cấp; chỉ xem deploy hoàn tất sau khi kiểm tra HTTPS, đăng nhập, persistence, runner và Gemini trên domain đó.

## Tài liệu

- [Botkeep hosting, port và HTTPS](https://botkeep.cloud/docs/hosting)
- [Botkeep resource pool và backup](https://botkeep.cloud/faq)
- [Gemini Free Tier và billing](https://ai.google.dev/gemini-api/docs/billing)
- [Gemini không chạy C++ bằng code execution tool](https://ai.google.dev/gemini-api/docs/code-execution)
