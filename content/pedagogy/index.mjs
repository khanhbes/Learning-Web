import {lessonDesigns as dsa} from './dsa.mjs';
import {lessonDesigns as ml} from './ml.mjs';
import {lessonDesigns as da} from './da.mjs';
import {lessonDesigns as git} from './git.mjs';
import {lessonDesigns as agent} from './agent.mjs';
import {lessonDesigns as linear} from './linear.mjs';
import {buildTeachingFlow,createTeachingLab,checkTeachingActivity,generateUnderstandingQuestions,TEACHING_VERSION} from './engine.mjs';
import {checkLab as legacyCheckLab} from '../labs.mjs';
export const teachingDesigns={dsa,ml,da,git,agent,linear};
export function installTeaching(registry){
  for(const[id,def]of Object.entries(registry)){
    const designs=teachingDesigns[id],originalMaterial=def.lessonMaterial,originalCheck=def.checkLab;
    if(id==='dsa'){
      designs[1]={...designs[1],code:{python:'def solve(data):\n    a = data["a"]\n    b = data["b"]\n    return a + b',cpp:'json solve(const json& data) {\n    int a = data["a"], b = data["b"];\n    return a + b;\n}'},annotations:{python:['Nhận gói dữ liệu đã chuẩn bị.','Đọc số được đặt tên a.','Đọc số được đặt tên b.','Cộng hai giá trị rồi gửi tổng về.'],cpp:['Nhận gói dữ liệu; json là kiểu có sẵn trong bài.','Đọc hai số nguyên theo tên.','Trả tổng về bộ chấm.','Kết thúc hàm.']}};
    }
    const flowCache=new Map();
    def.originalLessonMaterial=originalMaterial;
    def.teachingDesigns=designs;
    def.teachingFlow=lesson=>{
      const l=typeof lesson==='object'?lesson:def.lessons.find(l=>l.id===lesson);
      if(!l||l.kind==='exam')return null;
      if(!flowCache.has(l.id))flowCache.set(l.id,buildTeachingFlow(def,l,designs[l.id]));
      return flowCache.get(l.id);
    };
    def.lessonMaterial=value=>{
      const material=originalMaterial(value),flow=def.teachingFlow(material);
      return flow?{...material,objectives:flow.objectives,steps:designs[material.id].algorithm,teachingFlow:flow,teachingVersion:TEACHING_VERSION}:material;
    };
    def.createLab=(lesson,seed)=>{
      const source=lesson.kind==='exam'?[...def.lessons].reverse().find(l=>l.id<lesson.id&&l.kind!=='exam'&&l.problemIds.includes(lesson.problemIds[0]))??[...def.lessons].reverse().find(l=>l.id<lesson.id&&l.kind!=='exam'):lesson;
      return createTeachingLab(def,{...source,problemIds:lesson.problemIds},seed,designs[source.id]);
    };
    def.checkLab=(q,value)=>q.teachingVersion===TEACHING_VERSION?checkTeachingActivity(def,q,value):(originalCheck??legacyCheckLab)(q,value);
    def.generateUnderstandingQuestions=(lesson,mode,seed)=>generateUnderstandingQuestions(def,lesson,mode,seed,designs);
  }
}
