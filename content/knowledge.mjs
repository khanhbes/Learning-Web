import { random, int, shuffle } from "../shared/random.mjs";
import { readFileSync } from "node:fs";
import { lessons as dsaLessons } from "./curriculum.mjs";
import { getCourse } from "./registry.mjs";
import { knowledgeTipRows as daTipRows,knowledgeInterviewRows as daRows,knowledgeLessonIds as daLessonIds } from "./da/knowledge.mjs";
import { knowledgeTipRows as gitTipRows,knowledgeInterviewRows as gitRows } from "./git/knowledge.mjs";

export const KNOWLEDGE_VERSION = "knowledge-2026.10-v1";
const dsaSources = JSON.parse(readFileSync(new URL("./sources.json", import.meta.url), "utf8"));
const sourceId = (courseId, prefix) => getCourse(courseId).sources.find(s=>s.prefix===prefix)?.id??`${courseId.toUpperCase()}-${prefix}`;
// Each row: stable skill, title, precise prompt, correct answer, three plausible
// mistakes, explanation, source prefix. Essay text is practice, never scored.
const dsaRows = [
  ["two-sum", "Two Sum", "Để tránh dùng một phần tử hai lần, khi quét mảng bạn cần làm gì?", "Tìm phần bù trong các phần tử đã đi qua rồi mới thêm phần tử hiện tại", "Thêm hiện tại trước rồi luôn trả về chỉ số tìm thấy", "Chỉ so sánh hai phần tử liền nhau", "Sắp xếp rồi trả chỉ số của mảng đã sắp", "Tra cứu trước khi chèn giữ hai chỉ số khác nhau; chỉ số phải thuộc mảng ban đầu.", "775448175"],
  ["stock", "Mua và bán cổ phiếu", "Chỉ mua một lần, bán sau mua. Khi quét giá từ trái sang phải cần giữ gì?", "Giá nhỏ nhất đã gặp và lợi nhuận tốt nhất", "Giá lớn nhất toàn mảng rồi mua ở cuối", "Tổng tất cả chênh lệch dương", "Hai giá ở đầu và cuối", "Giá thấp nhất trước hôm bán đảm bảo đúng thứ tự thời gian; tổng chênh lệch dương giải bài nhiều giao dịch.", "775448175"],
  ["duplicate", "Contains Duplicate", "Với HashSet, khi nào phát hiện một giá trị trùng?", "Khi giá trị hiện tại đã có trong tập", "Khi giá trị lớn hơn chỉ số", "Khi hai phần tử bất kỳ có cùng chỉ số", "Khi tập rỗng", "Tập lưu các giá trị đã thấy. Tra cứu trung bình O(1), không hứa O(1) cho mọi cách triển khai.", "775448175"],
  ["product", "Product Except Self", "Cách prefix/suffix product xử lý mảng có số 0 mà không chia là gì?", "Nhân tích bên trái và bên phải của từng vị trí", "Chia tích cả mảng cho từng phần tử", "Bỏ mọi số 0 trước khi tính", "Thay mọi số 0 bằng 1", "Mỗi tích bỏ đúng vị trí đang xét. Cách này vẫn đúng khi có một hoặc nhiều số 0.", "776222353"],
  ["kadane", "Maximum Subarray", "Với mảng không rỗng có toàn số âm, Kadane phải khởi tạo thế nào?", "Khởi tạo tổng hiện tại và tốt nhất bằng phần tử đầu", "Khởi tạo tốt nhất bằng 0 và không đổi", "Bỏ tất cả số âm", "Khởi tạo tốt nhất bằng độ dài mảng", "Bài yêu cầu đoạn không rỗng; khởi tạo 0 sẽ trả sai cho mảng toàn âm.", "776222353"],
  ["merge-array", "Trộn hai mảng đã sắp", "Khi trộn vào mảng thứ nhất có vùng trống ở cuối, nên ghi từ đâu?", "Từ cuối để không ghi đè phần tử chưa đọc", "Từ đầu và ghi đè ngay", "Từ giữa rồi xóa nửa còn lại", "Vào vị trí ngẫu nhiên", "Ba con trỏ đi từ cuối tận dụng vùng trống và giữ nguyên phần tử cần đọc.", "776222353"],
  ["anagram", "Valid Anagram", "Để kiểm tra hai chuỗi là hoán vị của nhau cần so sánh gì?", "Tần suất mỗi ký tự và cùng tổng số ký tự", "Chỉ ký tự đầu và cuối", "Chỉ độ dài", "Thứ tự ký tự phải giống hoàn toàn", "Tần suất mô tả số lượng từng ký tự; chuẩn hóa Unicode là yêu cầu riêng cần ghi rõ nếu áp dụng.", "776040542"],
  ["substring", "Chuỗi không lặp dài nhất", "Trong cửa sổ không lặp, khi gặp ký tự đã có trong cửa sổ cần làm gì?", "Dịch đầu trái qua lần xuất hiện trước nhưng không dịch lùi", "Luôn đặt đầu trái về 0", "Dừng thuật toán ngay", "Tăng độ dài cửa sổ mà không kiểm tra", "max(left, lastIndex + 1) tránh kéo đầu trái lùi về một lần xuất hiện ngoài cửa sổ.", "776040542"],
  ["replacement", "Character Replacement", "Khi được đổi tối đa k ký tự, cửa sổ hợp lệ nếu điều kiện nào đúng?", "Độ dài cửa sổ trừ tần suất ký tự nhiều nhất không vượt k", "Độ dài cửa sổ luôn bằng k", "Mọi ký tự trong chuỗi đã giống nhau", "Số ký tự khác nhau luôn bằng k", "Phần còn lại ngoài nhóm xuất hiện nhiều nhất chính là số lần đổi cần thiết.", "776040542"],
  ["binary", "Binary Search", "Điều kiện nào của dữ liệu cho phép tìm kiếm nhị phân theo thứ tự tăng?", "Mảng đã sắp tăng hoặc một vị từ có tính đơn điệu", "Mảng ngẫu nhiên bất kỳ", "Mọi phần tử phải khác nhau trong mọi biến thể", "Mảng chỉ được chứa số dương", "Mỗi bước phải loại được nửa không chứa đáp án dựa trên thứ tự hoặc vị từ đơn điệu.", "778972158"],
  ["rotated", "Tìm trong mảng xoay", "Với mảng tăng, xoay và không trùng, vì sao có thể bỏ một nửa?", "Ít nhất một nửa được sắp tăng và có thể kiểm tra khoảng chứa mục tiêu", "Vì mọi phần tử bên trái đều nhỏ hơn bên phải", "Vì vị trí xoay luôn ở giữa", "Vì phần tử đầu luôn nhỏ nhất", "Nếu cho phép trùng, một số trường hợp phải thu hẹp một bước và có thể xuống O(n).", "778972158"],
  ["bad-version", "First Bad Version", "Để tìm lỗi đầu tiên bằng binary search, predicate cần dạng nào?", "Một đoạn tốt rồi một đoạn lỗi, không quay lại tốt", "Tốt và lỗi xen kẽ tùy ý", "Tất cả phiên bản đều phải lỗi", "Chỉ phiên bản giữa mới được lỗi", "Đây là tìm vị trí chuyển của predicate đơn điệu. Phải định nghĩa kết quả nếu không có lỗi.", "778972158"],
  ["reverse-list", "Đảo linked list", "Trước khi đổi current.next sang prev, cần lưu gì?", "Node next cũ để còn đi tiếp", "Chỉ giá trị current", "Chỉ số node cuối", "Không cần giữ tham chiếu nào", "Nếu không lưu next cũ, phần chưa xử lý bị mất liên kết truy cập.", "776100851"],
  ["merge-list", "Trộn linked list", "Khi chọn node nhỏ hơn từ hai danh sách đã sắp, thao tác đúng là gì?", "Nối node vào đuôi kết quả rồi tiến con trỏ của danh sách vừa chọn", "Tiến cả hai con trỏ dù chỉ lấy một node", "Chỉ lấy từ danh sách thứ nhất", "Nối node nhưng không tiến con trỏ", "Mỗi node được nối đúng một lần. Khi một danh sách hết, nối phần còn lại.", "776100851"],
  ["list-cycle", "Linked List Cycle", "Trong Floyd, kết luận có chu trình khi nào?", "Hai con trỏ chậm và nhanh gặp cùng node sau khi di chuyển", "Hai node bất kỳ có cùng giá trị", "Con trỏ nhanh chạm null", "Danh sách có nhiều hơn hai node", "So sánh định danh node, không phải giá trị. Chạm null nghĩa là không có chu trình.", "776100851"],
  ["parentheses", "Valid Parentheses", "Khi đọc dấu đóng, điều kiện để hợp lệ là gì?", "Stack không rỗng và dấu mở trên đỉnh khớp loại", "Chỉ cần tổng số dấu mở bằng dấu đóng", "Chỉ cần ký tự đầu là dấu mở", "Dấu đóng luôn được bỏ qua", "Stack bảo toàn thứ tự lồng nhau; cuối chuỗi stack cũng phải rỗng.", "774680448"],
  ["min-stack", "Min Stack", "Để pop đúng khi có nhiều giá trị nhỏ nhất bằng nhau, nên làm gì?", "Lưu min theo từng độ sâu hoặc đếm đủ các min trùng", "Chỉ nhớ một giá trị min toàn cục", "Xóa mọi min trùng ngay khi push", "Tính min bằng giá trị top", "Metadata min gắn với trạng thái stack giúp khôi phục min cũ khi pop.", "774680448"],
  ["temperatures", "Daily Temperatures", "Stack đơn điệu thường lưu gì để tính số ngày chờ?", "Chỉ số của các ngày chưa tìm được ngày ấm hơn", "Chỉ nhiệt độ mà không có chỉ số", "Tất cả nhiệt độ đã tăng dần vĩnh viễn", "Kết quả cuối không cần xử lý ngày còn lại", "Chỉ số cho phép tính khoảng cách ngày. Nhiệt độ bằng nhau chưa phải ấm hơn.", "774680448"],
  ["depth", "Độ sâu cây", "Với độ sâu tính bằng số node, cây rỗng có độ sâu bao nhiêu?", "0", "1", "-1 trong mọi định nghĩa", "Bằng số cạnh của node gốc", "Định nghĩa thống nhất: depth(null)=0 và depth(node)=1+max(depth(left),depth(right)).", "775868873"],
  ["invert", "Invert Binary Tree", "Đảo cây nhị phân cần thao tác nào?", "Hoán đổi nhánh trái/phải tại mọi node", "Chỉ hoán đổi hai nhánh của gốc", "Sắp xếp mọi giá trị tăng dần", "Xóa các lá bên phải", "Có thể DFS hoặc BFS, nhưng phải thăm đủ mọi node.", "775868873"],
  ["lca", "Tổ tiên chung gần nhất", "LCA của một node và hậu duệ của nó là gì?", "Chính node tổ tiên đó", "Luôn là gốc", "Luôn là node con trực tiếp", "Không tồn tại vì một node không là tổ tiên của chính nó", "Trong định nghĩa phổ biến, một node là tổ tiên của chính nó. Đề phải ghi rõ định nghĩa và sự tồn tại của hai node.", "775868873"],
  ["diameter", "Đường kính cây", "Nếu đường đi dài nhất gồm 6 node, đường kính tính theo cạnh là bao nhiêu?", "5", "6", "4", "12", "Đường đi k node có k−1 cạnh. Ảnh nguồn có ví dụ 5 cạnh nhưng ghi 4; khóa đã hiệu đính.", "773952020"],
  ["same-tree", "Same Tree", "Hai cây được coi là giống nhau khi nào?", "Cùng cấu trúc và cùng giá trị tại từng vị trí", "Chỉ cùng số node", "Chỉ cùng các giá trị sau khi sắp", "Chỉ cùng node gốc", "Phải kiểm tra cả null và hai nhánh tương ứng, không chỉ tập giá trị.", "773952020"],
  ["codec", "Mã hóa và giải mã cây", "Vì sao preorder thường cần ký hiệu null trong mã hóa cây?", "Để phân biệt cấu trúc khi một nhánh thiếu", "Để giảm mọi dữ liệu xuống một ký tự", "Vì giá trị node không bao giờ trùng", "Vì chỉ cần lưu độ sâu", "Các cây khác cấu trúc có thể có cùng thứ tự giá trị; null giữ hình dạng để khôi phục.", "773952020"],
  ["islands", "Number of Islands", "Với định nghĩa liên thông 4 hướng, hai ô đất chỉ chạm ở góc có cùng đảo không?", "Không", "Có trong mọi bài", "Có nếu cùng giá trị 1", "Không thể kiểm tra bằng BFS", "Chỉ đi lên/xuống/trái/phải. Bài có liên thông 8 hướng phải quy định riêng.", "774236902"],
  ["clone", "Clone Graph", "Để sao chép đồ thị có chu trình và không tạo node lặp, cần gì?", "Ánh xạ node gốc sang node bản sao, đăng ký trước khi duyệt hàng xóm", "Chỉ sao chép giá trị node gốc", "Không cần visited vì đệ quy sẽ tự dừng", "Dùng giá trị node làm ID dù giá trị có thể trùng", "Ánh xạ theo định danh node chặn chu trình và bảo toàn chia sẻ liên kết.", "774236902"],
  ["graph-cycle", "Chu trình đồ thị có hướng", "Trong DFS, cạnh tới node nào chứng tỏ chu trình có hướng?", "Node đang ở trên stack đệ quy hiện tại", "Bất kỳ node đã hoàn tất ở nhánh khác", "Node chưa từng thăm", "Node có bậc ra bằng 0", "Phải phân biệt đang xử lý và đã hoàn tất; visited đơn lẻ không đủ.", "774236902"],
  ["fib", "Fibonacci", "Memoization giảm tính lặp Fibonacci nhờ điều gì?", "Lưu kết quả của mỗi trạng thái đã tính", "Bỏ qua điều kiện dừng", "Tăng số nhánh đệ quy", "Tính lại mọi trạng thái để đảm bảo chính xác", "Mỗi n được giải một lần: O(n) phép chuyển; số nguyên lớn có chi phí phụ thuộc số bit.", "778173128"],
  ["knapsack", "0/1 Knapsack", "Với DP một chiều 0/1 knapsack, tại mỗi vật nên duyệt sức chứa theo hướng nào?", "Giảm dần để không dùng lại cùng vật", "Tăng dần để dùng cùng vật nhiều lần", "Bất kỳ thứ tự đều giống nhau", "Chỉ xét sức chứa bằng 0", "Duyệt tăng có thể dùng trạng thái vừa cập nhật của cùng vật, biến bài thành unbounded knapsack.", "778173128"],
  ["lcs", "Longest Common Subsequence", "Subsequence khác substring ở điểm nào?", "Có thể không liên tiếp nhưng phải giữ thứ tự", "Luôn phải liên tiếp", "Được đảo thứ tự ký tự tùy ý", "Không được bỏ ký tự nào", "LCS dùng lựa chọn bỏ một ký tự ở một trong hai chuỗi; không yêu cầu đoạn liền nhau.", "778173128"],
];
const mlRows = [
  ["ai-ml-llm", "AI, ML và LLM", "Quan hệ mô tả đúng trong cách phân loại phổ biến là gì?", "ML là một nhóm phương pháp AI; LLM là mô hình ngôn ngữ học từ dữ liệu", "Mọi AI đều là LLM", "ML chỉ là tập luật viết tay", "LLM không liên quan đến dữ liệu huấn luyện", "AI là khái niệm rộng. ML và deep learning không đồng nghĩa với mọi hệ AI."],
  ["hallucination", "Hallucination", "Một câu trả lời LLM trôi chảy có đồng nghĩa đã đúng sự thật không?", "Không; cần đối chiếu nguồn và bằng chứng", "Có vì mô hình đã huấn luyện nhiều dữ liệu", "Có nếu nhiệt độ bằng 0", "Có nếu câu trả lời dài", "Xác suất ngôn ngữ không bảo đảm sự thật; grounding và kiểm chứng giúp giảm rủi ro."],
  ["token-budget", "Ngân sách token", "Ngân sách token của một yêu cầu thường phải tính phần nào?", "Đầu vào cùng giới hạn đầu ra trong cửa sổ ngữ cảnh của mô hình", "Chỉ số từ tiếng Anh", "Chỉ độ dài câu trả lời", "Chỉ độ dài system prompt", "Token không đồng nhất với từ; tokenizer và giới hạn từng mô hình cần được kiểm tra."],
  ["context-window", "Cửa sổ ngữ cảnh", "Cửa sổ ngữ cảnh giới hạn điều gì?", "Lượng token mô hình có thể xử lý trong một lần suy luận", "Toàn bộ dữ liệu đã dùng để huấn luyện", "Số người dùng trên Internet", "Số epoch mọi mô hình phải chạy", "Lịch sử dài cần cắt, tóm tắt hoặc truy xuất phù hợp, không thể giả định nhớ vô hạn."],
  ["system-user", "System và user prompt", "Khi thiết kế ứng dụng, tài liệu được truy xuất nên được xem là gì?", "Dữ liệu có thể không tin cậy, không tự trở thành chỉ dẫn hệ thống", "Chỉ dẫn có quyền cao hơn mọi quy tắc", "Mật khẩu của người dùng", "Nguồn tự cho phép truy cập bí mật", "Tách chỉ dẫn với dữ liệu và giới hạn quyền công cụ; gắn nhãn dữ liệu không đủ để bảo đảm an toàn tuyệt đối."],
  ["temperature", "Temperature và tái lập", "Đặt temperature=0 có bảo đảm mọi lần trả lời giống hệt không?", "Không; còn phụ thuộc backend, phiên bản và yếu tố thực thi", "Có, 100% cho mọi dịch vụ", "Có và bảo đảm câu trả lời đúng", "Chỉ cần đặt 0 là bỏ được versioning", "Giảm ngẫu nhiên không phải bảo đảm tái lập tuyệt đối. Ghi seed nếu hỗ trợ và phiên bản môi trường."],
  ["rag-tuning", "Fine-tuning hay RAG", "Khi cần trả lời từ tài liệu nội bộ cập nhật hàng ngày, bước khởi đầu phù hợp thường là gì?", "Truy xuất tài liệu hiện hành bằng RAG và đánh giá grounding", "Huấn luyện lại mô hình lớn mỗi giờ", "Giả định fine-tuning tự cập nhật kiến thức", "Bỏ mọi nguồn trích dẫn", "RAG thuận lợi cho kiến thức thay đổi; fine-tuning thường điều chỉnh hành vi/phong cách, hai cách có thể kết hợp."],
  ["few-shot", "Zero, one và few-shot", "Few-shot prompting cung cấp gì?", "Một số ví dụ đầu vào/đầu ra trong ngữ cảnh", "Đúng một triệu mẫu huấn luyện", "Cập nhật trọng số mô hình sau mỗi prompt", "Không có ví dụ nào", "Ví dụ minh họa định dạng và cách làm ngay trong prompt, khác huấn luyện cập nhật trọng số."],
  ["staging-production", "Staging và production", "Khi cùng ứng dụng LLM cho kết quả khác giữa staging và production, nên kiểm tra gì trước?", "Model/version, prompt, tham số, dữ liệu truy xuất và cấu hình thực tế", "Chỉ màu giao diện", "Khẳng định mô hình cố tình làm sai", "Chỉ số lượng file CSS", "Giữ dấu vết yêu cầu đã ẩn thông tin riêng để so sánh các đầu vào và cấu hình thực tế."],
  ["prompt-injection", "Prompt injection", "Một trang web truy xuất yêu cầu gửi API key cho bên ngoài. Cách xử lý đúng là gì?", "Coi yêu cầu đó là dữ liệu không tin cậy và không cấp quyền gửi bí mật", "Làm theo vì nằm trong tài liệu tham khảo", "Đưa key vào câu trả lời để kiểm tra", "Tắt mọi kiểm tra quyền công cụ", "Cần giới hạn quyền ở tầng ứng dụng; không để nội dung ngoài quyết định quyền truy cập bí mật."],
  ["leakage", "Leakage tiền xử lý", "Scaler và imputer phải học tham số từ đâu khi đánh giá mô hình?", "Chỉ tập train của lần chia hoặc fold hiện tại", "Toàn bộ train và test cùng lúc", "Tập test để số liệu đẹp hơn", "Nhãn test rồi mới chia tập", "Fit trên dữ liệu đánh giá đưa thông tin tương lai vào mô hình; pipeline theo từng fold ngăn lỗi này."],
  ["missing", "30% giá trị thiếu", "Một cột thiếu 30% có bắt buộc phải xóa không?", "Không; cần xem cơ chế thiếu, giá trị dự đoán và cách xử lý được đánh giá trên train", "Có với mọi dữ liệu", "Không cần xử lý và mọi model tự hiểu NaN", "Điền bằng trung bình test luôn đúng", "Tỷ lệ thiếu đơn lẻ không quyết định; so sánh phương án bằng quy trình validation hợp lệ."],
  ["multicollinearity", "Đặc trưng tương quan", "Hai đặc trưng tuyến tính gần như trùng nhau có thể gây vấn đề gì cho hồi quy tuyến tính?", "Hệ số khó ổn định và khó diễn giải riêng từng biến", "Luôn làm accuracy bằng 0", "Chứng minh quan hệ nhân quả", "Bảo đảm không overfit", "Tương quan giữa các cột ảnh hưởng hệ số và suy luận; regularization hoặc chọn đặc trưng có thể hữu ích."],
  ["feature-vs-model", "Đặc trưng hay model phức tạp", "Trước khi tăng độ phức tạp model, nên ưu tiên kiểm tra gì?", "Baseline, chất lượng dữ liệu, leakage và đặc trưng phù hợp", "Chỉ tăng số tham số", "Chỉ tăng epoch vô hạn", "Bỏ validation để train nhanh", "Một baseline rõ ràng giúp biết cải tiến có thật; model phức tạp không sửa mọi lỗi dữ liệu."],
  ["unknown-category", "Danh mục mới", "Khi production có danh mục chưa thấy ở train, encoder nên được thiết kế thế nào?", "Có quy tắc unknown rõ ràng và giữ nhất quán mapping đã fit", "Fit lại trên từng mẫu mới rồi dùng model cũ", "Gán ngẫu nhiên mã mới mỗi lần", "Xóa mọi mẫu mới mà không ghi nhận", "Unknown cần policy, ví dụ nhóm khác hoặc handle_unknown phù hợp; schema train/inference phải nhất quán."],
  ["complexity", "Độ phức tạp và overfit", "Train score rất cao nhưng validation thấp thường gợi ý điều gì?", "Có thể overfit; cần kiểm tra split, leakage và chênh lệch dữ liệu", "Chắc chắn mô hình hoàn hảo", "Chắc chắn thiếu tham số", "Không cần xem tập đánh giá", "Khoảng cách train/validation là tín hiệu chẩn đoán, không đủ tự chứng minh một nguyên nhân duy nhất."],
  ["regularization", "Regularization", "Ridge thêm thành phần nào vào hàm mục tiêu hồi quy?", "Phạt bình phương độ lớn hệ số", "Phạt số hàng của test", "Tối đa hóa MSE", "Bỏ hoàn toàn loss dữ liệu", "L2 co hệ số; mức phạt cần chọn bằng validation và scaling ảnh hưởng ý nghĩa hệ số."],
  ["random-forest", "Random Forest", "RandomForestClassifier của scikit-learn kết hợp dự đoán các cây bằng cách nào?", "Trung bình xác suất lớp rồi chọn lớp có xác suất trung bình lớn nhất", "Luôn bỏ phiếu cứng theo nhãn từng cây", "Chọn cây có ID nhỏ nhất", "Cộng các nhãn số nguyên rồi trả tổng", "Tài liệu nguồn giản lược thành majority vote; trong scikit-learn predict dựa trên trung bình predict_proba."],
  ["train-test-gap", "Train tăng, test giảm", "Khi chọn mô hình, nên dùng tập nào để điều chỉnh siêu tham số?", "Validation hoặc cross-validation; giữ test cho đánh giá cuối", "Test lặp lại đến khi đẹp", "Chỉ train", "Tập có đáp án được đưa vào feature", "Dùng test để chọn model khiến ước lượng cuối lạc quan; test không còn độc lập."],
  ["bias-variance", "Bias và variance", "Train và validation đều kém trong một baseline đơn giản gợi ý điều gì?", "Có thể underfit hoặc dữ liệu/đặc trưng chưa phù hợp", "Chắc chắn overfit nặng", "Chắc chắn test đã bị leakage", "Model đã tối ưu mọi mặt", "Bias/variance là khung suy nghĩ; cần learning curves và kiểm tra dữ liệu để kết luận cụ thể."],
  ["pipeline-consistency", "Pipeline train/inference", "Để inference nhất quán với train, phải dùng gì?", "Cùng pipeline và tham số tiền xử lý đã fit trên train", "Fit scaler mới trên một mẫu production", "Đảo thứ tự cột tùy ý", "Dùng encoding khác mà không train lại", "Lưu cả preprocessing và model; xác minh thứ tự cột, dtype và mapping."],
  ["drift", "Data drift", "Data drift mô tả điều gì?", "Phân phối dữ liệu đầu vào thay đổi theo thời gian", "Mọi model chắc chắn bị hacker", "Chỉ lỗi chính tả prompt", "Chắc chắn quan hệ X→y đã thay đổi", "Data drift và concept drift khác nhau; thay đổi input không tự chứng minh chất lượng giảm."],
  ["different-predictions", "Dự đoán khác khi deploy", "Bước hữu ích để debug một mẫu có dự đoán khác khi deploy là gì?", "So sánh từng bước preprocessing, schema, model và phiên bản thư viện", "Chỉ train thêm 100 epoch", "Giấu kết quả khác nhau", "Tăng threshold ngẫu nhiên", "Dùng mẫu cố định và log đã giảm thông tin riêng để xác định bước bắt đầu khác nhau."],
  ["reproducibility", "Tái lập thí nghiệm", "Để tăng khả năng tái lập, nên lưu bộ thông tin nào?", "Dữ liệu/version, split, seed, cấu hình, code và môi trường", "Chỉ accuracy cuối", "Chỉ tên người chạy", "Chỉ screenshot biểu đồ", "Seed là một phần; khác phiên bản thư viện hoặc phần cứng vẫn có thể ảnh hưởng số thực."],
  ["performance-drop", "Chất lượng giảm sau deploy", "Để kiểm tra chất lượng giảm, cần bằng chứng nào?", "Nhãn hoặc proxy đáng tin, dữ liệu/schema, drift và metric theo nhóm/thời gian", "Chỉ tổng số request", "Chỉ latency nhanh", "Chỉ độ tự tin của model", "Không suy ra accuracy từ confidence. Định nghĩa cửa sổ đo và chất lượng nhãn."],
  ["uncertainty", "LLM và bất định", "Yêu cầu LLM nói khi không chắc có bảo đảm hết câu sai không?", "Không; vẫn cần nguồn, kiểm tra và phương án từ chối phù hợp", "Có cho mọi model", "Có nếu prompt đủ dài", "Có vì model tự biết mọi lỗi", "Hướng dẫn tự nêu bất định có ích nhưng không phải checker sự thật."],
  ["distance", "Cosine và Euclidean", "Cosine similarity chủ yếu phản ánh điều gì?", "Góc giữa hai vector khác zero", "Độ dài tuyệt đối của mỗi vector", "Số hàng trong dataset", "Nhãn của vector", "Euclidean đo khoảng cách; khi vector chuẩn hóa đơn vị hai thước đo liên hệ chặt. Phải xử lý vector zero rõ ràng."],
  ["context-overflow", "Ngữ cảnh quá dài", "Khi tài liệu vượt context window, phương án phù hợp là gì?", "Truy xuất phần liên quan, tóm tắt có kiểm tra hoặc chia việc", "Giả định API tự nhớ phần bị cắt", "Đưa thêm mọi lịch sử để giải quyết", "Xóa câu hỏi và giữ tài liệu", "Đo ngân sách token trước; giảm nội dung phải giữ thông tin cần trả lời và nguồn truy vết."],
  ["caching", "Cache và độ trễ", "Cache câu trả lời cần chú ý yếu tố nào?", "Khóa cache, version dữ liệu/prompt/model, riêng tư và hạn sử dụng", "Chỉ dùng câu hỏi làm khóa cho mọi người", "Không bao giờ hết hạn", "Chia sẻ dữ liệu riêng qua cache toàn cục", "Cache có thể giảm latency/cost nhưng kết quả phụ thuộc ngữ cảnh và quyền truy cập."],
  ["privacy", "Riêng tư khi gọi API", "Trước khi gửi dữ liệu lên một API AI bên ngoài, cần làm gì?", "Xác định quyền, tối thiểu hóa dữ liệu và kiểm tra chính sách xử lý dữ liệu", "Gửi nguyên mọi dữ liệu và key", "Ẩn tên là bảo đảm ẩn danh tuyệt đối", "Cho rằng Free Tier không xử lý dữ liệu", "Không nhầm free với private; xem điều khoản hiện hành và mục đích gửi dữ liệu."],
  ["sft-rlhf", "SFT và RLHF", "Điểm khác cơ bản của SFT và RLHF là gì?", "SFT học từ cặp ví dụ; RLHF dùng tín hiệu ưu tiên/phản hồi để tối ưu hành vi", "SFT không cập nhật trọng số", "RLHF chỉ là tìm kiếm văn bản", "Hai thuật ngữ luôn chỉ cùng một bước", "Các pipeline có thể kết hợp nhiều giai đoạn. RLHF không tự bảo đảm mọi trả lời đúng."],
  ["guardrails", "Guardrails", "Guardrail nên được bố trí ở đâu trong ứng dụng AI có công cụ?", "Nhiều tầng: xác thực, quyền công cụ, kiểm tra input/output và giám sát", "Chỉ một câu nhắc trong prompt", "Chỉ đổi màu nút", "Cho model tự cấp mọi quyền", "Quyền thật cần kiểm soát ở ứng dụng; model output không phải bằng chứng tự cho phép hành động."],
  ["llm-eval", "Đánh giá LLM", "Với câu trả lời mở, cách đánh giá đáng tin hơn là gì?", "Rubric rõ, tập tình huống đại diện, kiểm tra khách quan khi có và đánh giá người phù hợp", "Chỉ một câu hỏi duy nhất", "Chỉ số lượng từ", "AI tự chấm luôn đúng tuyệt đối", "Phân biệt kiểm chứng sự thật, format, chất lượng và an toàn; grader AI cũng cần đánh giá độ tin cậy."],
  ["latency-throughput", "Latency và throughput", "Latency và throughput khác nhau thế nào?", "Latency là thời gian một yêu cầu; throughput là số yêu cầu/token xử lý trên đơn vị thời gian", "Hai số luôn bằng nhau", "Latency là số người dùng", "Throughput là độ chính xác", "Batching có thể tăng throughput nhưng làm latency chờ của từng yêu cầu tăng."],
  ["product-ai", "PM yêu cầu thêm AI", "Câu hỏi mở đầu hữu ích nhất khi được yêu cầu thêm AI là gì?", "Người dùng cần giải quyết việc gì, đo thành công thế nào và có dữ liệu/ràng buộc nào?", "Dùng model lớn nhất ngay", "Mua GPU trước khi xác định mục tiêu", "Bỏ yêu cầu riêng tư vì AI", "Chọn giải pháp từ vấn đề và baseline; xác định chi phí, latency, riêng tư và cách đánh giá trước."],
];
const mlPrefixes = ["825567823", "825268151", "825273896", "823562989", "821665106", "820935142", "819470891"];
const dsaTipRows = [
  ["indices", "Phân biệt chỉ số và giá trị", "Mảng [8,2,5] có nums[1] bằng bao nhiêu?", "2", "1", "8", "5", "Python và C++ đánh chỉ số từ 0: chỉ số 1 trỏ tới phần tử thứ hai.", "788218288"],
  ["empty", "Thử trường hợp rỗng", "Bài tính tổng mảng cho phép mảng rỗng nên trả gì?", "0", "null trong mọi đặc tả", "1", "Phần tử đầu tiên", "Phải theo đặc tả và xử lý trước khi đọc nums[0].", "788218288"],
  ["negative", "Thử số âm", "Bài tìm max mảng không rỗng vì sao không nên mặc định đáp án bằng 0?", "Mảng có thể toàn số âm", "Vì số âm không so sánh được", "Vì mảng phải sắp trước", "Vì 0 luôn là max", "Khởi tạo bằng một phần tử hợp lệ hoặc -∞.", "788218288"],
  ["bounds", "Big-O là chặn trên", "Big-O mô tả điều gì?", "Một chặn trên tiệm cận của hàm chi phí đã chọn", "Luôn chỉ trường hợp xấu nhất", "Luôn chỉ trường hợp trung bình", "Thời gian chính xác bằng mili giây", "Có thể mô tả chi phí tốt, trung bình hoặc xấu bằng O/Ω/Θ; phải nêu trường hợp đang xét.", "787959061"],
  ["half-open", "Dùng đoạn nửa mở", "Đoạn chỉ số [l,r) có độ dài bao nhiêu?", "r-l", "r-l+1", "l+r", "r", "Nửa mở không gồm r và r=l biểu diễn đoạn rỗng tự nhiên.", "788689477"],
  ["prefix", "Prefix sum thêm số 0", "Với prefix[0]=0, tổng đoạn inclusive [l,r] là gì?", "prefix[r+1]-prefix[l]", "prefix[r]-prefix[l]", "prefix[r+1]+prefix[l]", "prefix[l]-prefix[r+1]", "Prefix[k] là tổng k phần tử đầu. Thêm số 0 tránh phải tách l=0.", "785146756"],
  ["monotone", "Tìm vị từ đơn điệu", "Binary search trên đáp án hợp lệ khi predicate có đặc điểm nào?", "Chỉ đổi trạng thái một lần trong miền tìm kiếm", "Đổi đúng/sai xen kẽ tùy ý", "Luôn trả số ngẫu nhiên", "Phụ thuộc màu đồ thị", "Chọn hướng cập nhật bounds theo bên đúng/sai và kiểm tra điểm biên.", "787205013"],
  ["window", "Cửa sổ có điều kiện", "Với tổng đoạn ≤K, cách thu hẹp đơn giản khi tổng lớn có luôn đúng nếu có số âm không?", "Không; bỏ phần tử âm có thể làm tổng tăng", "Có với mọi số nguyên", "Có nếu mảng dài", "Chỉ cần tăng K", "Tính đơn điệu của thao tác thêm/bớt quyết định áp dụng sliding window; số âm có thể phá điều kiện.", "782184692"],
  ["visited", "Đánh dấu visited sớm", "Trong BFS, nên đánh dấu node khi nào để tránh enqueue lặp?", "Ngay khi đưa vào queue", "Chỉ sau khi queue rỗng", "Không cần visited với chu trình", "Khi gặp node lần thứ ba", "Đánh dấu khi phát hiện bảo đảm mỗi node được vào frontier một lần.", "788705001"],
  ["dijkstra", "Dijkstra cần trọng số không âm", "Dijkstra chuẩn bảo đảm đúng với điều kiện trọng số nào?", "Mọi trọng số cạnh không âm", "Mọi trọng số đều có thể âm", "Chỉ cần tổng trọng số dương", "Chỉ cần không có chu trình", "Cạnh âm có thể làm một node đã chốt có đường ngắn hơn về sau; cần thuật toán khác phù hợp.", "790003285"],
  ["stack", "Stack và queue", "Stack lấy phần tử nào trước?", "Phần tử được thêm sau cùng", "Phần tử được thêm đầu tiên", "Phần tử nhỏ nhất", "Phần tử ngẫu nhiên", "LIFO của stack khác FIFO của queue.", "788141632"],
  ["mutation", "Đọc dữ liệu bị đổi", "Đề yêu cầu giữ nguyên input. Khi thuật toán cần sort mảng, nên làm gì?", "Tạo bản sao rồi sort bản sao", "Sort input và khẳng định không đổi", "Xóa input", "Chỉ đổi tên biến để tạo bản sao sâu", "Cần hiểu alias/tham chiếu; đổi tên biến không tự sao chép nội dung.", "788218288"],
  ["recursion", "Đệ quy có điểm dừng", "Điều kiện thiết yếu để đệ quy hữu hạn là gì?", "Có base case và mỗi bước tiến tới nó", "Chỉ cần tên hàm khác", "Gọi lại với input giống hệt vô hạn", "Dùng hai câu print", "Theo dõi tham số giảm hoặc bài toán con nhỏ hơn và giới hạn stack.", "787178887"],
  ["memo", "State đủ thông tin", "Key memoization phải có gì?", "Tất cả phần trạng thái ảnh hưởng kết quả bài toán con", "Chỉ tham số đầu dù kết quả còn phụ thuộc tham số khác", "Một hằng số cho mọi trạng thái", "Màu màn hình", "Thiếu một chiều state có thể tái sử dụng nhầm kết quả.", "785035048"],
  ["overflow", "Kiểu số và overflow", "Trong C++ với số nguyên fixed-width, khi tính tổng lớn cần làm gì?", "Chọn kiểu đủ rộng và kiểm tra miền giá trị", "Cho rằng mọi int có độ lớn vô hạn", "Dùng char cho mọi tổng", "Python và C++ có cùng overflow", "Python int có độ dài tùy ý trong giới hạn bộ nhớ; signed overflow C++ là undefined behavior.", "790086654"],
  ["ties", "Ghi rõ đồng hạng", "Bài priority queue có công việc cùng mức ưu tiên nên quy định gì?", "Quy tắc tie-break rõ ràng như thứ tự đến", "Chấp nhận ngẫu nhiên nhưng vẫn đòi một đáp án duy nhất", "Luôn xóa công việc trùng", "Dùng tên màu làm thứ tự bí mật", "Đặc tả tie-break làm kết quả tái hiện được và checker công bằng.", "783608639"],
  ["topo", "Topo có nhiều nghiệm", "Nếu DAG có nhiều thứ tự topo hợp lệ, checker nên làm gì?", "Chấp nhận mọi hoán vị chứa đủ node và tôn trọng mọi cạnh", "Chỉ nhận thứ tự lời giải mẫu", "So code nguồn giống nhau", "Chỉ kiểm tra node đầu", "Kiểm chứng thuộc tính kết quả thay vì so một đáp án khi nghiệm không duy nhất.", "790003285"],
  ["invariant", "Dùng invariant", "Loop invariant giúp ích gì?", "Nêu tính chất được giữ qua từng bước để lập luận thuật toán đúng", "Chỉ giúp chạy nhanh hơn 100 lần", "Thay thế mọi test", "Cho phép bỏ điều kiện dừng", "Kiểm tra khởi tạo, duy trì và khi kết thúc; test bổ sung bằng chứng.", "785287985"],
  ["counterexample", "Tìm phản ví dụ nhỏ", "Khi nghi greedy sai, cách hữu ích là gì?", "Tìm input nhỏ và đối chiếu với vét cạn", "Chỉ thử một input đẹp", "Khẳng định đúng vì chạy nhanh", "Bỏ trường hợp biên", "Oracle độc lập trên miền nhỏ giúp tìm trường hợp lựa chọn cục bộ làm mất nghiệm tối ưu.", "787904001"],
  ["debug", "Debug từng bước", "Khi vòng lặp truy cập ngoài mảng, nên xem gì?", "Giới hạn chỉ số và giá trị ngay trước mỗi lần truy cập", "Chỉ giao diện editor", "Chỉ file nhạc", "Tăng kích thước mảng tùy ý để che lỗi", "Input ngắn, trace biến và invariant dễ tìm lỗi off-by-one.", "788218288"],
];
const mlTipRows = [
  ["baseline", "Bắt đầu bằng baseline", "Baseline hữu ích nhất để làm gì?", "Có mốc đơn giản để đánh giá cải tiến bằng cùng quy trình", "Bỏ đánh giá model", "Chứng minh mọi model phức tạp sai", "Thay test bằng train", "So các phương án trên cùng split/metric và ghi rõ giả định.", "841754926"],
  ["split", "Chia tập trước khi fit", "Trình tự tránh leakage là gì?", "Chia dữ liệu rồi fit preprocessing trên train", "Fit scaler toàn bộ rồi mới chia", "Dùng nhãn test để tạo feature", "Chỉ chuẩn hóa test", "Trong CV, mỗi fold cần fit tiền xử lý trên train fold riêng.", "840498749"],
  ["mean-median", "Mean và median", "Khi có một giá trị cực lớn, đại lượng nào thường ít bị kéo lệch hơn?", "Median", "Mean trong mọi bộ dữ liệu", "Tổng", "Giá trị cực đại", "Median phản ánh vị trí giữa; không có nghĩa outlier luôn phải bị xóa.", "806473750"],
  ["missing", "Thiếu cũng là thông tin", "Trước khi impute, nên tìm hiểu gì?", "Cách dữ liệu bị thiếu và khả năng missing indicator hữu ích", "Chỉ chọn giá trị đẹp nhất trên test", "Xóa mọi hàng tự động", "Điền nhãn vào feature", "Đánh giá chiến lược trên train/validation và giữ test độc lập.", "809544128"],
  ["duplicates", "Trùng giữa train và test", "Một mẫu trùng ở train và test có thể gây gì?", "Ước lượng đánh giá lạc quan vì không còn độc lập", "Bảo đảm generalization tốt", "Tăng tính độc lập", "Không bao giờ ảnh hưởng", "Xem đơn vị chia dữ liệu, ID người dùng và near-duplicate, không chỉ hàng giống hoàn toàn.", "809544128"],
  ["scale", "Scaling cho khoảng cách", "Vì sao KNN thường cần xem xét scale feature?", "Feature có đơn vị lớn có thể chi phối khoảng cách", "KNN không dùng khoảng cách", "Scaling luôn tăng accuracy", "Mọi feature tự có cùng đơn vị", "Fit scaler trên train; việc có cần scale tùy feature và metric.", "840642329"],
  ["target", "Feature phải có ở inference", "Một cột chỉ biết sau khi khách hàng rời dịch vụ có nên dùng dự đoán rời trước đó không?", "Không; đó là thông tin tương lai gây leakage", "Có vì tương quan cao", "Có nếu model phức tạp", "Có nếu chỉ dùng một lần", "Kiểm tra thời điểm từng feature có sẵn so với thời điểm dự đoán.", "809235391"],
  ["threshold", "Threshold theo mục tiêu", "Tăng threshold phân loại dương thường làm tập dự đoán dương thế nào?", "Không tăng, có thể giảm", "Luôn tăng", "Không liên quan đến score", "Luôn bằng toàn bộ mẫu", "Dùng cùng tập score và quy ước score≥threshold; precision/recall thay đổi tùy dữ liệu.", "806416452"],
  ["imbalance", "Đừng chỉ xem accuracy", "Nếu 99% mẫu là âm, model luôn đoán âm có accuracy bao nhiêu?", "99%", "0%", "1%", "100% và recall dương tốt", "Accuracy cao vẫn bỏ sót mọi mẫu dương; xem recall, precision và mục tiêu chi phí.", "806416452"],
  ["zero-division", "Metric có mẫu số 0", "Khi tính precision mà không có mẫu dự đoán dương, cần gì?", "Quy ước zero_division rõ ràng trong đặc tả", "Tự chia 0 để báo một số đẹp", "Mặc định precision luôn 1 trong mọi hệ", "Đổi nhãn test", "Phải thống nhất giữa thư viện, checker và tài liệu; không có một giá trị ngầm đúng cho mọi mục đích.", "802699705"],
  ["r2", "R² có thể âm", "R²=-0.5 trên test có thể xảy ra không?", "Có; model có thể kém baseline dự đoán trung bình", "Không vì luôn trong [0,1]", "Không vì R² luôn là bình phương số dương", "Có nhưng chắc chắn thư viện hỏng", "R² có thể âm; dữ liệu target hằng cần quy ước riêng của thư viện.", "802699705"],
  ["rmse", "RMSE có đơn vị target", "Nếu target đo bằng phút, RMSE có đơn vị gì?", "Phút", "Phút bình phương", "Không đơn vị trong mọi bài", "Số phần trăm bắt buộc", "MSE có đơn vị bình phương, lấy căn khôi phục đơn vị target.", "802699705"],
  ["learning-rate", "Learning rate vừa đủ", "Learning rate quá lớn có thể dẫn tới điều gì?", "Loss dao động hoặc phân kỳ", "Luôn hội tụ nhanh và đúng", "Gradient tự bằng 0", "Bỏ được normalization", "Quan sát loss theo bước; cực nhỏ có thể chậm. Tính chất còn phụ thuộc hàm loss và optimizer.", "843548500"],
  ["cv", "CV theo đơn vị dữ liệu", "Dữ liệu nhiều hàng cùng một bệnh nhân nên chia thế nào khi muốn dự đoán cho bệnh nhân mới?", "Theo nhóm bệnh nhân để nhóm không xuất hiện ở cả train và validation", "Shuffle mọi hàng bất kể bệnh nhân", "Giữ nguyên trùng nhóm để score cao", "Chọn split theo màu biểu đồ", "Group validation phản ánh mục tiêu tổng quát hóa cho nhóm mới.", "806687285"],
  ["time", "Dữ liệu thời gian", "Khi dự đoán tương lai từ quá khứ, split hợp lý thường cần gì?", "Train trước thời gian validation/test và tránh thông tin tương lai", "Trộn mọi thời điểm để mô phỏng tương lai", "Dùng tháng sau làm feature cho tháng trước", "Chỉ đảo nhãn", "Temporal validation và gap phù hợp phản ánh điều kiện triển khai.", "806687285"],
  ["cluster", "Nhãn cụm không có thứ tự", "Hai kết quả K-Means chỉ đổi tên nhãn 0↔1 nhưng giữ cùng nhóm có tương đương không?", "Có, nếu bài chỉ yêu cầu phân cụm", "Không vì 0 luôn là nhóm tốt hơn", "Không vì label là thứ hạng", "Chỉ tương đương nếu code giống nhau", "So cấu trúc nhóm hoặc căn chỉnh nhãn; không chấm sai vì hoán vị tên cụm.", "839361200"],
  ["pca", "PCA và dấu vector", "Hai thành phần chính khác nhau đúng một dấu có mô tả cùng trục không?", "Có", "Không, PCA chỉ nhận dấu dương", "Chỉ đúng nếu variance bằng 0", "Không thể xuất hiện trong thư viện", "v và −v mô tả cùng hướng trục; tọa độ chiếu đổi dấu tương ứng.", "809209957"],
  ["forest", "Forest và xác suất", "Trong scikit-learn RandomForestClassifier, nên hiểu predict từ gì?", "Xác suất lớp trung bình của các cây", "Một cây ngẫu nhiên mỗi lần", "Tổng nhãn số của mọi cây", "Hard vote luôn tương đương trong mọi trường hợp", "Trung bình xác suất và majority hard vote có thể khác; dùng đặc tả thư viện.", "840404900"],
  ["seed", "Seed và môi trường", "Chỉ lưu random_state đã đủ tái lập mọi môi trường chưa?", "Chưa; còn dữ liệu, code, phiên bản và điều kiện thực thi", "Đủ tuyệt đối cho mọi model", "Đủ cả khi dataset thay đổi", "Đủ cả khi thuật toán đổi", "Ghi manifest dữ liệu, dependencies và cấu hình cùng seed; dùng sai số phù hợp cho số thực.", "843548500"],
  ["monitor", "Theo dõi sau triển khai", "Theo dõi model nên gồm gì ngoài latency?", "Schema, drift, metric chất lượng khi có nhãn và lỗi theo nhóm", "Chỉ màu dashboard", "Chỉ train score cũ", "Chỉ số lượng tham số", "Model cần giám sát theo mục tiêu thật; drift là cảnh báo để điều tra, không tự chứng minh fail.", "842143160"],
];
function makeItem(row, courseId, type, index) {
  const [skill, title, prompt, correct, wrong1, wrong2, wrong3, explanation, prefix] = row;
  const sourcePrefix = prefix ?? mlPrefixes[Math.floor(index / 5)];
  return {
    id: `${courseId}-${type === "tip" ? "tip" : "interview"}-${String(index + 1).padStart(2, "0")}`,
    courseId, type, title, topic: skill, difficulty: ["easy", "medium", "hard"][type === "tip" ? 0 : index % 3],
    sourcePrefixes: [sourcePrefix], sourceIds: [sourceId(courseId, sourcePrefix)], provenance: "Từ tài liệu và bổ sung đã kiểm chứng", labels: ["Từ tài liệu", "Bổ sung"],
    summary: explanation, problemId: courseId === "dsa" && type === "interview" ? skill : undefined,
    essay: { prompt: `Giải thích “${title}” bằng lời của bạn, cho một ví dụ và một trường hợp dễ hiểu nhầm.`, modelAnswer: explanation, rubric: ["Nêu đúng khái niệm và điều kiện áp dụng", "Dùng ví dụ cụ thể nhất quán", "Chỉ ra giới hạn hoặc lỗi thường gặp"], scored: false },
    templates: [
      { id: `${skill}:concept`, kind: index % 8 === 6 ? "debug" : "choice", prompt, correct, wrong: [wrong1, wrong2, wrong3], explanation },
      { id: `${skill}:review`, kind: "choice", prompt: `Bạn đang ôn ${title}. Nhận định nào đúng theo đặc tả bài học?`, correct: explanation, wrong: [wrong1, wrong2, wrong3], explanation },
    ],
  };
}
export const tips = [...dsaTipRows.map((r, i) => makeItem(r, "dsa", "tip", i)), ...mlTipRows.map((r, i) => makeItem(r, "ml", "tip", i)),...daTipRows.map((r,i)=>makeItem(r,"da","tip",i)),...gitTipRows.map((r,i)=>makeItem(r,"git","tip",i))];
export const topics = [...dsaRows.map((r, i) => makeItem(r, "dsa", "interview", i)), ...mlRows.map((r, i) => makeItem(r, "ml", "interview", i)),...daRows.map((r,i)=>makeItem(r,"da","interview",i)),...gitRows.map((r,i)=>makeItem(r,"git","interview",i))];
export const knowledgeItems = [...tips, ...topics];
export const knowledgeById = Object.fromEntries(knowledgeItems.map((item) => [item.id, item]));
const mlInterviewLessons = [1,50,48,48,50,39,49,50,51,50,12,10,17,12,11,16,17,21,28,28,36,39,38,39,39,50,19,48,51,38,50,51,50,38,37];
const mlTipLessons = [1,9,5,10,10,19,12,25,25,25,27,27,15,29,29,31,34,21,39,39];
const references = {
  "leakage": "https://scikit-learn.org/stable/common_pitfalls.html",
  "pipeline-consistency": "https://scikit-learn.org/stable/common_pitfalls.html",
  "split": "https://scikit-learn.org/stable/common_pitfalls.html",
  "random-forest": "https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html",
  "forest": "https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html",
  "r2": "https://scikit-learn.org/stable/modules/generated/sklearn.metrics.r2_score.html",
  "temperature": "https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/adjust-parameter-values",
  "pca": "https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html",
};
for (const item of knowledgeItems) {
  const index = Number(item.id.split("-").at(-1)) - 1;
  item.lessonId = item.courseId === "dsa" ? dsaLessons.find((lesson) => lesson.problemIds.includes(item.problemId))?.id ?? 1 : item.courseId==="ml" ? (item.type === "tip" ? mlTipLessons[index] : mlInterviewLessons[index]) : item.courseId==="da" ? daLessonIds[item.topic]??1 : getCourse("git").lessons.find(l=>l.sourcePrefixes.some(p=>item.sourcePrefixes.includes(p)))?.id??1;
  if (item.courseId==="ml" && references[item.topic]) item.references = [{ title: "Tài liệu chính thức", url: references[item.topic] }];
  if (item.courseId==="ml" && ["r2","forest","random-forest","temperature","leakage","split"].includes(item.topic)) item.labels.push("Hiệu đính");
}

// Numeric, order, match and chart tasks have independent checkers and explicit
// conventions. They replace selected second templates to diversify practice.
const extra = (id, template) => knowledgeById[id].templates[1] = template;
extra("dsa-tip-01", { id: "indices:number", kind: "number", generator: "index", explanation: "Đánh chỉ số từ 0; giá trị là phần tử ở vị trí được hỏi." });
extra("dsa-tip-05", { id: "half-open:number", kind: "number", generator: "half-open", explanation: "Độ dài [l,r) là r−l." });
extra("dsa-tip-06", { id: "prefix:number", kind: "number", generator: "prefix", explanation: "Cộng các phần tử từ l tới r, gồm cả hai đầu." });
extra("dsa-interview-22", { id: "diameter:number", kind: "number", generator: "diameter", explanation: "Đường đi k node có k−1 cạnh." });
extra("dsa-tip-09", { id: "bfs:order", kind: "order", generator: "bfs-order", explanation: "Đánh dấu node trước khi enqueue để không đưa cùng node nhiều lần vào queue." });
extra("dsa-tip-11", { id: "structures:match", kind: "match", generator: "structures", explanation: "Stack: LIFO; queue: FIFO; min-heap: phần tử nhỏ nhất." });
extra("ml-tip-02", { id: "pipeline:order", kind: "order", generator: "pipeline", explanation: "Chia tập trước khi học tham số preprocessing; test chỉ được transform bởi tham số train." });
extra("ml-tip-08", { id: "threshold:chart", kind: "chart", generator: "threshold", explanation: "Dự đoán dương khi score≥threshold, kể cả bằng ngưỡng." });
extra("ml-tip-09", { id: "accuracy:number", kind: "number", generator: "accuracy", explanation: "Model luôn đoán âm đúng trên mọi mẫu âm nhưng bỏ sót toàn bộ mẫu dương." });
extra("ml-tip-12", { id: "metric:match", kind: "match", generator: "metrics", explanation: "MAE và RMSE có đơn vị target; MSE có đơn vị bình phương; R² không có đơn vị." });
extra("ml-interview-27", { id: "cosine:number", kind: "number", generator: "cosine", explanation: "Hai vector cùng hướng khác độ dài có cosine similarity bằng 1." });
extra("ml-interview-34", { id: "latency:number", kind: "number", generator: "throughput", explanation: "Throughput = số yêu cầu / số giây trong cửa sổ đo." });

export function generateKnowledgeQuestion(itemId, templateIndex, seed) {
  const item = knowledgeById[itemId];
  if (!item) throw new Error("Không có chủ đề luyện này.");
  const template = item.templates[templateIndex % 2], rng = random(`${seed}:${itemId}:${template.id}`);
  const question = { id: `${itemId}:${template.id}:${String(seed)}`, itemId, templateId: template.id, title: item.title, kind: template.kind, sourceIds: item.sourceIds, sourcePrefixes: item.sourcePrefixes, explanation: template.explanation, options: [], version: KNOWLEDGE_VERSION };
  if (!template.generator) {
    question.prompt = template.prompt;
    question.options = shuffle([template.correct, ...template.wrong].map((text, i) => ({ id: `answer-${i}`, text })), rng);
    question.expected = "answer-0";
  } else {
    const n = int(rng, 3, 9), m = int(rng, 2, 8);
    if (template.generator === "index") {
      const values = Array.from({ length: n }, () => int(rng, -15, 25)), index = int(rng, 0, n - 1);
      question.prompt = `nums=${JSON.stringify(values)}. Giá trị nums[${index}] là bao nhiêu?`;
      question.expected = values[index]; question.input = { values, index };
    } else if (template.generator === "half-open") {
      const l = int(rng, 0, 8), r = l + m;
      question.prompt = `Độ dài đoạn chỉ số [${l},${r}) là bao nhiêu?`;
      question.expected = r - l; question.input = { l, r };
    } else if (template.generator === "prefix") {
      const values = Array.from({ length: n }, () => int(rng, -5, 12)), l = int(rng, 0, n - 1), r = int(rng, l, n - 1);
      question.prompt = `nums=${JSON.stringify(values)}. Tổng đoạn [${l},${r}] gồm cả hai đầu là bao nhiêu?`;
      question.expected = values.slice(l, r + 1).reduce((sum, x) => sum + x, 0); question.input = { values, l, r };
    } else if (template.generator === "diameter") {
      question.prompt = `Đường đi dài nhất có ${n} node. Đường kính tính theo cạnh bằng bao nhiêu?`;
      question.expected = n - 1; question.input = { nodes: n };
    } else if (template.generator === "bfs-order" || template.generator === "pipeline") {
      const steps = template.generator === "pipeline" ? ["Chia train/test", "Fit preprocessing trên train", "Transform train/test bằng tham số đã fit", "Fit model trên train", "Đánh giá trên test"] : ["Lấy node ở đầu queue", "Xét một hàng xóm chưa thăm", "Đánh dấu hàng xóm đã thăm", "Đưa hàng xóm vào cuối queue"];
      question.prompt = template.generator === "pipeline" ? "Sắp xếp pipeline này để đánh giá cuối, không tuning và không leakage." : "Sắp xếp các thao tác xử lý một hàng xóm mới trong BFS.";
      question.items = shuffle(steps.map((text, i) => ({ id: `step-${i}`, text })), rng);
      question.expected = steps.map((_, i) => `step-${i}`);
    } else if (template.generator === "structures" || template.generator === "metrics") {
      const pairs = template.generator === "structures" ? [["Stack", "Vào sau, ra trước"], ["Queue", "Vào trước, ra trước"], ["Min-heap", "Lấy phần tử nhỏ nhất"]] : [["MAE", "Phút"], ["MSE", "Phút bình phương"], ["R²", "Không có đơn vị"]];
      question.prompt = template.generator === "structures" ? "Ghép cấu trúc với hành vi tương ứng." : "Target đo bằng phút. Ghép metric với đơn vị.";
      question.pairs = { left: pairs.map((p, i) => ({ id: `left-${i}`, text: p[0] })), right: shuffle(pairs.map((p, i) => ({ id: `right-${i}`, text: p[1] })), rng) };
      question.expected = Object.fromEntries(pairs.map((_, i) => [`left-${i}`, `right-${i}`]));
    } else if (template.generator === "threshold") {
      const threshold = int(rng, 2, 8) / 10, scores = Array.from({ length: 6 }, () => int(rng, 0, 10) / 10), count = scores.filter((s) => s >= threshold).length;
      question.prompt = `Quan sát score từng mẫu. Với threshold=${threshold} và quy ước score≥threshold là dương, có bao nhiêu mẫu dương?`;
      question.chart = { type: "bar", xLabel: "Mẫu", yLabel: "Score (0–1)", threshold, values: scores.map((value, i) => ({ label: String(i + 1), value })) };
      const choices = shuffle([count, ...[0,1,2,3,4,5,6].filter((x) => x !== count).slice(0, 3)], rng);
      question.options = choices.map((value) => ({ id: `count-${value}`, text: String(value) })); question.expected = `count-${count}`; question.input = { scores, threshold };
    } else if (template.generator === "accuracy") {
      const negative = int(rng, 80, 99); question.prompt = `Có 100 mẫu, ${negative} mẫu âm. Model luôn đoán âm. Accuracy là bao nhiêu phần trăm (nhập số)?`;
      question.expected = negative; question.input = { negative, total: 100 };
    } else if (template.generator === "cosine") {
      question.prompt = `Vector a=[${n},0], b=[${m},0]. Cosine similarity là bao nhiêu?`; question.expected = 1; question.input = { a: [n,0], b: [m,0] };
    } else if (template.generator === "throughput") {
      question.prompt = `Hệ thống hoàn thành ${n*m} yêu cầu trong ${m} giây. Throughput là bao nhiêu yêu cầu/giây?`; question.expected = n; question.input = { requests: n*m, seconds: m };
    } else throw new Error("Mẫu sinh chưa được kiểm chứng.");
  }
  return question;
}
export function checkKnowledgeAnswer(question, answer) {
  if (question.kind === "number") {
    if (typeof answer !== "string" && typeof answer !== "number") return false;
    const text = String(answer).trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return false;
    return Number.isFinite(Number(text)) && Math.abs(Number(text) - question.expected) <= 1e-9;
  }
  if (question.kind === "order") return Array.isArray(answer) && answer.length === question.expected.length && answer.every((v, i) => v === question.expected[i]);
  if (question.kind === "match") return Boolean(answer && typeof answer === "object" && !Array.isArray(answer) && Object.keys(answer).length === Object.keys(question.expected).length && Object.entries(question.expected).every(([key, value]) => answer[key] === value));
  return typeof answer === "string" && answer === question.expected;
}
export function publicKnowledgeQuestion(question, completed = false) {
  const { expected, explanation, ...publicData } = question;
  return completed ? { ...publicData, expected, explanation } : publicData;
}
export function publicKnowledgeItem(item) {
  const { templates, ...data } = item;
  return { ...data, text: data.summary, essay: { ...data.essay, answer: data.essay.modelAnswer }, templateCount: templates.length };
}
