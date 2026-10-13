"""Rebuild the checked source index. Image filenames are never interpreted as lesson IDs."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]
FOLDER = ROOT / 'study documents' / 'ML'
PACKS = [
 ('handbook', 'Cẩm nang ML đầy đủ', [807660311,807484306,806473750,806416452,806473744,807485581,807877651,805696647,806530621,807699729,806687285,802699705,807921342,806785671,806093391,806790527,807901017,806118948,807284854],
  ['Bìa','Nền tảng ML','Các loại học','Dataset và feature','Tiền xử lý','EDA','Supervised','Regression','Classification','Unsupervised','Feature engineering','Metrics','Cross-validation','Bias và variance','Ensemble','PCA và interpretability','Dự án','MLOps','Ôn tập']),
 ('basic','ML dành cho lập trình viên',[808730302,807590284,809979323,809544128,809209957,809386657,809226191,809980279,808661757,809259108,809235391,809039208,809168003,808123932,809940084],
  ['Giới thiệu','Các loại ML','Kiểu dữ liệu','Features và labels','Train validation test','Preprocessing','Regression','Classification','Clustering','Thuật toán','Overfit underfit','Đánh giá','Feature engineering','Cải thiện model','Tổng kết']),
 ('cover','Ghi chú cơ bản',[809465304],['Bìa và lộ trình']),
 ('interview','35 câu hỏi phỏng vấn',[825567823,825268151,825273896,823562989,821665106,820935142,819470891],
  ['Phỏng vấn 1–5','Phỏng vấn 6–10','Phỏng vấn 11–15','Phỏng vấn 16–20','Phỏng vấn 21–25','Phỏng vấn 26–30','Phỏng vấn 31–35']),
 ('algorithms','Các thuật toán cần biết',[839200958,829941342,836930971,839361200,839766844,840001573,840333526,840404900,840642329,840714558,840809089,840923029],
  ['Bìa thuật toán','Decision Tree','Logistic Regression','K-Means','Transformer','Gradient Boosting','SVM','Random Forest','KNN','Neural Network','Naive Bayes','Linear Regression']),
 ('overview','Ghi chú ML tổng quan',[841425779,841754926,837142919,840498749,841013435,839011137,842492234,843548500,839475682,840408070,842143160],
  ['Bìa','Giới thiệu','Các loại ML','Quy trình','Thuật ngữ','Supervised','Unsupervised','Huấn luyện đánh giá','CV metrics','Ensemble','Tổng kết']),
]
LESSONS = {
 807660311:[1],807484306:[1],806473750:[1],806416452:[7],806473744:[9,10,11,36],807485581:[5,8],807877651:[14,18],805696647:[14,15,16,17],806530621:[18,19,20,21,22,23],807699729:[31,32,33],806687285:[12],802699705:[25,26,27],807921342:[29,30],806785671:[16,17,28],806093391:[21,41,42],806790527:[34,43],807901017:[37],806118948:[38,39,51],807284854:[40],
 808730302:[1],807590284:[1],809979323:[7],809544128:[7],809209957:[9],809386657:[10,11],809226191:[14,15,27],809980279:[18,19,20,21,22,23],808661757:[31,32,33,44],809259108:[14,18,19,20,21,22,23,31],809235391:[16,17,28],809039208:[25,26,27],809168003:[12,43],808123932:[28,29,30],809940084:[40],809465304:[1],
 825567823:[1,49,50],825268151:[49,50],825273896:[10,11,12,17,43],823562989:[16,17,21,28],821665106:[36,38,39,51],820935142:[49,50],819470891:[50,51],
 839200958:[14],829941342:[20],836930971:[18],839361200:[31],839766844:[48],840001573:[41],840333526:[23],840404900:[21],840642329:[19],840714558:[47],840809089:[22],840923029:[14],
 841425779:[1],841754926:[1],837142919:[1,52],840498749:[9,36,37],841013435:[7],839011137:[14,18],842492234:[31,32,33,34,46],843548500:[9,16,28],839475682:[25,26,27,29,30],840408070:[21,41,42],842143160:[40],
}
files = {int(p.name.split('_')[0]): p for p in FOLDER.glob('*.jpg')}
catalog=[]
for key, name, prefixes, titles in PACKS:
    for page,(prefix,title) in enumerate(zip(prefixes,titles)):
        path=files[prefix]
        interview_ids=[f'ml-interview-{n:02}' for n in range(page*5+1,page*5+6)] if key=='interview' else []
        lesson_ids=LESSONS[prefix]
        catalog.append({'id':f'ML-{prefix}','courseId':'ml','prefix':str(prefix),'file':path.name,
                        'path':f'study documents/ML/{path.name}','sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                        'pack':key,'packTitle':name,'page':page if key in ('handbook','algorithms','overview') else page+1,
                        'title':title,'topics':[title],'lessonIds':lesson_ids,'interviewIds':interview_ids,
                        'uses':['lesson']+(['interview'] if interview_ids else [])+(['review'] if 'Tổng' in title or 'Ôn' in title or 'Bìa' in title else [])})
assert len(catalog)==65 and len(files)==65
assert len({c['sha256'] for c in catalog})==65
(Path(__file__).parent/'sources.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Catalog: {len(catalog)} ảnh, đủ nguồn và SHA-256.')
