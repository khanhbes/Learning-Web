import {random,int,shuffle} from '../../shared/random.mjs';
export const VERSION='agent-2026.10.15-v1';
const defs=[
 ['observe','Đọc cảm biến có tên','Cho observations và fields. Trả object chỉ có đúng các fields; giá trị là quan sát mới nhất cùng field, hoặc null nếu chưa thấy. Giữ số 0 và false.','observations tối đa 100; fields duy nhất; field là chuỗi; value là số nguyên, boolean hoặc null.','perception'],
 ['reflex','Robot phản xạ theo ưu tiên','Với mỗi percept: nếu battery < reserve trả charge; nếu không và dirty=true trả clean; còn lại trả move. Trả mảng hành động giữ thứ tự.','0≤battery,reserve≤100; dirty boolean; pin bằng reserve không cần charge.','reflex'],
 ['state','Nhớ khu vực chưa nhìn thấy','Sao chép memory; đọc observations theo thứ tự. Giá trị dirty khác null ghi đè cells cùng tên; null nghĩa không nhìn thấy nên giữ giá trị cũ, chưa có thì giữ vắng. Trả object memory cuối.','memory và observations dùng cell A/B/C/D; dirty boolean hoặc null.','model-state'],
 ['goal-path','Tìm đường đạt mục tiêu','Đồ thị có hướng graph; tìm đường ít cạnh nhất từ start tới goal, gồm cả start/goal. Không có đường trả null. Bất kỳ đường ngắn nhất hợp lệ đều được nhận.','1–10 node, tên ASCII; trọng số mọi cạnh bằng nhau; start/goal có trong graph.','planning'],
 ['utility','Chọn hành động theo utility','Mỗi action có id,quality,time,risk. Tính score=weights.quality*quality-weights.time*time-weights.risk*risk. Trả {id,score} cao nhất; hòa chọn id ASCII nhỏ nhất; actions rỗng trả null.','Giá trị và trọng số nguyên 0–100; id duy nhất. Đây là hàm utility do bài quy định, không khẳng định tối ưu ngoài mô hình.','utility'],
 ['feedback','Học từ phần thưởng quan sát','actions là tên lựa chọn; feedback là {action,reward}. Trả {means,best}; mean mỗi action dùng feedback của action đó; chưa thử mean=null. best chọn action đã thử có mean cao nhất, hòa ASCII; chưa thử tất cả best=null.','actions duy nhất ASCII; reward nguyên -100..100; feedback có action hợp lệ.','learning'],
 ['assign','Phân việc theo kỹ năng và tải','Xử lý tasks theo thứ tự. Với mỗi skill chọn worker có skill đó và load hiện tại nhỏ nhất, hòa id ASCII. Tăng load worker được chọn 1. Trả {assignments:[{task,worker}],loads}; không có worker dùng worker=null.','worker/task id duy nhất; load nguyên≥0; kỹ năng là chuỗi ASCII.','multi-agent'],
 ['hierarchy','Tổng hợp trạng thái phân cấp','Cho tree có node {id,children}; statuses chỉ cho lá: done/failed/pending. Tính mỗi node: lá theo statuses; nội bộ failed nếu có con failed, done nếu mọi con done, còn lại pending. Trả object id→status.','tree liên thông không chu trình, children ID hợp lệ; mỗi node chỉ một cha.','hierarchy'],
 ['route','Điều phối yêu cầu tới công cụ','Cho requests {id,kind}, tools object kind→tool. Trả [{id,tool}] theo thứ tự yêu cầu; kind chưa được đăng ký tool=null.','request id duy nhất; tools chỉ tên công cụ giả lập. Không gọi API hoặc hệ thống.','routing'],
 ['schema','Kiểm tra payload công cụ','schemas map tên tool tới các tên arg bắt buộc. Trả boolean cho mỗi call: call là object đúng hai keys tool,args; tool được đăng ký; args object đúng keys schema; mọi arg là số hữu hạn, không boolean.','call có thể sai shape, null, thiếu/thừa keys hoặc string/bool. Tên schema ASCII, keys duy nhất.','validation'],
 ['policy','Kiểm soát quyền công cụ ngoài agent','tools gồm {id,scope,risky}. Với calls {id,tool}, trả [{id,decision}]. Thứ tự ưu tiên: tool không tồn tại→deny; scope không trong allowedScopes→deny; risky và call.id không trong approved→approval; còn lại→allow.','approved là các ID cuộc gọi được xác nhận từ ngoài mô hình. Đây chỉ là mô phỏng quyền, không thực thi công cụ.','tool-policy'],
 ['retrieval','Tìm tài liệu bằng từ khóa','query và docs.tokens là mảng từ ASCII. Điểm bằng số token query duy nhất cũng có trong docs.tokens. Trả top k {id,score}, score giảm dần/hòa id ASCII; chỉ giữ score>0; k=0 trả[].','docs.id duy nhất; không coi token lặp là nhiều bằng chứng; không sinh câu trả lời.','retrieval'],
 ['context','Giữ context trong ngân sách','Cho messages {id,cost}, limit,reserved. Duyệt từ cuối; giữ hậu tố liên tiếp dài nhất có tổng cost≤limit-reserved, dừng ngay khi tin tiếp theo không vừa. Trả ID theo thứ tự gốc.','cost nguyên≥1; 0≤reserved≤limit; chi phí được cung cấp, không giả là tokenizer thật.','memory-budget'],
 ['loop','Dừng vòng agent có giới hạn','outcomes là kết quả giả lập continue/success/error. Đọc tối đa maxSteps mục. Dừng đầu tiên success→done hoặc error→error. Hết outcomes trước giới hạn→exhausted; đã dùng đủ maxSteps mà chưa dừng→limit. Trả {steps,status}.','maxSteps nguyên1..30; một mục tương ứng một hành động giả lập. Không suy luận/chain-of-thought ẩn.','bounded-loop'],
 ['evaluate','Đánh giá quyết định đúng và sai','expected/actual cùng độ dài boolean; true nghĩa nên cho phép/đã cho phép. Trả {tp,fp,fn,tn,precision,recall}; mẫu số 0 cho metric=0.','0–100 trường hợp; fp biểu thị cho phép sai trong bộ fixture. Đây không chứng minh an toàn mọi tình huống.','evaluation'],
 ['expected-utility','Utility khi kết quả không chắc','Mỗi action có outcomes {probability,utility}; xác suất phần trăm cộng đúng100. Tính mean utility=Σ probability*utility/100. Trả {id,score} cao nhất; hòa chọn id ASCII.','1–8 action; utility nguyên -100..100. Xác suất đầu vào, không ước đoán từ LLM.','expected-utility'],
 ['votes','Kết hợp phiếu agent có điều kiện','votes là A/B/abstain. Nếu có một nhãn nhận hơn một nửa toàn bộ số agent trả nhãn; nếu không trả null. Phiếu abstain vẫn nằm trong mẫu số.','0–100 phiếu; kết quả đa số không bảo đảm sự thật.','consensus'],
 ['ttl','Giữ bộ nhớ còn hiệu lực','Cho memories {id,expiresAt,value}, now. Trả các bản ghi có expiresAt>now giữ thứ tự gốc. expiresAt bằng now đã hết hạn.','thời gian nguyên≥0; value JSON nhỏ. TTL không xác minh đúng/sai của ký ức.','memory-expiry'],
 ['dependencies','Lập kế hoạch có tiên quyết','tasks là ID duy nhất; edges [a,b] yêu cầu a trước b. Lặp chọn ID sẵn sàng nhỏ nhất ASCII. Trả thứ tự tất cả task hoặc null nếu có chu trình.','0–10 task; edge hợp lệ duy nhất; cho phép tự chu trình.','workflow-plan'],
 ['retry','Thử lại lỗi tạm thời có giới hạn','Đọc outcomes success/transient/permanent tối đa maxAttempts. success dừng done, permanent dừng failed; transient tiếp tục. Hết dữ liệu trước giới hạn exhausted, đủ giới hạn limit. Trả {attempts,status}.','maxAttempts1..10; dữ liệu là fixture giả lập, không gọi mạng.','retry'],
 ['coverage','Đo độ bao phủ truy xuất','Cho expected/retrieved ID. Trả {hits,total,recall}; khử trùng cả hai; hits là giao, total là số expected duy nhất; expected rỗng recall=0.','0–100ID ASCII. Recall không đo tính chính xác nội dung.','retrieval-evaluation'],
 ['handoff','Chuyển người khi vượt giới hạn','Mỗi request có id,risk,confidence,steps. Trả [{id,decision}] với decision=human nếu risk>=riskLimit hoặc confidence<minConfidence hoặc steps>=maxSteps, còn lại agent.','risk/confidence và threshold nguyên0..100; maxSteps≥1; chỉ điều phối giả lập.','human-handoff'],
];
export const problemIds=defs.map(x=>'agent-'+x[0]);
const copy=x=>structuredClone(x);
const cmp=(a,b)=>a<b?-1:a>b?1:0;
function shortest(d){const queue=[[d.start]],seen=new Set([d.start]);for(let i=0;i<queue.length;i++){const path=queue[i],v=path.at(-1);if(v===d.goal)return path;for(const w of [...d.graph[v]].sort(cmp))if(!seen.has(w)){seen.add(w);queue.push([...path,w]);}}return null;}
const schemaValid=(d,c)=>!!c&&typeof c==='object'&&!Array.isArray(c)&&Object.keys(c).length===2&&Object.hasOwn(c,'tool')&&Object.hasOwn(c,'args')&&typeof c.tool==='string'&&Object.hasOwn(d.schemas,c.tool)&&!!c.args&&typeof c.args==='object'&&!Array.isArray(c.args)&&Object.keys(c.args).length===d.schemas[c.tool].length&&d.schemas[c.tool].every(k=>Object.hasOwn(c.args,k)&&typeof c.args[k]==='number'&&Number.isFinite(c.args[k]));
export function oracle(id,d){switch(id.replace(/^agent-/,'')){
 case'observe':return Object.fromEntries(d.fields.map(field=>[field,[...d.observations].reverse().find(r=>r.field===field)?.value??null]));
 case'reflex':return d.percepts.map(p=>p.battery<d.reserve?'charge':p.dirty?'clean':'move');
 case'state':{const m=copy(d.memory);for(const o of d.observations)if(o.dirty!==null)m[o.cell]=o.dirty;return m;}
 case'goal-path':return shortest(d);
 case'utility':{const scores=d.actions.map(a=>({id:a.id,score:d.weights.quality*a.quality-d.weights.time*a.time-d.weights.risk*a.risk}));return scores.sort((a,b)=>b.score-a.score||cmp(a.id,b.id))[0]??null;}
 case'feedback':{const means=Object.fromEntries(d.actions.map(a=>{const f=d.feedback.filter(f=>f.action===a);return[a,f.length?f.reduce((s,r)=>s+r.reward,0)/f.length:null];}));const a=d.actions.filter(a=>means[a]!==null).sort((a,b)=>means[b]-means[a]||cmp(a,b));return{means,best:a[0]??null};}
 case'assign':{const loads=Object.fromEntries(d.workers.map(w=>[w.id,w.load])),assignments=[];for(const t of d.tasks){const workers=d.workers.filter(w=>w.skills.includes(t.skill)).sort((a,b)=>loads[a.id]-loads[b.id]||cmp(a.id,b.id)),worker=workers[0]?.id??null;assignments.push({task:t.id,worker});if(worker!==null)loads[worker]++;}return{assignments,loads};}
 case'hierarchy':{const states={},visit=id=>{const n=d.tree.find(n=>n.id===id);if(!n.children.length)return states[id]=d.statuses[id];const child=n.children.map(visit);return states[id]=child.includes('failed')?'failed':child.every(s=>s==='done')?'done':'pending';};visit(d.root);return states;}
 case'route':return d.requests.map(r=>({id:r.id,tool:Object.hasOwn(d.tools,r.kind)?d.tools[r.kind]:null}));
 case'schema':return d.calls.map(c=>schemaValid(d,c));
 case'policy':return d.calls.map(c=>{const tool=d.tools.find(t=>t.id===c.tool);return{id:c.id,decision:!tool||!d.allowedScopes.includes(tool.scope)?'deny':tool.risky&&!d.approved.includes(c.id)?'approval':'allow'};});
 case'retrieval':{const tokens=new Set(d.query);return d.docs.map(doc=>({id:doc.id,score:[...tokens].filter(t=>doc.tokens.includes(t)).length})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||cmp(a.id,b.id)).slice(0,d.k);}
 case'context':{let cost=0,i=d.messages.length;while(i>0&&cost+d.messages[i-1].cost<=d.limit-d.reserved){cost+=d.messages[--i].cost;}return d.messages.slice(i).map(m=>m.id);}
 case'loop':{let steps=0;for(const outcome of d.outcomes.slice(0,d.maxSteps)){steps++;if(outcome==='success')return{steps,status:'done'};if(outcome==='error')return{steps,status:'error'};}return{steps,status:steps===d.maxSteps?'limit':'exhausted'};}
 case'evaluate':{let tp=0,fp=0,fn=0,tn=0;d.expected.forEach((e,i)=>{if(e&&d.actual[i])tp++;else if(!e&&d.actual[i])fp++;else if(e)fn++;else tn++;});return{tp,fp,fn,tn,precision:tp+fp?tp/(tp+fp):0,recall:tp+fn?tp/(tp+fn):0};}
 case'expected-utility':return d.actions.map(a=>({id:a.id,score:a.outcomes.reduce((s,o)=>s+o.probability*o.utility,0)/100})).sort((a,b)=>b.score-a.score||cmp(a.id,b.id))[0];
 case'votes':{const a=d.votes.filter(x=>x==='A').length,b=d.votes.filter(x=>x==='B').length;return a>d.votes.length/2?'A':b>d.votes.length/2?'B':null;}
 case'ttl':return d.memories.filter(m=>m.expiresAt>d.now).map(copy);
 case'dependencies':{const remaining=new Set(d.tasks),out=[];while(remaining.size){const next=[...remaining].filter(t=>!d.edges.some(([a,b])=>b===t&&remaining.has(a))).sort(cmp)[0];if(next===undefined)return null;remaining.delete(next);out.push(next);}return out;}
 case'retry':{let attempts=0;for(const outcome of d.outcomes.slice(0,d.maxAttempts)){attempts++;if(outcome==='success')return{attempts,status:'done'};if(outcome==='permanent')return{attempts,status:'failed'};}return{attempts,status:attempts===d.maxAttempts?'limit':'exhausted'};}
 case'coverage':{const expected=new Set(d.expected),retrieved=new Set(d.retrieved),hits=[...expected].filter(x=>retrieved.has(x)).length;return{hits,total:expected.size,recall:expected.size?hits/expected.size:0};}
 case'handoff':return d.requests.map(r=>({id:r.id,decision:r.risk>=d.riskLimit||r.confidence<d.minConfidence||r.steps>=d.maxSteps?'human':'agent'}));
 default:throw new Error('Unknown Agent problem: '+id);
}}
function equivalent(a,b){if(typeof a==='number'||typeof b==='number')return typeof a==='number'&&typeof b==='number'&&Number.isFinite(a)&&Number.isFinite(b)&&(Number.isInteger(b)?a===b:Math.abs(a-b)<=1e-8+1e-7*Math.abs(b));if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>equivalent(v,b[i]));if(a&&b&&typeof a==='object'&&typeof b==='object')return Object.keys(a).length===Object.keys(b).length&&Object.keys(b).every(k=>Object.hasOwn(a,k)&&equivalent(a[k],b[k]));return a===b;}
export function checkOutput(id,d,output){if(!problemIds.includes(id))return false;const expected=oracle(id,d);if(id==='agent-goal-path'&&expected!==null)return Array.isArray(output)&&output.length===expected.length&&output.every(v=>typeof v==='string')&&output[0]===d.start&&output.at(-1)===d.goal&&output.every((v,i)=>i===0||d.graph[output[i-1]]?.includes(v));return equivalent(output,expected);}
export function generateInput(id,seed=0){const rng=random(String(seed)+':'+id),n=int(rng,2,7),keys=['A','B','C','D'],pick=a=>a[int(rng,0,a.length-1)],bit=()=>!!int(rng,0,1),arr=(f,length=n)=>Array.from({length},(_,i)=>f(i));switch(id.replace(/^agent-/,'')){
 case'observe':return{fields:['battery','dirty','temperature'],observations:arr(()=>({field:pick(['battery','dirty','other']),value:pick([0,false,true,null,int(rng,1,100)])}))};
 case'reflex':{const reserve=int(rng,15,35);return{reserve,percepts:[{battery:reserve,dirty:true},...arr(()=>({battery:int(rng,0,100),dirty:bit()}))]};}
 case'state':return{memory:{A:bit(),B:bit()},observations:arr(()=>({cell:pick(keys),dirty:pick([null,true,false])}))};
 case'goal-path':{const names=arr(i=>'N'+i),graph=Object.fromEntries(names.map((v,i)=>[v,names.filter((w,j)=>j!==i&&rng()<0.22)]));return{graph,start:names[0],goal:names.at(-1)};}
 case'utility':return{weights:{quality:int(rng,1,5),time:int(rng,0,4),risk:int(rng,0,5)},actions:arr(i=>({id:'A'+i,quality:int(rng,0,20),time:int(rng,0,15),risk:int(rng,0,10)}))};
 case'feedback':return{actions:keys,feedback:arr(()=>({action:pick(keys),reward:int(rng,-10,20)}),n+3)};
 case'assign':return{workers:[{id:'W0',skills:['search','math'],load:int(rng,0,2)},{id:'W1',skills:['search'],load:int(rng,0,2)},{id:'W2',skills:['review'],load:int(rng,0,2)}],tasks:arr(i=>({id:'T'+i,skill:pick(['search','math','review','unavailable'])}))};
 case'hierarchy':return{root:'root',tree:[{id:'root',children:['plan','review']},{id:'plan',children:['search','compute']},{id:'review',children:[]},{id:'search',children:[]},{id:'compute',children:[]}],statuses:{search:pick(['done','pending','failed']),compute:pick(['done','pending','failed']),review:pick(['done','pending','failed'])}};
 case'route':return{tools:{search:'lookup',math:'calculator',review:'checker'},requests:arr(i=>({id:'R'+i,kind:pick(['search','math','review','send'])}))};
 case'schema':return{schemas:{add:['a','b'],square:['x']},calls:[{tool:'add',args:{a:int(rng,-9,9),b:int(rng,-9,9)}},{tool:'square',args:{x:int(rng,-9,9)}},{tool:'add',args:{a:1}},{tool:'add',args:{a:true,b:2}},{tool:'square',args:{x:3,extra:0}},{tool:'unknown',args:{x:1}},null,{tool:'add',args:{a:1,b:2},pass:true}]};
 case'policy':{const calls=arr(i=>({id:'C'+i,tool:pick(['lookup','draft','publish','erase','unknown'])}));return{tools:[{id:'lookup',scope:'read',risky:false},{id:'draft',scope:'write',risky:false},{id:'publish',scope:'write',risky:true},{id:'erase',scope:'delete',risky:true}],calls,allowedScopes:bit()?['read','write']:['read'],approved:calls.filter(()=>rng()<0.4).map(c=>c.id)};}
 case'retrieval':return{query:arr(()=>pick(['agent','memory','tool','policy','agent']),3),docs:arr(i=>({id:'D'+i,tokens:arr(()=>pick(['agent','memory','tool','policy','other']),4)})),k:int(rng,0,n)};
 case'context':return{messages:arr(i=>({id:'M'+i,cost:int(rng,1,8)})),limit:int(rng,8,24),reserved:4};
 case'loop':return{outcomes:arr(()=>pick(['continue','continue','success','error'])),maxSteps:int(rng,1,8)};
 case'evaluate':return{expected:arr(bit),actual:arr(bit)};
 case'expected-utility':return{actions:arr(i=>{const p=int(rng,0,100);return{id:'A'+i,outcomes:[{probability:p,utility:int(rng,-10,20)},{probability:100-p,utility:int(rng,-10,20)}]};})};
 case'votes':return{votes:arr(()=>pick(['A','B','abstain']))};
 case'ttl':{const now=int(rng,10,30);return{now,memories:arr(i=>({id:'M'+i,expiresAt:i===0?now:int(rng,0,45),value:'fact-'+i}))};}
 case'dependencies':{const tasks=shuffle(arr(i=>'T'+i),rng),edges=[];for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)if(rng()<0.25)edges.push(['T'+a,'T'+b]);if(rng()<0.25)edges.push(['T0','T0']);return{tasks,edges};}
 case'retry':return{outcomes:arr(()=>pick(['transient','transient','success','permanent'])),maxAttempts:int(rng,1,5)};
 case'coverage':return{expected:arr(()=>pick(keys)),retrieved:arr(()=>pick([...keys,'X']))};
 case'handoff':return{riskLimit:60,minConfidence:70,maxSteps:5,requests:arr(i=>({id:'R'+i,risk:int(rng,0,100),confidence:int(rng,0,100),steps:int(rng,0,7)}))};
 default:throw new Error('Unknown Agent problem: '+id);
}}
export const edgeInputs={
 'agent-observe':[{fields:['x'],observations:[]},{fields:['x'],observations:[{field:'x',value:false},{field:'x',value:0}]}],
 'agent-reflex':[{reserve:20,percepts:[]},{reserve:20,percepts:[{battery:20,dirty:true},{battery:19,dirty:true},{battery:20,dirty:false}]}],
 'agent-state':[{memory:{},observations:[{cell:'A',dirty:null}]},{memory:{A:true},observations:[{cell:'A',dirty:false},{cell:'A',dirty:null}]}],
 'agent-goal-path':[{graph:{A:[]},start:'A',goal:'A'},{graph:{A:[],B:[]},start:'A',goal:'B'},{graph:{A:['B','C'],B:['D'],C:['D'],D:[]},start:'A',goal:'D'}],
 'agent-utility':[{weights:{quality:1,time:1,risk:1},actions:[]},{weights:{quality:1,time:1,risk:1},actions:[{id:'B',quality:2,time:1,risk:0},{id:'A',quality:2,time:1,risk:0}]}],
 'agent-feedback':[{actions:['A','B'],feedback:[]},{actions:['A','B'],feedback:[{action:'B',reward:-1},{action:'A',reward:-1}]}],
 'agent-assign':[{workers:[],tasks:[{id:'T0',skill:'search'}]},{workers:[{id:'A',skills:['x'],load:0},{id:'B',skills:['x'],load:0}],tasks:[{id:'T0',skill:'x'},{id:'T1',skill:'x'}]}],
 'agent-hierarchy':[{root:'A',tree:[{id:'A',children:[]}],statuses:{A:'pending'}}],
 'agent-route':[{tools:{},requests:[]},{tools:{math:'calculate'},requests:[{id:'R',kind:'missing'}]}],
 'agent-schema':[{schemas:{f:[]},calls:[{tool:'f',args:{}},{tool:'f',args:[]},[],false,{tool:'f',args:{x:0}}]}],
 'agent-policy':[{tools:[{id:'t',scope:'delete',risky:true}],allowedScopes:['read'],approved:['C'],calls:[{id:'C',tool:'t'}]}],
 'agent-retrieval':[{query:['x','x'],docs:[{id:'B',tokens:['x','x']},{id:'A',tokens:['x']}],k:2},{query:[],docs:[{id:'A',tokens:['x']}],k:1}],
 'agent-context':[{messages:[],limit:0,reserved:0},{messages:[{id:'A',cost:2},{id:'B',cost:9}],limit:8,reserved:0}],
 'agent-loop':[{outcomes:[],maxSteps:1},{outcomes:['continue','success'],maxSteps:1},{outcomes:['success'],maxSteps:1}],
 'agent-evaluate':[{expected:[],actual:[]},{expected:[false,false],actual:[true,false]}],
 'agent-expected-utility':[{actions:[{id:'A',outcomes:[{probability:0,utility:100},{probability:100,utility:-1}]}]}],
 'agent-votes':[{votes:[]},{votes:['A','A','abstain','abstain']}],
 'agent-ttl':[{now:10,memories:[{id:'A',value:0,expiresAt:10},{id:'B',value:false,expiresAt:11}]}],
 'agent-dependencies':[{tasks:[],edges:[]},{tasks:['A','B'],edges:[['A','B'],['B','A']]}],
 'agent-retry':[{outcomes:['transient','success'],maxAttempts:1},{outcomes:['permanent','success'],maxAttempts:2},{outcomes:[],maxAttempts:1}],
 'agent-coverage':[{expected:[],retrieved:['A']},{expected:['A','A','B'],retrieved:['A','A']}],
 'agent-handoff':[{riskLimit:60,minConfidence:70,maxSteps:5,requests:[{id:'A',risk:60,confidence:70,steps:0},{id:'B',risk:0,confidence:70,steps:4},{id:'C',risk:0,confidence:69,steps:0}]}],
};
export function testsFor(id,seed,opts={}){const publicOnly=typeof opts==='boolean'?opts:!!opts.publicOnly;const tests=[0,1].map(i=>({name:'Ví dụ '+(i+1),group:'sample',input:generateInput(id,'sample-'+i)}));if(!publicOnly){for(const[inputIndex,input]of(edgeInputs[id]??[]).entries())tests.push({name:'Biên '+(inputIndex+1),group:'edge',input:copy(input)});for(let i=0;i<8;i++)tests.push({name:'Biến thể '+(i+1),group:'random',input:generateInput(id,String(seed)+':'+i)});}return tests.map(t=>({...t,expected:oracle(id,t.input)}));}
export const problems=Object.fromEntries(defs.map(([key,title,statement,constraints,skill])=>{const id='agent-'+key,sampleInput=generateInput(id,0);return[id,{id,courseId:'agent',title,statement,description:statement,constraints,skill,version:VERSION,runtime:'ml-python',packages:[],languages:['python'],sampleInput,sampleOutput:oracle(id,sampleInput),hints:['Viết đúng miền dữ liệu, thứ tự ưu tiên và điều kiện biên trước khi code.','Theo dõi trạng thái bằng list/dict/set; mỗi bước có đầu vào và đầu ra rõ.','Chạy ví dụ và trường hợp rỗng/hòa/ngưỡng đúng bằng; return JSON-compatible, không gọi mạng.'],starters:{python:'def solve(data):\n    # Xử lý fixture giả lập. Không gọi API, shell hoặc mạng.\n    raise NotImplementedError("Viết lời giải của bạn")\n'}}];}));
export function problemDetails(id){const p=problems[id];return p?{...p,language:'python',starter:p.starters.python,contract:p.constraints,examples:testsFor(id,0,true).map(t=>({input:t.input,output:t.expected}))}:null;}
export function traceQuestion(id,seed){const input=generateInput(id,seed),answer=oracle(id,input);return{prompt:'Với fixture dưới đây, solve trả JSON gì? '+problems[id].statement,input,answer,wrongAnswers:answer===null?[[],{},false]:[null,{pass:true},'done'],explanation:'Áp dụng đúng hợp đồng '+problems[id].title+': '+JSON.stringify(answer)+'. Đây là kết quả mô phỏng có thể tái hiện, không phải câu trả lời LLM.'};}
