import * as dsaCurriculum from "./curriculum.mjs";
import * as dsaProblems from "./problems.mjs";
import * as dsaSolutions from "./solutions.mjs";
import * as ml from "./ml/index.mjs";
import * as da from "./da/index.mjs";
import * as git from "./git/index.mjs";
import * as agent from "./agent/index.mjs";
import * as linear from "./linear/index.mjs";
import * as docker from "./docker/index.mjs";
import * as genai from "./genai/index.mjs";
import * as rag from "./rag/index.mjs";
import { readFileSync } from "node:fs";
import { corrections } from "./sources-map.mjs";
import {installTeaching} from './pedagogy/index.mjs';
const dsaSources=JSON.parse(readFileSync(new URL("./sources.json",import.meta.url),"utf8"));
function extension(definition, sourceDirectory, runtime, languages, description, helpers) {
  return {...definition,sourceDirectory,course:{...definition.course,languages,runtime,description,capstoneTitle:definition.course.capstoneTitle??definition.course.capstone?.title},
    sources:definition.sourceCatalog.map(s=>({...s,collection:s.packTitle??s.collection,topic:s.title??s.topic,url:`/sources/${definition.course.id}/${s.file}`})),helpers};
}
export const courseRegistry={
  dsa:{...dsaCurriculum,...dsaProblems,course:{...dsaCurriculum.course,languages:["python","cpp"],runtime:"wasi",description:"Từ dòng code đầu tiên đến tư duy cấu trúc dữ liệu và thuật toán."},sources:dsaSources,corrections,
    problemDetails(id){return {...dsaProblems.problems[id],starters:{python:dsaSolutions.starter(id,"python"),cpp:dsaSolutions.starter(id,"cpp")}}},
    solution:dsaSolutions.solution,helpers:{python:dsaSolutions.pythonHelpers,cpp:dsaSolutions.cppHelpers}},
  ml:{...ml,course:{...ml.course,languages:["python"],runtime:"pyodide",description:"Khám phá dữ liệu, huấn luyện mô hình nhỏ và đánh giá đúng bằng Python."},sources:ml.sourceCatalog.map(s=>({...s,collection:s.packTitle,topic:s.title,url:"/sources/ml/"+s.file})),
    problemDetails(id){const p=ml.problemDetails(id);return {...ml.problems[id],...p,starters:p.starters??{python:p.starter??"def solve(data):\n    # Viết lời giải của bạn\n    return None"}}},
    helpers:{python:"import numpy as np\nimport pandas as pd\n# solve(data) nhận dữ liệu JSON và trả giá trị JSON."}},
  da:{...da,sourceDirectory:"DA",course:{...da.course,languages:["python"],runtime:"pyodide",description:"Từ câu hỏi kinh doanh đến bảng sạch, SQL, biểu đồ và kết luận có bằng chứng."},sources:da.sourceCatalog.map(s=>({...s,collection:s.packTitle??s.collection,topic:s.title??s.topic,url:"/sources/da/"+s.file})),
    helpers:{python:"# solve(data) nhận bảng JSON và trả kết quả JSON.\n# Bài SQL dùng sqlite3 với database :memory: trong môi trường cách ly."}},
  git:{...git,sourceDirectory:"Git Github",course:{...git.course,languages:["shell"],runtime:"git-sim",description:"Tự tay stage, commit, tạo nhánh, gộp thay đổi và cộng tác qua repository mô phỏng."},sources:git.sourceCatalog.map(s=>({...s,collection:s.packTitle??s.collection,topic:s.title??s.topic,url:"/sources/git/"+s.file})),
    helpers:{shell:"# Mỗi dòng là một lệnh trong Git mô phỏng.\n# Không chạy shell, truy cập mạng hoặc thay repository thật."}},
  agent:{...agent,sourceDirectory:"AI Agent",course:{...agent.course,languages:["python"],runtime:"pyodide",description:"Điều khiển agent qua quan sát, bộ nhớ, mục tiêu và công cụ giả lập có thể kiểm chứng."},sources:agent.sourceCatalog.map(s=>({...s,collection:s.packTitle??s.collection,topic:s.title??s.topic,url:"/sources/agent/"+s.file})),
    helpers:{python:"# solve(data) nhận fixture JSON và trả kết quả JSON.\n# Công cụ và kết quả giả lập; không cần API key hay gọi mạng."}},
  linear:{...linear,sourceDirectory:"Đại số tuyến tính",course:{...linear.course,languages:["python"],runtime:"pyodide",description:"Nhìn vector, ma trận và hệ phương trình chuyển động; kiểm chứng từng phép tính bằng Python."},sources:linear.sourceCatalog.map(s=>({...s,collection:s.packTitle??s.collection,topic:s.title??s.topic,url:"/sources/linear/"+s.file})),
    helpers:{python:"# solve(data) nhận JSON; có thể dùng NumPy trong môi trường cách ly.\n# Return số/list/dict; ndarray cần .tolist(), không trả NaN/Infinity."}}
  ,docker:extension(docker,"Docker","docker-sim",["shell"],"Tự tay dựng image, chạy container, nối mạng và giữ dữ liệu qua môi trường Docker mô phỏng.",{shell:"# Mỗi dòng là một lệnh Docker được hỗ trợ trong bài.\n# Mô phỏng có trạng thái; không chạy Docker hoặc shell trên máy."}),
  genai:extension(genai,"Gen AI","pyodide",["python"],"Khám phá token, xác suất, prompt và đánh giá đầu ra bằng các thí nghiệm nhỏ có thể kiểm chứng.",{python:"# solve(data) nhận dữ liệu JSON và trả kết quả JSON.\n# Bài tập dùng mô hình nhỏ hoặc kết quả giả lập, không cần API key."}),
  rag:extension(rag,"RAG LLM","pyodide",["python"],"Đưa tài liệu tới câu trả lời: chia đoạn, tìm kiếm, xếp hạng, trích nguồn và kiểm chứng bằng chứng.",{python:"# solve(data) nhận tài liệu/vector giả lập và trả kết quả JSON.\n# Không tải mô hình lớn; chú ý quy tắc đồng hạng và sai số trong từng đề."})
};
installTeaching(courseRegistry);
export function getCourse(id="dsa") {
  const c=Object.hasOwn(courseRegistry,id)?courseRegistry[id]:null;
  if(!c) throw Object.assign(Error("Không tìm thấy khóa học."),{statusCode:404});
  return c;
}
export function courseForProblem(id) {
  const c=Object.values(courseRegistry).find(c=>Object.hasOwn(c.problems,id));
  if(!c) throw Object.assign(Error("Bài code không tồn tại."),{statusCode:404});
  return c;
}
