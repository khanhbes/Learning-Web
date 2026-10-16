import {notes} from '../genai/reading.mjs';
import {term} from './author.mjs';
export const lessonDesigns=Object.fromEntries(notes.flatMap((n,i)=>n.pids.length===2?[]:[[i+1,{
 hook:n.hook,intuition:n.concept,
 goals:['Giải thích bằng hình: '+n.title+'.','Tự thực hiện: '+n.algorithm[0].toLowerCase()+' và '+n.algorithm.at(-1).toLowerCase()+'.','Phát hiện một lỗi bằng dữ liệu mới và nêu giới hạn của ví dụ.'],
 algorithm:n.algorithm,bridges:n.bridges.split(',').filter(Boolean),vocabulary:n.terms.map(v=>term(...v)),
 misconception:{wrong:n.quiz[1][2],why:n.trap,repair:n.example},
 transfer:{prompt:n.quiz[2][0],explanation:n.quiz[2][1]+'. '+n.concept},
 checks:{concept:[...n.quiz[0],n.concept],error:[...n.quiz[1],n.trap+' '+n.example],apply:[...n.quiz[2],n.quiz[2][1]+'. '+n.concept]},
}]]));
