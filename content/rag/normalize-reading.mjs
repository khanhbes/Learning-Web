// Editorial migration of the imported compact draft. No grading data is changed.
import {writeFile} from 'node:fs/promises';
import {notes} from './reading.mjs';
const phrases={
 'hạntrả':'hạn trả','baonhiêungày':'bao nhiêu ngày','đúngýđịnh':'đúng ý định','khôngđược':'không được','luôncốđịnh':'luôn cố định','đánhgiá':'đánh giá','nhiềuchữ':'nhiều chữ','phạttrùng':'phạt trùng','tácgiả':'tác giả','làmở':'làm ở','đếnđâu':'đến đâu','Khôngcó':'Không có','khácphạmvi':'khác phạm vi','phạmvi':'phạm vi','thẩmquyền':'thẩm quyền','bằngdấu':'bằng dấu','Trungbình':'Trung bình','trungbình':'trung bình','liênquan':'liên quan','khôngcóthì':'không có thì','bằnggì':'bằng gì','đồngnghĩa':'đồng nghĩa','độphủ':'độ phủ','củabạntốthơncỡnào':' của bạn tốt hơn cỡ nào','quyềntruycập':'quyền truy cập','gánnhãn':'gán nhãn','duynhất':'duy nhất','phảnvídụ':'phản ví dụ','tăngđiểm':'tăng điểm','ưu tiênđúng':'ưu tiên đúng','đủkhác':'đủ khác','cảhai':'cả hai','từasàngb':'từ a sang b','đọcđúng':'đọc đúng','trảlời':'trả lời','khớpnguồn':'khớp nguồn',
};
const terms=['reciprocalrank','embeddingmodel','embeddingversion','Groundtruth','Crossencoder','Graphretrieval','Generation','Retrieval','Precision','Retrieved','Relevant','Recall','Query','Metric','GraphRAG','Baseline','Tenant','Log','PASS','query','retrieved','relevant','precision','recall','embedding','version','metadata','candidates','candidate','context','reserved','threshold','supported','sourceId','expiresAt','similarity','relevance','selected','lambda','rankings','retrieval','generation','reranking','tokenizer','framework','baseline','fixture','latency','overlap','budget','claims','claim','quote','output','sources','source','tokens','token','score','model','tenant','start','rank','query','metric','vector','record','index','docs','cost','text','need','size','count','test','tuning','now','RAG','LLM','MMR','MRR','RRF','RR','ID'];
function clean(s){
 for(const[a,b]of Object.entries(phrases))s=s.replaceAll(a,b);
 for(const t of [...terms].sort((a,b)=>b.length-a.length)){
  s=s.replace(new RegExp('(?<=[\\p{L}0-9])'+t,'gu'),' '+t).replace(new RegExp(t+'(?=[\\p{L}])','gu'),t+' ');
 }
 return s.replace(/(\d)(?=[A-DF-Za-df-zÀ-ỿ])/gu,'$1 ').replace(/([À-ỿ])(?=\d)/gu,'$1 ').replace(/([a-z])(?=\d(?:ngày|đơn|đóng|thì|có|và))/g,'$1 ').replace(/([,;:])(?=[\p{L}\d])/gu,'$1 ').replace(/([\]])(?=[\p{L}])/gu,'$1 ').replace(/(?<=[\p{L}])([“])/gu,' $1').replace(/([”])(?=[\p{L}])/gu,'$1 ').replace(/ +/g,' ').replaceAll('reciprocal rank','reciprocal rank').trim();
}
const fields=['title','hook','analogy','concept','trap','example','formula'];
for(const n of notes){for(const key of fields)n[key]=clean(n[key]);n.algorithm=n.algorithm.map(clean);n.quiz=n.quiz.map(q=>q.map(clean));n.terms=n.terms.map(clean);n.example=n.algorithm.join(' → ');n.bridges=n.bridges.replace('subtraction','arithmetic').replace('strings','lists');}
await writeFile(new URL('./reading.mjs',import.meta.url),'// Reviewed lesson narratives and objective question explanations.\nexport const notes='+JSON.stringify(notes,null,2)+';\n','utf8');
