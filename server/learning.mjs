import {z} from 'zod';
import {getBridge,checkBridge,bridges} from '../content/pedagogy/bridges.mjs';
import {getCourse} from '../content/registry.mjs';
export const learningProgressSchema=z.object({version:z.string().max(80),stepId:z.string().max(64),seen:z.array(z.string().max(64)).max(64),tried:z.array(z.string().max(64)).max(64)});
export const learningSupportSchema=z.record(z.string().max(80),z.object({seen:z.boolean(),skipped:z.boolean().optional(),correct:z.array(z.string().max(32)).max(3),updatedAt:z.number().optional()}));
const fail=(message,statusCode=400)=>Object.assign(Error(message),{statusCode});
export function saveLearningProgress(attempt,value){
  if(!['practice','review'].includes(attempt.mode))throw fail('Bổ trợ và luyện từng bước không mở trong lượt tính điểm.',403);
  const flow=getCourse(attempt.courseId).teachingFlow(attempt.lessonId);
  if(!flow||value.version!==flow.version)throw fail('Phiên bản bài giảng không khớp. Tải lại bài để tiếp tục.');
  const ids=new Set(flow.steps.map(s=>s.id));
  if(![value.stepId,...value.seen,...value.tried].every(id=>ids.has(id)))throw fail('Bước học không thuộc buổi.');
  const old=attempt.learningProgress?.version===value.version?attempt.learningProgress:{seen:[],tried:[]};
  attempt.learningProgress={...value,seen:[...new Set([...old.seen,...value.seen])],tried:[...new Set([...old.tried,...value.tried])]};
}
export function registerLearningRoutes(app,{store,now}){
  const body=z.object({language:z.enum(['python','cpp','shell']).default('python')});
  function available(id){
    if(!Object.hasOwn(bridges,id))throw fail('Không tìm thấy bài bổ trợ.',404);
    if([...store.list('attempts'),...store.list('capstones')].some(a=>a.status==='active'&&['assessment','capstone'].includes(a.mode)))throw fail('Bổ trợ chỉ mở ngoài lượt kiểm tra đang hoạt động.',403);
  }
  app.get('/api/learning/bridges/:id',async req=>{
    available(req.params.id);const {language}=body.parse(req.query);return getBridge(req.params.id,language);
  });
  app.put('/api/learning/bridges/:id',async req=>{
    available(req.params.id);const {language,status}=body.extend({status:z.enum(['seen','skipped'])}).parse(req.body);
    return store.transaction(()=>{
      const s=store.getState(),key=req.params.id+':'+language;
      s.learningSupport??={};const old=s.learningSupport[key]??{seen:false,correct:[]};
      s.learningSupport[key]={...old,seen:status==='seen'||old.seen,skipped:status==='skipped',updatedAt:now()};
      store.putState(s);return{support:s.learningSupport[key]};
    });
  });
  app.post('/api/learning/bridges/:id/check',async req=>{
    available(req.params.id);const {language,questionId,value}=body.extend({questionId:z.string().max(32),value:z.string().max(100)}).parse(req.body);
    const result=checkBridge(req.params.id,questionId,value);
    if(!result?.valid)throw fail('Câu hỏi hoặc lựa chọn không thuộc bài bổ trợ.');
    return store.transaction(()=>{
      const s=store.getState(),key=req.params.id+':'+language;
      s.learningSupport??={};const old=s.learningSupport[key]??{seen:false,correct:[]};
      const support={...old,seen:true,correct:[...new Set([...old.correct,...(result.correct?[questionId]:[])])],updatedAt:now()};
      s.learningSupport[key]=support;store.putState(s);
      return{correct:result.correct,explanation:result.explanation,support};
    });
  });
}
