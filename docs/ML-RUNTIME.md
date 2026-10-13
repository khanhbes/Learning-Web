# Chuẩn bị và vận hành runner ML

Chạy trong workspace trên Windows với Node.js 24 trở lên:

```powershell
npm ci
npm run runner:setup
npm run ml:setup
npm run build
npm start
```

`runner:setup` giữ môi trường DSA Python 3.12/C++17. `ml:setup` chuẩn bị Pyodide **314.0.7 / Python 3.14**, đúng năm thư viện và phụ thuộc từ lockfile chính thức. Bản đóng hiện tại: NumPy 2.4.6, pandas 3.0.2, SciPy 1.18.0, scikit-learn 1.8.0, matplotlib 3.10.8. File nằm trong `.runtime/ml`, có manifest SHA-256 và không được đưa lên GitHub. Script kiểm tra ít nhất 1 GB trống trước khi tải. Chromium được Playwright quản lý trong cache ổ C. Không dùng Docker hoặc ổ E.

Mỗi submission dùng Chromium headless mới, profile/context sạch, sandbox Chromium bật. Windows Job Object gắn trình duyệt khi tiến trình còn suspended, giới hạn RAM cả job 1 GB/100 tiến trình và hủy toàn bộ cây khi đóng handle. Không bật quyền breakaway. Môi trường con được lọc, không truyền API key hoặc mật khẩu.

Browser chỉ nhận asset runtime có checksum qua route whitelist; request khác, WebSocket và service worker bị chặn. Python nhìn thấy filesystem ảo của Pyodide, không có Node bridge, cookie ứng dụng, SQLite hay filesystem host. Khởi tạo thư viện có giới hạn 120 giây; thuật toán nộp 30 giây; đầu ra 2 MB. Một job ML chạy tại một thời điểm. Dataset/đặc tả giữ giới hạn 1.000 hàng/20 cột; bài dùng sklearn quy định `n_jobs=1`.

Thiếu runtime, checksum sai, thiếu package, oracle bất nhất hoặc trình duyệt gián đoạn trả **Chưa có kết quả — cần chấm lại**. Bản nháp còn nguyên; không cấp điểm fail vì lỗi hạ tầng và không mất X2. Runtime không chạy code học viên trực tiếp trên host để thay thế. Linux chưa hỗ trợ Job Object; runner ML sẽ báo chưa sẵn sàng thay vì tự bỏ giới hạn.

Sau khi chuẩn bị, runtime/chấm dùng offline. Gemini cần mạng, cấu hình trong `.env` server và được giới hạn lượt; không đưa key vào frontend, source hoặc backup.

Kiểm chứng môi trường thật:

```powershell
node scripts/verify-ml-runtime.mjs
```

Báo cáo nằm ở `output/ml-runtime-report.json`. Chỉ lời giải tham chiếu do dự án viết được chạy bằng Python host trong bộ test oracle; submission học viên luôn đi qua runner cách ly.

Xuất backup v2 từ Hồ sơ trước khi cập nhật. Backup lưu cả hai khóa, bài làm, drafts, inventory, ledger và luyện thêm. Import nhận v1/v2 và chuyển v1 sang DSA trong giao dịch. Giữ `.data/bytepath.sqlite` cùng WAL khi ứng dụng đang chạy; nên dùng export trên web hoặc SQLite backup để có bản nhất quán.
