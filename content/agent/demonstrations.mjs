export const demonstrations={
 3:`percept = {'battery': 19, 'dirty': True}
reserve = 20
action = 'charge' if percept['battery'] < reserve else 'clean' if percept['dirty'] else 'move'
print(action)  # charge
`,
 5:`memory = {'A': True}
for value in [False, None]:
    if value is not None:
        memory['A'] = value
print(memory)  # {'A': False}
`,
 7:`weights = {'quality': 2, 'time': 1, 'risk': 3}
quality, time, risk = 8, 4, 1
print(weights['quality']*quality - weights['time']*time - weights['risk']*risk)  # 9
`,
 18:`import math
def finite_number(value):
    return type(value) in (int, float) and math.isfinite(value)
print(finite_number(0), finite_number(True), finite_number(float('nan')))  # True False False
`,
 20:`query = {'x'}
doc = {'x'}
print(len(query & doc))  # 1 even when original lists repeated x
`,
};
