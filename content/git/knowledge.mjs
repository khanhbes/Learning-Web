// [skill, title, prompt, correct, wrongA, wrongB, wrongC, explanation, sourcePrefix]
export const knowledgeInterviewRows=[
 ['git-vcs','Git và GitHub','Git khác GitHub như thế nào?','Git quản lý phiên bản; GitHub là nền tảng lưu kho và cộng tác','GitHub là lệnh commit','Git chỉ chạy khi có GitHub','Hai tên của cùng một chương trình','Git có thể commit offline không cần tài khoản GitHub.','814498804'],
 ['git-index','Index là snapshot','Add B rồi sửa working tree thành C; commit chứa gì?','B','C','A trước khi sửa','Cả A/B/C ở cùng file','Add lấy snapshot B vào index; commit đọc index.','813923075'],
 ['git-status','Hai lớp diff','git diff --staged so sánh vùng nào?','HEAD và index','Working tree và remote','Hai remote','Index và stash','Diff staged kiểm tra nội dung chuẩn bị commit so với HEAD.','814585089'],
 ['git-commit','Commit có mục đích','Thông điệp nào giúp reviewer hiểu hơn?','Fix empty input in parser','final','changes','done','Tên hành động cụ thể giúp đọc lịch sử; không tự bảo đảm code đúng.','799972477'],
 ['git-ignore','Ignore không xóa lịch sử','.env đã track; thêm vào .gitignore có tự untrack không?','Không','Có ngay','Có khi reload','Có nếu push','Ignore chủ yếu cho file chưa track; secret lộ cần đổi/thu hồi.','814428256'],
 ['git-branch','Ref và HEAD','git branch feature có tự chuyển nhánh không?','Không','Có','Có và push','Có và xóa main','branch tạo ref; switch/checkout chuyển nhánh.','814034494'],
 ['git-feature','Base của feature','Commit trên feature có tự đổi main không?','Không','Có','Có nếu message giống','Có nếu GitHub Free','Ref mỗi nhánh di chuyển độc lập cho tới thao tác tích hợp.','814584732'],
 ['git-merge','Fast-forward','Merge có luôn tạo merge commit không?','Không, có thể fast-forward','Luôn có','Không bao giờ có','Chỉ GitHub tạo commit','Khi HEAD là tổ tiên, merge có thể chỉ di chuyển ref.','813583093'],
 ['git-conflict','Xác nhận giải quyết','Sau sửa nội dung conflict và loại marker, cần bước nào?','git add rồi commit kết thúc merge','Chỉ đóng editor','Push force ngay','Init lại repo','Add xác nhận snapshot đã hòa giải; commit lưu merge.','813583093'],
 ['git-restore','Nguồn restore','git restore file mặc định đọc snapshot nào?','Index','Remote','Commit đầu tiên','Stash mới nhất','Restore working tree lấy index làm nguồn mặc định.','813923075'],
 ['git-remote','Origin là tên quy ước','origin có bắt buộc chỉ tới GitHub không?','Không','Có luôn','Chỉ GitHub Enterprise','Chỉ khi dùng HTTPS','Remote là tên/cấu hình tới repository khác; origin là quy ước phổ biến.','813672265'],
 ['git-fetch','Nhận mà chưa ghép','Fetch có tự merge vào main không?','Không','Luôn có','Có khi tên origin','Có khi mạng nhanh','Fetch cập nhật object/remote-tracking refs, chưa tích hợp local.','814034494'],
 ['git-pull','Chọn strategy','Pull --ff-only khi local/remote phân kỳ làm gì?','Từ chối tích hợp','Force push','Tạo hai commit mặc định','Xóa local','ff-only chỉ nhận cập nhật fast-forward; cần chọn cách tích hợp khi phân kỳ.','813583093'],
 ['git-push','Push không phải commit','Push có gửi file chưa commit không?','Không','Có mọi file','Có file đã add','Có nếu PR mở','Push cập nhật refs/objects của lịch sử đã commit.','814971288'],
 ['git-pr','PR là đề nghị','Push feature có tự tạo pull request không?','Không','Luôn tạo','Tạo nếu message dài','Tạo nếu có conflict','PR là hành vi nền tảng riêng, để đề xuất/review tích hợp.','814428256'],
 ['git-stash','Apply và pop','Stash apply khác pop ở đâu?','Apply giữ entry; pop bỏ entry khi áp dụng thành công','Apply tạo branch bắt buộc','Pop tạo commit','Apply xóa repo','Apply/pop không mặc định stage lại mọi sửa đổi.','813672265'],
 ['git-reset','Ba lớp reset','Reset --soft HEAD~1 giữ vùng nào?','Index và working tree','Chỉ remote','Không giữ gì','Chỉ stash','Soft lùi ref; mixed thêm reset index; hard thêm working tree tracked.','814971288'],
 ['git-revert','Lịch sử đã chia sẻ','Revert thường tạo gì?','Commit mới đảo patch','Xóa commit khỏi lịch sử','Force push','Xóa nhánh remote','Commit gốc vẫn là tổ tiên; patch đảo có thể conflict.','814585089'],
 ['git-rebase','Phát lại commit','Rebase có thường đổi ID commit được phát lại không?','Có','Không bao giờ','Chỉ đổi filename','Chỉ đổi remote name','Parent/base thay đổi nên commit mới có ID mới; trao đổi trước khi viết lại lịch sử chia sẻ.','814584732'],
 ['git-prune','Prune đúng phạm vi','Dọn remote-tracking refs đã bị xóa ở remote dùng gì?','git fetch --prune','git prune để xóa branch','git restore .','git reset --soft','git prune xử lý object không reachable, khác prune remote refs.','814971288'],
];
export const knowledgeTipRows=knowledgeInterviewRows.filter((_,i)=>[0,1,2,3,4,7,8,9,11,12,16,19].includes(i)).map(row=>[...row]);
