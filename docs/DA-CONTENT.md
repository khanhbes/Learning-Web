# Học liệu Data Analytics

Khóa DA mở độc lập với DSA, ML và Git/GitHub. Có **28 buổi bắt buộc**: 24 buổi học và bốn kiểm tra ở buổi 7/14/21/28; thêm **8 buổi mở rộng**. Ngôn ngữ thực hành là Python. Bài học bảng tính sử dụng workbook mô phỏng trên web; bốn buổi 8/12/15/18 có bài **SQL thực sự chạy trên SQLite trong bộ nhớ**.

## Nguồn tài liệu

[Danh mục nguồn](../content/da/sources.json) ghi đủ 10 ảnh trong `study documents/DA/`, gồm mã nguồn, trang, chủ đề, SHA-256, bài học, ôn tập và chủ đề phỏng vấn. Người học mở ảnh gốc từ “Tài liệu nguồn”. Mọi liên kết từ bài đến nguồn đều có ánh xạ ngược trong catalog; các buổi bổ sung được ghi nhãn Bổ sung.

| Trang | Chủ đề | Mã ảnh |
|---|---|---|
| 1 | Tổng quan Data Analytics | DA-802777798 |
| 2 | Excel căn bản | DA-808298581 |
| 3 | Pivot, bảng tính và trực quan hóa | DA-808051959 |
| 4 | SQL căn bản | DA-807590346 |
| 5 | Aggregation và GROUP BY | DA-808008330 |
| 6 | SQL JOIN | DA-808521373 |
| 7 | Subquery, CASE, CTE và window | DA-808565048 |
| 8 | Thống kê cho Data Analyst | DA-808136923 |
| 9 | Python, NumPy và pandas | DA-805876927 |
| 10 | Làm sạch dữ liệu và EDA | DA-805900198 |

Chạy `node content/da/generate-catalog.mjs` để tái tạo danh mục từ các ảnh. Script từ chối ảnh chưa có ánh xạ thay vì tự gán chủ đề.

## Lộ trình và hoạt động

| Buổi | Nội dung |
|---|---|
| 1–6 | Câu hỏi phân tích, Python, ô/công thức/tham chiếu, IF/SUMIFS, lookup, pivot |
| 7 | Kiểm tra nền tảng bảng dữ liệu |
| 8–13 | SELECT/WHERE, DISTINCT/NULL, ORDER BY/LIMIT, COUNT/SUM/AVG, GROUP BY, HAVING |
| 14 | Kiểm tra truy vấn và tổng hợp |
| 15–20 | INNER/LEFT JOIN, CASE/CTE, window, thứ hạng, mean/median/variance |
| 21 | Kiểm tra ghép bảng và thống kê |
| 22–27 | Quartile/IQR, scatter/correlation, missing/duplicate, pipeline làm sạch, KPI, dashboard |
| 28 | Kiểm tra tổng hợp và chuẩn bị dự án |
| 29–36 | Growth, weighted mean/Simpson, cohort, A/B, quyền riêng tư, chất lượng dữ liệu, FULL JOIN, funnel/portfolio |

Mỗi buổi có mục tiêu, tình huống đời thường, ví dụ nhỏ, phản ví dụ, workbook có thể thao tác, tám hoạt động ngắn và code theo đặc tả. Các hoạt động gồm chọn đáp án, tìm lỗi, ghép thuật ngữ, xếp thứ tự và điền JSON kết quả từ bảng. Phần công thức/code mở dần; mô phỏng có chạy/dừng, bước trước/sau, tốc độ, reset và thay dữ liệu.

Bộ dữ liệu minh họa chung gồm sáu đơn giả lập, doanh thu tính bằng **nghìn đồng**. Tổng 490, North 210, South 110, East 170; ba tháng lần lượt 110/270/110. Dữ liệu biểu đồ được tính từ hàng nguồn, tránh một bảng số và một hình không khớp nhau. Ví dụ NumPy, pandas và matplotlib nằm trong [demonstrations.mjs](../content/da/demonstrations.mjs).

Ngân hàng luyện thêm có 16 mẹo và 20 chủ đề phỏng vấn DA, lấy từ tài liệu và phần bổ sung đã ghi nguồn. Gem chỉ được cấp khi checker khách quan xác nhận câu đúng; tự luận nhận rubric và phản hồi trợ giảng.

## Sổ hiệu đính

Chi tiết trước/sau và đường dẫn chính thức nằm trong [curriculum.mjs](../content/da/curriculum.mjs).

| Mã | Nội dung đã sửa |
|---|---|
| DA-E01 | ORDER BY giữ nguyên bảng đầu vào; lương giảm dần là Ravi 60000, Neha 55000, Asha 50000. |
| DA-E02 | GROUP BY chỉ tạo nhóm xuất hiện; HR-Mobile=0 không được tự thêm. Pivot có thể điền ô vắng khi chủ động tạo lưới. |
| DA-E03 | FULL JOIN không tự tạo Marketing ngoài bảng departments. Muốn minh họa phải thêm department đó vào đầu vào. |
| DA-E04 | Nêu phương pháp quantile. Với linear và dãy 10..80, Q1=27.5, Q3=62.5, IQR=35. Không gán 22.5/67.5 cho phương pháp này. |
| DA-E05 | `.loc[0]` chọn nhãn index 0; `.iloc[0]` chọn vị trí hàng đầu. |
| DA-E06 | Tổng lũy kế ghi rõ `ORDER BY day,id` và frame `ROWS`. RANK giữ hòa theo value, ROW_NUMBER dùng id để phá hòa. |
| DA-E07 | COUNT(*) khác COUNT(column); AVG/SUM bỏ NULL, SUM toàn NULL trả NULL theo ngữ nghĩa SQL của bài. |
| DA-E08 | Phân biệt keyword SQL, collation và dialect; thứ tự ngữ nghĩa không phải cam kết thứ tự chạy vật lý của optimizer. |

Nguồn đối chiếu: [SQLite SELECT/JOIN](https://www.sqlite.org/lang_select.html), [hàm tổng hợp](https://www.sqlite.org/lang_aggfunc.html), [window/frame](https://www.sqlite.org/windowfunctions.html), [NumPy percentile](https://numpy.org/doc/stable/reference/generated/numpy.percentile.html), [pandas loc](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.loc.html). Các công thức và ví dụ số có kiểm thử hồi quy riêng.

## Chấm code và bài cuối khóa

Có 37 mẫu code: 33 thao tác phân tích với Python và bốn mẫu SQL. `solve(data)` nhận dữ liệu JSON và trả kết quả theo hợp đồng. Với SQL, người học sửa biến `query` trong wrapper Python đã tạo schema/dữ liệu cho `sqlite3.connect(':memory:')`. Query thực sự được SQLite đánh giá; bài không đối chiếu chuỗi SQL với lời giải mẫu.

Checker Node nằm ngoài chương trình nộp. ID, chỉ số, số dòng/đơn và thứ hạng được so chính xác; tiền, tỷ lệ và thống kê dùng `absolute=1e-7`, `relative=1e-6`. Object không phụ thuộc thứ tự khóa; thứ tự hàng chỉ bắt buộc ở đề đã quy định. Khóa nhóm như `__proto__` hay `constructor` vẫn được xử lý như dữ liệu. Trường `pass` trong đầu ra người học không được tin cậy.

Qua buổi cần kiến thức ≥80% và code bắt buộc đạt. Qua kiểm tra cần 8/10 câu và cả hai bài code đạt. Hạ tầng lỗi giữ trạng thái cần chấm lại, không tự đánh fail; điểm học thuật độc lập với tiền ảo và XP.

Capstone **“Dashboard cửa hàng Byte”** dùng cùng dataset xuyên suốt ba chức năng: làm sạch có nhật ký → KPI → series doanh thu theo tháng. Bản đầu của id quyết định việc giữ/loại; bản sao phía sau không chữa bản đầu sai. Số 0 là hợp lệ, null là thiếu. Người học viết đủ năm phần luận, đọc/truy vết kết quả và tạo test phát hiện lỗi mẫu.

Rubric: code 60, truy vết 20, điều kiện áp dụng/độ phức tạp 10, test 10. Pass ≥80, đủ ba chức năng code và đủ các phần luận. AI góp ý văn bản; checker cấp điểm chính thức. Dự án giả lập kiểm chứng thao tác, đối soát và đọc dữ liệu; không tuyên bố xác nhận hiệu quả kinh doanh hay quan hệ nhân quả.

## Bằng chứng kiểm thử

Ngày 14/10/2026, `node --test tests/da-content.test.mjs` đạt **6/6 nhóm**:

- 10 SHA-256 khớp ảnh gốc; 36 bài có nguồn, nội dung, tám hoạt động và lời giải.
- 37 mẫu ×200 seed, cộng test mẫu/biên, được đối chiếu giữa oracle JavaScript và Python viết độc lập; bốn mẫu SQL chạy SQLite thật trong kiểm thử reference.
- 36 buổi ×200 seed hoạt động, đáp án theo ID và checker ngữ nghĩa; dữ liệu công khai không chứa answer/explanation.
- Toàn bộ miền nhỏ cho null/0/2 và lọc theo dấu bằng, cùng các lỗi JOIN nhân dòng, hòa thứ hạng, dãy hằng và phân vị.
- Sai ID/số đếm nằm trong khoảng tolerance vẫn bị từ chối; float tương đương trong sai số cho phép được chấp nhận.
- Capstone sát ngưỡng 80, thiếu code/luận và test phát hiện lỗi missing-to-zero, duplicate, negative, mean của mean, bỏ tháng vắng và sai metric.

Kiểm thử reference trên host chỉ chạy mã do repository soạn sẵn. Bài của người học chạy ở runtime Pyodide cách ly dùng chung với ML; kiểm chứng runtime/UI/backend được ghi trong báo cáo phát hành chung.
