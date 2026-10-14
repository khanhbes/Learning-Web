import type { Course, Language } from './types';

export const languageName: Record<Language, string> = {python:'Python',cpp:'C++17',shell:'Git mô phỏng'};
export const languageFlag: Record<Language, string> = {python:'Py',cpp:'C+',shell:'Git'};
export const courseDetails: Record<string,{icon:string;tagline:string;description:string;capstone:string;tasks:string[]}> = {
  dsa:{icon:'code',tagline:'PYTHON & C++ · TƯ DUY GIẢI BÀI',description:'Hiểu cấu trúc dữ liệu và thuật toán bằng từng bước trực quan.',capstone:'Lập kế hoạch học thông minh',tasks:['Sắp lịch theo tiên quyết bằng đồ thị','Chọn công việc bằng priority queue','Thống kê thời gian bằng prefix sum']},
  ml:{icon:'brain',tagline:'PYTHON · TỪ DỮ LIỆU ĐẾN DỰ ĐOÁN',description:'Khám phá mô hình qua biểu đồ, dữ liệu nhỏ và Python.',capstone:'Dự đoán khách hàng ngừng sử dụng dịch vụ',tasks:['Tiền xử lý học từ train, tránh leakage','Huấn luyện và dự đoán đúng cấu hình','Tính metric và kiểm tra trường hợp biên']},
  da:{icon:'layers',tagline:'PYTHON · TỪ BẢNG SỐ ĐẾN CÂU CHUYỆN',description:'Làm sạch, phân tích và trình bày dữ liệu bằng bảng và biểu đồ có thể thao tác.',capstone:'Dashboard cửa hàng Byte',tasks:['Làm sạch đơn hàng, giữ đúng dữ liệu hợp lệ','Tính KPI và tổng hợp theo nhóm','Tạo chuỗi dữ liệu cho biểu đồ báo cáo']},
  git:{icon:'network',tagline:'GIT & GITHUB · CÙNG XÂY, CÙNG LƯU',description:'Thấy từng tệp đi qua staging, commit và nhánh trong một kho Git mô phỏng an toàn.',capstone:'Cộng tác xây một dự án nhỏ',tasks:['Lưu thay đổi thành commit đúng nội dung','Làm việc với nhánh và lịch sử','Đồng bộ và xử lý tình huống cộng tác']},
};
export function courseInfo(course:Course) {const info=courseDetails[course.id] || {icon:course.icon||'book',tagline:course.tagline||'KHÁM PHÁ CÙNG BYTE',description:course.description||'',capstone:'Dự án cuối khóa',tasks:[]};return {...info,capstone:course.capstoneTitle||info.capstone};}
export function courseLanguages(course:Course):Language[] {return course.languages?.length?course.languages:['python'];}
export function currentLanguage(course:Course,language?:Language):Language {const allowed=courseLanguages(course);return language&&allowed.includes(language)?language:allowed[0];}
export function gitCourse(course:Course) {return course.runtime==='git-sim'||course.id==='git';}
export function pythonDataCourse(course:Course) {return ['ml-python','pyodide','pyodide-python'].includes(course.runtime||'')||['ml','da'].includes(course.id);}
export function courseRunner(health:any,course:Course) {return gitCourse(course)?health?.gitRunner:pythonDataCourse(course)?health?.mlRunner:health?.runner;}
export function editorLanguageName(course:Course,language:Language) {return language==='shell'?'Lệnh Git · mô phỏng':language==='cpp'?'C++17':pythonDataCourse(course)?'Python 3.14 · dữ liệu':'Python 3.12';}
export function mandatoryLessons(course:Course) {return course.mandatoryCount??course.lessons?.filter(l=>l.kind!=='advanced').length??0;}
export function courseIconName(name:string) {return ({chart:'layers',table:'layers',spreadsheet:'layers',sql:'code',branch:'network',history:'clock',cloud:'link',dashboard:'target'} as Record<string,string>)[name]||name;}
