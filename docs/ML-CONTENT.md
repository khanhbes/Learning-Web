# Học liệu Machine Learning

Khóa ML có 40 buổi bắt buộc (36 buổi học, bốn kiểm tra tại buổi 13/24/35/40) và 12 buổi mở rộng. ML mở độc lập với DSA. Ngôn ngữ thực hành là Python; nội dung đi từ Python/toán cần thiết tới dữ liệu, supervised learning, đánh giá, clustering, PCA và pipeline.

## Nguồn và hiệu đính

Danh mục [sources.json](../content/ml/sources.json) ghi đủ 65 ảnh trong `study documents/ML/`: mã nguồn, bộ tài liệu, trang, chủ đề, SHA-256, bài liên quan và 35 chủ đề phỏng vấn. Ảnh gốc nằm trong mục Tài liệu nguồn. Nội dung bài học gắn nhãn Từ tài liệu, Bổ sung hoặc Hiệu đính.

Các hiệu đính có lý do và tài liệu chính thức trong `content/ml/curriculum.mjs`:

- R² có thể âm. Với target hằng, bài metric quy định rõ cách xử lý tương ứng `force_finite=True`.
- Imputer, scaler, feature selection và các bước học thống kê chỉ fit trên train của split/fold tương ứng; test chỉ dùng để đánh giá.
- Giả định dùng cho suy luận thống kê của hồi quy không được đánh đồng với điều kiện để chạy thuật toán dự đoán.
- Random Forest classifier của scikit-learn kết hợp xác suất từ cây; bỏ phiếu nhãn cứng là một cách kết hợp khác.
- PCA cần tâm hóa; chuẩn hóa thang đo tùy mục đích. Dấu eigenvector không có ý nghĩa duy nhất.
- t-SNE/UMAP là công cụ giảm chiều; cụm trên hình 2D chưa chứng minh cụm thật.
- Seed và temperature thấp không bảo đảm LLM tái lập tuyệt đối; cần lưu phiên bản, cấu hình và môi trường.
- Tương quan và SHAP không tự chứng minh quan hệ nhân quả.

Nguồn chính thức: [R²](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.r2_score.html), [chống leakage](https://scikit-learn.org/stable/common_pitfalls.html), [Random Forest](https://scikit-learn.org/stable/modules/ensemble.html#forest), [PCA](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html).

62 ảnh DSA được chuyển sang `study documents/DSA/`; mã nguồn và SHA-256 được giữ nguyên.

## Dạy và thực hành

Mỗi buổi có phần nhớ lại, minh họa, mô phỏng, tám hoạt động ngắn, code bắt buộc, bài mở rộng và kiểm tra cuối buổi. Phần đọc sâu/công thức/code mở dần. SVG tương tác cho phép xem sai số hồi quy, gradient, ngưỡng classification, KNN, cây/forest, cụm, hướng PCA và leakage; có điều khiển và giảm chuyển động.

Ngân hàng có 48 mẫu code với `solve(data)` nhận/trả JSON. Các bài nhỏ làm rõ một bước của thuật toán; chúng không tuyên bố thay thế một dự án huấn luyện hoàn chỉnh. Đặc tả ghi rõ thứ tự feature, missing, hòa, threshold và tolerance. Các ví dụ dùng thư viện thật nằm trong `content/ml/demonstrations.mjs`; không yêu cầu GPU hay model lớn.

## Chấm và cuối khóa

Checker chạy ở Node, độc lập với Python. Sai số số thực dùng tolerance đã ghi trong đề; clustering được đổi nhãn hợp lệ và PCA được đảo dấu đồng thời. Trường `pass` do chương trình nộp trả về không được tin cậy. Oracle JavaScript được đối chiếu với lời giải Python độc lập trên ít nhất 200 seed/mẫu và trường hợp biên.

Bài cuối khóa dùng một dataset churn giả lập xuyên suốt ba chức năng: tiền xử lý train-only, fit/predict KNN theo k/threshold chỉ định, confusion matrix và precision/recall/F1. Đầu ra chuẩn bước trước là đầu vào bước sau; có biểu đồ xác suất để phân tích. Đây là bài kiểm chứng pipeline và kết quả tính toán trên dữ liệu giả lập, không xác nhận độ chính xác trên khách hàng thực tế. Truy vết thêm metric hồi quy để ôn kiến thức trong khóa. Rubric code 60, truy vết 20, điều kiện áp dụng 10, test phát hiện lỗi mẫu 10; cần ít nhất 80 và đủ ba chức năng/luận. Gemini nhận xét văn bản, không cấp điểm chính thức.

## Bằng chứng kiểm chứng học liệu

`node --test tests/ml-content.test.mjs` đạt6/6 nhóm kiểm thử: đủ65 SHA-256 và ánh xạ nguồn;48 mẫu code ×200 seed cùng các test biên được đối chiếu với Python viết độc lập;52 buổi ×200 seed hoạt động;510 đầu vào baseline nhị phân và648 trường hợp confusion matrix được kiểm tra toàn bộ miền nhỏ. Bộ hồi quy bao gồm R² âm, fit nhầm trên test, forest kết hợp xác suất, hoán vị nhãn cụm và đảo dấu PCA.

`node tests/ml-content-demo-verify.mjs` đã chạy24/24 ví dụ thư viện thật trong Pyodide314.0.7/Python3.14 qua Chromium sandbox và Windows Job Object1GB. Năm nhóm NumPy, pandas, matplotlib, SciPy và scikit-learn đều chạy thành công;13 mốc đầu ra số được đối chiếu, gồm dot11, mean nhómA15/B30, query hồi quy9, AUC0.875, R²−39601, confusion matrix và noise DBSCAN. Báo cáo chi tiết lưu ở `output/ml-demo-report.json` trên máy kiểm thử.

Mỗi nhóm nạp các package cần dùng riêng, thay vì yêu cầu mọi thư viện trong một tiến trình. Những thí nghiệm trên đều có dataset nhỏ và cấu hình cố định; kết quả kiểm thử không mở rộng thành tuyên bố mô hình chính xác trên dữ liệu kinh doanh thật.
