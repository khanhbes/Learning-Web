import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {notes} from './reading.mjs';
const folder=new URL('../../study documents/RAG LLM/',import.meta.url);
const manifest=[
 ['828843433',8,'Nền tảng Retrieval-Augmented Generation'],['828987393',10,'Embeddings và vector databases'],['829528974',4,'Prompt engineering'],['830181126',13,'Các kỹ thuật RAG nâng cao'],['830349631',6,'Pretraining và fine-tuning'],['830447277',1,'Kiến thức nền tảng về LLM'],['830642426',2,'Transformers và attention'],['830701340',12,'Pipeline và kiến trúc RAG'],['830754904',7,'Instruction tuning và RLHF'],['831712068',0,'Bìa và mục lục RAG & LLMs'],['832591589',14,'Ứng dụng LLM, agents và đánh giá'],['833392351',11,'Retrieval và reranking'],['833604193',15,'Phỏng vấn RAG & LLM, kiến thức thực tế'],['833753486',3,'Tokens, embeddings và context window'],['833862787',9,'Document loading và chunking'],['834192814',5,'Kiến trúc LLM'],
];
const files=await readdir(folder),rows=[];
for(const[prefix,page,title]of manifest){const file=files.find(f=>f.startsWith(prefix+'_'));if(!file)throw Error('Missing RAG source '+prefix);const bytes=await readFile(new URL(file,folder));const lessonIds=notes.filter(n=>n.page===page).map(n=>n.id);if(page===0||page===1)lessonIds.push(1);if(page===7)lessonIds.push(8);rows.push({id:'RAG-'+prefix,courseId:'rag',prefix,file,path:'study documents/RAG LLM/'+file,url:'/sources/rag/'+file,sha256:createHash('sha256').update(bytes).digest('hex'),pack:'rag-handbook',packTitle:'RAG & LLMs — Cẩm nang viết tay',collection:'RAG & LLMs — Series viết tay v1.0',page,title,topic:title,topics:[title],lessonIds:[...new Set(lessonIds)],role:page===0?'introduction':page===15?'interview':'lesson',reviewed:true,reviewMethod:'Read full-resolution contact sheets, all 16 source images; checked corrections against primary references.'});}
await writeFile(new URL('./sources.json',import.meta.url),JSON.stringify(rows,null,2)+'\n','utf8');
console.log(JSON.stringify({course:'rag',images:rows.length,mapped:rows.every(x=>x.lessonIds.length>0),directory:fileURLToPath(folder)}));
