# Bitty — dựng rig và xuất Rive đúng hợp đồng

Hướng dẫn kỹ thuật ngày 14/10/2026. Giữ React/Vite đang dùng. Binary thật [bitty.riv](../public/mascots/bitty/bitty.riv) đã được dựng bằng **Rive CLI 1.5.1**, **100.022 byte**. Artboard `Bitty`, state machine `MascotSM`, 27 timeline bắt buộc và 61 helper (tổng 88), 11 layer, 15 Trigger/4 Boolean/8 Number. Source native ở `animation/bitty/`, tái tạo bằng `node scripts/build-bitty-rive.mjs`. Không dùng script, font, bitmap, shader, network asset hoặc upload tài khoản. SVG vẫn là source vector và fallback; SVG/JSON được đổi tên `.riv` không phải một binary hợp lệ.

## Chuẩn bị file và quyền export

Source art nằm ở [bitty-rig.svg](../public/mascots/bitty/bitty-rig.svg); prop gốc ở `public/mascots/bitty/props/`. Không lấy nhân vật/âm thanh của bên thứ ba. Nền transparent, bản vẽ gốc 256×256, palette năm màu và một màu nhấn. **Artboard runtime 360×360, padding trong suốt 52px mỗi bên** để cú nhảy/xoay không cắt nhân vật. Fallback dùng cùng vùng nhìn `-52 -52 360 360`. Mắt, miệng, tay, chân, tai và ăng-ten đã tách group.

Trang pricing hiện hành cho biết Free gồm Editor/CLI và export qua account kèm splash screen Rive. Giữ kết quả exporter cấp theo license; không tự nâng cấp hoặc sửa binary để bỏ splash. Thông tin này được kiểm tra ngày 14/10/2026. Pipeline đang dùng compile **RML native không có script bằng CLI chính thức ở máy này**, không cần account/push/paid export. Một số trang docs export còn mô tả paid plan, nên dùng pricing hiện hành khi quyền trong Editor khác tài liệu cũ. [Rive pricing](https://rive.app/pricing).

Đăng nhập trong giao diện chính thức, không đặt mật khẩu hoặc token trong source/.env của BytePath. File asset công khai không được chứa thông tin tài khoản, đường dẫn dataset riêng, API key, URL backend nội bộ hoặc các event có nội dung bí mật.

## 1. Import và kiểm tra hierarchy

1. Mở Rive Editor, tạo file mới tên `Bitty`. Đặt artboard `Bitty`, width/height **360**, transparent background. Import bản vẽ 256×256, đặt x/y thêm **52px**; các pivot trong bảng dưới là tọa độ local bản vẽ, không phải tọa độ tuyệt đối artboard sau padding.
2. Import `bitty-rig.svg` qua chức năng import asset. Rive chuyển SVG thành các shape/path có thể sửa, không nhúng SVG gốc để runtime đọc. [Cách import SVG](https://rive.app/docs/editor/assets/svg).
3. Soát group sau import: `body`, `belly`, `head`, `ear_L`, `ear_R`, `antenna_stem`, `antenna_tip`, `eye_L`, `eye_R`, `pupil_L`, `pupil_R`, `eyelid_L`, `eyelid_R`, `eyebrow_L`, `eyebrow_R`, các `mouth_*`, `tongue`, `cheek_L`, `cheek_R`, `arm_L`, `arm_R`, `leg_L`, `leg_R`, `tail`, `shadow`.
4. Nếu importer đổi label, sửa tên trong hierarchy trước khi animate. Không gộp mắt/miệng vào `head`; tên `_L/_R` nói về phía trái/phải của hình trên màn hình, dùng nhất quán trong asset và renderer.
5. Import 12 props, đặt vào group `props`, opacity mặc định 0. Props có chữ/biểu tượng chỉ hướng không được mirror nguyên group khi đổi trái/phải.
6. So sánh frame neutral trong Editor với SVG ở 256px và 64px. Mặt kem, một răng cửa, ăng-ten lệch và đuôi cong phải còn nhận diện.

SVG sử dụng vector đơn giản. Filter không được Rive import hỗ trợ; vì vậy glow dùng vòng tròn opacity thấp, shadow là ellipse riêng. Không dùng blur hoặc raster texture để mô phỏng sáng. [Giới hạn SVG import](https://rive.app/docs/editor/assets/svg).

## 2. Rig root, xương và điểm neo

Tạo group `character_root` chứa nhân vật, trừ `shadow`. Root neo gần giữa hai chân `(128,224)`. Không parent bóng vào root; khi nhảy, bóng ở mặt đất và nhỏ lại. Pivot là gợi ý trên artboard gốc, có thể chỉnh vài pixel nếu path importer thay bounding box:

| Xương/group | Pivot x/y | Thành phần chịu ảnh hưởng |
|---|---|---|
| `root` | 128/224 | Toàn bộ nhân vật, trừ bóng và FX ngoài |
| `spine` | 128/194 | Body, belly; gốc head/arms |
| `neck` | 128/145 | Head và các thành phần mặt |
| `ear_L_bone` | 79/72 | Tai trái |
| `ear_R_bone` | 176/72 | Tai phải |
| `antenna_base` | 127/48 | Stem và tip; trễ sau neck |
| `shoulder_L` | 65/152 | Arm_L |
| `shoulder_R` | 192/152 | Arm_R |
| `hip_L` | 99/204 | Leg_L |
| `hip_R` | 157/204 | Leg_R |
| `tail_base` | 185/181 | Đuôi cong |

Trong Bone tool, dựng root trước, tiếp tục chain spine→neck; tạo nhánh shoulder/ear/antenna. Parent group vector vào xương để chúng theo transform. Chỉ bind vertex khi cần một đoạn đuôi hoặc stem mềm; phần bàn tay/chân nên theo bone như khối cứng. Rive hỗ trợ cả parent transform và bind vector vào bone. [Bones chính thức](https://rive.app/docs/editor/manipulating-shapes/bones).

Giữ điểm neo mắt khi đổi hình tròn/sao/tim/xoáy để mắt không trượt. Không scale head và face bằng hai hệ thống khác nhau. Với mouth, tạo `MouthSolo` gồm closed/A/E/O/smile/sad/wow; chọn một child, bật lưỡi khi hình miệng phù hợp. Neutral là smile; khi talk kết thúc, trả lựa chọn về closed hoặc neutral theo state.

## 3. Dựng 27 timeline theo keyframe

1. Chuyển Animate, tạo mỗi timeline đúng tên snake_case trong bảng của [BITTY-MOTION.md](BITTY-MOTION.md). Đặt FPS 60, duration bằng giây bảng; `idle_breathe` 2,80s, `answer_correct` 1,00s, `lesson_complete` 2,80s, `level_up` 4,60s.
2. Key pose gốc tại 0s cho mọi thuộc tính animation sở hữu. Điều này tránh pose của lần phát trước rò sang timeline sau.
3. Dựng anticipation/squash trước, chuyển root kế tiếp, rồi tai/ăng-ten trễ 0,06–0,10s. Mỗi động tác có ít key chính; không cần lưu một key mỗi frame chỉ vì timeline 60 FPS.
4. Chọn Cubic cho cubic-out `(0.22,1,0.36,1)` và cubic-in-out `(0.65,0,0.35,1)`. Phần overshoot dùng các key scale cụ thể hoặc curve nhẹ; mouth solo dùng Hold. Rive có interpolation Cubic, Hold và Elastic. [Easing trong Editor](https://rive.app/docs/editor/animate-mode/interpolation-easing).
5. Với loop, sao chép pose đầu sang cuối và kiểm tra vận tốc trước/sau seam. Idle breathe không vượt 3% squash/stretch; mắt/ăng-ten không rung nhanh.
6. Trong Face, tạo pose neutral, blink, star, heart và spiral. Dùng solo/visibility selection; không morph những path không tương thích rồi làm mắt méo.
7. Confetti tối đa 24 mảnh; dùng cùng path màu ở nhiều node, timeline transform riêng. Không thêm blur/shadow nặng hoặc flash trắng toàn màn hình.
8. SFX nằm ngoài binary, mặc định tắt. Không embed font Nunito/JetBrains Mono cho số XP/cấp; phần số/text nằm trong HTML React.

### Mapping mouth

| `viseme` | Child | Ghi chú |
|---:|---|---|
| 0 | `mouth_closed` | Khoảng nghỉ |
| 1 | `mouth_open_A` | Miệng mở dọc |
| 2 | `mouth_open_E` | Mở ngang |
| 3 | `mouth_open_O` | Tròn nhỏ |
| 4 | `mouth_smile` | Răng/miệng cười |
| 5 | `mouth_wow` | Tròn lớn |

`mouth_sad` dành cho expression, không chiếm một giá trị viseme. Thời điểm khẩu hình lấy stream app, không random mouth khi không có giọng nói.

## 4. Tạo `MascotSM` và soát input

Thêm state machine tên **`MascotSM`**, đúng chữ hoa/thường. Tạo input theo hợp đồng code:

```text
Trigger: wave correct wrong almost complete perfect levelUp
         streakUp streakLost badge hint hurry cheer loading
Boolean: isTalking isThinking isSleeping isCoding
Number:  viseme combo lookX lookY xp mood

Control mở rộng đã có trong binary:
Trigger: play
Number:  stateIndex (0–26) pointDirection (-1/+1)
```

Default tất cả Boolean=false; `viseme/combo/lookX/lookY/xp/mood=0`. Number range giới hạn ở adapter: viseme 0–5, combo 0–10, look -1…1, xp 0–999, mood 0–4.

Tạo ba nhóm chính **Body**, **Face**, **FX**, đặt state gốc lần lượt Idle, Neutral và Clear. Bản native dùng tám layer control bổ sung: **LookX, LookY, Combo, Point, XP, Mood, ThinkLook, CodeEyes**, tổng **11 layer**. Gắn timeline và transitions theo mục 5 của motion spec. Blend thường 120ms, blink 40ms, sleep 180ms. One-shot exit về idle ở 100%; khi modal vẫn mở, UI giữ kết quả đọc được, không loop lại màn ăn mừng. Loops đợi app dừng. Không key cùng root thuộc tính ở Body và FX.

Trong Body, correct có nhánh combo theo điều kiện `combo=3`, `5`, `10`; các trường hợp khác vào correct thường. Miệng theo Number trong Face, nhưng expression star/heart của reward override look/blink tự động. Đặt priority/queue ngoài Rive ở provider thay vì cho tất cả trigger trực tiếp cắt mọi timeline. [State machine và transition](https://rive.app/docs/editor/state-machine/transitions).

Hợp đồng không có Boolean `isLoading`, Trigger `offline` hay Number `level`. Loading kết thúc bằng controller owner `stop(id)`; adapter gửi **stateIndex theo thứ tự `TIMELINES` rồi fire `play`** để chọn timeline khác. `pointDirection` được gửi -1 cho trái, +1 cho phải. Named trigger cũng có wiring native để chọn state tương ứng. Contract JSON ghi rõ các input mở rộng đã thực sự có; nếu thêm input tiếp theo, cập nhật manifest/version, source và adapter cùng nhau.

Reduced motion ở BytePath được xử lý bởi app: pause canvas và chuyển sang SVG pose tĩnh/fade. Nếu tạo thêm property cho nhánh reduced trong Rive, vẫn phải lấy preference từ hệ điều hành/hồ sơ và truyền vào; Rive không tự chọn motion phù hợp. [Reduced motion chính thức](https://rive.app/docs/editor/accessibility/reduced-motion).

## 5. Test trong Editor trước export

Trong preview `MascotSM`, test từng Trigger một lần, rồi đổi Boolean. Thử look cực trị ±1 và viseme từng số 0–5; combo 2/3/4/5/9/10; XP 0/999. Kiểm tra không có mắt/prop/mouth từ state cũ còn sót.

Test complete→levelUp theo queue, correct→wrong, hint→correct, loading→request finished, pause/resume và Skip. Những việc thuộc provider phải thử thêm ở React runtime; Editor độc lập không xác minh ledger backend, event ID hay API grading.

Reduced-motion pose phải thể hiện đúng cảm xúc mà không cần di chuyển. Frame cuối của level/perfect chứa quà/kết quả đọc được; không chỉ một burst trống. Khung text HTML vẫn xuất hiện khi Skip ở ngay 100ms.

## 6. Xuất bằng Editor hoặc official CLI/RML

### Editor

Nếu chỉnh sửa trong Editor/account: mở Publish/For runtime và giữ Free splash screen theo exporter. Tên file `bitty.riv`, cùng một file chứa các timelines/props. File runtime là asset load trong ứng dụng, không phải backup project Editor. Bản BytePath hiện hành được build bằng CLI ở phần kế tiếp, không phụ thuộc thao tác account này. [Cách export runtime](https://rive.app/docs/editor/exporting/exporting-for-runtime).

Chỉ giữ một artboard mascot; thêm artboard nhỏ nếu cần preview riêng nhưng bỏ bản duplicate không dùng trước export. Nếu file vượt 200.000 byte, ưu tiên bỏ font/audio/raster, rút gọn path/keyframe, reuse props và bỏ test artboard. Giảm chất lượng silhouette hoặc bỏ required timeline là phương án cuối, phải ghi rõ phạm vi.

### CLI/RML

Rive hiện có CLI chính thức để dựng scene từ RML, preview và tạo asset runtime; project văn bản thuận tiện review trong Git. CLI có thể tạo project mới hoặc lấy file trong tài khoản bằng luồng remote file, nhưng chỉ thao tác account sau đăng nhập chính thức. [Rive CLI overview](https://rive.app/docs/cli/overview).

Project hiện có không cần scaffold lại. Lệnh tái tạo đã triển khai:

```powershell
node scripts/build-bitty-rive.mjs
```

Script dùng executable chính thức `.runtime/rive-cli/v1.5.1/rive.exe`, chạy generator `animation/bitty/build-source.mjs`, verify/inspect/build và kiểm tra header/kích thước. Kiểm thử source bảo đảm không có ScriptAsset/raster/font. Source `scene.rml` giữ geometry curve từ SVG; không phải JavaScript vẽ lại nhân vật bên trong một script Rive. Khi kiểm tra artifact hoàn tất, copy đúng hai file runtime trước khi build Vite:

```powershell
Copy-Item -LiteralPath 'animation/bitty/build/bitty.riv' -Destination 'public/mascots/bitty/bitty.riv'
Copy-Item -LiteralPath 'animation/bitty/contract.json' -Destination 'public/mascots/bitty/contract.json'
npm run build
```

Các lệnh native tương ứng, chạy từ workspace (trong PowerShell dùng `&` trước đường executable):

```powershell
& '.runtime/rive-cli/v1.5.1/rive.exe' animation/bitty --verify --format=json
& '.runtime/rive-cli/v1.5.1/rive.exe' inspect animation/bitty --summary
& '.runtime/rive-cli/v1.5.1/rive.exe' animation/bitty --once --format=json
& '.runtime/rive-cli/v1.5.1/rive.exe' animation/bitty --screenshot=output/playwright/bitty-native-idle.png --advance=1 --viewport=512x512 --fit=contain
& '.runtime/rive-cli/v1.5.1/rive.exe' animation/bitty --bench=180
```

Phiên bản này đã verify và inspect thành công, native artifact xuất hợp lệ dưới 200.000 byte. Benchmark CLI đo native rendering, **không** chứng minh mobile/browser đạt 60 FPS. Các số cũ đo trên artboard 256 trước padding không dùng làm benchmark bản 360 hiện hành; báo cáo phát hành ghi kết quả mới.

Khi nâng phiên bản, đọc help và [Command Reference](https://rive.app/docs/cli/reference/commands), không suy đoán flag hay dùng npm package trùng tên không phải của hãng. Giữ RML/config/generator để tái tạo binary, ghi version/command/SHA-256 vào báo cáo. Lỗi compiler/export không được ghi thành “đã xuất xong”.

Workflow tái tạo: load đúng RML/asset source → kiểm tra compile → xuất `.riv` chính thức → runtime inspect tên artboard/timeline/input → capture neutral/correct/complete/level → đo bytes → đưa file đạt kiểm tra vào `public/mascots/bitty/`. Không cần push file lên tài khoản hoặc Marketplace chỉ để app local chạy.

## 7. Đo file và kiểm tra trong BytePath

Đo bytes bằng PowerShell tại workspace, với đường dẫn đã có binary thật:

```powershell
$bittyAsset = Get-Item -LiteralPath 'public/mascots/bitty/bitty.riv'
if ($bittyAsset.Length -ge 200000) { throw 'Bitty vượt giới hạn 200.000 byte' }
Get-FileHash -LiteralPath $bittyAsset.FullName -Algorithm SHA256
```

Đây chỉ là kiểm tra kích thước/hash, **không chứng minh binary hợp lệ**. Tiếp theo mở preview của BytePath trong browser, xác nhận Rive canvas load bằng runtime thật, artboard/state machine/timeline/input khớp. Thử request asset 404/invalid/WASM lỗi để SVG fallback hiện và câu hỏi tiếp tục dùng được. Giữ WASM cùng origin để không phụ thuộc CDN khi offline.

Trong React, adapter dùng **`@rive-app/react-canvas` 4.36.0**, **`@rive-app/canvas` 2.44.0**, WASM đã khóa trong `package-lock.json`. WASM/fallback WASM được Vite import từ dependency và phục vụ cùng origin. Adapter dispose canvas khi unmount, pause khi tab ẩn/ngoài viewport, tránh instance mới mỗi render. Không tạo 24 canvas cho cửa hàng skin chỉ để preview tĩnh. 200KB chỉ là giới hạn **asset mascot**, không phải tổng WASM hoặc JavaScript bundle.

## 8. Lưu bằng chứng và chuyển giao

Lưu source SVG/RML, binary và manifest tách khỏi secret account. Báo cáo ghi ngày, build hash, CLI/runtime version, file bytes/hash, số artboard/timeline/input, screenshot/capture và kết quả fallback/reduced motion/mobile. Link source và báo cáo trong README hoặc tài liệu release.

Binary hiện tại đã được xuất native thành công và có đầy đủ wiring/geometry, không dùng pose stub hoặc script để thay timeline. Browser cần kiểm chứng renderer thực sự báo `data-renderer="rive"`, rồi thử forced asset/WASM failure và reduced motion chọn SVG; sự có mặt của dependency chưa đủ chứng minh runtime đang dùng Rive. Báo cáo release ghi riêng native/compiler, browser, mobile và regression backend.
