import {randomUUID} from 'node:crypto';
import {random,shuffle} from '../../shared/random.mjs';
import {VERSION,generateInput,oracle,checkOutput} from './problems.mjs';
export const capstoneProblems=['genai-context','genai-schema','genai-evaluate'];
export const essayFields=[
 {id:'problem',title:'1. Mục tiêu và dữ liệu',placeholder:'Mô tả xưởng kiểm phản hồi giả lập: lịch sử tin nhắn, ngân sách token, nhãn cho phép và bộ chuẩn độc lập. Nêu điều chưa được mô phỏng.'},
 {id:'approach',title:'2. Thuật toán và hợp đồng',placeholder:'Giải thích vì sao duyệt lịch sử từ mới về cũ; phân biệt đúng schema với đúng nhãn; nêu cách tính exact match trên bộ chuẩn.'},
 {id:'edges',title:'3. Trường hợp biên',placeholder:'Xét tin mới nhất vượt ngân sách, vừa đúng ngưỡng, confidence bằng 0/1 hoặc boolean, nhãn lạ, bộ chuẩn rỗng.'},
 {id:'validation',title:'4. Đọc hình và thiết kế test',placeholder:'Truy vết ngân sách còn lại; nêu phản hồi nào đúng kiểu nhưng sai nhãn. Tạo test bắt lỗi mẫu và đối chiếu đầu ra dự đoán.'},
 {id:'reflection',title:'5. Tự đánh giá',placeholder:'Nêu kỹ năng đã kiểm chứng, dữ liệu cần bổ sung và giới hạn của exact match. Không suy chất lượng văn bản tự do từ accuracy của bài nhãn.'},
];
const choice=(id,prompt,correct,wrong,rng,skill)=>({id,kind:'choice',skill,prompt,options:shuffle([correct,...wrong].map((text,i)=>({id:id+'-o'+i,text})),rng),answerId:id+'-o0',explanation:correct});
export function capstoneQuestions(seed){const rng=random(String(seed)+':genai-capstone');return[
 choice('genai-cap-c0','Một phản hồi đúng hai khóa, confidence hợp lệ và label được phép. Ta biết được điều gì?','Phản hồi đúng cấu trúc; vẫn cần so nhãn với bằng chứng hoặc bộ chuẩn.',['Nhãn chắc chắn đúng vì confidence là số.','Không cần giữ tập đánh giá riêng nữa.'],rng,'schema-versus-truth'),
 choice('genai-cap-c1','Duyệt ngược n tin nhắn một lần, lưu tối đa n ID rồi đảo danh sách. Giới hạn thời gian và bộ nhớ phụ là gì?','O(n) thời gian và O(n) bộ nhớ cho danh sách kết quả.',['O(n²) thời gian vì có phép đảo.','O(1) bộ nhớ dù vẫn giữ n ID kết quả.'],rng,'complexity'),
 ...['genai-context','genai-schema','genai-evaluate','genai-budget'].map((pid,i)=>{const input=generateInput(pid,String(seed)+':trace:'+i),answer=oracle(pid,input),correct=JSON.stringify(answer),mutated=pid==='genai-context'?[...input.messages.map(m=>m.id)].reverse():pid==='genai-schema'?answer.map(()=>true):pid==='genai-evaluate'?{...answer,accuracy:answer.accuracy*100}:{...answer,fits:!answer.fits};const wrong=[JSON.stringify(mutated),'null','[]','{}'].filter((v,j,a)=>v!==correct&&a.indexOf(v)===j).slice(0,2);return choice('genai-cap-t'+i,'Đọc kết quả '+pid+' cho '+JSON.stringify(input),correct,wrong,rng,pid);}),
 ];}
export function createCapstone(now=Date.now()){
 const id=randomUUID(),seed=randomUUID(),tasks=Object.fromEntries(capstoneProblems.map(pid=>[pid,generateInput(pid,seed)]));
 return{id,courseId:'genai',lessonId:24,mode:'capstone',status:'active',seed,version:VERSION,createdAt:now,updatedAt:now,questions:capstoneQuestions(seed),requiredProblems:capstoneProblems,answers:{},codesPassed:[],submissions:[],drafts:{python:''},codeDrafts:{},jobIds:[],result:null,tasks,dataset:{name:'Xưởng phản hồi có kiểm chứng',title:'Xưởng phản hồi có kiểm chứng',history:tasks['genai-context'],responses:tasks['genai-schema'],evaluation:tasks['genai-evaluate'],notice:'Ba bộ dữ liệu độc lập để kiểm từng chức năng. Không gọi LLM; nhãn dự đoán đã được cung cấp. Điểm không đánh giá chất lượng sáng tạo của văn bản.'},essay:Object.fromEntries(essayFields.map(f=>[f.id,''])),customTests:[],feedback:null,lab:null};
}
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v),ascii=v=>typeof v==='string'&&/^[\x20-\x7e]{1,80}$/.test(v),integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function validCustomInput(pid,d){if(!obj(d))return false;
 if(pid==='genai-context')return integer(d.budget,0,10000)&&Array.isArray(d.messages)&&d.messages.length<=100&&d.messages.every(m=>obj(m)&&ascii(m.id)&&integer(m.cost,1,10000))&&new Set(d.messages.map(m=>m.id)).size===d.messages.length;
 if(pid==='genai-schema')return Array.isArray(d.allowedLabels)&&d.allowedLabels.length<=30&&d.allowedLabels.every(ascii)&&new Set(d.allowedLabels).size===d.allowedLabels.length&&Array.isArray(d.outputs)&&d.outputs.length<=100;
 if(pid==='genai-evaluate')return Array.isArray(d.expected)&&Array.isArray(d.actual)&&d.expected.length<=100&&d.expected.length===d.actual.length&&[...d.expected,...d.actual].every(ascii);
 return false;
}
export function customTestScore(tests=[]){const killed=new Set(),errors=[];let valid=0;for(const [i,t]of tests.slice(0,30).entries()){
 if(!capstoneProblems.includes(t?.problemId)||!validCustomInput(t.problemId,t.input)){errors.push('Test '+(i+1)+': đầu vào ngoài miền quy định.');continue;}
 if(!checkOutput(t.problemId,t.input,t.expected)){errors.push('Test '+(i+1)+': kết quả dự đoán chưa đúng.');continue;}valid++;
 const d=t.input,correct=oracle(t.problemId,d),mutants=[];
 if(t.problemId==='genai-context'){
  let left=d.budget;const skip=[];for(const m of [...d.messages].reverse())if(m.cost<=left){left-=m.cost;skip.unshift(m.id);}mutants.push(['skip-oversize-message',skip],['reverse-history',correct.toReversed()]);
  left=d.budget;const strict=[];for(const m of [...d.messages].reverse()){if(m.cost>=left)break;left-=m.cost;strict.unshift(m.id);}mutants.push(['reject-exact-budget',strict]);
 }
 if(t.problemId==='genai-schema'){
  mutants.push(['accept-boolean-confidence',d.outputs.map((v,j)=>correct[j]||(obj(v)&&Object.keys(v).length===2&&d.allowedLabels.includes(v.label)&&typeof v.confidence==='boolean'))]);
  mutants.push(['accept-extra-fields',d.outputs.map(v=>obj(v)&&d.allowedLabels.includes(v.label)&&typeof v.confidence==='number'&&Number.isFinite(v.confidence)&&v.confidence>=0&&v.confidence<=1)]);
  mutants.push(['accept-unknown-label',d.outputs.map(v=>obj(v)&&Object.keys(v).length===2&&Object.hasOwn(v,'label')&&typeof v.confidence==='number'&&Number.isFinite(v.confidence)&&v.confidence>=0&&v.confidence<=1)]);
 }
 if(t.problemId==='genai-evaluate')mutants.push(['accuracy-as-percent',{...correct,accuracy:correct.accuracy*100}],['empty-is-perfect',{...correct,accuracy:correct.total?correct.accuracy:1}]);
 for(const[name,result]of mutants)if(!checkOutput(t.problemId,d,result))killed.add(name);
 }return{score:Math.min(10,killed.size*2.5),valid,killed:[...killed],errors};}
export function gradeCapstone(a){const questions=a.questions??[],answers=a.answers??{},code=capstoneProblems.filter(pid=>(a.codesPassed??[]).includes(pid)).length*20,concept=questions.slice(0,2).filter(q=>answers[q.id]===q.answerId).length*5,trace=questions.slice(2,6).filter(q=>answers[q.id]===q.answerId).length*5,tests=customTestScore(a.customTests),essayComplete=essayFields.every(f=>typeof a.essay?.[f.id]==='string'&&a.essay[f.id].trim().length>0),score=code+concept+trace+tests.score;return{score,code,concept,trace,tests,essayComplete,passed:score>=80&&code===60&&essayComplete,details:questions.map(q=>({id:q.id,correct:answers[q.id]===q.answerId,answerId:q.answerId,explanation:q.explanation})),note:'Điểm xác nhận quản lý context, kiểm schema và tính metric theo hợp đồng. AI chỉ góp ý bài luận; không quyết định điểm hoặc pass/fail.'};}
export const capstoneDescription={title:'Xưởng phản hồi có kiểm chứng',capstoneTitle:'Xưởng phản hồi có kiểm chứng',dataset:'Lịch sử tin nhắn, phản hồi nhãn có confidence và bộ chuẩn giả lập, không gọi API.',problemIds:capstoneProblems,rubric:[{label:'Ba chức năng Python',points:60},{label:'Đọc hình và truy vết',points:20},{label:'Điều kiện áp dụng và độ phức tạp',points:10},{label:'Test phát hiện lỗi mẫu',points:10}],requiredAlgorithm:'Giữ hậu tố liên tiếp vừa ngân sách; kiểm đúng khóa/kiểu/nhãn; exact match với accuracy rỗng bằng 0.',testExample:{problemId:'genai-context',input:{budget:5,messages:[{id:'old',cost:1},{id:'new',cost:6}]},expected:[]}};
