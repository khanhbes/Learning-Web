// Reference solutions are exposed only as teaching material. The grader uses independent JS oracles.
export const solutions = {
 'ml-baseline': `def solve(data):
    labels = data['labels']
    return int(sum(labels) > len(labels) / 2)
`,
 'ml-mean': `def solve(data):
    values = data['values']
    return sum(values) / len(values)
`,
 'ml-dot': `def solve(data):
    return sum(a * b for a, b in zip(data['a'], data['b']))
`,
 'ml-group-mean': `def solve(data):
    totals, counts = {}, {}
    for row in data['rows']:
        group = row['group']
        totals[group] = totals.get(group, 0) + row['value']
        counts[group] = counts.get(group, 0) + 1
    return {group: total / counts[group] for group, total in totals.items()}
`,
 'ml-summary': `def solve(data):
    import statistics
    values = data['values']
    return {'mean': statistics.mean(values), 'median': statistics.median(values),
            'variance': statistics.pvariance(values)}
`,
 'ml-mse': `def solve(data):
    return sum((y - pred) ** 2 for y, pred in zip(data['y'], data['pred'])) / len(data['y'])
`,
 'ml-features': `def solve(data):
    return {'X': [[row[name] for name in data['featureNames']] for row in data['rows']],
            'y': [row[data['targetName']] for row in data['rows']]}
`,
 'ml-outliers': `def solve(data):
    return [i for i, value in enumerate(data['values'])
            if value < data['low'] or value > data['high']]
`,
 'ml-split': `def solve(data):
    ids = data['indices']
    end_train = data['trainCount']
    end_validation = end_train + data['valCount']
    return {'train': ids[:end_train], 'validation': ids[end_train:end_validation],
            'test': ids[end_validation:]}
`,
 'ml-impute': `def solve(data):
    observed = [x for x in data['train'] if x is not None]
    average = sum(observed) / len(observed)
    return {'mean': average,
            'train': [average if x is None else x for x in data['train']],
            'test': [average if x is None else x for x in data['test']]}
`,
 'ml-scale': `def solve(data):
    import math
    train = data['train']
    average = sum(train) / len(train)
    std = math.sqrt(sum((x-average)**2 for x in train) / len(train)) or 1
    return {'mean': average, 'std': std,
            'train': [(x-average)/std for x in train],
            'test': [(x-average)/std for x in data['test']]}
`,
 'ml-engineer': `def solve(data):
    return [[row['price'] * row['quantity'], row['discount'] / row['price']]
            for row in data['rows']]
`,
 'ml-linear': `def solve(data):
    x, y = data['x'], data['y']
    mx, my = sum(x)/len(x), sum(y)/len(y)
    slope = sum((xi-mx)*(yi-my) for xi,yi in zip(x,y)) / sum((xi-mx)**2 for xi in x)
    intercept = my - slope*mx
    return {'slope': slope, 'intercept': intercept,
            'predictions': [slope*q+intercept for q in data['query']]}
`,
 'ml-gradient': `def solve(data):
    x, y = data['x'], data['y']
    w, b = data['w'], data['b']
    for _ in range(data['steps']):
        errors = [w*xi+b-yi for xi,yi in zip(x,y)]
        dw = 2*sum(e*xi for e,xi in zip(errors,x))/len(x)
        db = 2*sum(errors)/len(x)
        w, b = w-data['lr']*dw, b-data['lr']*db
    return {'w': w, 'b': b, 'loss': sum((w*xi+b-yi)**2 for xi,yi in zip(x,y))/len(x)}
`,
 'ml-polynomial': `def solve(data):
    return [[x**degree for degree in range(data['degree']+1)] for x in data['x']]
`,
 'ml-ridge': `def solve(data):
    numerator = sum(x*y for x,y in zip(data['x'],data['y']))
    denominator = sum(x*x for x in data['x']) + data['alpha']
    return numerator / denominator
`,
 'ml-logistic': `def solve(data):
    import math
    def sigmoid(z):
        if z >= 0:
            return 1/(1+math.exp(-z))
        ez = math.exp(z)
        return ez/(1+ez)
    probabilities = [sigmoid(sum(x*w for x,w in zip(row,data['weights']))+data['bias']) for row in data['X']]
    return {'probabilities': probabilities, 'labels': [int(p>=data['threshold']) for p in probabilities]}
`,
 'ml-knn': `def solve(data):
    neighbors = sorted(range(len(data['X'])), key=lambda i:
        (sum((x-q)**2 for x,q in zip(data['X'][i],data['query'])),i))[:data['k']]
    return int(sum(data['y'][i] for i in neighbors) > data['k']/2)
`,
 'ml-stump': `def solve(data):
    return [data['leftLabel'] if x<=data['threshold'] else data['rightLabel'] for x in data['query']]
`,
 'ml-forest': `def solve(data):
    probabilities = [sum(row)/len(row) for row in data['treeProbabilities']]
    return {'probabilities': probabilities, 'labels': [int(p>0.5+1e-12) for p in probabilities]}
`,
 'ml-naive-bayes': `def solve(data):
    import math
    scores = [math.log(prior)+sum(math.log(p) for p in row)
              for prior,row in zip(data['priors'],data['likelihoods'])]
    m = max(scores)
    raw = [math.exp(s-m) for s in scores]
    probabilities = [r/sum(raw) for r in raw]
    return {'probabilities': probabilities, 'label': int(scores[1]-scores[0]>1e-12)}
`,
 'ml-hinge': `def solve(data):
    losses = [max(0,1-y*(sum(x*w for x,w in zip(row,data['weights']))+data['bias']))
              for row,y in zip(data['X'],data['y'])]
    return sum(losses)/len(losses)
`,
 'ml-confusion': `def solve(data):
    tp=fp=fn=tn=0
    for y,p in zip(data['y'],data['p']):
        label = int(p>=data['threshold'])
        if y==1 and label==1: tp+=1
        elif y==0 and label==1: fp+=1
        elif y==1: fn+=1
        else: tn+=1
    precision = tp/(tp+fp) if tp+fp else 0
    recall = tp/(tp+fn) if tp+fn else 0
    return {'tp':tp,'fp':fp,'fn':fn,'tn':tn,'precision':precision,'recall':recall,
            'f1':2*precision*recall/(precision+recall) if precision+recall else 0,
            'accuracy':(tp+tn)/len(data['y'])}
`,
 'ml-auc': `def solve(data):
    positive = [s for s,y in zip(data['scores'],data['y']) if y==1]
    negative = [s for s,y in zip(data['scores'],data['y']) if y==0]
    wins = sum(1 if p>n else 0.5 if p==n else 0 for p in positive for n in negative)
    return wins/(len(positive)*len(negative))
`,
 'ml-metrics': `def solve(data):
    import math
    errors = [y-p for y,p in zip(data['y'],data['pred'])]
    mae = sum(abs(e) for e in errors)/len(errors)
    sse = sum(e*e for e in errors)
    mse = sse/len(errors)
    average = sum(data['y'])/len(data['y'])
    sst = sum((y-average)**2 for y in data['y'])
    r2 = 1-sse/sst if sst else (1 if sse==0 else 0)
    return {'mae':mae,'mse':mse,'rmse':math.sqrt(mse),'r2':r2}
`,
 'ml-learning-curve': `def solve(data):
    if data['trainError']>=data['limit'] and data['valError']>=data['limit']:
        return 'bias'
    if data['trainError']<data['limit'] and data['valError']-data['trainError']>=data['gap']:
        return 'variance'
    return 'balanced'
`,
 'ml-folds': `def solve(data):
    ids, k = data['indices'], data['k']
    result, start = [], 0
    for i in range(k):
        size = len(ids)//k + (i<len(ids)%k)
        validation = ids[start:start+size]
        result.append({'train':[x for x in ids if x not in validation], 'validation':validation})
        start += size
    return result
`,
 'ml-tuning': `def solve(data):
    from functools import cmp_to_key
    def compare(a,b):
        difference=sum(b['scores'])/len(b['scores'])-sum(a['scores'])/len(a['scores'])
        if abs(difference)<=1e-12:
            return (a['id']>b['id'])-(a['id']<b['id'])
        return 1 if difference>0 else -1
    return sorted(data['candidates'],key=cmp_to_key(compare))[0]['id']
`,
 'ml-kmeans': `def solve(data):
    points, centers = data['points'], data['centroids']
    labels = [min(range(len(centers)),key=lambda j:
        (sum((x-c)**2 for x,c in zip(p,centers[j])),j)) for p in points]
    updated = []
    for j,center in enumerate(centers):
        group = [p for p,label in zip(points,labels) if label==j]
        updated.append([sum(p[col] for p in group)/len(group) for col in range(len(center))] if group else center)
    return {'labels':labels,'centroids':updated}
`,
 'ml-hierarchical': `def solve(data):
    points, groups = data['points'], data['clusters']
    choices=[]
    for i in range(len(groups)):
        for j in range(i+1,len(groups)):
            distance = min(sum((a-b)**2 for a,b in zip(points[u],points[v])) for u in groups[i] for v in groups[j])
            choices.append((distance,i,j))
    _, i, j = min(choices)
    return [i,j]
`,
 'ml-dbscan': `def solve(data):
    points, eps, minimum = data['points'], data['eps'], data['minSamples']
    labels = [-2]*len(points)
    def neighbors(i):
        return [j for j,p in enumerate(points) if sum((a-b)**2 for a,b in zip(points[i],p))<=eps*eps+1e-12]
    cluster=0
    for i in range(len(points)):
        if labels[i]!=-2: continue
        adjacent=neighbors(i)
        if len(adjacent)<minimum:
            labels[i]=-1
            continue
        labels[i]=cluster
        queue=list(adjacent)
        seen=set(queue)
        cursor=0
        while cursor<len(queue):
            j=queue[cursor]
            cursor+=1
            if labels[j]==-1: labels[j]=cluster
            if labels[j]!=-2: continue
            labels[j]=cluster
            more=neighbors(j)
            if len(more)>=minimum:
                for neighbor in more:
                    if neighbor not in seen:
                        queue.append(neighbor)
                        seen.add(neighbor)
        cluster+=1
    return labels
`,
 'ml-pca': `def solve(data):
    import math
    points=data['points']
    mx=sum(p[0] for p in points)/len(points)
    my=sum(p[1] for p in points)/len(points)
    centered=[[p[0]-mx,p[1]-my] for p in points]
    a=sum(p[0]**2 for p in centered)/len(points)
    b=sum(p[0]*p[1] for p in centered)/len(points)
    c=sum(p[1]**2 for p in centered)/len(points)
    theta=0.5*math.atan2(2*b,a-c)
    direction=[math.cos(theta),math.sin(theta)]
    return {'direction':direction,'projections':[sum(x*u for x,u in zip(p,direction)) for p in centered],
            'variance':(a+c+math.sqrt((a-c)**2+4*b*b))/2}
`,
 'ml-preprocess': `def solve(data):
    import math
    columns=len(data['train'][0])
    fill=[]
    for j in range(columns):
        observed=[row[j] for row in data['train'] if row[j] is not None]
        fill.append(sum(observed)/len(observed) if observed else 0)
    filled=[[fill[j] if x is None else x for j,x in enumerate(row)] for row in data['train']]
    mean=[sum(row[j] for row in filled)/len(filled) for j in range(columns)]
    std=[math.sqrt(sum((row[j]-mean[j])**2 for row in filled)/len(filled)) or 1 for j in range(columns)]
    def transform(rows):
        return [[((fill[j] if x is None else x)-mean[j])/std[j] for j,x in enumerate(row)] for row in rows]
    return {'fill':fill,'mean':mean,'std':std,'train':transform(data['train']),'test':transform(data['test'])}
`,
 'ml-churn-fit': `def solve(data):
    probabilities=[]
    for query in data['query']:
        neighbors=sorted(range(len(data['X'])),key=lambda i:
            (sum((x-q)**2 for x,q in zip(data['X'][i],query)),i))[:data['k']]
        probabilities.append(sum(data['y'][i] for i in neighbors)/data['k'])
    return {'probabilities':probabilities,'labels':[int(p>=data['threshold']) for p in probabilities]}
`,
 'ml-inference': `def solve(data):
    return [[record.get(name,data['defaults'][name]) for name in data['featureNames']] for record in data['records']]
`,
 'ml-drift': `def solve(data):
    bins=data['bins']
    def histogram(values):
        return [sum(bins[j]<=x and (x<=upper if j==len(bins)-2 else x<upper) for x in values)
                for j,upper in enumerate(bins[1:])]
    train=histogram(data['train'])
    current=histogram(data['current'])
    return {'trainCounts':train,'currentCounts':current,
            'l1':sum(abs(a/len(data['train'])-b/len(data['current'])) for a,b in zip(train,current))}
`,
 'ml-boost': `def solve(data):
    return {'residuals':[y-p for y,p in zip(data['y'],data['pred'])],
            'predictions':[p+data['learningRate']*h for p,h in zip(data['pred'],data['h'])]}
`,
 'ml-voting': `def solve(data):
    weights=data['weights']
    return [sum(p*w for p,w in zip(row,weights))/sum(weights) for row in data['probabilities']]
`,
 'ml-selection': `def solve(data):
    import math
    y=data['y']
    my=sum(y)/len(y)
    sy=sum((a-my)**2 for a in y)
    scores=[]
    for j in range(len(data['X'][0])):
        x=[row[j] for row in data['X']]
        mx=sum(x)/len(x)
        sx=sum((a-mx)**2 for a in x)
        score=abs(sum((a-mx)*(b-my) for a,b in zip(x,y))/math.sqrt(sx*sy)) if sx and sy else 0
        scores.append(score)
    from functools import cmp_to_key
    def compare(a,b):
        difference=scores[b]-scores[a]
        return a-b if abs(difference)<=1e-12 else (1 if difference>0 else -1)
    return sorted(range(len(scores)),key=cmp_to_key(compare))[:data['k']]
`,
 'ml-anomaly': `def solve(data):
    import math
    average=sum(data['train'])/len(data['train'])
    std=math.sqrt(sum((x-average)**2 for x in data['train'])/len(data['train'])) or 1
    return [i for i,x in enumerate(data['current']) if abs((x-average)/std)>data['threshold']]
`,
 'ml-group-split': `def solve(data):
    return {'train':[i for i,g in enumerate(data['groups']) if g not in data['testGroups']],
            'test':[i for i,g in enumerate(data['groups']) if g in data['testGroups']]}
`,
 'ml-association': `def solve(data):
    baskets, A, B=data['baskets'],data['A'],data['B']
    countA=sum(A in row for row in baskets)
    countB=sum(B in row for row in baskets)
    countBoth=sum(A in row and B in row for row in baskets)
    confidence=countBoth/countA if countA else 0
    return {'support':countBoth/len(baskets),'confidence':confidence,
            'lift':confidence/(countB/len(baskets)) if countB else 0}
`,
 'ml-neuron': `def solve(data):
    return max(0,sum(x*w for x,w in zip(data['x'],data['weights']))+data['bias'])
`,
 'ml-attention': `def solve(data):
    import math
    result=[]
    for q in data['Q']:
        logits=[sum(a*b for a,b in zip(q,k))/math.sqrt(len(q)) for k in data['K']]
        top=max(logits)
        raw=[math.exp(x-top) for x in logits]
        weights=[x/sum(raw) for x in raw]
        result.append([sum(w*v[j] for w,v in zip(weights,data['V'])) for j in range(len(data['V'][0]))])
    return result
`,
 'ml-retrieval': `def solve(data):
    import math
    query=data['query']
    def similarity(i):
        x=data['vectors'][i]
        norm=math.sqrt(sum(a*a for a in query)*sum(a*a for a in x))
        return sum(a*b for a,b in zip(query,x))/norm if norm else 0
    from functools import cmp_to_key
    scores=[similarity(i) for i in range(len(data['vectors']))]
    def compare(a,b):
        difference=scores[b]-scores[a]
        return a-b if abs(difference)<=1e-12 else (1 if difference>0 else -1)
    return sorted(range(len(data['vectors'])),key=cmp_to_key(compare))[:data['k']]
`,
 'ml-token-budget': `def solve(data):
    budget=data['limit']-data['reserved']
    keep=[]
    for i in range(len(data['costs'])-1,-1,-1):
        if data['costs'][i]>budget: break
        keep.append(i)
        budget-=data['costs'][i]
    return list(reversed(keep))
`,
 'ml-schema': `def solve(data):
    import math
    record=data['record']
    return set(record)==set(data['featureNames']) and all(
        type(record[name]) in (int,float) and math.isfinite(record[name]) for name in data['featureNames'])
`,
 'ml-bellman': `def solve(data):
    return data['reward'] if data['terminal'] else data['reward']+data['gamma']*max(data['nextQ'])
`,
};
export function solution(id,language='python') { return language==='python'?solutions[id]:undefined; }
