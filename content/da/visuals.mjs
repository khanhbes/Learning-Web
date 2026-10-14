export const illustrationRows=[
 {id:1,region:'North',product:'Tea',month:'2026-01',quantity:2,price:30,revenue:60},
 {id:2,region:'South',product:'Cake',month:'2026-01',quantity:1,price:50,revenue:50},
 {id:3,region:'North',product:'Cake',month:'2026-02',quantity:3,price:50,revenue:150},
 {id:4,region:'East',product:'Tea',month:'2026-02',quantity:4,price:30,revenue:120},
 {id:5,region:'South',product:'Tea',month:'2026-03',quantity:2,price:30,revenue:60},
 {id:6,region:'East',product:'Cake',month:'2026-03',quantity:1,price:50,revenue:50},
];
export function visualFor(scene,lessonId){return{scene,lessonId,rows:structuredClone(illustrationRows),xLabel:scene==='correlation'?'Số lượng (sản phẩm)':scene==='histogram'||scene==='statistics'?'Doanh thu đơn (nghìn đồng)':'Khu vực / tháng',yLabel:scene==='histogram'?'Số đơn (đơn)':scene==='correlation'?'Doanh thu (nghìn đồng)':'Doanh thu (nghìn đồng)',unit:'nghìn đồng',total:490,description:'6 đơn giả lập; mỗi hàng là một đơn, revenue=quantity×price. North210,South110,East170; không có dữ liệu cá nhân thật.',controls:['Chạy','Dừng','Bước trước','Bước sau','Tốc độ','Reset','Thay dữ liệu']};}
