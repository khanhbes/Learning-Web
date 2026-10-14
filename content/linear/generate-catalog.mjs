import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),dir='study documents/Đại số tuyến tính';
const pages=[
 ['825279808','Bìa cẩm nang Đại số tuyến tính',['Giới thiệu','Roadmap'],[1,28]],
 ['825353325','Ma trận',['Kích thước','Loại ma trận','Cộng','Nhân','Chuyển vị'],[5,6,7,8,9]],
 ['825329698','Định thức, định thức con và phần bù đại số',['Định thức','Minor','Cofactor','Nghịch đảo'],[10,11,12,14]],
 ['825279889','Khử Gauss và Gauss–Jordan',['Biến đổi hàng','Khử','Thế ngược','RREF'],[13,14,15,16,18]],
 ['829096615','Hạng ma trận và dạng bậc thang',['Rank','REF','RREF'],[16,17,18,19,21]],
 ['828086003','Hệ phương trình tuyến tính',['Ax=b','Nhất quán','Nghiệm duy nhất','Vô số nghiệm'],[15,18,21,27]],
 ['825340842','Không gian vector và độc lập tuyến tính',['Vector','Tổ hợp tuyến tính','Span','Cơ sở','Rank-nullity'],[1,2,3,4,19,20,21,22,29,30]],
 ['825268409','Trị riêng và vector riêng',['Eigenvalue','Eigenvector','Đa thức đặc trưng'],[24,25,28,32,33,34,36]],
 ['825340721','Định lý Cayley–Hamilton',['Đa thức ma trận','Nghịch đảo','Lũy thừa'],[25,26,28]],
 ['828483383','Tổng ôn cuối kỳ',['Ma trận','Định thức','Hệ tuyến tính','Chéo hóa','Không gian vector'],[7,14,21,23,27,28,29,30,31,32,33,34,35,36]],
];
export async function generateCatalog(){const files=await readdir(path.join(root,dir));const catalog=[];for(const[prefix,title,topics,lessonIds]of pages){const file=files.find(f=>f.startsWith(prefix+'_'));if(!file)throw new Error('Thiếu ảnh '+prefix);const data=await readFile(path.join(root,dir,file));catalog.push({id:'LINEAR-'+prefix,courseId:'linear',prefix,file,path:dir+'/'+file,url:'/sources/linear/'+file,sha256:createHash('sha256').update(data).digest('hex'),pack:'vietnamese-handbook',packTitle:'Cẩm nang Đại số tuyến tính tiếng Việt',collection:'Cẩm nang Đại số tuyến tính tiếng Việt',page:catalog.length+1,title,topic:title,topics,lessonIds,reviewIds:lessonIds,interviewIds:[],uses:['lesson','review'],reviewed:true});}if(files.filter(f=>/\.(jpg|png|jpeg)$/i.test(f)).length!==catalog.length)throw new Error('Có ảnh chưa ánh xạ');await writeFile(new URL('./sources.json',import.meta.url),JSON.stringify(catalog,null,2)+'\n');return catalog;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Catalog:',(await generateCatalog()).length,'ảnh đã đọc.');
