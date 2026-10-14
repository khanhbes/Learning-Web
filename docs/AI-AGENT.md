# Khóa AI Agent

Khóa `agent` có **24 buổi bắt buộc** (21 buổi học và kiểm tra ở buổi8/16/24), **8 buổi mở rộng** và bài cuối khóa “Trạm trợ lý thư viện an toàn”. Python chạy bằng runner `ml-python` hiện có. Không cần API key, mạng hoặc model để làm/chấm bài; Gemini vẫn chỉ trợ giảng theo cài đặt nền tảng.

## Tài liệu và nhãn nguồn

Đã đọc trực quan toàn bộ **8 ảnh** trong `study documents/AI Agent/`: tổng quan, simple reflex, model-based reflex, goal-based, utility-based, learning, multi-agent và hierarchical. [Danh mục](../content/agent/sources.json) ghi mã ảnh, SHA-256, thứ tự logic, URL ảnh gốc và ánh xạ buổi/ôn/phỏng vấn. Chạy `node content/agent/generate-catalog.mjs` để tái lập danh mục; script từ chối nếu có ảnh ngoài danh mục.

Nội dung phân loại lấy từ ảnh. Ví dụ Python, bài code, robot dọn phòng, bản đồ, bảng utility và bài tập đánh giá là **bổ sung đã kiểm chứng**. Buổi17–24 bổ sung workflow/LLM, schema, tool policy, retrieval, context, giới hạn vòng và evaluation. LLM không thay thế phần agent cổ điển; mô phỏng không phải lời giải suy nghĩ ẩn của model.

## Hiệu đính

| Mã | Điểm hiệu đính |
|---|---|
| AGENT-E01 | Agent không bắt buộc dùng LLM; sơ đồ tổng quan là ví dụ kiến trúc. |
| AGENT-E02 | Đèn chạy chu kỳ cố định cần mô tả percept/pha thời gian; ví dụ reflex khóa dùng cảm biến pin/bụi. |
| AGENT-E03 | Lưu chat không đồng nghĩa huấn luyện; chatbot chỉ học nếu có cơ chế cập nhật được thiết kế. |
| AGENT-E04 | MAS có thể có coordinator; bullet phi tập trung không mô tả mọi MAS và không khớp hình nguồn. |
| AGENT-E05 | Nhiều agent chưa tự đảm bảo chịu lỗi; cần cơ chế phát hiện, giới hạn thử lại và xử lý tác động trùng. |
| AGENT-E06 | Phân cấp chia trách nhiệm, vẫn có chi phí phối hợp và nút nghẽn. |
| AGENT-E07 | Bổ sung policy bên ngoài model và phê duyệt gắn call cụ thể. |
| AGENT-E08 | Utility tối ưu theo tập lựa chọn/mô hình, không bảo đảm tốt nhất đời thực. |

Đối chiếu khái niệm với [chương Intelligent Agents của tác giả AIMA](https://aima.cs.berkeley.edu/4th-ed/pdfs/newchap02.pdf); kiến trúc workflow/agent với [Anthropic Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents); kiểm quyền công cụ với [OWASP AI Agent Security](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html). Các nguồn giúp kiểm chứng và bổ sung, không được ghi thành ảnh người học đã cung cấp.

## Lộ trình

| Buổi | Nội dung |
|---|---|
|1–2|Percept/action, agent cổ điển và Python list/dict/None|
|3–5|Reflex, partial observation, state update giữ false/0|
|6–7|Goal planning bằng BFS và utility có trọng số|
|8|Kiểm tra cảm biến/bộ nhớ/goal|
|9–10|Learning element, critic, mean reward, exploration/holdout|
|11–13|MAS, routing, kỹ năng, tải và phá hòa|
|14–15|Hierarchy, tổng hợp trạng thái hậu thứ tự và truyền lỗi|
|16|Kiểm tra learning/hierarchy|
|17–19|Workflow/LLM bổ sung, tool schema và authorization ngoài model|
|20–23|Retrieval từ khóa, context budget, bounded loop, bảng lỗi|
|24|Kiểm tra policy/tiên quyết và chuẩn bị cuối khóa|
|25–32|Proactive/DAG, expected utility, holdout, phiếu đa số, retry, TTL, retrieval recall và handoff|

Mỗi buổi có7block (phần sâu/code mở gọn), một mô phỏng có trạng thái kiểm chứng,8hoạt động dạng lựa chọn/ghép/xếp/thực hiện truy vết và Python bắt buộc. Buổi thường cần4/5câu và code đạt; checkpoint cần8/10và cả2code đạt. Bài mở rộng không quyết định hoàn thành.

## Hợp đồng mô phỏng và chấm

`traceFor(problemId,input)` trả `{kind:'agent',mode,input,frames,result,notice}`. Frame có `label,activeNode,nodes,edges,entries`; dữ liệu chuyên biệt gồm bản đồ/visited/path, memory, utility scores, workers/assignments, hierarchy/statuses, tool decisions, docs/token score, context budget, confusion matrix và giới hạn bước. Mọi giá trị được tính từ fixture; thao tác đổi seed không gọi cloud.

**22 mẫu bài Python** có đặc tả kiểu/thứ tự/ngưỡng/hòa/rỗng rõ, hai mẫu công khai, test biên và dữ liệu theo seed. Checker Node ở ngoài chương trình người học. Nó không tin `pass:true`, không so sourcecode và chấp nhận mọi đường BFS ngắn nhất hợp lệ. Integer/boolean/ID đòi đúng kiểu; metric phân số có dung sai `1e-8 + 1e-7×|expected|`. Key object có thể đổi thứ tự; shape/keys thừa hoặc thiếu bị từ chối. Bài số liệu nguyên dùng đối chiếu chính xác.

Ngân hàng hữu hạn; một số kiểu hình phân cấp chỉ có số trạng thái hữu hạn. Không hứa mỗi lần tạo một dạng chưa gặp. Seed cùng version cố định bản nháp. Các “tools” chỉ là dữ liệu: không thực thi shell, gửi mạng, dùng API key hoặc đọc filesystem ứng dụng.

## Cuối khóa và luyện thêm

Ba chức năng:

1. `agent-dependencies`: lập thứ tự tiên quyết, nhỏ nhất ASCII trong các task sẵn sàng; phát hiện chu trình.
2. `agent-policy`: tool tồn tại → scope hợp lệ → approval callID khi risky; approval không vượt scope.
3. `agent-evaluate`: đếmTP/FP/FN/TN, precision/recall và chia0an toàn. Nhãn expected lấy từ policy, actual là nhật ký giả lập có lỗi cố ý.

Rubric60code+20truy vết+10điều kiện/complexity+10test bắt lỗi mẫu. Pass≥80, ba chức năng code đạt và đủ năm phần luận. Điểm xác nhận các kỹ năng theo hợp đồng, không đánh giá khách quan toàn bộ lập luận tự do hoặc hứa agent an toàn mọi miền. Phản hồi Gemini không sửa điểm.

Trang mẹo/phỏng vấn thêm16mẹo và24chủ đề, tham chiếu đúng nguồn/buổi. Backend hiện có sinh biến thể, chấm khách quan, lịch ôn và giới hạn gem/XP chung các khóa.

## Kiểm chứng

Chạy `node --test tests/agent-content.test.mjs`. Suite kiểm toàn bộ ảnh/hash/ánh xạ, 200seed cho từng mẫu (4.400fixture sinh +biên), đối chiếu Python độc lập, 6.400lượt hoạt động, toàn bộ đồ thị nhỏ3node cho BFS/tiên quyết, thứ tự policy và biên chấm80%, cấu trúc output, frame và test lỗi mẫu. Chỉ lời giải tham chiếu do repository viết được chạy trên Python host trong suite; code người học luôn dùng runner cách ly.

Kiểm runner Pyodide thực, API/migration/UI và bảo toàn hồ sơ được thực hiện qua gate tích hợp của ứng dụng; báo cáo tổng hợp ghi đúng kết quả đã chạy, không thay bằng kiểm thuật toán đơn vị.
