import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const directory=new URL('../../study documents/Docker/',import.meta.url);
const metadata={
 '792404634':['Bìa và mục lục Docker',[1,24,30]],
 '786070021':['Docker là gì, VM và container',[1,2]],
 '785759123':['Cài đặt và kiến thức cơ bản',[1,2,3]],
 '785282149':['Kiến trúc client, daemon, host và registry',[2,3,26]],
 '785678118':['Bảng tra cứu lệnh Docker',[3,4,6,8,22,24]],
 '785600098':['Images, layer, ID và tag',[1,7,9,26]],
 '786453044':['Containers và vòng đời',[3,4,5,6]],
 '787167917':['Dockerfile nền tảng',[9,10,12]],
 '788574798':['Dockerfile thực hành production',[10,11,20,25]],
 '782889150':['Build, context, cache và multi-stage',[9,10,11,25,29]],
 '784716847':['Docker networking và DNS',[5,14,16,17]],
 '784541700':['Volumes và storage',[4,13,15,27]],
 '792133575':['Compose, services và dependencies',[17,18,28]],
 '787036366':['Compose production, healthcheck và secrets',[18,19,21,28]],
 '786888780':['Environment và secrets',[12,20,28]],
 '785281575':['Quản lý CPU, memory và dung lượng',[19,22,30]],
 '790476147':['Docker security',[12,20,23,30]],
 '786898952':['Registry và phiên bản image',[7,26,29]],
 '785600147':['Logging và troubleshooting',[6,21,22,30]],
 '786352935':['Production và mười câu phỏng vấn',[23,24,25,26,27,28,29,30]],
};
const order=Object.keys(metadata);
const sources=readdirSync(directory).filter(f=>/\.(jpg|png|webp)$/i.test(f)).map(file=>{const prefix=file.split('_')[0],row=metadata[prefix];if(!row)throw Error('Chưa đọc nguồn '+file);return{id:'DOCKER-'+prefix,prefix,file,sha256:createHash('sha256').update(readFileSync(new URL(file,directory))).digest('hex'),sourceDirectory:'Docker',collection:'Docker — Cẩm nang toàn tập',pack:'docker-handbook',page:order.indexOf(prefix)+1,topic:row[0],lessonIds:row[1],review:'Ôn sơ đồ và tình huống ở buổi '+row[1].join(', '),interviewIds:prefix==='786352935'?['container','architecture','copy','layers','size','multistage','storage','compose','secret','security'].map(x=>'docker-'+x):[],url:'/sources/docker/'+file,note:'Đã đọc toàn trang qua contact sheet; bài viết lại theo tình huống, có hiệu đính và chỉ rõ giới hạn mô phỏng.'};}).sort((a,b)=>a.page-b.page);
if(sources.length!==20)throw Error('Cần đúng20 ảnh Docker.');
writeFileSync(new URL('./sources.json',import.meta.url),JSON.stringify(sources,null,2)+'\n');
console.log('Docker: '+sources.length+' ảnh được ánh xạ và SHA-256.');
