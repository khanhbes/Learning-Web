import {random,int,shuffle} from '../../shared/random.mjs';
export const VERSION='rag-2026.10.15-v1';
export const NOTICE='Phòng thực hành dùng dữ liệu nhỏ, vector và điểm được công khai. Token tách theo khoảng trắng là mô hình đồ chơi; không phải tokenizer hay embedding ngữ nghĩa thật. Không gọi LLM, API trả phí hoặc mạng khi chấm.';
const defs=[
 ['lookup','Tìm câu trả lời trong phiếu nguồn','docs gồm {id,answer}; tìm doc có id bằng sourceId, trả answer; không có trả null. ID duy nhất, answer là string, kể cả chuỗi rỗng.','Tra theo ID chính xác, không suy đoán câu trả lời.'],
 ['tokens','Đếm đơn vị trong bộ tách từ đồ chơi','text chỉ gồm từ ASCII, dấu cách, tab và xuống dòng. Tách theo một hoặc nhiều ký tự khoảng trắng, bỏ phần rỗng; trả {tokens,count}. Giữ nguyên hoa/thường và dấu câu gắn từ.','text tối đa 300 ký tự. Đây không phải BPE/WordPiece và count không dùng tính phí API.'],
 ['budget','Đóng gói ngữ cảnh theo ngân sách','limit gồm cả reserved. Duyệt chunks {id,cost} theo thứ tự; nếu cost vừa phần còn lại thì lấy, nếu không thì bỏ qua và xét tiếp. Trả {ids,used,remaining}; remaining=limit-reserved-used.','0≤reserved≤limit≤1000; cost nguyên dương. Đây là greedy theo thứ tự, không phải bài tối ưu knapsack.'],
 ['argmax','Chọn token tiếp theo từ bảng điểm','candidates {id,score}; trả id có score cao nhất, hòa ID ASCII nhỏ nhất; danh sách rỗng trả null.','Bảng điểm cho sẵn, không huấn luyện hoặc suy luận mô hình. Score âm vẫn hợp lệ.'],
 ['attention','Pha các giá trị bằng trọng số','weights là số nguyên không âm cộng đúng100; values cùng độ dài. Trả tổng weights[i]*values[i]/100.','1–10 phần tử. Trọng số đã cho, không giả mô phỏng toàn bộ Transformer.'],
 ['route','Chọn cách cập nhật tri thức','requests có need là fresh-facts, style, hoặc unknown. Trả mảng route tương ứng retrieve, fine-tune, clarify.','Đây là quy tắc tình huống nhập môn; retrieval và fine-tuning có thể kết hợp trong hệ thật.'],
 ['filter','Lọc nguồn theo quyền và thời gian','docs {id,tenant,expiresAt}; chỉ giữ đúng tenant yêu cầu và expiresAt>now. Trả ID theo thứ tự gốc.','Thời gian nguyên; đúng thời điểm expiresAt là hết hạn. Lọc trước retrieval, không để prompt tự cấp quyền.'],
 ['chunks','Chia token thành đoạn có chồng lấn','tokens mảng string; size nguyên dương, 0≤overlap<size. Từ start=0 lấy tối đa size token, ghi {start,tokens}; nếu đã chạm cuối thì dừng, nếu chưa tăng start thêm size-overlap. Trả các đoạn.','tokens tối đa100; không tạo đoạn rỗng hoặc đoạn thừa chỉ chứa phần đuôi đã phủ hết.'],
 ['bow','Đếm từ theo từ điển cố định','vocab là từ duy nhất theo thứ tự; tokens là các từ. Trả vector số lần mỗi từ vocab xuất hiện; bỏ từ ngoài vocab.','Không phân biệt nghĩa hoặc từ đồng nghĩa; giữ nguyên hoa/thường theo đầu vào.'],
 ['cosine','So hướng hai vector','a,b cùng chiều và có phần tử hữu hạn. Trả cosine=dot(a,b)/(norm(a)*norm(b)); nếu một vector0, trả null.','1–8 chiều, số nguyên -10..10. Cosine có thể âm; sai số tuyệt đối/tương đối1e-7.'],
 ['vector','Xếp hạng bằng cosine','query và docs.vector cùng chiều. Bỏ doc vector0; nếu query0 trả[]. Trả top k {id,score}, score cosine giảm dần, hòa trong cùng phép tính theo ID ASCII. Giữ cả score âm nếu thuộc top k.','k0..10; ID duy nhất; số nguyên -5..5, chiều2. So float1e-7; không trộn vector từ hai model khác nhau.'],
 ['retrieve','Truy xuất từ khóa không đếm trùng','query và docs.tokens là từ; score bằng số từ query duy nhất có trong doc. Bỏ score0; xếp score giảm, hòa ID ASCII tăng. Trả top k {id,score}.','ID duy nhất, k0..10; đây là giao tập từ, không gắn nhãn BM25.'],
 ['dedup','Gộp ID trùng giữa các truy vấn','lists là danh sách các mảng ID. Duyệt từ trái qua phải, giữ mỗi ID đúng lần xuất hiện đầu. Trả mảng ID.','Không đổi thứ tự bằng sort; xóa trùng theo ID, không theo độ giống văn bản.'],
 ['rrf','Trộn hai bảng hạng bằng RRF','rankings gồm các danh sách ID không trùng nội bộ. Với mỗi ID cộng 1/(c+rank), rank bắt đầu1; ID không có trong bảng không đóng góp. Trả top k {id,score} giảm điểm/hòa ID ASCII.','c nguyên1..100; k0..10; tối đa3 bảng. Đây là Reciprocal Rank Fusion, không cộng raw cosine và BM25.'],
 ['rerank','Xếp lại ứng viên bằng điểm đã cho','candidates là ID duy nhất từ bước retrieval; scores map ID→điểm. Xếp chỉ candidates theo score giảm rồi ID ASCII. Trả top k ID.','Mọi candidate có score; scores có thể chứa ID ngoài candidates, tuyệt đối không đưa vào. Rerank không cứu được nguồn chưa được truy xuất.'],
 ['citations','Kiểm từng trích dẫn theo bằng chứng','claims gồm {id,sourceId,quote}; sources gồm {id,text}. Trả [{id,supported}]: supported khi sourceId tồn tại, quote không rỗng và quote là chuỗi con chính xác của text.','Đây chỉ là kiểm bằng chứng trích nguyên văn, không xác minh toàn bộ suy luận hoặc chân lý của nguồn.'],
 ['abstain','Dừng khi bằng chứng chưa đủ','scores là số nguyên0..100; threshold cùng miền. Trả answer nếu có score>=threshold, còn lại abstain.','Ngưỡng là policy bài; score không phải xác suất đúng. Cần đo ngưỡng trên validation trước dùng thực tế.'],
 ['metrics','Tính precision và recall truy xuất','relevant và retrieved là ID. Khử trùng mỗi phía; trả {hits,precision,recall}. precision=hits/số retrieved duy nhất, recall=hits/số relevant duy nhất; mẫu số0 quy ước0.','Không đo chất lượng câu trả lời hoặc sự thật chỉ từ hai metric này.'],
 ['upsert','Cập nhật index theo phiên bản','records có {id,version,text}; giữ bản version lớn nhất mỗi id, nếu cùng version giữ bản xuất hiện sau. Trả bản ghi cuối sắp ID ASCII tăng.','Phiên bản nguyên≥1. Ví dụ mô phỏng index, không phải database production.'],
 ['mmr','Chọn đa dạng bằng MMR đồ chơi','docs có {id,relevance}, similarity[i][j] và lambda phần trăm. Lặp chọn tối đa k tài liệu: score=lambda*relevance-(100-lambda)*max_similarity_đến_đã_chọn; lần đầu max=0. Hòa ID ASCII. Trả ID theo thứ tự chọn.','relevance/similarity nguyên0..100, ma trận đối xứng; k≤số docs; không nhân chia100 vì không ảnh hưởng thứ hạng.'],
 ['neighbors','Lấy láng giềng một bước trong đồ thị nguồn','edges là cặp có hướng [a,b]; trả các b sao cho a=start, khử trùng và sắp ID ASCII.','Không tự đi tiếp nhiều cạnh; graph retrieval chỉ tìm liên kết đã có, không chứng minh quan hệ đúng.'],
 ['mrr','Đọc vị trí kết quả liên quan đầu tiên','rankings gồm {retrieved,relevant}. Mỗi retrieved là ID duy nhất. Với mỗi query: reciprocal rank=1/vị trí liên quan đầu tiên (bắt đầu1), không có bằng0. Trả trung bình, không query trả0.','Đánh giá thứ hạng theo nhãn đã cho; không dùng số lần hit thay cho reciprocal rank.'],
];
export const problemIds=defs.map(d=>'rag-'+d[0]);
const cmp=(a,b)=>a<b?-1:a>b?1:0;
const copy=x=>structuredClone(x);
export function cosine(a,b){const aa=a.reduce((s,v)=>s+v*v,0),bb=b.reduce((s,v)=>s+v*v,0);return aa&&bb?a.reduce((s,v,i)=>s+v*b[i],0)/Math.sqrt(aa*bb):null;}
export function oracle(id,d){switch(id.replace(/^rag-/,'')){
 case'lookup':return d.docs.find(x=>x.id===d.sourceId)?.answer??null;
 case'tokens':{const tokens=d.text.trim()?d.text.trim().split(/\s+/):[];return{tokens,count:tokens.length};}
 case'budget':{let used=0;const ids=[];for(const c of d.chunks)if(used+c.cost<=d.limit-d.reserved){used+=c.cost;ids.push(c.id);}return{ids,used,remaining:d.limit-d.reserved-used};}
 case'argmax':return [...d.candidates].sort((a,b)=>b.score-a.score||cmp(a.id,b.id))[0]?.id??null;
 case'attention':return d.values.reduce((s,v,i)=>s+v*d.weights[i],0)/100;
 case'route':return d.requests.map(r=>r.need==='fresh-facts'?'retrieve':r.need==='style'?'fine-tune':'clarify');
 case'filter':return d.docs.filter(x=>x.tenant===d.tenant&&x.expiresAt>d.now).map(x=>x.id);
 case'chunks':{const out=[];for(let start=0;start<d.tokens.length;start+=d.size-d.overlap){out.push({start,tokens:d.tokens.slice(start,start+d.size)});if(start+d.size>=d.tokens.length)break;}return out;}
 case'bow':return d.vocab.map(v=>d.tokens.filter(t=>t===v).length);
 case'cosine':return cosine(d.a,d.b);
 case'vector':{if(!d.query.some(v=>v!==0))return[];return d.docs.map(x=>({id:x.id,score:cosine(d.query,x.vector)})).filter(x=>x.score!==null).sort((a,b)=>b.score-a.score||cmp(a.id,b.id)).slice(0,d.k);}
 case'retrieve':{const q=new Set(d.query);return d.docs.map(x=>({id:x.id,score:[...q].filter(t=>x.tokens.includes(t)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||cmp(a.id,b.id)).slice(0,d.k);}
 case'dedup':return[...new Set(d.lists.flat())];
 case'rrf':{const scores=new Map();for(const list of d.rankings)list.forEach((id,i)=>scores.set(id,(scores.get(id)??0)+1/(d.c+i+1)));return[...scores].map(([id,score])=>({id,score})).sort((a,b)=>b.score-a.score||cmp(a.id,b.id)).slice(0,d.k);}
 case'rerank':return[...d.candidates].sort((a,b)=>d.scores[b]-d.scores[a]||cmp(a,b)).slice(0,d.k);
 case'citations':return d.claims.map(c=>({id:c.id,supported:c.quote.length>0&&!!d.sources.find(s=>s.id===c.sourceId&&s.text.includes(c.quote))}));
 case'abstain':return d.scores.some(s=>s>=d.threshold)?'answer':'abstain';
 case'metrics':{const relevant=new Set(d.relevant),retrieved=new Set(d.retrieved),hits=[...relevant].filter(x=>retrieved.has(x)).length;return{hits,precision:retrieved.size?hits/retrieved.size:0,recall:relevant.size?hits/relevant.size:0};}
 case'upsert':{const m=new Map();for(const r of d.records)if(!m.has(r.id)||r.version>=m.get(r.id).version)m.set(r.id,copy(r));return[...m.values()].sort((a,b)=>cmp(a.id,b.id));}
 case'mmr':{const selected=[];while(selected.length<Math.min(d.k,d.docs.length)){const remaining=d.docs.map((x,i)=>({...x,i,score:d.lambda*x.relevance-(100-d.lambda)*(selected.length?Math.max(...selected.map(j=>d.similarity[i][j])):0)})).filter(x=>!selected.includes(x.i)).sort((a,b)=>b.score-a.score||cmp(a.id,b.id));selected.push(remaining[0].i);}return selected.map(i=>d.docs[i].id);}
 case'neighbors':return[...new Set(d.edges.filter(e=>e[0]===d.start).map(e=>e[1]))].sort(cmp);
 case'mrr':return d.rankings.length?d.rankings.reduce((sum,r)=>{const i=r.retrieved.findIndex(x=>r.relevant.includes(x));return sum+(i<0?0:1/(i+1));},0)/d.rankings.length:0;
 default:throw Error('Unknown RAG problem '+id);
}}
function equivalent(a,b){if(typeof a==='number')return typeof b==='number'&&Number.isFinite(b)&&Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a));if(a===null||typeof a!=='object')return a===b;if(Array.isArray(a))return Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>equivalent(v,b[i]));return!!b&&typeof b==='object'&&!Array.isArray(b)&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.hasOwn(b,k)&&equivalent(a[k],b[k]));}
export function checkOutput(id,input,output){try{return equivalent(oracle(id,input),output);}catch{return false;}}
export function generateInput(id,seed){const r=random(String(seed)+':'+id),n=int(r,1,5),words=['book','return','days','open','hours'],tokens=()=>Array.from({length:int(r,0,8)},()=>words[int(r,0,4)]),ids=['A','B','C','D'],docs=()=>ids.slice(0,n).map(id=>({id,tokens:tokens()}));switch(id.replace(/^rag-/,'')){
 case'lookup':return{docs:[{id:'A',answer:'Open '+int(r,8,10)+':00'},{id:'B',answer:'Return in '+int(r,7,21)+' days'}],sourceId:['A','B','missing'][int(r,0,2)]};
 case'tokens':return{text:'  '+tokens().join(int(r,0,1)?'  ':'\t')+'\n'};
 case'budget':return{chunks:ids.map(id=>({id,cost:int(r,1,8)})),limit:15,reserved:int(r,0,8)};
 case'argmax':return{candidates:ids.slice(0,n).map(id=>({id,score:int(r,-5,5)}))};
 case'attention':{const w=int(r,0,100);return{weights:[w,100-w],values:[int(r,-8,8),int(r,-8,8)]};}
 case'route':return{requests:Array.from({length:n},()=>({need:['style','fresh-facts','unknown'][int(r,0,2)]}))};
 case'filter':return{tenant:'school',now:10,docs:ids.map(id=>({id,tenant:int(r,0,1)?'school':'private',expiresAt:int(r,8,13)}))};
 case'chunks':{const size=int(r,1,5);return{tokens:tokens(),size,overlap:int(r,0,size-1)};}
 case'bow':return{vocab:shuffle(words,r).slice(0,3),tokens:tokens()};
 case'cosine':return{a:[int(r,-3,3),int(r,-3,3)],b:[int(r,-3,3),int(r,-3,3)]};
 case'vector':return{query:[int(r,-3,3),int(r,-3,3)],docs:ids.map(id=>({id,vector:[int(r,-3,3),int(r,-3,3)]})),k:int(r,0,4)};
 case'retrieve':return{query:tokens(),docs:docs(),k:int(r,0,4)};
 case'dedup':return{lists:[shuffle(ids,r).slice(0,n),shuffle(ids,r).slice(0,n)]};
 case'rrf':return{rankings:[shuffle(ids,r),shuffle(ids,r).slice(0,n)],c:int(r,1,60),k:int(r,0,4)};
 case'rerank':return{candidates:shuffle(ids,r).slice(0,n),scores:Object.fromEntries([...ids,'Z'].map(id=>[id,int(r,0,100)])),k:int(r,0,4)};
 case'citations':{const value=String(int(r,7,21));return{sources:[{id:'A',text:'Return in '+value+' days'},{id:'B',text:'Open 9:00'}],claims:[{id:'C1',sourceId:'A',quote:value+' days'},{id:'C2',sourceId:int(r,0,1)?'A':'X',quote:'Open'},{id:'C3',sourceId:'B',quote:int(r,0,1)?'9:00':''}]};}
 case'abstain':return{scores:Array.from({length:n},()=>int(r,0,100)),threshold:int(r,0,100)};
 case'metrics':return{relevant:shuffle(ids,r).slice(0,int(r,0,4)),retrieved:Array.from({length:int(r,0,6)},()=>ids[int(r,0,3)])};
 case'upsert':return{records:Array.from({length:n+2},(_,i)=>({id:ids[int(r,0,3)],version:int(r,1,3),text:'Text-'+i}))};
 case'mmr':return{docs:ids.slice(0,3).map(id=>({id,relevance:int(r,30,90)})),similarity:[[100,80,10],[80,100,20],[10,20,100]],lambda:int(r,0,100),k:int(r,0,3)};
 case'neighbors':return{start:ids[int(r,0,3)],edges:Array.from({length:n+2},()=>[ids[int(r,0,3)],ids[int(r,0,3)]])};
 case'mrr':return{rankings:Array.from({length:n},()=>({retrieved:shuffle(ids,r).slice(0,n),relevant:shuffle(ids,r).slice(0,int(r,0,3))}))};
 default:throw Error('Unknown RAG problem '+id);
}}
export const edgeInputs={
 'rag-lookup':[{docs:[{id:'A',answer:''}],sourceId:'A'},{docs:[],sourceId:'A'}],
 'rag-tokens':[{text:''},{text:' \t\n '},{text:'a a\tb!'}],
 'rag-budget':[{chunks:[{id:'A',cost:9},{id:'B',cost:2}],limit:5,reserved:1},{chunks:[],limit:0,reserved:0}],
 'rag-argmax':[{candidates:[]},{candidates:[{id:'B',score:-1},{id:'A',score:-1}]}],
 'rag-attention':[{weights:[0,100],values:[99,-2]}],
 'rag-route':[{requests:[]},{requests:[{need:'unknown'}]}],
 'rag-filter':[{docs:[{id:'A',tenant:'x',expiresAt:10},{id:'B',tenant:'y',expiresAt:11}],tenant:'x',now:10}],
 'rag-chunks':[{tokens:[],size:2,overlap:1},{tokens:['a','b','c','d'],size:3,overlap:2},{tokens:['a','b'],size:2,overlap:1}],
 'rag-bow':[{vocab:['a','b'],tokens:['a','a','z']},{vocab:[],tokens:['a']}],
 'rag-cosine':[{a:[0,0],b:[1,0]},{a:[1,0],b:[-1,0]},{a:[1,0],b:[0,1]}],
 'rag-vector':[{query:[0,0],docs:[{id:'A',vector:[1,0]}],k:1},{query:[1,0],docs:[{id:'B',vector:[2,0]},{id:'A',vector:[1,0]},{id:'C',vector:[0,0]}],k:3}],
 'rag-retrieve':[{query:['a','a'],docs:[{id:'B',tokens:['a','a']},{id:'A',tokens:['a']}],k:3},{query:[],docs:[{id:'A',tokens:['a']}],k:2}],
 'rag-dedup':[{lists:[['B','A'],['A','C']]},{lists:[]}],
 'rag-rrf':[{rankings:[['A','B'],['B','A']],c:1,k:2},{rankings:[],c:1,k:3}],
 'rag-rerank':[{candidates:['B','A'],scores:{A:1,B:1,Z:100},k:3},{candidates:[],scores:{},k:0}],
 'rag-citations':[{sources:[{id:'A',text:'Book open'}],claims:[{id:'C',sourceId:'A',quote:''},{id:'D',sourceId:'X',quote:'Book'},{id:'E',sourceId:'A',quote:'book'}]}],
 'rag-abstain':[{scores:[],threshold:0},{scores:[50],threshold:50}],
 'rag-metrics':[{relevant:[],retrieved:[]},{relevant:['A','B'],retrieved:['A','A','X']}],
 'rag-upsert':[{records:[{id:'A',version:2,text:'new'},{id:'A',version:1,text:'old'},{id:'A',version:2,text:'last'}]},{records:[]}],
 'rag-mmr':[{docs:[{id:'B',relevance:5},{id:'A',relevance:5}],similarity:[[100,100],[100,100]],lambda:100,k:2}],
 'rag-neighbors':[{start:'A',edges:[['A','B'],['A','B'],['B','C']]},{start:'A',edges:[]}],
 'rag-mrr':[{rankings:[]},{rankings:[{retrieved:['A','B'],relevant:['B']},{retrieved:['A'],relevant:['C']}]}],
};
export function testsFor(id,seed,opts={}){const publicOnly=typeof opts==='boolean'?opts:!!opts.publicOnly,tests=[0,1].map(i=>({name:'Ví dụ '+(i+1),group:'sample',input:generateInput(id,'sample-'+i)}));if(!publicOnly){for(const[inputIndex,input]of(edgeInputs[id]??[]).entries())tests.push({name:'Biên '+(inputIndex+1),group:'edge',input:copy(input)});for(let i=0;i<10;i++)tests.push({name:'Biến thể '+(i+1),group:'random',input:generateInput(id,seed+':'+i)});}return tests.map(t=>({...t,expected:oracle(id,t.input)}));}
export const problems=Object.fromEntries(defs.map(([key,title,statement,constraints])=>{const id='rag-'+key,sampleInput=edgeInputs[id]?.[0]??generateInput(id,0);return[id,{id,courseId:'rag',title,statement,description:statement,constraints,skill:key,version:VERSION,runtime:'pyodide',packages:[],languages:['python'],sampleInput,sampleOutput:oracle(id,sampleInput),hints:['Chuyển từng điều kiện trong hợp đồng thành một bước kiểm tra.','Vẽ bảng ID, dữ liệu và kết quả trung gian; chú ý thứ tự và dấu bằng.','Đối chiếu một ca rỗng, một ca hòa và một ca không có bằng chứng.'],starters:{python:'def solve(data):\n    # Nhận dữ liệu có sẵn; return kết quả theo hợp đồng.\n    raise NotImplementedError("Viết lời giải của bạn")\n'}}];}));
// Intro uses a successful tiny lookup, not an empty edge example.
problems['rag-lookup'].sampleInput={docs:[{id:'A',answer:'Open 9:00'},{id:'B',answer:'Return in 14 days'}],sourceId:'B'};
problems['rag-lookup'].sampleOutput='Return in 14 days';
problems['rag-chunks'].sampleInput={tokens:['return','book','in','14','days'],size:3,overlap:1};
problems['rag-chunks'].sampleOutput=oracle('rag-chunks',problems['rag-chunks'].sampleInput);
export function problemDetails(id){const p=problems[id];return p?{...p,language:'python',starter:p.starters.python,contract:p.constraints,examples:testsFor(id,0,true).map(t=>({input:t.input,output:t.expected}))}:null;}
export function traceQuestion(id,seed){const input=generateInput(id,seed),answer=oracle(id,input);return{prompt:problems[id].statement,input,answer,wrongAnswers:[null,[],0,false].filter(x=>!checkOutput(id,input,x)),explanation:'Áp dụng đúng quy tắc '+problems[id].title+'; đầu ra: '+JSON.stringify(answer)};}
