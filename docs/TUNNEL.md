# Web public tạm thời bằng Cloudflare Quick Tunnel

Web và SQLite chạy trên máy này; Cloudflare chuyển tiếp HTTPS tới backend có mật khẩu tại `127.0.0.1:3002`. Cài `cloudflared`, giữ Node.js 24, dependency, frontend build và runtime như bản local. Không cần tài khoản Cloudflare, Docker hoặc hosting trả phí.

## Mở và dừng

- Chạy **Start Public BytePath.cmd**. Script in link HTTPS; link và mật khẩu nằm trong `.data/public/access.txt`. Mở link đó và nhập mật khẩu.
- Mặc định lần đầu tạo hồ sơ online riêng tại `.data/public/online.sqlite`; dữ liệu local không được đưa lên tunnel. Nếu bạn muốn dùng tiến độ/bài làm hiện có và cho phép truy cập chúng từ Internet sau đăng nhập, chạy `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-public.ps1 -UseExistingProgress`. Lựa chọn này dừng backend local trước khi dùng cùng `.data/bytepath.sqlite`. Những lần Start sau giữ lựa chọn đã lưu. Dùng `-Fresh` để chọn lại hồ sơ online riêng; không xóa hồ sơ nào.
- Cổng backend public chỉ nghe loopback; không mở port inbound/router hay phục vụ LAN.
- Chạy **Stop Public BytePath.cmd** để đóng tunnel và backend public. Dữ liệu/mật khẩu được giữ. Muốn trở về local, chạy **Start BytePath.cmd** sau khi dừng bản public.
- Bấm Start Public khi bản public đang khỏe sẽ dùng lại link đang chạy. Nếu dừng tunnel rồi mở lại, Cloudflare cấp hostname mới; xem lại `access.txt`.

Launcher kiểm tra cả backend trên máy và đầu tunnel HTTPS. Nếu tiến trình cloudflared vẫn tồn tại nhưng tunnel đã hết hiệu lực, Start Public tạo lại kết nối và cập nhật Worker, giữ mật khẩu và hồ sơ đang dùng. Khi địa chỉ ngắn đã được cấu hình, địa chỉ `hoc.bytepath.workers.dev` vẫn giữ nguyên.

Máy phải bật, có Internet và không sleep để web hoạt động. Quick Tunnel là phương án tạm thời, không có cam kết uptime; hostname đổi khi tạo tunnel mới. Xem [tài liệu Cloudflare](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

## Tự phục hồi tùy chọn

Monitor nền mặc định chưa bật. Khi người dùng đồng ý cho phép tự sửa kết nối, chạy:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-public.ps1 -UseExistingProgress -EnableRecovery
```

Monitor kiểm tra mỗi phút; sau ba lần lỗi liên tiếp, chỉ xử lý khi Internet đã có lại. Nếu tunnel khỏe nhưng Worker lỗi, nó cập nhật alias riêng. Nếu cần khởi động lại, nó đọc SQLite ở chế độ readonly và hoãn khi job đang queued/running còn có tiến trình server hoặc cổng đang lắng nghe. Khi server đã chết và cổng trống, các job bị gián đoạn được backend chuyển thành lỗi hạ tầng để chấm lại, không đánh trượt. Nếu không thể đọc trạng thái job, monitor hoãn sửa. Khởi động lại vẫn có thể gây gián đoạn ngắn; đây không phải bảo đảm uptime.

Lỗi phục hồi có backoff 2/5/10/30 phút. Không gọi Gemini, không chấm lại bài, không cài service hoặc task tự mở lúc Windows boot. Các PID được kiểm tra tên tiến trình, đường dẫn script và thời điểm bắt đầu trước khi dừng.

**Stop Public BytePath.cmd** đánh dấu dừng trước khi đóng monitor, tiến trình phục hồi, server và tunnel; monitor không tự bật lại web sau thao tác Stop. Lựa chọn bật monitor được giữ cho lần Start sau. Log riêng ở `.data/public/watchdog.log` và `.data/public/recovery-last.log`. Wrangler phải còn đăng nhập để tự cập nhật alias; monitor không tự mở màn đăng nhập hoặc mua dịch vụ.

Kiểm thử chính sách và đọc job: `node --test tests/public-recovery.test.mjs tests/tunnel.test.mjs`. Trên Windows, `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/public-stop.integration.ps1` kiểm tra Stop trong cửa sổ tạo tiến trình/ghi PID bằng server giả riêng trong `output/`, không dừng website thật.

## Quyền truy cập và dữ liệu

Backend giữ Gemini key từ `.env`, không đưa key vào frontend hoặc URL. Bản public yêu cầu mật khẩu, cookie Secure/HttpOnly/SameSite và Origin đúng. Đây là **một hồ sơ cá nhân dùng chung**, không phải hệ thống tài khoản riêng cho nhiều học viên. Người có mật khẩu có thể học, dùng quota AI và sửa tiến độ của hồ sơ đó.

Không chia sẻ `.env` hoặc `.data/public/`; `access.txt`, `state.json` và cookie kiểm thử chứa thông tin đăng nhập. Các thư mục này được Git bỏ qua. Chia sẻ link và mật khẩu trực tiếp với người bạn cho phép truy cập. Xuất backup trong Hồ sơ trước khi nhập dữ liệu hoặc đổi môi trường.

Log nằm trong `.data/public/`. Nếu startup lỗi, script đóng các tiến trình public đã ghi nhận; không dừng tiến trình khác chỉ vì dùng chung cổng. Runner và chấm điểm giống bản local, AI không quyết định điểm. Thiếu mạng/quota Gemini không thay đổi điểm.

## Kiểm thử trước bàn giao

`scripts/start-public.ps1 -Qa` dùng SQLite riêng để thử qua cùng tunnel; không dùng cho học thật. Kiểm thử Python/C++, Gemini và bản nháp trong QA; sau đó chọn hồ sơ online riêng hoặc cho phép dùng dữ liệu hiện có. Báo cáo ở `output/tunnel-*-verification.json`. Script kiểm thử không ghi mật khẩu, API key hoặc cookie vào báo cáo.

## Địa chỉ ngắn miễn phí

Địa chỉ đang dùng: **https://hoc.bytepath.workers.dev**. Đăng nhập bằng mật khẩu riêng trong `.data/public/access.txt`; không ghi mật khẩu vào tài liệu hoặc repository.

Có thể dùng một Cloudflare Worker làm cổng chuyển tiếp với địa chỉ `https://bytepath.<tên-tài-khoản>.workers.dev`. Cần đăng nhập tài khoản Cloudflare Free bằng `npx wrangler login`; không cần mua tên miền. Worker chỉ chuyển tiếp HTTP, còn SQLite, chấm code và Gemini vẫn chạy ở backend trên máy. Máy vẫn cần bật.

Sau khi đã cấp địa chỉ, cấu hình riêng nằm trong `.data/public/worker.json` (accountId, name, deployedUpstream), và `state.json` có thêm `publicOrigin`. Không thêm mật khẩu hoặc Gemini key vào Worker. Chạy `node scripts/update-public-alias.mjs` để cập nhật cổng chuyển tiếp và kiểm tra `/api/health` thực tế. Script kiểm tra đăng nhập Wrangler trước khi deploy. Khi tunnel tạo URL mới, **Start Public BytePath.cmd** tự cập nhật Worker. Địa chỉ `workers.dev` giữ nguyên; `access.txt` có cả link ngắn và link tunnel dự phòng. Nếu đăng nhập Cloudflare hết hạn hoặc cập nhật thất bại, dùng link dự phòng, đăng nhập lại Wrangler rồi chạy script cập nhật.

Dùng trong hạn mức [Workers Free](https://developers.cloudflare.com/workers/platform/pricing/); không nâng cấp gói trả phí. Đây là cổng chuyển tiếp nên không chuyển runner WASM lên Worker.

## Đổi mật khẩu

Đổi trường `password` trong `.data/public/state.json`, sau đó dừng và mở lại bản public để áp dụng. Mật khẩu dài 8–256 ký tự; phiên đăng nhập cũ hết hiệu lực sau khi đổi. Không đưa file này vào Git. `access.txt` được cập nhật lúc khởi động và vẫn là file riêng trên máy.
