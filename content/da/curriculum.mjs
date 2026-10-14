import sources from './sources.json' with {type:'json'};
import {problems,generateInput,oracle,checkOutput,VERSION} from './problems.mjs';
import {solutions} from './solutions.mjs';
import {random,shuffle} from '../../shared/random.mjs';
import {visualFor} from './visuals.mjs';
import {readingNotes} from './reading.mjs';
import {demonstrations} from './demonstrations.mjs';
export const sourceCatalog=sources;
export const corrections=[
 {id:'DA-E01',source:'807590346',title:'ORDER BY phải dùng cùng dữ liệu đầu vào',before:'Bảng ORDER BY đổi lương so với bảng mẫu và chưa xếp giảm đúng.',after:'Giữ Asha50000,Ravi60000,Neha55000; giảm dần là Ravi60000,Neha55000,Asha50000. Thêmid để phá hòa nếu cần kết quả xác định.',reference:'https://www.sqlite.org/lang_select.html#orderby'},
 {id:'DA-E02',source:'808008330',title:'GROUP BY không tự tạo nhóm vắng',before:'Bảng kết quả có HR-Mobile0 dù không có hàng đầu vào tương ứng.',after:'GROUP BY chỉ tạo HR-Laptop,IT-Laptop,IT-Mobile,Finance-Mobile. Ô0 của pivot cần tạo lưới/điền giá trị có chủ đích, không phải hành vi GROUP BY tự động.',reference:'https://www.sqlite.org/lang_select.html'},
 {id:'DA-E03',source:'808521373',title:'FULL JOIN chỉ giữ dòng có trong bảng',before:'Kết quả FULL JOIN thêm Marketing nhưng bảng departments đầu vào không có Marketing.',after:'Với bảng hiện có10/20/30,không có Marketing. Muốn minh họa unmatchedright, phải thêm department40Marketing vào đầu vào rồi kết quả có id nhân viênNULL.',reference:'https://www.sqlite.org/lang_select.html'},
 {id:'DA-E04',source:'808136923',title:'Phân vị phải nêu phương pháp nội suy',before:'10,20,...,80 ghi Q1=22.5,Q3=67.5 mà không nêu phương pháp.',after:'Các phương pháp có thể khác nhau. Khóa dùng linear(h=(n−1)p),nênQ1=27.5,Q3=62.5,IQR35,hàng rào−25 và115. Không gán22.5/67.5 cho default linear.',reference:'https://numpy.org/doc/stable/reference/generated/numpy.percentile.html'},
 {id:'DA-E05',source:'805876927',title:'.loc[0] không có nghĩa hàng đầu',before:'Chú thích df.loc[0] là dòng đầu.',after:'.loc[0] chọn nhãn index0;nếu nhãn0 không có có thể lỗi. .iloc[0] mới chọn vị trí hàng đầu,không phụ thuộc tênindex.',reference:'https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.loc.html'},
 {id:'DA-E06',source:'808565048',title:'Running total cần frame và phá hòa rõ',before:'SUM OVER ORDER BY hire_date không nêu frame hay xử lý ngày bằng nhau.',after:'Bài dùng ORDER BY day,id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. RANK giữ hòa theovalue; ROW_NUMBER có thêmid để xác định thứ tự.',reference:'https://www.sqlite.org/windowfunctions.html'},
 {id:'DA-E07',source:'808008330',title:'COUNT(*) khác COUNT(column)',before:'COUNT được giải thích chung là đếm dòng.',after:'COUNT(*) đếm mọi dòng; COUNT(column) chỉ đếm giá trị khôngNULL. AVG bỏNULL; SUM trên tập toànNULL trảNULL trong SQL,khác tổng rỗng củaPython.',reference:'https://www.sqlite.org/lang_aggfunc.html'},
 {id:'DA-E08',source:'807590346',title:'Phân biệt quy tắc SQL và dialect',before:'SQL không phân biệt hoa thường; ORDER BY thực thi sau cùng.',after:'Keyword thường không phân biệt hoa thường; chuỗi vàidentifier phụ thuộc collation/dialect. ORDER BY trướcLIMIT theo ngữ nghĩa truy vấn; optimizer không buộc chạy vật lý theo thứ tự chữ viết.',reference:'https://www.sqlite.org/lang_select.html'},
];
export const units=[{id:1,title:'Từ câu hỏi đến bảng dữ liệu',range:[1,7],icon:'dataset'},{id:2,title:'Tư duy truy vấn và tổng hợp',range:[8,14],icon:'filter'},{id:3,title:'Ghép bảng, xếp hạng và thống kê',range:[15,21],icon:'chart'},{id:4,title:'Dữ liệu sạch, insight rõ',range:[22,28],icon:'target'},{id:5,title:'Phòng khám phá nâng cao',range:[29,36],icon:'star'}];
export const course={id:'da',title:'Data Analytics',subtitle:'Biến bảng số thành quyết định có bằng chứng.',description:'Từ Excel/SQL đến Python và dashboard: học bằng bảng có thể thao tác, biểu đồ sống và đơn hàng giả lập.',version:VERSION,languages:['python'],runtime:'ml-python',exerciseKind:'data-python',mandatoryLessons:28,advancedLessons:8,sourceCount:10,units,accent:'#f39a38',icon:'chart',capstone:{title:'Dashboard cửa hàng Byte',problemIds:['da-clean-orders','da-kpi','da-chart-series']},completion:{knowledge:80,allRequiredCode:true,mandatoryLessons:28,capstone:true}};
// One concrete question, example, limit and activity theme per lesson.
const notes=[
 [
  "Data Analyst làm gì?",
  "row-count",
  "pipeline",
  1,
  "Hóa đơn là dấu chân của hoạt động kinh doanh. Analyst gom các dấu chân thành câu chuyện có bằng chứng.",
  "Bắt đầu từ câu hỏi, xác định mỗi hàng đo điều gì, rồi thu thập, làm sạch, phân tích và trình bày. Descriptive mô tả; diagnostic tìm giả thuyết nguyên nhân; predictive dự báo; prescriptive đề xuất hành động.",
  "Ba dòng đơn hàng là ba đơn, chưa chắc ba khách: một người có thể mua nhiều lần.",
  "Tương quan chưa chứng minh nguyên nhân. Luôn hỏi dữ liệu đo ai, khi nào và có bỏ sót ai.",
  "Số đơn = số bản ghi đúng granularity",
  [
   "Một hàng của bảng orders đại diện cho gì?",
   "Một đơn theo schema đã quy định",
   "Luôn một khách",
   "Một biểu đồ"
  ]
 ],
 [
  "Python và kiểu dữ liệu cho bảng",
  "mean",
  "spreadsheet",
  9,
  "Biến là hộp có nhãn; list là dãy hộp; dict là một hàng có tên cột.",
  "Hàm solve(data) nhận dict, dùng for/if xử lý và return kết quả. Số khác chuỗi; None là thiếu. NumPy xử lý mảng; pandas có DataFrame và Series.",
  "[10,20,30] có tổng 60 và trung bình 20. return 20 gửi kết quả cho checker; print chỉ giúp debug.",
  "Đặt tổng ngoài vòng lặp. Chỉ chuyển chuỗi thành số sau khi kiểm tra định dạng.",
  "mean = sum / count",
  [
   "Hàm gửi kết quả chấm bằng gì?",
   "return",
   "print",
   "Tên file"
  ]
 ],
 [
  "Ô, công thức và tham chiếu",
  "sum",
  "spreadsheet",
  2,
  "Giá và số lượng nằm ở hai ô; công thức nối chúng thành thành tiền.",
  "Tham chiếu A1 dịch khi sao chép; $A$1 giữ cả hàng và cột. Công thức quantity × price tính mỗi dòng, rồi SUM cộng thành tổng.",
  "Hai sản phẩm × 30 nghìn = 60 nghìn; ba × 50 = 150 nghìn; tổng 210 nghìn.",
  "Định dạng tiền không đổi đơn vị lưu trong ô. Đừng trộn đồng với nghìn đồng.",
  "revenueᵢ = quantityᵢ × priceᵢ",
  [
   "Tham chiếu nào giữ cả hàng lẫn cột?",
   "$A$1",
   "A1",
   "A$1"
  ]
 ],
 [
  "IF, SUMIFS và điều kiện",
  "conditional",
  "filter",
  2,
  "Bộ lọc là cửa kiểm vé: chỉ hàng đủ điều kiện được tính.",
  "IF chọn kết quả; SUMIFS tổng các giá trị thỏa tất cả điều kiện. AND yêu cầu cùng đúng, OR yêu cầu ít nhất một đúng.",
  "North có 40,60,100; ngưỡng ≥60 giữ 60 và100, tổng160.",
  "Dấu ≥ khác > ở đúng ranh giới. Giá trị thiếu không tự bằng0.",
  "sum(value | region=R AND value≥t)",
  [
   "Giá trị đúng bằng ngưỡng≥được giữ không?",
   "Có",
   "Không",
   "Tùy màu ô"
  ]
 ],
 [
  "Tra cứu khóa, không dò mắt",
  "lookup",
  "join",
  2,
  "Mã sản phẩm giống số ngăn tủ: tìm đúng khóa rồi lấy thông tin cạnh nó.",
  "XLOOKUP mặc định khớp chính xác. INDEX/MATCH cần nêu chế độ khớp. Bài Python giữ bản đầu nếu khóa trùng và trả null nếu không tìm thấy.",
  "Tea→30, Cake→50, Missing→null. Hai bản Tea30/40 thì luật bài trả30.",
  "Tra cứu gần đúng cần điều kiện và cấu hình rõ. Không coi khóa trùng là duy nhất.",
  "key → value theo hợp đồng",
  [
   "Không tìm thấy khóa trong bài trả gì?",
   "null",
   "0 luôn",
   "Giá trị cuối"
  ]
 ],
 [
  "Pivot Table: xoay góc nhìn",
  "pivot",
  "pivot",
  3,
  "Cùng một giỏ hóa đơn, đổi hàng/cột để nhìn khu vực bán sản phẩm nào.",
  "Pivot chọn region ở Rows, product ở Columns, SUM revenue ở Values. GroupBy tạo nhóm có dữ liệu; pivot có thể tạo lưới và điền0 cho ô vắng.",
  "North: Tea60+Cake150=210; South: Tea60+Cake50=110.",
  "Refresh khi nguồn đổi. SUM doanh thu khác COUNT đơn; ô0 phải được tạo có chủ đích.",
  "pivot[r,p] = Σ revenue của cặp(r,p)",
  [
   "Values muốn doanh thu phải chọn gì?",
   "SUM revenue",
   "COUNT region",
   "AVERAGE id"
  ]
 ],
 [
  "Kiểm tra nền tảng bảng dữ liệu",
  [
   "sum",
   "pivot"
  ],
  "pivot",
  3,
  "Một bảng tóm tắt đúng cần đúng câu hỏi, đơn vị và quy tắc.",
  "Kiểm tra 10 câu về bảng, Python, công thức, lookup và pivot cùng hai bài code. Không có gợi ý trong lượt tính điểm.",
  "Hai nhiệm vụ code: tổng doanh thu từng dòng và bảng chéo theo hai nhãn.",
  "Cần8/10 câu và cả hai bài code đạt. XP không thay điểm học thuật.",
  "pass = knowledge≥80% AND all code passed",
  [
   "Bài kiểm tra cần tối thiểu mấy câu?",
   "8/10",
   "7/10",
   "5/10"
  ]
 ],
 [
  "SELECT và WHERE: chọn đúng dòng",
  "sql-select",
  "filter",
  4,
  "SELECT chọn nội dung của phiếu; WHERE là cửa cho từng hàng đi qua.",
  "Viết SQL thật trong biến query của Python. SQLite :memory: tạo bảng orders, lọc region và value≥threshold, rồi trả id theo ORDER BY id.",
  "North có id1:40,id2:60,id3:100. Với ngưỡng60, kết quả[2,3].",
  "SQL không bảo đảm thứ tự khi chưa ORDER BY. Dùng parameter để gắn giá trị vào query.",
  "FROM → WHERE → SELECT",
  [
   "WHERE tác động lên gì?",
   "Các dòng trước tổng hợp",
   "Các nhóm sau tổng hợp",
   "Tên cột"
  ]
 ],
 [
  "DISTINCT và NULL",
  "distinct",
  "filter",
  4,
  "Một túi nhãn có nhiều bản giống nhau; DISTINCT giữ mỗi giá trị một bản.",
  "DISTINCT xét tất cả cột trong SELECT. NULL biểu thị chưa biết; SQL kiểm tra bằng IS NULL. Bài Python này xử lý chuỗi, sắp ASCII theo đề.",
  "[North,South,North] trở thành[North,South].",
  "Keyword thường không phân biệt hoa thường; chuỗi dữ liệu còn phụ thuộc collation.",
  "unique(values)",
  [
   "DISTINCT dùng để làm gì?",
   "Khử các kết quả trùng",
   "Lấy số lớn nhất",
   "Điền missing"
  ]
 ],
 [
  "ORDER BY, LIMIT và phá hòa",
  "topk",
  "filter",
  4,
  "Bảng giải đấu cần luật chung: điểm cao trước, hòa thì mã nhỏ trước.",
  "ORDER BY value DESC,id ASC làm kết quả xác định; LIMIT k lấy k hàng đầu. K là số hàng, không phải ngưỡng.",
  "id1:50,id2:70,id3:70; Top2 là[2,3].",
  "LIMIT không có thứ tự dễ trả các hàng khác nhau. Ví dụ ORDER BY sai trong ảnh đã có hiệu đính.",
  "sort(−value,id) rồi lấy k",
  [
   "Hòa value thì bài xếp theo gì?",
   "id tăng",
   "Ngẫu nhiên",
   "Region"
  ]
 ],
 [
  "COUNT, SUM, AVG: đếm gì?",
  "aggregate",
  "group",
  5,
  "Đếm số ghế khác đếm ghế có người; COUNT(*) và COUNT(cột) đo khác nhau.",
  "COUNT(*) đếm dòng. COUNT(cột),SUM,AVG bỏ NULL; SUM/AVG trên tập không có số trả null theo ngữ nghĩa SQL của bài.",
  "[10,null,20] có3 dòng,2 số,tổng30 và trung bình15.",
  "Không chia tổng cho3 khi chỉ có2 số. NULL không phải0.",
  "AVG = SUM(non-null) / COUNT(non-null)",
  [
   "COUNT(column) bỏ giá trị nào?",
   "NULL",
   "Số0",
   "Sốâm"
  ]
 ],
 [
  "GROUP BY: nhóm có thật",
  "sql-group",
  "group",
  5,
  "Gom hóa đơn vào hộp theo vùng rồi tính tổng trong mỗi hộp.",
  "Viết GROUP BY region và SUM(value) thật trên SQLite. Chỉ nhóm xuất hiện được tạo; muốn đầy đủ tổ hợp phải tạo danh mục hoặc lưới.",
  "North60+150=210; South50+60=110; East120+50=170.",
  "Không dùng cột SELECT mơ hồ ngoài khóa nhóm/aggregate trong query portable.",
  "group key → Σ value",
  [
   "Nhóm vắng có tự hiện0không?",
   "Không",
   "Có luôn",
   "Chỉ nếu tên ngắn"
  ]
 ],
 [
  "HAVING và chuỗi truy vấn",
  "having",
  "group",
  5,
  "WHERE kiểm từng vé; HAVING kiểm tổng của cả hộp sau khi gom.",
  "WHERE lọc dòng trước GROUP BY; HAVING lọc kết quả tổng hợp. Thứ tự này mô tả ngữ nghĩa, không buộc optimizer chạy vật lý theo hình.",
  "North40+60=100: HAVING SUM≥100 giữ North; WHERE value≥100 loại cả hai dòng.",
  "Cùng số ngưỡng nhưng đặt trước/sau nhóm có thể cho kết quả khác.",
  "WHERE → GROUP BY → HAVING",
  [
   "HAVING phù hợp lọc gì?",
   "Kết quả tổng hợp của nhóm",
   "Từng ô trước GROUP BY",
   "Tên khóa"
  ]
 ],
 [
  "Kiểm tra truy vấn và tổng hợp",
  [
   "topk",
   "aggregate"
  ],
  "group",
  5,
  "Kết quả truy vấn phải xác định thứ tự và cách xử lý missing.",
  "Kiểm tra SELECT,NULL,ORDER BY,GROUP BY,HAVING qua10 câu cùng TopK và aggregate.",
  "Test có k0,hòa giá trị,cột toànNULL và tập rỗng.",
  "Code được chấm theo đầu ra đặc tả, không so mã nguồn với lời giải mẫu.",
  "pass≥8/10 và2/2code",
  [
   "Điểm cao có bù codefailđược không?",
   "Không",
   "Có",
   "Có khiXPgấp2"
  ]
 ],
 [
  "INNER JOIN và số dòng nhân lên",
  "sql-join",
  "join",
  6,
  "Hai danh sách ghép bằng mã chung; nếu mỗi bên nhiều bản thì ghép mọi cặp.",
  "Viết INNER JOIN thật giữa employees và categories. Vị trí đầu vào dùng để sắp ổn định. Khóa một-nhiều có thể tăng số hàng.",
  "Hai dòng trái × hai dòng phải cùng khóa tạo4 cặp.",
  "Hình Venn không mô tả đủ nhân dòng. Kiểm cardinality trước khi tổng doanh thu sau JOIN.",
  "n cặp cùng key = leftCount × rightCount",
  [
   "Hai bên2dòng cùng khóa sinh mấy cặp?",
   "4",
   "2",
   "1"
  ]
 ],
 [
  "LEFT JOIN và dòng chưa ghép",
  "left-join",
  "join",
  6,
  "Danh sách khách vẫn giữ người chưa có đơn; thông tin bên đơn để trống.",
  "LEFT JOIN giữ dòng trái không khớp với cột phải NULL. WHERE lên cột phải có thể loại các dòng NULL và đổi ngữ nghĩa.",
  "KeyTea khớp trả nameTea; key99 chưa có danh mục trả name:null.",
  "Đừng dùng INNER JOIN rồi tuyên bố giữ khách chưa mua. Python None chuyển sang JSON null.",
  "left rows + matches or NULL",
  [
   "LEFT JOIN giữ dòng trái không khớp không?",
   "Có",
   "Không",
   "Chỉ khiid0"
  ]
 ],
 [
  "CASE, subquery và CTE",
  "case",
  "pipeline",
  7,
  "Hỏi mức cao trước, rồi mức thấp hơn, để mỗi giá trị nhận đúng nhãn.",
  "CASE dùng WHEN/THEN. CTE đặt tên kết quả trung gian cho dễ đọc; subquery có thể trả một hoặc nhiều dòng.",
  "low30,high60:60→High,30→Medium,29→Low.",
  "CASE dừng ở nhánh đúng đầu tiên. Đặt ≥low trước ≥high sẽ nuốt nhóm High.",
  "if v≥high else if v≥low else Low",
  [
   "CASE nên kiểm ngưỡng nào trước?",
   "Cao hơn",
   "Thấp hơn",
   "Ngẫu nhiên"
  ]
 ],
 [
  "Window: tổng tích lũy",
  "sql-window",
  "window",
  7,
  "Công tơ giữ mỗi dòng và cộng thêm theo từng bước, không gom mất hàng.",
  "Chạy SQL SUM OVER với ORDER BY day,id và ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. Frame xác định vùng cộng.",
  "day1/id1:10,day1/id2:20,day2/id3:5 cho tổng10,30,35.",
  "Default RANGE có thể gom các peer đồng ngày; không mặc định nó giống ROWS.",
  "totalᵢ = totalᵢ₋₁ + valueᵢ",
  [
   "Window có giữ từng dòng không?",
   "Có",
   "Không,luônmộtdòng",
   "Chỉgiữdòngcuối"
  ]
 ],
 [
  "ROW_NUMBER, RANK, DENSE_RANK",
  "rank",
  "window",
  7,
  "Đếm ghế, để trống hạng sau hòa, hay không để trống: ba cách đánh số khác nhau.",
  "ROW_NUMBER duy nhất từng dòng; RANK nhảy sau hòa; DENSE_RANK không nhảy. Bài RANK xét value, ROW_NUMBER thêmid.",
  "100,100,80: ROW_NUMBER1,2,3; RANK1,1,3; DENSE_RANK1,1,2.",
  "Nếu thêmid vào ORDER BY của RANK sẽ phá hòa. Tách đúng hai luật.",
  "RANK = 1 + số hàng cóvalue lớn hơn",
  [
   "100,100,80 cóDENSE_RANKgì?",
   "1,1,2",
   "1,1,3",
   "1,2,3"
  ]
 ],
 [
  "Mean, median và độ phân tán",
  "summary",
  "statistics",
  8,
  "Một người rất giàu kéo mean lên; median đứng gần người ở giữa.",
  "Mean,median,range,variance đo các mặt của phân phối. Population variance chia n; sample variance chia n−1. Bài dùng ddof0.",
  "[2,4,4,4,5,5,7,9]: mean5,variance4,std2.",
  "Variance có đơn vị bình phương; std cùng đơn vị dữ liệu.",
  "variance = Σ(x−mean)²/n",
  [
   "Population variance chia cho gì?",
   "n",
   "n−1",
   "Mean"
  ]
 ],
 [
  "Kiểm tra ghép bảng và thống kê",
  [
   "left-join",
   "summary"
  ],
  "join",
  8,
  "JOIN sai có thể làm doanh thu nhân đôi dù phép cộng hoàn toàn đúng.",
  "Kiểm tra JOIN,CASE,window,rank và thống kê với10 câu cùng left-join vàsummary.",
  "Bộ test chứa unmatched,khóa trùng và dãy hằng.",
  "Không tự thêm Marketing ngoài bảng đầu vào. Lỗi hạ tầng giữ bản nháp và chờ chấm lại.",
  "pass≥8/10 và2code",
  [
   "Lỗi runner sẽ trả trạng thái nào?",
   "Chưa có kết quả,cần chấm lại",
   "Fail",
   "Pass"
  ]
 ],
 [
  "Quartile, IQR và ngoại lệ",
  "quartile",
  "histogram",
  8,
  "Hàng rào boxplot là chuông cảnh báo để kiểm tra, không phải lệnh tự xóa.",
  "Khóa dùng phân vị linear: h=(n−1)p. IQR=Q3−Q1; đánh dấu ngoài Q1−1.5IQR vàQ3+1.5IQR.",
  "10..80 cóQ1=27.5,Q3=62.5,IQR35; hàng rào−25 và115.",
  "Các phương pháp quantile có thể khác. Nêu phương pháp trước khi so đáp án; ngoại lệ có thể là quan sát thật.",
  "IQR = Q3−Q1",
  [
   "Ngoại lệ có luôn cần xóa không?",
   "Không,cần kiểm tra nguyên nhân",
   "Có luôn",
   "Có nếu lớn hơnmean"
  ]
 ],
 [
  "Scatter plot và tương quan",
  "correlation",
  "correlation",
  10,
  "Kem bán nhiều và đuối nước cùng tăng mùa hè; một yếu tố thứ ba có thể giải thích cả hai.",
  "Pearson đo quan hệ tuyến tính trong[−1,1]; dãy hằng không xác định. Scatter giúp thấy đường cong,outlier vànhóm.",
  "x1,2,3;y2,4,6 cór1. Một điểm ngoại lệ có thể đổi tương quan mạnh.",
  "r0 không chứng minh không có quan hệ phi tuyến. Scatter không tự chứng minh nhân quả.",
  "r = covariance / (stdx × stdy)",
  [
   "Tương quan mạnh có chứng minh nhân quả?",
   "Không",
   "Có",
   "Có nếu r1"
  ]
 ],
 [
  "Missing, dtype và dữ liệu trùng",
  "missing",
  "cleaning",
  10,
  "Ô trống là câu hỏi, không phải số0. Khách mua hai đơn khácid không phải bản trùng.",
  "Kiểm dtype,NULL vàkhóa trước chuyển đổi. Điền median vàoNULL,giữ0; toànNULL dùng fallback do đề quy định.",
  "[0,null,10] cómedian quan sát5, trở thành[0,5,10].",
  "Không điền dữ liệu từ tương lai khi phân tích dự báo theo thời gian.",
  "missing ≠ 0",
  [
   "[0,null,10] nên giữ0không?",
   "Có",
   "Không,vì0làmissing",
   "TùyAPI"
  ]
 ],
 [
  "Pipeline làm sạch có nhật ký",
  "clean-orders",
  "cleaning",
  10,
  "Dây chuyền kiểm hàng có thùng đạt, thùng loại và sổ lỗi để sửa nguồn.",
  "Kiểm schema,id,region,month,quantity/price. Giữ bản đầu củaid; trả dữ liệu sạch, danh sách loại và số bản trùng.",
  "Dòng đầuid1 thiếuprice bị loại; bản sao hợp lệid1 vẫn làduplicate,theo đặc tả.",
  "Không đoán ngày sai thành ngày bất kỳ. Bảo tồn dấu vết và công khai quy tắc xử lý.",
  "raw → validate/dedup → clean + audit",
  [
   "Dòng bịloại cần gì?",
   "Nhật ký và quy tắc rõ",
   "Xóa dấu vết",
   "Gán số ngẫu nhiên"
  ]
 ],
 [
  "KPI đúng mẫu số",
  "kpi",
  "kpi",
  10,
  "Doanh thu cộng tiền; giá trị đơn trung bình cần chia đúng số đơn.",
  "Định nghĩa KPI bằng đơn vị,thời gian,granularity. Revenue,orders,averageOrder vàbyRegion phải đối soát khớp nhau.",
  "North2đơn210,South1đơn50: AOV260/3≈86.67, không phải mean(105,50).",
  "Trung bình các trung bình nhóm sai khi quy mô khác nhau. JOIN một-nhiều có thể nhân KPI.",
  "AOV = total revenue / number of orders",
  [
   "AOV nên chia cho gì?",
   "Số đơn",
   "Số khu vực",
   "Số khách luôn"
  ]
 ],
 [
  "Dashboard kể một câu chuyện",
  "chart-series",
  "kpi",
  3,
  "Biểu đồ tốt như biển báo: giúp quyết định mà không bắt đọc toàn bộ bảng.",
  "Bar so category,line theo thời gian,histogram xem phân phối,scatter xem quan hệ. Ghi trục,đơn vị,nguồn,filter vàthời gian.",
  "Jan110,Feb270,Mar110; Apr vắng có0 nếu đề yêu cầu series liên tục.",
  "Trục bar cắt gốc có thể phóng đại chênh lệch. Tách insight quan sát và giả thuyết nguyên nhân.",
  "data → aggregate → labeled chart → action",
  [
   "Xem doanhthu qua tháng dùng biểuđồgì?",
   "Line với trục thời gian",
   "Pie3D",
   "Đồ thị commit"
  ]
 ],
 [
  "Kiểm tra tổng hợp và dự án",
  [
   "clean-orders",
   "kpi"
  ],
  "pipeline",
  10,
  "Dự án hoàn chỉnh cần sạch dữ liệu,tính đúng và nêu rõ giới hạn.",
  "Kiểm tra10 câu tổng hợp cùng hai hàm clean/KPI,sau đó làm capstone dashboard vớicode,biểu đồ,luận vàtest.",
  "Lượt mới đổi dữ liệu nhưng giữschema,quy tắc vàrubric.",
  "AI chỉ góp ý văn bản. Checker quyết định điểm; lưu seed/version để tái hiện.",
  "pass≥80% vàall code; cuối khóa≥80/100",
  [
   "AI có quyết định pass/fail không?",
   "Không",
   "Có",
   "Chỉ khi Gemini có mạng"
  ]
 ],
 [
  "Tăng trưởng và mốc so sánh",
  "growth",
  "kpi",
  1,
  "Từ10 lên12 khác từ100 lên102 dù cùng tăng2.",
  "Percent change=(current−previous)/previous. Baseline0 không cho tỷ lệ xác định. So cùng kỳ giúp nhìn mùa vụ.",
  "100→120 tăng20%;0→20 trảnull theo đề.",
  "Không đảo mẫu số hoặc dự báo tăng vĩnh viễn từ hai tháng.",
  "growth = (current−previous)/previous",
  [
   "Baseline0 cótỷlệtăng trưởng xácđịnhkhông?",
   "Không",
   "Có20%",
   "Luôn100%"
  ]
 ],
 [
  "Weighted mean và Simpson",
  "weighted",
  "statistics",
  8,
  "Lớp10người và lớp100người không có trọng số bằng nhau khi lấy mean toàn trường.",
  "Weighted mean dùng quy mô nhóm. Simpson nhắc xu hướng gộp có thể đảo so với từng nhóm; kiểm strata và thành phần.",
  "Mean10 trọng số1,mean20 trọng số3 cho17.5,không phải15.",
  "Không dùng trọng số âm trong bài và không suy nhân quả từ đảo chiều.",
  "weighted mean = Σ(value×weight)/Σweight",
  [
   "Nhóm lớn cần trọng số theo gì?",
   "Số quan sát phù hợp",
   "Màu sắc",
   "Tênnhóm"
  ]
 ],
 [
  "Cohort và retention",
  "cohort",
  "group",
  1,
  "Theo dõi từng lớp nhập học để biết cohort nào giữ người học tốt.",
  "Cohort dựa vào thời điểm gia nhập hoặc đặc điểm chung. Retention đếm người còn hoạt động trên quy mô cohort.",
  "Jan4người,còn3→75%;Feb2,còn1→50%.",
  "Nhóm mới chưa đủ thời gian theo dõi không nên so như nhóm cũ.",
  "retention = active / cohort size",
  [
   "Retentionsoactivevớigì?",
   "Sốngườicùngcohort",
   "Tất cảlượtclick",
   "Doanhthu"
  ]
 ],
 [
  "A/B test: tách mô tả và kết luận",
  "ab",
  "statistics",
  8,
  "Hai biển hiệu cần thử trên các nhóm phân bổ hợp lý; chênh lệch có thể do noise.",
  "Tính rateA,rateB vàdifference. Randomization,cỡmẫu,đơn vị thử vàpeeking quan trọng khi kết luận. Bài chỉ chấm mô tả.",
  "A10/100=10%,B15/100=15%; chênh5điểm phần trăm, relative lift50%.",
  "Bcao hơn không tự là statistically significant. Chênh điểm% khác tăng%tương đối.",
  "difference = rateB − rateA",
  [
   "Chênh5điểm% có giốngtăng5%tươngđốikhông?",
   "Không",
   "Có",
   "Luôn giống"
  ]
 ],
 [
  "Quyền riêng tư và báo cáo",
  "privacy",
  "pipeline",
  1,
  "Báo cáo doanh thu theo vùng không cần hiển thị email khách hàng.",
  "Giữ trường cần thiết; loại định danh trực tiếp. Nhóm nhỏ và khóa gián tiếp vẫn có thể lộ danh tính. Dữ liệu khóa đều giả lập.",
  "Output chỉregion,value; bỏname,email,id vàtrường khác.",
  "Xóaemail chưa đảm bảo ẩn danh tuyệt đối.",
  "minimum necessary columns",
  [
   "Xóađịnhdanhtrực tiếpcóđảm bảoẩn danh tuyệtđốikhông?",
   "Không",
   "Có",
   "Có nếuCSV"
  ]
 ],
 [
  "Data quality và đối soát",
  "quality",
  "cleaning",
  10,
  "Đối soát trước/sau giống cân nguyên liệu để không mất đơn giữa dây chuyền.",
  "Đếm total,missing,negative,valid. Validity khácaccuracy:dữ liệu đúngschema vẫn có thể sai nội dung.",
  "[null,−1,0,3] cótotal4,missing1,negative1,valid2.",
  "0khôngphảimissing; đúngrange chưa chứng minh đúngthực tế.",
  "total = missing + negative + valid",
  [
   "Số0trongcộtkhôngâmđượctínhlàgì?",
   "Hợp lệ",
   "Missing",
   "Negative"
  ]
 ],
 [
  "FULL JOIN và tập dữ liệu vắng",
  "full-join",
  "join",
  6,
  "Danh mục và giao dịch có thể thiếu ở cả hai phía; ghép ngoài giữ dòng chưa khớp.",
  "FULL JOIN tạo cặp khớp vàgiữunmatched trái/phải. Duplicatekey vẫn nhân dòng; luật null vàthứtự phải rõ.",
  "Right cókey40Marketing chưa khớp→{id:null,name:Marketing}. Không có40thì không thêm.",
  "Venn không đủ để đoán số hàng khi khóa lặp. Hỗ trợFULL JOIN tùy dialect/phiên bản.",
  "full = matches + left unmatched + right unmatched",
  [
   "Marketingvắngcảhai bảngcóđượcFULLJOINtạo không?",
   "Không",
   "Có",
   "Có nếu tên dài"
  ]
 ],
 [
  "Funnel và portfolio có bằng chứng",
  "funnel",
  "kpi",
  1,
  "Phễu có nhiều cửa:tỷ lệ qua một cửa khác tỷ lệ đi hết đường.",
  "Táchvisited→signed→purchased. Portfolio trình bày câu hỏi,dữ liệu,quy tắc,biểu đồ,test vàgiới hạn.",
  "100visit,20signup,5buy:signup20%,purchase25%,total5%.",
  "Không gọi tỷ lệ từng bước là toànphễu. Project giả lập không chứng minh đã tăng doanh thu thật.",
  "total conversion = purchased / visited",
  [
   "5buytrên100visitcóconversiongì?",
   "5%",
   "25%",
   "20%"
  ]
 ]
];
for(const [i,copy] of readingNotes.entries()){notes[i].splice(4,4,...copy);}
for(const [i,pid] of [[7,'sql-select'],[11,'sql-group'],[14,'sql-join'],[17,'sql-window']])notes[i][1]=pid;
const steps=['Nhớ lại','Hiểu qua hình','Mô phỏng','Tự thao tác','Viết code','Kiểm tra'];
export const packs={},topicQuestions={};
export const lessons=notes.map((n,index)=>{const[title,pid,visual,page,analogy,concept,example,trap,formula,quiz]=n,id=index+1,problemIds=(Array.isArray(pid)?pid:[pid]).map(x=>'da-'+x),pack='da-lesson-'+id,source=sources.find(s=>s.page===page),questionRows=[quiz,['Ví dụ trong bài minh họa điều gì?',example,'AI tự quyết định đáp án','Không cần xem dữ liệu'],['Lỗi nào cần tránh trong bài này?',trap,'Đọc hợp đồng trước khi tính','Chạy test biên'],['Đầu ra bài '+problems[problemIds[0]].title+' cần theo gì?','Đặc tả,kiểu dữ liệu và quy tắc biên đã ghi','Chỉ khớp ví dụ đầu','AI phỏng đoán'],['Kết quả thay đổi nên kiểm tra thế nào?','Đổi một tham số và theo dõi từng bước','Đổi toàn bộ cùng lúc','Chỉ đổi màu biểu đồ'],['Lỗi hệ thống chấm được xử lý thế nào?','Giữ bản nháp và chờ chấm lại','Fail học thuật tự động','Tăng XP để bù']];packs[pack]={title,lessonIds:[id]};topicQuestions[pack]=questionRows;
 const blocks=[{title:'Hình dung trước',text:analogy,label:'Bổ sung'},{title:'Một ý chính',text:concept,label:id>28?'Bổ sung':'Từ tài liệu và bổ sung'},{title:'Tự nhìn và thử',text:'Dùng bảng 6 đơn giả lập. '+visualFor(visual,id).description+' Thay một trường rồi quan sát dòng, nhóm và KPI liên quan thay đổi.',label:'Bổ sung',visualization:visual},{title:'Ví dụ đã đối chiếu',text:example,label:'Bổ sung đã kiểm chứng'},{title:'Ranh giới và phản ví dụ',text:trap,label:'Bổ sung / Hiệu đính'},{title:'Từ bảng đến Python',text:problems[problemIds[0]].statement+' '+problems[problemIds[0]].constraints,label:'Bổ sung đã kiểm chứng',problemId:problemIds[0],code:{python:solutions[problemIds[0]]},collapsible:true}];
 if(demonstrations[id])blocks.push({title:'Thư viện trong vài dòng',text:'Thử API thực tế với dữ liệu nhỏ rồi đối chiếu mô phỏng. Bài nộp vẫn tuân hợp đồng riêng trong Phòng thực hành.',label:'Bổ sung đã kiểm chứng',code:{python:demonstrations[id]},collapsible:true});
 return{id,courseId:'da',title,kind:Array.isArray(pid)?'exam':id>28?'advanced':'lesson',unitId:units.find(u=>id>=u.range[0]&&id<=u.range[1]).id,pack,duration:'45–60 phút',objectives:[quiz[0].replace('?','')+': '+quiz[1],'Tự thao tác và đọc đúng đơn vị của bảng/biểu đồ.','Viết Python có test theo đặc tả.'],prerequisites:id===1||id>28?[]:[id-1],sourcePrefixes:[source.prefix],blocks,steps,problemIds,visualization:visual,visualData:visualFor(visual,id),formula,activityCount:8,exerciseNotice:problemIds[0].startsWith('da-sql-')?'Viết SQL thật trong biến query của Python; SQLite chạy trên dữ liệu giả lập trong bộ nhớ.':['filter','group','join','window'].includes(visual)?'Mô phỏng bảng; bài này dùng Python. Các buổi 8,12,15,18 có bài SQL thật.':undefined,extension:{title:'Thử một tình huống mới',text:'Đổi dữ liệu,thêm một trường hợp biên và ghi lại vì sao bảng/biểu đồ đổi. Không dùng kết quả chưa kiểm chứng làm kết luận kinh doanh.'}};
});
export function lessonMaterial(value){const lesson=typeof value==='object'?value:lessons.find(l=>l.id===Number(value));if(!lesson)return null;const q=topicQuestions[lessons[Math.max(0,lesson.id-2)].pack][0];return{...lesson,recall:{prompt:q[0],answer:q[1],options:q.slice(1)},itinerary:[{title:'Nhớ lại',minutes:5},{title:'Khám phá bảng và hình',minutes:8},{title:'Mô phỏng',minutes:10},{title:'8 hoạt động ngắn',minutes:8},{title:'Code và test',minutes:15},{title:'Kiểm tra',minutes:9}],interview:[],corrections:corrections.filter(c=>lesson.sourcePrefixes.includes(c.source)),activities:createLab(lesson,'lesson-'+lesson.id).questions};}
export function createLab(lesson,seed){const rng=random(String(seed)+':da-lab'),rows=topicQuestions[lesson.pack],pid=lesson.problemIds[0],input=generateInput(pid,String(seed)+':lab'),order=[{id:'s0',text:'Xác định câu hỏi và schema'},{id:'s1',text:'Kiểm tra dữ liệu và quy tắc'},{id:'s2',text:'Tính toán rồi kiểm chứng'},{id:'s3',text:'Trình bày kết quả và giới hạn'}],vocab=[{id:'v0',left:'Granularity',right:'Một dòng đại diện cho đơn vị quan sát nào'},{id:'v1',left:'NULL',right:'Giá trị chưa có,không tự bằng0'},{id:'v2',left:'KPI',right:'Chỉ số gắn mục tiêu,đơn vị và mẫu số'}];const choice=(q,i)=>({id:'choice-'+i,kind:'choice',title:i===2?'Tìm lỗi':'Một câu hỏi nhỏ',prompt:q[0],options:shuffle(q.slice(1).map((text,j)=>({id:'o'+j,text})),rng),answer:'o0',explanation:q[1]});return{version:1,cursor:0,responses:{},completed:[],drafts:{},questions:[choice(rows[0],0),choice(rows[1],1),choice(rows[2],2),{id:'order',kind:'order',title:'Xếp quy trình',prompt:'Xếp các bước phân tích trước–sau.',items:shuffle(order,rng),answer:order.map(s=>s.id),explanation:'Hỏi → kiểm tra → tính và kiểm chứng → trình bày.'},{id:'match',kind:'match',title:'Ghép thuật ngữ',prompt:'Ghép tên với ý nghĩa.',pairs:vocab.map(({id,left})=>({id,left})),options:shuffle(vocab.map(({id,right})=>({id,text:right})),rng),answer:Object.fromEntries(vocab.map(v=>[v.id,v.id])),explanation:vocab.map(v=>v.left+': '+v.right).join(' · ')},{id:'output',kind:'output',title:'Đọc kết quả từ bảng',prompt:'Nhập JSON kết quả theo hợp đồng. Không cần làm tròn số thực.',problemId:pid,input,answer:oracle(pid,input),explanation:'Kết quả đã kiểm chứng: '+JSON.stringify(oracle(pid,input))},choice(rows[3],3),choice(rows[4],4)]};}
export function publicLab(lab){if(!lab)return lab;return{...lab,questions:lab.questions.map(({answer,explanation,...q})=>q)};}
export function checkLab(q,value){if(q.kind==='output'){try{return checkOutput(q.problemId,q.input,typeof value==='string'?JSON.parse(value):value);}catch{return false;}}if(q.kind==='order')return Array.isArray(value)&&JSON.stringify(value)===JSON.stringify(q.answer);if(q.kind==='match')return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===Object.keys(q.answer).length&&Object.keys(q.answer).every(k=>value[k]===q.answer[k]);return value===q.answer;}
export function traceFor(pid,input){const result=oracle(pid,input);return{kind:'da',title:problems[pid].title,input,frames:[{caption:'Đọc schema,đơn vị và điều kiện.',data:input},{caption:'Lọc/ghép/nhóm hoặc tính theo hợp đồng.',data:input},{caption:'Đối soát số dòng và kết quả.',data:result}],result};}
