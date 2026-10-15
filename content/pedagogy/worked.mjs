import {traceFor as dsaTrace} from '../../shared/traces.mjs';
const clone=v=>structuredClone(v);
const finite=v=>typeof v==='number'&&!Number.isFinite(v)?v===Infinity?'∞':v===-Infinity?'−∞':'Chưa xác định':Array.isArray(v)?v.map(finite):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,finite(x)])):v;
export function workedTrace(def,lesson,sample){
  const {problemId:pid,input:d,output}=sample,key=pid.replace(/^(ml|da|linear)-/,'');
  let raw;
  if(def.course.id==='dsa')raw=dsaTrace(pid,d,{variant:lesson.id===39?'components-bfs':'insertion'});
  else raw=def.traceFor(pid,d);
  let frames=raw.frames.map(f=>({caption:f.caption??f.label??'Trạng thái đang xét',values:f.values,active:f.active??[],state:f.variables??f.data??(f.entries?Object.fromEntries(f.entries.map(e=>[e.label,e.value])):f.files?{branch:f.branch,files:f.files,commits:f.nodes.length,conflicts:f.conflicts}:f),...(f.memory?{memory:f.memory}:{})}));
  let detailed=!['ml','da'].includes(def.course.id),note='Các trạng thái được tính từ đúng dữ liệu của ví dụ.';
  const custom=[];const push=(caption,state,values,active=[])=>custom.push({caption,state:clone(state),...(values?{values:clone(values)}:{}),active});
  if(def.course.id==='ml'){
    if(key==='baseline'){
      let zero=0,one=0;push('Chưa đọc nhãn nào.',{zero,one},d.labels);
      d.labels.forEach((label,i)=>{label===0?zero++:one++;push('Đọc nhãn ở vị trí '+i+': '+label,{zero,one},d.labels,[i]);});
      push('So hai số đếm; hòa chọn lớp 0.',{zero,one,prediction:output});
    }else if(key==='mean'){
      let total=0;push('Khởi tạo tổng 0.',{total,count:0},d.values);
      d.values.forEach((v,i)=>{total+=v;push('Cộng '+v+' vào tổng.',{total,count:i+1},d.values,[i]);});
      push('Chia tổng cho số phần tử.',{total,count:d.values.length,mean:output});
    }else if(key==='dot'){
      let total=0;push('Ghép các thành phần cùng vị trí.',{a:d.a,b:d.b,total});
      d.a.forEach((v,i)=>{const product=v*d.b[i];total+=product;push(v+' × '+d.b[i]+' = '+product,{index:i,product,total},d.a,[i]);});
    }else if(key==='mse'){
      let squares=0;push('Đối chiếu nhãn thật và dự đoán.',{y:d.y,pred:d.pred});
      d.y.forEach((y,i)=>{const residual=y-d.pred[i],square=residual**2;squares+=square;push('Mẫu '+i+': sai số '+residual+', bình phương '+square,{residual,square,sumSquared:squares});});
      push('Lấy trung bình bình phương sai số.',{sumSquared:squares,count:d.y.length,mse:output});
    }else if(key==='group-mean'){
      const sums={},counts={};push('Mỗi nhóm cần tổng và số lượng riêng.',{sums,counts});
      d.rows.forEach((r,i)=>{sums[r.group]=(sums[r.group]??0)+r.value;counts[r.group]=(counts[r.group]??0)+1;push('Đọc dòng '+i+' vào nhóm '+r.group,{sums,counts});});
      push('Chia tổng mỗi nhóm cho số hàng của chính nhóm ấy.',{means:output});
    }else if(key==='split'){
      push('Bắt đầu từ thứ tự chỉ số được cấp.',{indices:d.indices});
      push('Lấy '+d.trainCount+' chỉ số đầu cho train.',{train:output.train,remaining:d.indices.slice(d.trainCount)});
      push('Lấy tiếp '+d.valCount+' chỉ số cho validation.',{train:output.train,validation:output.validation,remaining:output.test});
      push('Phần còn lại là test; không có chỉ số lặp giữa các tập.',output);
    }else if(key==='impute'){
      const observed=d.train.filter(v=>v!==null);push('Chỉ chọn số đã quan sát ở train.',{observed,train:d.train,test:d.test});
      push('Học mean từ train, chưa dùng test.',{mean:output.mean});
      push('Dùng cùng mean để điền các ô thiếu ở cả hai tập.',output);
    }else if(key==='scale'){
      push('Nhìn hai tập riêng; chỉ train được dùng để fit.',d);
      push('Học mean/std trên train. Cột hằng dùng std=1 theo đề.',{mean:output.mean,std:output.std});
      push('Áp (x−mean)/std, giữ nguyên tham số cho test.',output);
    }else if(key==='confusion'){
      const counts={tp:0,fp:0,fn:0,tn:0};push('Bốn ô bắt đầu bằng 0.',counts);
      const labels=d.y??d.labels??d.y_true;const scores=d.p??d.scores??d.probabilities;
      if(labels&&scores)labels.forEach((y,i)=>{const p=scores[i]>=d.threshold?1:0,k=y===1?p===1?'tp':'fn':p===1?'fp':'tn';counts[k]++;push('Mẫu '+i+': thật '+y+', dự đoán '+p,{index:i,score:scores[i],...counts});});
      push('Tính metric bằng đúng mẫu số từng ô.',output);
    }
  }else if(def.course.id==='da'&&key==='row-count'){
    let count=0;push('Chưa đọc bản ghi nào.',{count});
    d.rows.forEach((row,i)=>{count++;push('Đọc bản ghi '+(i+1)+'.',{row,count});});
  }else if(def.course.id==='linear'&&key==='coordinates'){
    push('Bắt đầu ở gốc tọa độ.',{x:0,y:0});
    push('Đi ngang x='+d.x+'.',{x:d.x,y:0});
    push('Đi dọc y='+d.y+'.',{x:d.x,y:d.y});
    push('Ghi ngang trước, dọc sau.',output);
  }
  if(custom.length){frames=custom;detailed=true;}
  if(!detailed)note='Đây là các mốc đầu vào và đầu ra; phần cách làm ở trên giải thích quy trình, không giả lập những bước nội bộ chưa được mô tả.';
  if(frames.length>80){const all=frames;frames=Array.from(new Set(Array.from({length:80},(_,i)=>Math.round(i*(all.length-1)/79)))).map(i=>all[i]);note+=' Ví dụ dài được rút gọn còn 80 mốc chính.';}
  return{title:def.problems[pid].title,input:d,result:output,frames:finite(frames),detailed,note};
}
