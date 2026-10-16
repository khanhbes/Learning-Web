// Rebuild the source inventory after checking the printed page numbers visually.
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {notes} from './reading.mjs';
const pages=[
 ['839936638','Tổng quan 20 khái niệm Gen AI'],
 ['840901139','Tokenization và embeddings'],
 ['843591993','Attention và dự đoán token tiếp theo'],
 ['840697720','Decoding, context window và KV cache'],
 ['840561941','Pretraining, post-training và preference optimization'],
 ['844023998','Scaling laws, inference compute và LoRA'],
 ['840961254','Quantization, distillation và prompting'],
 ['833298804','Structured output và context engineering'],
 ['843324468','RAG và các bước truy xuất'],
 ['840643342','Hallucination, grounding và tool use'],
 ['841283655','Kiến trúc agent, evaluation và observability'],
];
const directory='study documents/Gen AI',files=readdirSync(directory).filter(f=>/\.(png|jpe?g)$/i.test(f));
if(files.length!==pages.length)throw Error('Cần kiểm tra lại số trang Gen AI.');
const sources=pages.map(([prefix,title],i)=>{const file=files.find(f=>f.startsWith(prefix+'_'));if(!file)throw Error('Thiếu ảnh '+prefix);const page=i+1,lessonIds=notes.flatMap((n,j)=>n.page===page?[j+1]:[]),interviewIds=lessonIds.filter(id=>notes[id-1].quiz.length).map(id=>'genai-interview-lesson-'+id);return{id:'GENAI-'+prefix,courseId:'genai',prefix,file,path:directory+'/'+file,url:'/sources/genai/'+file,sha256:createHash('sha256').update(readFileSync(directory+'/'+file)).digest('hex'),pack:'genai-concepts',packTitle:'20 khái niệm Gen AI',collection:'20 khái niệm Gen AI · 11 trang',page,title,topic:title,topics:[title],lessonIds,reviewIds:lessonIds,interviewIds,uses:['lesson','review',...(interviewIds.length?['interview']:[])],note:'Đã đọc hình gốc. Ví dụ nhỏ, bài Python và hoạt động tương tác là phần bổ sung; xem sổ hiệu đính cho nhận định được sửa.'};});
writeFileSync(new URL('./sources.json',import.meta.url),JSON.stringify(sources,null,2)+'\n');
console.log('Gen AI: '+sources.length+' ảnh có SHA-256 và ánh xạ bài học.');
