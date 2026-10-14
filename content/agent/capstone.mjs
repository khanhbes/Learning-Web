import {randomUUID} from 'node:crypto';
import {random,shuffle,int} from '../../shared/random.mjs';
import {VERSION,generateInput,oracle,checkOutput} from './problems.mjs';
export const capstoneProblems=['agent-dependencies','agent-policy','agent-evaluate'];
export const essayFields=[
 {id:'problem',title:'1. Mục tiêu, môi trường và dữ liệu',placeholder:'Mô tả trạm trợ lý thư viện giả lập, task có tiên quyết, công cụ đăng ký và nhãn fixture. Phân biệt percept, state, goal và tiêu chí đánh giá.'},
 {id:'approach',title:'2. Kế hoạch và chính sách công cụ',placeholder:'Giải thích cách chọn task sẵn sàng, phát hiện chu trình; thứ tự kiểm tool/scope/approval. Nêu vì sao policy nằm ngoài đề xuất của agent.'},
 {id:'edges',title:'3. Trường hợp biên và giới hạn tự chủ',placeholder:'Xét task rỗng, self-cycle, thiếu tool, approval không vượt scope, precision/recall mẫu số0; nói rõ đây là mô phỏng, không gọi công cụ thật.'},
 {id:'validation',title:'4. Đọc sơ đồ, báo cáo và test',placeholder:'Viết truy vết một kế hoạch, một call cần xác nhận và một call bị từ chối. Thiết kế test bắt lỗi mẫu, đối chiếu nhãn expected/actual với bảngTP/FP/FN/TN.'},
 {id:'reflection',title:'5. Tự đánh giá và điểm cần cải thiện',placeholder:'Nêu kỹ năng đã kiểm chứng, dữ liệu chưa phủ và điều kiện để triển khai thật. Phân biệt nhiều agent với chịu lỗi và phiếu đa số với sự thật.'},
];
function choice(id,prompt,correct,wrong,rng,skill){const options=shuffle([correct,...wrong].map((text,i)=>({id:id+'-o'+i,text})),rng);return{id,kind:'choice',skill,prompt,options,answerId:id+'-o0',explanation:correct};}
export function capstoneQuestions(seed){const rng=random(String(seed)+':agent-cap');return[
 choice('agent-cap-c0','Call đã được approved nhưng thiếu scope. Quyết định nào đúng?','deny',['allow vì đã approved','approval cấp scope tự động'],rng,'tool-policy'),
 choice('agent-cap-c1','Lời giải tham chiếu mỗi vòng quét các task còn lại, với mỗi task kiểm tối đa E cạnh rồi sắp xếp ready. Tối đa V vòng. Giới hạn thời gian phù hợp là gì?','O(V²×E + V² log V), bộ nhớ O(V+E)',['O(1) vì chỉ return','Mọi cách topo đều bắt buộc O(V²E)'],rng,'complexity'),
 ...['agent-dependencies','agent-policy','agent-evaluate','agent-context'].map((pid,i)=>{const input=generateInput(pid,String(seed)+':trace:'+i),correct=JSON.stringify(oracle(pid,input)),wrong=['null','[]','{}','false','"done"'].filter(v=>v!==correct).slice(0,2);return choice('agent-cap-t'+i,'Đọc kết quả '+pid+' cho '+JSON.stringify(input),correct,wrong,rng,pid);}),
];}
export function createCapstone(now=Date.now()){
 const id=randomUUID(),seed=randomUUID(),rng=random(seed),suffix=String(int(rng,100,999)),name=role=>role+'-'+suffix,roles=['collect','plan','lookup','calculate','review','respond'],tasks=roles.map(name),edges=[['collect','plan'],['plan','lookup'],['plan','calculate'],['lookup','review'],['calculate','review'],['review','respond']].map(e=>e.map(name));
 if(int(rng,0,1))edges.push([name('lookup'),name('calculate')]);
 const policy={tools:[{id:'lookup',scope:'read',risky:false},{id:'calculate',scope:'compute',risky:false},{id:'publish',scope:'write',risky:true},{id:'erase',scope:'delete',risky:true}],allowedScopes:['read','compute','write'],approved:int(rng,0,1)?[name('respond')]:[],calls:[{id:name('lookup'),tool:'lookup'},{id:name('calculate'),tool:'calculate'},{id:name('respond'),tool:'publish'},{id:name('maintenance'),tool:'erase'},{id:name('unknown-request'),tool:'missing'}]};
 const expected=oracle('agent-policy',policy).map(c=>c.decision==='allow'),actual=expected.map((value,i)=>i===0||i===3?!value:value),evaluation={expected,actual};
 return{id,courseId:'agent',lessonId:24,mode:'capstone',status:'active',seed,version:VERSION,createdAt:now,updatedAt:now,questions:capstoneQuestions(seed),requiredProblems:capstoneProblems,answers:{},codesPassed:[],submissions:[],drafts:{python:''},codeDrafts:{},jobIds:[],result:null,tasks:{'agent-dependencies':{tasks:shuffle(tasks,rng),edges},'agent-policy':policy,'agent-evaluate':evaluation},dataset:{name:'Trạm trợ lý thư viện giả lập',title:'Trạm trợ lý thư viện an toàn',tasks,edges,tools:policy.tools,calls:policy.calls,allowedScopes:policy.allowedScopes,approved:policy.approved,evaluation,notice:'Không có API/tool thật. Task graph lập kế hoạch; policy kiểm call; evaluator so các quyết định đã cho phép với nhãn đúng. approved không vượt scope; approval/deny được xem là chưa cho phép.'},essay:Object.fromEntries(essayFields.map(f=>[f.id,''])),customTests:[],feedback:null,lab:null};
}
const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const id=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(x);
const unique=a=>new Set(a).size===a.length;
const ids=a=>Array.isArray(a)&&a.length<=100&&a.every(id)&&unique(a);
export function validCustomInput(pid,d){if(!obj(d))return false;
 if(pid==='agent-dependencies')return ids(d.tasks)&&d.tasks.length<=10&&Array.isArray(d.edges)&&d.edges.length<=100&&d.edges.every(e=>Array.isArray(e)&&e.length===2&&e.every(v=>d.tasks.includes(v)))&&unique(d.edges.map(e=>JSON.stringify(e)));
 if(pid==='agent-policy')return Array.isArray(d.tools)&&d.tools.length<=30&&d.tools.every(t=>obj(t)&&id(t.id)&&id(t.scope)&&typeof t.risky==='boolean')&&unique(d.tools.map(t=>t.id))&&Array.isArray(d.calls)&&d.calls.length<=100&&d.calls.every(c=>obj(c)&&id(c.id)&&id(c.tool))&&unique(d.calls.map(c=>c.id))&&ids(d.allowedScopes)&&ids(d.approved)&&d.approved.every(v=>d.calls.some(c=>c.id===v));
 if(pid==='agent-evaluate')return Array.isArray(d.expected)&&Array.isArray(d.actual)&&d.expected.length===d.actual.length&&d.expected.length<=100&&[...d.expected,...d.actual].every(v=>typeof v==='boolean');
 return false;
}
export function customTestScore(tests=[]){const killed=new Set(),errors=[];let valid=0;for(const[i,t]of tests.slice(0,30).entries()){
 if(!capstoneProblems.includes(t.problemId)||!validCustomInput(t.problemId,t.input)){errors.push('Test '+(i+1)+': đầu vào chưa đúng miền.');continue;}
 if(!checkOutput(t.problemId,t.input,t.expected)){errors.push('Test '+(i+1)+': đầu ra dự đoán chưa đúng.');continue;}valid++;
 const expected=oracle(t.problemId,t.input),mutants=[];
 if(t.problemId==='agent-dependencies'){
  mutants.push(['ignore-prerequisites',[...t.input.tasks].sort()]);
  if(expected===null)mutants.push(['cycle-not-detected',[...t.input.tasks]]);
 }
 if(t.problemId==='agent-policy'){
  mutants.push(['approval-overrides-scope',expected.map((r,i)=>t.input.approved.includes(t.input.calls[i].id)?{...r,decision:'allow'}:r)]);
  mutants.push(['risky-without-approval',expected.map(r=>r.decision==='approval'?{...r,decision:'allow'}:r)]);
  mutants.push(['unknown-tool-allowed',expected.map((r,i)=>!t.input.tools.some(tool=>tool.id===t.input.calls[i].tool)?{...r,decision:'allow'}:r)]);
 }
 if(t.problemId==='agent-evaluate'){
  mutants.push(['false-positive-false-negative-swapped',{...expected,fp:expected.fn,fn:expected.fp}]);
  mutants.push(['precision-recall-swapped',{...expected,precision:expected.recall,recall:expected.precision}]);
 }
 for(const[name,output]of mutants)if(!checkOutput(t.problemId,t.input,output))killed.add(name);
 }return{score:Math.min(10,killed.size*2.5),valid,killed:[...killed],errors};}
export function gradeCapstone(a){const questions=a.questions??[],answers=a.answers??{},code=capstoneProblems.filter(pid=>(a.codesPassed??[]).includes(pid)).length*20,concept=questions.slice(0,2).filter(q=>answers[q.id]===q.answerId).length*5,trace=questions.slice(2,6).filter(q=>answers[q.id]===q.answerId).length*5,tests=customTestScore(a.customTests),essayComplete=essayFields.every(f=>typeof a.essay?.[f.id]==='string'&&a.essay[f.id].trim().length>0),score=code+concept+trace+tests.score;return{score,code,concept,trace,tests,essayComplete,passed:score>=80&&code===60&&essayComplete,details:questions.map(q=>({id:q.id,correct:answers[q.id]===q.answerId,answerId:q.answerId,explanation:q.explanation})),note:'Điểm xác nhận planner, policy, metric và test theo fixture. Gemini góp ý văn bản, không quyết định điểm hoặc pass/fail. Không tuyên bố chứng minh agent an toàn trên mọi dữ liệu thực.'};}
export const capstoneDescription={title:'Trạm trợ lý thư viện an toàn',capstoneTitle:'Trạm trợ lý thư viện an toàn',dataset:'Task DAG, danh mục công cụ/quyền và nhật ký quyết định giả lập; không truy cập hệ thống thật.',problemIds:capstoneProblems,rubric:[{label:'Ba chức năng Python',points:60},{label:'Đọc sơ đồ và truy vết',points:20},{label:'Điều kiện áp dụng và độ phức tạp',points:10},{label:'Test phát hiện lỗi mẫu',points:10}],requiredAlgorithm:'Task sẵn sàng với phá hòa ASCII; policy theo tool/scope/approval; bảngTP/FP/FN/TN với chia0 an toàn.',testExample:{problemId:'agent-policy',input:{tools:[{id:'erase',scope:'delete',risky:true}],allowedScopes:['read'],approved:['C'],calls:[{id:'C',tool:'erase'}]},expected:[{id:'C',decision:'deny'}]}};
