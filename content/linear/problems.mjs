import {random,int} from '../../shared/random.mjs';
export const VERSION='linear-1.0.0';
export const TOLERANCE={absolute:1e-7,relative:1e-6};
export const finite=x=>typeof x==='number'&&Number.isFinite(x);
export const dot=(u,v)=>u.reduce((s,x,i)=>s+x*v[i],0);
export const norm=u=>Math.sqrt(dot(u,u));
export const transpose=A=>A[0].map((_,j)=>A.map(row=>row[j]));
export const matvec=(A,x)=>A.map(row=>dot(row,x));
export const multiply=(A,B)=>A.map(row=>transpose(B).map(col=>dot(row,col)));
export const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
export const determinant=A=>A.length===1?A[0][0]:A.length===2?A[0][0]*A[1][1]-A[0][1]*A[1][0]:A[0].reduce((s,x,j)=>s+(-1)**j*x*determinant(A.slice(1).map(row=>row.filter((_,k)=>k!==j))),0);
export function rref(A){const R=A.map(row=>[...row]),pivots=[];let k=0;for(let j=0;j<A[0].length&&k<A.length;j++){let p=k;for(let i=k+1;i<A.length;i++)if(Math.abs(R[i][j])>Math.abs(R[p][j]))p=i;if(Math.abs(R[p][j])<1e-10)continue;[R[k],R[p]]=[R[p],R[k]];const scale=R[k][j];R[k]=R[k].map(x=>x/scale);for(let i=0;i<A.length;i++)if(i!==k){const factor=R[i][j];R[i]=R[i].map((x,c)=>x-factor*R[k][c]);}pivots.push(j);k++;}return{matrix:R.map(row=>row.map(x=>Math.abs(x)<1e-10?0:x)),pivots};}
export const rank=A=>rref(A).pivots.length;
export function solveReport(A,b){const n=A[0].length,ra=rank(A),aug=rref(A.map((row,i)=>[...row,b[i]])),status=aug.pivots.length!==ra?'none':ra===n?'unique':'infinite';let solution=null;if(status!=='none'){solution=Array(n).fill(0);for(let i=0;i<aug.pivots.length;i++)solution[aug.pivots[i]]=aug.matrix[i][n];}return{status,rank:ra,nullity:n-ra,solution};}
export function near(a,b){if(typeof b==='number')return finite(a)&&Math.abs(a-b)<=TOLERANCE.absolute+TOLERANCE.relative*Math.abs(b);if(Array.isArray(b))return Array.isArray(a)&&a.length===b.length&&b.every((x,i)=>near(a[i],x));if(b&&typeof b==='object')return !!(a&&typeof a==='object'&&!Array.isArray(a)&&Object.keys(a).length===Object.keys(b).length&&Object.keys(b).every(k=>Object.hasOwn(a,k)&&near(a[k],b[k])));return a===b;}
const vec=(x,n)=>Array.isArray(x)&&x.length===n&&x.every(finite);
const mat=(x,m,n)=>Array.isArray(x)&&x.length===m&&x.every(row=>vec(row,n));
function eigenSym(A){const a=A[0][0],b=A[0][1],c=A[1][1],s=Math.hypot(a-c,2*b),values=[(a+c-s)/2,(a+c+s)/2];return{values,vectors:values.map(lambda=>{let v=Math.abs(b)>1e-12?[b,lambda-a]:Math.abs(lambda-a)<1e-10?[1,0]:[0,1];const length=norm(v);return v.map(x=>x/length);})};}
function singularValues(A){const G=multiply(transpose(A),A);return eigenSym(G).values.map(x=>Math.sqrt(Math.max(0,x))).reverse();}
function covariance(points){const means=[0,1].map(j=>points.reduce((s,p)=>s+p[j],0)/points.length);const X=points.map(p=>p.map((x,j)=>x-means[j]));return multiply(transpose(X),X).map(row=>row.map(x=>x/points.length));}
function leastSquares(d){const n=d.x.length,sx=d.x.reduce((s,x)=>s+x,0),sy=d.y.reduce((s,y)=>s+y,0),den=n*dot(d.x,d.x)-sx*sx,slope=(n*dot(d.x,d.y)-sx*sy)/den,intercept=(sy-slope*sx)/n,predictions=d.x.map(x=>intercept+slope*x);return{intercept,slope,predictions,sse:predictions.reduce((s,p,i)=>s+(d.y[i]-p)**2,0)};}
const defs=[
 ['coordinates','Đọc tọa độ một vector','Cho x,y là số thực. Trả [x,y] theo thứ tự hoành độ rồi tung độ.','Không đổi thứ tự, không trả chuỗi.','vectors'],
 ['vector-add','Cộng hai đường di chuyển','Cho u,v cùng chiều. Trả u+v theo từng tọa độ.','1–5 chiều, số hữu hạn; giữ đúng số chiều.','vectors'],
 ['linear-combination','Phối hai vector','Trả a*u+b*v theo từng tọa độ.','a,b có thể âm hoặc0; u,v cùng chiều.','combination'],
 ['norm','Độ dài Euclid','Cho v, trả căn bậc hai của tổng bình phương các tọa độ.','Vector0 có độ dài0; không dùng tổng tọa độ.','dot'],
 ['shape','Đọc kích thước ma trận','Cho ma trận chữ nhật A. Trả [số hàng,số cột].','A không rỗng; mọi hàng cùng độ dài, tối thiểu1 cột.','matrix'],
 ['transpose','Đổi hàng thành cột','Trả A chuyển vị: phần tử (i,j) chuyển sang (j,i).','A chữ nhật, không nhất thiết vuông.','matrix'],
 ['matrix-add','Cộng hai ma trận','Trả A+B theo từng phần tử.','A,B cùng kích thước; không nối hai list.','matrix'],
 ['multiply','Nhân hàng với cột','Trả A@B, A cấp m×n và B cấp n×p.','Tối đa5 mỗi chiều; đây là nhân ma trận, không nhân từng ô.','product'],
 ['transform','Biến đổi tuyến tính','Trả A*v.','A cấp m×n, v có n tọa độ. Vector coi là vector cột.','transform'],
 ['determinant','Diện tích có hướng','Trả det(A) cho ma trận vuông cấp1–3.','Giữ dấu; det âm có nghĩa đổi hướng, không phải diện tích âm.','determinant'],
 ['cofactor','Định thức con và dấu bàn cờ','Trả phần bù đại số C[i,j]=(-1)^(i+j)*minor(i,j).','A cấp2 hoặc3; i,j dùng chỉ số0-based trong Python. Dấu vẫn (-1)^(i+j).','determinant'],
 ['inverse','Hoàn tác phép biến đổi','Cho A cấp2. Trả ma trận nghịch đảo nếu det khác0; nếu suy biến trả null.','Python dùng None cho null. Các ma trận sinh đề cách xa ngưỡng suy biến.','transform'],
 ['row-operation','Một phép biến đổi hàng','Trả A sau đúng một phép op: swap đổi i,j; scale nhân hàng i với k; add cộng k lần hàng j vào hàng i.','scale có k≠0; add có i≠j; đầu vào không bị sửa. Chỉ số0-based.','elimination'],
 ['rref','Gauss–Jordan đầy đủ','Trả dạng bậc thang rút gọn duy nhất của A.','Pivot bằng1, các ô khác trong cột pivot bằng0, hàng0 ở cuối. A tối đa4×5.','elimination'],
 ['rank','Số hướng độc lập','Trả rank(A) là số pivot.','Kết quả số nguyên chính xác; không đếm hàng khác0 trước khử.','rank'],
 ['solve','Giải hệ có nghiệm duy nhất','Cho A vuông khả nghịch và b, trả vector x sao cho A*x=b.','Không tính nghịch đảo nếu dùng solve trực tiếp; số chiều2–3.','elimination'],
 ['system-type','Phân loại nghiệm','Trả "unique", "infinite" hoặc "none" cho A*x=b.','So rank(A) và rank([A|b]); unique cần rank(A)=số biến.','rank'],
 ['null-vector','Một hướng không nhìn thấy','Cho A rank1 có2 cột. Trả một vector đơn vị v thuộc nullspace: A*v=0.','Vector khác0, norm=1. Chấp nhận cả hai dấu hoặc hướng hợp lệ tương đương.','span'],
 ['column-basis','Chọn cơ sở từ cột gốc','Trả list chỉ số cột tạo cơ sở cho column space của A.','Chỉ số0-based, duy nhất, không cần thứ tự cố định; chấp nhận mọi lựa chọn cột gốc độc lập đủ rank. Ma trận0 trả[].','span'],
 ['projection','Bóng của một vector','Trả hình chiếu u lên đường span(v): dot(u,v)/dot(v,v)*v.','v khác0. u,v cùng chiều; hình chiếu có thể ngược hướng v.','projection'],
 ['least-squares','Đường gần dữ liệu nhất','Cho x,y cùng độ dài. Trả {intercept,slope,predictions,sse} của đường y≈intercept+slope*x tối thiểu hóa tổng bình phương sai số.','Ít nhất3 điểm, x có ít nhất2 giá trị khác nhau. sse là tổng, không phải mean.','least-squares'],
 ['eigenpairs','Hướng chỉ co giãn','Cho A đối xứng thực2×2 có hai trị riêng phân biệt. Trả {values:[λ1,λ2],vectors:[v1,v2]} với mỗi v đơn vị.','vectors là list vector, không ma trận cột. Chấp nhận đổi dấu, đổi thứ tự nếu ghép đúng trị riêng. Không chấp nhận vector0 hoặc thiếu cặp.','eigen'],
 ['matrix-power','Lặp phép biến đổi','Trả A^k cho A vuông, k nguyên0–8.','A^0=I, dùng nhân ma trận; A**k từng phần tử trong NumPy không đúng.','diagonalization'],
 ['cayley','Kiểm chứng Cayley–Hamilton','Cho A2×2, trả {square,trace,det,residual}: square=A@A; trace tổng đường chéo; det định thức; residual=A²-trace*A+det*I.','Kiểm cả kết quả trung gian và ma trận residual0. Hệ số hằng nhân với I, không cộng vào mọi ô.','cayley'],
 ['transform-batch','Bản đồ đường đi của Bitty','Cho A2×2,b2D,points. Trả [A*p+b cho từng point] cùng thứ tự.','0–50 điểm; phần b là tịnh tiến affine, không phải biến đổi tuyến tính nếu b≠0.','transform'],
 ['solve-report','Báo cáo hệ điều khiển','Trả {status,rank,nullity,solution} của hệ A*x=b. solution là vector hợp lệ nếu có nghiệm, null nếu none.','A có1–4 hàng/cột, hệ số và b nguyên trong[-20,20]. rank/nullity là số nguyên chính xác; nullity=số cột-rank(A). Với infinite chấp nhận bất kỳ nghiệm hữu hạn thỏa hệ.','rank'],
 ['gram-schmidt','Tạo các hướng vuông góc','Cho hai vector độc lập2D trong vectors. Trả hai vector đơn vị trực giao theo Gram–Schmidt.','Vector đầu cùng đường vector đầu input; vector sau nằm trong span của hai vector. Cho phép đổi dấu từng vector.','projection'],
 ['qr','Tách Q và R','Cho A2×2 khả nghịch. Trả {Q,R} với Q trực giao,R tam giác trên và Q@R=A.','Chấp nhận dấu đường chéo R khác nhau. Không cần trùng Q/R chuẩn.','projection'],
 ['svd-values','Mức co giãn lớn nhất, nhỏ nhất','Cho A2×2. Trả hai singular values theo thứ tự giảm dần.','Singular values không âm; tính từ căn trị riêng AᵀA, không từ trị riêng A.','svd'],
 ['pca-direction','Trục giữ nhiều biến thiên nhất','Cho points2D. Trả vector đơn vị theo hướng thành phần chính đầu tiên sau centering.','Dùng covariance chia n; chấp nhận hai dấu. Nếu trị riêng lớn nhất lặp, chấp nhận mọi hướng đơn vị trong eigenspace.','pca'],
 ['quadratic','Năng lượng của một điểm','Trả xᵀ*A*x.','A đối xứng; biểu thức trả số, không list.','matrix'],
 ['markov','Một bước phân phối','Trả P*p.','P là ma trận column-stochastic2×2, p không âm tổng1. Các cột P có tổng1.','markov'],
 ['condition','Mức nhạy của ma trận','Trả condition number2-norm=σmax/σmin; suy biến trả null.','A2×2. Không lấy tỷ lệ đường chéo khi A không diagonal.','svd'],
 ['complex-eigen','Trị riêng vượt trục thực','A=[[a,-b],[b,a]], b>0. Trả [{real:a,imag:-b},{real:a,imag:b}].','Chỉ định thứ tự phần ảo tăng. JSON không có kiểu số phức nên dùng object real/imag.','eigen'],
];
export const problemIds=defs.map(d=>'linear-'+d[0]);
export function oracle(id,d){switch(id.replace(/^linear-/,'')){
 case'coordinates':return[d.x,d.y];case'vector-add':return d.u.map((x,i)=>x+d.v[i]);case'linear-combination':return d.u.map((x,i)=>d.a*x+d.b*d.v[i]);case'norm':return norm(d.v);case'shape':return[d.A.length,d.A[0].length];case'transpose':return transpose(d.A);case'matrix-add':return d.A.map((row,i)=>row.map((x,j)=>x+d.B[i][j]));case'multiply':return multiply(d.A,d.B);case'transform':return matvec(d.A,d.v);case'determinant':return determinant(d.A);case'cofactor':return(-1)**(d.i+d.j)*determinant(d.A.filter((_,i)=>i!==d.i).map(row=>row.filter((_,j)=>j!==d.j)));
 case'inverse':{const t=determinant(d.A);return Math.abs(t)<1e-10?null:[[d.A[1][1]/t,-d.A[0][1]/t],[-d.A[1][0]/t,d.A[0][0]/t]];}
 case'row-operation':{const A=d.A.map(row=>[...row]);if(d.op==='swap')[A[d.i],A[d.j]]=[A[d.j],A[d.i]];if(d.op==='scale')A[d.i]=A[d.i].map(x=>x*d.k);if(d.op==='add')A[d.i]=A[d.i].map((x,j)=>x+d.k*A[d.j][j]);return A;}
 case'rref':return rref(d.A).matrix;case'rank':return rank(d.A);case'solve':return solveReport(d.A,d.b).solution;case'system-type':return solveReport(d.A,d.b).status;case'solve-report':return solveReport(d.A,d.b);
 case'null-vector':{const row=d.A.find(r=>norm(r)>1e-10),v=[-row[1],row[0]],length=norm(v);return v.map(x=>x/length);}
 case'column-basis':return rref(d.A).pivots;case'projection':{const scale=dot(d.u,d.v)/dot(d.v,d.v);return d.v.map(x=>scale*x);}
 case'least-squares':return leastSquares(d);case'eigenpairs':return eigenSym(d.A);
 case'matrix-power':{let M=identity(d.A.length);for(let k=0;k<d.k;k++)M=multiply(M,d.A);return M;}
 case'cayley':{const square=multiply(d.A,d.A),trace=d.A[0][0]+d.A[1][1],det=determinant(d.A);return{square,trace,det,residual:square.map((row,i)=>row.map((x,j)=>x-trace*d.A[i][j]+(i===j?det:0)))};}
 case'transform-batch':return d.points.map(p=>matvec(d.A,p).map((x,i)=>x+d.b[i]));
 case'gram-schmidt':{const[u,v]=d.vectors,q=u.map(x=>x/norm(u)),residual=v.map((x,i)=>x-dot(v,q)*q[i]);return[q,residual.map(x=>x/norm(residual))];}
 case'qr':{const vectors=transpose(d.A),Q=transpose(oracle('linear-gram-schmidt',{vectors}));return{Q,R:multiply(transpose(Q),d.A)};}
 case'svd-values':return singularValues(d.A);case'pca-direction':return eigenSym(covariance(d.points)).vectors[1];case'quadratic':return dot(d.x,matvec(d.A,d.x));case'markov':return matvec(d.P,d.p);case'condition':{if(Math.abs(determinant(d.A))<1e-10)return null;const s=singularValues(d.A);return s[0]/s[1];}case'complex-eigen':return[{real:d.a,imag:-d.b},{real:d.a,imag:d.b}];default:throw new Error('Bài đại số không tồn tại: '+id);
}}
export function checkOutput(id,d,out){try{
 if(id==='linear-rank')return Number.isInteger(out)&&out===rank(d.A);
 if(id==='linear-shape')return Array.isArray(out)&&out.length===2&&out.every(Number.isInteger)&&out[0]===d.A.length&&out[1]===d.A[0].length;
 if(id==='linear-null-vector')return vec(out,2)&&near(norm(out),1)&&near(matvec(d.A,out),d.A.map(()=>0));
 if(id==='linear-column-basis'){const r=rank(d.A);return Array.isArray(out)&&out.length===r&&out.every(i=>Number.isInteger(i)&&i>=0&&i<d.A[0].length)&&new Set(out).size===out.length&&(r===0||rank(d.A.map(row=>out.map(i=>row[i])))===r);}
 if(id==='linear-eigenpairs'){if(!out||Object.keys(out).length!==2||!vec(out.values,2)||!mat(out.vectors,2,2))return false;const expected=eigenSym(d.A).values;if(!near([...out.values].sort((a,b)=>a-b),expected))return false;return out.vectors.every((v,i)=>near(norm(v),1)&&near(matvec(d.A,v),v.map(x=>x*out.values[i])));}
 if(id==='linear-pca-direction'){if(!vec(out,2)||!near(norm(out),1))return false;const C=covariance(d.points),lambda=eigenSym(C).values[1];return near(matvec(C,out),out.map(x=>x*lambda));}
 if(id==='linear-gram-schmidt'){if(!mat(out,2,2)||!out.every(v=>near(norm(v),1))||!near(dot(out[0],out[1]),0))return false;return near(Math.abs(dot(out[0],d.vectors[0])),norm(d.vectors[0]));}
 if(id==='linear-qr')return !!(out&&Object.keys(out).length===2&&mat(out.Q,2,2)&&mat(out.R,2,2)&&near(multiply(transpose(out.Q),out.Q),identity(2))&&near(out.R[1][0],0)&&near(multiply(out.Q,out.R),d.A));
 if(id==='linear-solve-report'){const expected=solveReport(d.A,d.b);return !!(out&&Object.keys(out).length===4&&out.status===expected.status&&Number.isInteger(out.rank)&&out.rank===expected.rank&&Number.isInteger(out.nullity)&&out.nullity===expected.nullity&&(expected.status==='none'?out.solution===null:vec(out.solution,d.A[0].length)&&near(matvec(d.A,out.solution),d.b)));}
 return near(out,oracle(id,d));
}catch{return false;}}
export function generateInput(id,seed){const rng=random(String(seed)+':'+id),v=()=>int(rng,-5,5),n=int(rng,2,4),vector=()=>Array.from({length:n},v),matrix=(m,k)=>Array.from({length:m},()=>Array.from({length:k},v)),invertible=()=>{let A;do{A=matrix(2,2);}while(Math.abs(determinant(A))<1);return A;},key=id.replace(/^linear-/,'');switch(key){
 case'coordinates':return{x:v(),y:v()};case'vector-add':return{u:vector(),v:vector()};case'linear-combination':return{u:vector(),v:vector(),a:v(),b:v()};case'norm':return{v:vector()};case'shape':case'transpose':return{A:matrix(n,int(rng,1,4))};case'matrix-add':return{A:matrix(n,3),B:matrix(n,3)};case'multiply':return{A:matrix(n,3),B:matrix(3,2)};case'transform':return{A:matrix(2,n),v:vector()};case'determinant':{const size=int(rng,1,3);return{A:matrix(size,size)};}case'cofactor':{const size=int(rng,2,3);return{A:matrix(size,size),i:int(rng,0,size-1),j:int(rng,0,size-1)};}case'inverse':case'svd-values':case'condition':return{A:matrix(2,2)};
 case'row-operation':{const op=['swap','scale','add'][int(rng,0,2)];return{A:matrix(3,3),op,i:0,j:int(rng,1,2),k:[-2,-1,1,2][int(rng,0,3)]};}
 case'rref':case'rank':case'column-basis':return{A:matrix(n,int(rng,2,4))};case'solve':{const A=invertible(),x=[v(),v()];return{A,b:matvec(A,x)};}
 case'system-type':case'solve-report':{const mode=int(rng,0,2),a=int(rng,1,5),b=v(),c=v();return mode===0?{A:[[a,b],[0,1]],b:[c,v()]}:{A:[[a,b],[2*a,2*b]],b:[c,2*c+(mode===2?1:0)]};}
 case'null-vector':{const a=int(rng,1,5),b=v(),scale=int(rng,1,3);return{A:[[a,b],[scale*a,scale*b]]};}case'projection':{let w=vector();if(norm(w)===0)w[0]=1;return{u:vector(),v:w};}
 case'least-squares':{const x=Array.from({length:n+2},(_,i)=>i-2),a=v(),b=v();return{x,y:x.map(t=>a+b*t+int(rng,-2,2))};}case'eigenpairs':{const a=v(),b=int(rng,1,4),c=v();return{A:[[a,b],[b,c]]};}case'matrix-power':return{A:matrix(2,2),k:int(rng,0,8)};case'cayley':return{A:matrix(2,2)};case'transform-batch':return{A:matrix(2,2),b:[v(),v()],points:Array.from({length:n+2},()=>[v(),v()])};case'gram-schmidt':return{vectors:invertible()};case'qr':return{A:invertible()};case'pca-direction':return{points:Array.from({length:n+4},(_,i)=>[i-3,2*(i-3)+int(rng,-1,1)])};case'quadratic':{const a=v(),b=v(),c=v();return{A:[[a,b],[b,c]],x:[v(),v()]};}case'markov':{const a=int(rng,0,10)/10,b=int(rng,0,10)/10,p=int(rng,0,10)/10;return{P:[[a,b],[1-a,1-b]],p:[p,1-p]};}case'complex-eigen':return{a:v(),b:int(rng,1,5)};default:throw new Error('Mẫu đại số không tồn tại: '+id);
}}
export const edgeInputs={
 'linear-norm':[{v:[0,0]},{v:[3,4]}], 'linear-transpose':[{A:[[1,2,3]]}], 'linear-determinant':[{A:[[0]]},{A:[[1,2],[2,4]]},{A:[[1,2,3],[0,1,4],[5,6,0]]}],
 'linear-inverse':[{A:[[1,2],[2,4]]},{A:[[0,1],[1,0]]}], 'linear-rref':[{A:[[1,2,-1],[2,4,1],[3,6,0]]},{A:[[0,0],[0,0]]},{A:[[0,1],[1,0]]}],
 'linear-rank':[{A:[[1,2,-1],[2,4,1],[3,6,0]]},{A:[[0,0],[0,0]]}], 'linear-solve':[{A:[[1,1,1],[2,1,-1],[1,-1,2]],b:[6,3,3]}],
 'linear-system-type':[{A:[[0,0],[0,0]],b:[0,0]},{A:[[0,0],[0,0]],b:[0,1]}], 'linear-column-basis':[{A:[[0,0],[0,0]]},{A:[[1,0,1],[0,1,1]]}],
 'linear-null-vector':[{A:[[1,0],[2,0]]}], 'linear-projection':[{u:[1,-1],v:[1,1]},{u:[-1,-1],v:[1,1]}],
 'linear-least-squares':[{x:[0,1,2],y:[1,3,5]},{x:[-1,0,1],y:[1,1,1]}], 'linear-eigenpairs':[{A:[[2,1],[1,2]]},{A:[[1,0],[0,3]]}],
 'linear-matrix-power':[{A:[[2,1],[1,2]],k:0}], 'linear-cayley':[{A:[[2,1],[1,2]]}], 'linear-transform-batch':[{A:[[1,0],[0,1]],b:[0,0],points:[]}],
 'linear-solve-report':[{A:[[1,1],[2,2]],b:[3,6]},{A:[[1,1],[2,2]],b:[3,7]},{A:[[0,0],[0,0]],b:[0,0]}],
 'linear-gram-schmidt':[{vectors:[[1,0],[1,1]]}], 'linear-qr':[{A:[[0,1],[1,0]]}], 'linear-svd-values':[{A:[[0,0],[0,0]]},{A:[[0,2],[3,0]]}],
 'linear-pca-direction':[{points:[[1,0],[-1,0],[0,1],[0,-1]]}], 'linear-condition':[{A:[[1,2],[2,4]]},{A:[[1,0],[0,1]]}], 'linear-markov':[{P:[[0,1],[1,0]],p:[1,0]}],
};
export function testsFor(id,seed,opts={}){const publicOnly=typeof opts==='boolean'?opts:!!opts.publicOnly,samples=[0,1].map(i=>({name:'Ví dụ '+(i+1),group:'sample',input:generateInput(id,'sample-'+i)}));if(publicOnly)return samples;return[...samples,...(edgeInputs[id]??[]).map((input,i)=>({name:'Biên '+(i+1),group:'edge',input})),...Array.from({length:8},(_,i)=>({name:'Dữ liệu '+(i+1),group:'random',input:generateInput(id,String(seed)+':'+i)}))].map(t=>({...t,expected:oracle(id,t.input)}));}
// Numeric/property trace questions have a single canonical answer, even when code outputs
// are allowed to choose different eigenvector signs, bases or solutions.
export function traceQuestion(id,seed){const input=generateInput(id,seed),out=oracle(id,input),key=id.replace(/^linear-/,''),round=x=>Math.round(x*1e4)/1e4;let answer,label;
 switch(key){
 case'coordinates':answer=input.x;label='hoành độ x';break;
 case'vector-add':case'linear-combination':case'transform':case'projection':case'solve':answer=out[0];label='tọa độ đầu tiên của kết quả';break;
 case'norm':case'determinant':case'cofactor':case'rank':case'quadratic':case'condition':answer=out;label='giá trị trả về theo đặc tả';break;
 case'shape':answer=out[1];label='số cột của A';break;
 case'transpose':case'matrix-add':case'multiply':case'row-operation':case'matrix-power':answer=out[0][0];label='ô [0][0] của kết quả';break;
 case'inverse':answer=out===null?null:out[0][0];label='ô [0][0] của inverse, hoặc null nếu suy biến';break;
 case'rref':case'column-basis':case'null-vector':answer=rank(input.A);label='rank(A), cũng là số pivot';break;
 case'system-type':case'solve-report':answer=key==='system-type'?out:out.status;label='loại nghiệm (unique/infinite/none)';break;
 case'least-squares':answer=out.sse;label='tổng bình phương residual SSE';break;
 case'eigenpairs':answer=Math.min(...out.values);label='trị riêng nhỏ nhất';break;
 case'cayley':answer=out.trace;label='trace(A)';break;
 case'transform-batch':answer=out[0][0];label='hoành độ ảnh của point đầu tiên';break;
 case'gram-schmidt':answer=dot(input.vectors[0],input.vectors[1]);label='tích vô hướng hai vector đầu vào';break;
 case'qr':answer=determinant(input.A);label='det(A), không phụ thuộc lựa chọn dấu của Q/R';break;
 case'svd-values':answer=out[0];label='singular value lớn nhất';break;
 case'pca-direction':{const C=covariance(input.points);answer=dot(out,matvec(C,out));label='phương sai theo trục PCA đầu tiên với covariance chia n';break;}
 case'markov':answer=out[0];label='xác suất trạng thái0 sau một bước';break;
 case'complex-eigen':answer=input.b;label='phần ảo dương của trị riêng';break;
 default:throw new Error('Trace không tồn tại: '+id);
 }
 if(typeof answer==='number')answer=round(answer);
 const wrongAnswers=typeof answer==='number'?[round(answer+1),round(answer+2)]:answer===null?[0,1]:['unique','infinite','none'].filter(x=>x!==answer);
 return{input,prompt:'Với dữ liệu sau, '+label+' bằng bao nhiêu? Làm tròn số thực tới4 chữ số thập phân nếu cần.',answer,wrongAnswers,explanation:'Theo phép tính '+problems[id].title+', '+label+' = '+JSON.stringify(answer)+'. Nghiệm code tương đương vẫn được chấp nhận theo checker riêng.'};
}
export const problems=Object.fromEntries(defs.map(([key,title,statement,constraints,skill])=>{const id='linear-'+key,sampleInput=generateInput(id,0);return[id,{id,title,statement,constraints,skill,version:VERSION,runtime:'ml-python',packages:[],sampleInput,sampleOutput:oracle(id,sampleInput),hints:['Vẽ một ví dụ2D và ghi kích thước đầu vào/đầu ra.','Tách phép tính theo hàng/cột hoặc pivot; kiểm tra điều kiện áp dụng.','Đối chiếu residual, shape, trường hợp0 và kết quả JSON; return thay vì chỉ print.']}];}));
export function problemDetails(id,language='python'){const p=problems[id];if(!p)return null;const starter='def solve(data):\n    # Viết phép tính theo đặc tả; có thể dùng NumPy.\n    # Chuyển ndarray thành list trước khi return.\n    pass\n';return{...p,description:p.statement,contract:p.constraints,language,languages:['python'],starter,starters:{python:starter},examples:testsFor(id,0,true).map(t=>({input:t.input,output:oracle(id,t.input)})),tolerance:TOLERANCE};}
