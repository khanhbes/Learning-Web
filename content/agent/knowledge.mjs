import {notes} from './reading.mjs';
const prefixes=['825278729','828872594','825352858','826047760','825340443','825279868','825267646','825273549'];
const selected=[1,2,3,4,5,6,7,9,10,11,12,13,14,15,17,18,19,20,21,22,23,25,26,28];
const incorrect=[
 'Mọi agent đều phải có API trả phí','Chỉ dùng print để báo pass','Ưu tiên bụi cao hơn pin thấp','Null luôn chứng minh môi trường sạch','Không bao giờ ghi giá trị false','BFS tối ưu mọi đồ thị trọng số','Utility là số do AI tự đoán','Tăng mean mà không đếm số lần thử','Chưa thử nghĩa là reward0','Nhiều agent tự động chịu mọi lỗi','Route tự tạo tool ngoài registry','Tải không đổi khi nhận task','Root done ngay khi tạo kế hoạch','Chỉ ghi trạng thái node gốc','Mỗi frame là suy nghĩ ẩn thật','Cho phép boolean vì trông giống1','Approval vượt mọi scope','Đếm mọi token lặp là bằng chứng mới','Reserved cộng thêm vào ngân sách','Success cuối bước vẫn phải limit','Bộ test nhỏ chứng minh an toàn tuyệt đối','Thứ tự ID luôn đúng mọi tiên quyết','Reward lớn nhất thay được expectation','Mọi phiếu abstain bị bỏ khỏi mẫu số',
];
function row(id,index,tip=false){const note=notes[id-1],q=note.quiz[tip?1:0];return['lesson-'+id,note.title,q[0],q[1],q[2],q[3],incorrect[index],tip?note.trap:note.concept,prefixes[note.page-1]];}
export const knowledgeInterviewRows=selected.map((id,i)=>row(id,i));
export const knowledgeTipRows=selected.slice(0,16).map((id,i)=>row(id,i,true));
export const knowledgeLessonIds=Object.fromEntries(selected.map(id=>['lesson-'+id,id]));
