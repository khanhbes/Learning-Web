import { lessons } from '../linear/curriculum.mjs';

// Authored lesson decisions. The mathematical explanation and source example are
// retained from the checked curriculum; prompts and practice are topic-specific.
const lessonDesigns = {};
const split = value => value.split('|');
function d(id, hook, goals, algorithm, wrong, repair, concept, error, apply, vocabulary, bridges, transfer, code) {
  const lesson = lessons.find(item => item.id === id);
  const main = lesson.blocks.find(block => block.title === 'Một ý chính');
  const example = lesson.blocks.find(block => block.title === 'Ví dụ đã kiểm chứng');
  const limit = lesson.blocks.find(block => block.title === 'Ranh giới và phản ví dụ');
  lessonDesigns[id] = {
    hook, intuition: [main?.text, example?.text].filter(Boolean).join(' '),
    goals: split(goals), algorithm: split(algorithm),
    misconception: { wrong, why: limit?.text || error[4], repair },
    transfer: { prompt: transfer[0], explanation: transfer[1] },
    vocabulary: vocabulary.map(([term, definition, example]) => ({ term, definition, example })),
    bridges, checks: { concept, error, apply },
    ...(code ? { code: { python: code[0] }, annotations: { python: code[1] } } : {}),
  };
}

d(1, 'Bitty cần đi 2 ô sang phải rồi 1 ô lên. Bạn sẽ gửi hai con số nào?',
  'Đặt đúng điểm từ cặp [x, y]|Trả lại tọa độ bằng một hàm Python ngắn',
  'Bắt đầu ở gốc [0, 0]|Đọc x: dương sang phải, âm sang trái|Đọc y: dương lên, âm xuống|Ghi [x, y] theo đúng thứ tự',
  '[2, 1] và [1, 2] là cùng một vị trí.', 'Vẽ hai điểm bằng hai màu; đi ngang trước để nhận ra thứ tự có ý nghĩa.',
  ['Số đầu của [3, 1] mô tả hướng nào?', 'Ngang: 3 ô sang phải', 'Dọc: 3 ô lên', 'Chỉ số thứ ba của danh sách', 'Tọa độ được viết theo thứ tự x rồi y.'],
  ['Muốn đến x=2, y=-1 nhưng trả [-1, 2]. Lỗi ở đâu?', 'Đã đảo x và y', 'Cần đổi cả hai số thành dương', 'List không thể chứa số âm', 'Vị trí bên phải và phía dưới là [2, -1]; số âm vẫn là tọa độ hợp lệ.'],
  ['Bitty ở gốc đi 1 ô trái và 2 ô lên. Điểm đến?', '[-1, 2]', '[1, -2]', '[2, -1]', 'Trái làm x âm; lên làm y dương.'],
  [['coordinate', 'Tọa độ: vị trí theo từng trục có thứ tự.', '[2, 1]'], ['origin', 'Gốc tọa độ, nơi cả x và y bằng 0.', '[0, 0]']],
  ['coordinates', 'lists', 'dictionaries', 'functions'],
  ['Điểm [0, -3] nằm ở đâu nếu không có bước ngang?', 'Nằm trên trục dọc, dưới gốc 3 đơn vị. Số 0 phải được giữ lại.'],
  ["def solve(data):\n    return [data['x'], data['y']]", ['solve nhận hai tọa độ được đặt tên trong data.', 'return gửi x trước, y sau trong một list; không cần hàm phụ.']]);

d(2, 'Đi sang phải 2, lên 1 rồi sang trái 1, lên 3: cuối cùng ở đâu?',
  'Cộng vector theo từng tọa độ|Giải thích tổng bằng đường đi hai chặng',
  'Vẽ chặng u từ gốc|Đặt đuôi v vào đầu u mà giữ hướng và độ dài|Cộng hoành độ với hoành độ|Cộng tung độ với tung độ|Nối gốc với điểm cuối',
  'Cộng vector bằng cách ghép hai danh sách thành bốn số.', 'Tô cùng màu hai hoành độ và hai tung độ; kết quả vẫn chỉ có hai tọa độ.',
  ['[2, 1] + [-1, 3] bằng gì?', '[1, 4]', '[2, 1, -1, 3]', '[3, 2]', 'Hai bước ngang triệt bớt nhau, hai bước dọc cộng thành 4.'],
  ['Python u + v với hai list tạo bốn phần tử. Vì sao chưa là tổng vector?', 'Toán tử + nối list, chưa cộng từng cặp tọa độ', 'Vector luôn phải có bốn chiều', 'Số âm không được cộng', 'Cần [u[0]+v[0], u[1]+v[1]], không nối hai list.'],
  ['Một bước [3, -2] rồi [-3, 2] đưa bạn tới đâu?', '[0, 0]', '[6, -4]', '[-6, 4]', 'Hai vector đối nhau đưa về gốc.'],
  [['vector', 'Mũi tên có độ lớn và hướng, biểu diễn bằng tọa độ.', '[2, 1]'], ['component', 'Thành phần theo một trục.', 'Trong [2, 1], thành phần y là 1.']],
  ['lists', 'coordinates'], ['Đổi thứ tự hai chặng có đổi điểm cuối không?', 'Không: cộng từng tọa độ có tính giao hoán, dù hình đường đi trung gian khác.']);

d(3, 'Hai động cơ chỉ đẩy theo u và v. Tăng công suất hoặc chạy ngược giúp Bitty tới những đâu?',
  'Tính au + bv với hệ số âm hoặc 0|Đọc vai trò từng hệ số trên hình',
  'Nhân từng tọa độ của u với a|Nhân từng tọa độ của v với b|Vẽ hai vector đã co giãn|Cộng hai kết quả theo tọa độ',
  'Hệ số âm chỉ làm vector dài hơn theo hướng cũ.', 'Cho hệ số chạy qua 1, 0, -1 để thấy mũi tên co về gốc rồi đảo hướng.',
  ['-2 nhân [1, 3] bằng gì?', '[-2, -6]', '[2, 6]', '[-2, 3]', 'Hệ số nhân mọi thành phần; dấu âm đảo hướng.'],
  ['Tính 0u + 2v nhưng vẫn cộng u. Đã bỏ qua điều gì?', '0u là vector không, không đóng góp vào tổng', 'Hệ số 0 phải thay bằng 1', 'Không được dùng hệ số 0', 'Nhân 0 làm mọi tọa độ của u bằng 0.'],
  ['u=[1,0], v=[0,1]. 3u - 2v là điểm nào?', '[3, -2]', '[1, 1]', '[-2, 3]', 'Hai hướng trục độc lập làm các hệ số trở thành tọa độ.'],
  [['linear combination', 'Tổ hợp tuyến tính: cộng các vector đã nhân hệ số.', '3u - 2v'], ['scalar', 'Một số dùng để nhân toàn bộ vector.', 'a=-2']],
  ['coordinates', 'lists', 'notation'], ['Nếu v=2u, đổi a và b có giúp rời khỏi đường của u không?', 'Không. au+bv=(a+2b)u nên mọi điểm vẫn trên cùng một đường.']);

d(4, 'Đi 3 ô ngang và 4 ô dọc: đường chim bay dài 7 hay 5?',
  'Tính độ dài Euclid của vector|Phân biệt độ dài thẳng với tổng độ dài các chặng',
  'Bình phương từng tọa độ|Cộng các bình phương|Lấy căn bậc hai|Kiểm tra kết quả không âm',
  'Độ dài vector luôn bằng x+y.', 'Vẽ tam giác vuông cạnh 3 và 4; cạnh huyền dài 5 còn đường men theo trục dài 7.',
  ['Độ dài Euclid của [3,4] bằng bao nhiêu?', '5', '7', '25', 'Căn của 3²+4² là căn 25, bằng 5.'],
  ['Vector [-3,4] bị tính ra độ dài -5. Điều gì sai?', 'Độ dài là căn không âm của tổng bình phương', 'Phải bỏ tọa độ âm khỏi vector', 'Mọi vector x âm có độ dài âm', 'Đổi hướng ngang không đổi khoảng cách tới gốc.'],
  ['Vector [0,-6] có độ dài nào?', '6', '-6', '0', 'Chỉ có chuyển động dọc, khoảng cách là trị tuyệt đối của -6.'],
  [['norm', 'Chuẩn: cách đo độ dài vector; ở đây dùng Euclid.', '||[3,4]||=5'], ['unit vector', 'Vector có độ dài bằng 1.', '[1,0]']],
  ['sums', 'notation'], ['Nhân một vector với -2 làm độ dài đổi ra sao?', 'Độ dài tăng gấp 2; dấu âm đổi hướng chứ không tạo khoảng cách âm.']);

d(5, 'Bảng điểm có 3 học sinh, mỗi người 2 môn. Kích thước bảng là 3×2 hay 2×3?',
  'Đếm hàng và cột theo đúng thứ tự|Đọc phần tử từ một list lồng nhau',
  'Nhìn mỗi list con như một hàng|Đếm số hàng m|Đếm số phần tử của một hàng n|Viết shape=(m,n)|Dùng A[i][j] để chọn hàng rồi cột',
  'Số hàng và số cột có thể đổi chỗ tùy cách đọc.', 'Đặt tên 3 học sinh ở mé trái và 2 môn ở phía trên trước khi ghi kích thước.',
  ['Một ma trận có 3 hàng, 2 cột có shape nào?', '3×2', '2×3', '6×1', 'Thứ tự quy ước là hàng trước, cột sau.'],
  ['A=[[1,2],[3,4]]. Muốn lấy 3 nhưng dùng A[0][1]. Lỗi gì?', 'Chọn sai hàng và cột; cần A[1][0]', 'Python bắt đầu chỉ số từ 1', 'Số 3 không thuộc ma trận', 'A[0][1] là hàng đầu cột thứ hai, tức 2.'],
  ['A=[[5,6,7],[8,9,10]]. A[1][2] bằng gì?', '10', '7', '9', 'Chỉ số 1 chọn hàng [8,9,10], chỉ số 2 chọn phần tử cuối.'],
  [['matrix', 'Ma trận: bảng số có cùng số cột ở mỗi hàng.', '[[1,2],[3,4]]'], ['shape', 'Cặp số hàng và số cột.', '(2,3)']],
  ['lists', 'notation'], ['Bảng [[1,2],[3]] có dùng như ma trận chữ nhật 2×2 không?', 'Không: các hàng không đều độ dài. Cần xác định hoặc sửa cấu trúc trước khi tính.']);

d(6, 'Đổi bảng học sinh×môn thành môn×học sinh: các con số đi đâu?',
  'Chuyển vị bằng cách đổi vai trò hàng/cột|Cộng hai ma trận cùng kích thước',
  'Ghi kích thước m×n trước khi chuyển vị|Đưa ô (i,j) sang (j,i)|Kiểm tra kích thước mới n×m|Khi cộng, ghép các ô cùng vị trí',
  'Chuyển vị ma trận giống đảo thứ tự từng hàng.', 'Vẽ đường đi riêng của ô hàng 1 cột 2 đến hàng 2 cột 1; đừng phản chiếu trái-phải.',
  ['Chuyển vị ma trận 2×3 cho kích thước nào?', '3×2', '2×3', '3×3', 'Hàng trở thành cột nên hai kích thước đổi chỗ.'],
  ['[[1,2],[3,4]] bị chuyển vị thành [[2,1],[4,3]]. Lỗi gì?', 'Đã đảo hàng thay vì đổi hàng thành cột', 'Chuyển vị phải đổi dấu mọi ô', 'Chuyển vị cần lấy nghịch đảo', 'Chuyển vị đúng là [[1,3],[2,4]].'],
  ['A có shape 2×3, B có shape 2×2. Có cộng từng ô được không?', 'Không, kích thước không khớp', 'Có, bỏ cột cuối của A', 'Có, luôn điền thêm 0 vào B', 'Phép cộng ma trận chuẩn yêu cầu cùng kích thước.'],
  [['transpose', 'Chuyển vị: đổi chỉ số hàng và cột.', '(Aᵀ)[j,i]=A[i,j]'], ['identity matrix', 'Ma trận vuông có 1 trên đường chéo, 0 ở nơi khác.', 'I₂=[[1,0],[0,1]]']],
  ['lists', 'loops'], ['Chuyển vị hai lần một bảng chữ nhật cho kết quả gì?', 'Trở lại bảng ban đầu vì (i,j) được đổi qua (j,i) rồi đổi lại.']);

d(8, 'Một ô kết quả phải kết hợp cả hàng đơn giá và cột số lượng. Vì sao không chỉ nhân hai ô cùng chỗ?',
  'Kiểm tra điều kiện nhân ma trận|Tính một ô bằng tích hàng với cột',
  'So số cột A với số hàng B|Lấy một hàng i của A và cột j của B|Nhân các cặp tương ứng|Cộng các tích thành ô C[i,j]|Lặp cho mọi hàng và cột',
  'Nhân ma trận luôn là nhân từng ô cùng vị trí.', 'Tô một hàng A và một cột B; nối mỗi cặp rồi cộng tích.',
  ['A có shape 2×3, B có shape 3×4. AB có shape nào?', '2×4', '3×3', '4×2', 'Kích thước chung 3 được cộng qua; còn hàng của A và cột của B.'],
  ['Tính [1,2] nhân cột [3,4] ra [3,8]. Thiếu bước gì?', 'Cộng 3+8 để được một số 11', 'Đổi 4 thành -4', 'Chia từng tích cho 2', 'Một ô của tích ma trận là tổng các tích, không phải một vector.'],
  ['A=[[1,2]], B=[[3],[4]]. AB bằng gì?', '[[11]]', '[[3,8]]', '[[7]]', '1×3 + 2×4 = 11 trong ma trận 1×1.'],
  [['matrix product', 'Tích ma trận, mỗi ô là một tích vô hướng hàng–cột.', 'C[i,j]=Σ A[i,k]B[k,j]'], ['compatible dimensions', 'Hai kích thước trong phải khớp khi nhân.', '(2×3)(3×4)']],
  ['loops', 'lists', 'sums'], ['Nếu AB tồn tại, BA có chắc tồn tại và bằng AB không?', 'Không. Điều kiện kích thước và thứ tự đều cần kiểm tra riêng; tích ma trận nói chung không giao hoán.']);

d(9, 'Biết một máy biến đổi hai mũi tên trục, bạn có đoán được mọi điểm trên bản đồ không?',
  'Đọc ảnh của hai vector cơ sở từ các cột|Tính Av và phân biệt phép tuyến tính với tịnh tiến',
  'Đọc cột đầu là ảnh của [1,0]|Đọc cột hai là ảnh của [0,1]|Nhân hai cột với x và y|Cộng thành Av|Thử điểm gốc để nhận ra tịnh tiến',
  'Ảnh của [1,0] luôn là hàng đầu của A.', 'Nhân A với cột [1,0] để thấy hệ số chọn cột đầu, không phải hàng đầu.',
  ['A=[[2,1],[0,1]]. Ảnh của [1,0] là gì?', '[2,0]', '[2,1]', '[1,1]', 'Nhân với [1,0] lấy đúng cột thứ nhất.'],
  ['T(v)=Av+[1,0] được gọi là tuyến tính. Điểm nào bác bỏ?', 'T(0)=[1,0] khác 0', 'T dùng một ma trận', 'A có hai hàng', 'Phép tuyến tính phải giữ vector không; tịnh tiến khác 0 làm mất điều đó.'],
  ['Với A=[[2,1],[0,1]], tích A·v với vector cột v=[1,1] bằng gì?', '[3,1]', '[2,2]', '[1,3]', 'Cộng cột đầu [2,0] với cột hai [1,1]. Đây là nhân ma trận với vector, không phải truy cập một ô.'],
  [['basis vector', 'Vector cơ sở của các trục tọa độ.', 'e₁=[1,0]'], ['affine', 'Phép Av+b gồm phần tuyến tính và phần tịnh tiến.', 'T(v)=Av+[1,0]']],
  ['lists', 'coordinates'], ['Máy biến đổi làm [1,0]→[0,1] và [0,1]→[-1,0]. Điểm [2,3] đi đâu?', '2[0,1]+3[-1,0]=[-3,2], một phép quay 90 độ.']);

d(10, 'Ô vuông trên bản đồ bị ép thành một đoạn thẳng. Dấu hiệu số nào cho biết bạn đã mất một hướng?',
  'Tính định thức ma trận 2×2|Diễn giải dấu và độ lớn bằng hình diện tích',
  'Nhân hai ô đường chéo chính ad|Nhân hai ô chéo còn lại bc|Lấy ad-bc|Dùng trị tuyệt đối cho hệ số diện tích|Kiểm tra dấu để biết hướng có bị đảo',
  'Định thức âm nghĩa là diện tích vật lý âm.', 'So hai hình lật gương: diện tích giữ dương, còn dấu ghi nhận hướng.',
  ['det([[2,0],[0,3]]) bằng bao nhiêu?', '6', '5', '0', '2×3 - 0×0 = 6; diện tích tăng sáu lần.'],
  ['Ma trận [[1,2],[2,4]] có nhiều ô khác 0 nên bị kết luận khả nghịch. Lỗi gì?', 'Hai cột phụ thuộc, định thức vẫn bằng 0', 'Ô khác 0 luôn chứng minh khả nghịch', 'Ma trận này không vuông', '1×4 - 2×2 = 0; dữ liệu khác 0 không đảm bảo giữ đủ hai hướng.'],
  ['det([[0,1],[1,0]]) cho biết điều gì?', 'Đảo hướng và giữ nguyên diện tích', 'Tăng diện tích hai lần', 'Mất một hướng', 'Định thức -1: độ lớn 1, dấu âm.'],
  [['determinant', 'Định thức: hệ số thể tích có dấu của phép tuyến tính vuông.', 'det₂=ad-bc'], ['singular', 'Suy biến: ma trận vuông mất thông tin nên không khả nghịch.', 'det(A)=0']],
  ['sums', 'notation'], ['Hai phép biến đổi có định thức 2 và -3 nối tiếp thì hệ số diện tích và hướng thế nào?', 'Định thức tích là -6: diện tích gấp 6 và hướng đảo.']);

d(11, 'Che một hàng và một cột trong bảng 3×3: bảng nhỏ còn lại góp gì vào định thức?',
  'Tách minor và cofactor đúng dấu|Khai triển định thức theo một hàng có nhiều số 0',
  'Chọn ô a[i,j]|Bỏ toàn bộ hàng i và cột j|Tính định thức bảng còn lại để được minor|Nhân dấu (-1)^(i+j) để được cofactor|Cộng a[i,j]C[i,j] dọc hàng đã chọn',
  'Minor và cofactor luôn bằng nhau.', 'Vẽ bảng dấu +−+ / −+− / +−+ và đặt minor vào ô cần xét.',
  ['Cofactor khác minor ở yếu tố nào?', 'Dấu theo vị trí hàng và cột', 'Luôn lấy trị tuyệt đối', 'Luôn cộng thêm phần tử gốc', 'Cij=(-1)^(i+j)Mij, với cùng quy ước chỉ số.'],
  ['Ô hàng 1 cột 2 theo cách đếm từ 1 có minor 5. Ghi cofactor 5 sai ở đâu?', 'Vị trí có dấu âm, cofactor phải là -5', 'Minor phải bằng 0', 'Cofactor luôn dương', '1+2 là số lẻ nên hệ số dấu là -1.'],
  ['Khai triển theo hàng [0,0,4], cần tính nhiều nhất bao nhiêu hạng sau khi bỏ các hệ số 0?', 'Một hạng', 'Ba hạng', 'Không hạng nào', 'Hai hệ số 0 bỏ được ngay; chỉ còn 4 nhân cofactor của nó. Hạng còn lại cũng có thể bằng 0 nếu cofactor bằng 0.'],
  [['minor', 'Định thức còn lại sau khi bỏ một hàng và một cột.', 'M₁₂'], ['cofactor', 'Minor được nhân dấu bàn cờ.', 'C₁₂=-M₁₂']],
  ['lists', 'notation'], ['Bỏ hàng i và cột j trong ma trận 4×4 thì minor là định thức cỡ nào?', '3×3 vì mỗi lần bỏ đúng một hàng và một cột.']);

d(12, 'Một máy ép cả mặt phẳng xuống một đường: có nút hoàn tác để biết điểm ban đầu không?',
  'Nhận ra điều kiện có nghịch đảo|Kiểm tra nghịch đảo bằng tích bằng I',
  'Kiểm tra A vuông và det khác 0|Với 2×2, đổi hai ô đường chéo|Đổi dấu hai ô ngoài đường chéo|Chia cả bảng cho det|Nhân thử với A để thu được I',
  'Chuyển vị luôn là nghịch đảo.', 'Nhân [[2,0],[0,1]] với chuyển vị của nó: ra [[4,0],[0,1]], không phải I.',
  ['Ma trận vuông có det=0 có nghịch đảo không?', 'Không', 'Có nếu mọi ô đều là số nguyên', 'Luôn lấy chuyển vị làm nghịch đảo', 'Mất một hướng khiến nhiều đầu vào cho cùng đầu ra, không thể hoàn tác duy nhất.'],
  ['Nghịch đảo [[2,0],[0,1]] được ghi [[2,0],[0,1]]. Lỗi gì?', 'Phải đảo hệ số 2 thành 1/2', 'Phải đổi mọi ô thành số âm', 'Ma trận chéo không thể nghịch đảo', 'Nhân 2 rồi nhân 1/2 mới trả lại tọa độ ban đầu.'],
  ['A nhân B bằng I và A vuông khả nghịch. B đóng vai trò gì?', 'Nghịch đảo của A', 'Ma trận không', 'Luôn là chính A', 'B hoàn tác A nên B=A⁻¹.'],
  [['inverse', 'Ma trận nghịch đảo hoàn tác phép biến đổi.', 'A⁻¹A=I'], ['invertible', 'Khả nghịch: tồn tại nghịch đảo.', 'det(A)≠0']],
  ['fractions', 'lists'], ['Muốn giải Ax=b, có bắt buộc tính toàn bộ A⁻¹ trước không?', 'Không. Giải hệ trực tiếp tránh làm nhiều việc hơn cần thiết; nghịch đảo hữu ích để hiểu phép hoàn tác.']);

d(13, 'Hai hóa đơn cho hai phương trình. Trừ hai lần hóa đơn đầu khỏi hóa đơn sau có làm đổi nghiệm không?',
  'Áp dụng một phép hàng cho cả [A|b]|Phát hiện phép biến đổi làm mất ràng buộc',
  'Viết hệ thành ma trận mở rộng [A|b]|Chọn đổi hàng, nhân số khác 0 hoặc cộng bội hàng khác|Thực hiện trên mọi ô, gồm cả b|Thử một nghiệm trước và sau để thấy tương đương',
  'Có thể biến đổi A mà để b đứng yên.', 'Đặt vế phải vào cùng một hàng màu và kéo theo trong mỗi thao tác.',
  ['Phép nào giữ tập nghiệm của hệ?', 'Cộng hai lần hàng 1 vào hàng 2', 'Nhân một hàng với 0', 'Chỉ sửa hệ số nhưng bỏ vế phải', 'Cộng bội một phương trình khác là phép hàng sơ cấp khả nghịch.'],
  ['Nhân hàng [1,2|3] với 2 ra [2,4|3]. Thiếu gì?', 'Vế phải cũng phải thành 6', 'Phải giữ hệ số đầu bằng 1', 'Không được nhân với 2', 'Cả phương trình được nhân 2, không chỉ phần A.'],
  ['R₂=[2,-1|2], R₁=[1,1|4]. R₂-2R₁ bằng gì?', '[0,-3|-6]', '[0,1|2]', '[2,-3|-6]', 'Trừ từng cặp ô: 2-2=0, -1-2=-3, 2-8=-6.'],
  [['augmented matrix', 'Ma trận mở rộng chứa hệ số và vế phải.', '[A|b]'], ['row operation', 'Phép biến đổi sơ cấp trên trọn một hàng.', 'R₂←R₂-2R₁']],
  ['lists', 'notation'], ['Vì sao không dùng phép R₁←0R₁ để đơn giản hệ?', 'Phương trình bị biến thành 0=0, có thể mất ràng buộc và tạo thêm nghiệm.']);

d(15, 'Bạn muốn giải ẩn cuối trước, nhưng bên dưới pivot vẫn còn số. Làm sao dọn thành hệ tam giác?',
  'Khử phía dưới các pivot rồi thế ngược|Kiểm chứng nghiệm bằng hệ ban đầu',
  'Chọn pivot khác 0, đổi hàng nếu cần|Trừ bội hàng pivot để khử phía dưới|Đi tiếp sang cột và hàng kế|Giải từ biến cuối rồi thế lên|Tính Ax và so với b ban đầu',
  'Gặp pivot 0 là hệ chắc chắn vô nghiệm.', 'Tìm hàng dưới còn số khác 0 trong cùng cột trước khi kết luận.',
  ['Sau khi đưa hệ khả nghịch về tam giác trên, nên giải từ đâu?', 'Phương trình cuối rồi thế ngược lên', 'Luôn bắt đầu bằng cộng mọi hàng', 'Gán mọi biến bằng 0', 'Hàng cuối còn ít ẩn nhất, dùng nghiệm đó để giải hàng trên.'],
  ['Pivot đầu bằng 0 nhưng hàng dưới cùng cột bằng 2. Việc cần làm?', 'Đổi hai hàng phù hợp', 'Chia hàng đầu cho 0', 'Kết luận vô nghiệm ngay', 'Đổi hàng giữ nghiệm và cung cấp pivot hợp lệ.'],
  ['Hệ x+y=3, 2y=2 có nghiệm nào?', '[2,1]', '[1,2]', '[3,2]', 'Hàng cuối cho y=1, thế lên x=2.'],
  [['pivot', 'Phần tử dẫn dùng làm điểm tựa khử một cột.', 'Pivot 2 ở hàng thứ hai.'], ['back substitution', 'Thế ngược từ phương trình cuối lên.', 'Biết y rồi tìm x.']],
  ['loops', 'fractions', 'lists'], ['Một lời giải trông giống ví dụ nhưng Ax không bằng b. Có chấp nhận không?', 'Không. Thế vào hệ gốc mới là bằng chứng; hình thức giống mẫu không đảm bảo đúng.']);

d(16, 'Mỗi cột pivot cần một đèn 1 duy nhất. Còn số ở phía trên đèn thì đã là RREF chưa?',
  'Đọc đủ điều kiện RREF|Khử cả phía trên và dưới pivot',
  'Đưa mọi hàng 0 xuống cuối|Chọn pivot dịch sang phải qua từng hàng|Chuẩn hóa pivot thành 1|Khử mọi ô khác trong cột pivot|Kiểm tra lại toàn bộ cột pivot',
  'Pivot bằng 1 và các ô bên dưới bằng 0 đã đủ RREF.', 'Tô cả cột pivot, tìm các số khác 0 phía trên rồi khử nốt.',
  ['Trong cột pivot của RREF có bao nhiêu phần tử khác 0?', 'Một', 'Ít nhất hai', 'Số hàng bất kỳ đều được', 'Pivot là 1 và mọi ô khác trong cột đó là 0.'],
  ['[[1,2],[0,1]] đã là RREF chưa?', 'Chưa, ô 2 phía trên pivot cột hai phải bằng 0', 'Đã là RREF vì đường chéo bằng 1', 'Chưa vì mọi hàng phải bắt đầu bằng 1', 'Cột pivot thứ hai còn một ô khác 0 phía trên.'],
  ['Khử ô 2 trên pivot trong [[1,2],[0,1]] bằng phép nào?', 'R₁←R₁-2R₂', 'R₂←R₂-2R₁', 'Nhân R₂ với 0', 'Trừ 2 lần hàng thứ hai làm ô trên pivot bằng 0 và giữ pivot.'],
  [['REF', 'Dạng bậc thang với 0 dưới pivot.', 'Pivot hàng dưới nằm bên phải.'], ['RREF', 'Bậc thang rút gọn với pivot 1 và cột pivot sạch.', '[[1,0],[0,1]]']],
  ['lists', 'loops'], ['Hai cách chọn phép hàng khác nhau có thể cho hai RREF chính xác khác nhau của cùng A không?', 'Không trên cùng trường số: RREF là duy nhất, dù các bước trung gian có thể khác.']);

d(17, 'Ba mũi tên đều khác 0 nhưng nằm trên cùng một đường. Có thật là ba hướng độc lập?',
  'Tính rank bằng số pivot|Giải thích vì sao hàng gốc khác 0 chưa đủ',
  'Sao chép ma trận để giữ dữ liệu gốc|Khử về dạng bậc thang|Đếm pivot khác 0|So rank với min(số hàng,số cột)',
  'Rank là số hàng khác 0 trong ma trận chưa khử.', 'Khử [[1,2],[2,4]] để hàng sau thành 0 rồi đếm phần độc lập còn lại.',
  ['[[1,2],[2,4]] có rank bao nhiêu?', '1', '2', '0', 'Hàng hai gấp đôi hàng một nên chỉ có một ràng buộc độc lập.'],
  ['Ma trận 2×5 bị ghi rank 4. Vì sao không thể?', 'Rank không vượt quá số hàng 2', 'Rank luôn bằng số cột 5', 'Rank phải là số âm', 'rank(A)≤min(m,n), nên tối đa 2.'],
  ['Dạng bậc thang có hai hàng pivot và một hàng 0. Rank?', '2', '3', '1', 'Mỗi pivot đóng góp một chiều độc lập.'],
  [['rank', 'Số chiều độc lập của không gian hàng hoặc cột.', 'Hai hàng tỉ lệ cho rank 1.'], ['dependent', 'Phụ thuộc: một hướng tạo được từ các hướng khác.', '[2,4]=2[1,2]']],
  ['lists', 'notation'], ['Thêm vào ma trận một hàng bằng tổng hai hàng đã có có tăng rank không?', 'Không. Hàng mới không thêm ràng buộc độc lập.']);

d(18, 'Hai đường thẳng cắt nhau, trùng nhau hoặc song song: bảng số nào phân biệt ba cảnh đó?',
  'Phân loại hệ bằng rank và hàng mâu thuẫn|Phân biệt duy nhất với vô số nghiệm',
  'Khử ma trận mở rộng [A|b]|Tìm hàng 0=c với c khác 0|Nếu có, báo vô nghiệm|Nếu không, so rank với số ẩn|Đủ pivot là duy nhất, thiếu pivot là có biến tự do',
  'Số phương trình bằng số ẩn đảm bảo nghiệm duy nhất.', 'So x+y=3 và 2x+2y=6: hai phương trình nhưng cùng một ràng buộc.',
  ['Hàng [0,0|1] biểu thị điều gì?', 'Hệ vô nghiệm', 'Cả hai biến bằng 0', 'Hệ có đúng một nghiệm', 'Nó nói 0=1, một mâu thuẫn.'],
  ['x+y=3 và 2x+2y=6 bị kết luận duy nhất vì có hai ẩn. Sai ở đâu?', 'Hai phương trình phụ thuộc nên còn biến tự do', 'Hai vế phải khác nhau nên vô nghiệm', 'Hệ có số nguyên nên không thể vô số nghiệm', 'Phương trình thứ hai chỉ là hai lần phương trình đầu.'],
  ['x+y=3 và 2x+2y=7 có loại nghiệm nào?', 'Vô nghiệm', 'Vô số nghiệm', 'Duy nhất [1,2]', 'Nhân phương trình đầu cho 2 cho vế phải 6, mâu thuẫn 7.'],
  [['consistent', 'Hệ tương thích: có ít nhất một nghiệm.', 'x+y=3'], ['free variable', 'Biến tự do có thể chọn khi thiếu pivot.', 'Chọn y=t thì x=3-t.']],
  ['conditions', 'lists', 'notation'], ['Hệ thuần nhất Ax=0 có thể vô nghiệm không?', 'Không. Vector 0 luôn thỏa; vấn đề là có thêm nghiệm khác 0 hay không.']);

d(19, 'Bitty di chuyển theo một hướng nhưng ảnh trên màn hình đứng yên. Hướng nào đã bị ma trận xóa?',
  'Kiểm tra một vector thuộc nullspace|Dùng nghiệm khác 0 để chứng minh cột phụ thuộc',
  'Chọn vector x cần thử|Tính Ax|Kiểm tra mọi thành phần bằng 0 trong sai số cho phép|Phân biệt nghiệm 0 với bằng chứng phụ thuộc|Nếu cần, chuẩn hóa vector khác 0',
  'Vì A0=0 nên mọi ma trận có cột phụ thuộc.', 'Hỏi có nghiệm khác vector 0 không; nghiệm 0 tồn tại với mọi A nên không phân biệt được.',
  ['Nullspace của A gồm các vector nào?', 'Các x thỏa Ax=0', 'Các x thỏa Ax=x', 'Chỉ các cột khác 0 của A', 'Đây là tập hướng mà phép biến đổi đưa về vector không.'],
  ['Dùng x=[0,0] để chứng minh hai cột phụ thuộc. Thiếu điều kiện gì?', 'x phải khác vector 0', 'x phải có mọi số dương', 'A phải có định thức 1', 'Bằng chứng phụ thuộc cần một tổ hợp bằng 0 với hệ số không đồng thời bằng 0.'],
  ['A=[[1,2],[2,4]]. Vector nào khác 0 bị A đưa về 0?', '[-2,1]', '[1,2]', '[1,0]', '1(-2)+2(1)=0 và 2(-2)+4(1)=0.'],
  [['nullspace', 'Không gian các vector bị A đưa về 0.', 'N(A)={x:Ax=0}'], ['linear independence', 'Độc lập: chỉ tổ hợp có mọi hệ số 0 mới ra vector 0.', 'Hai hướng trục trong 2D.']],
  ['lists', 'notation'], ['Nếu x khác 0 thuộc nullspace thì -x có thuộc không?', 'Có. A(-x)=-(Ax)=0; hai dấu biểu diễn cùng một hướng bị xóa.']);

d(20, 'Bạn muốn giữ ít mũi tên nhất mà vẫn đi tới mọi điểm trước đây. Chọn bộ nào?',
  'Kiểm tra cơ sở phải vừa độc lập vừa sinh đủ|Tính nullity từ rank và số cột',
  'Xác định không gian cần sinh|Chọn các vector độc lập|Kiểm tra chúng sinh được mọi cột cần thiết|Nếu tìm cột pivot bằng RREF, lấy cột tương ứng từ A gốc|Tính nullity=n-rank',
  'Bất kỳ bộ vector độc lập nào cũng là cơ sở của không gian đang xét.', 'Một vector trục x độc lập nhưng không sinh được cả mặt phẳng; cần kiểm tra cả hai điều kiện.',
  ['Một cơ sở cần hai tính chất nào?', 'Độc lập và sinh toàn bộ không gian đang xét', 'Mọi tọa độ dương và khác nhau', 'Số vector luôn bằng số hàng gốc', 'Độc lập tránh dư thừa, sinh đủ tránh thiếu hướng.'],
  ['Lấy cột của RREF làm cơ sở column space của A. Rủi ro gì?', 'Phép hàng có thể đổi không gian cột; cần lấy cột A gốc', 'RREF không thể xác định vị trí pivot', 'Cơ sở chỉ chứa cột bằng 0', 'Vị trí pivot hữu ích, còn vector cơ sở phải lấy từ A ban đầu.'],
  ['A có 5 cột, rank 3. Nullity bằng bao nhiêu?', '2', '3', '8', 'rank+nullity bằng số cột: 5-3=2.'],
  [['span', 'Tập tất cả tổ hợp tuyến tính của một bộ vector.', 'Span([1,0],[0,1])=ℝ²'], ['basis', 'Bộ độc lập sinh toàn bộ không gian.', 'Hai vector trục là cơ sở ℝ².']],
  ['notation', 'sums'], ['Hai người chọn hai cặp cột khác nhau làm cơ sở. Có thể cả hai đúng không?', 'Có, nếu cả hai bộ đều độc lập và sinh cùng không gian; cơ sở không duy nhất.']);

d(22, 'Một điểm nằm ngoài đường ray. Điểm nào trên ray là bóng vuông góc gần nó nhất?',
  'Tính hình chiếu lên một hướng khác 0|Kiểm tra residual vuông góc với hướng chiếu',
  'Tính u·v bằng tổng tích tọa độ|Tính v·v và kiểm tra khác 0|Tính hệ số (u·v)/(v·v)|Nhân hệ số với v|Lấy residual=u-proj và thử residual·v',
  'Hình chiếu lên v luôn bằng (u·v)v.', 'Công thức đó chỉ đúng khi v có độ dài 1; giữ mẫu số v·v cho trường hợp chung.',
  ['Residual của hình chiếu vuông góc lên v có quan hệ gì với v?', 'Vuông góc', 'Luôn bằng v', 'Luôn có độ dài 1', 'Tích vô hướng residual·v bằng 0.'],
  ['Chiếu u lên v=[0,0] bằng công thức rồi chia cho 0. Vấn đề ở đâu?', 'Vector 0 không xác định một hướng chiếu', 'Phải đổi dấu u', 'Tích vô hướng không dùng được số 0', 'Mẫu v·v bằng 0; cần hướng khác vector không.'],
  ['u=[3,1], v=[1,1]. Hình chiếu bằng gì?', '[2,2]', '[4,4]', '[1,3]', 'u·v=4, v·v=2, nên hệ số bằng 2.'],
  [['dot product', 'Tích vô hướng: cộng tích các tọa độ tương ứng.', '[3,1]·[1,1]=4'], ['residual', 'Phần còn lại sau khi trừ hình chiếu hoặc dự đoán.', '[3,1]-[2,2]=[1,-1]']],
  ['sums', 'fractions', 'lists'], ['Đổi hướng v thành 5v có đổi hình chiếu lên đường do v sinh không?', 'Không: đường vẫn giữ nguyên; hệ số thay đổi để bù độ dài của v.']);

d(23, 'Các điểm đo không thẳng hàng. Chọn đường nào khi không thể đi qua tất cả?',
  'Tính residual và tổng bình phương sai số|Giải thích đường least squares không cần khớp mọi điểm',
  'Chọn mô hình ŷ=a+bx|Tính dự đoán ở từng x|Lấy residual=y-ŷ|Bình phương và cộng residual|Điều chỉnh a,b để tổng nhỏ nhất',
  'Một đường tốt bắt buộc đi qua mọi điểm dữ liệu.', 'Vẽ ba điểm không thẳng hàng và so tổng bình phương sai số của hai đường thử.',
  ['Least squares tối thiểu hóa đại lượng nào?', 'Tổng bình phương residual', 'Tổng y của dữ liệu', 'Số điểm có x dương', 'Bình phương làm sai số âm và dương không triệt tiêu.'],
  ['Sai số +2 và -2 được cộng thành 0 rồi kết luận khớp hoàn toàn. Sai ở đâu?', 'Cần bình phương: SSE=4+4=8', 'Sai số âm phải bỏ đi', 'Hai điểm luôn nằm trên đường đang chọn', 'Tổng sai số có thể triệt tiêu dù dự đoán sai.'],
  ['y=[2,4], dự đoán [1,5]. SSE bằng gì?', '2', '0', '4', 'Residual [1,-1] cho 1²+(-1)²=2.'],
  [['least squares', 'Bình phương tối thiểu: tìm mô hình có tổng sai số bình phương nhỏ nhất.', 'Fit y≈a+bx'], ['SSE', 'Tổng bình phương sai số, chưa chia số mẫu.', 'Σ(y-ŷ)²']],
  ['mean', 'sums', 'notation'], ['Tất cả x bằng nhau thì có xác định duy nhất cả slope và intercept không?', 'Không. Hai tham số không phân biệt được từ cùng một giá trị x; cần báo điều kiện suy biến hoặc quy ước rõ.']);

d(24, 'Ma trận thường bẻ hướng mũi tên. Có mũi tên nào chỉ dài ra, ngắn lại hoặc đảo chiều?',
  'Kiểm tra cặp trị riêng/vector riêng|Nhận ra vector riêng phải khác 0',
  'Chọn vector v khác 0|Tính Av|Tìm hệ số λ cùng áp dụng cho mọi tọa độ|So Av với λv|Chấp nhận đổi dấu hoặc độ dài vector riêng',
  'Mọi vector không đổi độ dài đều là vector riêng.', 'Vector có thể giữ độ dài nhưng bị quay sang hướng khác; kiểm tra song song bằng Av=λv.',
  ['Điều kiện của cặp (λ,v) là gì?', 'v khác 0 và Av=λv', 'v=0 và λ tùy ý', 'Av luôn bằng v với mọi λ', 'Vector riêng giữ đường phương, không nhất thiết giữ độ dài hoặc chiều.'],
  ['Dùng v=0 vì A0=λ0. Vì sao không được?', 'Không có hướng và sẽ đúng với mọi λ, nên bị loại khỏi định nghĩa', 'Vector 0 không có tọa độ', 'Mọi ma trận đều phải có λ=0', 'Điều kiện v≠0 ngăn nghiệm tầm thường.'],
  ['A=[[2,0],[0,3]], v=[1,0]. λ tương ứng?', '2', '3', '5', 'Av=[2,0]=2v.'],
  [['eigenvector', 'Vector khác 0 chỉ bị co giãn theo chính hướng của nó.', 'A[1,0]=2[1,0]'], ['eigenvalue', 'Hệ số co giãn đi cùng vector riêng.', 'λ=2']],
  ['lists', 'notation'], ['v là vector riêng của λ. -3v có còn là vector riêng của cùng λ không?', 'Có vì A(-3v)=-3Av=λ(-3v), và -3v vẫn khác 0.']);

d(25, 'Lặp cùng một phép biến đổi 20 lần: có đổi sang hệ trục khiến mỗi bước chỉ nhân từng số được không?',
  'Giải thích A=PDP⁻¹ khi có đủ vector riêng|Tính lũy thừa qua D khi điều kiện phù hợp',
  'Tìm đủ vector riêng độc lập|Xếp chúng vào cột P với trị riêng cùng thứ tự trong D|Kiểm tra P khả nghịch và AP=PD|Nâng lũy thừa từng ô chéo D|Ghép lại P Dᵏ P⁻¹',
  'Mọi ma trận vuông đều chéo hóa được.', 'Ma trận [[1,1],[0,1]] chỉ có một hướng riêng độc lập nên thiếu một cột của P.',
  ['Điều kiện quan trọng để chéo hóa ma trận n×n là gì?', 'Có n vector riêng độc lập', 'Mọi phần tử đều dương', 'Định thức luôn bằng 1', 'P phải khả nghịch nên các cột vector riêng cần độc lập.'],
  ['D=diag(2,3). Đổi chỗ hai cột vector riêng của P nhưng giữ nguyên D gây lỗi gì?', 'Ghép sai trị riêng với vector riêng', 'Mọi phép đổi thứ tự đều bị cấm', 'D cần thành ma trận không', 'Hai trị riêng khác nhau phải đi cùng đúng cột P. Có thể đổi cả cột P và ô chéo D tương ứng; nếu trị riêng trùng nhau thì đổi trong cùng không gian riêng không gây lỗi này.'],
  ['D=diag(2,3). D² bằng gì?', 'diag(4,9)', 'diag(2,6)', 'diag(4,6)', 'Ma trận chéo nhân với chính nó làm từng phần tử đường chéo được bình phương.'],
  [['diagonalization', 'Chéo hóa: đổi cơ sở để phép biến đổi thành ma trận chéo.', 'A=PDP⁻¹'], ['matrix power', 'Lặp phép nhân cùng ma trận.', 'A³=A·A·A']],
  ['notation', 'loops'], ['A⁰ bằng ma trận không hay I?', 'Bằng I với ma trận vuông; lặp phép biến đổi 0 lần giữ nguyên mọi vector.']);

d(26, 'Một ma trận có thể thỏa chính đa thức đặc trưng của nó. Thay số bằng ma trận cần thay số 1 ra sao?',
  'Lập biểu thức Cayley–Hamilton cho 2×2|Tính các số hạng trung gian để kiểm tra đẳng thức',
  'Tính trace t và định thức d|Nhân A với A để được A²|Lập A²-tA+dI|Thay hằng số bằng bội của I|Kiểm tra residual gần ma trận 0',
  'Hằng số d trong đa thức nghĩa là cộng d vào mọi ô.', 'Viết dI: chỉ đường chéo nhận d, ô ngoài chéo nhận 0.',
  ['Với ma trận 2×2, Cayley–Hamilton có dạng nào?', 'A²-tr(A)A+det(A)I=0', 'A²-tr(A)+det(A)=0 cho từng ô', 'A² luôn bằng I', 'Hằng số của đa thức đi với I để giữ phép toán ma trận.'],
  ['Trả luôn ma trận 0 mà không tính A², trace, det có chứng minh đã làm đúng các bước không?', 'Không, cần các đại lượng trung gian nhất quán', 'Có vì mọi A² đều là 0', 'Có vì trace luôn bằng det', 'Residual biết trước bằng 0 không xác minh được phép tính trung gian.'],
  ['A=diag(2,3). Trace và det là gì?', 'Trace 5, det 6', 'Trace 6, det 5', 'Trace 2, det 3', 'Trace là tổng đường chéo; định thức của ma trận chéo là tích.'],
  [['trace', 'Vết: tổng các phần tử đường chéo.', 'tr(diag(2,3))=5'], ['characteristic polynomial', 'Đa thức det(λI-A) gắn với ma trận.', 'λ²-5λ+6']],
  ['notation', 'lists'], ['Với A=diag(2,3), ô đầu của A²-5A+6I bằng gì?', '4-10+6=0. Kiểm tra từng hạng giúp thấy đẳng thức hoạt động.']);

d(27, 'Cả đoàn Bitty cần đổi bản đồ rồi dịch tới cửa mới. Làm sao áp dụng cùng phép cho mọi điểm?',
  'Tính p mới bằng Ap+b theo đúng thứ tự|Thiết kế test phát hiện lỗi đổi trục và bỏ tịnh tiến',
  'Đọc ma trận A, vector b và danh sách điểm|Tính Ap cho từng điểm gốc|Cộng b vào kết quả|Giữ nguyên thứ tự danh sách|Thử gốc và hai vector trục',
  'Ap+b luôn bằng A(p+b).', 'Dùng A=2I, b=[1,0], p=0: hai cách cho [1,0] và [2,0].',
  ['Trong phép affine Ap+b, b làm nhiệm vụ gì?', 'Dịch kết quả sau biến đổi tuyến tính', 'Đổi kích thước ma trận A', 'Luôn bằng trị riêng của A', 'A thay đổi hướng/co giãn, b thêm tịnh tiến.'],
  ['Chương trình tính A(p+b) cho đề Ap+b. Vì sao có thể sai?', 'b cũng bị A biến đổi, trái thứ tự yêu cầu', 'Phép cộng không dùng được với vector', 'A chỉ áp dụng được cho một điểm duy nhất', 'Trong A(p+b)=Ap+Ab, b bị thay bằng Ab.'],
  ['A=2I, b=[1,-1], p=[2,3]. Điểm mới?', '[5,5]', '[6,4]', '[4,6]', 'Ap=[4,6], cộng b thành [5,5].'],
  [['batch', 'Xử lý một danh sách đối tượng bằng cùng quy tắc.', 'Biến đổi 10 điểm.'], ['translation', 'Tịnh tiến: cộng cùng một vector vào mọi điểm.', 'p→p+[1,-1]']],
  ['loops', 'lists', 'functions'], ['Vì sao test p=[0,0] giúp phát hiện bỏ quên b?', 'Ap bằng 0 nên đầu ra đúng phải là b; thiếu tịnh tiến sẽ trả 0.']);

d(29, 'Hai mũi tên xiên giúp đi khắp mặt phẳng nhưng khó đo. Làm sao dựng hai trục vuông góc từ chúng?',
  'Thực hiện Gram–Schmidt cho hai vector độc lập|Kiểm tra trực giao và độ dài 1',
  'Chuẩn hóa vector đầu thành q₁|Chiếu vector hai lên q₁|Trừ phần chiếu để lấy hướng vuông góc|Kiểm tra phần còn lại khác 0|Chuẩn hóa thành q₂',
  'Chỉ cần chia mỗi vector cho độ dài là chúng tự vuông góc.', 'Chuẩn hóa giữ nguyên hướng; cần trừ hình chiếu trước khi chuẩn hóa vector thứ hai.',
  ['Bước làm vector thứ hai vuông góc với q₁ là gì?', 'Trừ hình chiếu lên q₁', 'Chỉ chia cho độ dài của nó', 'Cộng q₁ vào mọi tọa độ', 'Phần residual sau khi trừ chiếu có tích vô hướng với q₁ bằng 0.'],
  ['Hai vector đầu vào phụ thuộc cho residual 0. Có chuẩn hóa tiếp không?', 'Không, cần báo thiếu hướng độc lập', 'Có, chia 0 cho 0 để lấy trục mới', 'Thay residual bằng vector ban đầu', 'Vector 0 không có hướng và không thể chuẩn hóa thành độ dài 1.'],
  ['u=[1,0], v=[1,1]. Sau khi trừ chiếu lên u, phần còn lại?', '[0,1]', '[1,0]', '[2,1]', 'Chiếu v lên u là [1,0]; v-trục chiếu=[0,1].'],
  [['orthogonal', 'Trực giao: tích vô hướng bằng 0.', '[1,0]·[0,1]=0'], ['orthonormal', 'Trực chuẩn: trực giao và mỗi vector có độ dài 1.', 'Hai trục đơn vị.']],
  ['fractions', 'lists'], ['Đổi dấu q₂ có làm bộ trực chuẩn sai không?', 'Không, độ dài và tích vô hướng vẫn đúng; đó là một bộ hợp lệ khác.']);

d(30, 'Tách A thành Q giữ góc và R tam giác giúp giải hệ theo hai bước nào?',
  'Đọc vai trò Q và R trong QR|Kiểm tra QR tái tạo A và QᵀQ=I',
  'Dựng các cột trực chuẩn của Q|Ghi hệ số chiếu vào R|Kiểm tra R tam giác trên|Nhân QR để đối chiếu A|Dùng Qᵀb rồi thế ngược nếu giải hệ đủ hạng',
  'Chỉ cần QR=A, Q không cần trực chuẩn.', 'Kiểm tra riêng QᵀQ=I; tách I·A không tự là QR vì A có thể không tam giác.',
  ['Trong QR rút gọn đủ hạng, Q có các cột như thế nào?', 'Trực chuẩn', 'Giống hệt các cột A', 'Tất cả bằng vector 0', 'QᵀQ=I giúp phép chiếu và giải hệ đơn giản.'],
  ['Đổi dấu một cột Q nhưng giữ nguyên R. Điều gì bị sai?', 'Tích QR có thể đổi; cần đổi dấu hàng tương ứng của R', 'Q không còn có độ dài cột bằng 1', 'R phải đổi toàn bộ sang số dương', 'Hai thay đổi dấu tương ứng triệt tiêu nhau trong tích.'],
  ['Nếu Q=I và A là tam giác trên thì một QR hợp lệ là gì?', 'Q=I, R=A', 'Q=0, R=A', 'Q=A, R=0', 'I có các cột trực chuẩn và IA=A; R vẫn tam giác trên.'],
  [['QR factorization', 'Phân tích thành ma trận cột trực chuẩn và ma trận tam giác.', 'A=QR'], ['upper triangular', 'Tam giác trên: các ô dưới đường chéo bằng 0.', '[[2,1],[0,3]]']],
  ['lists', 'notation'], ['Hai QR có vài dấu khác nhau có thể cùng đúng không?', 'Có nếu mỗi Q trực chuẩn, R tam giác và QR khớp A; dấu không quyết định tính đúng.']);

d(31, 'Một vòng tròn bị biến thành ellipse: hai bán trục đo mức co giãn lớn và nhỏ thế nào?',
  'Diễn giải singular values là mức co giãn|Tính singular values từ AᵀA trên ví dụ nhỏ',
  'Lập ma trận đối xứng AᵀA|Tính các trị riêng không âm|Lấy căn bậc hai|Sắp giảm dần theo đặc tả|Đối chiếu bán trục ellipse',
  'Singular values có thể âm như trị riêng của A.', 'Bán trục là độ dài; singular values là căn không âm của trị riêng AᵀA.',
  ['Singular values có miền giá trị nào?', 'Không âm', 'Luôn âm', 'Luôn thuộc [-1,1]', 'Chúng đo độ lớn co giãn, không ghi dấu hướng.'],
  ['A=diag(-3,2) bị ghi singular values [-3,2]. Sai gì?', 'Cần lấy độ lớn co giãn: [3,2]', 'Mọi ma trận có số âm đều không có SVD', 'Phải cộng hai trị riêng', 'AᵀA=diag(9,4), lấy căn cho 3 và 2.'],
  ['A=diag(4,1) có singular values nào theo thứ tự giảm dần?', '[4,1]', '[16,1]', '[2,1]', 'AᵀA có trị riêng 16,1; căn bậc hai là 4,1.'],
  [['singular value', 'Mức co giãn không âm theo các hướng đặc biệt.', 'σ₁=4'], ['SVD', 'Tách biến đổi thành quay/đổi cơ sở, co giãn, quay/đổi cơ sở.', 'A=UΣVᵀ']],
  ['notation', 'lists'], ['Một singular value bằng 0 nói gì về một hướng đầu vào?', 'Hướng đó bị đưa về 0, phép biến đổi mất thông tin theo hướng ấy.']);

d(32, 'Đám mây điểm dài theo một đường chéo. Chiếu xuống một trục nào sẽ giữ được nhiều biến thiên nhất?',
  'Center dữ liệu trước khi tìm PCA|So độ phân tán sau chiếu lên các hướng',
  'Tính trung bình từng cột|Trừ trung bình khỏi từng điểm|Tính covariance theo quy ước của bài|Chọn vector riêng ứng với trị riêng lớn nhất|Chiếu dữ liệu đã center lên hướng đó',
  'PCA luôn chọn trục đi qua gốc tọa độ của dữ liệu chưa center.', 'Dịch đám mây điểm sang vị trí khác rồi center; hướng biến thiên không nên đổi chỉ vì dịch vị trí.',
  ['PCA thành phần đầu ưu tiên điều gì?', 'Hướng có phương sai sau chiếu lớn nhất', 'Hướng có mọi điểm dự đoán đúng nhãn', 'Hướng có tọa độ luôn dương', 'PCA không cần nhãn; nó giữ nhiều biến thiên nhất trên một trục.'],
  ['Quên trừ trung bình trước PCA có thể gây vấn đề gì?', 'Hướng có thể bị chi phối bởi vị trí đám mây thay vì biến thiên quanh tâm', 'Mọi singular value trở thành âm', 'Số hàng tự tăng lên', 'Center tách vị trí trung bình khỏi hướng phân tán.'],
  ['Hướng PCA v đúng thì -v có đúng không?', 'Có, cùng một trục chiếu', 'Không, chỉ chiều dương hợp lệ', 'Chỉ khi mọi điểm ở gốc', 'Tọa độ chiếu đổi dấu nhưng phương sai và không gian giữ lại không đổi.'],
  [['centering', 'Trừ trung bình từng cột để đưa tâm dữ liệu về 0.', 'x_centered=x-mean(x)'], ['principal component', 'Trục giữ nhiều biến thiên sau chiếu.', 'Vector riêng lớn nhất của covariance.']],
  ['mean', 'lists', 'notation'], ['Hai biến đo mét và milimét có nên mặc định đưa thẳng vào PCA không?', 'Cần cân nhắc scale theo mục tiêu; đơn vị lớn có thể chi phối phương sai dù không quan trọng hơn.']);

d(33, 'Một biểu thức xᵀAx có thể là chiếc bát, mặt yên ngựa hay mặt phẳng. Dấu nào phân biệt chúng?',
  'Tính dạng toàn phương trên vector nhỏ|Liên hệ dấu trị riêng với tính xác định của ma trận đối xứng',
  'Kiểm tra A đối xứng trong bài|Tính Ax rồi xᵀ(Ax)|Thử các hướng đơn giản|Dùng trị riêng để phân loại dấu trên mọi hướng',
  'Mọi ô của A dương thì xᵀAx luôn dương với x khác 0.', 'Thử A=[[1,2],[2,1]] và x=[1,-1]; biểu thức bằng -2 dù mọi ô A dương.',
  ['Ma trận đối xứng xác định dương có trị riêng thế nào?', 'Tất cả dương', 'Tất cả khác nhau', 'Tổng bằng 0', 'Trên cơ sở trực chuẩn riêng, dạng toàn phương là tổng λᵢzᵢ².'],
  ['A=diag(1,-1) được gọi xác định dương vì trace=0. Sai gì?', 'Có hướng cho giá trị âm và hướng cho giá trị dương', 'Trace=0 luôn cho xác định dương', 'Ma trận chéo không có dạng toàn phương', 'x=[1,0] cho 1; x=[0,1] cho -1 nên bất định.'],
  ['A=diag(2,3), x=[1,2]. xᵀAx bằng gì?', '14', '8', '7', '2×1² + 3×2²=14.'],
  [['quadratic form', 'Dạng toàn phương xᵀAx.', '2x₁²+3x₂²'], ['positive definite', 'Xác định dương: xᵀAx>0 với mọi x khác 0.', 'diag(2,3)']],
  ['notation', 'sums'], ['Chỉ thử hai vector trục đều cho giá trị dương đã đủ chứng minh A xác định dương chưa?', 'Chưa với ma trận chung; có thể có hướng xiên cho giá trị âm, như [[1,2],[2,1]].']);

d(34, 'Hôm nay 70% người dùng ở trạng thái học. Qua một ngày, ma trận chuyển trạng thái đưa phân bố đi đâu?',
  'Cập nhật phân bố xác suất theo đúng quy ước|Kiểm tra không âm và tổng xác suất bằng 1',
  'Đọc quy ước vector hàng hay cột của bài|Kiểm tra tổng xác suất chuyển phù hợp|Nhân phân bố với ma trận đúng phía|Kiểm tra mọi xác suất không âm|Cộng để kiểm tra tổng gần 1',
  'Có thể nhân bên nào cũng được vì đều là xác suất.', 'Ghi mũi tên từ trạng thái nguồn tới đích; quy ước hàng và cột quyết định phép nhân.',
  ['Phân bố xác suất hợp lệ cần điều gì?', 'Các giá trị không âm và tổng bằng 1', 'Mọi giá trị phải bằng nhau', 'Chỉ cần tổng lớn hơn 0', 'Xác suất là tỷ trọng của toàn bộ khả năng, không chứa giá trị âm.'],
  ['Một kết quả [-0.2,1.2] có tổng 1. Vì sao vẫn không hợp lệ?', 'Có xác suất âm', 'Tổng phải bằng số trạng thái', 'Mọi xác suất phải là số nguyên', 'Điều kiện tổng 1 không thay thế điều kiện từng giá trị nằm trong [0,1].'],
  ['Ma trận chuyển là I, phân bố hiện tại [0.3,0.7]. Bước sau?', '[0.3,0.7]', '[0.7,0.3]', '[0.5,0.5]', 'I giữ nguyên từng trạng thái; không có xác suất chuyển sang trạng thái khác.'],
  [['transition matrix', 'Ma trận xác suất chuyển từ trạng thái nguồn sang đích.', 'P(i→j)'], ['distribution', 'Phân bố: tỷ trọng xác suất của mọi trạng thái.', '[0.3,0.7]']],
  ['fractions', 'percentages', 'lists'], ['Có trạng thái hút với xác suất ở lại 1. Bắt đầu ở đó thì các bước sau thế nào?', 'Phân bố ở nguyên trạng thái ấy; không có xác suất thoát ra.']);

d(35, 'Hai dữ liệu đầu vào chỉ lệch rất nhỏ nhưng nghiệm lệch rất lớn. Có phải mọi phép tính đều sai?',
  'Phân biệt sai số thuật toán với độ nhạy bài toán|Diễn giải condition number lớn',
  'Đọc singular values lớn nhất và nhỏ nhất|Nếu singular value nhỏ nhất bằng 0, nhận ra suy biến|Tính tỷ số lớn nhất/nhỏ nhất khi khả nghịch|Thử nhiễu nhỏ ở đầu vào|So thay đổi tương đối ở nghiệm',
  'Định thức nhỏ luôn đủ để kết luận condition number lớn.', 'Ma trận εI có định thức nhỏ nhưng condition number bằng 1; cần xét tỷ số co giãn.',
  ['Condition number lớn cảnh báo điều gì?', 'Nhiễu tương đối nhỏ có thể làm nghiệm thay đổi tương đối lớn', 'Mọi nghiệm chắc chắn sai', 'Ma trận luôn có mọi ô lớn', 'Nó đo độ nhạy của bài toán, không phải kết luận từng lần chạy đã sai.'],
  ['A=0.001I có det rất nhỏ nên bị kết luận điều kiện xấu. Sai gì?', 'Hai singular values bằng nhau nên tỷ số bằng 1', 'Định thức không tồn tại cho I', 'Ma trận nhỏ luôn có condition number 0', 'Co đều mọi hướng không làm chênh lệch tương đối giữa các hướng tăng.'],
  ['Singular values là [10,0.1]. Condition number 2-norm?', '100', '10.1', '1', 'Tỷ số σmax/σmin=10/0.1=100.'],
  [['conditioning', 'Độ nhạy của lời giải với thay đổi nhỏ của dữ liệu.', 'Nhiễu b làm nghiệm x thay đổi.'], ['condition number', 'Chỉ số độ nhạy; chuẩn 2 dùng tỷ số singular values.', 'κ₂(A)=σmax/σmin']],
  ['fractions', 'percentages', 'notation'], ['Ma trận suy biến có singular value nhỏ nhất bằng 0 thì báo condition number hữu hạn được không?', 'Không trong bài toán nghịch đảo chuẩn; tỷ số là vô hạn, ma trận không khả nghịch.']);

d(36, 'Quay mọi mũi tên 90 độ mà không co giãn: có hướng thực nào vẫn nằm trên đường ban đầu không?',
  'Nhận ra giới hạn vector riêng thực của phép quay|Đọc một cặp trị riêng phức liên hợp',
  'Thử các vector trục khác 0 qua phép quay|So hướng trước và sau|Lập đa thức đặc trưng trên số thực|Nếu không có nghiệm thực, xét trường phức|Viết cặp trị riêng theo a±bi',
  'Ma trận thực luôn có đủ vector riêng thực.', 'Quay 90 độ mọi hướng thực khác 0 đều vuông góc hướng cũ; không có hướng thực chỉ co giãn.',
  ['Ma trận quay 90° trong 2D có vector riêng thực khác 0 không?', 'Không', 'Có, mọi vector đều là vector riêng', 'Chỉ vector [1,0]', 'Một phép quay 90° không giữ đường phương thực nào.'],
  ['Không tìm thấy trị riêng thực nên kết luận ma trận thực không có trị riêng trên bất kỳ trường nào. Sai gì?', 'Có thể có trị riêng phức', 'Phải thêm vector 0 làm vector riêng', 'Mọi trị riêng phải bằng 1', 'Đa thức λ²+1 không có nghiệm thực nhưng có nghiệm i và -i.'],
  ['A=[[0,-1],[1,0]] có cặp trị riêng phức nào?', 'i và -i', '1 và -1', '0 và 0', 'Đa thức đặc trưng λ²+1=0 nên λ=±i.'],
  [['complex eigenvalue', 'Trị riêng có thể có phần ảo khi mở rộng trường số.', 'i và -i'], ['conjugate pair', 'Cặp liên hợp a+bi và a-bi của ma trận thực.', '2+3i, 2-3i']],
  ['notation', 'coordinates'], ['Một ảnh 2D với mũi tên thực có biểu diễn trực tiếp mọi vector riêng phức không?', 'Không. Hình thực cho trực giác phép quay nhưng biểu diễn số phức cần thêm cách giải thích phù hợp.']);

lessonDesigns[1].intuition='Hãy tưởng tượng một bàn cờ có ô xuất phát ở giữa. Để chỉ chỗ Bitty cần đến, ta ghi hai số: x cho bước ngang, y cho bước dọc. [2, 1] nghĩa là sang phải 2 ô, rồi lên 1 ô. Đổi thành [1, 2] sẽ đến chỗ khác. Hãy thử di chuyển trước; lát nữa mình mới viết code.';
export { lessonDesigns };
