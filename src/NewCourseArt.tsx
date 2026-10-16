/** Original diagrams for the new course catalog; all labels remain text. */
export default function NewCourseArt({courseId}:{courseId:string}) {
  if(courseId==='docker')return <>
    <rect x="51" y="42" width="80" height="99" rx="13" fill="white" stroke="#9dcbd8" strokeWidth="3"/>
    {[0,1,2].map(i=><g key={i}><rect x="63" y={55+i*22} width="56" height="15" rx="5" fill={['#c4e6ef','#8ccddf','#4eacc5'][i]}/><path d={`M71 ${62+i*22}h35`} stroke="white" strokeWidth="2"/></g>)}
    <path d="M138 94h31m-9-9 9 9-9 9" stroke="#73b5c8" strokeWidth="4" fill="none" strokeLinecap="round"/>
    {[0,1].map(i=><g key={i}><rect x={181+i*59} y={49+i*21} width="49" height="65" rx="10" fill={i?'#9ed4d4':'#70bbd2'}/><rect x={190+i*59} y={60+i*21} width="31" height="28" rx="6" fill="white"/><circle cx={205+i*59} cy={102+i*21} r="4" fill="white"/></g>)}
    <text x="91" y="163" textAnchor="middle" fill="#377b91" fontSize="14" fontWeight="800">Image</text><text x="235" y="163" textAnchor="middle" fill="#377b91" fontSize="14" fontWeight="800">Containers</text>
  </>;
  if(courseId==='genai')return <>
    <path d="M59 132V42m0 90h220" stroke="#c3b5dd" strokeWidth="2"/>
    {[59,85,42,25].map((h,i)=><g key={i}><rect x={77+i*49} y={130-h} width="33" height={h} rx="7" fill={i===1?'#8a6ac5':'#c9bce6'}/><text x={93+i*49} y="151" textAnchor="middle" fill="#6a548d" fontSize="12" fontWeight="800">{['chào','bạn','học','vui'][i]}</text></g>)}
    <path d="m147 30-6 9h12z" fill="#8a6ac5"/><rect x="166" y="24" width="132" height="27" rx="13" fill="white"/><text x="232" y="42" textAnchor="middle" fontSize="12" fontWeight="800" fill="#7353aa">Token tiếp theo?</text>
  </>;
  return <>
    {[0,1,2].map(i=><g key={i}><rect x={35+i*11} y={38+i*13} width="65" height="82" rx="8" fill="white" stroke="#a4cbb4" strokeWidth="2"/><path d={`M${48+i*11} ${60+i*13}h38m-38 13h30m-30 13h36`} stroke="#b8d7c5" strokeWidth="4" strokeLinecap="round"/></g>)}
    <path d="M119 95h41m51 0h32" stroke="#9fc8ac" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="181" cy="89" r="24" fill="#d7eddb" stroke="#6da97e" strokeWidth="4"/><path d="m198 107 16 18" stroke="#6da97e" strokeWidth="8" strokeLinecap="round"/><path d="m170 88 8 8 15-17" fill="none" stroke="#6da97e" strokeWidth="4"/>
    <rect x="245" y="57" width="66" height="78" rx="12" fill="white" stroke="#a4cbb4" strokeWidth="2"/><path d="M257 77h40m-40 14h34" stroke="#b8d7c5" strokeWidth="4" strokeLinecap="round"/><rect x="256" y="104" width="43" height="19" rx="6" fill="#6da97e"/><text x="277" y="118" textAnchor="middle" fill="white" fontSize="12" fontWeight="900">[1] [2]</text>
    <text x="79" y="166" textAnchor="middle" fontSize="13" fill="#568066">Tài liệu</text><text x="185" y="166" textAnchor="middle" fontSize="13" fill="#568066">Truy xuất</text><text x="278" y="166" textAnchor="middle" fontSize="13" fill="#568066">Dẫn nguồn</text>
  </>;
}
