import { random, int } from '../../shared/random.mjs';
import {sqlStarter} from './solutions.mjs';
export const VERSION='da-2026.10.13-v1';
const sum=v=>v.reduce((a,b)=>a+b,0),mean=v=>sum(v)/v.length;
const median=v=>{const a=[...v].sort((x,y)=>x-y),n=a.length;return n%2?a[n>>1]:(a[n/2-1]+a[n/2])/2;};
export const quantile=(v,p)=>{const a=[...v].sort((x,y)=>x-y),h=(a.length-1)*p,i=Math.floor(h);return a[i]+(a[Math.min(i+1,a.length-1)]-a[i])*(h-i);};
const defs=[
 ['row-count','Đếm bản ghi','Trả số phần tử trong rows. Một hàng là một bản ghi, không phải một cột.','rows có 0–1000 hàng.','dataset'],
 ['mean','Trung bình một cột','Trả trung bình values. Không làm tròn kết quả trong hàm.','values gồm 1–1000 số hữu hạn.','statistics'],
 ['sum','Tổng doanh thu','Trả tổng quantity × price của mỗi dòng rows.','quantity,price là số không âm; rows có thể rỗng.','spreadsheet'],
 ['conditional','Tính tổng có điều kiện','Trả tổng value của rows có region bằng region chỉ định và value ≥ threshold.','Region so khớp chính xác; ngưỡng bao gồm dấu bằng.','spreadsheet'],
 ['lookup','Tra cứu khớp chính xác','Cho rows có key,value và queries. Trả value của dòng khớp key đầu tiên; không tìm thấy trả null.','Nếu key trùng, giữ dòng xuất hiện đầu tiên.','lookup'],
 ['pivot','Bảng chéo khu vực và sản phẩm','Trả {regions,products,values}: regions/products là các nhãn xuất hiện được sắp ASCII tăng; values[i][j] tổng value cho cặp nhãn, ô vắng bằng0.','Không tự thêm khu vực/sản phẩm ngoài đầu vào.','pivot'],
 ['where','Lọc và chọn cột','Trả id của rows có value ≥ threshold và region bằng region, giữ thứ tự đầu vào.','Không sắp lại khi chưa có ORDER BY.','sql-select'],
 ['distinct','Các giá trị duy nhất','Trả các chuỗi values khác nhau, sắp theo ASCII tăng.','Chuỗi phân biệt hoa thường trong hợp đồng bài.','sql-select'],
 ['topk','Sắp xếp và lấy Top K','Trả id của k dòng đầu khi sắp value giảm; bằng value thì id tăng.','id số nguyên duy nhất; 0 ≤ k ≤ số hàng.','sql-select'],
 ['aggregate','COUNT và AVG khi có missing','Trả {rows,nonNull,sum,mean}: rows đếm tất cả phần tử; nonNull chỉ đếm số; sum là tổng số, mean trung bình số. Không có số: sum/mean=null.','values là số hoặc null. COUNT(*) khác COUNT(column).','sql-group'],
 ['group','Tổng theo nhóm','Trả object ánh xạ region → tổng value. Chỉ có nhóm thực sự xuất hiện.','rows rỗng trả {}; region là chuỗi ASCII.','sql-group'],
 ['having','Lọc sau khi tổng hợp','Tổng value theo region, chỉ giữ nhóm có tổng ≥ threshold, trả object region → tổng.','WHERE lọc dòng; bài này dùng HAVING sau GROUP BY.','sql-group'],
 ['inner-join','Ghép bảng khi có khóa khớp','Trả [{id,name}] cho mỗi dòng left ghép right theo left.key=right.key; duyệt left trước rồi right. Dòng không khớp bị bỏ.','Khóa có thể trùng, mỗi cặp khớp tạo một dòng.','join'],
 ['left-join','Giữ tất cả dòng bên trái','Như inner-join, nhưng dòng left không khớp tạo {id,name:null}.','Giữ thứ tự left rồi thứ tự right; không làm mất dòng chưa ghép.','join'],
 ['case','Phân loại có điều kiện','Trả nhãn mỗi value: High nếu ≥high; Medium nếu ≥low; còn lại Low.','low < high; thứ tự nhánh từ cao xuống thấp.','sql-case'],
 ['running','Tổng lũy kế theo thứ tự','Sắp rows theo day tăng rồi id tăng; trả [{id,total}] với total là tổng value tới dòng hiện tại.','Đây là ROWS UNBOUNDED PRECEDING; id phá hòa ngày.','window'],
 ['rank','Ba cách đánh số thứ hạng','Sắp rows value giảm,id tăng rồi trả [{id,rowNumber,rank,denseRank}]. Rank/denseRank xét chỉ value; rowNumber xét thứ tự đã sắp.','id duy nhất; các value bằng nhau dùng chung rank/denseRank.','window'],
 ['summary','Tóm tắt phân phối','Trả {mean,median,variance,range}; variance dùng ddof=0 (chia n).','values không rỗng; không làm tròn.','statistics'],
 ['quartile','Phân vị và hàng rào IQR','Trả {q1,q3,indices}; percentile linear với h=(n−1)p; đánh dấu giá trị <q1−1.5IQR hoặc >q3+1.5IQR.','Không xóa ngoại lệ tự động; dấu bằng hàng rào không bị đánh dấu.','statistics'],
 ['correlation','Tương quan Pearson','Trả Pearson correlation giữa x,y; nếu một dãy hằng trả null vì tương quan không xác định.','Hai dãy cùng độ dài ≥2; tương quan không chứng minh nhân quả.','correlation'],
 ['missing','Điền thiếu theo quy tắc','Trả values sau khi thay null bằng median của số đang có; toàn null dùng fallback.','Không thay0 bằng missing; values có thể rỗng.','cleaning'],
 ['dedup','Loại bản ghi trùng theo khóa','Trả rows giữ lần xuất hiện đầu tiên của mỗi id, giữ thứ tự đầu vào.','Hai dòng cùng id được xem là trùng theo hợp đồng; không xóa khách hàng mua nhiều đơn khác nhau.','cleaning'],
 ['clean-orders','Làm sạch đơn hàng có kiểm toán','Trả {rows,rejected,duplicates}. Duyệt thứ tự: id xuất hiện lần đầu được ghi nhận; lần sau tăng duplicates và bỏ. Dòng đầu của id thiếu quantity/price, số âm, region không nằm North/South/East hoặc month không nằm2026-01/02/03 bị loại và id vào rejected. Hợp lệ giữ {id,region,month,quantity,price,revenue:quantity*price}.','id nguyên≥0, chỉ các field theo schema. null là thiếu,0 là hợp lệ. Không suy đoán ngày/giá và không giữ bản sao sau để chữa dòng đầu sai.','cleaning'],
 ['kpi','KPI tổng và theo khu vực','Với rows sạch, trả {revenue,orders,averageOrder,byRegion}; revenue tổng revenue; orders số dòng; averageOrder=revenue/orders hoặc0 nếu rỗng; byRegion ánh xạ region → {orders,revenue}.','Một dòng sạch là một đơn. Không lấy trung bình các trung bình nhóm.','kpi'],
 ['chart-series','Dữ liệu cho biểu đồ theo tháng','Cho rows sạch, months tăng dần được chỉ định. Trả [{month,revenue,orders}] cho mọi month trong months, kể cả tháng không có đơn(0).','Chỉ đếm rows có month trong months; giữ thứ tự months.','visualization'],
 ['growth','Tăng trưởng có baseline','Cho previous,current trả (current−previous)/previous; previous=0 trả null.','Kết quả là tỷ lệ,0.2 nghĩa20%; không chia cho current.','kpi'],
 ['weighted','Trung bình có trọng số','Trả sum(value×weight)/sum(weight); tổng weight=0 trả null.','weights không âm,cùng độ dài values.','statistics'],
 ['cohort','Tỷ lệ giữ chân theo nhóm','Cho users [{id,cohort,active}] duy nhấtid. Trả cohort → {total,active,rate}, active boolean; rate=active/total.','Nhóm được định nghĩa theo thời điểm gia nhập, không gộp tất cả thành một tỷ lệ.','cohort'],
 ['ab','So sánh tỷ lệ hai nhóm','Cho successA,totalA,successB,totalB trả {rateA,rateB,difference}, difference=rateB−rateA.','Totals>0; đây là mô tả, chưa kết luận ý nghĩa thống kê hay nhân quả.','experiment'],
 ['privacy','Giảm định danh trong dữ liệu','Trả mỗi row chỉ có region,value, bỏ name,email,id và các trường khác.','Loại định danh trực tiếp chưa đảm bảo ẩn danh tuyệt đối.','privacy'],
 ['quality','Báo cáo chất lượng cột','Cho values số hoặcnull trả {total,missing,negative,valid}: valid là số ≥0, negative là số<0.','0 là giá trị hợp lệ; missing không được tínhnegative.','quality'],
 ['full-join','Ghép ngoài toàn phần','Như left-join; thêm mọi dòng right chưa khớp dưới dạng {id:null,name}; thứ tự các dòng thêm theo right.','Theo bag semantics; duplicatekey tạo nhiều cặp; không tự tạo department ngoài bảng.','join'],
 ['funnel','Phễu chuyển đổi','Cho visited,signed,purchased với0≤purchased≤signed≤visited. Trả {signup,purchase,total}: signed/visited,purchased/signed,purchased/visited; mẫu số0 trả0.','Phân biệt tỷ lệ theo bước với tỷ lệ từ đầu phễu.','funnel'],
 ['sql-select','SQL thật: SELECT và WHERE','Trong Python, tạo SQLite :memory: và viết query trên bảng orders(id,region,value). Trả id của các hàng region khớp, value≥threshold, ORDER BY id ASC.','Dữ liệu có id duy nhất và đã tăng trong input. Chỉ dữ liệu giả lập trong bộ nhớ.','sql-select'],
 ['sql-group','SQL thật: GROUP BY','Viết query SQLite trên orders(id,region,value): GROUP BY region và SUM(value). Trả object region → tổng.','Không tự thêm nhóm vắng. SQLite :memory: không truy cập dữ liệu ứng dụng.','sql-group'],
 ['sql-join','SQL thật: INNER JOIN','Viết query SQLite ghép employees(position,id,key) và categories(position,key,name). Trả [{id,name}], ORDER BY vị trí employees rồi categories.','Khóa trùng tạo mọi cặp; position giữ thứ tự đầu vào.','sql-join'],
 ['sql-window','SQL thật: running total','Viết SQLite SUM(value) OVER (ORDER BY day,id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) trên orders(id,day,value). Trả [{id,total}] sắp day,id.','Frame ROWS rõ ràng; ngày hòa được phá bằng id.','sql-window'],
];
export const problemIds=defs.map(x=>'da-'+x[0]);
function join(d,mode){const used=new Set(),out=[];d.left.forEach(l=>{let matched=false;d.right.forEach((r,j)=>{if(l.key===r.key){out.push({id:l.id,name:r.name});used.add(j);matched=true;}});if(!matched&&mode!=='inner')out.push({id:l.id,name:null});});if(mode==='full')d.right.forEach((r,j)=>{if(!used.has(j))out.push({id:null,name:r.name});});return out;}
const sqlEquivalent={'da-sql-select':'da-where','da-sql-group':'da-group','da-sql-join':'da-inner-join','da-sql-window':'da-running'};
export function oracle(id,d){if(sqlEquivalent[id])return oracle(sqlEquivalent[id],d);const key=id.replace(/^da-/,'');switch(key){
 case'row-count':return d.rows.length;
 case'mean':return mean(d.values);
 case'sum':return sum(d.rows.map(r=>r.quantity*r.price));
 case'conditional':return sum(d.rows.filter(r=>r.region===d.region&&r.value>=d.threshold).map(r=>r.value));
 case'lookup':return d.queries.map(q=>d.rows.find(r=>r.key===q)?.value??null);
 case'pivot':{const regions=[...new Set(d.rows.map(r=>r.region))].sort(),products=[...new Set(d.rows.map(r=>r.product))].sort();return{regions,products,values:regions.map(region=>products.map(product=>sum(d.rows.filter(r=>r.region===region&&r.product===product).map(r=>r.value))))};}
 case'where':return d.rows.filter(r=>r.region===d.region&&r.value>=d.threshold).map(r=>r.id);
 case'distinct':return[...new Set(d.values)].sort();
 case'topk':return [...d.rows].sort((a,b)=>b.value-a.value||a.id-b.id).slice(0,d.k).map(r=>r.id);
 case'aggregate':{const v=d.values.filter(x=>x!==null);return{rows:d.values.length,nonNull:v.length,sum:v.length?sum(v):null,mean:v.length?mean(v):null};}
 case'group':case'having':{const groups=new Map();for(const r of d.rows)groups.set(r.region,(groups.get(r.region)??0)+r.value);return Object.fromEntries([...groups].filter(([,total])=>key!=='having'||total>=d.threshold));}
 case'inner-join':return join(d,'inner');case'left-join':return join(d,'left');case'full-join':return join(d,'full');
 case'case':return d.values.map(v=>v>=d.high?'High':v>=d.low?'Medium':'Low');
 case'running':{let total=0;return[...d.rows].sort((a,b)=>a.day-b.day||a.id-b.id).map(r=>({id:r.id,total:total+=r.value}));}
 case'rank':{const rows=[...d.rows].sort((a,b)=>b.value-a.value||a.id-b.id);let rank=0,dense=0;return rows.map((r,i)=>{if(i===0||r.value!==rows[i-1].value){rank=i+1;dense++;}return{id:r.id,rowNumber:i+1,rank,denseRank:dense};});}
 case'summary':{const m=mean(d.values);return{mean:m,median:median(d.values),variance:mean(d.values.map(v=>(v-m)**2)),range:Math.max(...d.values)-Math.min(...d.values)};}
 case'quartile':{const q1=quantile(d.values,.25),q3=quantile(d.values,.75),iqr=q3-q1;return{q1,q3,indices:d.values.flatMap((v,i)=>v<q1-1.5*iqr||v>q3+1.5*iqr?[i]:[])};}
 case'correlation':{const mx=mean(d.x),my=mean(d.y),x=d.x.map(v=>v-mx),y=d.y.map(v=>v-my),den=Math.sqrt(sum(x.map(v=>v*v))*sum(y.map(v=>v*v)));return den?sum(x.map((v,i)=>v*y[i]))/den:null;}
 case'missing':{const values=d.values.filter(v=>v!==null),fill=values.length?median(values):d.fallback;return d.values.map(v=>v===null?fill:v);}
 case'dedup':{const seen=new Set();return d.rows.filter(r=>{if(seen.has(r.id))return false;seen.add(r.id);return true;});}
 case'clean-orders':{const seen=new Set(),rows=[],rejected=[];let duplicates=0;for(const r of d.rows){if(seen.has(r.id)){duplicates++;continue;}seen.add(r.id);if(typeof r.quantity!=='number'||!Number.isFinite(r.quantity)||r.quantity<0||typeof r.price!=='number'||!Number.isFinite(r.price)||r.price<0||!['North','South','East'].includes(r.region)||!['2026-01','2026-02','2026-03'].includes(r.month)){rejected.push(r.id);continue;}rows.push({id:r.id,region:r.region,month:r.month,quantity:r.quantity,price:r.price,revenue:r.quantity*r.price});}return{rows,rejected,duplicates};}
 case'kpi':{const revenue=sum(d.rows.map(r=>r.revenue)),groups=new Map();for(const r of d.rows){if(!groups.has(r.region))groups.set(r.region,{orders:0,revenue:0});const group=groups.get(r.region);group.orders++;group.revenue+=r.revenue;}return{revenue,orders:d.rows.length,averageOrder:d.rows.length?revenue/d.rows.length:0,byRegion:Object.fromEntries(groups)};}
 case'chart-series':return d.months.map(month=>{const rows=d.rows.filter(r=>r.month===month);return{month,revenue:sum(rows.map(r=>r.revenue)),orders:rows.length};});
 case'growth':return d.previous===0?null:(d.current-d.previous)/d.previous;
 case'weighted':{const weight=sum(d.weights);return weight?sum(d.values.map((v,i)=>v*d.weights[i]))/weight:null;}
 case'cohort':{const groups=new Map();for(const u of d.users){if(!groups.has(u.cohort))groups.set(u.cohort,{total:0,active:0,rate:0});const group=groups.get(u.cohort);group.total++;group.active+=Number(u.active);}for(const g of groups.values())g.rate=g.active/g.total;return Object.fromEntries(groups);}
 case'ab':return{rateA:d.successA/d.totalA,rateB:d.successB/d.totalB,difference:d.successB/d.totalB-d.successA/d.totalA};
 case'privacy':return d.rows.map(r=>({region:r.region,value:r.value}));
 case'quality':return{total:d.values.length,missing:d.values.filter(v=>v===null).length,negative:d.values.filter(v=>v!==null&&v<0).length,valid:d.values.filter(v=>v!==null&&v>=0).length};
 case'funnel':return{signup:d.visited?d.signed/d.visited:0,purchase:d.signed?d.purchased/d.signed:0,total:d.visited?d.purchased/d.visited:0};
 default:throw new Error('Bài DA không tồn tại: '+id);
}}
export function generateInput(id,seed){if(sqlEquivalent[id])return generateInput(sqlEquivalent[id],seed);const r=random(String(seed)+':'+id),n=int(r,3,14),v=()=>int(r,0,100),region=()=>['North','South','East'][int(r,0,2)],values=Array.from({length:n},v),rows=values.map((value,i)=>({id:i,value,region:region(),product:['Tea','Cake'][i%2],quantity:1+i%4,price:value,day:1+i%3}));switch(id.replace(/^da-/,'')){
 case'row-count':case'sum':case'dedup':return{rows:id==='da-dedup'?[...rows,rows[0]]:rows};
 case'mean':case'summary':case'quartile':return{values};
 case'conditional':case'where':return{rows,region:region(),threshold:v()};
 case'lookup':return{rows:values.map((value,i)=>({key:'p'+i%4,value})),queries:['p0','p3','absent']};
 case'pivot':case'group':return{rows};
 case'having':return{rows,threshold:150};
 case'distinct':return{values:rows.map(x=>x.region)};
 case'topk':return{rows,k:int(r,0,n)};
 case'aggregate':case'missing':case'quality':return{values:values.map((x,i)=>i%3===0?null:id==='da-quality'&&i%4===0?-x:x),fallback:7};
 case'inner-join':case'left-join':case'full-join':return{left:rows.slice(0,6).map((x,i)=>({id:i,key:i%4})),right:[{key:0,name:'Tea'},{key:0,name:'Cake'},{key:1,name:'Milk'},{key:5,name:'Bread'}]};
 case'case':return{values,low:30,high:60};
 case'running':case'rank':return{rows};
 case'correlation':return{x:values,y:values.map((v,i)=>v+(i%3)*10)};
 case'clean-orders':{const orders=rows.map((x,i)=>({id:i,region:x.region,month:['2026-01','2026-02','2026-03'][i%3],quantity:i%7===0?null:x.quantity,price:i%5===0?-x.price:x.price}));return{rows:[...orders,{...orders[1]},{id:n,region:'Wrong',month:'2026-04',quantity:1,price:1}]};}
 case'kpi':case'chart-series':return{rows:rows.map((x,i)=>({id:i,region:x.region,month:['2026-01','2026-02','2026-03'][i%3],revenue:x.quantity*x.price})),months:['2026-01','2026-02','2026-03','2026-04']};
 case'growth':return{previous:v(),current:v()};
 case'weighted':return{values,weights:values.map(()=>int(r,0,5))};
 case'cohort':return{users:rows.map((x,i)=>({id:i,cohort:['2026-01','2026-02'][i%2],active:r()>.4}))};
 case'ab':return{successA:v(),totalA:100,successB:v(),totalB:100};
 case'privacy':return{rows:rows.map(x=>({...x,name:'Person'+x.id,email:'user'+x.id+'@example.invalid'}))};
 case'funnel':{const visited=v(),signed=int(r,0,visited);return{visited,signed,purchased:int(r,0,signed)};}
 default:throw new Error('Bài DA không tồn tại: '+id);
}}
function exactNumber(id,path){
 const key=path.at(-1);
 if(['da-row-count','da-where','da-topk','da-rank','da-quality','da-dedup','da-privacy','da-sql-select'].includes(id))return true;
 if(key==='id')return true;
 if(id==='da-aggregate'&&['rows','nonNull'].includes(key))return true;
 if(id==='da-quartile'&&path[0]==='indices')return true;
 if(id==='da-clean-orders'&&(path[0]==='rejected'||['duplicates','quantity','price'].includes(key)))return true;
 if(['da-kpi','da-chart-series'].includes(id)&&key==='orders')return true;
 if(id==='da-cohort'&&['total','active'].includes(key))return true;
 return false;
}
function near(a,b,id,path=[]){if(typeof b==='number')return typeof a==='number'&&Number.isFinite(a)&&(exactNumber(id,path)?a===b:Math.abs(a-b)<=1e-7+1e-6*Math.abs(b));if(Array.isArray(b))return Array.isArray(a)&&a.length===b.length&&b.every((x,i)=>near(a[i],x,id,[...path,i]));if(b&&typeof b==='object')return a&&typeof a==='object'&&!Array.isArray(a)&&Object.keys(a).length===Object.keys(b).length&&Object.keys(b).every(k=>Object.hasOwn(a,k)&&near(a[k],b[k],id,[...path,k]));return a===b;}
export function checkOutput(id,input,output){try{return near(output,oracle(id,input),id);}catch{return false;}}
export const edgeInputs={
 'da-row-count':[{rows:[]}],'da-sum':[{rows:[]}],'da-aggregate':[{values:[]},{values:[null,null]},{values:[0,null,2]}],
 'da-pivot':[{rows:[{region:'North',product:'Tea',value:2},{region:'South',product:'Cake',value:3}]}],
 'da-group':[{rows:[]},{rows:[{region:'__proto__',value:2},{region:'constructor',value:3},{region:'__proto__',value:4}]}],'da-having':[{rows:[{region:'A',value:1}],threshold:1},{rows:[{region:'__proto__',value:2},{region:'constructor',value:3}],threshold:3}],
 'da-left-join':[{left:[{id:1,key:99}],right:[]}],'da-inner-join':[{left:[{id:1,key:0},{id:2,key:0}],right:[{key:0,name:'A'},{key:0,name:'B'}]}],
 'da-rank':[{rows:[{id:3,value:10},{id:1,value:10},{id:2,value:5}]}],
 'da-summary':[{values:[2,4,4,4,5,5,7,9]}],'da-quartile':[{values:[10,20,30,40,50,60,70,80]},{values:[1,1,1,1,10]}],
 'da-correlation':[{x:[1,1],y:[1,2]},{x:[1,2],y:[2,1]}],'da-missing':[{values:[null,null],fallback:7},{values:[0,null,10],fallback:1}],
 'da-clean-orders':[{rows:[{id:0,region:'North',month:'2026-01',quantity:0,price:0},{id:1,region:'North',month:'2026-01',quantity:null,price:1},{id:1,region:'North',month:'2026-01',quantity:2,price:1}]}],
 'da-kpi':[{rows:[]},{rows:[{id:0,region:'__proto__',month:'2026-01',revenue:4},{id:1,region:'constructor',month:'2026-01',revenue:3}]}],'da-chart-series':[{rows:[],months:['2026-01']}],'da-growth':[{previous:0,current:5}],
 'da-weighted':[{values:[1,2],weights:[0,0]}],'da-full-join':[{left:[],right:[{key:1,name:'A'}]}],'da-funnel':[{visited:0,signed:0,purchased:0}],
};
export function testsFor(id,seed,opts={}){const publicOnly=typeof opts==='boolean'?opts:!!opts.publicOnly;const samples=[0,1].map(i=>({name:'Ví dụ '+(i+1),group:'sample',input:generateInput(id,'sample-'+i)}));if(publicOnly)return samples;return[...samples,...(edgeInputs[id]??[]).map((input,i)=>({name:'Biên '+(i+1),group:'edge',input})),...Array.from({length:8},(_,i)=>({name:'Dữ liệu '+(i+1),group:'random',input:generateInput(id,String(seed)+':'+i)}))].map(t=>({...t,expected:oracle(id,t.input)}));}
export const problems=Object.fromEntries(defs.map(([key,title,statement,constraints,skill])=>{const id='da-'+key,sampleInput=generateInput(id,0);return[id,{id,title,statement,constraints,skill,version:VERSION,runtime:'ml-python',packages:[],sampleInput,sampleOutput:oracle(id,sampleInput),hints:['Vẽ bảng nhỏ và xác định một hàng đại diện cho điều gì.','Tách lọc, ghép, nhóm và tính toán thành các bước; xử lý null theo đặc tả.','Kiểm tra dấu bằng, thứ tự, dòng trùng và nhóm rỗng; return đúng cấu trúc JSON.']}];}));
export function problemDetails(id,language='python'){const p=problems[id];if(!p)return null;const starter=sqlStarter(id)??'def solve(data):\n    # Xử lý dữ liệu và return kết quả JSON theo đề.\n    pass\n';return{...p,description:p.statement,contract:p.constraints,language,languages:['python'],exerciseNotice:sqlStarter(id)?'Viết SQL thật trong biến query; SQLite chạy trong bộ nhớ của Python cách ly.':p.skill.startsWith('sql')||['join','window'].includes(p.skill)?'Bài Python thao tác bảng; xem các buổi SQL thật để luyện query trong SQLite.':undefined,starter,starters:{python:starter},examples:testsFor(id,0,true).map(t=>({input:t.input,output:oracle(id,t.input)})),tolerance:{absolute:1e-7,relative:1e-6}};}
