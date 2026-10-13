import { randomUUID } from 'node:crypto';
import { random, shuffle } from '../../shared/random.mjs';
import { VERSION, generateInput, oracle, checkOutput } from './problems.mjs';

export const capstoneProblems=['ml-preprocess','ml-churn-fit','ml-confusion'];
export const essayFields=[
 {id:'problem',title:'1. Bài toán, thời điểm dự đoán và dữ liệu',placeholder:'Mô tả churn giả lập, features/label, thời điểm cần dự đoán và chi phí bỏ sót/cảnh báo nhầm.'},
 {id:'approach',title:'2. Pipeline và thuật toán',placeholder:'Giải thích vì sao thống kê tiền xử lý chỉ học từ train; mô tả KNN với k/threshold do đề chỉ định và cách tính metric.'},
 {id:'edges',title:'3. Trường hợp biên và đánh đổi',placeholder:'Xét missing, cột hằng, hòa khoảng cách, đúng bằng threshold, không có dự đoán dương hoặc không có nhãn dương; nêu giới hạn dữ liệu giả lập.'},
 {id:'validation',title:'4. Biểu đồ, test và kết quả',placeholder:'Đọc một biểu đồ residual hoặc confusion matrix, mô tả test bạn tự tạo và lỗi mẫu test đó phát hiện.'},
 {id:'reflection',title:'5. Tự đánh giá và tái lập',placeholder:'Nêu phần đã kiểm chứng, phần chưa đủ bằng chứng, seed/version cần lưu và hướng cải thiện trên validation.'},
];
const choice=(id,prompt,answer,wrong,rng,skill)=>({id,kind:'choice',skill,prompt,options:shuffle([answer,...wrong].map((text,i)=>({id:id+'-o'+i,text})),rng),answerId:id+'-o0',explanation:answer});
export function capstoneQuestions(seed) {
 const rng=random(String(seed)+':ml-capstone-questions');
 const concepts=[
  choice('ml-capstone-c0','Để tránh leakage, imputer và scaler được fit trên tập nào?','Chỉ train của split/fold tương ứng',['Tất cả train/test trước chia','Riêng test để chính xác hơn'],rng,'pipeline'),
  choice('ml-capstone-c1','Dự đoán KNN bằng cách duyệt n hàng có d feature, không dùng index tối ưu, cần chi phí gì để tính mọi khoảng cách?','O(n × d) cho một query',['O(1) không phụ thuộc dữ liệu','O(d) vì chỉ có một query'],rng,'complexity'),
 ];
 const ids=['ml-preprocess','ml-churn-fit','ml-metrics','ml-confusion'];
 return [...concepts,...ids.map((pid,i)=>{
  const input=generateInput(pid,String(seed)+':trace:'+i),out=oracle(pid,input),text=JSON.stringify(out);
  return choice('ml-capstone-t'+i,'Dự đoán kết quả '+pid+' cho '+JSON.stringify(input),text,['null','"không đủ dữ liệu"'],rng,pid);
 })];
}
export function createCapstone(now=Date.now()) {
 const id=randomUUID(),seed=randomUUID();
 const rng=random(seed+':customers'),rows=Array.from({length:24},(_,i)=>{const usage=Math.floor(rng()*100);return {id:i,usage:i%7===0?null:usage,churn:usage<45?1:0};});
 const preprocessing={train:rows.slice(0,16).map(r=>[r.usage]),test:rows.slice(16).map(r=>[r.usage])};
 const prepared=oracle('ml-preprocess',preprocessing);
 const fit={X:prepared.train,y:rows.slice(0,16).map(r=>r.churn),query:prepared.test,k:3,threshold:0.5};
 const prediction=oracle('ml-churn-fit',fit),metric={y:rows.slice(16).map(r=>r.churn),p:prediction.probabilities,threshold:fit.threshold};
 const tasks={'ml-preprocess':preprocessing,'ml-churn-fit':fit,'ml-confusion':metric};
 return {id,courseId:'ml',lessonId:40,mode:'capstone',status:'active',seed,version:VERSION,createdAt:now,updatedAt:now,questions:capstoneQuestions(seed),requiredProblems:capstoneProblems,answers:{},codesPassed:[],submissions:[],drafts:{python:''},codeDrafts:{},jobIds:[],result:null,tasks,dataset:{name:'Khách hàng dịch vụ giả lập',feature:'Số phút sử dụng trong tháng trước thời điểm dự đoán',rows,trainCount:16,testCount:8,notice:'Nhãn giả lập có sẵn để học; đây không phải dữ liệu khách hàng thật hay bằng chứng hiệu quả triển khai.'},essay:Object.fromEntries(essayFields.map(f=>[f.id,''])),customTests:[],feedback:null,lab:null};
}
const number=x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1e6;
const vector=(v,min=1,max=1000,nullable=false)=>Array.isArray(v)&&v.length>=min&&v.length<=max&&v.every(x=>number(x)||(nullable&&x===null));
const matrix=(m,nullable=false)=>Array.isArray(m)&&m.length>=1&&m.length<=1000&&vector(m[0],1,20,nullable)&&m.every(r=>vector(r,m[0].length,m[0].length,nullable));
export function validCustomInput(id,d) {
 if(!d||typeof d!=='object'||Array.isArray(d))return false;
 if(id==='ml-preprocess')return matrix(d.train,true)&&matrix(d.test,true)&&d.train[0].length===d.test[0].length;
 if(id==='ml-churn-fit')return matrix(d.X)&&vector(d.y,d.X.length,d.X.length)&&d.y.every(y=>y===0||y===1)&&matrix(d.query)&&d.query[0].length===d.X[0].length&&Number.isInteger(d.k)&&d.k>=1&&d.k<=d.X.length&&number(d.threshold)&&d.threshold>0&&d.threshold<1;
 if(id==='ml-confusion')return vector(d.y)&&d.y.every(y=>y===0||y===1)&&vector(d.p,d.y.length,d.y.length)&&d.p.every(p=>p>=0&&p<=1)&&number(d.threshold)&&d.threshold>=0&&d.threshold<=1;
 return false;
}

export function customTestScore(tests=[]) {
 const killed=new Set(),errors=[];let valid=0;
 tests.slice(0,30).forEach((t,i)=>{
  if(!capstoneProblems.includes(t.problemId)||!validCustomInput(t.problemId,t.input)){errors.push('Test '+(i+1)+': đầu vào chưa hợp lệ.');return;}
  if(!checkOutput(t.problemId,t.input,t.expected)){errors.push('Test '+(i+1)+': kết quả dự đoán chưa đúng.');return;}valid++;
  const correct=oracle(t.problemId,t.input);
  if(t.problemId==='ml-preprocess') {
   const leaked=oracle('ml-preprocess',{train:[...t.input.train,...t.input.test],test:t.input.test});leaked.train=leaked.train.slice(0,t.input.train.length);
   if(!checkOutput(t.problemId,t.input,leaked))killed.add('fit-on-test');
   const fillZero=oracle('ml-preprocess',{train:t.input.train.map(r=>r.map(x=>x===null?0:x)),test:t.input.test.map(r=>r.map(x=>x===null?0:x))});
   if(!checkOutput(t.problemId,t.input,fillZero))killed.add('missing-means-zero');
  }
  if(t.problemId==='ml-churn-fit') {
   const hard={...correct,labels:correct.probabilities.map(p=>p>=0.5?1:0)};
   if(!checkOutput(t.problemId,t.input,hard))killed.add('ignore-threshold');
   const reversed=oracle(t.problemId,{...t.input,X:[...t.input.X].reverse(),y:[...t.input.y].reverse()});
   if(!checkOutput(t.problemId,t.input,reversed))killed.add('wrong-distance-tie');
  }
  if(t.problemId==='ml-confusion') {
   if(!checkOutput(t.problemId,t.input,{...correct,precision:correct.recall,recall:correct.precision}))killed.add('swap-precision-recall');
   const strict=oracle(t.problemId,{...t.input,p:t.input.p.map(p=>p===t.input.threshold?Math.max(0,p-1e-9):p)});
   if(!checkOutput(t.problemId,t.input,strict))killed.add('strict-threshold');
  }
 });
 return {score:Math.min(10,killed.size*2.5),valid,killed:[...killed],errors};
}
export function gradeCapstone(a) {
 const codes=a.codesPassed||[],answers=a.answers||{},questions=a.questions||[];
 const code=capstoneProblems.filter(p=>codes.includes(p)).length*20,concept=questions.slice(0,2).filter(q=>answers[q.id]===q.answerId).length*5,trace=questions.slice(2,6).filter(q=>answers[q.id]===q.answerId).length*5,tests=customTestScore(a.customTests||[]),essayComplete=essayFields.every(f=>a.essay?.[f.id]?.trim().length>0),score=code+concept+trace+tests.score;
 return {score,code,trace,concept,tests,essayComplete,passed:score>=80&&code===60&&essayComplete,details:questions.map(q=>({id:q.id,correct:answers[q.id]===q.answerId,answerId:q.answerId,explanation:q.explanation})),note:'Điểm xác nhận chức năng, đọc kết quả và test; AI góp ý bài luận, không quyết định điểm chính thức.'};
}

export const capstoneDescription={title:'Dự đoán khách hàng ngừng sử dụng dịch vụ',dataset:'Dữ liệu khách hàng giả lập, không có thông tin người thật.',problemIds:capstoneProblems,rubric:[{label:'Ba chức năng code',points:60},{label:'Đọc và truy vết kết quả',points:20},{label:'Điều kiện áp dụng, độ phức tạp',points:10},{label:'Test phát hiện lỗi mẫu',points:10}],requiredAlgorithm:'KNN với k/threshold chỉ định; tiền xử lý train-only và metric định nghĩa trong đề.'};
