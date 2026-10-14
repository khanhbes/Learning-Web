// Teaching solutions are independent Python implementations; official checkers are in Node.
export const solutions={
 'da-row-count':`def solve(data):
    return len(data['rows'])
`,
 'da-mean':`def solve(data):
    return sum(data['values']) / len(data['values'])
`,
 'da-sum':`def solve(data):
    return sum(row['quantity'] * row['price'] for row in data['rows'])
`,
 'da-conditional':`def solve(data):
    return sum(row['value'] for row in data['rows'] if row['region'] == data['region'] and row['value'] >= data['threshold'])
`,
 'da-lookup':`def solve(data):
    first = {}
    for row in data['rows']:
        if row['key'] not in first:
            first[row['key']] = row['value']
    return [first.get(key) for key in data['queries']]
`,
 'da-pivot':`def solve(data):
    regions = sorted(set(row['region'] for row in data['rows']))
    products = sorted(set(row['product'] for row in data['rows']))
    totals = {(r, p): 0 for r in regions for p in products}
    for row in data['rows']:
        totals[(row['region'], row['product'])] += row['value']
    return {'regions': regions, 'products': products,
            'values': [[totals[(r, p)] for p in products] for r in regions]}
`,
 'da-where':`def solve(data):
    return [row['id'] for row in data['rows'] if row['region'] == data['region'] and row['value'] >= data['threshold']]
`,
 'da-distinct':`def solve(data):
    return sorted(set(data['values']))
`,
 'da-topk':`def solve(data):
    rows = sorted(data['rows'], key=lambda row: (-row['value'], row['id']))
    return [row['id'] for row in rows[:data['k']]]
`,
 'da-aggregate':`def solve(data):
    numbers = [value for value in data['values'] if value is not None]
    return {'rows': len(data['values']), 'nonNull': len(numbers),
            'sum': sum(numbers) if numbers else None,
            'mean': sum(numbers) / len(numbers) if numbers else None}
`,
 'da-group':`def solve(data):
    groups = {}
    for row in data['rows']:
        groups[row['region']] = groups.get(row['region'], 0) + row['value']
    return groups
`,
 'da-having':`def solve(data):
    groups = {}
    for row in data['rows']:
        groups[row['region']] = groups.get(row['region'], 0) + row['value']
    return {region: total for region, total in groups.items() if total >= data['threshold']}
`,
 'da-inner-join':`def solve(data):
    return [{'id': left['id'], 'name': right['name']}
            for left in data['left'] for right in data['right'] if left['key'] == right['key']]
`,
 'da-left-join':`def solve(data):
    result = []
    for left in data['left']:
        matches = [right for right in data['right'] if left['key'] == right['key']]
        for right in matches:
            result.append({'id': left['id'], 'name': right['name']})
        if not matches:
            result.append({'id': left['id'], 'name': None})
    return result
`,
 'da-case':`def solve(data):
    return ['High' if x >= data['high'] else 'Medium' if x >= data['low'] else 'Low' for x in data['values']]
`,
 'da-running':`def solve(data):
    rows = sorted(data['rows'], key=lambda row: (row['day'], row['id']))
    result, total = [], 0
    for row in rows:
        total += row['value']
        result.append({'id': row['id'], 'total': total})
    return result
`,
 'da-rank':`def solve(data):
    rows = sorted(data['rows'], key=lambda row: (-row['value'], row['id']))
    result, rank, dense = [], 0, 0
    for i, row in enumerate(rows):
        if i == 0 or row['value'] != rows[i - 1]['value']:
            rank, dense = i + 1, dense + 1
        result.append({'id': row['id'], 'rowNumber': i + 1, 'rank': rank, 'denseRank': dense})
    return result
`,
 'da-summary':`def solve(data):
    import statistics
    values = data['values']
    return {'mean': statistics.mean(values), 'median': statistics.median(values),
            'variance': statistics.pvariance(values), 'range': max(values) - min(values)}
`,
 'da-quartile':`def solve(data):
    import math
    values = sorted(data['values'])
    def quantile(p):
        h = (len(values) - 1) * p
        lo, hi = math.floor(h), math.ceil(h)
        return values[lo] * (hi - h) + values[hi] * (h - lo) if lo != hi else values[lo]
    q1, q3 = quantile(0.25), quantile(0.75)
    low, high = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
    return {'q1': q1, 'q3': q3, 'indices': [i for i, x in enumerate(data['values']) if x < low or x > high]}
`,
 'da-correlation':`def solve(data):
    import math, statistics
    x, y = data['x'], data['y']
    mx, my = statistics.mean(x), statistics.mean(y)
    numerator = sum((a - mx) * (b - my) for a, b in zip(x, y))
    denominator = math.sqrt(sum((a - mx) ** 2 for a in x) * sum((b - my) ** 2 for b in y))
    return numerator / denominator if denominator else None
`,
 'da-missing':`def solve(data):
    import statistics
    numbers = [x for x in data['values'] if x is not None]
    fill = statistics.median(numbers) if numbers else data['fallback']
    return [fill if x is None else x for x in data['values']]
`,
 'da-dedup':`def solve(data):
    seen, result = set(), []
    for row in data['rows']:
        if row['id'] not in seen:
            result.append(row)
            seen.add(row['id'])
    return result
`,
 'da-clean-orders':`def solve(data):
    import math
    seen, rows, rejected, duplicates = set(), [], [], 0
    for row in data['rows']:
        if row['id'] in seen:
            duplicates += 1
            continue
        seen.add(row['id'])
        numbers = all(type(row.get(key)) in (int, float) and math.isfinite(row[key]) and row[key] >= 0 for key in ('quantity', 'price'))
        if not numbers or row.get('region') not in ('North', 'South', 'East') or row.get('month') not in ('2026-01', '2026-02', '2026-03'):
            rejected.append(row['id'])
            continue
        cleaned = {key: row[key] for key in ('id', 'region', 'month', 'quantity', 'price')}
        cleaned['revenue'] = row['quantity'] * row['price']
        rows.append(cleaned)
    return {'rows': rows, 'rejected': rejected, 'duplicates': duplicates}
`,
 'da-kpi':`def solve(data):
    revenue = sum(row['revenue'] for row in data['rows'])
    groups = {}
    for row in data['rows']:
        group = groups.setdefault(row['region'], {'orders': 0, 'revenue': 0})
        group['orders'] += 1
        group['revenue'] += row['revenue']
    orders = len(data['rows'])
    return {'revenue': revenue, 'orders': orders, 'averageOrder': revenue / orders if orders else 0, 'byRegion': groups}
`,
 'da-chart-series':`def solve(data):
    result = []
    for month in data['months']:
        rows = [row for row in data['rows'] if row['month'] == month]
        result.append({'month': month, 'revenue': sum(row['revenue'] for row in rows), 'orders': len(rows)})
    return result
`,
 'da-growth':`def solve(data):
    return (data['current'] - data['previous']) / data['previous'] if data['previous'] != 0 else None
`,
 'da-weighted':`def solve(data):
    weight = sum(data['weights'])
    return sum(x * w for x, w in zip(data['values'], data['weights'])) / weight if weight else None
`,
 'da-cohort':`def solve(data):
    groups = {}
    for user in data['users']:
        group = groups.setdefault(user['cohort'], {'total': 0, 'active': 0, 'rate': 0})
        group['total'] += 1
        group['active'] += int(user['active'])
    for group in groups.values():
        group['rate'] = group['active'] / group['total']
    return groups
`,
 'da-ab':`def solve(data):
    a, b = data['successA'] / data['totalA'], data['successB'] / data['totalB']
    return {'rateA': a, 'rateB': b, 'difference': b - a}
`,
 'da-privacy':`def solve(data):
    return [{'region': row['region'], 'value': row['value']} for row in data['rows']]
`,
 'da-quality':`def solve(data):
    values = data['values']
    return {'total': len(values), 'missing': sum(x is None for x in values),
            'negative': sum(x is not None and x < 0 for x in values),
            'valid': sum(x is not None and x >= 0 for x in values)}
`,
 'da-full-join':`def solve(data):
    used, result = set(), []
    for left in data['left']:
        matches = [(i, right) for i, right in enumerate(data['right']) if left['key'] == right['key']]
        for i, right in matches:
            used.add(i)
            result.append({'id': left['id'], 'name': right['name']})
        if not matches:
            result.append({'id': left['id'], 'name': None})
    result.extend({'id': None, 'name': right['name']} for i, right in enumerate(data['right']) if i not in used)
    return result
`,
 'da-funnel':`def solve(data):
    return {'signup': data['signed'] / data['visited'] if data['visited'] else 0,
            'purchase': data['purchased'] / data['signed'] if data['signed'] else 0,
            'total': data['purchased'] / data['visited'] if data['visited'] else 0}
`,
};
export const sqlSetups={
 'da-sql-select':`    conn.execute('CREATE TABLE orders(id INTEGER, region TEXT, value REAL)')
    conn.executemany('INSERT INTO orders VALUES (?,?,?)', [(r['id'], r['region'], r['value']) for r in data['rows']])
`,
 'da-sql-group':`    conn.execute('CREATE TABLE orders(id INTEGER, region TEXT, value REAL)')
    conn.executemany('INSERT INTO orders VALUES (?,?,?)', [(r['id'], r['region'], r['value']) for r in data['rows']])
`,
 'da-sql-join':`    conn.execute('CREATE TABLE employees(position INTEGER, id INTEGER, key INTEGER)')
    conn.execute('CREATE TABLE categories(position INTEGER, key INTEGER, name TEXT)')
    conn.executemany('INSERT INTO employees VALUES (?,?,?)', [(i, r['id'], r['key']) for i, r in enumerate(data['left'])])
    conn.executemany('INSERT INTO categories VALUES (?,?,?)', [(i, r['key'], r['name']) for i, r in enumerate(data['right'])])
`,
 'da-sql-window':`    conn.execute('CREATE TABLE orders(id INTEGER, day INTEGER, value REAL)')
    conn.executemany('INSERT INTO orders VALUES (?,?,?)', [(r['id'], r['day'], r['value']) for r in data['rows']])
`,
};
const sqlQueries={
 'da-sql-select':`SELECT id FROM orders WHERE region = :region AND value >= :threshold ORDER BY id`,
 'da-sql-group':`SELECT region, SUM(value) AS total FROM orders GROUP BY region ORDER BY region`,
 'da-sql-join':`SELECT e.id, c.name FROM employees e INNER JOIN categories c ON e.key = c.key ORDER BY e.position, c.position`,
 'da-sql-window':`SELECT id, SUM(value) OVER (ORDER BY day, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS total FROM orders ORDER BY day, id`,
};
const sqlReturns={
 'da-sql-select':`[row[0] for row in rows]`,
 'da-sql-group':`{row[0]: row[1] for row in rows}`,
 'da-sql-join':`[{'id': row[0], 'name': row[1]} for row in rows]`,
 'da-sql-window':`[{'id': row[0], 'total': row[1]} for row in rows]`,
};
export function sqlStarter(id){if(!sqlSetups[id])return null;return `def solve(data):
    import sqlite3
    conn = sqlite3.connect(':memory:')
${sqlSetups[id]}    # Viết câu SQL bên dưới. Dữ liệu và schema đã được tạo trong bộ nhớ.
    query = '''SELECT ...'''
    rows = conn.execute(query, data).fetchall()
    conn.close()
    return ${sqlReturns[id]}
`;}
for(const id of Object.keys(sqlSetups))solutions[id]=sqlStarter(id).replace('SELECT ...',sqlQueries[id]);
export function solution(id,language='python'){return language==='python'?solutions[id]:undefined;}
