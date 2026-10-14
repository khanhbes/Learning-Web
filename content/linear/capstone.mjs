import {randomUUID} from 'node:crypto';
import {random,shuffle,int} from '../../shared/random.mjs';
import {VERSION,generateInput,oracle,checkOutput,finite,rank,determinant} from './problems.mjs';
export const capstoneProblems=['linear-transform-batch','linear-solve-report','linear-least-squares'];
export const essayFields=[
 {id:'problem',title:'1. Bản đồ, hệ điều khiển và dữ liệu cảm biến',placeholder:'Mô tả points,A,b; số phương trình và biến; dữ liệu hiệu chuẩn x,y. Nêu đơn vị và dữ liệu giả lập.'},
 {id:'approach',title:'2. Thuật toán và điều kiện áp dụng',placeholder:'Giải thích affine Ap+b, rank/rank mở rộng và nghiệm, đường least squares có intercept và slope.'},
 {id:'edges',title:'3. Các giới hạn cần giữ',placeholder:'Nêu points rỗng,0,det âm, hệ vô nghiệm/vô số nghiệm, x trùng và sai số số thực. Phân biệt affine với tuyến tính.'},
 {id:'validation',title:'4. Biểu đồ và kiểm chứng',placeholder:'Đọc hình trước/sau, thế nghiệm vào Ax=b, residual/SSE của đường. Thiết kế test phát hiện lỗi mẫu.'},
 {id:'reflection',title:'5. Đánh đổi và tự đánh giá',placeholder:'Vì sao không so vector nghiệm với một mẫu duy nhất? Khi nào dùng QR/SVD thay nghịch đảo? Nêu điều chưa được đánh giá và seed.'},
];
function choice(id,prompt,answer,wrong,rng,skill){return{id,kind:'choice',skill,prompt,options:shuffle([answer,...wrong].map((text,i)=>({id:id+'-o'+i,text})),rng),answerId:id+'-o0',explanation:answer};}
export function capstoneQuestions(seed){const rng=random(String(seed)+':linear-cap'),a=int(rng,1,4),b=int(rng,1,4),c=int(rng,1,5);return[
 choice('linear-cap-c0','p′=Ap+b với b≠0 có giữ tính tuyến tính không?','Không;0 đi tới b nên đây là affine',['Có nếu A khả nghịch','Có nếu b nguyên'],rng,'transform'),
 choice('linear-cap-c1','Khử Gauss một hệ dense n×n thường có chi phí số học nào?','O(n³) thời gian, O(n²) lưu ma trận',['O(1) vì trả một vector','O(n) vì chỉ có n biến'],rng,'complexity'),
 choice('linear-cap-t0',`A=diag(${a},${b}),p=[1,2],offset=[1,-1]. p′ bằng gì?`,JSON.stringify([a+1,2*b-1]),[JSON.stringify([a,2*b]),JSON.stringify([a+1,b-1])],rng,'transform'),
 choice('linear-cap-t1',`Hệ x+y=${c},2x+2y=${2*c} có loại nghiệm nào?`,'infinite',['unique','none'],rng,'system-type'),
 choice('linear-cap-t2','Ma trận2×3 rank2 có nullity bao nhiêu?','1',['2','3'],rng,'rank'),
 choice('linear-cap-t3','Residual [1,-1,2] có SSE bao nhiêu?','6',['2','4'],rng,'least-squares'),
];}
export function createCapstone(now=Date.now()){const id=randomUUID(),seed=randomUUID(),tasks=Object.fromEntries(capstoneProblems.map(pid=>[pid,generateInput(pid,seed+':task')]));return{id,courseId:'linear',lessonId:28,mode:'capstone',status:'active',seed,version:VERSION,createdAt:now,updatedAt:now,questions:capstoneQuestions(seed),requiredProblems:capstoneProblems,answers:{},codesPassed:[],submissions:[],drafts:{python:''},codeDrafts:{},jobIds:[],result:null,tasks,dataset:{name:'Bản đồ và cảm biến Bitty giả lập',title:'Bản đồ và bộ điều khiển của Bitty',points:tasks['linear-transform-batch'].points,rows:tasks['linear-least-squares'].x.map((x,i)=>({x,y:tasks['linear-least-squares'].y[i]})),unit:'đơn vị bản đồ / tín hiệu cảm biến',notice:'Ba module riêng với dữ liệu giả lập. Thử hình và đọc đặc tả; không có dữ liệu thiết bị thật.'},essay:Object.fromEntries(essayFields.map(f=>[f.id,''])),customTests:[],feedback:null,lab:null};}
const number=x=>finite(x)&&Math.abs(x)<=10000;
const vector=(x,n)=>Array.isArray(x)&&x.length===n&&x.every(number);
const matrix=(x,m,n)=>Array.isArray(x)&&x.length===m&&x.every(row=>vector(row,n));
export function validCustomInput(id,d){if(!d||typeof d!=='object'||Array.isArray(d))return false;
 if(id==='linear-transform-batch')return matrix(d.A,2,2)&&vector(d.b,2)&&Array.isArray(d.points)&&d.points.length<=50&&d.points.every(p=>vector(p,2));
 if(id==='linear-solve-report'){if(!Array.isArray(d.A)||d.A.length<1||d.A.length>4||!Array.isArray(d.A[0])||d.A[0].length<1||d.A[0].length>4)return false;return matrix(d.A,d.A.length,d.A[0].length)&&vector(d.b,d.A.length)&&[...d.A.flat(),...d.b].every(x=>Number.isInteger(x)&&Math.abs(x)<=20);}
 if(id==='linear-least-squares')return Array.isArray(d.x)&&d.x.length>=3&&d.x.length<=100&&vector(d.y,d.x.length)&&d.x.every(number)&&new Set(d.x).size>=2&&d.x.every(Number.isInteger)&&d.y.every(Number.isInteger);
 return false;
}
export function customTestScore(tests=[]){const killed=new Set(),errors=[];let valid=0;for(const[i,t]of tests.slice(0,30).entries()){
 if(!capstoneProblems.includes(t.problemId)||!validCustomInput(t.problemId,t.input)){errors.push('Test '+(i+1)+': đầu vào sai shape,miền số hoặc điều kiện.');continue;}
 if(!checkOutput(t.problemId,t.input,t.expected)){errors.push('Test '+(i+1)+': kết quả dự đoán chưa đúng.');continue;}valid++;const expected=oracle(t.problemId,t.input),mutants=[];
 if(t.problemId==='linear-transform-batch'){
  mutants.push(['forget-translation',oracle(t.problemId,{...t.input,b:[0,0]})]);
  mutants.push(['transpose-transform',oracle(t.problemId,{...t.input,A:[[t.input.A[0][0],t.input.A[1][0]],[t.input.A[0][1],t.input.A[1][1]]]})]);
 }
 if(t.problemId==='linear-solve-report'){
  const n=t.input.A[0].length;
  mutants.push(['rank-counts-raw-rows',{...expected,rank:t.input.A.filter(row=>row.some(x=>x!==0)).length}]);
  mutants.push(['nullity-uses-rows',{...expected,nullity:t.input.A.length-rank(t.input.A)}]);
  if(expected.status==='none')mutants.push(['ignore-inconsistent-row',{...expected,status:'infinite',solution:Array(n).fill(0)}]);
  if(expected.solution)mutants.push(['zero-is-always-solution',{...expected,solution:Array(n).fill(0)}]);
 }
 if(t.problemId==='linear-least-squares'){
  mutants.push(['sse-is-mean',{...expected,sse:expected.sse/t.input.x.length}]);
  const predictions=t.input.x.map(x=>expected.slope*x);
  mutants.push(['forget-intercept',{...expected,intercept:0,predictions,sse:predictions.reduce((s,p,i)=>s+(t.input.y[i]-p)**2,0)}]);
 }
 for(const[name,out]of mutants)if(!checkOutput(t.problemId,t.input,out))killed.add(name);
 }return{score:Math.min(10,killed.size*2.5),valid,killed:[...killed],errors};}
export function gradeCapstone(a){const answers=a.answers??{},questions=a.questions??[],code=capstoneProblems.filter(id=>(a.codesPassed??[]).includes(id)).length*20,concept=questions.slice(0,2).filter(q=>answers[q.id]===q.answerId).length*5,trace=questions.slice(2,6).filter(q=>answers[q.id]===q.answerId).length*5,tests=customTestScore(a.customTests),essayComplete=essayFields.every(f=>typeof a.essay?.[f.id]==='string'&&a.essay[f.id].trim().length>0),score=code+concept+trace+tests.score;return{score,code,concept,trace,tests,essayComplete,passed:score>=80&&code===60&&essayComplete,details:questions.map(q=>({id:q.id,correct:answers[q.id]===q.answerId,answerId:q.answerId,explanation:q.explanation})),note:'Điểm xác nhận kỹ năng có checker: phép biến đổi,hệ,least squares,đọc số và test. AI góp ý luận; không chấm lập luận tự do hoặc quyết định pass/fail.'};}
export const capstoneDescription={title:'Bản đồ và bộ điều khiển của Bitty',capstoneTitle:'Bản đồ và bộ điều khiển của Bitty',dataset:'Points2D,hệ phương trình và dữ liệu hiệu chuẩn giả lập.',problemIds:capstoneProblems,rubric:[{label:'Ba chức năng Python',points:60},{label:'Đọc hình,số và truy vết',points:20},{label:'Điều kiện áp dụng và chi phí',points:10},{label:'Test phát hiện lỗi mẫu',points:10}],requiredAlgorithm:'Affine Ap+b; phân loại rank và nghiệm thỏa Ax=b; đường least squares có intercept/SSE.',testExample:{problemId:'linear-transform-batch',input:{A:[[2,1],[0,1]],b:[1,-1],points:[[1,2],[0,0]]},expected:[[5,1],[1,-1]]}};
