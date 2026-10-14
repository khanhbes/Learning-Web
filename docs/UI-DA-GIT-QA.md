# Kiểm thử giao diện DA và Git/GitHub

Ngày kiểm thử: **14/10/2026**. Giao diện được chạy bằng Chromium thật qua Playwright CLI, trên backend `127.0.0.1:3001` và SQLite QA riêng `.data/da-git-ui-qa.sqlite`. Không sửa hồ sơ người học thật, `.env`, mật khẩu hoặc dữ liệu công khai. AI được tắt trong môi trường QA.

Kết quả: **30 kiểm chứng giao diện và ngữ nghĩa đã qua**, **9 kiểm chứng hồi quy preview/luyện Git đã qua**, cùng **12 kiểm chứng luồng ban đầu**. Những màn hình không thay đổi giữ kết quả kiểm tra trước; sau sửa nhãn tab chỉ chạy lại phần preview, luyện và editor chịu ảnh hưởng. TypeScript `npx tsc --noEmit` và Vite build đã qua. Trong các lượt thành công, `consoleErrors` và `pageErrors` đều rỗng; Playwright CLI báo **0 lỗi, 0 cảnh báo**.

## Bằng chứng nội dung trực quan

| Tương tác | Kết quả quan sát |
|---|---|
| Danh mục khóa | DSA 48+12, ML 40+12, DA 28+8 và Git/GitHub 24+6; hình SVG riêng cho mỗi khóa |
| JOIN | 6 đơn ghép khóa Tea trùng tạo 9 dòng; thêm khóa Missing cho INNER còn 7 dòng và LEFT giữ 8 dòng, có NULL |
| Tổng tích lũy | Buổi DA18 cộng từ đầu đến dòng hiện tại; dòng3 là260, dòng6 là490 nghìn đồng |
| Xếp hạng | Buổi DA19 phân biệt ROW_NUMBER, RANK và DENSE_RANK; hòa60 có hạng3, hòa50 có RANK5 và DENSE_RANK4 |
| Phân vị | Phương pháp linear trên50,50,60,60,120,150 cho Q1=52,5 và Q3=105; IQR/hàng rào cập nhật từ dữ liệu |
| Pipeline | 4 bước trực quan; thêm trùng/thiếu/âm có9 hàng thô, giữ6 hàng sạch và đối soát tổng490 |
| Chỉnh ô | Số lượng đơn1 đổi2→0 làm tổng doanh thu490→430; Mean và Median hiện riêng |
| Mô phỏng Git | Working tree, index và HEAD giữ snapshot riêng; sửa tiếp sau add không thay nội dung đã stage |
| Đề Git | Trạng thái đầu được vẽ trực tiếp từ `sampleInput.initial`; JSON và nội dung tệp mục tiêu thu gọn mặc định |
| Truy vết Git | Chỉ vẽ trạng thái đầu và chuỗi lệnh đã cho; không thực thi để đưa đáp án hoặc hiển thị goal của câu hỏi |
| Chấm và lưu | Reference Git qua toàn bộ test, UI hiển thị ăn mừng; code giữ khi mở lại bài; luận Git tự lưu và còn sau reload |
| Cuối khóa | Tên dự án khớp module; Git có3 workflow, DA có3 chức năng; DA hiển thị21 dòng raw của đề đã tạo |
| Luyện thêm | Git có12 mẹo và20 chủ đề phỏng vấn |

Nhãn và icon tab luyện lấy từ `q.kind`: xếp bước, ghép cặp, chạy tay hoặc chọn ý/sửa lỗi. Điều này tránh gán tên theo vị trí khi cấu trúc hoạt động khác giữa các khóa.

## Desktop, mobile và chuyển động

- Desktop: **1366×900**; mobile: **390×844**. Các màn DA, Git workbench và đề code mobile không làm tràn ngang toàn trang; bảng/đồ thị rộng cuộn trong vùng riêng.
- Editor mobile có ba tab Đề bài/Code/Kết quả. Bộ chọn khóa chuyển về hành trình và chờ trạng thái backend xác nhận.
- `prefers-reduced-motion: reduce` tắt tự phát DA/Git; nút bước trước/sau vẫn dùng được.
- Terminal Git dùng chữ sáng trên nền tối. Biểu đồ có nhãn trục, đơn vị, mô tả văn bản và trạng thái bàn phím.
- Asset và animation thành tích hiện có tiếp tục dùng cho khóa mới; không lấy nhân vật hoặc âm thanh Duolingo.

## Báo cáo và ảnh chụp tại máy

Kết quả máy đọc được: `output/ui-da-git-report.json`. Log các lượt thành công: `output/ui-da-git-final.log`, `output/ui-da-git-preview.log`. Các artifact QA nằm trong `output/`, được bỏ qua bởi Git.

Ảnh cuối đã kiểm tra trực quan:

- `output/playwright/four-courses-final-desktop.png`
- `output/playwright/da-join-final-desktop.png`
- `output/playwright/da-running-total-final.png`
- `output/playwright/da-ranking-final.png`
- `output/playwright/da-quartile-final.png`
- `output/playwright/da-pipeline-final.png`
- `output/playwright/git-workbench-final-desktop.png`
- `output/playwright/git-workbench-final-mobile.png`
- `output/playwright/da-join-final-mobile.png`
- `output/playwright/git-code-final-desktop.png`
- `output/playwright/git-code-final-mobile.png`
- `output/playwright/git-trace-final-desktop.png`
- `output/playwright/git-capstone-final-mobile.png`
- `output/playwright/da-capstone-final-mobile.png`

Kiểm thử giao diện xác nhận những luồng và kích thước trên. Độ đúng của oracle, SQL/Python, simulator, điều kiện đạt, phần thưởng và migration được kiểm tra riêng bằng bộ test backend và bài chạy thật; không suy ra độ đúng của bộ chấm chỉ từ ảnh giao diện.
