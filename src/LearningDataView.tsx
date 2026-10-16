import { useId } from 'react';
import { GitScenarioPreview } from './GitWorkbench';
import { DockerScenarioPreview } from './DockerVisualizer';
import './teaching.css';

const labels: Record<string, string> = {
  tokens:'Các mảnh token',vocab:'Bảng token',candidates:'Các ứng viên',weight:'Trọng số',score:'Điểm',logits:'Điểm trước chuẩn hóa',probabilities:'Xác suất',documents:'Các tài liệu',chunks:'Các đoạn',citations:'Nguồn trích dẫn',context:'Ngữ cảnh',budget:'Ngân sách token',images:'Các image',containers:'Các container',volumes:'Vùng lưu bền vững',networks:'Các mạng',ports:'Ánh xạ cổng',status:'Trạng thái',embedding:'Vector biểu diễn',retrieved:'Kết quả truy xuất',relevant:'Các tài liệu liên quan',topK:'Số kết quả giữ lại',chunkSize:'Độ dài đoạn',overlap:'Phần chồng lặp',
  nums: 'Các phần tử', values: 'Các giá trị', arr: 'Mảng', array: 'Mảng', target: 'Giá trị cần tìm',
  matrix: 'Ma trận', A: 'Ma trận A', B: 'Ma trận B', a:'a',b:'b',x:'x',y:'y',
  rows: 'Các dòng dữ liệu', data: 'Dữ liệu', records: 'Bản ghi', columns: 'Các cột',
  train: 'Tập huấn luyện', test: 'Tập kiểm tra', validation: 'Tập xác thực',
  labels: 'Nhãn', features: 'Đặc trưng', predictions: 'Dự đoán', y_true: 'Nhãn thật', y_pred: 'Dự đoán',
  nodes: 'Các đỉnh', edges: 'Các cạnh', graph: 'Đồ thị', start: 'Điểm bắt đầu', goal: 'Đích',
  k: 'Giá trị k', n: 'Số phần tử', left: 'Bên trái', right: 'Bên phải', root: 'Gốc',
  vector: 'Vector', u: 'Vector u', v: 'Vector v', tasks: 'Các công việc',
  observations: 'Quan sát', observation: 'Quan sát', memory: 'Bộ nhớ', state: 'Trạng thái',
  order_id:'Mã đơn (order_id)',customer_id:'Mã khách (customer_id)',quantity:'Số lượng (quantity)',price:'Đơn giá (price)',value:'Giá trị (value)',region:'Vùng (region)',product:'Sản phẩm (product)',day:'Ngày (day)',group:'Nhóm (group)',field:'Cảm biến (field)',fields:'Các trường cần đọc (fields)',battery:'Pin (battery)',dirty:'Có bụi (dirty)',temperature:'Nhiệt độ (temperature)',zero:'Số nhãn 0',one:'Số nhãn 1',total:'Tổng',count:'Số lượng',
  rules: 'Các luật', text: 'Văn bản', s: 'Chuỗi', query: 'Truy vấn', commands: 'Các lệnh',
};
function title(key: string) { return labels[key] || key.replaceAll('_', ' '); }
function scalar(value: unknown) {
  if (value === null) return 'Chưa có (null)';
  if (typeof value === 'boolean') return value ? 'Đúng (true)' : 'Sai (false)';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'Không xác định';
  if (typeof value === 'string') return value === '' ? 'Chuỗi rỗng' : value;
  return JSON.stringify(value);
}
function isScalar(value: unknown) { return value === null || ['number', 'string', 'boolean'].includes(typeof value); }

function GraphData({ value }: { value: any }) {
  const id = useId().replaceAll(':', '');
  const edges = (Array.isArray(value.edges) ? value.edges : []).filter((e: any) => Array.isArray(e) && e.length >= 2);
  const nodes = Array.isArray(value.nodes) ? value.nodes.map((n: any) => typeof n === 'object' ? n.id ?? n.label : n)
    : Number.isInteger(value.n) && value.n >= 0 && value.n <= 1000 ? Array.from({length:value.n},(_,i)=>i)
    : Array.from(new Set(edges.flatMap((e: any) => e.slice(0, 2))));
  const edgeText=edges.map((edge: any) => `${value.directed===undefined?'(':''}${scalar(edge[0])}${value.directed===undefined?', ':value.directed?' → ':' — '}${scalar(edge[1])}${value.directed===undefined?')':''}${edge.length > 2 ? ` · trọng số ${scalar(edge[2])}` : ''}`).join(' · ') || 'Không có cạnh';
  if (!nodes.length || nodes.length > 18) return <div className="learning-graph"><p>{nodes.length} đỉnh · {edges.length} cạnh. Danh sách cạnh: {edgeText}.</p></div>;
  const positions = new Map(nodes.map((node: any, index: number) => [String(node), {
    x: 220 + 145 * Math.cos(index * Math.PI * 2 / nodes.length - Math.PI / 2),
    y: 155 + 108 * Math.sin(index * Math.PI * 2 / nodes.length - Math.PI / 2),
  }]));
  return <figure className="learning-graph"><svg viewBox="0 0 440 310" role="img" aria-label={`Đồ thị có ${nodes.length} đỉnh và ${edges.length} cạnh. Chi tiết cạnh ở bên dưới.`}>
    <defs><marker id={id + '-arrow'} markerWidth="6" markerHeight="6" refX="20" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#80918b" /></marker></defs>
    {edges.map((edge: any, index: number) => { const a = positions.get(String(edge[0])) as any, b = positions.get(String(edge[1])) as any;
      if (!a || !b) return null;
      return <g key={index}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#a6b7af" strokeWidth="2.5" markerEnd={value.directed ? `url(#${id}-arrow)` : undefined}/>{edge.length > 2 && <text x={(a.x+b.x)/2} y={(a.y+b.y)/2-7} textAnchor="middle">{scalar(edge[2])}</text>}</g>;
    })}
    {nodes.map((node: any) => { const p = positions.get(String(node)) as any; return <g key={String(node)}><circle cx={p.x} cy={p.y} r="21" fill="#eff7e8" stroke="#65a833" strokeWidth="2"/><text x={p.x} y={p.y+5} textAnchor="middle">{scalar(node)}</text></g>; })}
  </svg><figcaption>{edgeText}{value.directed===undefined&&edges.length>0&&'. Cặp đỉnh giữ nguyên thứ tự trong dữ liệu; xem đề để xác định cạnh có hướng.'}</figcaption></figure>;
}

function DataContent({ value, depth = 0 }: { value: any; depth?: number }) {
  if (isScalar(value)) return <span className="learning-value">{scalar(value)}</span>;
  if (depth > 3) return <code className="learning-inline-json">{JSON.stringify(value)}</code>;
  if (Array.isArray(value)) {
    if (!value.length) return <span className="learning-empty-data">Danh sách rỗng []</span>;
    if (value.every(isScalar)) return <div className="learning-array" role="list" aria-label="Các phần tử theo thứ tự">{value.map((item, index) => <div role="listitem" className="learning-cell" key={index}><b>{scalar(item)}</b><small>#{index}</small></div>)}</div>;
    if (value.every((row: any) => Array.isArray(row) && row.every(isScalar))) return <div className="learning-table-scroll"><table className="learning-data-table"><tbody>{value.map((row: any, i) => <tr key={i}><th scope="row">{i + 1}</th>{row.map((cell: any, j: number) => <td key={j}>{scalar(cell)}</td>)}</tr>)}</tbody></table></div>;
    if (value.every((row: any) => row && typeof row === 'object' && !Array.isArray(row)) && value.length <= 100) {
      const keys = Array.from(new Set(value.flatMap((row: any) => Object.keys(row))));
      return <div className="learning-table-scroll"><table className="learning-data-table"><thead><tr>{keys.map(key => <th key={key} scope="col">{title(key)}</th>)}</tr></thead><tbody>{value.map((row: any, i) => <tr key={i}>{keys.map(key => <td key={key}>{scalar(row[key] ?? null)}</td>)}</tr>)}</tbody></table></div>;
    }
    return <div className="learning-nested">{value.map((item, i) => <section key={i}><small>Mục {i+1}</small><DataContent value={item} depth={depth + 1}/></section>)}</div>;
  }
  if (value && typeof value === 'object') {
    if(!Object.keys(value).length)return <span className="learning-empty-data">Không có mục nào {'{}'}</span>;
    if(Object.keys(value).length===2&&Number.isFinite(value.a)&&Number.isFinite(value.b))return <div className="learning-addition" aria-label={`Hai số đầu vào a bằng ${value.a}, b bằng ${value.b}`}>{(['a','b'] as const).map((key,i)=><div className="learning-addend" key={key}><span>{key} = <strong>{value[key]}</strong></span>{Number.isInteger(value[key])&&value[key]>=0&&<div className="learning-counting-dots" aria-hidden="true">{Array.from({length:Math.min(12,value[key])},(_,j)=><i key={j} className={i?'second':''}/>)}{value[key]>12&&<b>…</b>}</div>}</div>)}<p>Hai giá trị được đưa vào chương trình để xử lý. Với số nguyên không âm, mỗi chấm là 1; hiển thị tối đa 12 chấm mỗi nhóm.</p></div>;
    if(Object.keys(value).length===2&&Number.isFinite(value.x)&&Number.isFinite(value.y)){
      const bound=Math.max(3,Math.abs(value.x)+1,Math.abs(value.y)+1),scale=120/bound,px=160+value.x*scale,py=145-value.y*scale;
      return <figure className="learning-coordinate"><svg viewBox="0 0 340 300" role="img" aria-label={`Điểm [${value.x}, ${value.y}], ngang trước, dọc sau.`}><path d="M20 145H320M160 275V15" fill="none" stroke="#a0b39b" strokeWidth="2"/><text x="318" y="165">x</text><text x="175" y="22">y</text><text x="144" y="163">0</text><path d={`M160 145H${px}V${py}`} fill="none" stroke="#94c85d" strokeWidth="4" strokeDasharray="6 4"/><circle cx={px} cy={py} r="11" fill="#58a929"/><text x={px+(value.x>0?-10:12)} y={py-17} textAnchor={value.x>0?'end':'start'} fill="#305f21">[{value.x}, {value.y}]</text></svg><figcaption>x = {value.x}: ngang · y = {value.y}: dọc</figcaption></figure>;
    }
    const graph = Array.isArray(value.edges);
    return <div className="learning-object">{graph && <GraphData value={value}/>}<dl>{Object.entries(value).filter(([key]) => !graph || !['nodes', 'edges'].includes(key)).map(([key, item]) => <div key={key}><dt>{title(key)}</dt><dd><DataContent value={item} depth={depth+1}/></dd></div>)}</dl></div>;
  }
  return null;
}

export default function LearningDataView({ value, label = 'Dữ liệu đang dùng', raw = true }: { value: unknown; label?: string; raw?: boolean }) {
  if (value === undefined) return null;
  if (value && typeof value === 'object' && 'initial' in value && value.initial && typeof value.initial === 'object') {
    if ('containers' in value.initial) return <div className="learning-data-view"><span className="learning-data-label">{label}</span><DockerScenarioPreview input={value}/></div>;
    if ('commits' in value.initial) return <div className="learning-data-view"><span className="learning-data-label">{label}</span><GitScenarioPreview input={value}/>{raw && <details className="learning-raw"><summary>Xem dữ liệu JSON</summary><pre>{JSON.stringify(value, null, 2)}</pre></details>}</div>;
  }
  return <div className="learning-data-view"><span className="learning-data-label">{label}</span><DataContent value={value}/>{raw && typeof value === 'object' && value !== null && <details className="learning-raw"><summary>Xem dữ liệu JSON</summary><pre>{JSON.stringify(value, null, 2)}</pre></details>}</div>;
}
