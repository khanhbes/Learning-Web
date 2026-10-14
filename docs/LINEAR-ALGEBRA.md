# Khóa Đại số tuyến tính

Khóa `linear` có **28 buổi bắt buộc**, trong đó bốn kiểm tra ở buổi7/14/21/28, và **8 buổi mở rộng**. Thực hành Python chạy qua runtime ML đã có; lời giải chuẩn của module chỉ dùng thư viện chuẩn. Người học được dùng NumPy, trả số/list/dict thông thường. Không yêu cầu GPU hoặc dịch vụ trả phí.

## Tài liệu và cách chuyển nội dung

Đã mở và đọc **toàn bộ10 ảnh** trong `study documents/Đại số tuyến tính/`. Catalog [sources.json](../content/linear/sources.json) lưu đường dẫn gốc, mã `LINEAR-<prefix>`, SHA-256, chủ đề và các bài dùng trang đó. Bìa dùng giới thiệu; trang tổng ôn dùng ôn/kiểm tra. Nhiều chủ đề trong một trang được tách thành bài nhỏ cho người mới; các phần Python, norm/projection/least squares/QR/SVD và tình huống dự án ghi nhãn bổ sung.

| Trang | Prefix | Chủ đề chính |
|---|---|---|
|1|825279808|Bìa và giới thiệu|
|2|825353325|Ma trận, loại ma trận, cộng/nhân/chuyển vị|
|3|825329698|Định thức,minor,cofactor|
|4|825279889|Khử Gauss và Gauss–Jordan|
|5|829096615|Hạng,REF,RREF|
|6|828086003|Hệ phương trình và số nghiệm|
|7|825340842|Không gian vector,tổ hợp,span,cơ sở,rank–nullity|
|8|825268409|Trị riêng và vector riêng|
|9|825340721|Cayley–Hamilton|
|10|828483383|Tổng ôn và chéo hóa|

Chạy `node content/linear/generate-catalog.mjs` để kiểm tra đủ ảnh và tái tạo catalog. Việc tái tạo hash không tự chứng minh học liệu mới đã được đọc; khi ảnh thay đổi cần review lại nội dung và ghi phiên bản mới.

## Lộ trình và hình minh họa

- 1–6: Python/tọa độ, cộng vector,tổ hợp,norm,shape và chuyển vị; buổi7 kiểm tra.
- 8–13: nhân hàng/cột, biến đổi lưới,det,cofactor,inverse và phép hàng; buổi14 kiểm tra.
- 15–20: Gauss,RREF,rank,loại nghiệm,nullspace,span/cơ sở; buổi21 kiểm tra.
- 22–27: dot/projection,least squares,eigenpairs,chéo hóa,Cayley–Hamilton và dự án; buổi28 kiểm tra.
- 29–36: Gram–Schmidt,QR,SVD,PCA,dạng toàn phương,Markov,condition number và trị riêng phức.

Mỗi bài có tình huống đời thường, ý chính ngắn, một hình có thao tác, ví dụ đã kiểm tra, phản ví dụ và code thu gọn. Visual payload chứa nhãn trục,đơn vị,dữ liệu toy và mô tả văn bản. Các scene gồm vector/tổ hợp,ma trận/nhân,biến đổi lưới,diện tích có hướng,khử/pivot,span,projection,eigen,Cayley,least squares,PCA/SVD/Markov. Mô phỏng bài code dùng `traceFor`: các phép khử,ô nhân ma trận,lũy thừa hoặc residual được tính từ chính input; không phát hoạt ảnh ngẫu nhiên rồi gọi kết quả thuật toán.

Có tám hoạt động mỗi bài: lựa chọn,tìm lỗi,xếp bước,ghép thuật ngữ,nhập JSON và đọc ví dụ. Bản nháp giữ seed; biến thể mới đổi dữ liệu. 20 mẹo và20 chủ đề phỏng vấn dùng chung cơ chế thưởng của nền tảng.

## Sổ hiệu đính

1. **LINEAR-E01:** A=[[1,2,-1],[2,4,1],[3,6,0]] không phải REF và có rank2, không phải3. Không đếm các hàng khác0 trước khử để suy rank.
2. **LINEAR-E02:** [[1,2,-1],[0,0,1],[0,0,0]] chưa RREF: còn-1 trên pivot cột3. RREF đúng [[1,2,0],[0,0,1],[0,0,0]].
3. **LINEAR-E03:** Ví dụ Gauss trong ảnh có nghiệm đúng [9/7,18/7,15/7]; nghiệm in [27/7,-6/7,15/7] không thỏa hệ. Đã kiểm ba residual bằng0.
4. **LINEAR-E04:** Kết quả [I|x] chỉ với hệ vuông khả nghịch. Hệ chữ nhật/suy biến cần đọc biến tự do hoặc hàng mâu thuẫn.
5. **LINEAR-E05:** Bội giữ vector riêng phải khác0. Vector0 không là vector riêng.
6. **LINEAR-E06:** n eigenvalues tính cả bội là phát biểu trên số phức; ma trận thực có thể không đủ eigenvalues thực.
7. **LINEAR-E07:** Chéo hóa cần trường số phù hợp, đa thức đặc trưng tách và đủ chiều eigenspace. Không giả sử mọi ma trận chéo hóa được.
8. **LINEAR-E08:** Hệ số hằng trong p(A) nhân I;0 là ma trận0. Công thức inverse từ Cayley cần det≠0.
9. **LINEAR-E09:** Khử số thực cần tolerance; det nhỏ tuyệt đối không tự xác nhận ill-conditioned.

Tham chiếu chính: [MIT18.06](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/pages/syllabus/) cho hệ/không gian/projection/chéo hóa; tài liệu [NumPy eig](https://numpy.org/doc/stable/reference/generated/numpy.linalg.eig.html), [lstsq](https://numpy.org/doc/stable/reference/generated/numpy.linalg.lstsq.html), [matrix_rank](https://numpy.org/doc/stable/reference/generated/numpy.linalg.matrix_rank.html) cho trường số, nghiệm tương đương và số học. Cách triển khai/toy examples được viết riêng, không chép nội dung các nguồn web.

## Chấm khách quan và nghiệm tương đương

34 mẫu bài có oracle/checker Node nằm ngoài chương trình Python. Số thực dùng `abs_error≤1e-7+1e-6*abs(expected)`. Shape phải đúng, số phải hữu hạn; rank/nullity/shape/chỉ số cột dùng số nguyên chính xác. Không suy Big-O từ runtime.

Cayley–Hamilton kiểm cả `{square,trace,det,residual}` để thực hành không chỉ trả một ma trận0 cố định. Câu truy vết trắc nghiệm hỏi scalar/property canonical, làm tròn4 chữ số nếu cần, thay vì coi một vector hay cơ sở cụ thể là đáp án duy nhất. Bài code vẫn chấp nhận mọi nghiệm tương đương theo đặc tả.

- Eigenpairs: kiểm đủ eigenvalues,vector đơn vị và Av=λv; cho phép đổi dấu/thứ tự cặp.
- Nullspace/PCA: kiểm unit norm và thuộc tính; chấp nhận đổi dấu; PCA covariance chia n, eigenspace lớn nhất lặp cho phép mọi hướng hợp lệ.
- Column basis: chấp nhận mọi tập cột gốc độc lập đủ rank, mọi thứ tự; không ép pivot columns chuẩn.
- QR: kiểm QᵀQ=I,R tam giác trên,QR=A; cho phép dấu khác.
- Hệ vô số nghiệm: bất kỳ vector hữu hạn thỏa Ax=b được chấp nhận. Status/rank/nullity vẫn phải chính xác.
- SVD/condition: singular values giảm dần,không âm; condition suy biến trả None và có kiểm det nguyên nhỏ độc lập để tránh căn sai số gần0.

## Bài cuối khóa

**Bản đồ và bộ điều khiển của Bitty** gồm ba chức năng:

1. `linear-transform-batch`: Ap+b cho mỗi point2D.
2. `linear-solve-report`: báo status/rank/nullity và nghiệm; custom test1–4 hàng/cột,hệ số/b nguyên[-20,20] để giữ miền nhỏ rõ ràng.
3. `linear-least-squares`: intercept,slope,predictions,SSE; có ít nhất ba điểm và hai x khác nhau.

Rubric60 code+20 đọc/truy vết+10 điều kiện/chi phí+10 test phát hiện lỗi mẫu. Pass≥80,cả ba code đạt và đủ năm mục luận. Gemini chỉ góp ý văn bản khi người học yêu cầu; không sửa điểm. Custom tests đối chiếu checker và chỉ thưởng mutant thật sự bị phân biệt; identity transform không nhận điểm phát hiện transpose khi kết quả vẫn đúng.

## Kiểm thử module

`node --test tests/linear-content.test.mjs`:

- SHA-25610 ảnh,mapping,36 bài và bốn checkpoint.
- 200 seed×34 templates=6800 đầu vào/đáp án/checker; seed ổn định và không sửa input.
- 200 seed×36 bài=7200 bộ tám hoạt động, đáp án theoID và không lộ đáp án trong publicLab.
- Toàn bộ625 ma trận2×2 nguyên[-2,2],det/rank/condition đối chiếu công thức độc lập.
- 200 determinant3×3 theo hoán vị và least squares theo công thức centered độc lập.
- Hồi quy các lỗi nguồn,nghiệm tương đương,đổi dấu/shape/nonfinite,pass75/80 và code/luận bắt buộc.
- 200 seed×34 mẫu truy vết canonical và thuật ngữ ghép đúng giai đoạn: buổi đầu chỉ x/y/hệ số; pivot/residual/cơ sở xuất hiện khi đã học.

Đây là kiểm thử module nội dung. Kiểm thử runner thực,API,lưu/đổi khóa và giao diện nằm trong báo cáo tích hợp của bản phát hành; không coi một oracle tự chấp nhận đáp án là bằng chứng duy nhất.
