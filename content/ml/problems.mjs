import { random, int } from '../../shared/random.mjs';

export const VERSION = 'ml-2026.10.13-v1';
const mean = a => a.reduce((s,x)=>s+x,0)/a.length;
const median = a => { const b=[...a].sort((x,y)=>x-y), n=b.length; return n%2?b[n>>1]:(b[n/2-1]+b[n/2])/2; };
const variance = a => {const m=mean(a);return mean(a.map(x=>(x-m)**2));};
const dot = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
const distance = (a,b) => a.reduce((s,x,i)=>s+(x-b[i])**2,0);
const sigmoid = x => x>=0?1/(1+Math.exp(-x)):Math.exp(x)/(1+Math.exp(x));
const logsumexp = a => {const m=Math.max(...a);return m+Math.log(a.reduce((s,x)=>s+Math.exp(x-m),0));};
const near = (a,b) => {
  if(typeof a==='number'&&typeof b==='number') return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-7+1e-6*Math.abs(b);
  if(Array.isArray(a)||Array.isArray(b)) return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>near(v,b[i]));
  if(a&&b&&typeof a==='object'&&typeof b==='object') return Object.keys(a).length===Object.keys(b).length&&Object.keys(b).every(k=>Object.hasOwn(a,k)&&near(a[k],b[k]));
  return a===b;
};

// Contracts are deliberately explicit. The checker judges outputs, never source text.
const defs = [
 ['baseline','Dự đoán bằng lớp phổ biến','Cho labels nhị phân. Trả lớp xuất hiện nhiều nhất; hòa chọn 0.','labels có ít nhất một phần tử, mỗi phần tử 0 hoặc 1.','foundation'],
 ['mean','Trung bình bằng Python','Trả trung bình cộng của values.','1–1000 số hữu hạn.','python'],
 ['dot','Tích vô hướng','Trả tổng a[i] × b[i].','Hai vector cùng chiều, 1–20 phần tử.','numpy'],
 ['group-mean','Tóm tắt bảng dữ liệu','Nhóm rows theo group, trả object group -> trung bình value.','group là chuỗi A/B/C; tối đa 1000 dòng.','pandas'],
 ['summary','Thống kê một cột','Trả {mean,median,variance}. variance dùng mẫu số n (ddof=0).','1–1000 số; median trung bình hai phần tử giữa khi n chẵn.','statistics'],
 ['mse','Sai số bình phương trung bình','Trả mean((y[i]-pred[i])²).','y/pred cùng chiều và không rỗng.','loss'],
 ['features','Tách X và y','Với rows, featureNames và targetName, trả {X,y}; giữ thứ tự dòng/cột được chỉ định.','Mọi tên cột tồn tại; không đưa target vào X.','dataset'],
 ['outliers','Nhận diện điểm ngoại lệ','Trả các chỉ số i có values[i] < low hoặc > high. Giá trị bằng ngưỡng không phải ngoại lệ.','low ≤ high; chỉ số bắt đầu 0. Ngưỡng đã được đề cung cấp.','eda'],
 ['split','Chia dữ liệu không chồng lặp','Theo thứ tự indices, lấy trainCount đầu làm train, valCount tiếp làm validation, phần còn lại test. Trả {train,validation,test}.','indices là hoán vị các chỉ số khác nhau; ba tập không rỗng.','split'],
 ['impute','Điền thiếu từ train','Học mean từ các phần tử train khác null; dùng mean đó điền null ở train và test. Trả {mean,train,test}.','Train có ít nhất một số. Tuyệt đối không học mean từ test.','preprocess'],
 ['scale','Chuẩn hóa bằng train','Học mean/std từ train (ddof=0), biến đổi train và test: (x-mean)/std. Nếu std=0 dùng 1. Trả {mean,std,train,test}.','train/test là vector không rỗng; std trả về đã thay 0 bằng 1.','scaling'],
 ['engineer','Tạo đặc trưng từ giỏ hàng','Mỗi row {price,quantity,discount}: trả vector [price*quantity, discount/price].','price>0, quantity≥0, 0≤discount≤price.','features'],
 ['linear','Khớp đường thẳng','Tìm OLS một chiều: slope=sum((x-x̄)(y-ȳ))/sum((x-x̄)²), intercept=ȳ-slope*x̄; trả {slope,intercept,predictions} cho query.','x/y cùng chiều ≥2, x không hằng.','regression'],
 ['gradient','Huấn luyện từng bước','Bắt đầu w,b được cho; lặp steps lần: dự đoán wx+b, dw=2*mean((pred-y)*x), db=2*mean(pred-y), cập nhật đồng thời w-=lr*dw, b-=lr*db. Trả {w,b,loss} cuối.','1≤steps≤50; lr nhỏ; loss là MSE sau cập nhật cuối.','gradient'],
 ['polynomial','Ma trận đặc trưng đa thức','Trả mỗi dòng [1,x,x²,...,x^degree] cho từng x.','0≤degree≤5; thứ tự tăng dần bậc.','polynomial'],
 ['ridge','Co hệ số bằng Ridge','Dữ liệu đã được tâm hóa: trả w=dot(x,y)/(dot(x,x)+alpha).','alpha>0; không thêm hệ số chặn trong bài này.','regularization'],
 ['logistic','Xác suất và ngưỡng','Cho X,weights,bias,threshold. Trả {probabilities,labels}: p=sigmoid(dot(row,weights)+bias), label=1 khi p≥threshold.','0<threshold<1; z trong [-30,30].','classification'],
 ['knn','K láng giềng gần nhất','Với X,y,query,k: chọn k hàng gần nhất theo khoảng cách Euclid; hòa khoảng cách chọn chỉ số nhỏ hơn. Trả nhãn đa số; hòa phiếu chọn 0.','1≤k≤n≤1000; nhãn nhị phân; feature đã cùng thang đo.','knn'],
 ['stump','Đi theo một nhánh cây','Cho x,threshold,leftLabel,rightLabel,query. Trả label cho mỗi giá trị query: ≤ threshold đi trái, còn lại phải.','Nhãn 0/1. x là dữ liệu minh họa không dùng để fit lại threshold.','tree'],
 ['forest','Kết hợp xác suất của rừng','treeProbabilities chứa một xác suất lớp1 cho mỗi cây ở mỗi điểm (mỗi dòng là điểm). Trả {probabilities,labels}: trung bình xác suất từng dòng, label1 khi p>0.5+1e-12, còn lại0. Khoảng rất sát0.5 được coi là hòa để tránh sai khác làm tròn.','Mỗi dòng ít nhất một cây. Đây là bước kết hợp xác suất, không bầu nhãn cứng; bài quy định thêm dung sai hòa1e-12.','forest'],
 ['naive-bayes','Bayes có điều kiện','Cho priors=[p0,p1], likelihoods=[[P(x1|0),...],[P(x1|1),...]]. Tính score=log(prior)+sum(log likelihood); chuẩn hóa bằng log-sum-exp; trả {probabilities,label}. Nếu chênh score tuyệt đối≤1e-12 coi là hòa và chọn0.','Mọi xác suất >0; likelihoods đã tương ứng với feature quan sát; dung sai hòa1e-12 tránh sai khác làm tròn.','bayes'],
 ['hinge','Biên và hinge loss','Trả trung bình max(0,1-y[i]*(dot(X[i],weights)+bias)).','y chỉ -1/+1; dữ liệu không rỗng.','svm'],
 ['confusion','Bảng nhầm lẫn theo ngưỡng','p≥threshold dự đoán 1. Trả {tp,fp,fn,tn,precision,recall,f1,accuracy}. Mẫu số 0 cho metric đó bằng 0.','y nhị phân; p trong [0,1]; 1–1000 hàng.','metrics'],
 ['auc','ROC-AUC qua cặp điểm','Trả tỷ lệ cặp positive/negative mà score positive lớn hơn negative; bằng nhau tính 0.5.','Có ít nhất một mẫu mỗi lớp. Không làm tròn score trước so sánh.','roc'],
 ['metrics','Bốn chỉ số hồi quy','Trả {mae,mse,rmse,r2}. r2=1-SSE/SST. Nếu target hằng: dự đoán hoàn hảo r2=1, còn lại r2=0 (force_finite=True).','Ít nhất hai hàng; r2 có thể âm.','regression-metrics'],
 ['learning-curve','Chẩn đoán đường học','Trả bias nếu trainError≥limit và valError≥limit; variance nếu trainError<limit và valError-trainError≥gap; còn lại balanced.','Quy tắc chỉ dành cho bài mô phỏng; limit,gap>0. Không kết luận nhân quả từ một điểm.','bias-variance'],
 ['folds','Tạo K-fold có thể tái hiện','indices đã được xáo bằng seed. Chia liên tiếp thành k fold, n%k fold đầu có thêm 1 hàng. Trả mảng {train,validation} cho mỗi fold, giữ thứ tự indices.','2≤k≤n≤1000; các chỉ số duy nhất.','cross-validation'],
 ['tuning','Chọn cấu hình trên validation','Cho candidates [{id,scores}]. Trả id có mean scores cao nhất; chênh mean≤1e-12 coi là hòa và chọn id nhỏ nhất theo thứ tự chữ cái ASCII.','Không có score test trong dữ liệu. scores không rỗng.','tuning'],
 ['kmeans','Một lượt K-Means','Gán mỗi point cho centroid gần nhất theo bình phương khoảng cách; hòa chọn chỉ số centroid nhỏ hơn. Cập nhật centroid bằng mean của điểm gán, cụm rỗng giữ tâm cũ. Trả {labels,centroids}.','1≤k≤n≤1000; vector hai chiều. Nhãn và tâm có thể hoán vị đồng thời.','clustering'],
 ['hierarchical','Ghép cụm single-link','Cho points,clusters (mảng chỉ số điểm). Tìm hai cụm có khoảng cách single-link nhỏ nhất. Trả cặp chỉ số cụm [i,j], i<j; hòa chọn cặp từ điển nhỏ nhất.','Ít nhất hai cụm không rỗng, không chồng lặp. Khoảng cách Euclid.','hierarchical'],
 ['dbscan','Cụm theo mật độ','DBSCAN với eps,minSamples. Vùng lân cận gồm chính điểm đó. Duyệt điểm theo chỉ số tăng; mở rộng hàng đợi theo chỉ số tăng. Noise=-1. Trả mảng labels.','Bộ sinh dùng cụm tách rời và noise không nằm ở biên hai cụm. Đổi tên cụm được chấp nhận.','density'],
 ['pca','Chiếu theo trục chính 2D','Tâm hóa points; tìm eigenvector đơn vị của covariance (ddof=0) ứng với eigenvalue lớn nhất. Trả {direction,projections,variance}.','Hai eigenvalue khác nhau. Chấp nhận đảo dấu direction và projections đồng thời. Không scale tự động.','pca'],
 ['preprocess','Pipeline chống leakage','Với train/test là ma trận, điền null bằng mean cột train (cột toàn null dùng 0), rồi học mean/std cột trên train đã điền, std=0 dùng 1. Trả {fill,mean,std,train,test}.','1–1000 hàng,1–20 cột. Không học bất kỳ thống kê nào từ test.','pipeline'],
 ['churn-fit','Dự đoán khách hàng rời đi','Huấn luyện KNN một chiều trên X,y; cho mỗi query chọn k láng giềng theo khoảng cách/chỉ số; p=tỷ lệ label1 trong k; label1 khi p≥threshold. Trả {probabilities,labels}.','Dữ liệu đã tiền xử lý. Thuật toán KNN và cấu hình k/threshold do đề chỉ định, không chọn model khác.','project'],
 ['inference','Giữ thứ tự đặc trưng ở inference','Trả vector cho mỗi record theo featureNames; feature thiếu dùng defaults cùng tên.','defaults có đủ featureNames. Không lấy thứ tự Object.values(record).','inference'],
 ['drift','Đo thay đổi phân phối','Cho train,current,bins=[b0,..,bm]. Đếm histogram từng khoảng [bi,bi+1), khoảng cuối gồm mép phải. Trả {trainCounts,currentCounts,l1}: khoảng cách L1 giữa hai phân phối tần suất.','Mọi giá trị trong miền bins; mỗi vector không rỗng. Chỉ đo covariate shift, chưa chứng minh model kém.','drift'],
 ['boost','Bước sửa residual','Cho y,pred,h,learningRate: trả {residuals:y-pred,predictions:pred+learningRate*h}.','Đây là gradient boosting với squared loss; h là dự đoán cây mới đã cho.','boosting'],
 ['voting','Soft voting có trọng số','Mỗi dòng probabilities chứa p1 của các model. Trả trung bình có trọng số cho mỗi dòng.','weights≥0, tổng>0. Không dùng nhãn cứng.','ensemble'],
 ['selection','Chọn đặc trưng tương quan','Với X,y: tính |Pearson correlation| từng cột; cột hằng hoặc y hằng score=0. Trả top k chỉ số, giảm dần score; chênh score≤1e-12 coi là hòa và chọn chỉ số nhỏ.','Đây là filter trên train; correlation không chứng minh nhân quả.','selection'],
 ['anomaly','Khoảng cách bất thường','Học mean và std (ddof=0) trên train; trả chỉ số current có |z|>threshold; std=0 dùng 1.','threshold>0; giá trị bằng ngưỡng không bị đánh dấu.','anomaly'],
 ['group-split','Giữ nhóm khỏi leakage','Trả {train,test} là chỉ số các dòng groups; test nếu group nằm trong testGroups. Giữ thứ tự gốc.','Một group chỉ ở một tập. testGroups đã được đề chọn trước.','group-validation'],
 ['association','Độ hỗ trợ và tin cậy','Với baskets,A,B: support=count chứa cả A,B/n; confidence=count chứa cả/count chứa A (0 nếu mẫu số0); lift=confidence/(count chứa B/n), 0 nếu countB=0. Trả {support,confidence,lift}.','A≠B; mỗi giỏ là tập item, n≥1. Đây là liên hệ thống kê.','recommendation'],
 ['neuron','Một nơ-ron ReLU','Trả max(0,dot(x,weights)+bias).','Vector1–20chiều; không yêu cầu huấn luyện mạng lớn.','neural-network'],
 ['attention','Một đầu self-attention','Cho Q,K,V ma trận: logits=QKᵀ/sqrt(dk); softmax theo hàng, nhân V. Trả ma trận output.','1–20 token; dk>0; dùng softmax ổn định; không causal mask trong bài.','transformer'],
 ['retrieval','Truy xuất embedding','Tính cosine(query,row) cho mỗi vector, vector0 có similarity0. Trả top k chỉ số giảm dần cosine; chênh cosine≤1e-12 coi là hòa và chọn chỉ số nhỏ.','1≤k≤n≤1000; cosine có thể âm. Đây là truy xuất, không phải kiểm chứng sự thật.','rag'],
 ['token-budget','Giữ context theo ngân sách','Cho costs,limit,reserved: giữ nhiều tin nhắn gần nhất liên tiếp có tổng chi phí ≤limit-reserved; duyệt từ cuối tới khi tin tiếp theo không vừa. Trả chỉ số tăng dần.','Mọi cost≥1; 0≤reserved≤limit. Chi phí token đã được tokenizer cung cấp.','llm'],
 ['schema','Kiểm tra payload inference','Trả true nếu record có chính xác keys featureNames và tất cả value là number hữu hạn; false nếu thiếu/thừa/sai kiểu.','Không chấp nhận null/chuỗi/bool thay số.','mlops'],
 ['bellman','Một cập nhật Bellman','Trả reward+gamma*max(nextQ) nếu chưa terminal; terminal trả reward.','0≤gamma≤1; nextQ không rỗng.','reinforcement'],
];
export const problemIds = defs.map(x=>'ml-'+x[0]);

function confusion(d) {
 let tp=0,fp=0,fn=0,tn=0;
 d.y.forEach((y,i)=>{const p=d.p[i]>=d.threshold;if(y&&p)tp++;else if(!y&&p)fp++;else if(y)fn++;else tn++;});
 const precision=tp+fp?tp/(tp+fp):0,recall=tp+fn?tp/(tp+fn):0;
 return {tp,fp,fn,tn,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0,accuracy:(tp+tn)/d.y.length};
}
function knn(d,q) {
 const ids=d.X.map((x,i)=>[distance(x,q),i]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).slice(0,d.k).map(x=>x[1]);
 return ids.reduce((s,i)=>s+d.y[i],0)/d.k;
}
function preprocess(d) {
 const n=d.train[0].length;
 const fill=Array.from({length:n},(_,j)=>{const v=d.train.map(r=>r[j]).filter(x=>x!==null);return v.length?mean(v):0;});
 const filled=d.train.map(r=>r.map((x,j)=>x===null?fill[j]:x));
 const means=Array.from({length:n},(_,j)=>mean(filled.map(r=>r[j])));
 const std=Array.from({length:n},(_,j)=>Math.sqrt(variance(filled.map(r=>r[j])))||1);
 const transform=rows=>rows.map(r=>r.map((x,j)=>((x===null?fill[j]:x)-means[j])/std[j]));
 return {fill,mean:means,std,train:transform(d.train),test:transform(d.test)};
}
function pca(d) {
 const mx=mean(d.points.map(p=>p[0])),my=mean(d.points.map(p=>p[1]));
 const centered=d.points.map(p=>[p[0]-mx,p[1]-my]);
 const a=mean(centered.map(p=>p[0]**2)),b=mean(centered.map(p=>p[0]*p[1])),c=mean(centered.map(p=>p[1]**2));
 const angle=0.5*Math.atan2(2*b,a-c),direction=[Math.cos(angle),Math.sin(angle)];
 return {direction,projections:centered.map(p=>dot(p,direction)),variance:(a+c+Math.sqrt((a-c)**2+4*b*b))/2};
}
function dbscan(d) {
 const labels=Array(d.points.length).fill(-2), neighbors=i=>d.points.map((p,j)=>distance(d.points[i],p)<=d.eps*d.eps+1e-12?j:-1).filter(j=>j>=0);
 let cluster=0;
 for(let i=0;i<labels.length;i++) {
  if(labels[i]!==-2)continue;const nb=neighbors(i);if(nb.length<d.minSamples){labels[i]=-1;continue;}
  labels[i]=cluster;const queue=[...nb],seen=new Set(queue);
  for(let k=0;k<queue.length;k++){const j=queue[k];if(labels[j]===-1)labels[j]=cluster;if(labels[j]!==-2)continue;labels[j]=cluster;const more=neighbors(j);if(more.length>=d.minSamples)for(const v of more)if(!seen.has(v)){queue.push(v);seen.add(v);}}
  cluster++;
 }
 return labels;
}
export function oracle(id,d) {
 switch(id.replace(/^ml-/,'')) {
  case 'baseline': return d.labels.filter(x=>x===1).length>d.labels.length/2?1:0;
  case 'mean': return mean(d.values);
  case 'dot': return dot(d.a,d.b);
  case 'group-mean': {const groups={};for(const r of d.rows)(groups[r.group]??=[]).push(r.value);return Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,mean(v)]));}
  case 'summary': return {mean:mean(d.values),median:median(d.values),variance:variance(d.values)};
  case 'mse': return mean(d.y.map((y,i)=>(y-d.pred[i])**2));
  case 'features': return {X:d.rows.map(r=>d.featureNames.map(n=>r[n])),y:d.rows.map(r=>r[d.targetName])};
  case 'outliers': return d.values.map((x,i)=>x<d.low||x>d.high?i:-1).filter(i=>i>=0);
  case 'split': return {train:d.indices.slice(0,d.trainCount),validation:d.indices.slice(d.trainCount,d.trainCount+d.valCount),test:d.indices.slice(d.trainCount+d.valCount)};
  case 'impute': {const m=mean(d.train.filter(x=>x!==null));return {mean:m,train:d.train.map(x=>x===null?m:x),test:d.test.map(x=>x===null?m:x)};}
  case 'scale': {const m=mean(d.train),s=Math.sqrt(variance(d.train))||1;return {mean:m,std:s,train:d.train.map(x=>(x-m)/s),test:d.test.map(x=>(x-m)/s)};}
  case 'engineer': return d.rows.map(r=>[r.price*r.quantity,r.discount/r.price]);
  case 'linear': {const mx=mean(d.x),my=mean(d.y),w=d.x.reduce((s,x,i)=>s+(x-mx)*(d.y[i]-my),0)/d.x.reduce((s,x)=>s+(x-mx)**2,0),b=my-w*mx;return {slope:w,intercept:b,predictions:d.query.map(x=>w*x+b)};}
  case 'gradient': {let w=d.w,b=d.b;for(let k=0;k<d.steps;k++){const e=d.x.map((x,i)=>w*x+b-d.y[i]),dw=2*mean(e.map((v,i)=>v*d.x[i])),db=2*mean(e);w-=d.lr*dw;b-=d.lr*db;}return {w,b,loss:mean(d.x.map((x,i)=>(w*x+b-d.y[i])**2))};}
  case 'polynomial': return d.x.map(x=>Array.from({length:d.degree+1},(_,j)=>x**j));
  case 'ridge': return dot(d.x,d.y)/(dot(d.x,d.x)+d.alpha);
  case 'logistic': {const probabilities=d.X.map(x=>sigmoid(dot(x,d.weights)+d.bias));return {probabilities,labels:probabilities.map(p=>p>=d.threshold?1:0)};}
  case 'knn': return knn(d,d.query)>0.5?1:0;
  case 'stump': return d.query.map(x=>x<=d.threshold?d.leftLabel:d.rightLabel);
  case 'forest': {const probabilities=d.treeProbabilities.map(mean);return {probabilities,labels:probabilities.map(x=>x>0.5+1e-12?1:0)};}
  case 'naive-bayes': {const scores=d.priors.map((p,i)=>Math.log(p)+d.likelihoods[i].reduce((s,x)=>s+Math.log(x),0)),normal=logsumexp(scores),probabilities=scores.map(s=>Math.exp(s-normal));return {probabilities,label:scores[1]-scores[0]>1e-12?1:0};}
  case 'hinge': return mean(d.X.map((x,i)=>Math.max(0,1-d.y[i]*(dot(x,d.weights)+d.bias))));
  case 'confusion': return confusion(d);
  case 'auc': {const positive=d.scores.filter((_,i)=>d.y[i]===1),negative=d.scores.filter((_,i)=>d.y[i]===0);let wins=0;for(const p of positive)for(const n of negative)wins+=p>n?1:p===n?0.5:0;return wins/(positive.length*negative.length);}
  case 'metrics': {const errors=d.y.map((y,i)=>y-d.pred[i]),mse=mean(errors.map(x=>x*x)),sst=d.y.reduce((s,y)=>s+(y-mean(d.y))**2,0),sse=errors.reduce((s,x)=>s+x*x,0);return {mae:mean(errors.map(Math.abs)),mse,rmse:Math.sqrt(mse),r2:sst===0?(sse===0?1:0):1-sse/sst};}
  case 'learning-curve': return d.trainError>=d.limit&&d.valError>=d.limit?'bias':d.trainError<d.limit&&d.valError-d.trainError>=d.gap?'variance':'balanced';
  case 'folds': {let off=0;return Array.from({length:d.k},(_,i)=>{const count=Math.floor(d.indices.length/d.k)+(i<d.indices.length%d.k?1:0),validation=d.indices.slice(off,off+count);off+=count;return {train:d.indices.filter(x=>!validation.includes(x)),validation};});}
  case 'tuning': return [...d.candidates].sort((a,b)=>Math.abs(mean(b.scores)-mean(a.scores))<=1e-12?(a.id<b.id?-1:a.id>b.id?1:0):mean(b.scores)-mean(a.scores))[0].id;
  case 'kmeans': {const labels=d.points.map(p=>d.centroids.map((c,i)=>[distance(p,c),i]).sort((a,b)=>a[0]-b[0]||a[1]-b[1])[0][1]);const centroids=d.centroids.map((c,i)=>{const rows=d.points.filter((_,j)=>labels[j]===i);return rows.length?c.map((_,j)=>mean(rows.map(r=>r[j]))):c;});return {labels,centroids};}
  case 'hierarchical': {let best=null;for(let i=0;i<d.clusters.length;i++)for(let j=i+1;j<d.clusters.length;j++){let dist=Infinity;for(const a of d.clusters[i])for(const b of d.clusters[j])dist=Math.min(dist,distance(d.points[a],d.points[b]));if(!best||dist<best[0])best=[dist,i,j];}return best.slice(1);}
  case 'dbscan': return dbscan(d);
  case 'pca': return pca(d);
  case 'preprocess': return preprocess(d);
  case 'churn-fit': {const probabilities=d.query.map(q=>knn(d,q));return {probabilities,labels:probabilities.map(p=>p>=d.threshold?1:0)};}
  case 'inference': return d.records.map(r=>d.featureNames.map(n=>Object.hasOwn(r,n)?r[n]:d.defaults[n]));
  case 'drift': {const hist=a=>d.bins.slice(1).map((hi,j)=>a.filter(x=>x>=d.bins[j]&&(j===d.bins.length-2?x<=hi:x<hi)).length),trainCounts=hist(d.train),currentCounts=hist(d.current);return {trainCounts,currentCounts,l1:trainCounts.reduce((s,x,i)=>s+Math.abs(x/d.train.length-currentCounts[i]/d.current.length),0)};}
  case 'boost': return {residuals:d.y.map((y,i)=>y-d.pred[i]),predictions:d.pred.map((p,i)=>p+d.learningRate*d.h[i])};
  case 'voting': return d.probabilities.map(p=>dot(p,d.weights)/d.weights.reduce((s,x)=>s+x,0));
  case 'selection': {const ym=mean(d.y),sy=d.y.reduce((s,y)=>s+(y-ym)**2,0),scores=d.X[0].map((_,j)=>{const x=d.X.map(r=>r[j]),xm=mean(x),sx=x.reduce((s,a)=>s+(a-xm)**2,0);return sx&&sy?Math.abs(x.reduce((s,a,i)=>s+(a-xm)*(d.y[i]-ym),0)/Math.sqrt(sx*sy)):0;});return scores.map((s,i)=>[s,i]).sort((a,b)=>Math.abs(b[0]-a[0])<=1e-12?a[1]-b[1]:b[0]-a[0]).slice(0,d.k).map(x=>x[1]);}
  case 'anomaly': {const m=mean(d.train),s=Math.sqrt(variance(d.train))||1;return d.current.map((x,i)=>Math.abs((x-m)/s)>d.threshold?i:-1).filter(i=>i>=0);}
  case 'group-split': return {train:d.groups.map((g,i)=>!d.testGroups.includes(g)?i:-1).filter(i=>i>=0),test:d.groups.map((g,i)=>d.testGroups.includes(g)?i:-1).filter(i=>i>=0)};
  case 'association': {const a=d.baskets.filter(x=>x.includes(d.A)).length,b=d.baskets.filter(x=>x.includes(d.B)).length,ab=d.baskets.filter(x=>x.includes(d.A)&&x.includes(d.B)).length,confidence=a?ab/a:0;return {support:ab/d.baskets.length,confidence,lift:b?confidence/(b/d.baskets.length):0};}
  case 'neuron': return Math.max(0,dot(d.x,d.weights)+d.bias);
  case 'attention': return d.Q.map(q=>{const logits=d.K.map(k=>dot(q,k)/Math.sqrt(q.length)),z=logsumexp(logits),weights=logits.map(x=>Math.exp(x-z));return d.V[0].map((_,j)=>weights.reduce((s,w,i)=>s+w*d.V[i][j],0));});
  case 'retrieval': {const cosine=x=>{const norm=Math.sqrt(dot(x,x)*dot(d.query,d.query));return norm?dot(x,d.query)/norm:0;};return d.vectors.map((x,i)=>[cosine(x),i]).sort((a,b)=>Math.abs(b[0]-a[0])<=1e-12?a[1]-b[1]:b[0]-a[0]).slice(0,d.k).map(x=>x[1]);}
  case 'token-budget': {let budget=d.limit-d.reserved,answer=[];for(let i=d.costs.length-1;i>=0;i--){if(d.costs[i]>budget)break;budget-=d.costs[i];answer.unshift(i);}return answer;}
  case 'schema': return Object.keys(d.record).length===d.featureNames.length&&d.featureNames.every(n=>Object.hasOwn(d.record,n)&&typeof d.record[n]==='number'&&Number.isFinite(d.record[n]));
  case 'bellman': return d.terminal?d.reward:d.reward+d.gamma*Math.max(...d.nextQ);
  default: throw new Error('Bài ML không tồn tại: '+id);
 }
}

export function generateInput(id,seed=0) {
 const r=random(String(seed)+':'+id),variant=int(r,0,999),n=int(r,3,12),v=()=>int(r,-8,15),arr=(m=n)=>Array.from({length:m},v),positive=()=>int(r,1,20),p=()=>int(r,1,9)/10;
 const vals=arr(),x=Array.from({length:n},(_,i)=>i-2),y=x.map(t=>2*t+1+int(r,-1,1));
 switch(id.replace(/^ml-/,'')) {
  case 'baseline': return {labels:Array.from({length:n},()=>int(r,0,1))};
  case 'mean':case 'summary': return {values:vals};
  case 'dot': return {a:arr(3),b:arr(3)};
  case 'group-mean': return {rows:vals.map((value,i)=>({group:['A','B','C'][i%3],value}))};
  case 'mse':case 'metrics': return {y:vals,pred:vals.map(t=>t+int(r,-4,4))};
  case 'features': return {rows:vals.map((t,i)=>({age:20+i,monthly:t+20,churn:i%2})),featureNames:variant%2?['age','monthly']:['monthly','age'],targetName:'churn'};
  case 'outliers': return {values:[-5,...vals,20],low:-4,high:12};
  case 'split': {const indices=Array.from({length:n+3},(_,i)=>i).sort(()=>0);for(let i=indices.length-1;i>0;i--){const j=int(r,0,i);[indices[i],indices[j]]=[indices[j],indices[i]];}return {indices,trainCount:n,valCount:1};}
  case 'impute': return {train:[null,...vals,null],test:[100+positive(),null,v()]};
  case 'scale': return {train:variant%9===0?Array(n).fill(v()):vals,test:[100+positive(),v()]};
  case 'engineer': return {rows:vals.map((_,i)=>({price:10+i,quantity:int(r,0,5),discount:int(r,0,8)}))};
  case 'linear': return {x,y,query:[-3,0,n+2]};
  case 'gradient': return {x:[0,1,2,3],y:[1,3,5,7],w:v()/10,b:v()/10,steps:int(r,1,20),lr:int(r,1,5)/100};
  case 'polynomial': return {x:arr(4),degree:int(r,0,5)};
  case 'ridge': return {x:[-2,-1,0,1,2],y:[-4,-2,0,2,4],alpha:positive()};
  case 'logistic': return {X:Array.from({length:n},()=>[v()/5,v()/5]),weights:[p(),-p()],bias:v()/5,threshold:[0.3,0.5,0.7][int(r,0,2)]};
  case 'knn':case 'churn-fit': return {X:Array.from({length:n},(_,i)=>[i/2]),y:Array.from({length:n},(_,i)=>i>=Math.floor(n/2)?1:0),query:id==='ml-knn'?[p()*n]:[[0],[n/3],[n]],k:int(r,1,Math.min(5,n)),threshold:[0.3,0.5,0.7][int(r,0,2)]};
  case 'stump': return {x:vals,threshold:v(),leftLabel:0,rightLabel:1,query:vals};
  case 'forest': return {treeProbabilities:Array.from({length:n},()=>[p(),p(),p()])};
  case 'naive-bayes': return {priors:[0.4,0.6],likelihoods:[[p(),p(),p()],[p(),p(),p()]]};
  case 'hinge': return {X:Array.from({length:n},()=>[v()/5,v()/5]),y:Array.from({length:n},()=>int(r,0,1)?1:-1),weights:[p(),-p()],bias:0.2};
  case 'confusion': return {y:Array.from({length:n},()=>int(r,0,1)),p:Array.from({length:n},p),threshold:[0.3,0.5,0.7][int(r,0,2)]};
  case 'auc': return {y:[0,1,...Array.from({length:n},()=>int(r,0,1))],scores:Array.from({length:n+2},p)};
  case 'learning-curve': return {trainError:p(),valError:p(),limit:0.5,gap:0.3};
  case 'folds': return {indices:Array.from({length:n},(_,i)=>n-i-1),k:int(r,2,Math.min(5,n))};
  case 'tuning': return {candidates:['a','b','c'].map(id=>({id,scores:[p(),p(),p()]}))};
  case 'kmeans': return {points:Array.from({length:n},()=>[v()/3,v()/3]),centroids:[[-2,-2],[3,3]]};
  case 'hierarchical': return {points:Array.from({length:5},()=>[v(),v()]),clusters:[[0],[1,2],[3,4]]};
  case 'dbscan': return {points:[[0,0],[0.1,0],[0,0.1],[5,5],[5.1,5],[5,5.1],[10+positive(),-10]],eps:0.2+p()/10,minSamples:3};
  case 'pca': return {points:Array.from({length:n},(_,i)=>[i+v()/20,2*i+v()/20])};
  case 'preprocess': return {train:vals.map((t,i)=>[i%3===0?null:t,i%2===0?null:3]),test:[[100,null],[null,v()],[v(),v()]]};
  case 'inference': return {featureNames:['tenure','monthly'],defaults:{tenure:0,monthly:30},records:[{monthly:60,tenure:12},{monthly:20},{tenure:2,monthly:25}]};
  case 'drift': return {train:Array.from({length:n},()=>int(r,0,20)),current:Array.from({length:n+2},()=>int(r,0,20)),bins:[0,5,10,15,20]};
  case 'boost': return {y:vals,pred:vals.map(t=>t+2),h:arr(),learningRate:p()};
  case 'voting': return {probabilities:Array.from({length:n},()=>[p(),p(),p()]),weights:[1,2,3]};
  case 'selection': return {X:x.map((t,i)=>[t,v(),4]),y,k:2};
  case 'anomaly': return {train:vals,current:[0,100,-100,v()],threshold:2};
  case 'group-split': return {groups:vals.map((_,i)=>['u1','u2','u3'][i%3]),testGroups:['u2']};
  case 'association': return {baskets:Array.from({length:n},()=>['tea','milk','bread'].filter(()=>r()>0.4)),A:'tea',B:'milk'};
  case 'neuron': return {x:arr(3),weights:[p(),-p(),p()],bias:v()};
  case 'attention': return {Q:[[p(),p()],[p(),p()]],K:[[p(),p()],[p(),p()]],V:[[v(),v()],[v(),v()]]};
  case 'retrieval': return {query:[1,1,0],vectors:[[0,0,0],...Array.from({length:n},()=>arr(3))],k:3};
  case 'token-budget': return {costs:Array.from({length:n},positive),limit:int(r,20,70),reserved:10};
  case 'schema': return {featureNames:['age','monthly'],record:variant%3===0?{age:24,monthly:'30'}:variant%3===1?{age:24,monthly:30,other:1}:{monthly:30,age:24}};
  case 'bellman': return {reward:v(),gamma:0.9,nextQ:arr(4),terminal:variant%4===0};
  default: throw new Error('Bài ML không tồn tại: '+id);
 }
}

function equivalentLabels(actual,expected,noise=false) {
 if(!Array.isArray(actual)||actual.length!==expected.length||actual.some(x=>!Number.isInteger(x)))return false;
 const forward=new Map(),backward=new Map();
 return actual.every((label,i)=>{const e=expected[i];if(noise&&(e===-1||label===-1))return e===label;if(label<0)return false;if(forward.has(label)&&forward.get(label)!==e||backward.has(e)&&backward.get(e)!==label)return false;forward.set(label,e);backward.set(e,label);return true;});
}
export function checkOutput(id,input,output) {
 try {
  const expected=oracle(id,input);
  if(id==='ml-dbscan')return equivalentLabels(output,expected,true);
  if(id==='ml-pca')return near(output,expected)||near(output,{...expected,direction:expected.direction.map(x=>-x),projections:expected.projections.map(x=>-x)});
  if(id==='ml-kmeans') {
   if(!output||!equivalentLabels(output.labels,expected.labels)||!Array.isArray(output.centroids)||output.centroids.length!==expected.centroids.length)return false;
   const mapping=new Map(output.labels.map((v,i)=>[v,expected.labels[i]]));
   if([...mapping.keys()].some(k=>k<0||k>=output.centroids.length))return false;
   const unusedActual=output.centroids.map((_,i)=>i).filter(i=>!mapping.has(i)),unusedExpected=expected.centroids.map((_,i)=>i).filter(i=>![...mapping.values()].includes(i));
   return [...mapping].every(([a,e])=>near(output.centroids[a],expected.centroids[e]))&&unusedActual.every(a=>{const ix=unusedExpected.findIndex(e=>near(output.centroids[a],expected.centroids[e]));if(ix<0)return false;unusedExpected.splice(ix,1);return true;});
  }
  return near(output,expected);
 } catch { return false; }
}

export const edgeInputs = {
 'ml-baseline':[{labels:[0,1]},{labels:[1]},{labels:[0]}],
 'ml-summary':[{values:[2,4]},{values:[5,5,5]}],
 'ml-mse':[{y:[0],pred:[0]},{y:[-2],pred:[2]}],
 'ml-impute':[{train:[null,2,null],test:[100,null]},{train:[-4,4,null],test:[null]}],
 'ml-scale':[{train:[4,4],test:[4,8]}],
 'ml-logistic':[{X:[[0],[1]],weights:[0],bias:0,threshold:0.5}],
 'ml-knn':[{X:[[0],[2]],y:[0,1],query:[1],k:1},{X:[[0],[1]],y:[0,1],query:[0],k:2}],
 'ml-forest':[{treeProbabilities:[[0.49,0.49,0.99],[0.5,0.5],[0.01]]}],
 'ml-confusion':[{y:[0,0],p:[0,0.1],threshold:0.5},{y:[1,0],p:[0.5,0.5],threshold:0.5}],
 'ml-auc':[{y:[0,1],scores:[0.5,0.5]},{y:[0,1],scores:[1,0]}],
 'ml-metrics':[{y:[0,1],pred:[100,100]},{y:[3,3],pred:[3,3]},{y:[3,3],pred:[4,4]}],
 'ml-kmeans':[{points:[[0,0],[2,0]],centroids:[[0,0],[100,100]]},{points:[[0,0]],centroids:[[-1,0],[1,0]]}],
 'ml-dbscan':[{points:[[0,0],[1,0]],eps:1,minSamples:2},{points:[[0,0]],eps:1,minSamples:2}],
 'ml-pca':[{points:[[-2,0],[0,0],[2,0]]},{points:[[0,-2],[0,0],[0,2]]}],
 'ml-preprocess':[{train:[[null,4],[null,4]],test:[[100,null]]}],
 'ml-churn-fit':[{X:[[0],[2]],y:[0,1],query:[[1]],k:2,threshold:0.5}],
 'ml-token-budget':[{costs:[5,30],limit:20,reserved:10},{costs:[10],limit:10,reserved:10}],
 'ml-schema':[{featureNames:['x'],record:{x:null}},{featureNames:['x'],record:{x:true}},{featureNames:['x'],record:{x:0}}],
};
export function testsFor(id,seed,opts={}) {
 const publicOnly=typeof opts==='boolean'?opts:!!opts.publicOnly;
 const examples=[0,1].map(n=>({name:'Ví dụ '+(n+1),input:generateInput(id,'sample-'+n),group:'sample'}));
 if(publicOnly)return examples;
 const edges=(edgeInputs[id]||[]).map((input,i)=>({name:'Trường hợp biên '+(i+1),input,group:'edge'}));
 const randomTests=Array.from({length:8},(_,i)=>({name:'Dữ liệu '+(i+1),input:generateInput(id,String(seed)+':'+i),group:'random'}));
 return [...examples,...edges,...randomTests].map(t=>({...t,expected:oracle(id,t.input)}));
}
export const problems=Object.fromEntries(defs.map(([key,title,statement,constraints,skill])=>{
 const id='ml-'+key,sampleInput=generateInput(id,0);
 return [id,{id,title,statement,constraints,skill,version:VERSION,sampleInput,sampleOutput:oracle(id,sampleInput),runtime:'ml-python',packages:key==='group-mean'?['pandas']:['numpy'],hints:['Vẽ một ví dụ nhỏ, phân biệt dữ liệu train với dữ liệu cần dự đoán.','Dùng biến rõ tên hoặc NumPy; giữ nguyên thứ tự dòng và xử lý giá trị biên theo đặc tả.','Thực hiện đúng công thức trong hợp đồng đầu ra; thử test hằng, hòa và dữ liệu khác ví dụ.']}];
}));
export function problemDetails(id,language='python') {
 const p=problems[id];if(!p)return null;
 return {...p,description:p.statement,contract:p.constraints,language,languages:['python'],starter:'def solve(data):\n    # Đọc đề và trả một giá trị có thể chuyển sang JSON.\n    # Nếu dùng NumPy: chuyển ndarray bằng .tolist().\n    pass\n',starters:{python:'def solve(data):\n    pass\n'},examples:testsFor(id,0,true).map(t=>({input:t.input,output:oracle(id,t.input)})),tolerance:{absolute:1e-7,relative:1e-6}};
}
export const mathHelpers={mean,median,variance,dot,near};
