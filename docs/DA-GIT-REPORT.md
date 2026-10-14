# Mở rộng DA và Git/GitHub

Bản mở rộng ngày 14/10/2026 thêm hai khóa độc lập vào registry hiện có. DSA/ML giữ ID, ngân hàng đề và lịch sử; XP, gem, năng lượng, cấp độ và inventory tiếp tục dùng chung. Hai khóa mới mở buổi đầu ngay, mở các buổi tiếp theo theo điều kiện kiến thức ≥80% và bài thực hành bắt buộc đạt.

| Khóa | Buổi bắt buộc | Buổi mở rộng | Mẫu thực hành | Ảnh nguồn | Mẹo / chủ đề phỏng vấn |
|---|---:|---:|---:|---:|---:|
| DA | 28 (24 học + 4 kiểm tra) | 8 | 37 | 10 | 16 / 20 |
| Git/GitHub | 24 (20 học + 4 kiểm tra) | 6 | 26 | 10 | 12 / 20 |

Mỗi buổi học có tám hoạt động ngắn, bài thực hành, phần đọc sâu thu gọn và minh họa tương tác. Trang khóa học, chọn khóa, hành trình, kiểm tra, bản nháp, nguồn, ôn tập, phỏng vấn và cuối khóa đều nhận ngữ cảnh khóa.

DA dùng bảng dữ liệu trực tiếp: sửa ô, lọc, nhóm, pivot, INNER/LEFT JOIN có khóa không khớp, rolling window, mean/median, histogram, correlation và pipeline làm sạch. Biểu đồ có trục, đơn vị, mô tả truy cập và điều khiển chạy/dừng/bước/tốc độ/reset/đổi dữ liệu. SQL là truy vấn SQLite thực trong Python `sqlite3`, chạy qua Pyodide/Chromium sandbox đã chuẩn bị.

Git dùng file ảo, ba vùng working tree/index/HEAD, đồ thị commit, nhánh, terminal và timeline trạng thái. Người học nhìn được nội dung từng phiên bản của file, thử stage/commit/merge/conflict/stash/remote ảo. Không gọi shell, repository host hoặc GitHub thật. Mô hình công khai phạm vi và từ chối lệnh ngoài phạm vi. Đầu ra giới hạn 2 MB, script giới hạn 120 dòng; checker kiểm tra trạng thái và ancestry, không tin trường `passed` từ bài nộp.

Bài cuối DA là dashboard cửa hàng giả lập: làm sạch → KPI → chuỗi biểu đồ trên cùng dữ liệu. Bài cuối Git gồm feature riêng, giải quyết conflict và tích hợp cập nhật remote. Mỗi bài có ba chức năng/workflow, câu truy vết, năm phần luận và test tự tạo; rubric 60/20/10/10. AI chỉ góp ý, điểm do checker xác định.

Catalog SHA-256 và hiệu đính: [DA-CONTENT.md](DA-CONTENT.md), [GIT-CONTENT.md](GIT-CONTENT.md). Các nguồn có liên kết ngược đầy đủ đến bài học, ôn tập hoặc câu phỏng vấn. Các lỗi dữ liệu SQL, phương pháp quartile, pull/merge/ignore/reset được sửa và lưu giải thích.

## Kiểm chứng

- Các test nội dung đối chiếu tối thiểu 200 seed cho mỗi mẫu; DA so với chương trình Python/SQLite tham chiếu độc lập, Git kiểm tra bất biến workflow và nhiều lệnh tương đương.
- `tests/da-git-api.test.mjs`: mở khóa tuần tự toàn bộ DA28/Git24 đến cuối khóa; chặn thiếu code; tách tiến độ/ngôn ngữ/bản nháp; không thưởng trùng; nguồn ảnh; export/import; workbench bị ẩn trong kiểm tra. DA dùng executor fixture ở bộ API này; runner thật có báo cáo riêng.
- `scripts/verify-da-git-runtime.mjs`: 296 đầu vào DA trong runtime thật, SQL đúng accepted/sai rejected, 26 lời giải Git qua grader và năm chương trình minh họa NumPy/pandas chạy thật. Báo cáo tại `output/da-git-runtime-report.json`.
- `scripts/verify-da-git-flow.mjs`: buổi1, bài SQL DA và ba phần cuối khóa của cả hai khóa đi qua API/runner thật trên database riêng. Các buổi giữa được fixture mở trong script này; luồng tuần tự đã được kiểm tra riêng trong API test. Báo cáo `output/da-git-real-api-report.json`.
- `npm test`: **106/106 kiểm thử đạt**, không skip, ngày 14/10/2026. Bao gồm DSA/ML hiện có, hai khóa mới, game hóa, WASI và giới hạn dữ liệu. Log: `output/test-da-git-full.log`.
- Backup chứa kết quả nhóm có khóa đặc biệt được khôi phục bằng parser chỉ dành cho route import, dùng dictionary không có prototype; API khác giữ parser mặc định. Test hồi quy kiểm tra dữ liệu không bị mất và không làm thay đổi `Object.prototype`.
- Build/TypeScript đạt; QA trình duyệt gồm 30 kiểm chứng chính, 9 hồi quy phần preview/lab Git và 12 kiểm chứng ban đầu. Desktop 1366×900, mobile 390×844; không lỗi JavaScript trong các lượt cuối. Xem [UI-DA-GIT-QA.md](UI-DA-GIT-QA.md), ảnh tại `output/playwright/`.

## Phát hành

Ngày 14/10/2026, bản staging đã kiểm chứng được đưa lên [hoc.bytepath.workers.dev](https://hoc.bytepath.workers.dev). Tunnel được nối lại và Worker cập nhật upstream, giữ địa chỉ và mật khẩu. Không dùng dịch vụ trả phí hoặc Docker. Snapshot trước cập nhật: `.data/public/da-git-before-export.json`, không đưa lên GitHub.

`output/da-git-live-report.json` xác nhận HTTPS/đăng nhập, đúng frontend đã kiểm tra, nguồn DA/Git đủ 10 ảnh mỗi khóa, nội dung phỏng vấn, runtime ML/DA và simulator Git sẵn sàng. API khóa học và import backup từ chối truy cập chưa đăng nhập. Toàn bộ dữ liệu khóa cũ, các bảng lượt làm/job/cuối khóa/bản nháp/luyện thêm, XP, inventory và ledger được đối chiếu với snapshot trước cập nhật; dữ liệu giữ nguyên. Gemini hiện được cấu hình; đợt này không gửi thêm yêu cầu Gemini thật để kiểm thử.

Source scanner xác nhận không có API key Gemini, `.env`, database, snapshot, runtime hay artifact QA trong bộ file xuất bản. Hướng dẫn chạy/backup ở README và [ML-RUNTIME.md](ML-RUNTIME.md).

Phạm vi kiểm chứng xác nhận đặc tả và dữ liệu thử đã lưu; không khẳng định chấm tuyệt đối mọi chương trình hoặc mọi lập luận tự do. Mô phỏng Git không thay thế kinh nghiệm thao tác kho thật hay cấu hình quyền GitHub. Gemini cần mạng, các phần học và chấm đã chuẩn bị runtime dùng được offline. Website qua tunnel cần máy Windows đang bật.
