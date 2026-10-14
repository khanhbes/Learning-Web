// Python reference programs are executed separately from the Node checker.
// Standard library only; students may also use NumPy and return ordinary JSON types.
const helpers=`import math

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def norm(v):
    return math.sqrt(dot(v, v))

def transpose(A):
    return [list(column) for column in zip(*A)]

def multiply(A, B):
    return [[dot(row, column) for column in zip(*B)] for row in A]

def matvec(A, x):
    return [dot(row, x) for row in A]

def identity(n):
    return [[int(i == j) for j in range(n)] for i in range(n)]

def determinant(A):
    if len(A) == 1:
        return A[0][0]
    return sum((-1) ** j * A[0][j] * determinant([row[:j] + row[j+1:] for row in A[1:]]) for j in range(len(A)))

def reduce_rows(A):
    R = [list(map(float, row)) for row in A]
    pivots = []
    lead = 0
    for column in range(len(R[0])):
        if lead == len(R):
            break
        pivot = max(range(lead, len(R)), key=lambda i: abs(R[i][column]))
        if abs(R[pivot][column]) < 1e-10:
            continue
        R[lead], R[pivot] = R[pivot], R[lead]
        factor = R[lead][column]
        R[lead] = [v / factor for v in R[lead]]
        for i in range(len(R)):
            if i != lead:
                factor = R[i][column]
                R[i] = [v - factor * p for v, p in zip(R[i], R[lead])]
        pivots.append(column)
        lead += 1
    return [[0.0 if abs(v) < 1e-10 else v for v in row] for row in R], pivots

def solve_report(A, b):
    n = len(A[0])
    _, pivots_A = reduce_rows(A)
    reduced, pivots = reduce_rows([row + [value] for row, value in zip(A, b)])
    r = len(pivots_A)
    status = 'none' if len(pivots) != r else 'unique' if r == n else 'infinite'
    solution = None
    if status != 'none':
        solution = [0.0] * n
        for row, column in enumerate(pivots):
            solution[column] = reduced[row][-1]
    return {'status': status, 'rank': r, 'nullity': n-r, 'solution': solution}

def symmetric_eigen(A):
    a, b, c = A[0][0], A[0][1], A[1][1]
    gap = math.hypot(a-c, 2*b)
    values = [(a+c-gap)/2, (a+c+gap)/2]
    vectors = []
    for value in values:
        if abs(b) > 1e-12:
            v = [b, value-a]
        else:
            v = [1, 0] if abs(value-a) < 1e-10 else [0, 1]
        length = norm(v)
        vectors.append([x/length for x in v])
    return values, vectors

def singular_values(A):
    values, _ = symmetric_eigen(multiply(transpose(A), A))
    return [math.sqrt(max(0, x)) for x in reversed(values)]

def gram_schmidt(vectors):
    u, v = vectors
    q1 = [x/norm(u) for x in u]
    projected = dot(v, q1)
    remainder = [x-projected*q for x, q in zip(v, q1)]
    return [q1, [x/norm(remainder) for x in remainder]]

`;
const bodies={
 coordinates:`    return [data['x'], data['y']]`,
 'vector-add':`    return [x+y for x, y in zip(data['u'], data['v'])]`,
 'linear-combination':`    return [data['a']*u + data['b']*v for u, v in zip(data['u'], data['v'])]`,
 norm:`    return norm(data['v'])`,
 shape:`    return [len(data['A']), len(data['A'][0])]`,
 transpose:`    return transpose(data['A'])`,
 'matrix-add':`    return [[a+b for a, b in zip(row_a, row_b)] for row_a, row_b in zip(data['A'], data['B'])]`,
 multiply:`    return multiply(data['A'], data['B'])`,
 transform:`    return matvec(data['A'], data['v'])`,
 determinant:`    return determinant(data['A'])`,
 cofactor:`    A, i, j = data['A'], data['i'], data['j']
    minor = [row[:j]+row[j+1:] for k, row in enumerate(A) if k != i]
    return (-1)**(i+j)*determinant(minor)`,
 inverse:`    A = data['A']
    d = determinant(A)
    if abs(d) < 1e-10:
        return None
    return [[A[1][1]/d, -A[0][1]/d], [-A[1][0]/d, A[0][0]/d]]`,
 'row-operation':`    A = [row[:] for row in data['A']]
    i, j, k = data['i'], data['j'], data['k']
    if data['op'] == 'swap':
        A[i], A[j] = A[j], A[i]
    elif data['op'] == 'scale':
        A[i] = [k*x for x in A[i]]
    else:
        A[i] = [x+k*y for x, y in zip(A[i], A[j])]
    return A`,
 rref:`    return reduce_rows(data['A'])[0]`,
 rank:`    return len(reduce_rows(data['A'])[1])`,
 solve:`    return solve_report(data['A'], data['b'])['solution']`,
 'system-type':`    return solve_report(data['A'], data['b'])['status']`,
 'null-vector':`    row = next(row for row in data['A'] if norm(row) > 1e-10)
    v = [-row[1], row[0]]
    return [x/norm(v) for x in v]`,
 'column-basis':`    return reduce_rows(data['A'])[1]`,
 projection:`    u, v = data['u'], data['v']
    scale = dot(u, v)/dot(v, v)
    return [scale*x for x in v]`,
 'least-squares':`    x, y = data['x'], data['y']
    # Centering gives a separate formula from the Node oracle.
    mx, my = sum(x)/len(x), sum(y)/len(y)
    slope = sum((a-mx)*(b-my) for a, b in zip(x, y))/sum((a-mx)**2 for a in x)
    intercept = my-slope*mx
    predictions = [intercept+slope*a for a in x]
    return {'intercept': intercept, 'slope': slope, 'predictions': predictions,
            'sse': sum((b-p)**2 for b, p in zip(y, predictions))}`,
 eigenpairs:`    values, vectors = symmetric_eigen(data['A'])
    return {'values': values, 'vectors': vectors}`,
 'matrix-power':`    A, k = data['A'], data['k']
    result = identity(len(A))
    for _ in range(k):
        result = multiply(result, A)
    return result`,
 cayley:`    A = data['A']
    square, trace, d = multiply(A, A), A[0][0]+A[1][1], determinant(A)
    residual = [[square[i][j]-trace*A[i][j]+(d if i == j else 0) for j in range(2)] for i in range(2)]
    return {'square': square, 'trace': trace, 'det': d, 'residual': residual}`,
 'transform-batch':`    return [[x+b for x, b in zip(matvec(data['A'], point), data['b'])] for point in data['points']]`,
 'solve-report':`    return solve_report(data['A'], data['b'])`,
 'gram-schmidt':`    return gram_schmidt(data['vectors'])`,
 qr:`    Q = transpose(gram_schmidt(transpose(data['A'])))
    return {'Q': Q, 'R': multiply(transpose(Q), data['A'])}`,
 'svd-values':`    return singular_values(data['A'])`,
 'pca-direction':`    points = data['points']
    means = [sum(p[j] for p in points)/len(points) for j in range(2)]
    centered = [[p[j]-means[j] for j in range(2)] for p in points]
    covariance = multiply(transpose(centered), centered)
    covariance = [[x/len(points) for x in row] for row in covariance]
    _, vectors = symmetric_eigen(covariance)
    return vectors[-1]`,
 quadratic:`    return dot(data['x'], matvec(data['A'], data['x']))`,
 markov:`    return matvec(data['P'], data['p'])`,
 condition:`    if abs(determinant(data['A'])) < 1e-10:
        return None
    values = singular_values(data['A'])
    return values[0]/values[1]`,
 'complex-eigen':`    return [{'real': data['a'], 'imag': -data['b']}, {'real': data['a'], 'imag': data['b']}]`,
};
export const solutions=Object.fromEntries(Object.entries(bodies).map(([id,body])=>['linear-'+id,helpers+'def solve(data):\n'+body+'\n']));
export const solution=(id,language='python')=>language==='python'?solutions[id]:undefined;
export const demonstrations={
 1:`point = [2, 1]\nprint(point[0], point[1])  # 2 1\n`,
 5:`A = [[1, 2, 3], [4, 5, 6]]\nprint(len(A), len(A[0]))  # 2 3\n`,
 8:`import numpy as np\nA = np.array([[1, 2, 3], [0, 1, 4]])\nB = np.array([[1, 0], [2, 1], [3, 0]])\nprint((A @ B).tolist())  # [[14, 2], [14, 1]]\n`,
 17:`import numpy as np\nA = np.array([[1, 2, -1], [2, 4, 1], [3, 6, 0]])\nprint(int(np.linalg.matrix_rank(A)))  # 2\n`,
 23:`import numpy as np\nx = np.array([0., 1., 2.]); y = np.array([1., 3., 5.])\nA = np.column_stack([np.ones_like(x), x])\ncoef, _, _, _ = np.linalg.lstsq(A, y, rcond=None)\nprint(coef.tolist())  # gần [1, 2]\n`,
 24:`import numpy as np\nvalues, columns = np.linalg.eigh(np.array([[2., 1.], [1., 2.]]))\nprint(values.tolist())  # [1, 3]\n# columns[:, i] là vector riêng của values[i]; dấu có thể khác.\n`,
};
