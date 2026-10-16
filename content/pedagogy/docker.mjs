import * as course from '../docker/index.mjs';
import {notes} from '../docker/reading.mjs';
import {authoredDesigns,term} from './author.mjs';
const vocab={
 image:term('Image','Gói nền có chương trình, thư viện và cấu hình để tạo container.','byte-web:1 có thể tạo web và web2 độc lập.'),
 container:term('Container','Môi trường được tạo từ image, có trạng thái và lớp ghi riêng.','Stop web giữ container để start lại.'),
 daemon:term('Daemon','Dịch vụ quản lý các tài nguyên trên Docker host.','CLI gửi yêu cầu tạo container tới daemon.'),
 client:term('Client','Công cụ gửi yêu cầu tới Docker daemon.','docker CLI nhận lệnh bạn gõ.'),
 registry:term('Registry','Nơi lưu và phân phối image.','Pull nhận image; tag local chưa push image.'),
 created:term('Created','Container đã tạo cấu hình nhưng chưa khởi chạy.','create rồi ps -a thấy created.'),
 running:term('Running','Tiến trình chính của container đang chạy.','Running chưa chứng minh dịch vụ đã ready.'),
 exited:term('Exited','Tiến trình container đã dừng; container còn tồn tại.','Stop web đưa mô hình về exited.'),
 volume:term('Volume','Kho dữ liệu do Docker quản lý, có vòng đời riêng với container.','Gắn data vào /data để giữ note.txt khi thay web.'),
 hostPort:term('Cổng host','Số cổng được publish ở phía máy chạy Docker.','8080 trong -p 8080:80 thuộc phía host.'),
 containerPort:term('Cổng container','Số cổng ứng dụng cần lắng nghe trong container.','80 trong -p 8080:80 thuộc phía container.'),
 expose:term('EXPOSE','Mô tả cổng dự kiến dùng trong image; không tự publish.','EXPOSE 80 chưa mở host 8080.'),
 logs:term('Logs','Thông tin ứng dụng ghi ra để quan sát hành vi.','Đọc docker logs web trước khi đoán nguyên nhân lỗi.'),
 inspect:term('Inspect','Xem cấu hình và trạng thái chi tiết của đối tượng.','docker inspect web cho thấy port và mount.'),
 tag:term('Tag','Nhãn có thể trỏ tới một image và có thể được thay đổi.','release:1 có thể cùng ID với byte-web:1.'),
 digest:term('Digest','Định danh gắn với nội dung của image hoặc manifest.','Dùng digest cụ thể để tránh tag trỏ sang bản khác.'),
 layer:term('Layer','Một phần thay đổi filesystem trong cấu trúc image.','Lớp ghi của container khác các layer image chỉ đọc.'),
 context:term('Build context','Tập file được cấp làm đầu vào cho build.','COPY index.txt đọc từ context của bài.'),
 dockerfile:term('Dockerfile','Công thức các bước tạo image.','FROM chọn nền, COPY đưa nội dung vào image.'),
 copy:term('COPY','Chép file từ context hoặc stage được chỉ định.','COPY index.txt /app/index.txt đặt file đúng đường.'),
 cache:term('Build cache','Kết quả build được tái sử dụng khi điều kiện cache phù hợp.','Cache hit không chứng minh ứng dụng không có lỗi.'),
 ignore:term('.dockerignore','Quy tắc loại file khỏi build context.','Bỏ .env giúp tránh COPY vô ý vào image.'),
 env:term('Biến môi trường','Cấu hình dạng tên và giá trị cấp cho tiến trình.','-e APP_ENV=practice cấu hình container mới.'),
 secret:term('Secret','Dữ liệu bí mật cần cấp với phạm vi truy cập phù hợp.','Không COPY API key vào image.'),
 network:term('Network','Mạng logic kết nối các container theo cấu hình.','web và db cùng network school.'),
 dns:term('DNS','Cơ chế phân giải tên thành địa chỉ phù hợp.','Bridge tự định nghĩa có thể phân giải tên db.'),
 service:term('Service','Một thành phần ứng dụng được khai báo trong Compose.','web và db là hai service khác nhau.'),
 compose:term('Compose','Công cụ mô tả và quản lý nhiều service từ cấu hình.','compose up dựng các service của bản đồ đã cấp.'),
 health:term('Healthcheck','Phép kiểm được cấu hình để quan sát tình trạng dịch vụ.','Kiểm DB trả lời phù hợp hơn chỉ nhìn PID.'),
 memory:term('Giới hạn bộ nhớ','Ngưỡng RAM cấu hình cho container trong môi trường phù hợp.','--memory 256m yêu cầu giới hạn 256 MiB.'),
 cpu:term('Giới hạn CPU','Hạn mức xử lý theo cấu hình runtime.','--cpus 0.5 không là đo tốc độ chương trình.'),
 user:term('User','Danh tính dùng để chạy tiến trình trong container.','--user 1000 ghi UID cụ thể thay UID 0.'),
 readonly:term('Read-only root','Root filesystem chỉ đọc theo cấu hình container.','Volume riêng vẫn có thể được gắn cho nhu cầu ghi.'),
 restart:term('Restart policy','Quy tắc yêu cầu runtime khởi động lại theo điều kiện.','unless-stopped không sửa lỗi code của ứng dụng.'),
 stage:term('Build stage','Một giai đoạn build bắt đầu bởi FROM.','COPY --from=build chọn sản phẩm từ stage build.'),
 bind:term('Bind mount','Nối một đường host cụ thể vào container.','Dùng để cùng nhìn file source đang sửa trên host.'),
 tmpfs:term('Tmpfs','Vùng lưu tạm trong bộ nhớ theo hỗ trợ nền tảng.','Không dùng làm bản duy nhất của tiến độ cần lưu lâu.'),
};
const rows=notes.filter(n=>!n.exam).map(n=>[n.id,n.hook,n.steps.join('|'),n.example,'',n.terms]);
const base=authoredDesigns(course,rows,{vocab});
function explain(line,n){
 if(line.startsWith('edit Dockerfile'))return 'Soạn công thức build trong context ảo; các ký tự \\n chia thành từng dòng chỉ dẫn. '+n.steps[0];
 if(line.startsWith('edit .dockerignore'))return 'Loại .env và debug.log khỏi context để COPY không mang theo hai file riêng.';
 if(line.startsWith('docker build'))return 'Đọc Dockerfile và context để tạo app:1; chưa tạo container hoặc mở cổng host.';
 if(line.startsWith('docker run'))return 'Tạo rồi khởi chạy container; đọc --name và các cờ để xác định image, cổng, mount và cấu hình cần kiểm.';
 if(line.startsWith('docker create'))return 'Chuẩn bị cấu hình container; chưa khởi chạy tiến trình hoặc bind cổng host.';
 if(line.startsWith('docker stop'))return 'Dừng tiến trình, giữ container và lớp ghi để có thể chạy lại; named volume vẫn độc lập.';
 if(line.startsWith('docker rm'))return 'Xóa container đã chỉ định và lớp ghi của nó; không tự xóa named volume.';
 if(line.startsWith('docker start'))return 'Chạy lại container đã tồn tại; dùng lại cấu hình và lớp ghi của nó.';
 if(line.startsWith('docker compose down'))return 'Dỡ service và network của stack; không có --volumes nên giữ named volume data.';
 if(line.startsWith('docker compose up'))return 'Tạo hoặc khởi chạy các service từ bản đồ Compose đã cấp; không chứng minh readiness thật.';
 if(line.startsWith('docker compose config'))return 'Đọc cấu hình service, port và volume trước thao tác; chưa thay đổi service.';
 if(line.startsWith('docker network create'))return 'Tạo mạng riêng có tên để container tham gia cùng nhóm kết nối.';
 if(line.startsWith('docker network connect'))return 'Gắn container hiện có vào mạng bổ sung; không tạo container mới.';
 if(line.startsWith('docker tag'))return 'Thêm nhãn trỏ tới cùng nội dung image, không sửa image gốc hoặc chạy container.';
 if(line.startsWith('docker logs'))return 'Đọc dòng log của ứng dụng ảo; không sửa file hoặc cấu hình container.';
 if(line.startsWith('docker inspect'))return 'Đọc thông tin chi tiết để đối chiếu trạng thái, cổng và dữ liệu cần giữ.';
 return n.steps.at(-1);
}
export const lessonDesigns=Object.fromEntries(notes.filter(n=>!n.exam).map(n=>{
 const d=base[n.id],script=course.referenceScripts['docker-'+n.pid];
 if(d.vocabulary.length<2)throw Error('Docker thiếu thuật ngữ '+n.id);
 return[n.id,{...d,goals:[n.steps[0]+'.',n.steps[1]+'.',n.steps[2]+'.'],intuition:n.concept,misconception:{wrong:n.q[1][2],why:n.trap,repair:n.example},transfer:{prompt:n.q[2][0],explanation:n.q[2][1]+'. '+n.example},checks:{concept:[...n.q[0],n.concept],error:[...n.q[1],n.trap],apply:[...n.q[2],n.example]},annotations:{shell:script.split('\n').map(line=>explain(line,n))}}];
}));
