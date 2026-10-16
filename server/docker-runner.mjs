import {getCourse} from '../content/registry.mjs';
export function dockerRunnerHealth(){return{available:true,engine:'docker-sim',image:'Docker model v1',message:'Image, container, port, network và volume ảo; không cần Docker Desktop hoặc truy cập shell máy.'};}
export async function runDocker({problemId,language,code,seed,version,fixtures,publicOnly=false},definition=getCourse('docker')){
 if(language!=='shell')return{status:'compile_error',message:'Bài Docker nhận lệnh của terminal mô phỏng.'};
 if(version&&version!==definition.VERSION||!Object.hasOwn(definition.problems,problemId))return{status:'infrastructure_error',message:'Không tìm thấy checker đúng phiên bản; cần chấm lại.'};
 const begin=Date.now(),tests=fixtures??definition.testsFor(problemId,seed,{version,publicOnly});
 if(!Array.isArray(tests)||!tests.length)return{status:'infrastructure_error',message:'Thiếu bộ test đã xác minh; cần chấm lại.'};
 const checks=[];let sample;
 try{for(const[i,t]of tests.entries()){const expected=definition.oracle(problemId,t.input);if(!definition.checkOutput(problemId,t.input,expected))throw Error('Inconsistent oracle');const result=definition.gradeDockerScript(problemId,t.input,code);if(t.group==='sample'&&!sample)sample=result;checks.push({id:t.id??i+1,name:t.name??'Test '+(i+1),group:t.group??'hidden',passed:result.passed===true,...(t.group==='sample'?{input:t.input,expected,actual:{ok:result.ok,errors:result.errors,state:result.frames.at(-1)?.data}}:{})});}}
 catch{return{status:'infrastructure_error',message:'Mô phỏng/checker chưa nhất quán; giữ bài và chấm lại.'};}
 const passed=checks.every(c=>c.passed);return{status:passed?'accepted':'rejected',message:passed?'Trạng thái và dữ liệu thỏa các điều kiện của bài.':'Kiểm lại image, container, port và dữ liệu cần giữ.',passed:checks.filter(c=>c.passed).length,total:checks.length,checks,frames:sample?.frames??[],simulationNotice:sample?.notice,elapsedMs:Date.now()-begin,version:definition.VERSION};
}
