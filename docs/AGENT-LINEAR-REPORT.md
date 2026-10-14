# Báo cáo bổ sung AI Agent và Đại số tuyến tính

Ngày nghiệm thu: 15/10/2026. Mở rộng BytePath hiện có, giữ React/Vite, backend local, hồ sơ chung, Gemini hỗ trợ và cơ chế chấm khách quan.

## Học liệu và phạm vi

| Hạng mục | AI Agent | Đại số tuyến tính |
|---|---:|---:|
| Ảnh nguồn đã đọc, lập danh mục và ánh xạ | 8 | 10 |
| Buổi bắt buộc | 24 (21 học, 3 kiểm tra) | 28 (24 học, 4 kiểm tra) |
| Buổi mở rộng | 8 | 8 |
| Mẫu bài Python | 22 | 34 |
| Mẹo | 16 | 20 |
| Chủ đề phỏng vấn | 24 | 20 |
| Bài cuối khóa | Trạm trợ lý thư viện an toàn | Bản đồ và bộ điều khiển của Bitty |

Mỗi ảnh có SHA-256, mã tham chiếu và liên kết tới bài học hoặc hoạt động ôn. Tài liệu khóa mô tả chương trình và sổ hiệu đính: [AI Agent](AI-AGENT.md), [Đại số tuyến tính](LINEAR-ALGEBRA.md). Toàn nền tảng có sáu khóa, 165 ảnh nguồn, 104 mẹo và 149 chủ đề phỏng vấn.

AI Agent bắt đầu từ tác tử phản xạ, trạng thái, mục tiêu, lợi ích và học; sau đó mới giới thiệu công cụ LLM, retrieval, phân quyền và đánh giá bằng fixture. Không cần gọi API hoặc mô hình thật để qua khóa. Nội dung bổ sung được phân biệt với nguồn.

Đại số dùng hình học trước công thức: kéo vector, tổ hợp tuyến tính, biến đổi lưới, tích ma trận, khử Gauss, nghiệm hệ, phép chiếu, vector riêng, PCA và least squares. Các lỗi số liệu nguồn về nghiệm hệ và hạng ma trận được hiệu đính bằng tính toán độc lập; phân biệt nghiệm thực/phức và các điều kiện của phép chéo hóa.

## Trực quan và trải nghiệm

- Mỗi bài có hình minh họa; phần khám phá dùng mô phỏng với chạy/dừng, bước trước/sau, tốc độ, reset và đổi dữ liệu. Phần đọc sâu mở theo nhu cầu.
- Agent hiển thị trạng thái robot, bộ nhớ, đồ thị tìm đường, lợi ích, tải công việc nhiều agent, cây trạng thái phân cấp và bảng đánh giá từ trace của lời giải chuẩn. Sơ đồ phản xạ không thêm bộ nhớ hoặc kế hoạch không tồn tại trong thuật toán.
- Đại số đồng bộ hình và số: diện tích theo định thức, hệ có nghiệm duy nhất/vô số/vô nghiệm, residual, phương sai và sai số đường khớp. PCA dùng cùng quy ước covariance tổng thể như đề; vector riêng và residual dùng cùng độ dài vector.
- Hoạt động dự đoán bước tiếp theo có phản hồi luyện tập. Bài luận cuối khóa có hình dữ liệu đầu vào, tự lưu và khôi phục bản nháp; không hiển thị oracle của lượt tính điểm.
- Giữ mascot, vật phẩm, XP, kim cương và thưởng cấp hiện có. Có điều khiển bàn phím, nhãn tiếng Việt, bố cục điện thoại và giảm chuyển động; hình động không quyết định điểm.

## Chấm điểm và dữ liệu

Qua buổi cần ít nhất 4/5 câu và code bắt buộc đạt; kiểm tra cần ít nhất 8/10 và hai bài code đạt. Cuối khóa cần ít nhất 80/100, cả ba chức năng code đạt và đủ các phần luận. Lỗi hạ tầng trả trạng thái cần chấm lại; không biến thành fail hoặc tiêu hao boost.

Checker chạy ở Node, ngoài chương trình nộp. Đại số dùng sai số tuyệt đối 1e-7 và tương đối 1e-6 cùng kiểm tra kích thước/giá trị hữu hạn. Các nghiệm hệ, cơ sở, dấu/thứ tự vector riêng, dấu QR và hướng PCA tương đương được chấp nhận theo đặc tả. Không dùng Gemini quyết định điểm.

Hai khóa tái sử dụng Pyodide trong Chromium sandbox và Windows Job Object hiện có, không tải thêm model hoặc dùng Docker. Xem [hướng dẫn runtime](ML-RUNTIME.md). Dữ liệu khóa, lượt làm, bản nháp và cuối khóa được tách bằng courseId; các tài nguyên game dùng chung. Alias DSA và phiên bản ngân hàng cũ được giữ để tiếp tục lượt cũ.

## Kết quả kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| `npm test` sau thay đổi cuối | 168 đạt, 0 lỗi, 0 bỏ qua |
| TypeScript và build frontend | Đạt; build được chuẩn bị riêng trước khi cập nhật web |
| Ngân hàng hai khóa | 200 seed cho mỗi mẫu: 4.400 Agent và 6.800 Đại số; đối chiếu oracle độc lập và trường hợp biên |
| Miền nhỏ Đại số | Toàn bộ 625 ma trận 2×2 với phần tử -2..2; định thức, hạng, suy biến và conditioning |
| Miền nhỏ đồ thị | BFS ba node và đồ thị có hướng nhỏ; đường đi/topo và chu trình được kiểm tra độc lập |
| Lời giải Python trong runtime cách ly thật | 481 Agent + 719 Đại số = 1.200 bộ đầu vào đạt; 20 seed/mẫu cùng các trường hợp biên |
| Chấm thật qua API trên hồ sơ thử | 8 job đạt: buổi đầu và ba chức năng cuối khóa của mỗi khóa; lời giải sai bị từ chối |
| Mở khóa tuần tự và điều kiện pass/fail | API test kiểm tra toàn bộ 24/28 buổi và cuối khóa, dùng executor kiểm soát để tách kiểm tra quy tắc khỏi runtime |
| Lưu và phần thưởng | Đổi khóa, buổi 1 độc lập, giữ seed/bản nháp, backup/restore, nộp lặp, không thưởng trùng, lỗi hạ tầng không mất boost |
| Trình duyệt desktop/mobile | Chromium 1440×1000 và 390×844; bàn phím, timeline, đổi dữ liệu, giảm chuyển động, tự lưu luận và tải lại đạt |
| Số liệu biểu đồ | So với trace hoặc phép tính độc lập; cả ba loại nghiệm hệ, trường hợp eigen phức, tải agent và trạng thái cây phân cấp đạt |
| Console phiên QA cuối | 0 lỗi |

Các bài API tuần tự dùng executor kiểm soát không được tính là chạy toàn bộ code của tất cả buổi trên runtime thật. Kiểm thử runtime thật riêng bao phủ mọi mẫu với 20 seed và các biên; 200 seed/mẫu thuộc bộ đối chiếu oracle. Không tuyên bố đã đo FPS trên thiết bị di động vật lý hoặc chấm tuyệt đối đúng với mọi chương trình tùy ý.

Bằng chứng tái tạo:

```powershell
npm test
npm run build
node scripts/verify-agent-linear-runtime.mjs
node scripts/verify-agent-linear-flow.mjs
```

Các script kiểm chứng dùng dữ liệu riêng, không mở khóa hoặc cộng thưởng cho hồ sơ thật. Báo cáo máy đọc được và ảnh chụp QA nằm trong `output/agent-linear-*-report.json` và `output/playwright/` của workspace, được bỏ qua khỏi Git. API key, mật khẩu, SQLite, cookies và backup riêng không đi vào source.

## Cập nhật website

Bản build được đưa lên frontend sau khi kiểm thử; giữ các asset hash cũ để tab đang mở còn tải được. Trước khi thay backend, tạo snapshot riêng và kiểm tra không có job đang chấm; chỉ khởi động lại đúng tiến trình backend thuộc BytePath. Giữ tunnel, watchdog, địa chỉ `https://hoc.bytepath.workers.dev`, mật khẩu và cơ sở dữ liệu hiện có.

Kiểm tra sau cập nhật **đã đạt** bằng `node scripts/verify-agent-linear-live.mjs`: đủ sáu khóa, 18 ảnh mới tải qua HTTPS, frontend đúng phiên bản, API vẫn yêu cầu mật khẩu, runtime Python sẵn sàng và hồ sơ/bài làm/inventory/ledger trước cập nhật được giữ nguyên. Kết quả được ghi trong `output/agent-linear-live-report.json`; script không ghi mật khẩu hoặc cookie ra báo cáo.

Health check local, tunnel và địa chỉ công khai đều trả HTTP 200. Tiến trình watchdog được xác minh đang chạy, với tự phục hồi vẫn bật. Máy vẫn phải thức và có mạng để cung cấp website qua tunnel.
