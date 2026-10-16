import {notes} from '../rag/reading.mjs';
import {term} from './author.mjs';
export const lessonDesigns=Object.fromEntries(notes.filter(n=>n.quiz.length).map(n=>[n.id,{
 hook:n.hook,intuition:n.concept,
 goals:['Mô tả bằng ví dụ: '+n.title+'.','Tự thực hiện: '+n.algorithm[0].toLowerCase()+' và '+n.algorithm.at(-1).toLowerCase()+'.','Phát hiện lỗi và kiểm lại một dữ liệu mới.'],
 algorithm:n.algorithm,bridges:n.bridges.split(',').filter(Boolean),vocabulary:n.terms.map(v=>term(...v.split('|'))),
 misconception:{wrong:n.quiz[1][2],why:n.quiz[1][4],repair:n.trap},transfer:{prompt:n.quiz[2][0],explanation:n.quiz[2][4]},
 checks:{concept:n.quiz[0],error:n.quiz[1],apply:n.quiz[2]},
}]));
