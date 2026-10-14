import {randomUUID} from 'node:crypto';
import {random,shuffle,int} from '../../shared/random.mjs';
import {VERSION,generateInput,oracle,checkOutput} from './problems.mjs';
export const capstoneProblems=['da-clean-orders','da-kpi','da-chart-series'];
export const essayFields=[
 {id:'problem',title:'1. Câu hỏi, dữ liệu và đơn vị quan sát',placeholder:'Mô tả cửa hàng giả lập, mỗi dòng là một đơn; nêu câu hỏi kinh doanh, đơn vị nghìn đồng và phạm vi ba tháng.'},
 {id:'approach',title:'2. Quy trình làm sạch và tính KPI',placeholder:'Nêu quy tắc giữ bản đầu, phát hiện missing/âm/khu vực/tháng sai, tính revenue và AOV đúng mẫu số.'},
 {id:'edges',title:'3. Trường hợp biên và giới hạn',placeholder:'Xét dòng trùng, bản đầu sai, số0, nhóm rỗng, tháng vắng; giải thích dữ liệu giả lập không chứng minh nhân quả.'},
 {id:'validation',title:'4. Biểu đồ, đối soát và test',placeholder:'Đọc biểu đồ doanh thu theo tháng/khu vực; đối soát tổng, viết test phát hiện ít nhất một lỗi mẫu.'},
 {id:'reflection',title:'5. Insight và đề xuất có điều kiện',placeholder:'Phân biệt quan sát và giả thuyết, nêu dữ liệu cần thêm để kiểm tra đề xuất; lưu seed/version.'},
];
function choice(id,prompt,answer,wrong,rng,skill){return{id,kind:'choice',skill,prompt,options:shuffle([answer,...wrong].map((text,i)=>({id:id+'-o'+i,text})),rng),answerId:id+'-o0',explanation:answer};}
export function capstoneQuestions(seed){const rng=random(String(seed)+':da-cap');const concepts=[choice('da-cap-c0','Khi nhóm có số đơn khác nhau, AOV toàn cửa hàng tính thế nào?','Tổng doanh thu chia tổng số đơn',['Trung bình các AOV khu vực không trọng số','Tổng doanh thu chia số khu vực'],rng,'kpi'),choice('da-cap-c1','Quét n đơn một lần với Map/Set tra cứu trung bình O(1) có chi phí gì?','O(n) thời gian kỳ vọng và O(n) bộ nhớ khi giữ dữ liệu',['O(1) vì chỉ một vòng lặp','O(n²) trong mọi trường hợp'],rng,'complexity')];return[...concepts,...['da-clean-orders','da-kpi','da-chart-series','da-quartile'].map((pid,i)=>{const input=generateInput(pid,String(seed)+':trace:'+i);return choice('da-cap-t'+i,'Đọc kết quả '+pid+' cho '+JSON.stringify(input),JSON.stringify(oracle(pid,input)),['null','"không đủ dữ liệu"'],rng,pid);})];}
export function createCapstone(now=Date.now()){
 const id=randomUUID(),seed=randomUUID(),rng=random(seed+':store'),rows=Array.from({length:18},(_,i)=>({id:i,region:['North','South','East'][i%3],month:['2026-01','2026-02','2026-03'][int(rng,0,2)],quantity:i===5?null:int(rng,0,5),price:i===9?-20:int(rng,10,80)}));
 rows.push({...rows[2]},{id:18,region:'West',month:'2026-02',quantity:2,price:30},{id:19,region:'North',month:'invalid',quantity:1,price:40});
 const cleanInput={rows},clean=oracle('da-clean-orders',cleanInput),kpiInput={rows:clean.rows},chartInput={rows:clean.rows,months:['2026-01','2026-02','2026-03']};
 return{id,courseId:'da',lessonId:28,mode:'capstone',status:'active',seed,version:VERSION,createdAt:now,updatedAt:now,questions:capstoneQuestions(seed),requiredProblems:capstoneProblems,answers:{},codesPassed:[],submissions:[],drafts:{python:''},codeDrafts:{},jobIds:[],result:null,tasks:{'da-clean-orders':cleanInput,'da-kpi':kpiInput,'da-chart-series':chartInput},dataset:{name:'Đơn hàng cửa hàng Byte giả lập',title:'Dashboard cửa hàng Byte',rows,cleanRows:clean.rows,unit:'nghìn đồng',months:chartInput.months,notice:'Dữ liệu hoàn toàn giả lập. Ba chức năng nối cùng bộ dữ liệu: làm sạch → KPI → series biểu đồ. Không có dữ liệu khách hàng thật.'},essay:Object.fromEntries(essayFields.map(f=>[f.id,''])),customTests:[],feedback:null,lab:null};
}
const number=x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1e6;
function validRows(rows,kind){return Array.isArray(rows)&&rows.length<=1000&&rows.every(r=>r&&typeof r==='object'&&!Array.isArray(r)&&Number.isInteger(r.id)&&r.id>=0&&r.id<=1e6&&typeof r.region==='string'&&r.region.length<=40&&typeof r.month==='string'&&r.month.length<=40&&(kind==='clean'?(number(r.quantity)||r.quantity===null)&&(number(r.price)||r.price===null):number(r.revenue)&&r.revenue>=0));}
export function validCustomInput(id,d){if(!d||typeof d!=='object'||Array.isArray(d))return false;if(id==='da-clean-orders')return validRows(d.rows,'clean');if(id==='da-kpi')return validRows(d.rows,'kpi')&&new Set(d.rows.map(r=>r.id)).size===d.rows.length;if(id==='da-chart-series')return validRows(d.rows,'chart')&&Array.isArray(d.months)&&d.months.length>=1&&d.months.length<=24&&d.months.every(m=>typeof m==='string'&&/^\d{4}-\d{2}$/.test(m))&&new Set(d.months).size===d.months.length;return false;}
export function customTestScore(tests=[]){const killed=new Set(),errors=[];let valid=0;for(const[i,t]of tests.slice(0,30).entries()){
 if(!capstoneProblems.includes(t.problemId)||!validCustomInput(t.problemId,t.input)){errors.push('Test '+(i+1)+': đầu vào không hợp lệ.');continue;}
 if(!checkOutput(t.problemId,t.input,t.expected)){errors.push('Test '+(i+1)+': kết quả dự đoán chưa đúng.');continue;}valid++;
 const expected=oracle(t.problemId,t.input),mutants=[];
 if(t.problemId==='da-clean-orders'){
  mutants.push(['missing-to-zero',oracle(t.problemId,{rows:t.input.rows.map(r=>({...r,quantity:r.quantity??0,price:r.price??0}))})]);
  const latest=new Map();for(const row of t.input.rows)latest.set(row.id,row);
  mutants.push(['last-duplicate-wins',{...oracle(t.problemId,{rows:[...latest.values()]}),duplicates:t.input.rows.length-latest.size}]);
  mutants.push(['allow-negative',oracle(t.problemId,{rows:t.input.rows.map(r=>({...r,quantity:r.quantity===null?null:Math.abs(r.quantity),price:r.price===null?null:Math.abs(r.price)}))})]);
 }
 if(t.problemId==='da-kpi'){
  const groups=Object.values(expected.byRegion),average=groups.length?groups.reduce((s,g)=>s+g.revenue/g.orders,0)/groups.length:0;
  mutants.push(['mean-of-group-means',{...expected,averageOrder:average}]);
  mutants.push(['divide-by-regions',{...expected,averageOrder:groups.length?expected.revenue/groups.length:0}]);
 }
 if(t.problemId==='da-chart-series'){
  mutants.push(['drop-empty-month',expected.filter(r=>r.orders>0)]);
  mutants.push(['chart-wrong-metric',expected.map(r=>({...r,revenue:r.orders}))]);
 }
 for(const[name,output]of mutants)if(!checkOutput(t.problemId,t.input,output))killed.add(name);
 }return{score:Math.min(10,killed.size*2.5),valid,killed:[...killed],errors};}
export function gradeCapstone(a){const answers=a.answers??{},questions=a.questions??[],code=capstoneProblems.filter(id=>(a.codesPassed??[]).includes(id)).length*20,concept=questions.slice(0,2).filter(q=>answers[q.id]===q.answerId).length*5,trace=questions.slice(2,6).filter(q=>answers[q.id]===q.answerId).length*5,tests=customTestScore(a.customTests),essayComplete=essayFields.every(f=>typeof a.essay?.[f.id]==='string'&&a.essay[f.id].trim().length>0),score=code+concept+trace+tests.score;return{score,code,concept,trace,tests,essayComplete,passed:score>=80&&code===60&&essayComplete,details:questions.map(q=>({id:q.id,correct:answers[q.id]===q.answerId,answerId:q.answerId,explanation:q.explanation})),note:'Điểm xác nhận chức năng, đọc kết quả và test. AI góp ý văn bản; không quyết định điểm hay pass/fail.'};}
export const capstoneDescription={title:'Dashboard cửa hàng Byte',capstoneTitle:'Dashboard cửa hàng Byte',dataset:'Đơn hàng giả lập ba tháng, có bản trùng, missing và dữ liệu không hợp lệ.',problemIds:capstoneProblems,rubric:[{label:'Ba chức năng code',points:60},{label:'Đọc bảng,biểu đồ và truy vết',points:20},{label:'Điều kiện áp dụng và độ phức tạp',points:10},{label:'Test phát hiện lỗi mẫu',points:10}],requiredAlgorithm:'Kiểm tra/dedup theo quy tắc; KPI đúng granularity; series theo tháng có ô vắng.',testExample:{problemId:'da-kpi',input:{rows:[{id:0,region:'North',month:'2026-01',revenue:10},{id:1,region:'North',month:'2026-01',revenue:20},{id:2,region:'South',month:'2026-02',revenue:90}]},expected:{revenue:120,orders:3,averageOrder:40,byRegion:{North:{orders:2,revenue:30},South:{orders:1,revenue:90}}}}};
