import {getCourse} from '../content/registry.mjs';

export function gitRunnerHealth() {
  return {available:true,engine:'git-sim',image:'Git workspace mô phỏng',message:'Working tree, index, commit và remote ảo; không chạy shell hoặc sửa repository trên máy.'};
}
export async function runGit({problemId,language,code,seed,version,fixtures,publicOnly=false},definition=getCourse('git')) {
  if(language!=='shell')return {status:'compile_error',message:'Bài Git nhận các lệnh của terminal mô phỏng.'};
  if(version && version!==definition.VERSION)return {status:'infrastructure_error',message:'Không có checker đúng phiên bản; cần chấm lại.'};
  if(!Object.hasOwn(definition.problems,problemId))return {status:'infrastructure_error',message:'Không tìm thấy mẫu bài và checker; cần chấm lại.'};
  const begin=Date.now(),tests=fixtures??definition.testsFor(problemId,seed,{version,publicOnly});
  if(!Array.isArray(tests)||tests.length===0)return {status:'infrastructure_error',message:'Thiếu bộ test đã xác minh; cần chấm lại.'};
  let checks=[],sample;
  try {
    for(const [i,t] of tests.entries()) {
      const expected=definition.oracle(problemId,t.input);
      if(!definition.checkOutput(problemId,t.input,expected))throw Error('Oracle/checker không nhất quán.');
      const result=definition.gradeGitScript(problemId,t.input,code);
      if(t.group==='sample' && !sample)sample=result;
      checks.push({id:t.id??i+1,name:t.name??`Test ${i+1}`,group:t.group??'hidden',passed:result.passed===true,
        ...(t.group==='sample'?{input:t.input,expected,actual:{ok:result.ok,errors:result.errors,branch:result.frames.at(-1)?.branch,head:result.frames.at(-1)?.head}}:{})});
    }
  } catch {
    return {status:'infrastructure_error',message:'Bộ mô phỏng/checker chưa nhất quán; giữ bài và chấm lại.'};
  }
  const passed=checks.every(c=>c.passed);
  return {status:passed?'accepted':'rejected',message:passed?'Trạng thái repository thỏa tiêu chí bài tập.':'Chưa đạt trạng thái yêu cầu. Kiểm tra working tree, index và lịch sử.',passed:checks.filter(c=>c.passed).length,total:checks.length,checks,
    frames:sample?.frames??[],simulationNotice:sample?.notice??'Môi trường Git mô phỏng; không chạy lệnh trên máy.',elapsedMs:Date.now()-begin,version:definition.VERSION};
}
