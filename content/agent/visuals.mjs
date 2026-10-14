import {oracle,problems} from './problems.mjs';
export const AGENT_SIM_NOTICE='Mô phỏng xác định trên dữ liệu giả lập. Không gọi LLM, API, shell hoặc công cụ thật; các ô là trạng thái có thể kiểm chứng, không phải suy nghĩ ẩn của mô hình.';
const copy=x=>structuredClone(x);
const standardNodes=[['observe','Quan sát'],['memory','Bộ nhớ'],['plan','Kế hoạch'],['policy','Kiểm tra quyền'],['tool','Hành động'],['evaluate','Đánh giá'],['finish','Kết thúc']];
const standardEdges=[['observe','memory'],['memory','plan'],['plan','policy'],['policy','tool'],['tool','observe'],['tool','evaluate'],['evaluate','finish']];
const modeFor={observe:'perception',reflex:'reflex',state:'memory','goal-path':'planning',utility:'utility',feedback:'learning',assign:'multi-agent',hierarchy:'hierarchy',route:'tools',schema:'tools',policy:'tools',retrieval:'retrieval',context:'memory',loop:'tools',evaluate:'evaluation','expected-utility':'utility',votes:'multi-agent',ttl:'memory',dependencies:'planning',retry:'tools',coverage:'evaluation',handoff:'tools'};
export const visualizationMode=id=>modeFor[id.replace(/^agent-/,'')];
export function traceFor(id,input){
 const key=id.replace(/^agent-/,''),frames=[],result=oracle(id,input),mode=visualizationMode(id);
 const frame=(label,activeNode,entries=[],extra={})=>frames.push({label,activeNode,nodes:standardNodes.map(([id,label])=>({id,label,status:id===activeNode?'active':'idle'})),edges:standardEdges,entries:entries.map(([label,value])=>({label,value:copy(value)})),...copy(extra)});
 frame('Nhận fixture giả lập','observe',[['Đầu vào',input]],{mode});
 if(key==='reflex')input.percepts.forEach((p,i)=>frame('Quan sát '+(i+1)+' → '+result[i],'policy',[['Pin',p.battery],['Ngưỡng dự trữ',input.reserve],['Có bụi?',p.dirty],['Quyết định',result[i]]],{world:{battery:p.battery,dirty:p.dirty,action:result[i]},decisions:result.slice(0,i+1)}));
 else if(key==='observe'){const memory={};input.observations.forEach((o,i)=>{memory[o.field]=o.value;frame('Đọc cảm biến '+(i+1),'observe',[['Cảm biến',o.field],['Giá trị',o.value]],{memory:copy(memory)});});}
 else if(key==='state'){const memory=copy(input.memory);input.observations.forEach((o,i)=>{if(o.dirty!==null)memory[o.cell]=o.dirty;frame('Cập nhật '+o.cell+' ('+(o.dirty===null?'chưa thấy':'đã thấy')+')','memory',[['Ô',o.cell],['Quan sát',o.dirty]],{memory:copy(memory)});});}
 else if(key==='goal-path'){const queue=[[input.start]],visited=new Set([input.start]);for(let i=0;i<queue.length;i++){const path=queue[i],node=path.at(-1);frame('Khám phá '+node,'plan',[['Đường đang xét',path],['Frontier',queue.slice(i+1).map(p=>p.at(-1))]],{graph:input.graph,visited:[...visited],path});if(node===input.goal)break;for(const next of [...input.graph[node]].sort())if(!visited.has(next)){visited.add(next);queue.push([...path,next]);}}}
 else if(key==='utility'||key==='expected-utility'){const scores=[];for(const a of input.actions){const score=key==='utility'?input.weights.quality*a.quality-input.weights.time*a.time-input.weights.risk*a.risk:a.outcomes.reduce((s,o)=>s+o.probability*o.utility,0)/100;scores.push({id:a.id,score});frame('Đánh giá '+a.id,'evaluate',[['Giá trị',score],['Điểm từng lựa chọn',scores]],{scores:copy(scores),weights:input.weights??null});}}
 else if(key==='feedback'){const feedback=[];for(const r of input.feedback){feedback.push(r);const snapshot=oracle(id,{...input,feedback});frame('Nhận feedback '+r.action,'memory',[['Phần thưởng',r.reward],['Trung bình',snapshot.means],['Tạm tốt nhất',snapshot.best]],{memory:snapshot.means,feedback:copy(feedback)});}}
 else if(key==='assign'){for(let i=1;i<=input.tasks.length;i++){const snapshot=oracle(id,{...input,tasks:input.tasks.slice(0,i)});frame('Phân việc '+input.tasks[i-1].id,'plan',[['Kỹ năng',input.tasks[i-1].skill],['Phân công',snapshot.assignments.at(-1)],['Tải mới',snapshot.loads]],{workers:input.workers.map(w=>({...w,load:snapshot.loads[w.id]})),assignments:snapshot.assignments});}}
 else if(key==='hierarchy'){const states={};const visit=node=>{const n=input.tree.find(n=>n.id===node);n.children.forEach(visit);states[node]=result[node];frame('Tổng hợp '+node,'evaluate',[['Trạng thái',result[node]],['Các con',n.children]],{hierarchy:input.tree,states:copy(states)});};visit(input.root);}
 else if(key==='policy'||key==='route'||key==='schema'||key==='handoff'){const requests=input.calls??input.requests;requests.forEach((r,i)=>frame('Kiểm tra yêu cầu '+(i+1),'policy',[['Yêu cầu',r],['Quyết định',result[i]]],{decisions:result.slice(0,i+1),tools:input.tools??input.schemas??null}));}
 else if(key==='retrieval'){const docs=[];for(const d of input.docs){const score=[...new Set(input.query)].filter(t=>d.tokens.includes(t)).length;docs.push({...d,score});frame('Đối chiếu tài liệu '+d.id,'memory',[['Token truy vấn',input.query],['Token khớp',score]],{docs:copy(docs),query:input.query,k:input.k});}}
 else if(key==='context'){let cost=0;const messages=[];for(let i=input.messages.length-1;i>=0;i--){const m=input.messages[i],fits=cost+m.cost<=input.limit-input.reserved;frame('Xét '+m.id+' từ mới nhất','memory',[['Chi phí',m.cost],['Đã dùng',cost],['Ngân sách khả dụng',input.limit-input.reserved],['Vừa?',fits]],{messages:copy(messages),budget:input.limit-input.reserved,used:cost});if(!fits)break;cost+=m.cost;messages.unshift(m);}}
 else if(key==='loop'||key==='retry'){const count=result.steps??result.attempts;for(let i=0;i<count;i++)frame('Thực thi giả lập '+(i+1),'tool',[['Kết quả hành động',input.outcomes[i]],['Đã dùng',i+1],['Giới hạn',input.maxSteps??input.maxAttempts]],{outcomes:input.outcomes.slice(0,i+1),limit:input.maxSteps??input.maxAttempts});}
 else if(key==='evaluate'){for(let i=1;i<=input.expected.length;i++){const matrix=oracle(id,{expected:input.expected.slice(0,i),actual:input.actual.slice(0,i)});frame('Đối chiếu trường hợp '+i,'evaluate',[['Nên cho phép?',input.expected[i-1]],['Đã cho phép?',input.actual[i-1]],['Bảng kết quả',matrix]],{matrix});}}
 else if(key==='dependencies'){const remaining=new Set(input.tasks),plan=[];while(remaining.size){const ready=[...remaining].filter(t=>!input.edges.some(([a,b])=>b===t&&remaining.has(a))).sort();frame(ready.length?'Chọn task sẵn sàng '+ready[0]:'Phát hiện chu trình','plan',[['Sẵn sàng',ready],['Kế hoạch',plan]],{tasks:input.tasks,dependencies:input.edges,remaining:[...remaining],plan:copy(plan)});if(!ready.length)break;remaining.delete(ready[0]);plan.push(ready[0]);}}
 else if(key==='ttl')input.memories.forEach(m=>frame('Kiểm tra hạn '+m.id,'memory',[['Hiện tại',input.now],['Hết hạn lúc',m.expiresAt],['Giữ?',m.expiresAt>input.now]],{memory:input.memories.filter(x=>x.expiresAt>input.now)}));
 else if(key==='votes')input.votes.forEach((v,i)=>frame('Nhận phiếu '+(i+1),'evaluate',[['Phiếu mới',v],['Kết quả tạm',oracle(id,{votes:input.votes.slice(0,i+1)})]],{votes:input.votes.slice(0,i+1)}));
 else if(key==='coverage')frame('So ID duy nhất','evaluate',[['Mục tiêu', [...new Set(input.expected)]],['Đã tìm', [...new Set(input.retrieved)]],['Bao phủ',result]],{coverage:result});
 frame('Kết quả được checker xác minh','finish',[['JSON đầu ra',result]],{mode,result});
 // Draw only stages that this particular algorithm actually visited. A simple
 // reflex policy must not appear to require memory, planning or a tool API.
 const labels={...Object.fromEntries(standardNodes),policy:key==='reflex'?'Chọn hành động':key==='policy'?'Kiểm tra quyền':'Kiểm tra yêu cầu'};
 const used=new Set(frames.map(f=>f.activeNode)),edges=[],seenEdges=new Set();
 for(let i=1;i<frames.length;i++){
  const from=frames[i-1].activeNode,to=frames[i].activeNode,edge=from+'>'+to;
  if(from!==to&&!seenEdges.has(edge)){seenEdges.add(edge);edges.push([from,to]);}
 }
 const visited=new Set();
 for(const f of frames){
  f.nodes=standardNodes.filter(([id])=>used.has(id)).map(([id])=>({id,label:labels[id],status:id===f.activeNode?'active':visited.has(id)?'visited':'idle'}));
  f.edges=edges;visited.add(f.activeNode);
 }
 return{kind:'agent',mode,title:problems[id].title,input:copy(input),frames,result:copy(result),notice:AGENT_SIM_NOTICE};
}
