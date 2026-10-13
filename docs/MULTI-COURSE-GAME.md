# Nhiều khóa, luyện thêm và phần thưởng

BytePath dùng một hồ sơ với tiến độ DSA và ML riêng. Các buổi cùng số, ngôn ngữ, bài cuối khóa và bản nháp không dùng chung. XP, kim cương, năng lượng, streak, giải đấu và bộ sưu tập thuộc hồ sơ chung.

## Dữ liệu và tương thích

SQLite schema/backup phiên bản 2 thêm `course_id` vào lượt làm, bài nộp, bản nháp, cuối khóa và ledger; bảng `knowledge_attempts` lưu lượt luyện thêm. Các trường `progress`, `started`, `capstonePassed`, `capstoneScore` cũ tiếp tục đại diện DSA trong dữ liệu lưu. Giao diện `/api/state` chiếu khóa được chọn; `courses.dsa` và `courses.ml` luôn có cả hai tiến độ.

ID thưởng DSA cũ như `lesson:1`, `capstone`, `chest:1` giữ nguyên để không thưởng lại khi nâng cấp. ID ML có tiền tố `ml:`. Backup v1 được chuyển sang v2 trong giao dịch; lịch sử thưởng, điểm và bài làm được giữ. Dữ liệu luyện thêm trong backup v2 được kiểm tra lại từ seed và phiên bản mẫu trước khi nhận.

XP cũ đóng góp vào cấp hồ sơ. Khi chuyển phiên bản, các phần quà cấp đã đủ XP được cấp đúng một lần và gộp thành một thông báo. Trạng thái `levelRewardIds` ngăn cấp lại khi mở ứng dụng.

## Mẹo và phỏng vấn

Ngân hàng đầu có 40 mẹo (20/khóa), 65 chủ đề phỏng vấn (30 DSA, 35 ML). Mỗi chủ đề có hai mẫu khách quan, đáp án/giải thích và một câu tự luận với rubric. Dạng bài khách quan gồm chọn đáp án, tìm lỗi, nhập số, sắp xếp, ghép đôi và đọc biểu đồ. Chủ đề DSA liên kết bài code hiện có; phần tự luận có đáp án tham khảo và phản hồi Gemini khi yêu cầu.

Một phiên có năm câu. Chọn một chủ đề tạo hai biến thể của chủ đề đó cùng ba câu khác trong khóa. Seed và phiên bản giữ nguyên khi tiếp tục bản nháp. Số, biểu đồ và thứ tự lựa chọn đổi ở lượt mới; ngân hàng hữu hạn có thể gặp lại nội dung cũ. API không gửi đáp án chính thức của lượt đang làm.

Mỗi **mẫu câu** đúng lần đầu nhận 3 kim cương; ôn đúng khi đến hạn nhận 1. Tổng tối đa 30 kim cương/ngày, dùng chung DSA và ML. Các mốc ôn tiếp theo là 1, 3, 7 và 14 ngày; sau đó tiếp tục 14 ngày. Sai không tạo kim cương và không đẩy lịch ôn đúng sang xa hơn.

Phiên đạt ít nhất 4/5 có câu mới hoặc đến hạn nhận 20 XP, tối đa ba phiên/ngày. Hạn mức tính theo Asia/Saigon trước khi nhân X2. Làm thêm sau hạn mức vẫn lưu bài và phản hồi. Nộp lại cùng lượt trả báo cáo đã lưu, không ghi thưởng thêm. Câu tự luận không có điểm hoặc kim cương từ đánh giá AI.

## 24 diện mạo

| Nhóm | Diện mạo |
| --- | --- |
| Robot gốc | `original`, `ocean` (100), `sunset` (200), `cosmic` (300) |
| Robot mua mới | `mint` (200), `neon` (300), `pixel` (400), `aurora` (500) |
| Robot cấp | `scholar` (cấp 5), `rainbow` (cấp 30) |
| Robot hoàn thành khóa | `algorithm` (DSA), `scientist` (ML) |
| Thú | `cat`, `fox`, `rabbit`, `axolotl`: bản cơ bản 150, bản `-outfit` 300, bản `-rare` là quà cấp |

Giá trong bảng là kim cương ảo. Đủ tiến độ bắt buộc và đạt bài cuối khóa mới nhận robot riêng của khóa; chỉ một lần. Diện mạo cấp/khóa không mua trong cửa hàng. Các asset là nhân vật riêng của BytePath, không sử dụng asset Duolingo.

## X2 XP và vật phẩm

Gói `boost-2`/`boost-5`/`boost-10` giá 40/90/160 kim cương, chứa 2/5/10 lượt. Gói đã mua ở inventory; kích hoạt một gói khi không còn gói khác hoạt động. Mỗi lần backend thực sự ghi XP mới vào ledger dùng một charge và cộng thêm đúng lượng XP gốc. Kim cương, điểm học thuật và điều kiện mở khóa được tính riêng.

Fail, lỗi hạ tầng, bản nháp, nộp hai lần và lượt hết hạn mức XP không tiêu hao charge. Kết quả trả XP gốc, XP thêm và charge còn lại. `requestId` của mua/kích hoạt giúp lần gửi lại cùng yêu cầu không tiêu hao thêm; một mã không được dùng cho vật phẩm khác.

Vé `energy-voucher` hồi 15 năng lượng, tối đa 30. Vé không dùng được khi đầy. Inventory đếm gói/vé chưa dùng; `activeBoost` ghi gói và charge đang hoạt động.

## 30 cấp hồ sơ

Chi phí từ cấp L lên L+1 là `100 + 25 × (L−1)`; cấp bắt đầu 1, giới hạn 30. Tổng XP vẫn tăng sau cấp 30 để tính nhiệm vụ, streak và giải đấu.

| Cấp | Phần thưởng |
| --- | --- |
| 2/7/12/17/22/27 | 10/15/20/25/30/35 kim cương |
| 3/8/13/18/23/28 | Gói X2 2/2/5/5/10/10 lượt |
| 4/9/14/19/24/29 | 1/1/2/2/3/3 vé hồi năng lượng |
| 6/11/16/21/26 | Khung chiếc lá/sóng biển/ngôi sao/trăng/lăng kính |
| 5/10/15/20/25/30 | Robot học giả/thỏ mây/cáo thu/mèo trăng/axolotl sao/robot cầu vồng |

Backend cấp quà và lưu `rewardEvents`; giao diện mới hiển thị hiệu ứng. Sự kiện nhiều cấp gộp toàn bộ quà. API xác nhận đã xem chỉ đánh dấu `seen`, không cấp quà lần nữa. Bỏ qua hoặc giảm chuyển động không làm mất phần thưởng.

## API bổ sung

| API | Hành vi |
| --- | --- |
| `GET /api/courses` và `/api/courses/:courseId` | Registry và tiến độ của khóa |
| `GET /api/knowledge?courseId=...` | Mẹo, phỏng vấn, bookmark, thống kê hạn mức |
| `POST /api/knowledge/attempts` | Bắt đầu hoặc tiếp tục phiên năm câu |
| `PATCH /api/knowledge/attempts/:id/answers` | Tự lưu đáp án có cấu trúc |
| `POST /api/knowledge/attempts/:id/submit` | Checker, lịch ôn, thưởng và báo cáo |
| `POST /api/knowledge/bookmarks` | Lưu/bỏ lưu mục |
| `POST /api/inventory/activate` | Kích hoạt gói X2 hoặc vé năng lượng |
| `POST /api/reward-events/:id/seen` | Xác nhận đã xem thông báo quà |

## Kiểm chứng

`tests/new-game.test.mjs` kiểm tra đủ 24 nhân vật, 29 ngưỡng lên cấp, quà hồi tố/multi-level, charge X2, chống stack, mua/kích hoạt lại, vé đầy và robot hoàn thành khóa.

`tests/knowledge.test.mjs` kiểm tra 200 seed cho mỗi 210 mẫu (42.000 trường hợp), đối chiếu oracle số độc lập, đáp án sai/không hợp lệ, đủ dạng hoạt động, biên 80%, tự luận không đổi điểm, hạn mức chung, ôn đúng hạn và bản nháp có đáp án bị sửa.

`tests/knowledge-api.test.mjs` chạy Fastify/SQLite thật cho lưu, tiếp tục, chấm và thưởng chống lặp. `tests/new-multicourse-api.test.mjs` kiểm tra manifest, cùng buổi 1 của hai khóa, đổi khóa/ngôn ngữ, nguồn DSA đã chuyển, boost, backup v1/v2 và toàn bộ các cổng 40 buổi ML đến cuối khóa. Test cổng API dùng runner fixture; kiểm thử thực thi Python ML được báo cáo riêng, không đồng nhất fixture với chạy code thực.

Các điểm hiệu đính phỏng vấn dựa vào [RandomForestClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html), [R²](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.r2_score.html), [chống leakage](https://scikit-learn.org/stable/common_pitfalls.html) và [tham số Gemini](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/adjust-parameter-values). Nguồn ảnh riêng cho từng mục được ghi trong catalog; phần soạn bổ sung có nhãn trong dữ liệu.
