import {notes} from './reading.mjs';
import sources from './sources.json' with {type:'json'};
const selected=notes.map((n,i)=>({n,id:i+1})).filter(({n})=>n.quiz.length);
const row=({n,id},tip)=>{const q=n.quiz[tip?1:0];return['lesson-'+id,n.title,q[0],q[1],q[2],q[3],n.quiz[2][2],tip?n.trap:n.concept,sources.find(s=>s.page===n.page).prefix];};
export const knowledgeInterviewRows=selected.map(item=>row(item,false));
export const knowledgeTipRows=selected.slice(0,20).map(item=>row(item,true));
export const knowledgeLessonIds=Object.fromEntries(selected.map(({id})=>['lesson-'+id,id]));
