// The legacy root fields always represent DSA in storage. API views may project
// another course, without changing the persisted DSA aliases.
import {courseRegistry} from "../content/registry.mjs";
export function normalizeCourses(s) {
  s.courses ??= {};
  const old = s.courses.dsa;
  s.courses.dsa = {
    progress: s.progress ?? old?.progress ?? {},
    started: s.started ?? old?.started ?? [],
    language: old?.language ?? s.profile?.language ?? "python",
    capstonePassed: s.capstonePassed ?? old?.capstonePassed ?? false,
    capstoneScore: s.capstoneScore ?? old?.capstoneScore ?? 0,
  };
  for(const [id,definition] of Object.entries(courseRegistry))s.courses[id] ??= {progress:{},started:[],language:definition.course.languages[0],capstonePassed:false,capstoneScore:0};
  s.activeCourse ??= "dsa";
  s.profile.settings ??= {sound:false,reducedMotion:false};
  return s;
}
export function courseState(s, id = "dsa") {
  normalizeCourses(s);
  if (!s.courses[id]) throw Object.assign(Error("Khóa học không tồn tại."),{statusCode:404});
  return s.courses[id];
}
export function persistCourse(s,id,c) {
  s.courses[id]=c;
  if(id === "dsa") {
    s.progress=c.progress;s.started=c.started;
    s.capstonePassed=c.capstonePassed;s.capstoneScore=c.capstoneScore;
  }
}
export function courseUnlocked(s, definition, lessonId) {
  const c=courseState(s,definition.course.id),l=definition.lessons.find(l=>l.id===lessonId);
  if(!l) return false;
  if(lessonId > definition.course.mandatoryLessons) return c.capstonePassed;
  return l.prerequisites.every(id=>c.progress[id]?.passed);
}
export function courseSummary(s,definition,now=Date.now()) {
  const c=courseState(s,definition.course.id), count=definition.course.mandatoryLessons;
  const passed=definition.lessons.filter(l=>l.id<=count && c.progress[l.id]?.passed);
  const avg=rows=>rows.length? rows.reduce((v,l)=>v+(c.progress[l.id]?.bestKnowledge??0),0)/rows.length:0;
  return {...c,completed:passed.length,mandatoryCount:count,advancedCount:definition.course.advancedLessons,
    capstoneUnlocked:passed.length===count,
    courseScore:Math.round(.3*avg(passed.filter(l=>l.kind!=="exam"))+.3*avg(passed.filter(l=>l.kind==="exam"))+.4*c.capstoneScore),
    reviewDue:passed.filter(l=>(c.progress[l.id]?.nextReview??now)<=now).length};
}
