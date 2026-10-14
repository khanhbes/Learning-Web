// [skill,title,prompt,correct,wrong1,wrong2,wrong3,explanation,sourcePrefix]
const page={1:'802777798',2:'808298581',3:'808051959',4:'807590346',5:'808008330',6:'808521373',7:'808565048',8:'808136923',9:'805876927',10:'805900198'};
const row=(skill,title,prompt,correct,wrong,explanation,p)=>[skill,title,prompt,correct,...wrong,explanation,page[p]];
export const knowledgeTipRows=[
 row('granularity','Một hàng là gì?','Bảng orders có2dòng cùng khách, khác orderId. Khi đếm dòng bạn đo gì?','Số đơn',['Số khách duy nhất','Số vùng','Số sản phẩm duy nhất'],'Xác định granularity trước khi tính KPI. Hai đơn của một khách vẫn là hai đơn.',1),
 row('units','Ghi đơn vị trước khi vẽ','Một cột tính nghìn đồng nhưng nhãn trục ghi đồng. Cần làm gì?','Sửa nhãn hoặc đổi dữ liệu nhất quán',['Giữ vì shape biểu đồ không đổi','Nhân tất cảid','Chỉ đổi màu'],'Đơn vị là một phần của đặc tả, không phải trang trí.',3),
 row('null','Giữ số0','[0,null,10] có bao nhiêu giá trị đã quan sát?','2',['1','3','0'],'0 là dữ liệu; null là chưa có. Median của các số đang có bằng5.',10),
 row('count','COUNT đúng mục tiêu','COUNT(column) với[10,null,20] trả gì?','2',['3','30','15'],'COUNT(*) trả3;COUNT(column) bỏNULL.',5),
 row('where','Lọc trước hay sau nhóm','Muốn giữ vùng có tổng doanh thu≥100, dùng gì?','HAVING SUM(revenue)>=100',['WHERE revenue>=100','LIMIT100','DISTINCT100'],'HAVING lọc nhóm sau aggregate;WHERE lọc từng dòng.',5),
 row('sort','Phá hòa Top K','Hai đơn cùng doanh thu; cần kết quả xác định, thêm gì?','Khóa id vào ORDER BY',['RANDOM() mỗi lần','Đổi tên cột','ChỉLIMIT'],'ORDER BY revenue DESC,id ASC phân biệt thứ tự hòa.',4),
 row('join','Kiểm tra số dòng JOIN','2dòng trái ×3dòng phải cùng khóa tạo bao nhiêu cặp?','6',['2','3','1'],'JOIN tạo mọi cặp thỏa điều kiện, không phải một lookup duy nhất.',6),
 row('left','Đừng làm mất unmatched','WHERE right.value>0 sau LEFT JOIN có thể gây gì?','Loại các dòng phảiNULL',['Tự điền0','Giữ mọi dòng trái chắc chắn','Tạo department mới'],'Nếu muốn giữ dòng trái, suy nghĩ điều kiệnON hoặc xử lýNULL theo mục tiêu.',6),
 row('pivot','Ô vắng có chủ đích','GROUP BY có tự tạo mọi vùng×sản phẩm không?','Không',['Có vàđiền0','Có vàđiềnmean','Có vàsắp theoid'],'Pivot hoặc danh mục riêng tạo lưới;GROUP BY chỉ có nhóm xuất hiện.',5),
 row('window','Nêu frame lũy kế','Muốn cộng từng dòng với ngày hòa, dùng gì?','ORDER BY day,id với ROWS frame',['ChỉORDER BY day mặc định luôn đủ','GROUP BY day','DENSE_RANK()'],'ROWS chỉ rõ vùng dòng;id làm thứ tự xác định.',7),
 row('rank','Đừng vô tình phá hòa','RANK cần giữ hòa theo salary. Nên ORDER BY gì?','salary DESC',['salary DESC,id ASC','id ASC','name ASC'],'Thêmid vàoORDER BY củaRANK làm các tuplekhác vàkhông còn hòa theo salary.',7),
 row('quantile','Nêu phương pháp phân vị','10..80 với percentile linear cóQ1gì?','27.5',['22.5','20','30'],'h=7×0.25=1.75;Q1=20+0.75×10=27.5.',8),
 row('correlation','Tương quan không là nguyên nhân','Scatter tăng mạnh có đủ chứng minh XgâyYkhông?','Không',['Có luôn','Có nếu r1','Có nếu dùngpandas'],'Nhiễu,biến thứba vàthiết kế chọn mẫu có thể giải thích quan hệ.',10),
 row('aov','Không lấy mean của mean','VùngA2đơn tổng30;B1đơn90. AOV toàn cửa hàng?','40',['52.5','60','120'],'Tổng120 chia3đơn=40;trungbình15và90khôngtrọng sốsai.',10),
 row('chart','Chọn biểu đồ theo câu hỏi','So doanhthu qua ba tháng nên dùng gì?','Line với thời gian tăng',['Pie3D','Mạng node','Chỉhình mascot'],'Line giúp theo dõi thời gian;ghiđơnvị vàkhoảngthờigian.',3),
 row('audit','Giữ nhật ký làm sạch','Một đơn bị loại vì price âm cần lưu gì?','ID và quy tắc loại',['Không lưu gì','Đổi sang giá ngẫu nhiên','Xóa mọi bản nháp'],'Có audit giúp tái hiện vàsửa nguồn,dữliệu sạch không che mất vấnđề.',10),
];
export const knowledgeInterviewRows=[
 row('analytics','Bốn loại analytics','Câu “tháng trước doanhthu bao nhiêu?” thuộc dạng nào?','Descriptive',['Predictive','Prescriptive','Reinforcement'],'Descriptive tóm tắt điều đã xảy ra;không tự suy nguyên nhân.',1),
 row('granularity','Đơn và khách','Đếm khách duy nhất trong bảng orders cần gì?','Khử trùng customerId',['COUNT(*) luôn','SUM(price)','COUNT(region)'],'Một khách có nhiều đơn;đếmkháchvàđếmđơn làhaiKPI.',1),
 row('reference','Tham chiếu bảng tính','Tham chiếu cố định cả hàng/cột là gì?','$A$1',['A1','$A1','A$1'],'Dấu$ trước chữ giữcột;trướcsốgiữhàng.',2),
 row('sumifs','SUMIFS và điều kiện','SUMIFS với nhiều điều kiện kết hợp theo gì?','AND',['OR luôn','XOR','Chỉ điều kiện cuối'],'Một dòng phải thỏa tất cả criteria để được cộng.',2),
 row('lookup','Lookup khớp chính xác','Không có key trong bàilookup trả gì?','null',['0 bất kỳ','Dòng cuối','Mean giá'],'Công bố missingmatch vàtie rule trước khi dùnglookup.',2),
 row('pivot','Pivot và GroupBy','Pivot có thể điền0 cho cặp nhãn vắng nhờ gì?','Tạo lưới nhãn và fill có chủ đích',['GROUP BY tự tạo hàng vắng','SUM(NULL)=0 luôn','LEFT luônđủmọitổhợp'],'Cần danh mục hoặc pivot config;không nhầm hànhviaggregate.',3),
 row('null','SQL ba giá trị','Kiểm cột bịNULL nên dùng gì?','IS NULL',['= NULL','!= NULL','COUNT(*)=NULL'],'SQL comparison vớiNULL thường trảunknown,khôngtrue.',4),
 row('orderby','ORDER BY và LIMIT','SELECT...LIMIT3 khôngORDER BY có bảo đảm top3cao nhất?','Không',['Có','Có nếuCSVđãsắp','Có nếuidduynhất'],'MuốnTopKphải nêu ORDER BY vàluậthòa.',4),
 row('aggregate','COUNT(*) vs COUNT(cột)','Với cột toànNULL,COUNT(cột) là gì?','0',['Số dòng','NULL','1'],'COUNT(column)bỏNULL;COUNT(*)đếmdòng.',5),
 row('having','WHERE vs HAVING','Lọc nhóm theo SUM(sales) dùng gì?','HAVING',['WHERE SUM(sales) trực tiếp','LIMIT','OFFSET'],'WHERElọctừngdòng trướcGROUP BY,HAVINGlọcaggregate.',5),
 row('cardinality','JOIN khóa trùng','Một key trái3dòng,phải2dòng tạo mấy cặpINNER JOIN?','6',['3','2','1'],'Nghĩ theo cặp,cầnđối soáttổngsaujoin.',6),
 row('leftjoin','LEFT JOIN','Không có bản bên phải,LEFT JOIN tạo gì?','Dòng trái với cột phảiNULL',['Bỏ dòng trái','Thêm0mọicột','Chạy lạiqueryđếnkhớp'],'Cột phảiNULL khácgiátrị0.',6),
 row('cte','CTE','Lợi ích chắc chắn của đặt CTE có tên rõ là gì?','Dễ chia và đọc logic truy vấn',['Luôn chạy nhanh hơn','Tự tạo index','Tự xóaNULL'],'Hiệu năng cầnexecutionplan/benchmark,khônghứaCTEluônnhanh.',7),
 row('rank','RANK vs DENSE_RANK','Điểm100,100,80choRANKvàDENSE_RANKgì?','1,1,3 và1,1,2',['1,2,3 và1,2,3','1,1,2 và1,1,3','1,2,2 và1,2,2'],'RANKnhảythứhạngsauhòa;DENSEkhôngnhảy.',7),
 row('variance','Variance và std','Population variance4 cho stdgì?','2',['4','16','0'],'Std làcănbậchai variance vàcùngđơnvịcộtsố.',8),
 row('iloc','loc vs iloc','Muốn hàng đầu theo vị trí bất kể nhãnindex,dùng gì?','iloc[0]',['loc[0] luôn','loc[1]','iloc[1]'],'loc chọnlabel;iloc chọnposition0-based.',9),
 row('missing','Xử lý missing','Bước đầu trước tự động điềnmean là gì?','Xem lý do thiếu,kiểu dữ liệu và mục tiêu',['Điền0hết','Xóahếtcột','Dùngnhãntestđểđiền'],'Thiếu khôngngẫunhiêncóthểbias;quy tắcphùhợpphạmvi.',10),
 row('outlier','Outlier','Một điểm ngoàiIQRhàngrào nên làm gì trước?','Kiểm tra nguồn và bối cảnh',['Xóa ngay','Gánmeanluôn','Đổigiớihạnđểkhôngcóoutlier'],'Outliercóthểquan sáthợplệ,tínhiệugianlận hoặc lỗi.',8),
 row('kpi','KPI và mẫu số','AOV được định nghĩa như thế nào?','Doanhthu / số đơn',['Doanhthu / số khu vực','MeanAOVnhómkhôngtrọngsố','Doanhthu / số cột'],'Ghi rõgranularity vàđơnvịgiúpchecker,ngườixemcùnghiểu.',10),
 row('story','Kể chuyện bằng dữ liệu','Đề xuất có trách nhiệm sau biểuđồ tươngquan cần gì?','Tách quan sát,giả thuyết và giới hạn',['Khẳngđịnhnguyênnhânngay','Chỉthêmhiệuứng','Giấu nguồn dữliệu'],'Insight có bằngchứng vàgiớihạn giúpquyếtđịnhđúng hơn.',1),
];
export const knowledgeLessonIds={'granularity':1,analytics:1,units:3,reference:3,sumifs:4,lookup:5,pivot:6,where:8,null:9,sort:10,orderby:10,count:11,aggregate:11,having:13,join:15,cardinality:15,left:16,leftjoin:16,cte:17,window:18,rank:19,variance:20,quantile:22,correlation:23,iloc:2,missing:24,outlier:22,aov:26,kpi:26,chart:27,audit:25,story:27};
