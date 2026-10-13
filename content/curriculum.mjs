import { problems, interviewIds } from "./problems.mjs";
import { sourceMap, corrections } from "./sources-map.mjs";
import { learningGuide, lessonNotes } from "./teaching.mjs";
import { componentsGuide, componentsSolution } from "./alternatives.mjs";
import { solution } from "./solutions.mjs";
export const packs = {
  program: {
    name: "Chương trình và dữ liệu",
    analogy:
      "Một công thức nấu ăn chỉ hữu ích khi từng bước đủ rõ để người khác làm đúng. Chương trình cũng vậy: máy thực hiện chính xác các lệnh, không tự đoán ý định.",
    concept:
      'Một chương trình nhận đầu vào, xử lý theo thứ tự rồi tạo đầu ra. Biến là tên gắn với một giá trị; phép gán thay giá trị gắn với tên đó. Python suy ra kiểu từ giá trị; C++ khai báo kiểu trước khi dùng. Số nguyên khác chuỗi: 3 + 5 = 8, nhưng "3" + "5" là ghép chữ trong Python.',
    steps: [
      "Xác định đầu vào a và b là số nguyên.",
      "Đọc hoặc lấy giá trị từ data.",
      "Tính kết quả vào một biến.",
      "Trả kết quả bằng return.",
      "Thay đầu vào, đoán trước đầu ra rồi chạy.",
    ],
    example:
      "a=3, b=5 → total=8. Nếu sau đó a=10 thì total không tự đổi: phải tính total=a+b lần nữa.",
    trap: "Đừng nhầm dấu = (gán) với == (so sánh). Không viết lời giải chỉ trả 8 vì ví dụ có đáp án 8.",
    complexity:
      "Một phép cộng số nguyên trong miền dữ liệu bài học là O(1) thời gian và O(1) bộ nhớ phụ.",
    sources: ["785926715", "790425298"],
    label: "Bổ sung nhập môn",
  },
  condition: {
    name: "Điều kiện và kiểu dữ liệu",
    analogy:
      "Máy bán vé kiểm tra tuổi trước khi chọn giá. if/else là điểm rẽ nhánh: với mỗi điều kiện, chọn đúng một hướng xử lý.",
    concept:
      'Điều kiện là biểu thức đúng/sai. Toán tử % lấy phần dư; n % 2 == 0 kiểm tra số chẵn, kể cả số âm. Dùng and/or trong Python, &&/|| trong C++. Không ép một chuỗi "false" thành bool để suy ra false: một chuỗi không rỗng là truthy trong Python.',
    steps: [
      "Viết điều kiện thành câu hỏi đúng/sai.",
      "Xét cả nhánh if và else.",
      "Kiểm tra giá trị biên: 0, -1, 1.",
      "Trả bool thật: True/False hoặc true/false.",
    ],
    example:
      "n=12 → 12%2=0 → true; n=-3 → không chia hết cho 2 → false; n=0 → true.",
    trap: "Điều kiện n > 0 không phải kiểm tra chẵn. Điều kiện thứ tự có thể cần <= để giữ giá trị biên.",
    complexity: "Một số hữu hạn điều kiện: O(1) thời gian, O(1) bộ nhớ.",
    sources: [],
    label: "Bổ sung nhập môn",
  },
  loop: {
    name: "Vòng lặp và biến tích lũy",
    analogy:
      "Cộng giá của từng món trong giỏ hàng: nhìn một món, cộng vào tổng, rồi chuyển sang món tiếp theo.",
    concept:
      "Vòng lặp thực hiện cùng một thao tác trên nhiều phần tử. Biến total bắt đầu từ 0. Mỗi phần tử phải được xử lý đúng một lần. Một bất biến đơn giản: sau i bước, total bằng tổng i phần tử đã đọc. Mảng rỗng không chạy vòng lặp và tổng vẫn là 0.",
    steps: [
      "Khởi tạo biến trước vòng lặp.",
      "Duyệt từng phần tử hoặc chỉ số hợp lệ.",
      "Cập nhật tổng/count/best.",
      "Đảm bảo vòng lặp tiến tới điều kiện dừng.",
      "Trả kết quả sau vòng lặp.",
    ],
    example: "[2,3,5]: total lần lượt là 0 → 2 → 5 → 10. [ ]: kết quả 0.",
    trap: "Đặt total=0 bên trong vòng lặp sẽ làm mất tổng trước đó. Với tìm max và toàn số âm, không khởi tạo best=0.",
    complexity:
      "Duyệt n phần tử: Θ(n) thời gian; một biến tích lũy: O(1) bộ nhớ phụ.",
    sources: ["788218288", "788953852"],
    label: "Bổ sung và tài liệu DSA",
  },
  function: {
    name: "Hàm, return và debug",
    analogy:
      "Một chiếc máy nhỏ nhận nguyên liệu và trả thành phẩm. Bạn có thể dùng máy nhiều lần với nguyên liệu khác nhau mà không sửa bên trong.",
    concept:
      "Hàm gom một nhiệm vụ có tên. Tham số là đầu vào, return là kết quả. print chỉ in thông tin; nó không thay return. Trong BytePath, solve(data) được gọi với nhiều dữ liệu nên kết quả không được phụ thuộc biến còn sót từ lượt trước. Debug bằng cách chạy tay, ghi giá trị biến và tìm bước đầu tiên sai.",
    steps: [
      "Viết hợp đồng hàm: nhận gì, trả gì.",
      "Thử ví dụ nhỏ trước.",
      "Theo dõi từng biến ở mỗi bước.",
      "Kiểm tra trường hợp rỗng và biên.",
      "Chạy lại với dữ liệu khác.",
    ],
    example:
      'Hàm count([2,3,2],2) trả 2; count([],2) trả 0. In "2" rồi không return sẽ trả None trong Python.',
    trap: "Lỗi compile khác lỗi kết quả. Sửa cú pháp trước, rồi mới kiểm tra logic; không xóa test làm lộ lỗi.",
    complexity:
      "Chi phí một hàm bằng công việc nó thực hiện, không phải O(1) chỉ vì gọi bằng một dòng.",
    sources: ["785287985"],
    label: "Bổ sung nhập môn",
  },
  complexity: {
    name: "Tư duy độ phức tạp",
    analogy:
      "Tìm một tên bằng cách xem từng trang sẽ tăng công việc theo số trang. Mở giữa cuốn danh bạ rồi bỏ nửa sách làm phạm vi nhỏ đi rất nhanh.",
    concept:
      "Độ phức tạp mô tả chi phí tăng thế nào khi n tăng. O là chặn trên, Ω là chặn dưới, Θ là chặn chặt. Chúng không đồng nghĩa với xấu nhất, tốt nhất hay trung bình. Một thuật toán có thể tốt nhất Θ(1), xấu nhất Θ(n). Bộ nhớ phụ không gồm đầu vào; phải ghi rõ có tính đầu ra/call stack hay không.",
    steps: [
      "Xác định n là đại lượng gì.",
      "Đếm công việc trong vòng lặp và hàm con.",
      "Phân biệt vòng lặp nối tiếp với lồng nhau.",
      "Bỏ hệ số hằng và hạng nhỏ hơn.",
      "Nêu rõ tốt/trung bình/xấu và bộ nhớ phụ.",
    ],
    example:
      "Hai vòng for riêng, mỗi vòng n lần → 2n → Θ(n). Hai vòng lồng nhau, mỗi vòng n lần → n² → Θ(n²).",
    trap: "Vòng lặp lồng nhau không luôn O(n²): nếu cả hai con trỏ chỉ tăng tới n, tổng số bước có thể O(n).",
    complexity:
      "O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ) là các tốc độ tăng phổ biến.",
    sources: ["787959061", "790086654"],
    label: "Đã hiệu đính",
  },
  array: {
    name: "Mảng, chỉ số và chuỗi",
    analogy:
      "Một dãy ngăn tủ đánh số từ 0. Biết số ngăn giúp lấy đồ trực tiếp; chèn giữa dãy cần dời những món phía sau.",
    concept:
      "Chỉ số là vị trí, giá trị là dữ liệu tại vị trí. Với n phần tử, chỉ số hợp lệ 0..n-1. std::vector và Python list đều cho truy cập theo chỉ số O(1); chèn/xóa giữa thường O(n). Python list giữ tham chiếu, không phải các số nguyên nằm liên tiếp như int[] của C++. Python str bất biến; C++ std::string có thể sửa ký tự.",
    steps: [
      "Ghi chỉ số phía dưới từng phần tử.",
      "Phân biệt a[i] với i.",
      "Kiểm tra n=0 trước khi lấy a[0].",
      "Duyệt tới n-1, không truy cập a[n].",
      "Chọn vòng lặp theo phần tử hoặc theo vị trí.",
    ],
    example: "[10,20,30]: a[0]=10, a[2]=30. Xóa 20 cần dịch 30 sang vị trí 1.",
    trap: "Một chuỗi có dấu tiếng Việt không nhất thiết có cùng số byte và ký tự Unicode. Đề chuỗi cơ bản giới hạn ASCII để chấm rõ ràng.",
    complexity:
      "Access O(1); duyệt/tìm tuyến tính O(n); chèn giữa O(n); append trên dynamic array thường amortized O(1).",
    sources: ["788218288", "788413623", "788953852"],
    label: "Đã hiệu đính",
  },
  hash: {
    name: "HashMap và HashSet",
    analogy:
      "Một sổ danh bạ ánh xạ tên tới số điện thoại. Map lưu key→value, set chỉ ghi nhận có hay chưa.",
    concept:
      "Hash function ánh xạ key tới bucket. Key khác nhau có thể vào cùng bucket: collision phải được xử lý. Map hữu ích khi cần tần suất hoặc vị trí; set khi chỉ cần membership. Với Two Sum, tìm target-value trong các phần tử đã gặp trước khi lưu phần tử hiện tại, để không dùng một chỉ số hai lần.",
    steps: [
      "Chọn thông tin cần nhớ: key và value.",
      "Tra cứu trước khi thêm nếu không được dùng lại phần tử.",
      "Lưu chỉ số hoặc tăng tần suất.",
      "Giữ xử lý collision cho container chuẩn.",
      "Kiểm tra phần tử trùng và không có nghiệm.",
    ],
    example: "nums=[3,3], target=6: i=0 lưu 3→0; i=1 tìm được 3→0 → [0,1].",
    trap: "Hash lookup trung bình O(1), không bảo đảm xấu nhất O(1). Hai anagram phải có cùng số lần xuất hiện, không chỉ cùng tập chữ.",
    complexity:
      "Two Sum kỳ vọng O(n) thời gian/O(n) bộ nhớ. Bảng chữ cái cố định 26 ký tự: tần suất O(1) bộ nhớ.",
    sources: ["775448175", "776040542", "786927758", "789581073"],
    label: "Tài liệu DSA, có bổ sung",
  },
  prefix: {
    name: "Prefix sum, prefix product và mảng hiệu",
    analogy:
      "Biết tổng tiền tới từng ngày giúp tính tiền một khoảng bằng cách trừ hai mốc. Mảng hiệu ghi nơi một thay đổi bắt đầu và kết thúc.",
    concept:
      "Dùng prefix có n+1 ô: prefix[0]=0, prefix[i+1]=prefix[i]+a[i]. Tổng [l,r]=prefix[r+1]-prefix[l]. Mảng hiệu cập nhật [l,r] bằng diff[l]+=v, diff[r+1]-=v rồi cộng dồn để tái dựng. Tích trừ chính nó dùng tích bên trái và bên phải, xử lý được số 0 mà không chia.",
    steps: [
      "Xác định khoảng đóng [l,r].",
      "Tạo prefix n+1 ô hoặc diff n+1 ô.",
      "Cập nhật hai mốc đúng vị trí.",
      "Tái dựng sau một đợt cập nhật mảng hiệu.",
      "Thử l=0, r=n-1 và số âm/0.",
    ],
    example:
      "[3,1,4,2,5] → prefix=[0,3,4,8,10,15]; sum[1,3]=10-3=7. Cộng 5 vào [1,3] → [3,6,9,7,5].",
    trap: "Mảng hiệu cập nhật O(1) nhưng cần tái dựng O(n) trước khi đọc kết quả. Không tuyên bố mọi cập nhật và truy vấn online cùng O(1).",
    complexity:
      "Prefix: O(n) chuẩn bị, O(1) mỗi truy vấn, O(n) bộ nhớ. Product có O(1) phụ ngoài mảng đầu ra.",
    sources: ["776222353", "785146756", "788689477"],
    label: "Đã hiệu đính",
  },
  stack: {
    name: "Ngăn xếp: LIFO",
    analogy:
      "Chồng đĩa: đĩa vừa đặt lên là đĩa lấy ra trước. Undo cũng quay lại thao tác gần nhất.",
    concept:
      "Stack chỉ thao tác tại top. Khi kiểm tra ngoặc, push dấu mở; dấu đóng phải khớp top rồi pop. Min Stack lưu thêm cực tiểu ở mỗi độ sâu; cần giữ cả giá trị min trùng nhau. Monotonic stack lưu những chỉ số chưa tìm được phần tử lớn hơn, mỗi chỉ số vào/ra tối đa một lần.",
    steps: [
      "Xác định điều gì đang chờ xử lý.",
      "Push thông tin đủ dùng: thường là chỉ số.",
      "Kiểm tra rỗng trước khi đọc top.",
      "Pop khi điều kiện được giải quyết.",
      "Kiểm tra stack còn phần tử sau khi duyệt.",
    ],
    example:
      '"([])": push (, push [, gặp ] pop [, gặp ) pop (. "([)]" sai vì ) không khớp [.',
    trap: "Với nhiệt độ [70,70], ngày thứ hai không ấm hơn. Điều kiện phải >, không phải >=.",
    complexity:
      "Push/pop/top O(1) với cấu trúc phù hợp. Monotonic stack: O(n) tổng thời gian, O(n) bộ nhớ.",
    sources: ["774680448", "788141632", "791419364"],
    label: "Tài liệu DSA, sửa nhãn sơ đồ",
  },
  queue: {
    name: "Hàng đợi, deque và vòng",
    analogy:
      "Xếp hàng mua vé: ai đến trước được phục vụ trước. Deque là hàng có thể thao tác ở cả hai đầu.",
    concept:
      "Queue tuân FIFO: thêm ở rear, lấy ở front. Python dùng collections.deque để popleft O(1), không dùng list.pop(0) nếu cần hiệu quả. Circular queue dùng modulo để tái sử dụng ô đã lấy ra; cần phân biệt đầy và rỗng bằng size hoặc quy ước một ô trống. Priority queue phục vụ theo độ ưu tiên, khác FIFO.",
    steps: [
      "Ghi rõ front và rear.",
      "Thêm cuối, lấy đầu.",
      "Kiểm tra rỗng/đầy trước thao tác.",
      "Nếu dùng mảng vòng, cập nhật index modulo capacity.",
      "Kiểm tra nhiều lượt vòng quanh.",
    ],
    example:
      "push 10, push 20, pop → lấy 10, hàng còn [20]. Capacity=3: sau chỉ số 2 là chỉ số 0.",
    trap: "Đọc q[0] rồi pop() khỏi cuối không phải dequeue. C++ queue.pop() không trả giá trị; phải front() trước.",
    complexity:
      "Deque/queue chuẩn: thao tác hai đầu O(1); list.pop(0) O(n). Priority queue insert/extract O(log n).",
    sources: ["788689467", "791419364"],
    label: "Đã hiệu đính",
  },
  linked: {
    name: "Danh sách liên kết và con trỏ",
    analogy:
      "Một cuộc săn kho báu: mỗi tờ giấy ghi nơi tờ tiếp theo. Các tờ không cần nằm cạnh nhau.",
    concept:
      "Node chứa giá trị và tham chiếu tới next. Truy cập node thứ k cần đi từ head. Khi đảo list, phải lưu next trước khi đổi liên kết. Dummy head làm các trường hợp thêm/xóa đầu giống các trường hợp khác. Python tham chiếu object khác raw pointer C++, nhưng mô hình node→next giống nhau.",
    steps: [
      "Vẽ head và từng next.",
      "Lưu phần còn lại trước khi đổi link.",
      "Dùng prev/current/next khi đảo.",
      "Cập nhật head mới.",
      "Kiểm tra list rỗng, một node và node trùng giá trị.",
    ],
    example:
      "1→2→3: lưu next=2, đổi 1.next=NULL; sau đó 2.next=1; cuối cùng head=3.",
    trap: "So node bằng giá trị có thể nhầm hai node khác nhau. Floyd so danh tính node/pointer, không so val.",
    complexity:
      "Tìm kiếm O(n); chèn/xóa O(1) nếu đã có vị trí/link cần thiết. Không tự có truy cập O(1) theo chỉ số.",
    sources: ["776100851", "784076100", "784616988", "785583098"],
    label: "Tài liệu DSA, sửa sơ đồ",
  },
  floyd: {
    name: "Con trỏ nhanh và chậm",
    analogy:
      "Hai người chạy cùng chiều trên đường vòng: người chạy nhanh cuối cùng bắt kịp người chậm.",
    concept:
      "Slow đi một cạnh, fast đi hai cạnh. Nếu không có vòng, fast tới NULL. Nếu có vòng, sau khi cùng vào vòng, chênh lệch vị trí tăng một mỗi lượt modulo độ dài vòng nên gặp nhau. Không cần lưu mọi node đã thăm. Tìm node giữa cũng dùng hai tốc độ.",
    steps: [
      "Đặt slow=fast=head.",
      "Chỉ bước khi fast và fast.next tồn tại.",
      "Slow đi 1, fast đi 2.",
      "So danh tính hai node sau khi bước.",
      "Gặp nhau → có chu trình; tới NULL → không có.",
    ],
    example: "0→1→2→3→1: vị trí slow/fast sau các lượt là (1,2), (2,1), (3,3).",
    trap: "head có thể NULL. Dùng fast.next.next khi fast.next là NULL gây lỗi runtime.",
    complexity: "O(n) thời gian, O(1) bộ nhớ phụ.",
    sources: ["780486757", "776100851"],
    label: "Tài liệu DSA",
  },
  recursion: {
    name: "Đệ quy và backtracking",
    analogy:
      "Mở một hộp bên trong hộp khác; chỉ quay lại hộp ngoài sau khi xong hộp nhỏ hơn. Backtracking thử một lựa chọn rồi trả trạng thái như cũ để thử lựa chọn khác.",
    concept:
      "Đệ quy cần base case và tiến tới base case. Call stack giữ các lời gọi đang chờ. Backtracking có ba bước chọn→khám phá→hoàn tác. Khi lưu một path vào kết quả, phải sao chép path; không giữ tham chiếu tới list còn bị sửa.",
    steps: [
      "Xác định trạng thái hàm.",
      "Đặt điều kiện dừng trước lời gọi tiếp.",
      "Giảm kích thước bài toán.",
      "Chọn, gọi đệ quy, rồi unchoose.",
      "Vẽ cây quyết định cho dữ liệu nhỏ.",
    ],
    example:
      "Tập con [1,2]: mỗi số chọn/không chọn → [], [1], [2], [1,2]. Có 2² lá.",
    trap: "Thiếu pop sau append làm trạng thái lan sang nhánh khác. Đệ quy sâu có thể tràn stack.",
    complexity:
      "Sinh mọi tập con cần O(n·2ⁿ) khi tính cả sao chép đầu ra; stack/path O(n).",
    sources: ["787178887", "790440036"],
    label: "Đã hiệu đính nhãn call stack",
  },
  sorting: {
    name: "Sắp xếp và chia để trị",
    analogy:
      "Xếp các tấm thẻ: insertion sort chèn từng thẻ vào dãy đã có thứ tự. Merge sort chia thành các dãy nhỏ rồi trộn lại.",
    concept:
      "Bubble đổi cặp kề nhau sai thứ tự; selection tìm min mỗi lượt; insertion chèn vào phần đã sắp. Merge sort chia đôi, giải hai nửa rồi merge; Quick Sort partition theo pivot. Stable giữ thứ tự tương đối của phần tử cùng khóa. Built-in sort hữu ích khi đề không yêu cầu tự cài thuật toán.",
    steps: [
      "Xác định tăng/giảm và có giữ phần tử trùng không.",
      "Theo dõi phần đã sắp sau từng lượt.",
      "Với merge, luôn lấy nhỏ hơn từ hai đầu.",
      "Với quick, xác định chính xác cách partition.",
      "So sánh best/average/worst và bộ nhớ.",
    ],
    example:
      "[5,1,4,2] qua lượt bubble đầu → [1,4,2,5]. Merge [1,4] với [2,3] → [1,2,3,4].",
    trap: "Quick Sort xấu nhất O(n²), không luôn O(n log n). Merge Sort mảng chuẩn dùng O(n) bộ nhớ phụ.",
    complexity:
      "Bubble/selection/insertion thường O(n²); merge O(n log n); quick trung bình O(n log n), xấu nhất O(n²).",
    sources: ["778869907", "788816683", "776222353"],
    label: "Tài liệu DSA, có điều kiện triển khai",
  },
  search: {
    name: "Tìm kiếm nhị phân",
    analogy:
      "Đoán số: hỏi ở giữa rồi loại bỏ nửa không thể chứa đáp án. Mỗi câu hỏi phải làm phạm vi nhỏ lại.",
    concept:
      "Binary Search cơ bản cần mảng có thứ tự. Dùng đoạn đóng [left,right], lặp khi left<=right; khi loại mid, cập nhật mid+1 hoặc mid-1. Lower bound tìm vị trí đầu tiên ≥target; upper bound tìm đầu tiên >target. Binary search trên đáp án cần predicate đơn điệu. Mảng xoay không trùng giá trị luôn có ít nhất một nửa đã sắp.",
    steps: [
      "Chọn quy ước đoạn và giữ nhất quán.",
      "Tính mid=left+(right-left)//2.",
      "So a[mid] với target.",
      "Bỏ mid nếu biết nó không là đáp án.",
      "Kiểm tra rỗng, một phần tử, hai phần tử và không tìm thấy.",
    ],
    example: "[1,3,5,7,9], target=7: mid=2 (5), left=3; mid=3 (7) → chỉ số 3.",
    trap: "So target với mid thay vì a[mid] là sai. Gán left=mid trong đoạn đóng có thể tạo vòng lặp không dừng.",
    complexity:
      "Mảng truy cập ngẫu nhiên: O(log n) thời gian; bản lặp O(1) bộ nhớ. Sắp trước thêm O(n log n).",
    sources: ["778972158", "787205013", "787598499"],
    label: "Đã hiệu đính hình và quy ước",
  },
  pointers: {
    name: "Hai con trỏ",
    analogy:
      "Hai người đi từ hai đầu một hàng ghế; quyết định người nào bước tiếp tùy tổng giá trị đang nhìn.",
    concept:
      "Với mảng tăng, nếu a[left]+a[right] nhỏ hơn target thì tăng left; nếu lớn hơn thì giảm right. Điều này cần thứ tự để chứng minh không bỏ nghiệm. Palindrome so hai đầu rồi tiến vào giữa. 3Sum cố định một vị trí, dùng two pointers cho phần còn lại và bỏ bộ ba trùng.",
    steps: [
      "Xác định hai con trỏ có ý nghĩa gì.",
      "Nêu điều kiện cho phép bỏ các vị trí.",
      "Cập nhật một hoặc cả hai theo kết quả.",
      "Không dùng cùng chỉ số hai lần.",
      "Với 3Sum, giữ đủ số lần xuất hiện rồi bỏ nghiệm trùng.",
    ],
    example:
      "[1,3,4,6,8,9], target=10: 1+9=10. Với target=11: 1+9<11 nên left tiến tới 3.",
    trap: "Thuật toán bỏ một đầu theo tổng không đúng trên mảng chưa sắp. Sort sẽ thay chỉ số gốc; cần giữ cặp giá trị/chỉ số nếu đề hỏi chỉ số ban đầu.",
    complexity: "Hai con trỏ một lượt O(n), O(1) phụ; 3Sum O(n²) sau sort.",
    sources: ["781053356", "784252713", "788952208", "790505739"],
    label: "Tài liệu DSA, làm rõ điều kiện",
  },
  window: {
    name: "Cửa sổ trượt",
    analogy:
      "Một khung ảnh trượt qua dãy ô. Khi khung tiến, một ô đi vào và một ô rời khỏi, nên không cần tính lại cả khung.",
    concept:
      "Cửa sổ là đoạn liên tiếp [left,right], không phải subsequence. Với độ dài k, cập nhật tổng bằng cộng mới/trừ cũ. Với ký tự không lặp, thu hẹp left khi gặp lặp. Khi dùng tổng để thu hẹp, cần giả thiết số không âm; số âm có thể làm tổng giảm khi mở rộng và phá quy tắc.",
    steps: [
      "Xác định cố định k hay biến đổi.",
      "Thêm phần tử bên phải và cập nhật trạng thái.",
      "Thu hẹp trái khi ràng buộc bị vi phạm.",
      "Cập nhật best ở cửa sổ hợp lệ.",
      "Kiểm tra k=n, chuỗi rỗng và các ký tự giống nhau.",
    ],
    example:
      '[2,1,5,1], k=3: tổng đầu 8; bước tiếp 8+1-2=7. "abba": khi gặp b thứ hai, left phải qua b trước.',
    trap: "Không khởi tạo best=0 khi mọi tổng cửa sổ có thể âm. Sliding window không tự giải được mọi bài subarray có số âm.",
    complexity:
      "Mỗi con trỏ tiến tối đa n lần → O(n). Bộ nhớ tùy trạng thái: tổng O(1), map có thể O(k).",
    sources: ["776040542", "782184692", "784877227", "790505739"],
    label: "Đã hiệu đính",
  },
  tree: {
    name: "Cây nhị phân và BST",
    analogy:
      "Cây thư mục có một gốc và các nhánh. Mỗi mục có thể chứa mục nhỏ hơn; duyệt cây là chọn thứ tự thăm các nhánh.",
    concept:
      "Binary tree có tối đa hai con. DFS có preorder Root–Left–Right, inorder Left–Root–Right và postorder Left–Right–Root; BFS dùng queue theo tầng. BST yêu cầu mọi giá trị cây con trái nhỏ hơn node, cây con phải lớn hơn, không chỉ hai con trực tiếp. Maximum Depth đếm node; Diameter đếm cạnh.",
    steps: [
      "Kiểm tra node NULL trước truy cập.",
      "Xác định xử lý trước hay sau cây con.",
      "Giải mỗi subtree rồi kết hợp.",
      "Với diameter, xét leftHeight+rightHeight ở mọi node.",
      "Với codec, giữ dấu null để cấu trúc không mất.",
    ],
    example:
      "[1,2,3,4,5,null,6,7] có depth=4, diameter=5 cạnh trên đường 7–4–2–1–3–6.",
    trap: "BST không đảm bảo cân bằng. Cây lệch có chiều cao n và tìm kiếm O(n), không luôn O(log n).",
    complexity:
      "Duyệt O(n); stack DFS O(h). BFS bộ nhớ phụ bằng độ rộng lớn nhất.",
    sources: ["773952020", "775868873", "786037131", "788640051"],
    label: "Đã hiệu đính",
  },
  heap: {
    name: "Heap và hàng đợi ưu tiên",
    analogy:
      "Quầy cấp cứu phục vụ người có mức ưu tiên cao nhất trước, không theo thứ tự đến. Heap giữ phần tử cực trị sẵn tại gốc.",
    concept:
      "Binary heap là cây nhị phân hoàn chỉnh. Min heap: parent≤children; không yêu cầu cả mảng đã sắp. Dùng mảng, con của i là 2i+1 và 2i+2. Thêm cuối rồi sift-up; lấy gốc, đưa cuối lên rồi sift-down. Tìm lớn thứ k dùng min-heap giữ k giá trị lớn nhất.",
    steps: [
      "Chọn min heap hay max heap.",
      "Thêm và khôi phục heap property.",
      "Peek không xóa; pop có xóa.",
      "Khi ưu tiên bằng nhau, công bố tie-break.",
      "Build heap bottom-up khác push từng phần tử.",
    ],
    example:
      "[1,3,4,5,9,6,7] là min heap nhưng không phải mảng tăng. Top của heap là 1.",
    trap: "Giữ heap kích thước k: phần tử nhỏ nhất trong heap chính là lớn thứ k, không phải lớn nhất.",
    complexity:
      "Peek O(1), insert/extract O(log n), build heap O(n); top-K O(n log k), O(k) phụ.",
    sources: ["783608639", "788361264"],
    label: "Tài liệu DSA, bổ sung chỉ số",
  },
  greedy: {
    name: "Tham lam có chứng minh",
    analogy:
      "Chọn công việc kết thúc sớm nhất để chừa nhiều thời gian cho việc tiếp theo. Nhưng chọn món có giá trị cao nhất chưa chắc tối ưu balo.",
    concept:
      "Greedy chọn một quyết định tốt tại bước hiện tại. Phải chứng minh lựa chọn có thể nằm trong một nghiệm tối ưu hoặc đưa phản ví dụ. Interval scheduling dùng finish nhỏ nhất; khoảng [s,e) chạm đầu mút được chọn cùng. Buy/Sell Stock giữ giá thấp nhất đã thấy để tính lời tốt nhất bán hôm nay.",
    steps: [
      "Nêu quy tắc chọn cụ thể.",
      "Thử ví dụ có lựa chọn cạnh tranh.",
      "Dùng exchange argument hoặc chứng minh invariant.",
      "Nếu có phản ví dụ, đổi thuật toán.",
      "Phân biệt tối ưu kết quả với chỉ đúng trên ví dụ.",
    ],
    example:
      "Khoảng [0,5),[1,3),[4,6),[7,9): chọn [1,3),[4,6),[7,9) được 3; chọn [0,5) trước chỉ được 2.",
    trap: "Với xu [1,3,4], amount=6: greedy 4+1+1 cần 3 đồng; tối ưu 3+3 cần 2.",
    complexity:
      "Interval scheduling O(n log n) vì sort; quét sau sort O(n). Stock O(n), O(1) phụ.",
    sources: ["775448175", "787904001"],
    label: "Tài liệu DSA, bổ sung phản ví dụ",
  },
  graph: {
    name: "Đồ thị và BFS/DFS",
    analogy:
      "Các thành phố là node, các tuyến nối là cạnh. Lưới cũng là đồ thị: mỗi ô nối với các ô kề hợp lệ.",
    concept:
      "Đồ thị có hướng/vô hướng, có/không trọng số. Adjacency list dùng O(V+E) lưu trữ. BFS queue tìm khoảng cách ít cạnh nhất trên đồ thị không trọng số. DFS dùng stack/đệ quy cho reachability và components. Đánh dấu visited khi thêm vào frontier giúp tránh thêm lặp. Đồ thị có thể không liên thông.",
    steps: [
      "Vẽ từ một danh sách cạnh duy nhất.",
      "Công bố thứ tự láng giềng nếu hỏi thứ tự chính xác.",
      "Đánh dấu start rồi đưa vào frontier.",
      "Lấy node, duyệt láng giềng chưa thăm.",
      "Để đếm components, bắt đầu lại từ mỗi node chưa thăm.",
    ],
    example:
      "Lưới [[1,1,0],[0,1,0],[1,0,1]] có 3 đảo theo 4 hướng. Nối chéo sẽ là bài khác.",
    trap: "BFS không tối ưu tổng trọng số khi cạnh có giá trị khác nhau. Thiếu visited gây lặp trên chu trình.",
    complexity:
      "BFS/DFS O(V+E) với adjacency list, O(V) phụ; trên lưới O(rows·cols).",
    sources: ["774236902", "785315237", "788705001"],
    label: "Đã hiệu đính",
  },
  topo: {
    name: "Chu trình và thứ tự topo",
    analogy:
      "Phải học biến trước vòng lặp, vòng lặp trước thuật toán. Nếu A cần B và B cần A, không thể bắt đầu.",
    concept:
      "Topo chỉ có trên DAG. Kahn lấy node indegree=0, xóa cạnh đi ra, rồi thêm node mới về 0. Nếu xử lý chưa đủ V node thì có chu trình. Có thể nhiều topo đúng; checker xét mọi cạnh u→v phải có u trước v. Chu trình vô hướng dùng parent tracking, khác directed DFS cần trạng thái đang nằm trong stack.",
    steps: [
      "Tính indegree từ các cạnh.",
      "Đưa tất cả node degree=0 vào queue.",
      "Lấy node và thêm vào order.",
      "Giảm degree các láng giềng.",
      "So số node đã xử lý với n.",
    ],
    example: "0→1,0→2,2→3: [0,1,2,3] và [0,2,3,1] đều hợp lệ.",
    trap: "Chỉ duyệt từ node 0 bỏ qua thành phần khác. DFS visited thông thường không đủ phân biệt chu trình directed.",
    complexity: "Kahn O(V+E) thời gian, O(V+E) lưu đồ thị và O(V) phụ.",
    sources: ["790003285", "774236902"],
    label: "Tài liệu DSA, checker nhiều nghiệm",
  },
  shortest: {
    name: "Đường đi ngắn nhất có trọng số",
    analogy:
      "Hai chặng ngắn có thể nhanh hơn một chặng dài. Cần tối ưu tổng thời gian, không chỉ số chuyến.",
    concept:
      "Dijkstra dùng min-heap theo khoảng cách tạm thời, chỉ áp dụng khi trọng số không âm. Relax u→v khi dist[u]+w<dist[v]. Một node có thể vào heap nhiều lần; bỏ entry đã cũ. Bellman–Ford relax mọi cạnh V-1 lượt, dùng được cạnh âm; lần V kiểm tra chu trình âm tới được từ start.",
    steps: [
      "Khởi tạo start=0 và node khác=∞.",
      "Lấy khoảng cách nhỏ nhất còn trong heap.",
      "Bỏ entry cũ khác dist hiện tại.",
      "Relax tất cả cạnh đi ra.",
      "Ghi -1 cho node không tới được theo đặc tả bài.",
    ],
    example:
      "A→B=4,A→C=1,B→D=2,C→D=5,C→E=4: khoảng cách A,B,C,D,E là [0,4,1,6,5].",
    trap: "Dijkstra với cạnh âm có thể sai. Node không tới được không có khoảng cách 0.",
    complexity:
      "Dijkstra binary heap O((V+E)log V) trên đồ thị đơn; Bellman–Ford O(VE).",
    sources: ["790003285"],
    label: "Đã hiệu đính",
  },
  dp: {
    name: "Quy hoạch động",
    analogy:
      "Làm một bài toán nhỏ rồi ghi đáp án để không phải làm lại. Giải bài lớn bằng cách kết hợp những đáp án nhỏ đã biết.",
    concept:
      "DP cần state rõ, transition đúng, base case và thứ tự tính. Memoization là top-down có cache; tabulation bottom-up tính từ nhỏ tới lớn. 0/1 Knapsack cập nhật capacity giảm dần để mỗi vật chỉ dùng một lần. LCS khác substring: được bỏ ký tự nhưng giữ thứ tự.",
    steps: [
      "Viết dp[...] biểu diễn chính xác điều gì.",
      "Liệt kê lựa chọn tại một state.",
      "Viết recurrence từ state nhỏ hơn.",
      "Xác định base case.",
      "Chọn thứ tự không đọc state chưa tính.",
      "Đếm số state và chi phí mỗi transition.",
    ],
    example:
      'F(0)=0,F(1)=1,F(n)=F(n-1)+F(n-2). F(6)=8. LCS("abcde","ace")=3 dù "ace" không liên tiếp.',
    trap: "Knapsack 0/1 cập nhật tăng dần có thể lấy một vật nhiều lần. Không phải bài nào có lựa chọn tối ưu cũng dùng greedy đúng.",
    complexity:
      "Fibonacci O(n), có thể O(1) phụ. Knapsack O(nW), LCS O(nm); đây là chi phí theo các tham số của state.",
    sources: ["778173128", "785035048", "788879295"],
    label: "Tài liệu DSA, bổ sung chứng minh",
  },
  bit: {
    name: "Bit, XOR và mặt nạ",
    analogy:
      "Một hàng công tắc bật/tắt biểu diễn số nhị phân. Mỗi vị trí có giá trị 2 mũ vị trí.",
    concept:
      "AND bật khi cả hai bit bật; OR khi ít nhất một bật; XOR khi hai bit khác nhau. x^x=0 và x^0=x, nên các cặp giá trị tự triệt tiêu. Mask biểu diễn tập con. Python int không cố định 32-bit, C++ dùng kiểu có độ rộng hữu hạn; overflow và dịch bit cần đúng miền.",
    steps: [
      "Viết số ở dạng nhị phân.",
      "Căn các bit cùng vị trí.",
      "Áp dụng bảng chân trị từng bit.",
      "Kiểm tra lũy thừa 2 với n>0 và (n&(n-1))==0.",
      "Nêu giả thiết tần suất trước khi dùng XOR.",
    ],
    example:
      "12=1100,10=1010 → AND=1000=8, XOR=0110=6. [4,1,2,1,2] XOR toàn bộ =4.",
    trap: "XOR không tìm đúng một giá trị nếu có nhiều giá trị xuất hiện một lần. Dịch phải số âm khác phép chia làm tròn về 0.",
    complexity:
      "Trong miền số cố định của bài, mỗi phép bit O(1), XOR dãy O(n), O(1) phụ.",
    sources: ["784797440", "787904001"],
    label: "Đã hiệu đính miền dữ liệu",
  },
  trie: {
    name: "Trie và tiền tố",
    analogy:
      'Một cây đánh vần: các từ "app" và "apple" dùng chung đường a→p→p trước khi tách.',
    concept:
      "Mỗi cạnh giữ một ký tự. Chèn từ theo từng ký tự; tìm prefix đi theo đúng đường. Count ở node ghi bao nhiêu từ đi qua; root ghi tổng số từ. Cần phân biệt prefix tồn tại với một từ hoàn chỉnh bằng cờ end.",
    steps: [
      "Tạo root và children map.",
      "Chèn từng ký tự, tạo node nếu thiếu.",
      "Tăng count ở node đi qua.",
      "Truy vấn prefix theo từng ký tự.",
      "Không tìm thấy cạnh → trả 0.",
    ],
    example: '[app,apple,bat]: prefix "app" có 2 từ, "b" có 1, "" có 3.',
    trap: 'Node cho "ap" tồn tại không có nghĩa "ap" là một từ đã chèn.',
    complexity:
      "O(tổng độ dài từ) xây; O(độ dài prefix) mỗi truy vấn; bộ nhớ theo số node.",
    sources: ["784003766"],
    label: "Bổ sung mở rộng",
  },
  dsu: {
    name: "Union-Find và MST",
    analogy:
      "Các nhóm bạn kết nối dần: khi nối hai người thuộc nhóm khác nhau, hai nhóm nhập lại. Nếu đã cùng nhóm, cạnh mới có thể tạo vòng.",
    concept:
      "DSU giữ parent và đại diện của mỗi tập. Path compression làm find nhanh; union by rank/size tránh cây lệch. Kruskal sort cạnh theo trọng số và lấy cạnh nối hai components khác nhau. Đồ thị không liên thông không có một cây khung phủ tất cả node.",
    steps: [
      "Mỗi node ban đầu là một tập.",
      "Tìm đại diện u và v.",
      "Khác nhau thì union và giảm số component.",
      "Kruskal xét cạnh nhỏ trước, bỏ cạnh tạo vòng.",
      "Cần n-1 cạnh cho cây khung khi n>0.",
    ],
    example: "n=4, cạnh 0–1 và 2–3 → 2 components. Thêm 1–2 → còn 1.",
    trap: "MST tối ưu tổng trọng số của cây kết nối mọi node; không phải cây đường đi ngắn nhất từ một start.",
    complexity: "DSU tối ưu gần O(α(n)) amortized; Kruskal O(E log E) do sort.",
    sources: ["790003285"],
    label: "Bổ sung từ chủ đề được nhắc trong ảnh",
  },
  advanced: {
    name: "Nâng cao và chọn thuật toán",
    analogy:
      "Một dụng cụ đúng cho một công việc không nhất thiết đúng cho mọi công việc. Hãy đọc ràng buộc trước khi chọn mẫu.",
    concept:
      "Counting Sort dùng miền key hữu hạn; Radix xử lý từng chữ số; Heap Sort dùng heap. Interval DP giải từng đoạn [i,j] từ đoạn nhỏ hơn. Tree DP tổng hợp trạng thái của các cây con. Các thuật toán cần đặc tả riêng, không áp dụng một công thức độ phức tạp cho mọi biến thể.",
    steps: [
      "Đọc ràng buộc và xác định đại lượng đầu vào.",
      "Nêu rõ trạng thái và điều kiện áp dụng.",
      "Tạo lời giải vét cạn cho dữ liệu nhỏ.",
      "Kiểm chứng bằng dữ liệu đối kháng.",
      "Chỉ tối ưu khi lời giải đã đúng.",
    ],
    example:
      "Nhân ma trận 10×20,20×30,30×40: (AB)C tốn 18000, A(BC) tốn 32000. DP thử điểm chia k để chọn tốt hơn.",
    trap: "Một phản ví dụ đủ bác bỏ thuật toán. Qua nhiều test không tự tạo thành chứng minh đúng với mọi đầu vào.",
    complexity:
      "Matrix-chain DP O(n³)/O(n²); tree DP với hai trạng thái O(n)/O(h) stack.",
    sources: ["788879295", "788816683", "785287985"],
    label: "Bổ sung mở rộng",
  },
};
const rows = [
  ["Máy tính hiểu điều gì?", "program", "add"],
  ["Biến và phép tính", "program", "add"],
  ["Nếu… thì…", "condition", "parity"],
  ["Vòng lặp: từng bước một", "loop", "sum"],
  ["Hàm và tìm lỗi đầu tiên", "function", "count"],
  ["DSA ở ngay quanh bạn", "array", "maximum"],
  ["Chỉ số, mảng và chuỗi", "array", "count"],
  ["Công việc tăng nhanh thế nào?", "complexity", "sum"],
  ["Nhớ những gì đã gặp", "hash", "two-sum"],
  ["Tần suất và giá trị duy nhất", "hash", "anagram"],
  ["Tổng tiền tố và cập nhật khoảng", "prefix", "prefix"],
  ["Tích bên trái, tích bên phải", "prefix", "product"],
  ["Trạm kiểm tra · Nền tảng", "complexity", "two-sum", "exam"],
  ["Chiếc đĩa trên cùng", "stack", "parentheses"],
  ["Stack luôn nhớ giá trị nhỏ nhất", "stack", "min-stack"],
  ["Ai đến trước được phục vụ trước", "queue", "queue"],
  ["Chờ một ngày ấm hơn", "stack", "temperatures"],
  ["Node và đường nối tiếp theo", "linked", "reverse-list"],
  ["Đảo và trộn danh sách", "linked", "merge-list"],
  ["Hai tốc độ, một điểm gặp", "floyd", "list-cycle"],
  ["Chọn, khám phá, hoàn tác", "recursion", "subsets"],
  ["Sắp xếp những tấm thẻ", "sorting", "sort"],
  ["Chia đôi rồi trộn lại", "sorting", "merge-array"],
  ["Bỏ đi một nửa", "search", "binary"],
  ["Mảng xoay và ranh giới đầu tiên", "search", "rotated"],
  ["Trạm kiểm tra · Cấu trúc tuyến tính", "search", "merge-list", "exam"],
  ["Hai đầu cùng tiến", "pointers", "palindrome"],
  ["Tìm mọi bộ ba bằng không", "pointers", "three-sum"],
  ["Một cửa sổ đi qua dãy", "window", "window-sum"],
  ["Mở rộng và thu hẹp cửa sổ", "window", "substring"],
  ["Cây và bốn cách đi qua", "tree", "depth"],
  ["Đổi nhánh, so cây và hiểu BST", "tree", "invert"],
  ["Tổ tiên chung và đường dài nhất", "tree", "diameter"],
  ["Biến cây thành một thông điệp", "tree", "codec"],
  ["Giữ phần tử nhỏ nhất ở gốc", "heap", "top-k"],
  ["Quầy ưu tiên và dữ liệu luồng", "heap", "priority"],
  ["Chọn sớm có luôn tốt?", "greedy", "schedule"],
  ["Trạm kiểm tra · Kỹ thuật giải bài", "pointers", "substring", "exam"],
  ["Các node có thể kết nối với nhau", "graph", "union-find"],
  ["Đi theo tầng và đi theo nhánh", "graph", "clone"],
  ["Tìm những hòn đảo", "graph", "islands"],
  ["Vòng lặp và thứ tự tiên quyết", "topo", "topo"],
  ["Con đường ngắn nhất", "shortest", "shortest"],
  ["Đừng giải lại bài toán nhỏ", "dp", "fib"],
  ["Chọn đồ cho chiếc balo", "dp", "knapsack"],
  ["Dãy con chung và tổng tốt nhất", "dp", "lcs"],
  ["Những công tắc nhị phân", "bit", "xor"],
  ["Trạm kiểm tra · Sẵn sàng xây dựng", "dp", "topo", "exam"],
  ["Counting, Radix và Heap Sort", "sorting", "sort", "advanced"],
  ["Two pointers: thử thách nâng cao", "pointers", "three-sum", "advanced"],
  ["Deque và cửa sổ đơn điệu", "queue", "window-max", "advanced"],
  ["Bàn cờ của n quân hậu", "recursion", "nqueens", "advanced"],
  ["Từ điển tiền tố Trie", "trie", "trie", "advanced"],
  ["Các tập hợp nhập lại", "dsu", "union-find", "advanced"],
  ["Cây khung nhỏ nhất Kruskal", "dsu", "mst", "advanced"],
  ["Khi đường có trọng số âm", "shortest", "bellman", "advanced"],
  ["Heap và luồng giá trị", "heap", "top-k", "advanced"],
  ["Đổi tiền và chọn nhà", "dp", "coin", "advanced"],
  ["LIS và khoảng cách chỉnh sửa", "dp", "edit", "advanced"],
  ["DP trên khoảng và trên cây", "advanced", "interval-dp", "advanced"],
];
export const units = [
  {
    id: 1,
    title: "Những bước đầu tiên",
    subtitle: "Biến, điều kiện, vòng lặp và hàm",
    range: [1, 5],
    color: "green",
    icon: "sprout",
  },
  {
    id: 2,
    title: "Nhìn dữ liệu theo cách mới",
    subtitle: "Mảng, chuỗi và tư duy Big-O",
    range: [6, 8],
    color: "blue",
    icon: "blocks",
  },
  {
    id: 3,
    title: "Nhớ để giải nhanh hơn",
    subtitle: "Hashing, prefix sum và kiểm tra nền tảng",
    range: [9, 13],
    color: "purple",
    icon: "brain",
  },
  {
    id: 4,
    title: "Đúng thứ tự, đúng cấu trúc",
    subtitle: "Stack, queue và monotonic stack",
    range: [14, 17],
    color: "orange",
    icon: "layers",
  },
  {
    id: 5,
    title: "Theo những đường liên kết",
    subtitle: "Linked list, đệ quy và backtracking",
    range: [18, 21],
    color: "blue",
    icon: "link",
  },
  {
    id: 6,
    title: "Sắp xếp để tìm nhanh",
    subtitle: "Sorting, binary search và kiểm tra",
    range: [22, 26],
    color: "green",
    icon: "search",
  },
  {
    id: 7,
    title: "Di chuyển có chiến lược",
    subtitle: "Two pointers và sliding window",
    range: [27, 30],
    color: "orange",
    icon: "move",
  },
  {
    id: 8,
    title: "Khám phá từng nhánh cây",
    subtitle: "Binary tree, BST và codec",
    range: [31, 34],
    color: "green",
    icon: "tree",
  },
  {
    id: 9,
    title: "Chọn điều quan trọng trước",
    subtitle: "Heap, greedy và kiểm tra",
    range: [35, 38],
    color: "purple",
    icon: "crown",
  },
  {
    id: 10,
    title: "Kết nối cả thế giới",
    subtitle: "Graph, BFS/DFS và đường đi",
    range: [39, 43],
    color: "blue",
    icon: "network",
  },
  {
    id: 11,
    title: "Từ bài nhỏ đến bài lớn",
    subtitle: "DP, bit và kiểm tra tổng hợp",
    range: [44, 48],
    color: "purple",
    icon: "puzzle",
  },
  {
    id: 12,
    title: "Khám phá xa hơn",
    subtitle: "12 buổi nâng cao tự chọn",
    range: [49, 60],
    color: "orange",
    icon: "rocket",
  },
];
const extras = {
  1: ["parity"],
  2: ["count"],
  3: ["add"],
  4: ["maximum"],
  5: ["sum"],
  6: ["count"],
  7: ["palindrome"],
  8: ["count"],
  14: ["min-stack"],
  17: ["parentheses"],
  21: ["nqueens"],
  22: ["merge-array"],
  23: ["sort"],
  27: ["two-sum"],
  29: ["window-max"],
  47: ["duplicate"],
  50: ["palindrome"],
  52: ["subsets"],
  54: ["graph-cycle"],
  55: ["union-find"],
  56: ["shortest"],
  9: ["duplicate"],
  10: ["duplicate", "two-sum"],
  11: ["difference"],
  12: ["kadane"],
  15: ["parentheses"],
  16: ["priority"],
  18: ["merge-list"],
  19: ["reverse-list"],
  20: ["reverse-list"],
  24: ["bad-version"],
  25: ["bad-version", "binary"],
  28: ["palindrome"],
  30: ["replacement"],
  31: ["invert"],
  32: ["same-tree"],
  33: ["lca"],
  34: ["same-tree"],
  35: ["priority"],
  36: ["top-k"],
  37: ["stock"],
  39: ["graph-cycle"],
  40: ["graph-cycle"],
  41: ["clone"],
  42: ["graph-cycle"],
  43: ["topo"],
  44: ["house", "kadane"],
  45: ["coin"],
  46: ["kadane", "lis"],
  49: ["top-k"],
  51: ["window-sum"],
  53: ["anagram"],
  57: ["priority"],
  58: ["house"],
  59: ["lis"],
  60: ["tree-dp"],
};
const examProblems = {
  13: ["two-sum", "prefix"],
  26: ["merge-list", "binary"],
  38: ["substring", "top-k"],
  48: ["topo", "knapsack"],
};
export const lessons = rows.map((r, i) => {
  const id = i + 1,
    pack = packs[r[1]],
    problem = problems[r[2]],
    guide = id === 39 ? componentsGuide : learningGuide(r[2]),
    unit = units.find((u) => id >= u.range[0] && id <= u.range[1]);
  return {
    id,
    title: r[0],
    pack: r[1],
    unitId: unit.id,
    kind: r[3] ?? "lesson",
    duration: "45–60 phút",
    objectives: [
      `Giải thích ${pack.name.toLowerCase()} bằng một ví dụ nhỏ.`,
      `Tự chạy từng bước và phát hiện trường hợp biên.`,
      `Cài đặt ${problem.title} bằng ngôn ngữ đã chọn.`,
    ],
    prerequisites: id > 1 ? [id - 1] : [],
    sourcePrefixes: pack.sources,
    blocks: [
      {
        title: "Bắt đầu từ điều quen thuộc",
        text: (lessonNotes[id] ?? guide.intuition) + "\n\n" + pack.analogy,
        label: pack.label,
      },
      { title: pack.name, text: pack.concept, label: pack.label },
      {
        title: "Một ví dụ, từng bước",
        text: guide.algorithm + "\n\n" + pack.example,
        label: "Ví dụ đã kiểm chứng",
      },
      {
        title: "Điều dễ nhầm",
        text: guide.counterexample + "\n\n" + pack.trap,
        label: "Ghi nhớ",
      },
      {
        title: "Thời gian và bộ nhớ",
        text: guide.complexity + "\n\n" + pack.complexity,
        label: "Phân tích",
      },
      ...(r[3] === "exam"
        ? []
        : [
            {
              title: "Từ ý tưởng thành code",
              text: "Đọc từng dòng, liên hệ biến với trạng thái trong mô phỏng. Dự đoán đầu ra trước khi chạy. Sau đó tự viết lại trong phòng thực hành; bộ chấm xét kết quả, không bắt bạn giống code này.",
              label: "Bổ sung · Lời giải đã kiểm chứng",
              code: {
                python:
                  id === 39
                    ? componentsSolution("python")
                    : solution(r[2], "python"),
                cpp:
                  id === 39 ? componentsSolution("cpp") : solution(r[2], "cpp"),
              },
            },
          ]),
      ...(r[3] === "exam"
        ? []
        : (extras[id] ?? []).map((pid) => {
            const g = learningGuide(pid);
            return {
              title: "Mở rộng · " + problems[pid].title,
              label: "Tùy chọn · Ví dụ đã kiểm chứng",
              problemId: pid,
              text: [
                g.intuition,
                g.algorithm,
                "Dễ nhầm: " + g.counterexample,
                g.complexity,
              ].join("\n\n"),
              code: {
                python: solution(pid, "python"),
                cpp: solution(pid, "cpp"),
              },
            };
          })),
    ],
    steps:
      id === 39
        ? [componentsGuide.algorithm]
        : [...pack.steps, guide.algorithm],
    problemIds:
      r[3] === "exam" ? examProblems[id] : [r[2], ...(extras[id] ?? [])],
  };
});
export const course = {
  id: "dsa",
  title: "Cấu trúc dữ liệu & thuật toán",
  description: "Từ dòng code đầu tiên đến tư duy giải quyết vấn đề.",
  version: "1.1.0",
  mandatoryLessons: 48,
  advancedLessons: 12,
  units,
  lessons,
};
export const topicQuestions = {
  program: [
    [
      "Phép gán a=10 làm điều gì?",
      "Gắn tên a với giá trị 10",
      "Kiểm tra a có bằng 10 không",
      "In số 10",
    ],
    [
      "Sau total=a+b, đổi a có tự đổi total không?",
      "Không; cần tính lại",
      "Có, tự cập nhật",
      "Chỉ khi b bằng 0",
    ],
    [
      "Đầu ra của một hàm thường được trả bằng gì?",
      "return",
      "Tên biến",
      "Chú thích",
    ],
    [
      'Giá trị 3 khác chuỗi "3" ở điểm nào?',
      "Một là số, một là văn bản",
      "Không khác nhau",
      "Chuỗi luôn là số âm",
    ],
    [
      "Một ví dụ qua test có chứng minh đúng mọi đầu vào?",
      "Không",
      "Có",
      "Chỉ với C++",
    ],
  ],
  condition: [
    [
      "n%2==0 kiểm tra điều gì?",
      "n là số chẵn",
      "n là số dương",
      "n lớn hơn 2",
    ],
    ["0 có là số chẵn không?", "Có", "Không", "Không xác định"],
    [
      "Một biểu thức điều kiện trả kiểu nào?",
      "Đúng/sai",
      "Luôn là chuỗi",
      "Luôn là mảng",
    ],
    ["Dấu == dùng để làm gì?", "So sánh bằng", "Gán giá trị", "Cộng hai số"],
    [
      "Nhánh else chạy khi nào?",
      "Khi điều kiện if sai",
      "Luôn luôn",
      "Chỉ khi số dương",
    ],
  ],
  loop: [
    ["Tổng ban đầu cho mảng rỗng là gì?", "0", "1", "Phần tử đầu"],
    [
      "Tìm max của toàn số âm nên khởi tạo best thế nào?",
      "Bằng phần tử đầu tiên",
      "Bằng 0",
      "Bằng 1",
    ],
    ["Duyệt n phần tử một lượt thường mất bao lâu?", "Θ(n)", "Θ(1)", "Θ(n²)"],
    [
      "total=0 đặt trong mỗi lượt gây lỗi gì?",
      "Mất tổng đã cộng",
      "Vòng lặp nhanh hơn",
      "Tự nhân đôi tổng",
    ],
    [
      "Bất biến vòng lặp là gì?",
      "Mệnh đề đúng sau mỗi bước",
      "Một biến không có giá trị",
      "Điều kiện luôn sai",
    ],
  ],
  function: [
    [
      "print khác return thế nào?",
      "print hiển thị, return trả kết quả hàm",
      "Hai lệnh như nhau",
      "return chỉ in chữ",
    ],
    [
      "Debug nên tìm điều gì đầu tiên?",
      "Bước đầu tiên trạng thái sai",
      "Đổi mọi tên biến",
      "Bỏ các test sai",
    ],
    [
      "Chi phí gọi hàm có luôn O(1)?",
      "Không, phụ thuộc công việc trong hàm",
      "Có",
      "Chỉ trong Python",
    ],
    [
      "Hàm solve phải làm việc với dữ liệu nào?",
      "Nhiều đầu vào hợp lệ",
      "Chỉ ví dụ mẫu",
      "Chỉ số dương",
    ],
    [
      "Khi compile lỗi nên xử lý gì trước?",
      "Sửa cú pháp/kiểu dữ liệu",
      "Đổi đáp án chuẩn",
      "Cộng điểm thủ công",
    ],
  ],
  complexity: [
    [
      "Big-O là gì?",
      "Chặn trên tiệm cận",
      "Luôn là trường hợp trung bình",
      "Luôn là số giây",
    ],
    [
      "Θ(n) mô tả gì?",
      "Chặn chặt tuyến tính",
      "Chỉ chặn dưới",
      "Luôn là tốt nhất",
    ],
    [
      "Hai vòng lặp riêng đều n bước có tổng chi phí gì?",
      "Θ(n)",
      "Θ(n²)",
      "Θ(log n)",
    ],
    [
      "Bộ nhớ phụ là gì?",
      "Bộ nhớ thêm ngoài đầu vào, theo quy ước nêu rõ",
      "Luôn bằng kích thước đầu vào",
      "Luôn bằng 0",
    ],
    [
      "Hash lookup thường có chi phí nào?",
      "Trung bình O(1), có thể xấu nhất O(n)",
      "Luôn O(1)",
      "Luôn O(log n)",
    ],
  ],
  array: [
    ["Mảng n phần tử có chỉ số cuối là gì?", "n-1", "n", "n+1"],
    [
      "Python str có sửa trực tiếp một ký tự được không?",
      "Không; str bất biến",
      "Có",
      "Chỉ với chữ a",
    ],
    [
      "Chèn giữa dynamic array thường tốn gì?",
      "O(n) do dịch phần tử",
      "O(1) luôn",
      "O(log n) luôn",
    ],
    [
      "a[i] biểu diễn gì?",
      "Giá trị tại vị trí i",
      "Luôn bằng i",
      "Độ dài mảng",
    ],
    ["Truy cập a[0] khi mảng rỗng có hợp lệ?", "Không", "Có", "Chỉ trong C++"],
  ],
  hash: [
    [
      "Two Sum nên lưu gì trong map?",
      "Giá trị → chỉ số đã gặp",
      "Chỉ số → tổng cả mảng",
      "Độ dài → giá trị cuối",
    ],
    [
      "Vì sao tra complement trước khi thêm số hiện tại?",
      "Không dùng một chỉ số hai lần",
      "Để sort mảng",
      "Để luôn trả chỉ số 0",
    ],
    [
      "Anagram cần cùng điều gì?",
      "Tần suất từng ký tự",
      "Chỉ tập ký tự",
      "Chỉ độ dài",
    ],
    [
      "Collision nghĩa là gì?",
      "Key khác nhau vào cùng bucket",
      "Hai key luôn giống nhau",
      "Map không có value",
    ],
    [
      "Khi chỉ cần kiểm tra tồn tại, dùng gì?",
      "HashSet",
      "Call stack",
      "Cây đệ quy",
    ],
  ],
  prefix: [
    [
      "Prefix n+1 ô giúp xử lý tốt trường hợp nào?",
      "l=0",
      "Chỉ số âm bất kỳ",
      "Mảng không có số",
    ],
    [
      "Tổng [l,r] với prefix n+1 là gì?",
      "prefix[r+1]-prefix[l]",
      "prefix[r]-prefix[l]",
      "prefix[l]+prefix[r]",
    ],
    ["Cập nhật mảng hiệu [l,r] kết thúc ở đâu?", "r+1", "r-1", "l-1"],
    [
      "Sau cập nhật diff cần làm gì để đọc mảng?",
      "Tái dựng bằng cộng dồn",
      "Sắp xếp diff",
      "Xóa diff",
    ],
    [
      "Product Except Self có số 0 nên chọn cách nào?",
      "Prefix/suffix product",
      "Luôn chia tổng tích",
      "Bỏ số 0",
    ],
  ],
  stack: [
    [
      "LIFO nghĩa là gì?",
      "Vào sau, ra trước",
      "Vào trước, ra trước",
      "Giá trị lớn ra trước",
    ],
    [
      "Ngoặc đóng phải khớp với gì?",
      "Ngoặc mở trên top",
      "Ngoặc mở bất kỳ",
      "Ký tự đầu chuỗi",
    ],
    [
      "Monotonic stack lưu chỉ số giúp làm gì?",
      "Tính khoảng cách ngày",
      "Giảm nhiệt độ",
      "Đổi chuỗi",
    ],
    [
      "Hai ngày bằng nhiệt độ có được xem là ấm hơn?",
      "Không",
      "Có",
      "Tùy chỉ số chẵn",
    ],
    [
      "Min Stack có min trùng cần làm gì?",
      "Giữ đủ trạng thái min qua các lần pop",
      "Chỉ giữ một min rồi xóa",
      "Bỏ phần tử trùng",
    ],
  ],
  queue: [
    [
      "FIFO nghĩa là gì?",
      "Vào trước, ra trước",
      "Vào sau, ra trước",
      "Nhỏ nhất ra trước",
    ],
    ["Python list.pop(0) tốn gì?", "O(n)", "O(1)", "O(log n)"],
    [
      "deque.popleft() lấy phần tử ở đâu?",
      "Đầu hàng",
      "Cuối hàng",
      "Giữa hàng",
    ],
    [
      "Circular queue cập nhật vị trí bằng gì?",
      "Modulo capacity",
      "Luôn tăng vô hạn",
      "Nhân đôi chỉ số",
    ],
    [
      "Priority queue khác FIFO ở đâu?",
      "Lấy theo ưu tiên",
      "Không chứa số",
      "Không thể thêm",
    ],
  ],
  linked: [
    [
      "Đảo list phải lưu gì trước đổi current.next?",
      "Node kế tiếp",
      "Chỉ val hiện tại",
      "Độ dài chuỗi",
    ],
    [
      "Dummy head giúp gì?",
      "Giảm xử lý riêng ở đầu list",
      "Tự sort list",
      "Xóa mọi node",
    ],
    [
      "Truy cập node thứ k cần gì?",
      "Đi qua các link từ head",
      "Truy cập bộ nhớ như mảng",
      "Luôn một phép đọc",
    ],
    [
      "Hai node bằng val có chắc cùng node?",
      "Không",
      "Có",
      "Chỉ khi val dương",
    ],
    [
      "Chèn node có luôn O(1) gồm cả tìm vị trí?",
      "Không; tìm vị trí có thể O(n)",
      "Có",
      "Luôn O(log n)",
    ],
  ],
  floyd: [
    ["Fast đi mấy cạnh mỗi lượt?", "2", "1", "3"],
    ["Slow đi mấy cạnh mỗi lượt?", "1", "2", "0"],
    [
      "Floyd so sánh gì khi phát hiện gặp nhau?",
      "Danh tính node",
      "Chỉ giá trị",
      "Độ dài list",
    ],
    [
      "Vòng lặp phải kiểm tra gì?",
      "fast và fast.next tồn tại",
      "Chỉ head khác 0",
      "Chỉ val dương",
    ],
    ["Floyd cần bao nhiêu bộ nhớ phụ?", "O(1)", "O(n)", "O(n²)"],
  ],
  recursion: [
    [
      "Base case có nhiệm vụ gì?",
      "Dừng đệ quy",
      "Tạo thêm vòng lặp",
      "Luôn trả 0",
    ],
    [
      "Backtracking có ba bước nào?",
      "Chọn, khám phá, hoàn tác",
      "Sort, xóa, chia",
      "In, lưu, thoát",
    ],
    [
      "Khi lưu path đang thay đổi cần gì?",
      "Sao chép path",
      "Luôn giữ cùng tham chiếu",
      "Xóa toàn bộ path",
    ],
    ["n phần tử khác nhau có bao nhiêu tập con?", "2ⁿ", "n²", "n"],
    [
      "Call stack quá sâu có thể gây gì?",
      "Tràn stack",
      "Tự tối ưu DP",
      "Luôn trả đúng",
    ],
  ],
  sorting: [
    [
      "Stable sort giữ điều gì?",
      "Thứ tự tương đối của khóa bằng nhau",
      "Thứ tự mọi phần tử",
      "Không có trùng",
    ],
    ["Quick Sort xấu nhất có thể là gì?", "O(n²)", "O(n log n) luôn", "O(1)"],
    ["Merge Sort chuẩn trên mảng dùng phụ gì?", "O(n)", "O(1) luôn", "O(n²)"],
    [
      "Selection Sort mỗi lượt chọn gì?",
      "Min của phần chưa sắp",
      "Phần tử bất kỳ",
      "Max toàn bộ rồi dừng",
    ],
    [
      "Merge hai dãy tăng nên lấy gì trước?",
      "Nhỏ hơn ở hai đầu chưa xử lý",
      "Phần tử cuối bất kỳ",
      "Chỉ lấy từ a",
    ],
  ],
  search: [
    [
      "Binary Search cơ bản cần gì?",
      "Dữ liệu có thứ tự",
      "Dữ liệu ngẫu nhiên",
      "Chỉ số bắt đầu từ 1",
    ],
    [
      "Đoạn đóng dùng điều kiện lặp nào?",
      "left<=right",
      "left>right",
      "left==right luôn",
    ],
    ["Khi a[mid]<target, đoạn đóng đổi left thế nào?", "mid+1", "mid", "mid-1"],
    [
      "Lower bound tìm gì?",
      "Vị trí đầu tiên ≥target",
      "Vị trí cuối ≤target",
      "Luôn trả target",
    ],
    [
      "Predicate cho binary search đáp án cần tính gì?",
      "Đơn điệu",
      "Ngẫu nhiên",
      "Luôn false",
    ],
  ],
  pointers: [
    [
      "Pair sum bỏ đầu theo tổng cần giả thiết gì?",
      "Mảng đã sắp",
      "Mảng bất kỳ",
      "Mọi số bằng nhau",
    ],
    [
      "Tổng nhỏ hơn target trên mảng tăng thì làm gì?",
      "Tăng left",
      "Giảm right",
      "Dừng ngay",
    ],
    [
      "Palindrome cần so gì?",
      "Hai đầu của đoạn còn lại",
      "Hai ký tự bất kỳ",
      "Chỉ độ dài",
    ],
    [
      "3Sum cần xử lý nghiệm trùng thế nào?",
      "Bỏ bộ ba trùng",
      "Xóa mọi số trùng trước",
      "Giữ mọi bộ ba lặp",
    ],
    ["Hai con trỏ một lượt có tổng chi phí gì?", "O(n)", "O(n²) luôn", "O(1)"],
  ],
  window: [
    [
      "Cửa sổ trượt mô tả loại đoạn nào?",
      "Liên tiếp",
      "Dãy con bất kỳ",
      "Chỉ số tùy ý",
    ],
    [
      "Trượt cửa sổ k cần cập nhật tổng thế nào?",
      "Cộng mới, trừ cũ",
      "Tính max phần tử",
      "Luôn cộng 1",
    ],
    [
      "Thu hẹp theo tổng với số âm có luôn đúng?",
      "Không",
      "Có",
      "Chỉ với n chẵn",
    ],
    [
      "Longest Substring không lặp cần làm gì khi gặp lặp?",
      "Thu hẹp qua vị trí lặp cũ",
      "Reset best=0",
      "Bỏ ký tự hiện tại mãi",
    ],
    [
      "Map tần suất có luôn O(1) bộ nhớ với mọi alphabet?",
      "Không; tùy số ký tự",
      "Có",
      "Chỉ khi chuỗi rỗng",
    ],
  ],
  tree: [
    [
      "Maximum Depth trong bài đếm gì?",
      "Số node trên đường root→leaf",
      "Số cạnh toàn cây",
      "Số lá",
    ],
    [
      "Diameter trong bài đếm gì?",
      "Cạnh trên đường dài nhất",
      "Số node toàn cây",
      "Độ rộng tầng",
    ],
    [
      "BST cần so với cây con thế nào?",
      "Mọi giá trị cây con phải đúng ràng buộc",
      "Chỉ hai con trực tiếp",
      "Chỉ root dương",
    ],
    [
      "Inorder có thứ tự gì?",
      "Left–Root–Right",
      "Root–Left–Right",
      "Left–Right–Root",
    ],
    [
      "Vì sao codec cần dấu null?",
      "Giữ cấu trúc cây",
      "Tăng giá trị node",
      "Để sort node",
    ],
  ],
  heap: [
    [
      "Min heap đảm bảo gì?",
      "Parent≤children",
      "Cả mảng đã sắp",
      "Mọi node bằng nhau",
    ],
    ["Peek heap có chi phí gì?", "O(1)", "O(n)", "O(n log n)"],
    ["Build heap bottom-up có chi phí gì?", "O(n)", "O(n²)", "O(1)"],
    [
      "Min heap k giá trị lớn nhất có top là gì?",
      "Giá trị lớn thứ k",
      "Giá trị lớn nhất toàn bộ",
      "Giá trị nhỏ nhất toàn bộ",
    ],
    [
      "Ưu tiên bằng nhau cần gì trong đề?",
      "Tie-break rõ ràng",
      "Chấm theo may mắn",
      "Bỏ task",
    ],
  ],
  greedy: [
    [
      "Một quyết định greedy cần gì?",
      "Chứng minh hoặc kiểm tra phản ví dụ",
      "Chỉ một ví dụ đúng",
      "Chỉ code ngắn",
    ],
    [
      "Interval scheduling chọn theo gì?",
      "Kết thúc sớm nhất",
      "Bắt đầu sớm nhất luôn",
      "Khoảng dài nhất",
    ],
    ["[1,3) và [3,5) có chồng nhau?", "Không", "Có", "Không xác định"],
    ["Xu [1,3,4], amount=6 có tối ưu gì?", "3+3", "4+1+1", "Sáu xu 1"],
    [
      "Stock cần nhớ giá nào đã thấy?",
      "Nhỏ nhất trước/ngày hiện tại",
      "Lớn nhất tương lai luôn",
      "Giá ngày cuối",
    ],
  ],
  graph: [
    ["BFS dùng cấu trúc nào?", "Queue", "Min Stack", "BST"],
    [
      "BFS tìm ngắn nhất khi nào?",
      "Đồ thị không trọng số / cạnh cùng trọng số",
      "Mọi trọng số bất kỳ",
      "Có cạnh âm luôn",
    ],
    [
      "Visited nên đánh dấu khi nào để tránh thêm lặp?",
      "Khi đưa node vào frontier",
      "Chỉ sau khi hết thuật toán",
      "Không cần",
    ],
    ["Đảo trong bài nối theo mấy hướng?", "4", "8", "Chỉ ngang"],
    [
      "Đếm components phải xét gì?",
      "Mọi node chưa visited",
      "Chỉ node 0",
      "Chỉ node bậc lớn nhất",
    ],
  ],
  topo: [
    [
      "Topo tồn tại trên đồ thị nào?",
      "DAG",
      "Mọi đồ thị có chu trình",
      "Chỉ đồ thị vô hướng",
    ],
    [
      "Kahn bắt đầu từ node nào?",
      "indegree=0",
      "outdegree=0 luôn",
      "Node có nhãn lớn nhất",
    ],
    [
      "Kahn xử lý ít hơn V node nghĩa là gì?",
      "Có chu trình",
      "Không có cạnh",
      "Luôn lỗi compile",
    ],
    [
      "Có thể có nhiều thứ tự topo đúng không?",
      "Có",
      "Không",
      "Chỉ một khi V>1",
    ],
    [
      "Cạnh u→v yêu cầu gì trong order?",
      "u trước v",
      "v trước u",
      "u và v cùng vị trí",
    ],
  ],
  shortest: [
    [
      "Dijkstra yêu cầu trọng số thế nào?",
      "Không âm",
      "Âm bất kỳ",
      "Chỉ bằng 1",
    ],
    [
      "Relax nghĩa là gì?",
      "Cập nhật khoảng cách tốt hơn qua một cạnh",
      "Xóa start",
      "Sort toàn bộ node theo tên",
    ],
    [
      "Heap entry cũ xử lý thế nào?",
      "Bỏ nếu khác dist hiện tại",
      "Luôn ghi đè dist",
      "Luôn tính là lỗi",
    ],
    ["Bellman–Ford cơ bản relax bao nhiêu lượt?", "V-1", "1 luôn", "E²"],
    ["Node không tới được có khoảng cách gì theo đề?", "-1", "0", "1"],
  ],
  dp: [
    [
      "Một state DP cần điều gì?",
      "Ý nghĩa rõ ràng",
      "Chỉ tên ngắn",
      "Luôn là một số 0",
    ],
    [
      "0/1 Knapsack 1D cập nhật capacity hướng nào?",
      "Giảm dần",
      "Tăng dần",
      "Bất kỳ",
    ],
    [
      "LCS có cần liên tiếp không?",
      "Không",
      "Có",
      "Chỉ khi hai chuỗi bằng nhau",
    ],
    [
      "Memoization là gì?",
      "Đệ quy có lưu kết quả",
      "Lặp không cache",
      "Sort bảng",
    ],
    [
      "Fibonacci bottom-up tối ưu bộ nhớ cần bao nhiêu state trước?",
      "2",
      "n²",
      "Không state nào",
    ],
  ],
  bit: [
    ["x XOR x bằng gì?", "0", "x", "1 luôn"],
    ["Kiểm tra power-of-two cần điều kiện gì thêm?", "n>0", "n<0", "n=0"],
    [
      "XOR dùng khi mỗi số khác số duy nhất xuất hiện mấy lần?",
      "2",
      "3",
      "Bất kỳ",
    ],
    ["Bit k có trọng số gì?", "2ᵏ", "k²", "k+1"],
    [
      "Python int và C++ int có luôn cùng độ rộng?",
      "Không",
      "Có",
      "Chỉ khi số chẵn",
    ],
  ],
  trie: [
    [
      "Một cạnh trie thường giữ gì?",
      "Một ký tự",
      "Một mảng số",
      "Một đường graph bất kỳ",
    ],
    ["Prefix tồn tại có chắc là từ hoàn chỉnh?", "Không", "Có", "Chỉ từ dài"],
    ["Prefix rỗng khớp bao nhiêu từ?", "Tất cả từ", "0", "1 luôn"],
    [
      "Truy vấn prefix chi phí theo gì?",
      "Độ dài prefix",
      "Số giây cố định",
      "V²",
    ],
    ["Khi thiếu một cạnh prefix trả count gì?", "0", "-100", "Tổng tất cả từ"],
  ],
  dsu: [
    [
      "DSU find trả gì?",
      "Đại diện của tập",
      "Giá trị nhỏ nhất luôn",
      "Tổng cạnh",
    ],
    [
      "Union hai tập khác nhau thay components thế nào?",
      "Giảm 1",
      "Tăng 1",
      "Không đổi",
    ],
    [
      "Kruskal xét cạnh theo thứ tự nào?",
      "Trọng số tăng",
      "Nhãn node tăng",
      "Ngẫu nhiên",
    ],
    [
      "MST có giống shortest path tree luôn không?",
      "Không",
      "Có",
      "Chỉ với 3 node",
    ],
    [
      "Path compression làm gì?",
      "Rút ngắn đường tới đại diện",
      "Xóa mọi node",
      "Thêm chu trình",
    ],
  ],
  advanced: [
    [
      "Matrix-chain DP thử lựa chọn gì?",
      "Điểm chia đoạn k",
      "Một pivot ngẫu nhiên luôn",
      "Bỏ mọi ma trận",
    ],
    [
      "Tree DP lấy thông tin từ đâu?",
      "Trạng thái các cây con",
      "Chỉ độ rộng tầng",
      "Chỉ root",
    ],
    ["Counting Sort cần quan tâm gì?", "Phạm vi key", "Chỉ n", "Chỉ tên biến"],
    [
      "Một phản ví dụ cho thấy gì?",
      "Thuật toán không đúng mọi đầu vào",
      "Thuật toán luôn đúng",
      "Không có ý nghĩa",
    ],
    [
      "Qua nhiều test có tương đương chứng minh không?",
      "Không",
      "Có",
      "Chỉ với DP",
    ],
  ],
};
export function lessonMaterial(lesson) {
  const recall =
    topicQuestions[lessons[Math.max(0, lesson.id - 2)].pack][
      (lesson.id - 1) % 5
    ];
  return {
    ...lesson,
    recall: { prompt: recall[0], answer: recall[1], options: recall.slice(1) },
    itinerary: [
      { title: "Nhớ lại", minutes: 5 },
      { title: "Hiểu khái niệm", minutes: 8 },
      { title: "Xem mô phỏng", minutes: 10 },
      { title: "Tự thao tác", minutes: 8 },
      { title: "Viết code", minutes: 15 },
      { title: "Kiểm tra và ôn lỗi", minutes: 9 },
    ],
    interview: lesson.problemIds.filter((x) => interviewIds.includes(x)),
    corrections: corrections.filter((c) =>
      lesson.sourcePrefixes.includes(c.source),
    ),
  };
}
