# Báo cáo thiết kế lại bài giảng cho người mới

Phạm vi: sáu khóa DSA, ML, DA, Git/GitHub, AI Agent và Đại số tuyến tính; **223 buổi học, 23 kiểm tra**. Giữ ID, số buổi, bộ chạy code, điều kiện mở khóa, điểm tốt nhất và quy tắc thưởng. Danh mục từng buổi nằm trong [TEACHING-AUDIT.md](TEACHING-AUDIT.md); kịch bản học thử ở [BEGINNER-PILOT.md](BEGINNER-PILOT.md).

## Trước và sau

| Trở ngại | Thay đổi đã triển khai |
|---|---|
| Nội dung chính, đọc sâu và code dài cùng hiện một lúc | Luồng 15 bước có mục lục, mỗi bước tập trung một hành động; đọc sâu và hàm hỗ trợ được thu gọn thực sự. |
| Yêu cầu Python trước khi dạy kiến thức cần thiết | 15 bài bổ trợ dùng chung, có câu chẩn đoán, ví dụ, hai thao tác và nút trở lại đúng vị trí. |
| Đại số buổi đầu đưa ra 87 dòng code phụ trợ | Ví dụ chính còn hai dòng `solve(data)` và `return [x, y]`; có giải thích từng dòng. Grader vẫn dùng lời giải đầy đủ riêng. |
| Hoạt động ghép/xếp có nội dung lặp giữa chủ đề | 1.784 hoạt động được gắn tám vị trí trong từng buổi; thuật toán, thuật ngữ, lỗi và tình huống vận dụng lấy từ thiết kế riêng của bài. |
| Dữ liệu thường hiện thành JSON | Bảng, mảng, điểm tọa độ, sơ đồ và ô nhập theo dữ liệu; JSON nằm trong phần mở thêm. `0`, `false`, `null` được phân biệt. |
| Mô phỏng và ví dụ có thể dùng dữ liệu khác nhau | Luồng chính dùng trace của chính ví dụ đã giải; hình thử thêm được ghi rõ là dữ liệu độc lập. |
| Phản hồi chỉ báo đáp án | Nêu phần chưa khớp, ví dụ/giải thích và hướng thử lại; sau hai lần sai đề xuất xem lại ví dụ. |

Nội dung theo từng khóa dùng cấu trúc chung nhưng phần giải thích chủ đề được biên soạn riêng trong `content/pedagogy/`. Bộ tạo câu hỏi không gọi AI để quyết định đáp án.

## Mô phỏng và mức độ chi tiết

Trace có điều khiển từng bước, chạy/dừng, tốc độ, reset, bàn phím và giảm chuyển động. DSA, Git, Agent và Đại số dùng các trạng thái thuật toán hiện có. Các bài ML nhập môn có phép tính trung gian cho baseline, mean, dot product, MSE, split, impute, scale và confusion matrix; DA buổi đầu có đếm từng bản ghi. Các trace ML/DA khác chỉ có mốc đầu vào/đầu ra được ghi nhãn đúng mức chi tiết; phần giải thích thuật toán và hình tương tác riêng vẫn có trong bài. Không tuyên bố chúng hiển thị mọi bước nội bộ của thư viện.

Đại số buổi 1 có bảng tọa độ riêng chỉ dùng x/y, kéo/chạm và slider có bàn phím; chưa đưa tổ hợp vector hoặc độ dài vào điều khiển của bài này. Animation không tự chạy trong lúc đọc và có chế độ giảm chuyển động.

## Kiểm tra và tính liên tục dữ liệu

- Buổi thường: 1 khái niệm, 2 truy vết, 1 tìm lỗi, 1 vận dụng. Kiểm tra tổng hợp: 2 khái niệm, 3 truy vết, 2 tìm lỗi, 3 vận dụng.
- Đáp án gắn ID thay đổi theo seed và nội dung, không phụ thuộc vị trí sau khi trộn. API lượt chưa nộp không đưa đáp án/giải thích chính thức ra frontend.
- Phiên bản bài giảng và phiên bản đề tách riêng. Lượt cũ giữ câu hỏi, đáp án, lab, seed và code; giao diện có lựa chọn mở lượt luyện mới, giữ code đã nhập.
- Vị trí bước, đã xem, đã thử và phần bổ trợ được lưu trong backup. Xem bài hoặc bổ trợ không tự cấp XP/gem hoặc đánh dấu thành thạo.
- Các API bổ trợ và gợi ý luyện bị chặn trong lượt kiểm tra. Grader code, ngưỡng 80%, yêu cầu code đạt và rubric cuối khóa giữ nguyên.

## Kiểm chứng

Các lệnh nghiệm thu:

```powershell
npm.cmd test
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build --outDir output/teaching-dist
node scripts/audit-teaching.mjs --write
```

Bộ kiểm mới duyệt ít nhất 200 seed cho ngân hàng câu hỏi của từng buổi và tám hoạt động của từng bài học; xác minh cơ cấu câu hỏi, đáp án, định dạng, nguồn ví dụ và trạng thái không lộ đáp án. Có phép tính neo độc lập cho weighted mean, tăng trưởng, conversion, JOIN, MSE và confusion matrix. Các hồi quy bổ sung kiểm tra điều kiện dừng Agent, dữ liệu thiếu và các giả định toán/Git.

API dùng SQLite trong bộ nhớ để thử sáu khóa độc lập, tải lại/tiếp tục, bản nháp cũ, backup, phản hồi sau hai lần sai và không cấp thưởng trùng. UI kiểm tra bằng Chromium với dữ liệu giả; không cộng điểm hoặc mở khóa trong hồ sơ thật.

Kết quả ngày 15/10/2026:

| Hạng mục | Kết quả |
|---|---|
| Bộ kiểm thử đợt thiết kế bài giảng | **191/191 đạt**, không bỏ qua; gồm runner WebAssembly thực cho Python/C++. |
| Rà lại sau khi rút gọn mở bài/chú giải | 3 kiểm tra nội dung/neo toán/trace đạt; bộ chấm và logic sinh đề không đổi ở bước này. |
| TypeScript và Vite | Đạt. Monaco vẫn là chunk lớn tải riêng khi mở editor; có cảnh báo kích thước build. |
| Desktop 1440×1000 và mobile 390×844 | Sáu buổi mẫu DSA11, ML25, DA15, Git2, Agent3, Linear1 đạt; không tràn ngang. |
| Tương tác | Tám hoạt động Linear1, hai lần sai và gợi ý ôn, autosave/reload, bổ trợ rồi quay lại đều đạt. |
| Hình và truy cập | Kéo tọa độ, slider bàn phím, nút bước, số đỉnh đồ thị và phân biệt 0/false/null đạt. |
| Giảm chuyển động/kiểm tra tính điểm | Không autoplay khi giảm chuyển động; trợ giảng ẩn và API bổ trợ trả 403 trong lượt kiểm tra. |
| JavaScript trình duyệt | Không ghi nhận lỗi trong lượt QA sáu buổi mẫu. |

Ảnh sau sửa và log ở `output/playwright/teaching-*`, `output/teaching-final-tests.log`, `output/teaching-ui-flow.log` và `output/teaching-ui-sweep.log`. QA dùng hồ sơ giả trong bộ nhớ, không chứa khóa API hoặc hồ sơ thật. Lỗi vị trí cuộn khi chuyển bước trên mobile đã được sửa; mục lục đóng ngay để tránh dịch chuyển hình đang thao tác.

## Phát hành

Đã cập nhật [hoc.bytepath.workers.dev](https://hoc.bytepath.workers.dev) ngày 15/10/2026. Kiểm chứng chỉ đọc bằng `node scripts/verify-teaching-live.mjs` xác nhận sáu khóa có luồng mới, frontend đúng bản build, mật khẩu cũ vẫn dùng được, API riêng tư vẫn yêu cầu đăng nhập và runner Python sẵn sàng. So với backup trước phát hành, tiến độ/ngôn ngữ từng khóa, XP, gem, inventory, các lượt làm, code, bài cuối khóa, bản nháp và ledger thưởng được giữ nguyên. Bộ theo dõi kết nối và tự phục hồi vẫn bật.

Bản nháp luyện từ phiên bản cũ có thông báo **“MỞ CÁCH HỌC MỚI”**. Chọn nút này để bắt đầu luồng từng bước và mang theo code đã viết; lượt cũ vẫn nằm trong lịch sử. Tải lại trang để lấy giao diện mới nếu đang mở một tab cũ. Cập nhật không tự thay đề của lượt tính điểm đang lưu.

Kết quả kiểm tra public không chứa hồ sơ trong `output/teaching-live-report.json`. Bản sao đầy đủ trước cập nhật nằm riêng ở `.data/public/teaching-before-export.json`; không đưa file này lên GitHub.

## Khi chưa thấy cách học mới

Những bản nháp luyện được tạo trước đợt cập nhật vẫn giữ giao diện cũ theo quy tắc không thay đề đang làm. Trang hành trình trước đó không có thông báo nên người học khó nhận ra đợt cập nhật. Kiểm tra public xác nhận HTML và API đã chạy bản mới; đây không phải thiếu học liệu trên server.

Đã bổ sung khung **“Bài giảng đã được làm mới”** trên trang chủ với nút **“THỬ CÁCH HỌC MỚI”**. Link chọn một bài đang mở khóa và dùng `?phase=learn&guided=1`. Khi người học chủ động mở link này, bản nháp luyện cũ được lưu, code được chép sang một lượt học mới; seed, câu hỏi, lab và câu trả lời của lượt cũ vẫn nằm trong lịch sử. Lượt kiểm tra/ôn tập không bị chuyển đổi. API chuyển lượt dùng giao dịch và liên kết `guidedSuccessorId`, gọi lại hoặc tải lại không tạo nhiều lượt hay cộng/trừ tài nguyên.

HTML trả `Cache-Control: no-store` để tránh giữ bản frontend cũ khi mở lại trang. Tab đang chạy cần tải lại một lần. Khung hiệu ứng chuyển cảnh được giới hạn riêng để không làm trang chủ tràn ngang trên mobile; menu và nội dung chính vẫn có thể mở ngoài khung.

Đợt sửa khả năng nhìn thấy bản mới đã qua 11 kiểm thử mục tiêu, gồm 7 kiểm thử mới và 4 hồi quy lưu bài cũ. TypeScript và build đạt. Kịch bản Chromium dùng bản nháp giả để kiểm tra nút trên trang chủ, code được mang theo, đề cũ còn nguyên, không thưởng/trừ năng lượng thêm và tải lại không tạo lượt lặp. Kết quả giao diện nằm ở `output/visibility-browser.log`; bản sao riêng trước đợt sửa ở `.data/public/visibility-before-export.json`.

## Giới hạn

Kiểm thử cấu trúc không tự chứng minh mọi câu chữ đều rõ với mọi người học. Các ví dụ và lỗi phổ biến đã được rà soát theo chủ đề, nhưng cần học thử theo kịch bản để đánh giá khả năng vận dụng thực tế. Chưa thực hiện nghiên cứu với người mới và không suy ra hiệu quả chỉ từ animation hoặc số màn hình đã xem.

Bộ chấm code/runner hiện có không thay đổi trong đợt này; không gọi Gemini tính phí hoặc dùng AI để xác định điểm. Cập nhật website giữ địa chỉ, mật khẩu và dữ liệu hiện có; bản sao trước phát hành lưu riêng trong `.data/public/`.
