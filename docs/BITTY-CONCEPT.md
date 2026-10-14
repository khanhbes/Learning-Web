# Bitty — concept và bộ vector

Bitty là mèo robot nhỏ, thân tròn như một viên mochi, tay găng và chân ngắn. Mặt kem mở rộng tạo khoảng trống cho mắt rất lớn; ăng-ten cong có hạt sáng đóng vai trò đồng hồ cảm xúc. Đuôi cong, tai mèo và một răng cửa tạo hình nhận diện riêng. Nhân vật được vẽ mới cho BytePath, không dùng nhân vật, âm thanh hay asset Duolingo.

**Giả định thiết kế:** giữ React/Vite và hệ thống skin hiện có; bộ vector hoạt động bằng Rive hoặc SVG/Motion dự phòng. Bản `.riv` thật được dựng offline bằng Rive CLI 1.5.1 từ RML và keyframe native, không cần tài khoản hoặc script trả phí. SVG là file rig riêng để designer nhập vào Rive Editor; không dùng file `.riv` trống.

Luận điểm hình ảnh: một sinh vật bạc hà mềm, hình học ít chi tiết, biểu cảm rõ ở kích thước 96 px. Nội dung tập trung vào một nhân vật chính và một prop giải thích. Chuyển động gồm chuẩn bị trước cú nhảy, nén/kéo thân, đáp đất có dư chấn và tai/ăng-ten trễ nhịp; idle chỉ thở 2–3%.

## Tính cách

Bitty ăn mừng rất nhiệt tình, tự làm quá khi bản thân bối rối và luôn đứng về phía người học. Câu nói đùa nhắm vào tình huống hoặc nhân vật, không hạ thấp người học. Bỏ bài không bị làm xấu hổ; trả lời sai dẫn tới khích lệ và thử lại.

- “Một bug thôi. Mình debug cùng nhau!”
- “Não vừa compile thành công!”
- “Đừng lo, mình cũng vừa quên dấu chấm phẩy.”
- “Một bước nữa thôi. Mình giữ chỗ cho bạn.”

Năm sắc thái: **vui** (mắt tròn, miệng cười, tai dựng); **nghĩ** (mắt nhìn lên, tay chạm cằm, ăng-ten vàng); **buồn nhẹ** (mí hạ, tai rủ, ăng-ten xanh xám); **drama** (mắt xoáy, tay ôm đầu, ăng-ten cam đỏ, sau đó tự đứng dậy); **ăn mừng** (mắt sao/trái tim, tay giơ, thân bật lên).

## Palette

| Vai trò | HEX | Quy tắc |
|---|---|---|
| Thân bạc hà | `#76DEC1` | Diện tích chính; không đổi theo cảm xúc |
| Khớp/tai xanh | `#3AA58E` | Đuôi, tay/chân, phần tối của thân; ăng-ten vui |
| Mực xanh xám | `#243E4B` | Đồng tử, miệng, thân ăng-ten; tip khi buồn |
| Kem | `#FFF9E9` | Mặt/bụng, răng, catchlight; giữ mặt sáng trên nền tối |
| Vàng | `#F3CB65` | Ý tưởng, thưởng, tip khi suy nghĩ |
| Accent san hô | `#F4887E` | Má/lưỡi/tai trong; tip drama, dây lỗi |

Tổng cộng năm màu chính và một accent. Hiệu ứng dùng alpha của những màu này, không bổ sung gradient hoặc màu mới. Không phụ thuộc vào màu để truyền tải đúng/sai: mắt, tư thế, prop và nhãn trạng thái cung cấp tín hiệu cùng lúc. Nền trong suốt. Đổ bóng là một ellipse alpha, không có blur hoặc filter.

## Asset và rig

- `public/mascots/bitty/bitty-rig.svg`: viewBox 256×256, các group có ID và nhãn ổn định.
- `public/mascots/bitty/props/`: 12 prop SVG tách riêng, viewBox 96×96.
- `src/bitty/BittySvg.tsx`: cùng hình học rig, 27 trạng thái, các hình miệng/đồng tử và input mắt.
- `animation/bitty/`: source RML có thể chỉnh sửa, generator từ vector, contract input và cấu hình compiler. `node scripts/build-bitty-rive.mjs` kiểm tra, inspect và build binary dưới 200 KB. File native không chứa script, bitmap, font hoặc tài nguyên mạng.

Mỗi phần có layer riêng: `body`, `belly`, `head`, `ear_L/R`, `antenna_stem/tip`, `eye_L/R`, `pupil_L/R`, `eyelid_L/R`, `eyebrow_L/R`, bảy `mouth_*`, `tongue`, `cheek_L/R`, `arm_L/R`, `leg_L/R`, `tail`, `shadow`. File export hiển thị `mouth_smile`; các biến thể miệng/mí đặt opacity 0 để nhập và chọn trong Rive. Không đổi opacity toàn bộ rig để ẩn phần riêng lẻ.

Pivot gợi ý: thân `(128,216)`; đầu `(128,119)`; tai trái `(76,66)`/phải `(180,66)`; ăng-ten `(127,47)`; tay trái `(63,153)`/phải `(193,153)`; chân trái `(98,210)`/phải `(157,210)`; đuôi `(188,184)`. Mouth và pupils di chuyển trong nhóm đầu; mỗi mắt cần mask riêng để nhìn theo con trỏ mà không thoát khuôn mắt.

Artboard runtime là 360×360, có 52 px vùng trong suốt xung quanh bản vẽ 256×256 để cú nhảy không cắt ăng-ten. Fallback dùng cùng vùng nhìn `-52 -52 360 360`. Phần xoay vòng `perfect_score` dùng pivot giữa thân `(128,128)` thay cho pivot đáp đất; ảnh export rig vẫn giữ 256×256.

Props: bảng trắng, laptop, bóng đèn, cúp, huy hiệu, lửa streak, confetti, sao, trái tim, cà phê, dấu hỏi, dấu chấm than. Mỗi file chỉ chứa nét vector, không có ảnh bitmap hoặc tài nguyên ngoài.

## Accessibility và hiệu năng của fallback

Component có mô tả tiếng Việt theo state. Chế độ giảm chuyển động chọn tư thế tĩnh phù hợp, bỏ nhảy/xoay/particle và nhìn theo chuột. `motionPaused` dừng cả idle blink và secondary motion. Không có strobe/flash; blink tự nhiên 2–5 giây. Prop và confetti dùng chung palette, số phần tử cố định; không render filter nặng. Phần thưởng/số XP nhận từ dữ liệu xác nhận của ứng dụng, artwork không tính điểm hoặc phát thưởng.
