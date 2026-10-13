// Tiny, deterministic experiments. They teach real library APIs without large downloads/datasets.
export const demonstrations={
 3:`import numpy as np
a = np.array([2., 3.])
b = np.array([4., 1.])
print('Nhân từng phần tử:', (a * b).tolist())
print('Tích vô hướng:', float(a @ b))
print('Shape:', a.shape)
`,
 4:`import pandas as pd
df = pd.DataFrame({'group': ['A','A','B'], 'value': [10.,20.,30.]})
print(df.groupby('group')['value'].mean().to_dict())
print(df.dtypes)
`,
 5:`import numpy as np
values = np.array([10., 12., 100.])
print('Mean:', float(values.mean()))
print('Median:', float(np.median(values)))
print('Population variance:', float(values.var(ddof=0)))
`,
 8:`import numpy as np
import matplotlib.pyplot as plt
values = np.array([10,11,12,13,14,80])
plt.hist(values, bins=[0,20,40,60,80,100])
plt.xlabel('Giá trị (đơn vị giả lập)')
plt.ylabel('Số mẫu')
plt.title('Một outlier ảnh hưởng phân phối')
plt.savefig('/tmp/eda.png')
print('Mean/median:', float(values.mean()), float(np.median(values)))
`,
 11:`import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
train = np.array([[2.], [4.]])
scaler = StandardScaler().fit(train)
print('Test6:', scaler.transform([[6.]]).tolist())
encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
encoder.fit([['A'], ['B']])
print('Category mới:', encoder.transform([['C']]).tolist())
`,
 14:`import numpy as np
from sklearn.linear_model import LinearRegression
X = np.array([[1.], [2.], [3.]])
y = np.array([3.,5.,7.])
model = LinearRegression().fit(X,y)
print('Slope/intercept:', model.coef_.tolist(), float(model.intercept_))
print('Query4:', model.predict([[4.]]).tolist())
`,
 16:`import numpy as np
from sklearn.preprocessing import PolynomialFeatures
features = PolynomialFeatures(degree=3, include_bias=True)
print(features.fit_transform(np.array([[2.], [3.]])).tolist())
`,
 17:`import numpy as np
from sklearn.linear_model import Ridge, Lasso
X = np.array([[-2.],[-1.],[0.],[1.],[2.]])
y = np.array([-4.,-2.,0.,2.,4.])
for model in [Ridge(alpha=2.,fit_intercept=False), Lasso(alpha=0.4,fit_intercept=False, max_iter=1000)]:
    model.fit(X,y)
    print(type(model).__name__, model.coef_.tolist())
`,
 18:`import numpy as np
from sklearn.linear_model import LogisticRegression
X = np.array([[-2.],[-1.],[1.],[2.]])
y = np.array([0,0,1,1])
model = LogisticRegression(solver='lbfgs', random_state=42, max_iter=200).fit(X,y)
p = model.predict_proba([[0.5]])[0,1]
print('Xác suất:', float(p), 'Ngưỡng0.7:', int(p>=0.7))
`,
 19:`from sklearn.neighbors import KNeighborsClassifier
model = KNeighborsClassifier(n_neighbors=3, algorithm='brute', n_jobs=1)
model.fit([[0.],[1.],[2.],[3.],[4.]], [0,0,1,1,1])
print(model.predict([[2.2]]).tolist())
print(model.predict_proba([[2.2]]).tolist())
`,
 20:`from sklearn.tree import DecisionTreeClassifier
model = DecisionTreeClassifier(max_depth=2, random_state=42)
model.fit([[0.],[1.],[2.],[3.]], [0,0,1,1])
print('Thresholds:', model.tree_.threshold.tolist())
print('Prediction:', model.predict([[1.5],[2.5]]).tolist())
`,
 21:`from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier(n_estimators=8,max_depth=2,random_state=42,n_jobs=1)
model.fit([[0.],[1.],[2.],[3.],[4.],[5.]], [0,0,0,1,1,1])
print('Mean probabilities:', model.predict_proba([[2.5]]).tolist())
print('Final label:', model.predict([[2.5]]).tolist())
`,
 22:`from sklearn.naive_bayes import GaussianNB
model = GaussianNB().fit([[0.],[0.2],[1.],[1.2]], [0,0,1,1])
print(model.predict_proba([[0.1],[1.1]]).tolist())
`,
 23:`from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
model = make_pipeline(StandardScaler(), SVC(kernel='linear',C=1.,random_state=42))
model.fit([[-2.],[-1.],[1.],[2.]], [0,0,1,1])
print(model.predict([[-0.5],[0.5]]).tolist())
`,
 25:`from sklearn.metrics import confusion_matrix, precision_recall_fscore_support
y = [1,1,1,0,0,0]
pred = [1,1,0,1,0,0]
print('Hàng actual, cột predicted [0,1]:', confusion_matrix(y,pred,labels=[0,1]).tolist())
print(precision_recall_fscore_support(y,pred,average='binary',zero_division=0))
`,
 26:`from sklearn.metrics import roc_auc_score, roc_curve, precision_recall_curve
y = [0,1,0,1]
scores = [0.2,0.8,0.5,0.5]
print('AUC:', float(roc_auc_score(y,scores)))
print('ROC:', [a.tolist() for a in roc_curve(y,scores)])
print('PR:', [a.tolist() for a in precision_recall_curve(y,scores)])
`,
 27:`from sklearn.metrics import r2_score, mean_absolute_error, root_mean_squared_error
y, pred = [0.,1.], [100.,100.]
print('R²:', float(r2_score(y,pred)))
print('MAE:', float(mean_absolute_error(y,pred)))
print('RMSE:', float(root_mean_squared_error(y,pred)))
`,
 29:`import numpy as np
from sklearn.model_selection import KFold
ids = np.arange(6)
folds = KFold(n_splits=3,shuffle=True,random_state=42)
for train, validation in folds.split(ids):
    print('Train:', train.tolist(), 'Validation:', validation.tolist())
`,
 30:`from sklearn.model_selection import GridSearchCV
from sklearn.tree import DecisionTreeClassifier
X=[[0.],[1.],[2.],[3.],[4.],[5.],[6.],[7.]]
y=[0,0,0,0,1,1,1,1]
search=GridSearchCV(DecisionTreeClassifier(random_state=42), {'max_depth':[1,2]},cv=2,n_jobs=1)
search.fit(X,y)
print(search.best_params_, float(search.best_score_))
`,
 31:`from sklearn.cluster import KMeans
model=KMeans(n_clusters=2,n_init=5,random_state=42)
points=[[0.,0.],[0.2,0.],[5.,5.],[5.2,5.]]
print(model.fit_predict(points).tolist())
print(model.cluster_centers_.tolist())
`,
 32:`from scipy.cluster.hierarchy import linkage
import numpy as np
points=np.array([[0.,0.],[1.,0.],[5.,0.]])
print(linkage(points,method='single').tolist())
`,
 33:`from sklearn.cluster import DBSCAN
points=[[0.,0.],[0.1,0.],[0.,0.1],[5.,5.]]
model=DBSCAN(eps=0.2,min_samples=3,n_jobs=1)
print(model.fit_predict(points).tolist())
`,
 34:`from sklearn.decomposition import PCA
points=[[0.,0.],[1.,2.],[2.,4.]]
model=PCA(n_components=1,svd_solver='full')
print(model.fit_transform(points).tolist())
print('Direction:',model.components_.tolist())
print('Variance sklearn dùng ddof1:',model.explained_variance_.tolist())
`,
 36:`from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
train=[[0.,10.],[1.,None],[2.,30.],[3.,40.]]
y=[0,0,1,1]
pipeline=make_pipeline(SimpleImputer(strategy='mean'),StandardScaler(),LogisticRegression(random_state=42))
pipeline.fit(train,y)
print(pipeline.predict_proba([[None,100.]]).tolist())
`,
};
