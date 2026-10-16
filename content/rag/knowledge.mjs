import {notes} from './reading.mjs';
import sources from './sources.json' with {type:'json'};
const selected=notes.filter(n=>n.quiz.length);
function row(n,tip=false){const q=n.quiz[tip?1:0],extra=n.quiz.flatMap(other=>other.slice(2,4)).find(text=>!q.slice(1,4).includes(text)),prefix=sources.find(s=>s.page===n.page).prefix;return['lesson-'+n.id,n.title,q[0],q[1],q[2],q[3],extra,q[4]+' '+n.trap,prefix];}
export const knowledgeInterviewRows=selected.map(n=>row(n));
export const knowledgeTipRows=selected.filter(n=>n.id<=24).slice(0,20).map(n=>row(n,true));
export const knowledgeLessonIds=Object.fromEntries(selected.map(n=>['lesson-'+n.id,n.id]));
