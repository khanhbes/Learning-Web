export const demonstrations={
 2:`import numpy as np
values = np.array([10, 20, 30], dtype=float)
print(values.shape)  # (3,)
print(values.mean())  # 20.0
print(values * 2)  # [20. 40. 60.]
`,
 12:`import pandas as pd
df = pd.DataFrame({'region': ['North', 'South', 'North'],
                   'revenue': [60, 50, 150]})
print(df.groupby('region', sort=True)['revenue'].sum().to_dict())
# {'North': 210, 'South': 50}
`,
 20:`import numpy as np
values = np.array([2, 4, 4, 4, 5, 5, 7, 9], dtype=float)
print(values.mean())  # 5.0
print(np.var(values, ddof=0))  # 4.0: population variance
print(np.std(values, ddof=0))  # 2.0
print(np.percentile([10,20,30,40,50,60,70,80], [25,75], method='linear'))
# [27.5 62.5]
`,
 24:`import pandas as pd
series = pd.Series([0, None, 10], dtype='float64')
print(series.isna().sum())  # 1
print(series.fillna(series.median()).tolist())  # [0.0, 5.0, 10.0]
# Label khác vị trí:
df = pd.DataFrame({'revenue': [60, 50]}, index=['first', 'second'])
print(df.iloc[0]['revenue'])  # 60
print(df.loc['second', 'revenue'])  # 50
`,
 27:`import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
months, revenue = ['Jan', 'Feb', 'Mar'], [110, 270, 110]
fig, ax = plt.subplots()
ax.plot(months, revenue, marker='o')
ax.set_xlabel('Tháng năm 2026')
ax.set_ylabel('Doanh thu (nghìn đồng)')
ax.set_title('Cửa hàng Byte — dữ liệu giả lập')
ax.set_ylim(bottom=0)
print(sum(revenue))  # 490
# fig.savefig('revenue.png') chỉ ghi filesystem ảo của môi trường cách ly.
plt.close(fig)
`,
};
