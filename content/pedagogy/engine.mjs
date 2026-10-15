import {random,shuffle,hash} from '../../shared/random.mjs';
import {edgeInputs as dsaEdges} from '../fixtures.mjs';
import {workedTrace} from './worked.mjs';

export const TEACHING_VERSION='teaching-2026.10.15-v1';
export const ASSESSMENT_VERSION='understanding-2026.10.15-v2';
export const ACTIVITY_IDS=['concept','order','match','predict','fill','debug','boundary','transfer'];
const copy=x=>structuredClone(x);
const stable=x=>JSON.stringify(x);
const text=x=>typeof x==='string'?x:JSON.stringify(x);
export function displayValue(value){
  if(value===null)return 'Không có giá trị (null)';
  if(value===true)return 'Đúng (true)';
  if(value===false)return 'Sai (false)';
  if(typeof value==='number')return Number.isInteger(value)?String(value):String(Number(value.toPrecision(10)));
  if(typeof value==='string')return JSON.stringify(value);
  return JSON.stringify(value);
}

// Keep the reviewed grader program untouched. Only present the relevant function
// and its actual dependencies; unrelated teaching helpers never reach the slide.
export function teachingCode(definition,pid,design={}){
  if(design.code)return copy(design.code);
  const out={};
  for(const language of definition.course.languages){
    const source=definition.solution?.(pid,language)??definition.solutions?.[pid]??'';
    if(language!=='python'){out[language]=source;continue;}
    const match=source.match(/^def solve\(.*$/m);
    if(!match){out[language]=source;continue;}
    const start=match.index,tail=source.slice(start),next=tail.slice(1).search(/\n(?:def |class |if __name__)/);
    const body=(next<0?tail:tail.slice(0,next+1)).trimEnd();
    const imports=source.split('\n').filter(line=>/^(import |from )/.test(line)).filter(line=>{
      const names=line.startsWith('from ')?line.split(' import ')[1]?.split(',').map(s=>s.trim().split(/\s+as\s+/).at(-1)):line.slice(7).split(',').map(s=>s.trim().split(/\s+as\s+/).at(-1).split('.')[0]);
      return names?.some(name=>name&&new RegExp('\\b'+name+'\\b').test(body));
    });
    out.python=(imports.length?imports.join('\n')+'\n\n':'')+body;
  }
  return out;
}
function helperCode(def,pid,code){
  const source=def.solution?.(pid,'python')??def.solutions?.[pid];
  if(!source||!code?.python)return null;
  const functions=new Map();
  for(const m of source.matchAll(/^def (\w+)\(.*\n(?:[ \t].*\n|\s*\n)*/gm))functions.set(m[1],m[0].trimEnd());
  const needed=new Set(),visit=s=>{for(const[name,body]of functions)if(name!=='solve'&&!needed.has(name)&&new RegExp('\\b'+name+'\\s*\\(').test(s)){needed.add(name);visit(body);}};
  visit(code.python);
  const bodies=[...needed].map(n=>functions.get(n)).join('\n\n');
  return needed.size?(/\bmath\./.test(bodies)?'import math\n\n':'')+bodies:null;
}
function annotationsFor(code,design){
  return Object.fromEntries(Object.entries(code).map(([language,source])=>[language,source.split('\n').map(line=>{
    const s=line.trim();
    if(!s)return 'Dòng trống ngăn các phần để dễ đọc.';
    if(language==='shell'){
      if(/^git add\b/.test(s))return 'Chụp nội dung file hiện tại vào vùng chọn (index); sửa file sau đó chưa tự sửa bản đã chọn.';
      if(/^git commit\b/.test(s))return 'Ghi nội dung đang ở index thành một mốc lịch sử; phần chưa được chọn vẫn ở ngoài commit.';
      if(/^git init\b/.test(s))return 'Khởi tạo kho Git để bắt đầu theo dõi lịch sử của các file.';
      if(/^git status\b/.test(s))return 'Xem file nào đã thay đổi, đã được chọn hoặc chưa được Git theo dõi.';
      if(/^git diff\b/.test(s))return 'Đối chiếu nội dung giữa hai trạng thái; xem các cờ của lệnh để biết đang so với bản nào.';
      if(/^(write|append|edit|rm)\b/.test(s))return 'Sửa nội dung trong thư mục làm việc; thao tác này chưa tự tạo commit.';
      return 'Thực hiện lệnh trong kho ảo rồi đối chiếu trạng thái thay đổi với quy trình của bài.';
    }
    if(/^(import |from |#include)/.test(s))return 'Nạp công cụ được các phép tính bên dưới sử dụng.';
    if(/^(def solve|json solve)/.test(s))return 'Nhận gói dữ liệu đầu vào trong data để giải tình huống của bài.';
    const field=s.match(/(?:data|d)\[['"]([^'"]+)['"]\]/);
    if(field&&!/return/.test(s))return 'Đọc trường '+field[1]+' của dữ liệu rồi thực hiện phép xử lý trên dòng này.';
    if(/^return\b/.test(s))return 'Gửi kết quả về nơi gọi và kết thúc lần gọi hàm hiện tại.';
    if(/^(for|while)\b/.test(s))return 'Lặp phép xử lý cho từng phần dữ liệu hoặc tới khi đạt điều kiện dừng.';
    if(/^(if|elif)\b/.test(s))return 'Kiểm điều kiện trên dòng này để chọn nhánh; chú ý trường hợp bằng ngưỡng.';
    if(/^else/.test(s))return 'Xử lý khi các điều kiện trước đó chưa đúng.';
    if(/^[#\/]/.test(s))return 'Chú thích giải thích cách làm, không phải giá trị trả về.';
    if(s==='}')return 'Kết thúc khối lệnh đang xét.';
    return 'Tính hoặc cập nhật kết quả trung gian. '+design.algorithm[Math.min(1,design.algorithm.length-1)];
  })]));
}
export function sampleFor(def,lesson){
  const pid=lesson.problemIds[0],p=def.problems[pid];
  let input=def.course.id==='linear'&&lesson.id===1?{x:2,y:1}:copy(p.sampleInput??def.generateInput(pid,0));
  if(lesson.id===1&&def.course.id==='ml')input={labels:[0,0,0,0,0,0,0,0,1,1]};
  if(lesson.id===1&&def.course.id==='agent')input={fields:['battery','dirty','temperature'],observations:[{field:'battery',value:0},{field:'dirty',value:false}]};
  if(lesson.id===1&&def.course.id==='da')input={rows:[{order_id:1,customer_id:'Lan',value:30},{order_id:2,customer_id:'Lan',value:50},{order_id:3,customer_id:'Minh',value:20}]};
  return{problemId:pid,input,output:def.oracle(pid,input)};
}
export function buildTeachingFlow(def,lesson,design){
  if(lesson.kind==='exam')return null;
  if(!design)throw Error('Thiếu thiết kế bài '+def.course.id+'/'+lesson.id);
  const sample=sampleFor(def,lesson),code=teachingCode(def,sample.problemId,design),helpers=helperCode(def,sample.problemId,code);
  const material=def.originalLessonMaterial(lesson),deepDive=material.blocks.filter(b=>b.collapsible||b.code||/thời gian|bộ nhớ|mở rộng/i.test(b.title));
  const dataVisual={kind:'data',...sample,focus:design.vocabulary?.[0]?.term};
  const activity=(id,title,stage)=>({id:'activity-'+id,kind:'activity',stage,title,prompt:'',text:'',activityId:id});
  const steps=[
    {id:'intro',stage:'intro',kind:'story',title:design.hook,prompt:'Hôm nay mình cần giải quyết điều gì?',text:design.intuition,visual:dataVisual},
    activity('concept','Thử đoán ý chính','intro'),
    {id:'model',stage:'model',kind:'worked',title:'Xem một ví dụ, hiểu từng bước',prompt:design.hook,text:design.intuition,explanations:design.algorithm,visual:dataVisual},
    activity('order','Làm cùng: đặt các bước đúng chỗ','guided'),
    activity('match','Nối tên với điều bạn vừa thấy','guided'),
    {id:'visual',stage:'guided',kind:'visual',title:'Dừng ở một bước, đoán bước tiếp theo',prompt:'Theo dõi điều thay đổi trước khi bấm bước tiếp.',text:design.algorithm[0],visual:{...dataVisual,kind:def.course.id==='linear'&&lesson.id===1?'course':'trace'}},
    activity('predict','Đến lượt bạn: dự đoán kết quả','practice'),
    {id:'code-model',stage:'model',kind:'worked',title:def.course.id==='git'?'Từ ý tưởng đến lệnh':'Từ hình đến vài dòng code',prompt:'Đọc từng đoạn và liên hệ với ví dụ.',text:'Chú ý phần nhận dữ liệu, phép xử lý và kết quả được trả về.',code,annotations:design.annotations??annotationsFor(code,design),visual:dataVisual},
    activity('fill','Hoàn thiện phần còn thiếu','guided'),
    {id:'misconception',stage:'practice',kind:'story',title:'Một lỗi dễ mắc',prompt:design.misconception.wrong,text:design.misconception.why+' '+design.misconception.repair,visual:dataVisual},
    activity('debug','Tìm lỗi trước khi chạy','practice'),
    activity('boundary','Thử trường hợp khác thường','transfer'),
    activity('transfer','Mang ý tưởng sang tình huống mới','transfer'),
    {id:'independent-code',stage:'code',kind:'code',title:def.course.id==='git'?'Tự thao tác trên kho mới':'Tự viết lời giải của bạn',prompt:design.transfer.prompt,text:design.transfer.explanation},
    {id:'recap',stage:'transfer',kind:'story',title:'Bạn vừa làm được gì?',prompt:'Thử nói lại ý chính trước khi kiểm tra.',text:design.goals.join(' '),explanations:[design.misconception.repair,...design.algorithm.slice(-1)]},
  ];
  return{version:TEACHING_VERSION,objectives:design.goals,prerequisites:design.bridges??[],glossary:design.vocabulary??[],steps,summary:design.goals,sample,trace:workedTrace(def,lesson,sample),
    deepDive:[...deepDive.map(b=>({...b,code:b.problemId?teachingCode(def,b.problemId,{}):b.code})),...(helpers?[{title:'Các hàm phụ được ví dụ sử dụng',text:'Mở khi muốn xem cách cài đặt phép tính phụ; không cần học mọi hàm của khóa cùng lúc.',label:'Bổ sung đã kiểm chứng',code:{python:helpers},collapsible:true}]:[])]};
}

function rowQuestion(id,row,rng,extra={}){
  if(!row||row.length<4)throw Error('Câu hỏi thiếu giải thích: '+id);
  const [prompt,correct,...rest]=row,explanation=rest.pop(),wrong=[...new Set(rest)].filter(s=>s!==correct);
  if(wrong.length<1)throw Error('Câu hỏi không có lựa chọn sai: '+id);
  const options=shuffle([{text:correct},...wrong.map(text=>({text}))],rng).map(o=>({...o,id:'o-'+hash(id+':'+o.text+':'+rng()).toString(16)}));
  const answer=options.find(o=>o.text===correct).id;
  return{id,kind:'choice',title:prompt,prompt,options,answer,explanation,...extra};
}
function edgesFor(def,pid){const e=def.course.id==='dsa'?dsaEdges(pid):typeof def.edgeInputs==='function'?def.edgeInputs(pid):def.edgeInputs?.[pid];return e??[];}
function outputUI(value){
  if(typeof value==='number')return{kind:'number'};
  if(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length<=8&&Object.values(value).every(x=>x===null||['number','string','boolean'].includes(typeof x)))return{kind:'fields',fields:Object.entries(value).map(([key,v])=>({key,label:key,type:v===null?'scalar':typeof v==='number'?'number':typeof v==='boolean'?'boolean':'text'}))};
  return{kind:'json'};
}
export function createTeachingLab(def,lesson,seed,design){
  const rng=random(String(seed)+':teaching-lab'),pid=lesson.problemIds[0],input=def.generateInput(pid,String(seed)+':predict');
  const expected=def.oracle(pid,input),edges=edgesFor(def,pid),boundary=copy(edges.length?edges[hash(String(seed))%edges.length]:def.generateInput(pid,String(seed)+':variation'));
  const boundaryExpected=def.oracle(pid,boundary);
  const vocab=design.vocabulary.slice(0,4),steps=design.algorithm.slice(0,6).map((s,i)=>({id:'step-'+i,text:s}));
  const fillRow=design.checks.error,code=teachingCode(def,pid,design);
  const python=code.python??'',field=python.match(/data\[['"]([^'"]+)['"]\]/);
  const fill=field?{prompt:'Điền đúng tên trường đầu tiên mà code mẫu vừa đọc từ data. Các phần khác giữ như ví dụ.',code:{python:python.replace(field[0],'data[___]')},row:['Chọn tên trường cho vị trí ___ trong code mẫu.',JSON.stringify(field[1]),...Object.keys(input).filter(k=>k!==field[1]).slice(0,2).map(JSON.stringify),JSON.stringify(field[1]+'s'),'Trường '+field[1]+' được định nghĩa trong đầu vào. Tên khóa chọn đúng phần dữ liệu cần đọc.']}:null;
  if(fill&&code.cpp){
    const property=new RegExp('\\[[\'\"]'+field[1].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[\'\"]\\]');
    fill.code.cpp=property.test(code.cpp)?code.cpp.replace(property,'[___]'):'// data là gói dữ liệu của ví dụ.\njson value = data[___];';
  }
  const fillQuestion=fill?rowQuestion('fill',fill.row,rng):rowQuestion('fill',['Khái niệm nào khớp với “'+vocab[0].definition+'”?',vocab[0].term,...vocab.slice(1).map(v=>v.term),vocab[0].example],rng);
  const questions=[
    rowQuestion('concept',design.checks.concept,rng,{category:'concept',skillId:pid}),
    {id:'order',kind:'order',title:'Làm đúng từng bước',prompt:'Sắp các bước của '+lesson.title+' theo cách vừa học.',items:shuffle(steps,rng),answer:steps.map(s=>s.id),explanation:design.algorithm.join(' → '),skillId:pid},
    {id:'match',kind:'match',title:'Gọi đúng tên điều vừa thấy',prompt:'Ghép khái niệm của bài với ý nghĩa của nó.',pairs:vocab.map((v,i)=>({id:'v'+i,left:v.term})),options:shuffle(vocab.map((v,i)=>({id:'v'+i,text:v.definition})),rng),answer:Object.fromEntries(vocab.map((v,i)=>['v'+i,'v'+i])),explanation:vocab.map(v=>v.term+': '+v.definition+'. '+v.example).join('\n'),skillId:pid},
    {id:'predict',kind:typeof expected==='number'?'number':'output',title:'Tự dự đoán trên dữ liệu mới',prompt:def.problems[pid].statement,input,problemId:pid,answer:expected,ui:outputUI(expected),explanation:'Một kết quả hợp lệ: '+displayValue(expected)+'. '+design.algorithm.join(' → '),skillId:pid},
    {...fillQuestion,kind:'fill',title:'Hoàn thiện phần còn thiếu',...(fill?{prompt:fill.prompt,code:fill.code}:{template:vocab[0].definition}),skillId:pid},
    rowQuestion('debug',fillRow,rng,{title:'Tìm chỗ hiểu nhầm',category:'error',skillId:pid}),
    {id:'boundary',kind:typeof boundaryExpected==='number'?'number':'output',title:'Không chỉ đúng với ví dụ đẹp',prompt:def.problems[pid].statement,input:boundary,problemId:pid,answer:boundaryExpected,ui:outputUI(boundaryExpected),explanation:'Với đầu vào này: '+displayValue(boundaryExpected)+'. '+design.misconception.why+' '+design.misconception.repair,skillId:pid},
    rowQuestion('transfer',design.checks.apply,rng,{title:'Áp dụng sang một tình huống khác',category:'apply',skillId:pid}),
  ];
  return{version:2,teachingVersion:TEACHING_VERSION,cursor:0,responses:{},completed:[],drafts:{},questions:questions.map(q=>({...q,teachingVersion:TEACHING_VERSION}))};
}
export function checkTeachingActivity(def,q,value){
  if(q.kind==='output'||q.kind==='number'){
    try{const output=typeof value==='string'?JSON.parse(value):value;return !!def.checkOutput(q.problemId,q.input,output);}catch{return false;}
  }
  if(q.kind==='match')return !!(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===Object.keys(q.answer).length&&Object.entries(q.answer).every(([k,v])=>value[k]===v));
  if(q.kind==='order')return Array.isArray(value)&&stable(q.answer)===stable(value);
  return typeof value==='string'&&q.answer===value;
}
export function practiceFeedback(q,value,correct,design,wrongCount=0){
  let misconception=null,example=null;
  if(!correct){
    if(q.kind==='order'){
      const at=Array.isArray(value)?q.answer.findIndex((id,i)=>value[i]!==id):0;
      misconception='Thứ tự hiện tại chưa giữ đúng phụ thuộc giữa các bước.';
      example='Xem lại bước '+(Math.max(0,at)+1)+': '+q.items.find(s=>s.id===q.answer[Math.max(0,at)])?.text;
    }else if(q.kind==='match'){
      const key=Object.keys(q.answer).find(k=>value?.[k]!==q.answer[k]);
      misconception='Một khái niệm đang được ghép với ý nghĩa khác.';
      example=(q.pairs.find(p=>p.id===key)?.left??'Khái niệm')+': '+q.options.find(o=>o.id===q.answer[key])?.text;
    }else if(['choice','fill'].includes(q.kind)){
      const selected=q.options.find(o=>o.id===value);
      misconception=selected?'Bạn chọn “'+selected.text+'”. Hãy đối chiếu lại điều câu hỏi yêu cầu.':'Hãy chọn một câu trả lời trước khi kiểm tra.';
    }else{
      misconception='Kết quả chưa khớp phép tính hoặc quy tắc đầu ra của tình huống này.';
      example='Một kết quả hợp lệ để chạy tay lại: '+displayValue(q.answer);
    }
  }
  return{explanation:q.explanation,misconception,example,nextTry:correct?'Thử giải thích lại một bước bằng lời của bạn.':design.algorithm[0],reviewSuggested:!correct&&wrongCount>=2};
}
export function publicTeachingLab(lab){
  if(!lab)return null;
  return{...lab,questions:lab.questions.map(({answer,answerId,explanation,feedbackByOption,...q})=>q)};
}

function mutatedCandidates(value){
  if(typeof value==='number')return[value+1,value-1,0,-value,value*2];
  if(typeof value==='boolean')return[!value];
  if(value===null)return[[],0,false];
  if(typeof value==='string')return[value.toLowerCase(),value.toUpperCase(),value+'1',''];
  if(Array.isArray(value))return[[...value].reverse(),value.slice(1),value.slice(0,-1),[],[0],[1],...value.flatMap((v,i)=>mutatedCandidates(v).slice(0,2).map(n=>value.map((x,k)=>k===i?n:x)))];
  return Object.keys(value).length?Object.entries(value).flatMap(([k,v])=>mutatedCandidates(v).slice(0,3).map(n=>({...value,[k]:n}))):[{value:0},{value:1}];
}
function traceRow(def,pid,seed){
  if(def.traceQuestion&&['linear','git'].includes(def.course.id)){
    const t=def.traceQuestion(pid,seed);
    return{...t,wrongAnswers:t.wrongAnswers.filter(v=>stable(v)!==stable(t.answer))};
  }
  const input=def.generateInput(pid,seed),answer=def.oracle(pid,input),wrongAnswers=mutatedCandidates(answer).filter(v=>!def.checkOutput(pid,input,v));
  return{prompt:def.problems[pid].statement+' Kết quả nào phù hợp với dữ liệu dưới đây?',input,answer,wrongAnswers,explanation:'Thực hiện '+def.problems[pid].title+' theo từng bước trên dữ liệu đã cho.'};
}
export function generateUnderstandingQuestions(def,lesson,mode,seed,designs){
  const rng=random(String(seed)+':understanding'),previousExam=Math.max(0,...def.lessons.filter(l=>l.kind==='exam'&&l.id<lesson.id).map(l=>l.id));
  const pool=lesson.kind==='exam'?def.lessons.filter(l=>l.kind!=='exam'&&l.id>previousExam&&l.id<lesson.id):[lesson];
  const categories=lesson.kind==='exam'&&mode==='assessment'?['concept','trace','apply','error','trace','concept','apply','trace','error','apply']:['concept','trace','trace','error','apply'];
  // Practice questions remain a legacy-compatible optional review channel; the
  // eight inline tasks are stored independently in lab and never repeated here.
  if(mode==='practice'||mode==='review')categories.push('concept','trace','apply');
  return categories.map((category,i)=>{
    const chosen=pool[Math.floor(rng()*pool.length)],design=designs[chosen.id],pid=chosen.problemIds[i%chosen.problemIds.length];
    let q;
    if(category==='trace'){
      const trace=traceRow(def,pid,String(seed)+':'+i),correct=displayValue(trace.answer);
      const wrong=[...new Map(trace.wrongAnswers.map(v=>[displayValue(v),v])).keys()].filter(v=>v!==correct).slice(0,2);
      if(!wrong.length)throw Error('Không sinh được lựa chọn sai có kiểm chứng: '+pid);
      q=rowQuestion('q-'+i,[trace.prompt,correct,...wrong,trace.explanation+' '+design.algorithm.join(' → ')],rng,{input:trace.input,problemId:pid});
      q.traceAnswer=trace.answer;
    }else q=rowQuestion('q-'+i,design.checks[category],rng);
    const {answer,...rest}=q;
    return{...rest,answerId:answer,category,sourceLessonId:chosen.id,skillId:pid,prerequisites:design.bridges??[],assessmentVersion:ASSESSMENT_VERSION,feedbackByOption:Object.fromEntries(q.options.map(o=>[o.id,o.id===answer?q.explanation:'Bạn chọn “'+o.text+'”. '+q.explanation]))};
  });
}
export function initialLearningProgress(flow,cursor={phase:'learn',block:0}){
  const legacy=cursor.phase==='visual'?'visual':cursor.phase==='practice'?'activity-concept':cursor.phase==='code'?'independent-code':['intro','model','visual','misconception','recap','code-model'][cursor.block]??'intro';
  return{version:flow.version,stepId:legacy,seen:[],tried:[]};
}
