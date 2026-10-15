# Kịch bản học thử với người mới

Đây là kịch bản nghiệm thu sư phạm, **chưa phải kết quả nghiên cứu với người học thật**. Mục đích là quan sát người học có tự thực hiện được một tình huống mới và giải thích được một lỗi sau khi học hay không.

## Cách tổ chức

Dùng hồ sơ thử hoặc một bản sao dữ liệu. Các bài sau buổi 1 cần được mở bằng tiến độ học hợp lệ; không sửa tiến độ hồ sơ thật để thử nghiệm. Mỗi lượt khoảng 15–25 phút, gồm một đoạn bài giảng, hoạt động làm cùng và bài vận dụng. Người hướng dẫn không giải thích thuật ngữ thay cho bài; ghi lại chỗ người học phải hỏi.

Mở bài nhập môn tại `/courses/<courseId>/lesson/1`. Các mã khóa là `dsa`, `ml`, `da`, `git`, `agent`, `linear`. URL `/lesson/1` cũ vẫn trỏ tới DSA.

| Bài mẫu | Câu hỏi quan sát | Bài vận dụng sau khi học |
|---|---|---|
| DSA 11, `/courses/dsa/lesson/11` | Có đọc đúng giới hạn đoạn và các ô tổng tiền tố? | Dùng một mảng khác, tự tính tổng đoạn và giải thích vì sao phải trừ phần trước đoạn. |
| ML 25, `/courses/ml/lesson/25` | Có phân biệt nhãn thật, xác suất và threshold? | Đổi threshold; chỉ ra một mẫu chuyển ô trong confusion matrix và ảnh hưởng tới precision/recall. |
| DA 15, `/courses/da/lesson/15` | Có nhận ra nhiều hàng cùng khóa ở hai bảng? | Dự đoán số hàng JOIN khi khóa lặp ở cả hai phía; giải thích doanh thu bị nhân đôi. |
| Git 2, `/courses/git/lesson/2` | Có phân biệt nội dung working tree và index? | Sửa A→B, stage, sửa tiếp C; nói commit chứa phiên bản nào và kiểm tra bằng mô phỏng. |
| AI Agent 3, `/courses/agent/lesson/3` | Có đọc được điều kiện và thứ tự ưu tiên luật? | Cho pin thấp đồng thời ô bẩn; dự đoán hành động và giải thích luật được chọn. |
| Đại số 1, `/courses/linear/lesson/1` | Có điều khiển được x/y trước khi đọc code? | Đưa Bitty đến `[-1, 2]`, phân biệt với `[2, -1]`, rồi viết hàm trả lại x trước y sau. |

Kiểm tra lại tên bài trước khi tổ chức nếu chương trình được cập nhật. Người chưa biết Python có thể mở “Hàm và return”, “Dictionary” hoặc “Danh sách” ngay trong bài; phần này không tính điểm hoặc tiêu hao năng lượng.

## Những thao tác cần quan sát

1. Yêu cầu người học nói lại mục tiêu bằng lời của mình.
2. Trước khi chạy mô phỏng, yêu cầu đoán một bước tiếp theo.
3. Để người học tự làm sai một lần; quan sát phản hồi có giúp họ sửa cách nghĩ không.
4. Mở một bổ trợ, hoàn thành hai câu nhỏ, quay lại và tiếp tục hoạt động cũ.
5. Tải lại trang giữa hoạt động; kiểm tra người học tìm lại vị trí và bài làm được.
6. Đưa dữ liệu mới, yêu cầu tự làm mà không nhìn lời giải mẫu.

Không xem việc đã bấm qua màn hình, XP hoặc animation là bằng chứng hiểu bài.

## Phiếu ghi nhận

Ghi mã người thử, khóa/buổi, nền tảng Python/toán, thiết bị và phiên bản nội dung. Không cần tên thật hoặc dữ liệu nhạy cảm.

| Tiêu chí | Ghi nhận |
|---|---|
| Hiểu mục tiêu | Người học diễn đạt được hành động cần làm? |
| Đọc hình | Có xác định đúng đối tượng, hướng, đơn vị và trạng thái? |
| Dự đoán | Đúng trước khi chạy, hay chỉ nhận ra sau khi xem? |
| Sửa lỗi | Tự sửa / đọc lại ví dụ / cần người hướng dẫn? Lỗi cụ thể là gì? |
| Bổ trợ | Có tìm được, hiểu ví dụ và trở lại đúng chỗ? |
| Vận dụng | Tự giải được dữ liệu mới? Có giải thích được vì sao? |
| Tiếp tục | Tải lại có làm mất vị trí hoặc nội dung đang nhập? |
| Tải nhận thức | Thuật ngữ hoặc phần code nào xuất hiện quá sớm? |

Ưu tiên sửa những chỗ cùng gây vướng cho nhiều người. Học thử thất bại ở một khái niệm cần xem lại cách giải thích, ví dụ và tiên quyết; thêm hiệu ứng không tự giải quyết vấn đề đó.
