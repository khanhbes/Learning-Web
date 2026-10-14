# Bitty — báo cáo bàn giao

Ngày kiểm thử: 14/10/2026. Giữ React/TypeScript/Vite, Motion, backend local và hồ sơ chung của bốn khóa. Bitty được thêm miễn phí; 24 skin cũ và lựa chọn riêng của người học vẫn được giữ.

## 1. Concept, màu và source vector

[Concept và palette](BITTY-CONCEPT.md), [rig SVG](../public/mascots/bitty/bitty-rig.svg), [12 prop](../public/mascots/bitty/props/). Nhân vật gốc có 31 group đặt tên, sáu màu, nền trong suốt. Không lấy nhân vật hay âm thanh Duolingo.

## 2. Bảng 27 animation

[Bảng thời lượng, loop, trigger và mô tả](BITTY-MOTION.md). Tất cả tên bắt buộc có trong hợp đồng dùng chung và binary thật.

## 3. Keyframe và easing

Đặc tả từng animation nằm trong [BITTY-MOTION.md](BITTY-MOTION.md); source tái tạo trong [build-source.mjs](../animation/bitty/build-source.mjs) và [scene.rml](../animation/bitty/scene.rml). Có anticipation, squash/stretch, overshoot, tai/ăng-ten trễ nhịp và prop. Native capture trong quá trình dựng đã kiểm tra 11 pose quan trọng, bao gồm nhìn trái/phải và hai khẩu hình. Các capture dùng preview build ở thời điểm dựng, không phải bằng chứng kiểm thử đúng từng byte của binary cuối; runtime browser kiểm tra asset phát hành riêng.

## 4. Sáu chuyển cảnh

[PageTransition](../src/bitty/PageTransition.tsx) triển khai wipe, iris, jump, slide, pixel và celebration fade. Kiểm thử browser xác nhận sáu kiểu kết thúc sạch, không để lại clip; bấm nhanh 10 lần chỉ giữ cảnh cuối. Reduced motion dùng fade ngắn.

## 5. State machine và queue

Binary có `Bitty`/`MascotSM`: 27 timeline bắt buộc và 61 timeline phụ; 11 layer, 15 trigger, bốn Boolean, tám Number. Các input bổ sung `play`, `stateIndex`, `pointDirection` cho chọn/replay timeline và hướng chỉ tay. Mermaid và quy tắc ưu tiên trong [BITTY-MOTION.md](BITTY-MOTION.md).

[Engine](../shared/mascot-motion.mjs) có hàng đợi giới hạn, callback một lần, ID chống phát trùng trong phiên, pause/resume theo thời gian còn lại, cleanup và xử lý giảm chuyển động. Điểm và thưởng vẫn do backend quyết định.

## 6. File Rive thật và hướng dẫn Editor

[bitty.riv](../public/mascots/bitty/bitty.riv): **100.022 byte**, dưới 200.000 byte. SHA-256: `12cde2e7f52cf8bdbeb430a516e5d31add77b11a4335af169b8351ea08d87d75`.

Đã verify/inspect/build bằng official Rive CLI **1.5.1**, không có lỗi/cảnh báo. Scene không có script, font, raster hay asset mạng. Build local script-free không cần đăng nhập/publish; runtime thật đã load binary trong browser. [Hướng dẫn Editor và tái tạo](BITTY-RIVE.md).

Artboard runtime 360×360 có padding 52px quanh rig 256×256 để không cắt ăng-ten khi nhảy. Chuyển cảnh và phần chữ/số thưởng nằm trong React.

## 7. React và tích hợp ứng dụng

[Mascot](../src/bitty/Mascot.tsx), [adapter Rive](../src/bitty/RiveMascot.tsx), [provider/hook](../src/bitty/MascotProvider.tsx), [overlay kết quả/cấp độ](../src/bitty/RewardOverlays.tsx), [Studio](../src/bitty/BittyStudio.tsx).

Runtime khóa `@rive-app/react-canvas` 4.36.0 và `@rive-app/canvas` 2.44.0; main/fallback WASM phục vụ cùng origin. Canvas lazy-load, dừng khi khuất/ẩn tab; ảnh SVG vẫn dùng khi thiếu file, file sai, lỗi WASM hoặc bật giảm chuyển động. Store và bảng chọn 27 trạng thái không tạo 27 canvas. Studio có một canvas chính.

Practice quiz/lab/code phát phản hồi từ kết quả thật. Assessment hủy hiệu ứng luyện cũ, chặn gợi ý và phản hồi sớm. Bỏ qua hiệu ứng không sửa điểm, XP hoặc điều kiện mở khóa.

## 8. Kiểm thử và giới hạn đo

- `npm.cmd test`: **132/132 đạt**, 0 fail, 0 skip; chạy tuần tự để các test giới hạn CPU của runner không cạnh tranh tài nguyên với nhau.
- TypeScript và production build đạt. Kiểm tra publish không có `.env`, API key, database hoặc dữ liệu riêng.
- Migration/API: Bitty miễn phí một lần, giữ skin riêng; chọn lại Byte gốc vẫn được lưu. XP/gem/tiến độ/ledger cũ được giữ, không nhận lại phần thưởng. Asset MIME, bytes và traversal được kiểm tra.
- Browser: 27 nút trạng thái, sáu input số bằng bàn phím, sáng/tối, sáu chuyển cảnh, một canvas; mobile 390×844 không tràn ngang. OS reduced motion tháo canvas và dùng SVG.
- Browser fallback: `.riv` 404, binary sai và cả hai WASM bị chặn đều hiện SVG, vẫn thao tác được, không có uncaught page error. Không có request CDN/mạng ngoài trong các lượt này.
- Bản cuối: sân khấu căn giữa, nhãn Rive tiếng Việt và wake từ sleep đã kiểm tra. Mouse tracking được quan sát qua input chuẩn hóa và dịch con ngươi SVG; helper tự động so hai vị trí chuột chưa ổn định, không ghi là đạt một phép đo pixel Rive.
- Luồng thực: tám câu luyện nhận phản hồi từ backend; kiểm tra không có gợi ý/phản hồi đáp án sớm. Hai lượt luyện hoàn thành 100%, bấm nộp hai lần vẫn có kết quả nhất quán; sau 5,6 giây không còn PATCH lưu nền muộn hoặc lỗi PATCH. Skip giữ nguyên XP/tiến độ. Autosave tạm dừng lúc nộp và không thử lại lượt đã hoàn thành.
- Native benchmark của bản 256×256 trước padding: render mean 0,659ms/p95 1,482ms, advance mean 0,087ms; không tăng WASM page trong 180 frame. Đây là baseline native, không phải phép đo browser của bản cuối.
- Browser rAF: 119 khoảng frame, median 8,4ms/p95 9,6ms; khi throttle CPU ×4, median 8,8ms/p95 58,4ms. Đây là nhịp callback headless trên máy đang có tải, không đo riêng thời gian vẽ Rive và không chứng minh 60 FPS trên mọi thiết bị. Chưa đo trên điện thoại thật.

Bằng chứng trong `output/bitty-serial-tests.log`, `output/bitty-release-build.log`, `output/bitty-final-targeted-tests.log` (26/26 đạt), `output/bitty-browser-report.json`, `output/bitty-transition-report.json`, `output/bitty-native-captures.json` và ảnh `output/playwright/bitty-*`. Các file output/private backup được gitignore. Bản release cuối được kiểm tra TypeScript, build và QA browser sau các sửa đổi; bộ 132 test dùng cùng backend/engine đã kiểm chứng.

Phát hành chỉ dùng bản staging đã kiểm tra. Backup riêng giữ trong `.data/public/`; kiểm tra online bằng `scripts/verify-expansion-live.mjs` và [verify-bitty-live.mjs](../scripts/verify-bitty-live.mjs) đối chiếu dữ liệu cũ và bytes asset. Không xuất thông tin đăng nhập trong báo cáo.

Bản đã cập nhật tại `https://hoc.bytepath.workers.dev/mascot`. Kiểm tra online xác nhận mật khẩu hiện có, cả bốn khóa, lịch sử bài làm/ledger/inventory, XP và gem được giữ; file Rive và hai WASM khớp bản staging. Browser đăng nhập trên tên miền thật xác nhận một canvas **Rive**, nhãn tiếng Việt, preview cấp độ và Skip, không có uncaught error. Ảnh trong `output/playwright/bitty-public-live.png`; báo cáo API trong `output/bitty-live-report.json` và `output/bitty-courses-live-report.json`.

Tunnel cũ đã hết kết nối và được tạo lại; Worker giữ tên miền cũ và trỏ đến tunnel mới. Đây vẫn là website qua máy local: cần bật máy và có mạng. Trong quá trình reconnect có lỗi edge tạm thời HTTP 530; sau khi tự kết nối lại, health/API và lượt browser xác thực đều đạt. Không thêm dịch vụ trả phí.
