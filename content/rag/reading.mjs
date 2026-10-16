// Reviewed lesson narratives and objective question explanations.
export const notes=[
  {
    "id": 1,
    "title": "RAG: người thủ thư tìm bằng chứng",
    "page": 8,
    "pids": [
      "lookup"
    ],
    "hook": "Thư viện đổi hạn trả sách: Bitty nên nhớ theo trí nhớ hay mở nội quy mới?",
    "analogy": "Thư viện đổi hạn trả sách: Bitty nên nhớ theo trí nhớ hay mở nội quy mới?",
    "concept": "Một người thủ thư giỏi tìm đúng phiếu trước khi trả lời. RAG cũng truy xuất tài liệu, đưa phần liên quan vào ngữ cảnh rồi mới tạo câu trả lời. Tài liệu giúp kiểm chứng và cập nhật thông tin, nhưng bản thân tài liệu vẫn có thể sai hoặc cũ. Hôm nay mình chỉ tra đúng ID và đọc câu trả lời đã có.",
    "algorithm": [
      "Đọc source Id được hỏi",
      "Duyệt các phiếu nguồn",
      "Nếu ID khớp, lấy answer của phiếu ấy",
      "Không có nguồn thì trả null"
    ],
    "trap": "Tìm được tài liệu không có nghĩa nội dung chắc chắn đúng; cần đọc ngày và phạm vi của nguồn.",
    "quiz": [
      [
        "RAG bổ sung điều gì trước bước trả lời?",
        "Ngữ cảnh lấy từ nguồn liên quan",
        "Tự đổi trọng số sau mỗi câu hỏi",
        "Bảo đảm mọi câu trả lời đều đúng",
        "Truy xuất cung cấp bằng chứng cho lượt hiện tại; nó không tự huấn luyện lại model."
      ],
      [
        "Không có phiếu ID X. Hàm tra nguồn nên trả gì?",
        "null để thể hiện thiếu nguồn",
        "Câu trả lời ở phiếu đầu tiên",
        "Chuỗi do chương trình đoán ra",
        "Hợp đồng yêu cầu ID chính xác, không có thì báo thiếu thay vì lấy nhầm phiếu."
      ],
      [
        "Nội quy mới B ghi14 ngày, bản A ghi7 ngày; yêu cầu source Id=B. Lấy nội dung nào?",
        "Nội dung phiếu B",
        "Nội dung A vì xuất hiện trước",
        "Trung bình7 và 14 ngày",
        "ID chỉ rõ nguồn cần đọc. Đúng phép tra chưa chứng minh B là chính sách hợp lệ ngoài dữ liệu bài."
      ]
    ],
    "terms": [
      "Retrieval|Tìm thông tin theo yêu cầu|Lấy phiếu B.",
      "Con text|Ngữ cảnh được đưa cho lượt trả lời|Đoạn nội quy đã lấy.",
      "Grounding|Gắn phát biểu với bằng chứng cụ thể|Đọc câu và nguồn đi kèm."
    ],
    "bridges": "input,dictionaries,conditions,functions",
    "example": "Đọc source Id được hỏi → Duyệt các phiếu nguồn → Nếu ID khớp, lấy answer của phiếu ấy → Không có nguồn thì trả null",
    "formula": "Không có nguồn thì trả null"
  },
  {
    "id": 2,
    "title": "Python: đọc một phiếu tài liệu",
    "page": 9,
    "pids": [
      "lookup"
    ],
    "hook": "Phiếu có tên và nội dung: lấy đúng phần mà không phải nhớ vị trí?",
    "analogy": "Phiếu có tên và nội dung: lấy đúng phần mà không phải nhớ vị trí?",
    "concept": "Dictionary giống tấm phiếu có các ô mang tên. doc[\"id\"] đọc mã phiếu, doc[\"answer\"] đọc nội dung. Vòng for lần lượt xem từng phiếu; return gửi kết quả về chỗ gọi. Chuỗi rỗng là giá trị đã có, khác với null nghĩa không tìm thấy phiếu.",
    "algorithm": [
      "Nhận danh sách docs",
      "Đọc khóa id của từng doc",
      "So id với source Id",
      "Return answer khi khớp, None khi không tìm thấy"
    ],
    "trap": "Không dùng if answer để quyết định nguồn tồn tại: chuỗi rỗng vẫn có thể là giá trị hợp lệ.",
    "quiz": [
      [
        "doc[\"answer\"] đọc gì?",
        "Giá trị trong ô tên answer",
        "Vị trí thứ hai của mọi danh sách",
        "Toàn bộ doc thành chuỗi",
        "Tên khóa cho biết phần dữ liệu; dictionary không yêu cầu nhớ chỉ số cột."
      ],
      [
        "Phiếu A tồn tại nhưng answer=\"\". Kết quả đúng?",
        "Chuỗi rỗng",
        "null",
        "Không thể phân biệt",
        "Tồn tại ID và nội dung rỗng là hai điều khác nhau. Đọc giá trị nguyên vẹn."
      ],
      [
        "Đảo thứ tự docs nhưng các ID duy nhất giữ nguyên; tra B thay đổi không?",
        "Không, vẫn tìm theo ID B",
        "Có, luôn lấy phiếu đầu",
        "Có, vì mọi ID là chỉ số",
        "Thuật toán xét ID nên vị trí phiếu không quyết định kết quả."
      ]
    ],
    "terms": [
      "Dictionary|Bảng khóa và giá trị|id và answer.",
      "Return|Gửi kết quả về nơi gọi|return doc[\"answer\"].",
      "None|Giá trị Python biểu thị không có|JSON chuyển thành null."
    ],
    "bridges": "variables,dictionaries,conditions,loops,functions",
    "example": "Nhận danh sách docs → Đọc khóa id của từng doc → So id với source Id → Return answer khi khớp, None khi không tìm thấy",
    "formula": "Return answer khi khớp, None khi không tìm thấy"
  },
  {
    "id": 3,
    "title": "Token và bộ tách từ đồ chơi",
    "page": 3,
    "pids": [
      "tokens"
    ],
    "hook": "Ba từ cách nhau bằng nhiều dấu cách có thành năm token không?",
    "analogy": "Ba từ cách nhau bằng nhiều dấu cách có thành năm token không?",
    "concept": "Trước khi model xử lý, văn bản được đổi thành các đơn vị gọi là token. Token thật có thể là mảnh từ hoặc ký tự. Để học thao tác, phòng này tách theo khoảng trắng và gắn nhãn đồ chơi: nhiều khoảng trắng liên tiếp không sinh thêm đơn vị. Không dùng số đếm này để ước tính hóa đơn hay giới hạn của model thật.",
    "algorithm": [
      "Đọc text",
      "Tách theo khoảng trắng liên tiếp",
      "Bỏ mảnh rỗng ở đầu và cuối",
      "Trả token s cùng số phần tử"
    ],
    "trap": "Một từ không luôn bằng một token trong token izer thật; dấu câu cũng phụ thuộc token izer.",
    "quiz": [
      [
        "Token thật có bắt buộc là một từ hoàn chỉnh?",
        "Không, có thể là mảnh từ hoặc ký tự",
        "Có, luôn đúng một từ",
        "Có, luôn đúng một câu",
        "Tokenizer quyết định đơn vị; ví dụ split chỉ để học thao tác."
      ],
      [
        "text=\"a b\" trong bộ tách của bài có count bao nhiêu?",
        "2",
        "3",
        "4",
        "Hai khoảng trắng là một ranh giới, không phải token rỗng."
      ],
      [
        "Dùng count của split để bảo đảm vừa con text của mọi LLM được không?",
        "Không; cần token izer/cách tính của model",
        "Được nếu văn bản tiếng Anh",
        "Được nếu ít dấu câu",
        "Tokenizer thật có vocabulary và quy tắc khác; split không cung cấp bảo đảm ấy."
      ]
    ],
    "terms": [
      "Token|Đơn vị token izer xử lý|Một mảnh từ.",
      "Tokenizer|Quy tắc đổi văn bản thành token|BPE là một họ cách tách.",
      "Whitespace|Khoảng trắng, tab, xuống dòng|a rồi tab rồi b."
    ],
    "bridges": "lists,functions",
    "example": "Đọc text → Tách theo khoảng trắng liên tiếp → Bỏ mảnh rỗng ở đầu và cuối → Trả token s cùng số phần tử",
    "formula": "Trả token s cùng số phần tử"
  },
  {
    "id": 4,
    "title": "Con text như chiếc ba lô có giới hạn",
    "page": 3,
    "pids": [
      "budget"
    ],
    "hook": "Ba lô còn4 ô: bỏ qua sách9 ô rồi lấy tờ giấy2 ô được không?",
    "analogy": "Ba lô còn4 ô: bỏ qua sách9 ô rồi lấy tờ giấy2 ô được không?",
    "concept": "Con text budget là số chỗ còn lại sau khi dành phần cho chỉ dẫn và câu trả lời. Mỗi chunk của bài có chi phí đã biết. Mình duyệt theo thứ tự, lấy phần vừa chỗ và bỏ qua phần quá lớn. Đây là chính sách đóng gói cụ thể; thư viện thật có thể báo lỗi hoặc cắt bớt theo cấu hình, không mặc định quên phần đầu.",
    "algorithm": [
      "Tính limit trừ reserved",
      "Đọc chunk theo thứ tự",
      "Nếu vừa thì thêm ID và giảm remaining",
      "Bỏ qua chunk không vừa, trả used và remaining"
    ],
    "trap": "Không cộng reserved vào chỗ trống, và không dừng khi gặp chunk quá lớn trong chính sách bài này.",
    "quiz": [
      [
        "limit15, reserved5 thì ngữ cảnh có bao nhiêu chỗ?",
        "10",
        "20",
        "15",
        "Phần reserved đã chiếm chỗ nên phải trừ khỏi limit."
      ],
      [
        "Còn4, chunk đầu9, chunk sau2. Bài này giữ gì?",
        "Chunk sau2",
        "Không giữ gì vì dừng ngay",
        "Chunk9 vì ưu tiên đầu",
        "Chính sách nói bỏ qua chunk không vừa rồi xét tiếp, khác giữ một tiền tố liên tiếp."
      ],
      [
        "Greedy theo thứ tự có luôn chọn bộ tài liệu hữu ích nhất?",
        "Không; cần mục tiêu đánh giá khác để so sánh",
        "Có, vì luôn vừa chỗ",
        "Có, nếu tài liệu nhiều hơn",
        "Đúng ngân sách không đồng nghĩa tối ưu độ liên quan hoặc độ phủ."
      ]
    ],
    "terms": [
      "Budget|Giới hạn tài nguyên được dùng|Còn10 đơn vị.",
      "Reserved|Phần để riêng trước khi lấy tài liệu|5 đơn vị cho đầu ra.",
      "Chunk|Một đoạn tài liệu|Đoạn nội quy."
    ],
    "bridges": "arithmetic,lists,conditions",
    "example": "Tính limit trừ reserved → Đọc chunk theo thứ tự → Nếu vừa thì thêm ID và giảm remaining → Bỏ qua chunk không vừa, trả used và remaining",
    "formula": "Bỏ qua chunk không vừa, trả used và remaining"
  },
  {
    "id": 5,
    "title": "LLM chọn token tiếp theo thế nào?",
    "page": 5,
    "pids": [
      "argmax"
    ],
    "hook": "Hai token cùng điểm: làm sao kết quả mô phỏng luôn tái hiện?",
    "analogy": "Hai token cùng điểm: làm sao kết quả mô phỏng luôn tái hiện?",
    "concept": "Decoder tạo phân bố/điểm cho token tiếp theo. Bài mô phỏng dùng bảng điểm công khai và chọn điểm lớn nhất; nếu hòa, chọn ID nhỏ nhất. Đây là greedy đồ chơi, không thể hiện toàn bộ model. Sinh nhiều token cần lặp với ngữ cảnh đã cập nhật; không phải mọi vị trí đầu ra được sinh độc lập cùng lúc.",
    "algorithm": [
      "Đọc các candidate và score",
      "So điểm giảm dần",
      "Khi bằng điểm, so ID ASCII tăng",
      "Trả ID đầu; không candidate thì null"
    ],
    "trap": "Điểm cao là ưu tiên theo model, không phải chứng nhận câu hoàn chỉnh đúng sự thật.",
    "quiz": [
      [
        "Greedy của bài chọn token nào?",
        "Score cao nhất; hòa theo ID",
        "Token dài nhất",
        "Token có ID lớn nhất",
        "Quy tắc định rõ score trước và ID sau để tái hiện."
      ],
      [
        "A=-1, B=-2. Chọn gì?",
        "A",
        "B",
        "null vì cả hai âm",
        "Âm vẫn so được; -1 lớn hơn -2. Null chỉ khi rỗng."
      ],
      [
        "Greedy cho câu đúng ngữ pháp nhưng sai ngày khai giảng. Kết luận nào đúng?",
        "Ưu tiên token không bảo đảm sự thật",
        "Score phải là 0 nếu sai",
        "Cứ chọn token khác là đúng",
        "Cần đối chiếu bằng chứng và đánh giá đầu ra, không suy chân lý từ score."
      ]
    ],
    "terms": [
      "Decoder|Phần tạo đầu ra từng bước|Chọn token kế tiếp.",
      "Greedy|Chọn tốt nhất ngay tại bước hiện tại|Lấy score cao nhất.",
      "Tie-break|Quy tắc phá hòa|ID ASCII nhỏ nhất."
    ],
    "bridges": "conditions,lists",
    "example": "Đọc các candidate và score → So điểm giảm dần → Khi bằng điểm, so ID ASCII tăng → Trả ID đầu; không candidate thì null",
    "formula": "Trả ID đầu; không candidate thì null"
  },
  {
    "id": 6,
    "title": "Attention: pha thông tin có trọng số",
    "page": 2,
    "pids": [
      "attention"
    ],
    "hook": "Một ly gồm25%thành phần2 và 75%thành phần6: kết quả là gì?",
    "analogy": "Một ly gồm25%thành phần2 và 75%thành phần6: kết quả là gì?",
    "concept": "Attention phối hợp các vector giá trị theo trọng số tính từ quan hệ giữa query và key. Bài nhập môn chỉ xét một chiều và trọng số cho sẵn: nhân từng value với phần trăm rồi cộng. Attention thật còn có phép chiếu, softmax và masking. Decoder self-attention che tương lai; cross-attention tới encoder không mặc nhiên dùng cùng mặt nạ tương lai.",
    "algorithm": [
      "Ghép weight với value cùng vị trí",
      "Nhân từng cặp",
      "Cộng các tích",
      "Chia100 để đổi phần trăm về trọng số"
    ],
    "trap": "Trọng số lớn thể hiện mức phối hợp trong phép tính, không phải lời giải thích đầy đủ cho suy nghĩ của model.",
    "quiz": [
      [
        "weights[25, 75], values[2, 6] cho tổng nào?",
        "5",
        "8",
        "4",
        "0.25 × 2+0.75 × 6=5; không lấy tổng hoặc trung bình không trọng số."
      ],
      [
        "Weight0 và value99 đóng góp bao nhiêu?",
        "0",
        "99",
        "Không tính được",
        "0 × 99/100=0. Giá trị lớn không đóng góp nếu trọng số bằng0."
      ],
      [
        "Chỉ từ attention weight có khẳng định model tin nguồn đúng không?",
        "Không; trọng số phối hợp khác độ đúng của nguồn",
        "Có, weight cao luôn đúng",
        "Có, nếu tổng100",
        "Phép toán trộn thông tin không tự kiểm chứng sự thật của nguồn."
      ]
    ],
    "terms": [
      "Attention|Phối hợp value theo trọng số|25%và 75%.",
      "Value|Thông tin được phối hợp|2 và 6.",
      "Mask|Điều kiện che vị trí không được đọc|Token tương lai."
    ],
    "bridges": "percentages,summation",
    "example": "Ghép weight với value cùng vị trí → Nhân từng cặp → Cộng các tích → Chia100 để đổi phần trăm về trọng số",
    "formula": "output=Σweightᵢ×valueᵢ/100"
  },
  {
    "id": 7,
    "title": "Prompt có nguồn, ràng buộc và đầu ra",
    "page": 4,
    "pids": [
      "citations"
    ],
    "hook": "Một câu nghe rất chắc nhưng gắn nguồn không chứa câu ấy: có nhận không?",
    "analogy": "Một câu nghe rất chắc nhưng gắn nguồn không chứa câu ấy: có nhận không?",
    "concept": "Prompt hữu ích nêu nhiệm vụ, nguồn được dùng và cách báo thiếu bằng chứng. Mình đặt nguồn thành dữ liệu riêng với chỉ dẫn. Trong phòng này, checker chỉ xác nhận quote không rỗng, source Id tồn tại và chứa đúng đoạn trích. Không suy từ một câu trích đúng rằng mọi lập luận quanh nó cũng đúng.",
    "algorithm": [
      "Đọc từng claim",
      "Tìm source Id trong source s",
      "Kiểm quote không rỗng và có nguyên văn",
      "Ghi supported cho từng claim"
    ],
    "trap": "Tên nguồn hợp lệ chưa đủ: nội dung trích cũng phải có trong nguồn.",
    "quiz": [
      [
        "Điều nào giúp kiểm chứng câu trả lời?",
        "Gắn phát biểu với đoạn và ID nguồn",
        "Chỉ yêu cầu giọng thật tự tin",
        "Chỉ tăng độ dài câu trả lời",
        "Nguồn có thể đối chiếu cho phép kiểm bằng chứng cụ thể."
      ],
      [
        "source Id đúng nhưng quote rỗng có supported=true?",
        "Không",
        "Có vì rỗng là chuỗi con",
        "Có nếu câu ngắn",
        "Bài cấm quote rỗng để tránh trường hợp chuỗi rỗng khớp mọi nguồn."
      ],
      [
        "Nguồn chứa “7 days”, câu trả lời trích “14 days”. Kết quả?",
        "Không được hỗ trợ bởi đoạn trích",
        "Được vì cùng đơn vịdays",
        "Được vì có source Id",
        "So nguyên văn theo hợp đồng; cùng chủ đề không thay thế bằng chứng."
      ]
    ],
    "terms": [
      "Instruction|Yêu cầu dành cho hệ thống|Trả lời kèm nguồn.",
      "Citation|Dẫn chiếu tới bằng chứng|NguồnA, đoạn nguyên văn.",
      "Claim|Một phát biểu cần kiểm|Thư viện mở 9 giờ."
    ],
    "bridges": "lists,dictionaries,conditions",
    "example": "Đọc từng claim → Tìm source Id trong source s → Kiểm quote không rỗng và có nguyên văn → Ghi supported cho từng claim",
    "formula": "Ghi supported cho từng claim"
  },
  {
    "id": 8,
    "title": "RAG, fine-tuning và RLHF khác nhau",
    "page": 6,
    "pids": [
      "route"
    ],
    "hook": "Đổi giờ mở cửa hay đổi phong cách trả lời: có cần cùng một cách xử lý?",
    "analogy": "Đổi giờ mở cửa hay đổi phong cách trả lời: có cần cùng một cách xử lý?",
    "concept": "RAG mang nguồn vào lúc trả lời; fine-tuning cập nhật tham số bằng huấn luyện. SFT học từ ví dụ hướng dẫn/đáp án; RLHF dùng phản hồi sở thích trong một quy trình tối ưu. Không cách nào tự bảo đảm sự thật hoặc an toàn. Trong bài, tin mới chọn retrieve, phong cách chọn fine-tune, yêu cầu mơ hồ chọn clarify.",
    "algorithm": [
      "Đọc need của request",
      "fresh-facts chọn retrieve",
      "style chọn fine-tune",
      "Trường hợp unk now n chọn clarify"
    ],
    "trap": "Hai kỹ thuật có thể dùng cùng nhau; bảng phân loại này là quy tắc nhập môn, không phải quyết định duy nhất cho mọi dự án.",
    "quiz": [
      [
        "RAG thông thường thay đổi gì trong lượt hỏi?",
        "Ngữ cảnh được cung cấp",
        "Mọi trọng số model",
        "Tự tạo một reward model",
        "Nó cung cấp tài liệu cho inference; không tự cập nhật tham số."
      ],
      [
        "Chỉ thêm nội dung vào prompt có phải fine-tuning?",
        "Không; chưa có cập nhật tham số qua huấn luyện",
        "Có; model đã đọc văn bản",
        "Có nếu dùng nhiều ví dụ",
        "In-con text examples và huấn luyện là hai cơ chế khác nhau."
      ],
      [
        "Giờ làm việc đổi hằng ngày, theo policy bài chọn gì?",
        "retrieve",
        "fine-tune",
        "clarify dù đã rõ yêu cầu",
        "Nguồn cập nhật phù hợp với tin thay đổi; vẫn phải kiểm thời gian và quyền."
      ]
    ],
    "terms": [
      "Fine-tuning|Huấn luyện tiếp để cập nhật tham số|Học theo dữ liệu nhiệm vụ.",
      "SFT|Huấn luyện có giám sát từ ví dụ|Chỉ dẫn và đáp án.",
      "RLHF|Học từ phản hồi sở thích của con người|Một pipeline tối ưu phản hồi."
    ],
    "bridges": "dictionaries,conditions",
    "example": "Đọc need của request → fresh-facts chọn retrieve → style chọn fine-tune → Trường hợp unk now n chọn clarify",
    "formula": "Trường hợp unk now n chọn clarify"
  },
  {
    "id": 9,
    "title": "Kiểm tra: LLM và bằng chứng",
    "page": 8,
    "pids": [
      "tokens",
      "budget"
    ],
    "hook": "Tự giải thích và xử lý dữ liệu mới.",
    "analogy": "Tự giải thích và xử lý dữ liệu mới.",
    "concept": "Kiểm tra token đồ chơi, ngữ cảnh và giới hạn của LLM.",
    "algorithm": [
      "Đọc hợp đồng",
      "Tính kết quả",
      "Viết code",
      "Kiểm tra biên"
    ],
    "trap": "Kiến thức và code đều phải đạt.",
    "quiz": [],
    "terms": [],
    "bridges": "lists,dictionaries,loops,functions",
    "example": "Đọc hợp đồng → Tính kết quả → Viết code → Kiểm tra biên",
    "formula": "Kiểm tra biên"
  },
  {
    "id": 10,
    "title": "Nạp nguồn và giữ metadata",
    "page": 9,
    "pids": [
      "filter"
    ],
    "hook": "Cùng tên nội quy nhưng thuộc hai trường: Bitty được đọc bản nào?",
    "analogy": "Cùng tên nội quy nhưng thuộc hai trường: Bitty được đọc bản nào?",
    "concept": "Loader lấy văn bản cùng metadata như ID, trang, ngày và phạm vi truy cập. Nội dung mất metadata sẽ khó truy nguyên và khó áp quyền. Bài dùng tenant như tên phạm vi: trước khi xếp hạng, chỉ giữ nguồn thuộc tenant hiện tại và chưa hết hạn. Nội dung nguồn không được tự thay đổi tenant của yêu cầu.",
    "algorithm": [
      "Đọc tenant và now đáng tin cậy",
      "Xem tenant của từng nguồn",
      "Kiểm expiresAt lớn hơn now",
      "Giữ ID hợp lệ theo thứ tự gốc"
    ],
    "trap": "Lọc quyền sau khi gửi tài liệu cho LLM là quá muộn: dữ liệu đã lọt vào con text.",
    "quiz": [
      [
        "Metadata có ích gì ngoài nội dung?",
        "Truy vết nguồn và lọc phạm vi",
        "Tự sửa mọi thông tin sai",
        "Thay luôn việc đọc tài liệu",
        "ID, thời gian và tenant hỗ trợ quyết định trước khi cung cấp nguồn."
      ],
      [
        "expiresAt=now có còn hạn theo bài?",
        "Không",
        "Có thêm một lượt hỏi",
        "Có nếu điểm truy xuất cao",
        "Hợp đồng dùng dấu>, bằng nhau đã hết hiệu lực."
      ],
      [
        "Nguồn liên quan nhất thuộc tenant khác. Xử lý?",
        "Loại trước bước xếp hạng/ngữ cảnh",
        "Giữ vì score cao",
        "Cho prompt tự quyết quyền",
        "Quyền là ràng buộc bên ngoài nội dung truy xuất."
      ]
    ],
    "terms": [
      "Metadata|Thông tin kèm nội dung|ID, trang, tenant.",
      "Tenant|Phạm vi dữ liệu tách biệt|TrườngA.",
      "Provenance|Dấu vết nguồn gốc|File và trang gốc."
    ],
    "bridges": "dictionaries,conditions",
    "example": "Đọc tenant và now đáng tin cậy → Xem tenant của từng nguồn → Kiểm expiresAt lớn hơn now → Giữ ID hợp lệ theo thứ tự gốc",
    "formula": "Giữ ID hợp lệ theo thứ tự gốc"
  },
  {
    "id": 11,
    "title": "Cắt tài liệu thành các đoạn vừa tay",
    "page": 9,
    "pids": [
      "chunks"
    ],
    "hook": "Tờ nội quy dài: cắt từng3 từ và giữ vị trí để ghép lại?",
    "analogy": "Tờ nội quy dài: cắt từng3 từ và giữ vị trí để ghép lại?",
    "concept": "Chunk là một đoạn được truy xuất riêng. Đoạn cần đủ ngữ cảnh để hiểu và đủ nhỏ để tìm phần liên quan. Phòng này cắt mảng token theo kích thước cho sẵn, giữ start làm vị trí nguồn. Trước tiên dùng overlap0 để thấy các đoạn nối nhau. Không có kích thước tốt nhất chung cho mọi tài liệu.",
    "algorithm": [
      "Bắt đầu tại chỉ số 0",
      "Lấy tối đa size token",
      "Nếu đã phủ cuối thì dừng",
      "Nếu chưa, chuyển start thêm size-overlap"
    ],
    "trap": "Không tạo một chunk rỗng khi số token chia hết size.",
    "quiz": [
      [
        "Vì sao giữ start của chunk?",
        "Để lần về vị trí trong tài liệu gốc",
        "Để score luôn cao",
        "Để không cần source Id",
        "Vị trí giúp đối chiếu trích đoạn và kiểm mất/trùng nội dung."
      ],
      [
        "6 token, size3, overlap0 có bao nhiêu đoạn?",
        "2",
        "3 vì thêm đoạn rỗng",
        "1",
        "Hai đoạn start0 và 3 đã phủ hết, không có đoạn start6 rỗng."
      ],
      [
        "Nội dung trả lời bị tách giữa hai đoạn. Điều chỉnh gì cần thử?",
        "Ranh giới đoạn hoặc overlap và đo lại retrieval",
        "Luôn giảm size về 1",
        "Xóa source Id cho gọn",
        "Cần giữ ngữ cảnh và kiểm trên câu hỏi thật, không chọn số tùy ý."
      ]
    ],
    "terms": [
      "Chunk|Đoạn được tìm độc lập|Ba token một đoạn.",
      "Start|Chỉ số đầu của đoạn|0 hoặc3.",
      "Size|Số token tối đa trong đoạn|size=3."
    ],
    "bridges": "lists,loops",
    "example": "Bắt đầu tại chỉ số 0 → Lấy tối đa size token → Nếu đã phủ cuối thì dừng → Nếu chưa, chuyển start thêm size-overlap",
    "formula": "start kế tiếp = start + size − overlap"
  },
  {
    "id": 12,
    "title": "Overlap: nối ngữ cảnh mà không lặp thừa",
    "page": 9,
    "pids": [
      "chunks"
    ],
    "hook": "Kéo hai mảnh giấy chồng một ô: ô bắt đầu kế tiếp ở đâu?",
    "analogy": "Kéo hai mảnh giấy chồng một ô: ô bắt đầu kế tiếp ở đâu?",
    "concept": "Overlap giúp hai đoạn chia sẻ một phần ngữ cảnh. Với size3 và overlap1, start tăng2 chứ không tăng3. Khi một đoạn đã phủ tới cuối, ta dừng để tránh tạo thêm đoạn chỉ lặp phần đuôi. Overlap quá nhiều tăng dung lượng và có thể lặp cùng bằng chứng trong con text.",
    "algorithm": [
      "Tính bước trượt size-overlap",
      "Cắt đoạn tại start hiện tại",
      "Kiểm đoạn đã chạm cuối hay chưa",
      "Chỉ chuyển start nếu còn phần chưa phủ"
    ],
    "trap": "overlap phải nhỏ hơn size; nếu bằng size thì bước trượt0 không tiến lên.",
    "quiz": [
      [
        "size4, overlap1 thì bước trượt là bao nhiêu?",
        "3",
        "4",
        "5",
        "Phần chồng1 được giữ lại nên chuyển thêm4−1=3."
      ],
      [
        "Có 2 token, size2, overlap1. Có cần đoạn thứ hai?",
        "Không; đoạn đầu đã phủ hết",
        "Có; phải lặp token cuối",
        "Có; tới khi start bằng len",
        "Điều kiện dừng là đã phủ cuối, tránh tạo đuôi dư."
      ],
      [
        "Overlap tăng từ 1 lên2 với size3 thì điều gì thường tăng?",
        "Số đoạn và token lưu lặp",
        "Số từ gốc của tài liệu",
        "Độ đúng được bảo đảm",
        "Bước trượt giảm làm nhiều đoạn chồng nhau hơn; chất lượng cần đo riêng."
      ]
    ],
    "terms": [
      "Overlap|Phần chung của hai đoạn liên tiếp|Một token lặp ở ranh giới.",
      "Stride|Mức dịch điểm bắt đầu|size−overlap.",
      "Coverage|Phần tài liệu đã được phủ|Dừng khi chạm cuối."
    ],
    "bridges": "arithmetic,lists,loops",
    "example": "Tính bước trượt size-overlap → Cắt đoạn tại start hiện tại → Kiểm đoạn đã chạm cuối hay chưa → Chỉ chuyển start nếu còn phần chưa phủ",
    "formula": "start kế tiếp = start + size − overlap"
  },
  {
    "id": 13,
    "title": "Vector đồ chơi: đếm từ thành tọa độ",
    "page": 10,
    "pids": [
      "bow"
    ],
    "hook": "Đếm book vàdays: làm sao biến một đoạn thành hai con số?",
    "analogy": "Đếm book vàdays: làm sao biến một đoạn thành hai con số?",
    "concept": "Vector là danh sách số theo các chiều có ý nghĩa đã định. Mình dùng từ điển cố định và đếm mỗi từ để nhìn được từng con số. Đây là bag-of-words, khác embedding học được từ dữ liệu. Từ “book” lặp hai lần tạo số 2 ở đúng chiều; từ ngoài từ điển không tạo chiều mới.",
    "algorithm": [
      "Đọc vocab theo thứ tự",
      "Đếm từng từ vocab trong token s",
      "Bỏ từ ngoài vocab",
      "Trả vector cùng thứ tự vocab"
    ],
    "trap": "Không đổi thứ tự vocab ở phía query so với phía tài liệu; cùng số chiều chưa đủ nếu ý nghĩa chiều khác nhau.",
    "quiz": [
      [
        "vocab[book, days], token s[book, book] cho vector nào?",
        "[2, 0]",
        "[0, 2]",
        "[1, 0]",
        "Đếm tần suất và giữ vị trí của vocab."
      ],
      [
        "Từ ngoài vocab có tạo một chiều mới không?",
        "Không trong hợp đồng này",
        "Có ở đầu vector",
        "Có nếu từ dài",
        "Số chiều cố định bằng số mục vocab; việc mở rộng cần đổi cả hai phía."
      ],
      [
        "Query dùng[book, days], doc dùng[days, book]. Có so trực tiếp được không?",
        "Không; phải thống nhất ý nghĩa chiều",
        "Được vì đều2 chiều",
        "Được nếu cosine dương",
        "Đổi thứ tự biến các tọa độ thành đại lượng khác."
      ]
    ],
    "terms": [
      "Vector|Danh sách tọa độ theo chiều cố định|[2, 0].",
      "Vocabulary|Từ điển quy định các chiều|book, days.",
      "Bag-of-words|Biểu diễn đếm từ|Không hiểu từ đồng nghĩa."
    ],
    "bridges": "lists,loops",
    "example": "Đọc vocab theo thứ tự → Đếm từng từ vocab trong token s → Bỏ từ ngoài vocab → Trả vector cùng thứ tự vocab",
    "formula": "Trả vector cùng thứ tự vocab"
  },
  {
    "id": 14,
    "title": "Cosine: so hướng, không chỉ độ dài",
    "page": 10,
    "pids": [
      "cosine"
    ],
    "hook": "Hai mũi tên dài khác nhau nhưng cùng hướng có giống nhau không?",
    "analogy": "Hai mũi tên dài khác nhau nhưng cùng hướng có giống nhau không?",
    "concept": "Cosine đo độ đồng hướng: nhân cặp tọa độ rồi chia cho tích độ dài. Hai vector cùng hướng có cosine1 dù dài khác nhau; ngược hướng có thể−1. Vector0 không có hướng nên bài trả null. Các điểm trên hình là vector số giả lập, không chứng minh ngữ nghĩa của văn bản thật.",
    "algorithm": [
      "Tính tích vô hướng của a, b",
      "Tính tổng bình phương từng vector",
      "Nếu có độ dài0 thì trả null",
      "Chia dot cho căn tích hai tổng bình phương"
    ],
    "trap": "Cosine không bị giới hạn0..1 với vector bất kỳ; nó có thể âm.",
    "quiz": [
      [
        "a[1, 0], b[2, 0] có cosine bao nhiêu?",
        "1",
        "2",
        "0.5",
        "Chuẩn hóa độ dài loại tác động nhân cùng một hệ số dương."
      ],
      [
        "a[1, 0], b[-1, 0] có cosine bao nhiêu?",
        "-1",
        "0",
        "1",
        "Hai hướng đối nhau cho dot âm và cosine−1."
      ],
      [
        "Một vector[0, 0] thì làm gì theo hợp đồng?",
        "Trả null",
        "Tự coi cosine1",
        "Chia trực tiếp cho0",
        "Vector0 không có hướng; null thể hiện phép so này chưa xác định."
      ]
    ],
    "terms": [
      "Cosine|Tích vô hướng chuẩn hóa|Cùng hướng bằng1.",
      "Norm|Độ dài vector|Căn tổng bình phương.",
      "Dot product|Tổng tích tọa độ cùng vị trí|1 × 2+0 × 0."
    ],
    "bridges": "coordinates,summation",
    "example": "Tính tích vô hướng của a, b → Tính tổng bình phương từng vector → Nếu có độ dài0 thì trả null → Chia dot cho căn tích hai tổng bình phương",
    "formula": "cos(a, b)=Σaᵢbᵢ / (‖a‖‖b‖)"
  },
  {
    "id": 15,
    "title": "Tìm top-K trong không gian vector",
    "page": 10,
    "pids": [
      "vector"
    ],
    "hook": "Có bốn phiếu trên mặt phẳng: giữ hai phiếu cùng hướng nhất?",
    "analogy": "Có bốn phiếu trên mặt phẳng: giữ hai phiếu cùng hướng nhất?",
    "concept": "Dense retrieval xếp các vector tài liệu theo độ tương tự với vector query. Bài dùng hai chiều để nhìn được hướng và điểm. Không so vector từ hai model khác nhau chỉ vì chúng cùng chiều. Top-K luôn bị giới hạn bởi nguồn có trong index; điểm cao không bảo đảm tài liệu có đúng câu trả lời.",
    "algorithm": [
      "Kiểm query có hướng không",
      "Tính cosine từng doc khác vector0",
      "Sắp score giảm và ID tăng khi hòa",
      "Lấy tối đa k kết quả"
    ],
    "trap": "Đừng tự loại điểm âm nếu hợp đồng vẫn lấy top-K; chỉ vector0 được loại ở đây.",
    "quiz": [
      [
        "K=0 cần trả gì?",
        "[]",
        "Nguồn cao nhất",
        "null",
        "Lấy tối đa0 phần tử là danh sách rỗng."
      ],
      [
        "Hai doc cùng cosine1, ID BvàA. Ai đứng trước?",
        "A",
        "B vì tới trước",
        "Tùy mỗi lần chạy",
        "Luật hòa ASCII giúp kết quả tái hiện, không dựa thứ tự đầu vào."
      ],
      [
        "Model embedding được đổi. Có giữ nguyên vector doc cũ rồi query mới không?",
        "Không; cần tương thích và tái lập chỉ mục thích hợp",
        "Có nếu cùng số chiều",
        "Có vì cosine tự đổi model",
        "Ý nghĩa không gian có thể thay đổi dù kích thước bằng nhau."
      ]
    ],
    "terms": [
      "Top-K|Tối đaKkết quả theo thứ hạng|Chọn hai phiếu.",
      "Index|Cấu trúc lưu và tìm vector|Tập doc đã nạp.",
      "Dense retrieval|Truy xuất theo vector|So cosine."
    ],
    "bridges": "lists,conditions",
    "example": "Kiểm query có hướng không → Tính cosine từng doc khác vector0 → Sắp score giảm và ID tăng khi hòa → Lấy tối đa k kết quả",
    "formula": "Lấy tối đa k kết quả"
  },
  {
    "id": 16,
    "title": "Từ khóa và ý nghĩa: hai cách tìm",
    "page": 11,
    "pids": [
      "retrieve"
    ],
    "hook": "Câu hỏi nhắc mã sản phẩm hiếm: tìm đúng từ có thể hữu ích thế nào?",
    "analogy": "Câu hỏi nhắc mã sản phẩm hiếm: tìm đúng từ có thể hữu ích thế nào?",
    "concept": "Tìm từ khóa giữ tốt các mã và thuật ngữ xuất hiện nguyên văn; dense retrieval có thể tìm những cách diễn đạt gần nghĩa. Bài cài giao tập từ đơn giản: mỗi từ query chỉ đóng góp một điểm nếu có trong doc. Đây không phải BM25 vì chưa có ID F, độ dài và bão hòa tần suất.",
    "algorithm": [
      "Khử trùng từ query",
      "Tạo tập từ của từng doc",
      "Đếm phần giao",
      "Bỏ score0 rồi xếp score giảm, ID tăng, lấy k"
    ],
    "trap": "Lặp một từ nhiều lần không tạo thêm điểm trong bộ chấm này.",
    "quiz": [
      [
        "Query[a, a, b], doc[a, a] có điểm mấy?",
        "1",
        "2",
        "3",
        "Tập query là{a, b}; phần giao chỉ cóa."
      ],
      [
        "Gọi phép đếm giao từ này là BM25 có chính xác không?",
        "Không; còn thiếu các thành phần BM25",
        "Có; mọi search từ khóa đều BM25",
        "Có nếu query ít từ",
        "BM25 có công thức thống kê khác, phải gọi đúng mô hình đang dùng."
      ],
      [
        "Tài liệu không có từ query nhưng nói đồng nghĩa. Bài keyword này tìm được chắc không?",
        "Không; có thể bị bỏ dù liên quan",
        "Có vì đã hiểu nghĩa",
        "Có nếu tăngKvô hạn",
        "Điểm0 bị bỏ; thêmKkhông tự tạo khả năng hiểu từ đồng nghĩa."
      ]
    ],
    "terms": [
      "Sparse retrieval|Tìm theo đặc trưng từ khóa thưa|Mã sản phẩm.",
      "Intersection|Phần tử có ở cả hai tập|a.",
      "BM25|Công thức xếp hạng từ khóa thống kê|Không phải phép giao đơn thuần."
    ],
    "bridges": "lists,loops",
    "example": "Khử trùng từ query → Tạo tập từ của từng doc → Đếm phần giao → Bỏ score0 rồi xếp score giảm, ID tăng, lấy k",
    "formula": "Bỏ score0 rồi xếp score giảm, ID tăng, lấy k"
  },
  {
    "id": 17,
    "title": "ID ổn định và gộp tài liệu trùng",
    "page": 12,
    "pids": [
      "dedup"
    ],
    "hook": "Hai truy vấn cùng tìm thấy phiếuA: có nên gửiAhai lần?",
    "analogy": "Hai truy vấn cùng tìm thấy phiếuA: có nên gửiAhai lần?",
    "concept": "Nhiều bước tìm kiếm có thể trả cùng một tài liệu. Gộp theo ID giúp tránh tốn ngữ cảnh vì bản lặp. Bài giữ thứ tự lần xuất hiện đầu tiên để không tự thay đổi ưu tiên. Hai đoạn khác nhau của cùng file nên có ID đoạn riêng; giống chữ không tự có nghĩa cùng nguồn.",
    "algorithm": [
      "Khởi tạo seen và danh sách kết quả",
      "Duyệt các bảng theo thứ tự",
      "Nếu ID chưa thấy, thêm vào kết quả",
      "Đánh dấu đã thấy và bỏ các lần lặp sau"
    ],
    "trap": "Dùng set rồi sort có thể thay đổi thứ tự cần giữ; phải nhớ lần xuất hiện đầu.",
    "quiz": [
      [
        "lists[[B, A],[A, C]] cho gì?",
        "[B, A, C]",
        "[A, B, C]",
        "[B, A, A, C]",
        "Bđến trướcA; Alặp ở bảng sau không được thêm lại."
      ],
      [
        "Hai chunk cùng file nhưng khác vị trí nên dùng cùng ID không?",
        "Không; cần ID đoạn riêng để truy vết",
        "Có vì tên file giống",
        "Có nếu cùng số từ",
        "ID nguồn và ID đoạn phục vụ mức định danh khác nhau."
      ],
      [
        "Gộp ba bản sao tài liệuA có tăng recall khi cầnAvàBkhông?",
        "Không; vẫn chỉ tìm đượcA",
        "Có; ba bản bằng ba hit",
        "Có nếuAđúng sự thật",
        "Recall dùng tài liệu liên quan duy nhất, bản sao không thay nguồnB."
      ]
    ],
    "terms": [
      "Deduplication|Loại phần tử trùng theo khóa|Mỗi ID một lần.",
      "Stable order|Giữ thứ tự đã quy định|Lần xuất hiện đầu.",
      "Chunk ID|Mã riêng cho một đoạn|FileA: trang2: đoạn1."
    ],
    "bridges": "lists,dictionaries,loops",
    "example": "Khởi tạo seen và danh sách kết quả → Duyệt các bảng theo thứ tự → Nếu ID chưa thấy, thêm vào kết quả → Đánh dấu đã thấy và bỏ các lần lặp sau",
    "formula": "Đánh dấu đã thấy và bỏ các lần lặp sau"
  },
  {
    "id": 18,
    "title": "Kiểm tra: nạp nguồn và truy xuất",
    "page": 11,
    "pids": [
      "chunks",
      "retrieve"
    ],
    "hook": "Tự chia tài liệu rồi tìm đúng đoạn.",
    "analogy": "Tự chia tài liệu rồi tìm đúng đoạn.",
    "concept": "Kiểm tra chuẩn bị nguồn, overlap, vector và từ khóa.",
    "algorithm": [
      "Đọc hợp đồng",
      "Tính kết quả",
      "Viết code",
      "Kiểm tra biên"
    ],
    "trap": "Đáp án khác thứ tự chỉ đúng khi đặc tả cho phép.",
    "quiz": [],
    "terms": [],
    "bridges": "lists,dictionaries,loops,functions",
    "example": "Đọc hợp đồng → Tính kết quả → Viết code → Kiểm tra biên",
    "formula": "start kế tiếp = start + size − overlap"
  },
  {
    "id": 19,
    "title": "Hybrid search: trộn thứ hạng bằng RR F",
    "page": 13,
    "pids": [
      "rrf"
    ],
    "hook": "Một bộ tìm cho điểm0.9, bộ kia12: cộng thẳng có công bằng không?",
    "analogy": "Một bộ tìm cho điểm0.9, bộ kia12: cộng thẳng có công bằng không?",
    "concept": "Hai bộ tìm kiếm có thể dùng thang điểm khác nhau. RR F trộn vị trí trong bảng hạng thay vì cộng raw score. Mỗi ID nhận1/(c+rank)từ mỗi bảng có nó, rank bắt đầu1. Nhờ đó tài liệu xuất hiện cao ở nhiều bảng có thêm đóng góp. Đây là chiến lược cần đánh giá, không bảo đảm luôn tốt hơn từng bộ.",
    "algorithm": [
      "Đọc mỗi bảng xếp hạng",
      "Đếm rank từ 1",
      "Cộng1/(c+rank)vào điểm ID",
      "Sắp điểm tổng giảm, hòa ID rồi lấy k"
    ],
    "trap": "Không dùng rank0; c=1 và hạng1 phải đóng góp1/2, không phải1.",
    "quiz": [
      [
        "Vì sao RR F dùng rank thay raw score?",
        "Giảm phụ thuộc vào thang điểm khác nhau",
        "Vì rank luôn là xác suất",
        "Vì không cần tài liệu nguồn",
        "Vị trí có thể kết hợp khi cosine và điểm từ khóa không cùng thang."
      ],
      [
        "c1, rank1 đóng góp bao nhiêu?",
        "0.5",
        "1",
        "2",
        "Công thức1/(1+1)=0.5 với rank bắt đầu1."
      ],
      [
        "Một ID không có trong bảng thứ hai nhận đóng góp gì từ bảng đó?",
        "0",
        "1/(c+1)",
        "Bị loại khỏi mọi bảng",
        "Thiếu trong một bảng không tạo điểm nhưng vẫn giữ đóng góp từ bảng khác."
      ]
    ],
    "terms": [
      "Hybrid search|Kết hợp các cách truy xuất|Sparse và dense.",
      "RR F|Cộng nghịch đảo thứ hạng có hằng số|1/(c+rank).",
      "Rank|Vị trí bắt đầu từ 1|Nguồn đứng đầu."
    ],
    "bridges": "fractions,summation",
    "example": "Đọc mỗi bảng xếp hạng → Đếm rank từ 1 → Cộng1/(c+rank)vào điểm ID → Sắp điểm tổng giảm, hòa ID rồi lấy k",
    "formula": "RR F(d)=Σ 1/(c+rank(d))"
  },
  {
    "id": 20,
    "title": "Re rank ing: đọc kỹ những ứng viên đã có",
    "page": 11,
    "pids": [
      "rerank"
    ],
    "hook": "NguồnZrất tốt nhưng chưa có trong giỏ ứng viên: re rank er có tự lấy được?",
    "analogy": "NguồnZrất tốt nhưng chưa có trong giỏ ứng viên: re rank er có tự lấy được?",
    "concept": "Retriever tìm ứng viên từ kho lớn; re rank er đánh giá lại từng cặp query–tài liệu trong tập đã lấy. Bài dùng bảng score cung cấp sẵn để tập trung vào ranh giới này. Nó chỉ sắp các candidate, dù bảng score s có thêm ID khác. Cross-encoder thật cần model riêng; phòng học không giả đã chạy model ấy.",
    "algorithm": [
      "Đọc tập candidate s từ retrieval",
      "Tra score của từng candidate",
      "Xếp giảm score, hòa theo ID",
      "Lấy top k trong candidate s"
    ],
    "trap": "Re rank không sửa được việc nguồn cần thiết hoàn toàn vắng trong candidate s.",
    "quiz": [
      [
        "Re rank er của bài được xếp tài liệu nào?",
        "Chỉ ID trong candidate s",
        "Mọi ID trong score s",
        "Mọi tài liệu trên Internet",
        "Tập ứng viên giới hạn phạm vi xếp lại."
      ],
      [
        "Z score100 nhưng candidate s=[A, B]. Có đưaZvào không?",
        "Không",
        "Có vì 100 cao nhất",
        "Có nếuK=3",
        "Score ngoài candidate s không cho phép mở rộng tập nguồn."
      ],
      [
        "Recall của candidate s thấp nên sửa gì trước?",
        "Bước retrieval và độ phủ ứng viên",
        "Chỉ đổi màu biểu đồ",
        "Chỉ xếp lại cùng tập nhiều lần",
        "Không có nguồn trong tập thì re rank er không có dữ liệu để chọn nó."
      ]
    ],
    "terms": [
      "Candidate|Ứng viên đã lấy ở bước đầu|AhoặcB.",
      "Re rank er|Bộ xếp hạng lại ứng viên|Đọc cặp query–doc.",
      "Cross-encoder|Model chấm cặp query, tài liệu cùng nhau|Có chi phí riêng."
    ],
    "bridges": "lists,dictionaries",
    "example": "Đọc tập candidate s từ retrieval → Tra score của từng candidate → Xếp giảm score, hòa theo ID → Lấy top k trong candidate s",
    "formula": "Lấy top k trong candidate s"
  },
  {
    "id": 21,
    "title": "Lắp con text và nén có trách nhiệm",
    "page": 13,
    "pids": [
      "budget"
    ],
    "hook": "Nén một quy định mà bỏ chữ “không”: có còn là cùng bằng chứng?",
    "analogy": "Nén một quy định mà bỏ chữ “không”: có còn là cùng bằng chứng?",
    "concept": "Con text nên có đoạn liên quan, ID và đủ điều kiện của phát biểu. Nén trích xuất giữ nguyên câu được chọn; nén diễn đạt lại có thể làm mất phủ định, ngoại lệ hoặc đơn vị. Mình chỉ đóng gói những đoạn có chi phí cho sẵn. Sau khi vừa ngân sách vẫn phải kiểm nội dung và nguồn.",
    "algorithm": [
      "Trừ reserved khỏi limit",
      "Duyệt các chunk theo ưu tiên đã có",
      "Lấy đoạn còn vừa ngân sách",
      "Báo ID, used, remaining để kiểm lại"
    ],
    "trap": "Vừa con text không chứng minh đủ ý; đoạn bị bỏ có thể chứa điều kiện quan trọng.",
    "quiz": [
      [
        "Nén có nguy cơ gì với câu “không trả hàng sau7 ngày”?",
        "Mất phủ định hoặc điều kiện có thể đảo nghĩa",
        "Luôn giữ nghĩa khi ít từ hơn",
        "Chỉ ảnh hưởng tốc độ",
        "Rút ngắn phải kiểm lại điều kiện và nguồn, không chỉ đếm token."
      ],
      [
        "limit10, reserved10 và đoạn cost1 có lấy được không?",
        "Không",
        "Có vìlimit10",
        "Có nếu đoạn liên quan nhất",
        "Không còn ngân sách cho đoạn nào: 10−10=0."
      ],
      [
        "Sau nén còn câu nhưng mất source Id, cần làm gì?",
        "Giữ hoặc khôi phục liên kết tới nguồn",
        "Bịa một ID cho đẹp",
        "Bỏ kiểm trích dẫn",
        "Truy vết nguồn là một phần hợp đồng dữ liệu, không chỉ trang trí."
      ]
    ],
    "terms": [
      "Compression|Rút gọn ngữ cảnh|Chọn câu quan trọng.",
      "Extractive|Trích xuất nguyên phần từ nguồn|Giữ câu cùng điều kiện.",
      "Abstractive|Diễn đạt lại nội dung|Cần kiểm mất/đổi nghĩa."
    ],
    "bridges": "arithmetic,conditions",
    "example": "Trừ reserved khỏi limit → Duyệt các chunk theo ưu tiên đã có → Lấy đoạn còn vừa ngân sách → Báo ID, used, remaining để kiểm lại",
    "formula": "Báo ID, used, remaining để kiểm lại"
  },
  {
    "id": 22,
    "title": "Trích dẫn: từ câu trả lời về đúng đoạn",
    "page": 12,
    "pids": [
      "citations"
    ],
    "hook": "Nhấn[nguồnA] mà không tìm thấy câu trích: lỗi ở đâu?",
    "analogy": "Nhấn[nguồnA] mà không tìm thấy câu trích: lỗi ở đâu?",
    "concept": "Một citation tốt giúp người đọc quay lại đoạn hỗ trợ phát biểu. Trong bài, source Id và quote được kiểm riêng. So nguyên văn phân biệt hoa/thường và không chấp nhận quote rỗng. Bài chỉ kiểm tính tồn tại của đoạn trích; đánh giá suy diễn và độ tin cậy nguồn còn cần tiêu chí khác.",
    "algorithm": [
      "Lập bảng source Id→text",
      "Đọc claim cần kiểm",
      "Kiểm source tồn tại và quote không rỗng",
      "Kiểm quote nằm nguyên văn trong source rồi trả supported"
    ],
    "trap": "Trích đúng một câu chưa chứng minh mọi phần câu trả lời được nguồn ấy hỗ trợ.",
    "quiz": [
      [
        "supported=truetrong bài xác nhận điều gì?",
        "Đoạn trích không rỗng nằm trong đúng nguồn",
        "Toàn bộ lập luận đều đúng",
        "Nguồn chắc chắn đáng tin",
        "Phạm vi checker là kiểm trích nguyên văn, cần gọi đúng giới hạn."
      ],
      [
        "Nguồn “Book”, quote “book” có khớp không?",
        "Không theo phép so phân biệt hoa/thường",
        "Có vì cùng nghĩa",
        "Có nếu ID đúng",
        "Checker dùng chuỗi con chính xác như đặc tả, không tự chuẩn hóa."
      ],
      [
        "Một đoạn đúng nhưng từ năm cũ. Citation hợp lệ có thay việc kiểm thời gian không?",
        "Không; cần kiểm phiên bản và hiệu lực",
        "Có nếu quote đúng",
        "Có nếu cosine cao",
        "Hợp lệ về trích dẫn khác cập nhật và đúng chính sách hiện hành."
      ]
    ],
    "terms": [
      "Citation|Dẫn chiếu bằng chứng|ID và đoạn trích.",
      "Quote|Đoạn nguyên văn|Open9: 00.",
      "Supported|Đủ điều kiện checker đã công bố|Không đồng nghĩa chân lý."
    ],
    "bridges": "lists,dictionaries",
    "example": "Lập bảng source Id→text → Đọc claim cần kiểm → Kiểm source tồn tại và quote không rỗng → Kiểm quote nằm nguyên văn trong source rồi trả supported",
    "formula": "Kiểm quote nằm nguyên văn trong source rồi trả supported"
  },
  {
    "id": 23,
    "title": "Biết nói chưa đủ bằng chứng",
    "page": 14,
    "pids": [
      "abstain"
    ],
    "hook": "Không có đoạn nào đạt ngưỡng: trả lời tiếp hay báo thiếu?",
    "analogy": "Không có đoạn nào đạt ngưỡng: trả lời tiếp hay báo thiếu?",
    "concept": "Abstention là dừng hoặc yêu cầu thêm thông tin khi chưa đủ bằng chứng. Bài dùng ngưỡng đã định: có score≥threshold thì policy cho answer, nếu không thì abstain. Đây chỉ là cổng quyết định. Ngưỡng cần được kiểm trên dữ liệu đánh giá; điểm cao không tự trở thành xác suất đúng.",
    "algorithm": [
      "Đọc threshold",
      "Duyệt score đã có",
      "Nếu có score đạt hoặc vượt ngưỡng thì answer",
      "Không có score đạt thì abstain"
    ],
    "trap": "Danh sách rỗng không được answer dù threshold bằng0.",
    "quiz": [
      [
        "score s=[], threshold0 thì quyết định gì?",
        "abstain",
        "answer",
        "Lỗi vì ngưỡng0",
        "Không có bằng chứng nào đạt điều kiện tồn tại."
      ],
      [
        "score50, threshold50 thì policy nào?",
        "answer",
        "abstain",
        "Phải có 51",
        "Hợp đồng dùng≥nên điểm đúng bằng ngưỡng được nhận."
      ],
      [
        "threshold được chọn bằng cách nhìn liên tục test cuối. Đánh giá có còn độc lập?",
        "Không; test đã tham gia chọn cấu hình",
        "Có vì không huấn luyện model",
        "Có nếu ít câu",
        "Tuning policy cũng là dùng thông tin test, cần validation riêng."
      ]
    ],
    "terms": [
      "Abstain|Chưa đưa ra kết luận do thiếu bằng chứng|Báo chưa đủ nguồn.",
      "Threshold|Ngưỡng chính sách|50.",
      "Validation|Dữ liệu chọn cấu hình|Chọn ngưỡng trước test cuối."
    ],
    "bridges": "conditions,percentages",
    "example": "Đọc threshold → Duyệt score đã có → Nếu có score đạt hoặc vượt ngưỡng thì answer → Không có score đạt thì abstain",
    "formula": "Không có score đạt thì abstain"
  },
  {
    "id": 24,
    "title": "Đánh giá retrieval: đúng và đủ",
    "page": 14,
    "pids": [
      "metrics"
    ],
    "hook": "LấyA, A, Xkhi cầnAvàB: có tìm đủ hai nguồn chưa?",
    "analogy": "LấyA, A, Xkhi cầnAvàB: có tìm đủ hai nguồn chưa?",
    "concept": "Precision hỏi trong các nguồn lấy được có bao nhiêu nguồn liên quan; recall hỏi trong các nguồn cần tìm đã lấy được bao nhiêu. Bản trùng chỉ tính một ID. Bộ nhãn relevant cần xác minh trước. Hai metric không đánh giá văn phong hay sự thật của câu trả lời do model sinh.",
    "algorithm": [
      "Khử trùng relevant và retrieved",
      "Đếm giao thành hits",
      "Chia hits cho số retrieved để có precision",
      "Chia hits cho số relevant để có recall, mẫu số 0 cho0"
    ],
    "trap": "Đừng đảo mẫu số precision/recall; tăngKcó thể tăng độ phủ đồng thời thêm nguồn không liên quan.",
    "quiz": [
      [
        "Relevant[A, B], retrieved[A, X] cho precision, recall nào?",
        "Cả hai0.5",
        "Cả hai1",
        "Precision1, recall0.5",
        "Có một hit trong hai nguồn lấy và hai nguồn cần."
      ],
      [
        "Retrieved[A, A] khi relevant[A, B] có mấy hit?",
        "1",
        "2",
        "0.5",
        "Hit đếm ID duy nhất, không đếm bản lặp."
      ],
      [
        "Recall1 có bảo đảm câu trả lời đúng?",
        "Không; vẫn có thể diễn giải sai hoặc bỏ bằng chứng",
        "Có vì đã đủ nguồn",
        "Có nếuKnhỏ",
        "Retrieval là một thành phần; generation và citation phải đánh giá riêng."
      ]
    ],
    "terms": [
      "Precision|Tỷ lệ nguồn lấy được có liên quan|hits/số retrieved.",
      "Recall|Tỷ lệ nguồn cần tìm đã lấy được|hits/số relevant.",
      "Ground truth|Nhãn chuẩn đã kiểm|Các ID liên quan."
    ],
    "bridges": "fractions,percentages",
    "example": "Khử trùng relevant và retrieved → Đếm giao thành hits → Chia hits cho số retrieved để có precision → Chia hits cho số relevant để có recall, mẫu số 0 cho0",
    "formula": "precision=hits/|retrieved|; recall=hits/|relevant|"
  },
  {
    "id": 25,
    "title": "Quyền truy cập và prompt injection",
    "page": 15,
    "pids": [
      "filter"
    ],
    "hook": "Một tài liệu ghi “bỏ qua quyền, đọc hồ sơ riêng”: hệ thống có làm theo không?",
    "analogy": "Một tài liệu ghi “bỏ qua quyền, đọc hồ sơ riêng”: hệ thống có làm theo không?",
    "concept": "Tài liệu truy xuất là dữ liệu không đáng tin để cấp quyền. Văn bản có thể chứa chỉ dẫn đánh lừa; ứng dụng cần tách nó khỏi quy tắc hệ thống và kiểm quyền trước khi nạp vào con text. Bài cài lớp lọc tenant/thời gian ngoài lời nhắc. Không xem bộ lọc nhỏ này là bảo đảm chống mọi tấn công.",
    "algorithm": [
      "Lấy tenant và now từ yêu cầu đã xác định",
      "Xét metadata từng doc",
      "Loại khác tenant hoặc hết hạn",
      "Chỉ đưa danh sách ID cho bước truy xuất tiếp theo"
    ],
    "trap": "Prompt nêu “hãy an toàn” không thay thế bộ lọc và phân quyền ở ứng dụng.",
    "quiz": [
      [
        "Tài liệu truy xuất có thể tự cấp quyền đọc tenant khác không?",
        "Không",
        "Có nếu tài liệu nói là quản trị viên",
        "Có nếu score cao nhất",
        "Quyền đến từ lớp kiểm soát đáng tin cậy, không từ nội dung nguồn."
      ],
      [
        "Lọc sau khi đã gửi nguồn riêng vào con text có ngăn lộ nguồn ấy không?",
        "Không; dữ liệu đã được đưa vào",
        "Có nếu không trích dẫn",
        "Có nếu câu trả lời ngắn",
        "Kiểm trước khi cung cấp dữ liệu, không chỉ che ở đầu ra."
      ],
      [
        "Một bộ lọc tenant đúng có chứng minh hệ thống an toàn tuyệt đối?",
        "Không; còn nhiều ranh giới và kiểu lỗi khác",
        "Có nếu toàn bộ test nàypass",
        "Có nếu không có mạng",
        "Test xác nhận đặc tả giới hạn; cần đánh giá toàn hệ thống khi triển khai thật."
      ]
    ],
    "terms": [
      "Prompt injection|Nội dung cố thay đổi chỉ dẫn qua dữ liệu|Tài liệu yêu cầu bỏ quyền.",
      "Authorization|Kiểm quyền từ ứng dụng|Tenant được phép.",
      "Trust boundary|Ranh giới nguồn được tin cho mục đích nào|Dữ liệu khác quy tắc."
    ],
    "bridges": "conditions,dictionaries",
    "example": "Lấy tenant và now từ yêu cầu đã xác định → Xét metadata từng doc → Loại khác tenant hoặc hết hạn → Chỉ đưa danh sách ID cho bước truy xuất tiếp theo",
    "formula": "Chỉ đưa danh sách ID cho bước truy xuất tiếp theo"
  },
  {
    "id": 26,
    "title": "Index cập nhật và truy vết phiên bản",
    "page": 12,
    "pids": [
      "upsert"
    ],
    "hook": "Phiếu mới đến trước phiếu cũ do mạng chậm: có được ghi đè ngược không?",
    "analogy": "Phiếu mới đến trước phiếu cũ do mạng chậm: có được ghi đè ngược không?",
    "concept": "Index cần biết nguồn và phiên bản để tránh dùng tài liệu lỗi thời. Bài giữ version lớn nhất mỗi ID; nếu cùng version, bản tới sau thắng theo hợp đồng. Đây là mô phỏng cập nhật nhỏ. Hệ thật còn cần xóa nguồn đã thu hồi, theo dõi embedding version và đồng bộ metadata.",
    "algorithm": [
      "Khởi tạo bảng bản mới nhất",
      "Đọc record s theo thứ tự",
      "Ghi đè khi version mới lớn hơn hoặc bằng bản giữ",
      "Trả các bản cuối theo ID tăng"
    ],
    "trap": "Bản đến sau không nhất thiết mới hơn; phải so version trước.",
    "quiz": [
      [
        "A v2 đến trước A v1. Giữ bản nào?",
        "v2",
        "v1 vì đến sau",
        "Cả hai dù cùng ID",
        "Phiên bản quyết định mức mới, không chỉ thứ tự đến."
      ],
      [
        "A v2 text Xrồi A v2 text Y. Theo bài giữ gì?",
        "v2 text Y",
        "v2 text X",
        "Tự tăngv3",
        "Cùng version phá hòa bằng bản xuất hiện sau; không tự chế phiên bản."
      ],
      [
        "Đổi embedding model nhưng chỉ cập nhật metadata version đã đủ chưa?",
        "Chưa; cần bảo đảm vector/query tương thích",
        "Đủ vì số phiên bản mới",
        "Đủ nếu số chiềugiống",
        "Metadata không tự biến các vector cũ sang không gian mới."
      ]
    ],
    "terms": [
      "Version|Mã phiên bản nguồn|v2 mới hơnv1.",
      "Upsert|Thêm hoặc cập nhật theo khóa|Giữ bản mới củaA.",
      "Re index|Lập lại chỉ mục khi cần|Đổi không gian embedding."
    ],
    "bridges": "dictionaries,conditions",
    "example": "Khởi tạo bảng bản mới nhất → Đọc record s theo thứ tự → Ghi đè khi version mới lớn hơn hoặc bằng bản giữ → Trả các bản cuối theo ID tăng",
    "formula": "Trả các bản cuối theo ID tăng"
  },
  {
    "id": 27,
    "title": "Ghép hệ RAG có thể kiểm chứng",
    "page": 12,
    "pids": [
      "retrieve"
    ],
    "hook": "Câu trả lời sai: tìm lỗi ở nguồn, retrieval hay bước viết?",
    "analogy": "Câu trả lời sai: tìm lỗi ở nguồn, retrieval hay bước viết?",
    "concept": "Một pipeline có các ranh giới quan sát được: nguồn→đoạn→chỉ mục→ứng viên→ngữ cảnh→câu trả lời. Ghi ID, phiên bản, điểm và đoạn trích giúp tìm nơi lỗi xuất hiện. Buổi này kiểm bước truy xuất trên fixture được công khai rồi chuẩn bị ghép ba chức năng cuối khóa. Không gọi model thật để quyết định điểm.",
    "algorithm": [
      "Kiểm nguồn và phạm vi hợp lệ",
      "Tính điểm truy xuất theo tập từ",
      "Giữ thứ hạng và ID cho bước ngữ cảnh",
      "Đối chiếu nguồn trong câu trả lời sau cùng"
    ],
    "trap": "Chấm tốt mỗi hàm là cần thiết nhưng chưa thay kiểm thử luồng tích hợp và câu hỏi người dùng.",
    "quiz": [
      [
        "Log nào giúp lần lại nguồn đã dùng?",
        "ID, phiên bản, điểm và trích đoạn",
        "Chỉ chữ PASS",
        "Chỉ số ký tự câu trả lời",
        "Dấu vết trung gian giúp phân biệt lỗi dữ liệu, truy xuất và diễn đạt."
      ],
      [
        "Nguồn đúng không có trong candidate s. Nên kiểm gì trước?",
        "Ingestion/index/retrieval",
        "Chỉ chính tả câu trả lời",
        "Chỉ tăng temperature",
        "Generation không thể dùng nguồn chưa được đưa vào ngữ cảnh."
      ],
      [
        "Retrieval đúng nhưng quote ở output khác nguồn. Sửa ở đâu?",
        "Bước tạo/kiểm trích dẫn và liên kết bằng chứng",
        "Tự cộng điểm retrieval",
        "Xóa kiểm quote",
        "Đúng một thành phần không cho phép bỏ lỗi ở thành phần sau."
      ]
    ],
    "terms": [
      "Pipeline|Chuỗi bước có hợp đồng dữ liệu|Nguồn→tìm→ngữ cảnh.",
      "Trace|Bản ghi trạng thái quan sát được|ID và điểm từng bước.",
      "End-to-end|Kiểm luồng từ đầu đến cuối|Câu hỏi tới nguồn trích."
    ],
    "bridges": "lists,dictionaries",
    "example": "Kiểm nguồn và phạm vi hợp lệ → Tính điểm truy xuất theo tập từ → Giữ thứ hạng và ID cho bước ngữ cảnh → Đối chiếu nguồn trong câu trả lời sau cùng",
    "formula": "Đối chiếu nguồn trong câu trả lời sau cùng"
  },
  {
    "id": 28,
    "title": "Kiểm tra tổng hợp RAG & LLM",
    "page": 15,
    "pids": [
      "vector",
      "citations"
    ],
    "hook": "Tìm nguồn và kiểm chứng trên dữ liệu mới.",
    "analogy": "Tìm nguồn và kiểm chứng trên dữ liệu mới.",
    "concept": "Đánh giá độc lập truy xuất, bằng chứng và giới hạn của toàn pipeline.",
    "algorithm": [
      "Đọc hợp đồng",
      "Tính kết quả",
      "Viết code",
      "Kiểm tra biên"
    ],
    "trap": "Code và kiến thức đều bắt buộc.",
    "quiz": [],
    "terms": [],
    "bridges": "lists,dictionaries,loops,functions",
    "example": "Đọc hợp đồng → Tính kết quả → Viết code → Kiểm tra biên",
    "formula": "Kiểm tra biên"
  },
  {
    "id": 29,
    "title": "Multi-query: nhiều cách hỏi, một tập nguồn",
    "page": 13,
    "pids": [
      "dedup"
    ],
    "hook": "Hỏi “hạn trả” và “bao nhiêu ngày”: gộp nguồn thế nào mà không nhân đôi?",
    "analogy": "Hỏi “hạn trả” và “bao nhiêu ngày”: gộp nguồn thế nào mà không nhân đôi?",
    "concept": "Query expansion tạo thêm cách diễn đạt để tăng cơ hội tìm nguồn. Mình dùng sẵn các bảng kết quả để không phụ thuộc model. Gộp theo thứ tự lần xuất hiện đầu rồi đánh giá độ phủ và chi phí. Viết lại câu hỏi có thể lệch ý định, vì vậy cần giữ câu gốc để đối chiếu.",
    "algorithm": [
      "Đọc bảng từ câu gốc trước",
      "Đọc các bảng từ biến thể theo thứ tự",
      "Chỉ thêm ID chưa có",
      "Giữ tập gộp để đánh giá bằng nhãn liên quan"
    ],
    "trap": "Nhiều query có thể thêm nhiễu và latency; không tự bảo đảm recall tăng trên mọi câu hỏi.",
    "quiz": [
      [
        "Gộp kết quả multi-query cần chú ý điều gì?",
        "Khử trùng và giữ dấu vết query gốc",
        "Chỉ cộng số bản ghi",
        "Xem mọi query mới là đúng ý định",
        "Bản trùng làm tốn con text; biến thể có thể lệch ý nghĩa."
      ],
      [
        "Bảng1[A, B], bảng2[B, A] cho mấy ID?",
        "2",
        "4",
        "1",
        "A, Bmỗi ID chỉ xuất hiện một lần sau gộp."
      ],
      [
        "Query viết lại đổi “không được” thành “được”. Xử lý?",
        "Đối chiếu ý định và loại/sửa biến thể",
        "Giữ vì nhiều dữ liệu hơn",
        "Chỉ tăngK",
        "Biến thể sai phủ định có thể tìm đúng cho một câu hỏi khác."
      ]
    ],
    "terms": [
      "Query expansion|Thêm cách diễn đạt để tìm|Hạntrả/bao nhiêu ngày.",
      "Intent|Ý định cần trả lời|Điều kiện được trả hàng.",
      "Deduplication|Gộp ID trùng|Ađược giữ một lần."
    ],
    "bridges": "lists,loops",
    "example": "Đọc bảng từ câu gốc trước → Đọc các bảng từ biến thể theo thứ tự → Chỉ thêm ID chưa có → Giữ tập gộp để đánh giá bằng nhãn liên quan",
    "formula": "Giữ tập gộp để đánh giá bằng nhãn liên quan"
  },
  {
    "id": 30,
    "title": "MMR: liên quan nhưng bớt trùng lặp",
    "page": 11,
    "pids": [
      "mmr"
    ],
    "hook": "Hai đoạn gần giống và một đoạn bổ sung: chọn chiếc giỏ nào?",
    "analogy": "Hai đoạn gần giống và một đoạn bổ sung: chọn chiếc giỏ nào?",
    "concept": "MMR cân bằng điểm liên quan với mức giống các nguồn đã chọn. Hệ số lambda điều khiển đánh đổi. Bài cung cấp relevance và ma trận similarity nguyên để tính tay từng bước. Đây là score giả lập; đa dạng cao không chứng minh thông tin chính xác hay đầy đủ.",
    "algorithm": [
      "Bắt đầu selected rỗng",
      "Tính liên quan trừ mức trùng lớn nhất với selected",
      "Chọn score cao nhất, hòa ID",
      "Thêm một nguồn rồi tính lại đến đủK"
    ],
    "trap": "Phải tính lại độ trùng sau mỗi lần chọn; xếp toàn bộ một lần không thực hiện đúng MMR.",
    "quiz": [
      [
        "lambda100 trong công thức bài ưu tiên gì?",
        "Chỉ relevance",
        "Chỉ diversity",
        "Chỉ ID",
        "Hệ số phạt100−lambda=0 nên không trừ độ trùng."
      ],
      [
        "Sau chọnA, có cần cập nhật score các nguồn còn lại?",
        "Có; tập selected đã đổi",
        "Không; score luôn cố định",
        "Chỉ nếuK=1",
        "Mức tương tự tối đa tới tập đã chọn là thành phần thay đổi."
      ],
      [
        "Nguồn đa dạng nhưng không liên quan có luôn tốt?",
        "Không; cần cân bằng và đánh giá",
        "Có vì ít trùng",
        "Có nếu có nhiều chữ",
        "Mục tiêu đa dạng không thay yêu cầu giải đáp đúng câu hỏi."
      ]
    ],
    "terms": [
      "MMR|Cân bằng liên quan và trùng lặp|Chọn từng nguồn.",
      "Lambda|Trọng số của liên quan|100 bỏ phạt trùng.",
      "Redundancy|Mức lặp thông tin|Giống nguồn đã chọn."
    ],
    "bridges": "percentages,loops",
    "example": "Bắt đầu selected rỗng → Tính liên quan trừ mức trùng lớn nhất với selected → Chọn score cao nhất, hòa ID → Thêm một nguồn rồi tính lại đến đủK",
    "formula": "Thêm một nguồn rồi tính lại đến đủK"
  },
  {
    "id": 31,
    "title": "Graph RAG: đi theo quan hệ có nguồn",
    "page": 13,
    "pids": [
      "neighbors"
    ],
    "hook": "SáchAdoBtác giảviết, Blàm ởC: một bước từAchỉ đến đâu?",
    "analogy": "SáchAdoBtác giảviết, Blàm ởC: một bước từAchỉ đến đâu?",
    "concept": "Graph retrieval theo các quan hệ được lưu giúp liên kết thực thể. Trong bài, cạnh có hướng[a, b] chỉ cho phép một bước từ a sang b; chưa suy ra mọi quan hệ bắc cầu. Trích xuất graphcó thể sai nên cạnh cần nguồn và kiểm chứng. Bài không mô phỏng một hệ Graph RAG production.",
    "algorithm": [
      "Đọc start",
      "Chọn cạnh có đầu bằng start",
      "Lấy đích của những cạnh ấy",
      "Khử trùng và sắp ID tăng"
    ],
    "trap": "Không tự đi tiếp B→Cnếu đề chỉ yêu cầu một bước A→B.",
    "quiz": [
      [
        "EdgesA→B, B→C; một bước từAcho gì?",
        "[B]",
        "[B, C]",
        "[C]",
        "Một bước chỉ xét cạnh có đầuA, không đệ quy."
      ],
      [
        "Có cạnhA→Blặp hai lần. Kết quảcần mấyB?",
        "Một",
        "Hai",
        "Không có",
        "Hợp đồng trả láng giềng duy nhất."
      ],
      [
        "Cạnh được LLM trích xuất có bảo đảm đúng không?",
        "Không; cần kiểm nguồn và quan hệ",
        "Có vì thànhgraph",
        "Có nếu nhiều cạnh",
        "Cấu trúc lưu không tự chứng nhận chất lượng thông tin."
      ]
    ],
    "terms": [
      "Entity|Thực thể có định danh|SáchA, tác giảB.",
      "Edge|Quan hệ có hướng|A→B.",
      "Hop|Một bước qua cạnh|TừAtớiB."
    ],
    "bridges": "lists,conditions",
    "example": "Đọc start → Chọn cạnh có đầu bằng start → Lấy đích của những cạnh ấy → Khử trùng và sắp ID tăng",
    "formula": "Khử trùng và sắp ID tăng"
  },
  {
    "id": 32,
    "title": "Time-aware: tài liệu còn hiệu lực",
    "page": 13,
    "pids": [
      "filter"
    ],
    "hook": "Một thông báo cũ rất giống câu hỏi: nên ưu tiên hay loại?",
    "analogy": "Một thông báo cũ rất giống câu hỏi: nên ưu tiên hay loại?",
    "concept": "Độ liên quan và hiệu lực thời gian là hai điều khác nhau. Bài chỉ lấy nguồn đúng tenant và expiresAt>now; nhờ vậy thông báo hết hạn không vào giỏ tìm kiếm. Ngoài đời, ngày mới hơn chưa chắc thay thế được văn bản cũ: còn phạm vi và quan hệ sửa đổi cần biểu diễn.",
    "algorithm": [
      "Đọc thời điểm tham chiếu now",
      "Kiểm phạm vi tenant",
      "So expiresAt với now bằng dấu>",
      "Giữ các ID còn hiệu lực theo thứ tự"
    ],
    "trap": "Mới đăng không tự có nghĩa có thẩm quyền; hiệu lực là trường phải được xác minh.",
    "quiz": [
      [
        "Scorecao nhưng hết hạn theo metadata, có giữ theo bài?",
        "Không",
        "Có nếu score cao nhất",
        "Có nếu query ngắn",
        "Bộ lọc hiệu lực là điều kiện trước bước xếp hạng."
      ],
      [
        "now10, expiresAt11 còn hạn không?",
        "Có",
        "Không",
        "Chỉ khi bằng10",
        "11>10 thỏa điều kiện; bằng10 thì không."
      ],
      [
        "Thông báo đăng mới hơn nhưng khác phạm vi, dùng ngay được không?",
        "Không; cần kiểm phạm vi và thẩm quyền",
        "Được vì thời gian mới",
        "Được nếu có ID",
        "Ngày và độ liên quan không thay kiểm quyền/phạm vi áp dụng."
      ]
    ],
    "terms": [
      "Freshness|Mức cập nhật theo thời gian|Nguồn chưa hết hạn.",
      "Expiry|Mốc hết hiệu lực|expiresAt.",
      "Scope|Phạm vi áp dụng|Tenant trườngA."
    ],
    "bridges": "conditions",
    "example": "Đọc thời điểm tham chiếu now → Kiểm phạm vi tenant → So expiresAt với now bằng dấu> → Giữ các ID còn hiệu lực theo thứ tự",
    "formula": "Giữ các ID còn hiệu lực theo thứ tự"
  },
  {
    "id": 33,
    "title": "M RR: tìm đúng sớm quan trọng thế nào?",
    "page": 15,
    "pids": [
      "mrr"
    ],
    "hook": "Hai hệ đều tìm được nguồn: một ở vị trí 1, một ở vị trí 4?",
    "analogy": "Hai hệ đều tìm được nguồn: một ở vị trí 1, một ở vị trí 4?",
    "concept": "Reciprocal rank lấy nghịch đảo vị trí nguồn liên quan đầu tiên. M RR là trung bình đại lượng đó qua nhiều câu hỏi. Một query không tìm được nguồn liên quan đóng góp0. Metric này quan tâm kết quả tốt đầu tiên, chưa đo tất cả nguồn cần thiết hoặc chất lượng câu trả lời.",
    "algorithm": [
      "Với mỗi query, duyệt rank từ 1",
      "Tìm ID liên quan đầu tiên",
      "Lấy1/rank; không có thì 0",
      "Trung bình qua query; không query trả 0"
    ],
    "trap": "Không lấy nghịch đảo của rank trung bình; phải trung bình các nghịch đảo.",
    "quiz": [
      [
        "Nguồn đúng đầu tiên ở rank4 thì RR bằng gì?",
        "0.25",
        "4",
        "0.75",
        "RR=1/4; càng tìm đúng sớm thì càng cao."
      ],
      [
        "Hai query có RR1 và 0.5 thì M RR?",
        "0.75",
        "2/3",
        "1.5",
        "Trung bình(1+0.5)/2=0.75; không lấy1/mean rank."
      ],
      [
        "M RR cao có chứng minh đã lấy đủ mọi nguồn cần thiết?",
        "Không; chỉ nhìn nguồn liên quan đầu tiên",
        "Có; luôn đồng nghĩa recall1",
        "Có nếuK=10",
        "Cần recall để đo độ phủ và metric khác cho câu trả lời."
      ]
    ],
    "terms": [
      "Reciprocal rank|Nghịch đảo vị trí đúng đầu tiên|1/4.",
      "M RR|Trung bình reciprocal rank|Qua nhiều query.",
      "Evaluation set|Bộ câu hỏi và nhãn kiểm chứng|Tách khỏi tuning."
    ],
    "bridges": "fractions,mean",
    "example": "Với mỗi query, duyệt rank từ 1 → Tìm ID liên quan đầu tiên → Lấy1/rank; không có thì 0 → Trung bình qua query; không query trả 0",
    "formula": "Trung bình qua query; không query trả 0"
  },
  {
    "id": 34,
    "title": "Phỏng vấn thiết kế RAG bằng bằng chứng",
    "page": 15,
    "pids": [
      "metrics"
    ],
    "hook": "Nhà tuyển dụng hỏi “RAG của bạn tốt hơn cỡ nào”: trả lời bằng gì?",
    "analogy": "Nhà tuyển dụng hỏi “RAG của bạn tốt hơn cỡ nào”: trả lời bằng gì?",
    "concept": "Một câu trả lời tốt nêu mục tiêu, dữ liệu, baseline, metric và điều kiện thất bại. Tách retrieval khỏi generation, đo latency và quyền truy cập, giữ bộ test khỏi tuning. Không bịa kết quảbenchmark. Phần thực hành tính metric trên ID đã gán nhãn; bài luận nói rõ những gì checkerchưa đánh giá.",
    "algorithm": [
      "Xác định relevant đã kiểm chứng",
      "Lấy tập retrieved duy nhất",
      "Tính hits, precision, recall",
      "Diễn giải lỗi và giới hạn chứ không chỉ đưa một điểm"
    ],
    "trap": "Một ví dụ đẹp không chứng minh tốt cho mọi câu hỏi; cần nhóm dữ liệu và phản ví dụ đại diện.",
    "quiz": [
      [
        "Báo cáo thuyết phục cần điều nào?",
        "Baseline, bộ test, metric và giới hạn",
        "Chỉ tên framework mới nhất",
        "Chỉ một câu trả lời đẹp",
        "Kết quả cần điều kiện kiểm để người khác tái hiện."
      ],
      [
        "Thay đổiKliên tục dựa vào test cuối rồi báo đó là đánh giá độc lập?",
        "Không",
        "Có vì không đổi model",
        "Có nếu tăng điểm",
        "Chọn tham số theo test đã làm dữ liệu tham gia tuning."
      ],
      [
        "Precision tăng nhưng recall giảm nên kết luận gì?",
        "Có đánh đổi; cần xét mục tiêu sử dụng",
        "Hệ thống chắc chắn tốt hơn",
        "Hệ thống chắc chắn tệ hơn",
        "Mục tiêu có thể ưu tiên đúng/đủ khác nhau; báo cả hai và nhóm lỗi."
      ]
    ],
    "terms": [
      "Baseline|Mốc so sánh ban đầu|Keyword retrieval.",
      "Trade-off|Đánh đổi giữa các mục tiêu|Precision và recall.",
      "Reproducibility|Khả năng tái hiện phép thử|Seed, version vàbộ test."
    ],
    "bridges": "fractions,percentages",
    "example": "Xác định relevant đã kiểm chứng → Lấy tập retrieved duy nhất → Tính hits, precision, recall → Diễn giải lỗi và giới hạn chứ không chỉ đưa một điểm",
    "formula": "precision=hits/|retrieved|; recall=hits/|relevant|"
  }
];
