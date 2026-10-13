import * as dsaCurriculum from "./curriculum.mjs";
import * as dsaProblems from "./problems.mjs";
import * as dsaSolutions from "./solutions.mjs";
import * as ml from "./ml/index.mjs";
import { readFileSync } from "node:fs";
import { corrections } from "./sources-map.mjs";
const dsaSources=JSON.parse(readFileSync(new URL("./sources.json",import.meta.url),"utf8"));
export const courseRegistry={
  dsa:{...dsaCurriculum,...dsaProblems,course:{...dsaCurriculum.course,languages:["python","cpp"],runtime:"wasi",description:"Từ dòng code đầu tiên đến tư duy cấu trúc dữ liệu và thuật toán."},sources:dsaSources,corrections,
    problemDetails(id){return {...dsaProblems.problems[id],starters:{python:dsaSolutions.starter(id,"python"),cpp:dsaSolutions.starter(id,"cpp")}}},
    solution:dsaSolutions.solution,helpers:{python:dsaSolutions.pythonHelpers,cpp:dsaSolutions.cppHelpers}},
  ml:{...ml,course:{...ml.course,languages:["python"],runtime:"pyodide",description:"Khám phá dữ liệu, huấn luyện mô hình nhỏ và đánh giá đúng bằng Python."},sources:ml.sourceCatalog.map(s=>({...s,collection:s.packTitle,topic:s.title,url:"/sources/ml/"+s.file})),
    problemDetails(id){const p=ml.problemDetails(id);return {...ml.problems[id],...p,starters:p.starters??{python:p.starter??"def solve(data):\n    # Viết lời giải của bạn\n    return None"}}},
    helpers:{python:"import numpy as np\nimport pandas as pd\n# solve(data) nhận dữ liệu JSON và trả giá trị JSON."}}
};
export function getCourse(id="dsa") {
  const c=courseRegistry[id];
  if(!c) throw Object.assign(Error("Không tìm thấy khóa học."),{statusCode:404});
  return c;
}
export function courseForProblem(id) {
  const c=Object.values(courseRegistry).find(c=>c.problems[id]);
  if(!c) throw Object.assign(Error("Bài code không tồn tại."),{statusCode:404});
  return c;
}
