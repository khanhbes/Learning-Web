// Small authoring helpers: content remains explicit per skill/lesson, not generated
// at runtime by AI. The original handbook explanations are retained as sources.
export const term=(name,definition,example)=>({term:name,definition,example});
export function authoredDesigns(course,rows,{overrides={},vocab={}}={}){
  return Object.fromEntries(rows.map(([id,hook,algorithm,why,bridgeIds,terms])=>{
    const lesson=course.lessons.find(l=>l.id===id),original=course.packs[lesson.pack],pack={...original,concept:original.concept??lesson.blocks[1].text,trap:original.trap??lesson.blocks[4].text},topic=course.topicQuestions[lesson.pack];
    const plan=algorithm.split('|'),goals=['Giải thích '+hook.replace(/\?$/,'').replace(/^Vì sao /,'vì sao ')+'.','Thực hiện được: '+plan.slice(0,2).join('; ')+'.','Tự phát hiện và sửa lỗi: '+pack.trap.split(/[.!]\s/)[0]+'.'];
    const rows=topic.slice(0,3).map((q,i)=>[q[0],...q.slice(1),[why,pack.concept][i===0?0:1]]);
    if(rows[1])rows[1][0]='Một bạn chọn “'+rows[1][2]+'”. Với câu hỏi “'+topic[1][0]+'”, câu trả lời cần sửa thành gì?';
    const design={hook,intuition:pack.concept+' '+why,goals,algorithm:plan,
      misconception:{wrong:topic[1]?.[2]??pack.trap,why:pack.trap,repair:why},
      transfer:{prompt:topic[2][0],explanation:topic[2][1]+'. '+why},
      vocabulary:terms.map(t=>vocab[t]).filter(Boolean),bridges:bridgeIds.split(',').filter(Boolean),checks:{concept:rows[0],error:rows[1],apply:rows[2]}};
    return[id,{...design,...overrides[id]}];
  }));
}
