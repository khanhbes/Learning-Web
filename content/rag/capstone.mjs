import {randomUUID} from 'node:crypto';
import {random,shuffle,int} from '../../shared/random.mjs';
import {VERSION,generateInput,oracle,checkOutput} from './problems.mjs';
export const capstoneProblems=['rag-chunks','rag-retrieve','rag-citations'];
export const essayFields=[
 {id:'problem',title:'1. Câu hỏi và kho nội quy',placeholder:'Mô tả ai hỏi, nguồn nào được đọc, nguồn giả lập và giới hạn của bài.'},
 {id:'approach',title:'2. Từ trang giấy tới bằng chứng',placeholder:'Giải thích chia đoạn có overlap, truy xuất từ khóa và kiểm nguồn/đoạn trích. Vẽ luồng dữ liệu.'},
 {id:'edges',title:'3. Khi không tìm thấy hoặc bị thiếu',placeholder:'Phân tích tài liệu rỗng, từ lặp, điểm hòa, nguồn không tồn tại và quote rỗng. Khi nào phải báo thiếu bằng chứng?'},
 {id:'validation',title:'4. Kiểm thử từng ranh giới',placeholder:'Dự đoán đầu ra, đối chiếu ID và vị trí, tạo test bắt lỗi. Không dùng hình đẹp thay bằng chứng.'},
 {id:'reflection',title:'5. Điều đã và chưa kiểm chứng',placeholder:'Nêu khác biệt với tokenizer/embedding/LLM thật. Trích nguyên văn đúng chưa chứng minh mọi lập luận đúng. Đề xuất cách đánh giá tiếp.'},
];
function question(id,prompt,answer,wrong,rng,skill){return{id,kind:'choice',skill,prompt,options:shuffle([answer,...wrong].map((text,i)=>({id:id+'-o'+i,text})),rng),answerId:id+'-o0',explanation:answer};}
export function capstoneQuestions(seed){const r=random(String(seed)+':rag-cap'),size=int(r,3,6),overlap=int(r,1,2),k=int(r,1,3);return[
 question('rag-cap-c0','Checker xác nhận quote xuất hiện nguyên văn trong nguồn. Điều gì đã được kiểm chứng?','Đoạn trích khớp nguồn được chỉ định; chưa xác minh toàn bộ lập luận',['Mọi phát biểu trong câu trả lời đều đúng','Nguồn chắc chắn còn hiệu lực ngoài dữ liệu bài'],r,'evidence'),
 question('rag-cap-c1','Nếu có N tài liệu, mỗi tài liệu L token và query có Q từ duy nhất, dùng tập từ và sort mọi ứng viên: chi phí điển hình là gì?','O(N(L+Q)+N log N), bỏ qua chi phí ký tự trong từng token',['O(1) vì chỉ trả top K','O(log N) dù phải đọc toàn bộ tài liệu'],r,'complexity'),
 question('rag-cap-t0',`size=${size}, overlap=${overlap}. Nếu chưa chạm cuối, start tăng bao nhiêu?`,String(size-overlap),[String(size),String(size+overlap)],r,'chunks'),
 question('rag-cap-t1',`query=[a,a,b], A=[a,a], B=[b,a]. Với k=${k}, ID đứng đầu?`,'B',['A','Không có vì từ a lặp'],r,'retrieval'),
 question('rag-cap-t2','Nguồn A tồn tại nhưng quote="". supported là gì?','false',['true','null'],r,'evidence'),
 question('rag-cap-t3','A và B đều score 2, k=1. Theo quy tắc ID ASCII, giữ gì?','A',['B','Cả hai'],r,'ranking'),
];}
export function createCapstone(now=Date.now()){const id=randomUUID(),seed=randomUUID(),tasks=Object.fromEntries(capstoneProblems.map(pid=>[pid,generateInput(pid,seed+':task')]));return{id,courseId:'rag',lessonId:28,mode:'capstone',status:'active',seed,version:VERSION,createdAt:now,updatedAt:now,questions:capstoneQuestions(seed),requiredProblems:capstoneProblems,answers:{},codesPassed:[],submissions:[],drafts:{python:''},codeDrafts:{},jobIds:[],result:null,tasks,dataset:{name:'Nội quy thư viện giả lập',title:'Thủ thư có bằng chứng',rows:[{id:'A',text:'Return book in 14 days'},{id:'B',text:'Open from 9 to 17'}],notice:'Ba chức năng được kiểm trên fixture riêng. Không dùng LLM sinh đáp án tính điểm; không tuyên bố hệ thống xác minh chân lý của tài liệu.'},essay:Object.fromEntries(essayFields.map(f=>[f.id,''])),customTests:[],feedback:null,lab:null};}
const bounded=(x,max=500)=>typeof x==='string'&&x.length<=max;
const strings=x=>Array.isArray(x)&&x.length<=100&&x.every(v=>bounded(v,100));
const ids=rows=>new Set(rows.map(r=>r.id)).size===rows.length;
export function validCustomInput(id,d){if(!d||typeof d!=='object'||Array.isArray(d))return false;
 if(id==='rag-chunks')return strings(d.tokens)&&Number.isInteger(d.size)&&d.size>=1&&d.size<=100&&Number.isInteger(d.overlap)&&d.overlap>=0&&d.overlap<d.size;
 if(id==='rag-retrieve')return strings(d.query)&&Number.isInteger(d.k)&&d.k>=0&&d.k<=10&&Array.isArray(d.docs)&&d.docs.length<=100&&d.docs.every(x=>x&&bounded(x.id,100)&&strings(x.tokens))&&ids(d.docs);
 if(id==='rag-citations')return Array.isArray(d.sources)&&d.sources.length<=100&&d.sources.every(x=>x&&bounded(x.id,100)&&bounded(x.text,2000))&&ids(d.sources)&&Array.isArray(d.claims)&&d.claims.length<=100&&d.claims.every(x=>x&&bounded(x.id,100)&&bounded(x.sourceId,100)&&bounded(x.quote,2000))&&ids(d.claims);
 return false;
}
export function customTestScore(tests=[]){const killed=new Set(),errors=[];let valid=0;for(const[i,t]of tests.slice(0,30).entries()){
 if(!capstoneProblems.includes(t.problemId)||!validCustomInput(t.problemId,t.input)){errors.push('Test '+(i+1)+': kiểm lại kiểu, ID duy nhất và giới hạn đầu vào.');continue;}
 if(!checkOutput(t.problemId,t.input,t.expected)){errors.push('Test '+(i+1)+': đầu ra dự đoán chưa khớp quy tắc.');continue;}valid++;const d=t.input,expected=oracle(t.problemId,d),mutants=[];
 if(t.problemId==='rag-chunks'){
  mutants.push(['ignore-overlap',oracle(t.problemId,{...d,overlap:0})]);
  const extra=[];for(let start=0;start<d.tokens.length;start+=d.size-d.overlap)extra.push({start,tokens:d.tokens.slice(start,start+d.size)});
  mutants.push(['duplicate-covered-tail',extra]);
 }
 if(t.problemId==='rag-retrieve'){
  const rank=rows=>rows.filter(x=>x.score>0).sort((a,b)=>b.score-a.score||(a.id<b.id?-1:a.id>b.id?1:0)).slice(0,d.k);
  mutants.push(['count-query-duplicates',rank(d.docs.map(doc=>({id:doc.id,score:d.query.filter(t=>doc.tokens.includes(t)).length})))]);
  mutants.push(['reverse-tie-break',[...d.docs].map(doc=>({id:doc.id,score:[...new Set(d.query)].filter(t=>doc.tokens.includes(t)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||(a.id<b.id?1:a.id>b.id?-1:0)).slice(0,d.k)]);
 }
 if(t.problemId==='rag-citations'){
  mutants.push(['allow-empty-quote',d.claims.map(c=>({id:c.id,supported:!!d.sources.find(s=>s.id===c.sourceId&&s.text.includes(c.quote))}))]);
  mutants.push(['ignore-source-id',d.claims.map(c=>({id:c.id,supported:c.quote.length>0&&d.sources.some(s=>s.text.includes(c.quote))}))]);
 }
 for(const[name,out]of mutants)if(!checkOutput(t.problemId,d,out))killed.add(name);
 }return{score:Math.min(10,killed.size*2.5),valid,killed:[...killed],errors};}
export function gradeCapstone(a){const qs=a.questions??[],answers=a.answers??{},code=capstoneProblems.filter(id=>(a.codesPassed??[]).includes(id)).length*20,concept=qs.slice(0,2).filter(q=>answers[q.id]===q.answerId).length*5,trace=qs.slice(2,6).filter(q=>answers[q.id]===q.answerId).length*5,tests=customTestScore(a.customTests),essayComplete=essayFields.every(f=>typeof a.essay?.[f.id]==='string'&&a.essay[f.id].trim().length>0),score=code+concept+trace+tests.score;return{score,code,concept,trace,tests,essayComplete,passed:score>=80&&code===60&&essayComplete,details:qs.map(q=>({id:q.id,correct:answers[q.id]===q.answerId,answerId:q.answerId,explanation:q.explanation})),note:'Điểm xác nhận các chức năng và câu hỏi đã kiểm chứng. AI góp ý bài luận; không quyết định điểm hoặc pass/fail.'};}
export const capstoneDescription={title:'Thủ thư có bằng chứng',capstoneTitle:'Thủ thư có bằng chứng',dataset:'Nội quy, token và câu hỏi thư viện giả lập; không có dữ liệu cá nhân.',problemIds:capstoneProblems,rubric:[{label:'Ba chức năng Python',points:60},{label:'Truy vết và đọc kết quả',points:20},{label:'Điều kiện và chi phí',points:10},{label:'Test phát hiện lỗi mẫu',points:10}],requiredAlgorithm:'Chunk với stride size−overlap và dừng khi phủ cuối; giao tập từ query/document; trích dẫn theo ID và quote nguyên văn không rỗng.',testExample:{problemId:'rag-chunks',input:{tokens:['a','b','c','d'],size:3,overlap:2},expected:[{start:0,tokens:['a','b','c']},{start:1,tokens:['b','c','d']}]}};
