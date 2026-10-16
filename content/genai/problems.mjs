import {random,int} from '../../shared/random.mjs';
export const VERSION='genai-2026.10.15-v1';
export const NOTICE='Phòng thí nghiệm xác định trên dữ liệu nhỏ. Bảng token, vector và kết quả model được đề cung cấp; không huấn luyện hay gọi LLM thật, không tốn API. Bài Python kiểm chứng phép tính và hợp đồng, không chấm chất lượng văn bản tự do.';
const definitions=[
 ['count','Đếm các mảnh token','Cho tokens là các mảnh đã tách bởi tokenizer giả lập. Trả số phần tử. Không tách lại theo khoảng trắng.','0–100 token; mỗi token là chuỗi không rỗng.'],
 ['encode','Tra ID từ bảng token','Với mỗi token trong tokens, trả ID trong vocab. Token chưa có nhận -1. Giữ thứ tự và số lần lặp.',"vocab ánh xạ token ASCII sang ID nguyên≥0; tokens tối đa 100."],
 ['distribution','Từ số đếm đến xác suất',"Cho counts là mảng số đếm. Trả mảng xác suất counts [i]/tổng. Nếu tổng 0 trả mảng 0 cùng độ dài.","1–8 số nguyên 0..100; tổng 0 là quy ước bài, không phải phân phối xác suất hợp lệ."],
 ['greedy','Chọn token có điểm cao nhất','candidates có id và score. Trả id có score cao nhất; hòa chọn id ASCII nhỏ nhất. Mảng rỗng trả null.','id ASCII duy nhất; score hữu hạn -100..100; đây là greedy, không lấy mẫu.'],
 ['top-k','Lọc top-k ứng viên','Sắp candidates theo weight giảm dần, hòa theo id ASCII tăng dần. Trả tối đa k ID theo thứ tự đó.',"k nguyên 0..20; weight nguyên≥0; id duy nhất; không lấy mẫu sau lọc."],
 ['top-p','Giữ đủ khối lượng xác suất',"candidates có weight phần trăm, tổng đúng 100. Sắp weight giảm/hòa ID ASCII. Trả tiền tố ngắn nhất có tổng weight≥p theo thứ tự sắp.",'0<p≤100 nguyên; weights nguyên dương; lọc trước khi chuẩn hóa/lấy mẫu lại.'],
 ['attention','Tổng có trọng số của các giá trị',"weights và values cùng độ dài. Trả Σ(weights [i]*values [i])/Σweights. Tổng weight 0 trả 0 theo quy ước bài.","1–8 giá trị số; weights nguyên≥0; đây là attention 1 chiều đã cho trọng số, chưa tính Q/K/softmax."],
 ['budget','Dành chỗ cho đầu ra',"Cho window, promptTokens, reserved. Trả {available, fits}: available=window-reserved, fits=promptTokens≤available.",'0≤reserved≤window≤10000; promptTokens≥0; đơn vị token được cung cấp.'],
 ['split','Giữ tập đánh giá riêng',"Cho ids duy nhất và trainCount. Trả {train, test}, train lấy trainCount ID đầu, test phần còn lại; không trộn hoặc lặp.",'0≤trainCount≤ids.length≤100; thứ tự đã được đề xáo cố định.'],
 ['preference','Tổng hợp cặp phản hồi ưu tiên',"Cho answers là ID duy nhất và pairs có chosen, rejected khác nhau. Trả số lần chosen của từng answer, kể cả answer chưa được chọn có 0.",'pairs hợp lệ; đây là thống kê dữ liệu preference, không thực hiện DPO/RLHF.'],
 ['lora','Đếm tham số adapter',"Với ma trận rows×cols và hạng rank, trả {full, adapter}: full=rows*cols, adapter=rank*(rows+cols).","rows, cols 1..1000; rank 1..min(rows, cols). Chỉ hai ma trận A/B, bỏ qua bias và scaling."],
 ['memory','Dung lượng trọng số lý tưởng',"Cho parameters, bits. Trả số byte tối thiểu chứa các trọng số, làm tròn lên parameters*bits/8.","parameters nguyên 0..10^7; bits là 4/8/16/32. Chưa gồm scale, KV cache, activations hoặc runtime."],
 ['prompt','Ghép một yêu cầu có cấu trúc','Trả chuỗi chính xác TASK: task, DATA: context, FORMAT: format trên ba dòng (dùng ký tự xuống dòng), không dòng cuối thừa.','task/context/format là chuỗi một dòng; đây là định dạng do bài quy định, không bảo đảm LLM làm đúng.'],
 ['schema','Kiểm cấu trúc câu trả lời',"Cho outputs. Với mỗi phần tử, trả true nếu là object đúng hai khóa label, confidence; label trong allowedLabels; confidence là số hữu hạn từ 0 đến 1, không boolean.",'allowedLabels là mảng chuỗi duy nhất. Có thể thiếu/thừa key, null, string hoặc kiểu sai. Qua schema chưa chứng minh label đúng.'],
 ['context','Giữ lịch sử vừa ngân sách','Duyệt messages từ mới về cũ. Giữ hậu tố liên tiếp dài nhất có tổng cost≤budget; gặp tin không vừa thì dừng. Trả ID theo thứ tự gốc.','cost nguyên dương; budget≥0; ID duy nhất. Không bỏ tin lớn ở giữa để nhặt tin cũ.'],
 ['retrieve','Tìm bằng chứng theo từ khóa',"Với mỗi docs, score là số token query duy nhất xuất hiện trong doc.tokens. Giữ score>0; sắp score giảm/hòa ID ASCII; trả tối đa k {id, score}.","0≤k≤20; token ASCII. Đây là overlap từ khóa, không giả lập embedding hay BM 25."],
 ['grounding','Đối chiếu phát biểu với bằng chứng',"Với mỗi claim {id, key, value, source}, trả {id, supported}. supported=true chỉ khi evidence có đúng source và fact cùng key, value. Không tìm nguồn khác để bù.",'fact/claim.value là chuỗi hoặc số nguyên; cùng key nhưng giá trị khác không hỗ trợ claim. Đây là so khớp dữ kiện có cấu trúc, không suy luận văn bản.'],
 ['loop','Dừng vòng công việc',"Đọc outcomes continue/done/error tối đa limit mục. Dừng ở done/error. Nếu hết limit chưa dừng trả limit, hết dữ liệu trước đó trả exhausted. Trả {steps, status}.","limit nguyên 1..20; done đúng bước cuối vẫn là done. Không thực thi tool thật."],
 ['evaluate','Đếm đúng trên bộ chuẩn',"expected và actual là mảng nhãn cùng độ dài. Trả {correct, total, accuracy}; đúng khi chuỗi bằng nhau; rỗng accuracy 0.",'0–100 nhãn ASCII. Exact match phù hợp nhãn này, không phải mọi câu trả lời tự do.'],
 ['latency','Đọc nhật ký độ trễ',"Cho durationsMs. Trả {totalMs, maxMs, meanMs}, mảng rỗng cho cả ba 0.",'0–100 thời lượng nguyên≥0. Tổng là các bước nối tiếp, không suy từ tổng cho việc chạy song song.'],
 ['cache','Tìm tiền tố token có thể dùng lại',"Cho previous, current là hai mảng ID token. Trả số phần tử bằng nhau liên tiếp từ đầu đến trước vị trí khác đầu tiên.",'0–100 ID nguyên≥0. Bài chỉ kiểm tiền tố; cache thật còn phụ thuộc model, cấu hình và cơ chế runtime.'],
 ['quantize','Làm tròn trên lưới đơn giản','Với mỗi values, trả floor(value/step+0.5)*step. Đây là làm tròn nửa lên theo hướng +∞.',"step nguyên 1..10; values nguyên -100..100; không dùng Python round vì quy tắc nửa khác. Đây là lượng tử hóa lưới minh họa, không triển khai quantizer LLM."],
 ['causal','Mặt nạ không nhìn tương lai',"Cho n, trả ma trận n×n boolean: ô [i][j]=true khi j≤i, còn lại false. Chỉ số bắt đầu 0.",'0≤n≤8. Mô tả causal attention có tự nhìn chính vị trí, không áp cho mọi loại attention.'],
 ['distill','Trung bình các phân phối giáo viên',"Cho teachers là các hàng cùng độ dài, mỗi hàng tổng 100. Trả phần trăm trung bình từng cột.","1–8 hàng; 1–6 cột; số nguyên không âm. Đây là tạo nhãn mềm minh họa, chưa huấn luyện student."],
];
export const problemIds=definitions.map(d=>'genai-'+d[0]);
const cmp=(a,b)=>a<b?-1:a>b?1:0;
export function oracle(id,d){switch(id.replace(/^genai-/,'')){
 case'count':return d.tokens.length;
 case'encode':return d.tokens.map(t=>Object.hasOwn(d.vocab,t)?d.vocab[t]:-1);
 case'distribution':{const total=d.counts.reduce((a,b)=>a+b,0);return d.counts.map(v=>total?v/total:0);}
 case'greedy':return [...d.candidates].sort((a,b)=>b.score-a.score||cmp(a.id,b.id))[0]?.id??null;
 case'top-k':return [...d.candidates].sort((a,b)=>b.weight-a.weight||cmp(a.id,b.id)).slice(0,d.k).map(c=>c.id);
 case'top-p':{let mass=0;const selected=[];for(const c of [...d.candidates].sort((a,b)=>b.weight-a.weight||cmp(a.id,b.id))){selected.push(c.id);mass+=c.weight;if(mass>=d.p)break;}return selected;}
 case'attention':{const total=d.weights.reduce((a,b)=>a+b,0);return total?d.values.reduce((s,v,i)=>s+v*d.weights[i],0)/total:0;}
 case'budget':return{available:d.window-d.reserved,fits:d.promptTokens<=d.window-d.reserved};
 case'split':return{train:d.ids.slice(0,d.trainCount),test:d.ids.slice(d.trainCount)};
 case'preference':return Object.fromEntries(d.answers.map(a=>[a,d.pairs.filter(p=>p.chosen===a).length]));
 case'lora':return{full:d.rows*d.cols,adapter:d.rank*(d.rows+d.cols)};
 case'memory':return Math.ceil(d.parameters*d.bits/8);
 case'prompt':return'TASK: '+d.task+'\nDATA: '+d.context+'\nFORMAT: '+d.format;
 case'schema':return d.outputs.map(v=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===2&&Object.hasOwn(v,'label')&&Object.hasOwn(v,'confidence')&&d.allowedLabels.includes(v.label)&&typeof v.confidence==='number'&&Number.isFinite(v.confidence)&&v.confidence>=0&&v.confidence<=1);
 case'context':{let left=d.budget,i=d.messages.length;while(i>0&&d.messages[i-1].cost<=left)left-=d.messages[--i].cost;return d.messages.slice(i).map(m=>m.id);}
 case'retrieve':return d.docs.map(doc=>({id:doc.id,score:[...new Set(d.query)].filter(t=>doc.tokens.includes(t)).length})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||cmp(a.id,b.id)).slice(0,d.k);
 case'grounding':return d.claims.map(c=>({id:c.id,supported:d.evidence.some(e=>e.id===c.source&&e.facts.some(f=>f.key===c.key&&f.value===c.value))}));
 case'loop':{let steps=0;for(const v of d.outcomes.slice(0,d.limit)){steps++;if(v==='done'||v==='error')return{steps,status:v};}return{steps,status:steps===d.limit?'limit':'exhausted'};}
 case'evaluate':{const total=d.expected.length,correct=d.expected.filter((v,i)=>v===d.actual[i]).length;return{correct,total,accuracy:total?correct/total:0};}
 case'latency':{const totalMs=d.durationsMs.reduce((s,v)=>s+v,0);return{totalMs,maxMs:Math.max(0,...d.durationsMs),meanMs:d.durationsMs.length?totalMs/d.durationsMs.length:0};}
 case'cache':{let i=0;while(i<Math.min(d.previous.length,d.current.length)&&d.previous[i]===d.current[i])i++;return i;}
 case'quantize':return d.values.map(v=>Math.floor(v/d.step+0.5)*d.step);
 case'causal':return Array.from({length:d.n},(_,i)=>Array.from({length:d.n},(_,j)=>j<=i));
 case'distill':return d.teachers[0].map((_,j)=>d.teachers.reduce((s,row)=>s+row[j],0)/d.teachers.length);
 default:throw Error('Unknown Gen AI problem '+id);
}}
export function equivalent(a,b){if(typeof a==='number'||typeof b==='number')return typeof a==='number'&&typeof b==='number'&&Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8+Math.abs(b)*1e-7;if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>equivalent(v,b[i]));if(a&&b&&typeof a==='object'&&typeof b==='object')return Object.keys(a).length===Object.keys(b).length&&Object.keys(b).every(k=>Object.hasOwn(a,k)&&equivalent(a[k],b[k]));return a===b;}
export const checkOutput=(id,d,value)=>problemIds.includes(id)&&equivalent(value,oracle(id,d));
export function generateInput(id,seed=0){const rng=random(String(seed)+':'+id),n=int(rng,2,5),arr=(fn,k=n)=>Array.from({length:k},(_,i)=>fn(i)),pick=a=>a[int(rng,0,a.length-1)],vocab={sun:0,flower:1,'!':2,cat:3};switch(id.replace(/^genai-/,'')){
 case'count':return{tokens:arr(()=>pick(['sun','flower','cat','!']))};
 case'encode':return{tokens:arr(()=>pick(['sun','flower','cat','unknown','!'])),vocab};
 case'distribution':return{counts:arr(()=>int(rng,0,9))};
 case'greedy':return{candidates:arr(i=>({id:'T'+i,score:int(rng,-2,5)})).reverse()};
 case'top-k':return{candidates:arr(i=>({id:'T'+i,weight:int(rng,0,20)})).reverse(),k:int(rng,0,n+1)};
 case'top-p':{const a=int(rng,25,55),b=int(rng,10,25),c=int(rng,1,15);return{candidates:[{id:'D',weight:100-a-b-c},{id:'A',weight:a},{id:'B',weight:b},{id:'C',weight:c}],p:int(rng,1,100)};}
 case'attention':return{weights:arr(()=>int(rng,0,4)),values:arr(()=>int(rng,-3,9))};
 case'budget':return{window:int(rng,10,30),reserved:5,promptTokens:int(rng,0,30)};
 case'split':return{ids:arr(i=>'row-'+i),trainCount:int(rng,0,n)};
 case'preference':return{answers:['A','B','C'],pairs:arr(()=>{const chosen=pick(['A','B','C']);return{chosen,rejected:pick(['A','B','C'].filter(v=>v!==chosen))};})};
 case'lora':return{rows:int(rng,4,16),cols:int(rng,4,16),rank:int(rng,1,4)};
 case'memory':return{parameters:int(rng,1,101),bits:pick([4,8,16,32])};
 case'prompt':return{task:pick(['Classify the note','Summarize the fact']),context:pick(['The train arrives at 8','The library closes at 5','The book has 24 pages']),format:pick(['one label','one sentence','JSON'])};
 case'schema':return{allowedLabels:['yes','no'],outputs:[{label:pick(['yes','no']),confidence:int(rng,0,10)/10},{label:'yes',confidence:true},{label:'other',confidence:0.5},{label:'no',confidence:1.1},{label:'yes',confidence:0,extra:1},null,{label:'no',confidence:1}]};
 case'context':return{budget:int(rng,0,15),messages:arr(i=>({id:'M'+i,cost:int(rng,1,8)}))};
 case'retrieve':return{query:arr(()=>pick(['book','train','time']),2),docs:arr(i=>({id:'D'+i,tokens:arr(()=>pick(['book','train','time','other']),3)})),k:int(rng,0,n)};
 case'grounding':{const value=int(rng,1,30);return{evidence:[{id:'D0',facts:[{key:'pages',value}]},{id:'D1',facts:[{key:'opens',value:8}]}],claims:[{id:'C0',key:'pages',value,source:'D0'},{id:'C1',key:'pages',value:value+1,source:'D0'},{id:'C2',key:'opens',value:8,source:'missing'},{id:'C3',key:'opens',value:8,source:'D1'}]};}
 case'loop':return{outcomes:arr(()=>pick(['continue','continue','done','error'])),limit:int(rng,1,6)};
 case'evaluate':return{expected:arr(()=>pick(['A','B'])),actual:arr(()=>pick(['A','B']))};
 case'latency':return{durationsMs:arr(()=>int(rng,0,100))};
 case'cache':{const previous=arr(()=>int(rng,0,9)),at=int(rng,0,n);return{previous,current:previous.map((v,i)=>i===at?v+1:v)};}
 case'quantize':return{values:arr(()=>int(rng,-10,10)),step:int(rng,1,5)};
 case'causal':return{n:int(rng,0,5)};
 case'distill':return{teachers:arr(()=>{const a=int(rng,0,100);return[a,100-a];})};
 default:throw Error('Unknown Gen AI problem '+id);
}}
export const edgeInputs={
 'genai-count':[{tokens:[]},{tokens:['sun','flower','!']}],
 'genai-encode':[{tokens:['sun','unknown','sun'],vocab:{sun:0}},{tokens:[],vocab:{}}],
 'genai-distribution':[{counts:[0,0]},{counts:[1,1,1]}],
 'genai-greedy':[{candidates:[]},{candidates:[{id:'B',score:0},{id:'A',score:0}]}],
 'genai-top-k':[{candidates:[{id:'B',weight:1},{id:'A',weight:1}],k:1},{candidates:[],k:0}],
 'genai-top-p':[{candidates:[{id:'A',weight:60},{id:'B',weight:30},{id:'C',weight:10}],p:90},{candidates:[{id:'A',weight:60},{id:'B',weight:30},{id:'C',weight:10}],p:61}],
 'genai-attention':[{weights:[0,0],values:[1,9]},{weights:[1,3],values:[2,6]}],
 'genai-budget':[{window:10,reserved:3,promptTokens:7},{window:0,reserved:0,promptTokens:1}],
 'genai-split':[{ids:[],trainCount:0},{ids:['A','B'],trainCount:2}],
 'genai-preference':[{answers:['A','B'],pairs:[]},{answers:['A','B'],pairs:[{chosen:'A',rejected:'B'},{chosen:'A',rejected:'B'}]}],
 'genai-lora':[{rows:4,cols:4,rank:4},{rows:8,cols:8,rank:1}],
 'genai-memory':[{parameters:3,bits:4},{parameters:0,bits:32}],
 'genai-prompt':[{task:'A',context:'',format:'JSON'}],
 'genai-schema':[{allowedLabels:['yes'],outputs:[{label:'yes',confidence:0},{label:'yes',confidence:1},{label:'yes',confidence:false},{label:'yes'},{label:'yes',confidence:0.5,extra:0},[]]}],
 'genai-context':[{budget:5,messages:[{id:'old',cost:1},{id:'new',cost:6}]},{budget:3,messages:[{id:'A',cost:1},{id:'B',cost:2}]}],
 'genai-retrieve':[{query:['a','a'],docs:[{id:'B',tokens:['a','a']},{id:'A',tokens:['a']}],k:2},{query:[],docs:[],k:0}],
 'genai-grounding':[{evidence:[{id:'D',facts:[{key:'x',value:0}]}],claims:[{id:'C',key:'x',value:0,source:'D'},{id:'B',key:'x',value:0,source:'other'}]},{evidence:[],claims:[]}],
 'genai-loop':[{outcomes:['continue','done'],limit:2},{outcomes:[],limit:1},{outcomes:['continue','done'],limit:1}],
 'genai-evaluate':[{expected:[],actual:[]},{expected:['A','B'],actual:['A','A']}],
 'genai-latency':[{durationsMs:[]},{durationsMs:[0,1,2]}],
 'genai-cache':[{previous:[1,2,3],current:[1,9,3]},{previous:[],current:[0]}],
 'genai-quantize':[{values:[-3,-1,1,3],step:2},{values:[],step:1}],
 'genai-causal':[{n:0},{n:1}],
 'genai-distill':[{teachers:[[0,100],[100,0]]},{teachers:[[25,25,50]]}],
};
export function testsFor(id,seed,opts={}){const only=typeof opts==='boolean'?opts:!!opts.publicOnly,tests=[0,1].map(i=>({name:'Ví dụ '+(i+1),group:'sample',input:generateInput(id,'sample-'+i)}));if(!only){for(const [i,input]of edgeInputs[id].entries())tests.push({name:'Biên '+(i+1),group:'edge',input:structuredClone(input)});for(let i=0;i<8;i++)tests.push({name:'Biến thể '+(i+1),group:'random',input:generateInput(id,seed+':'+i)});}return tests.map(t=>({...t,expected:oracle(id,t.input)}));}
export const problems=Object.fromEntries(definitions.map(([key,title,statement,constraints])=>{const id='genai-'+key,sampleInput=generateInput(id,0);return[id,{id,courseId:'genai',title,statement,description:statement,constraints,skill:key,version:VERSION,runtime:'pyodide',packages:[],languages:['python'],sampleInput,sampleOutput:oracle(id,sampleInput),hints:['Chạy tay một đầu vào nhỏ và ghi đúng đầu ra theo đề.','Tách phần đọc dữ liệu, cập nhật trạng thái và xử lý trường hợp biên.','Kiểm miền rỗng, hòa điểm, bằng ngưỡng; dùng return để trả kết quả.'],starters:{python:'def solve(data):\n    # Dữ liệu mô phỏng đã có trong data.\n    raise NotImplementedError("Viết lời giải của bạn")\n'}}];}));
export function problemDetails(id){const p=problems[id];return p?{...p,language:'python',starter:p.starters.python,contract:p.constraints,examples:testsFor(id,0,true).map(t=>({input:t.input,output:t.expected}))}:null;}
export function traceQuestion(id,seed){const input=generateInput(id,seed),answer=oracle(id,input);return{prompt:problems[id].statement,input,answer,wrongAnswers:[null,[],{},false].filter(v=>!checkOutput(id,input,v)),explanation:'Áp dụng đúng hợp đồng và đối chiếu từng trường: '+JSON.stringify(answer)};}
