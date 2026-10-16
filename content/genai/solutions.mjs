const bodies={
 count:`    return len(data['tokens'])`,
 encode:`    return [data['vocab'].get(token, -1) for token in data['tokens']]`,
 distribution:`    total = sum(data['counts'])
    return [count / total if total else 0 for count in data['counts']]`,
 greedy:`    if not data['candidates']:
        return None
    return min(data['candidates'], key=lambda row: (-row['score'], row['id']))['id']`,
 'top-k':`    ordered = sorted(data['candidates'], key=lambda row: (-row['weight'], row['id']))
    return [row['id'] for row in ordered[:data['k']]]`,
 'top-p':`    ordered = sorted(data['candidates'], key=lambda row: (-row['weight'], row['id']))
    selected, total = [], 0
    for row in ordered:
        selected.append(row['id'])
        total += row['weight']
        if total >= data['p']:
            break
    return selected`,
 attention:`    denominator = sum(data['weights'])
    if denominator == 0:
        return 0
    return sum(w * v for w, v in zip(data['weights'], data['values'])) / denominator`,
 budget:`    available = data['window'] - data['reserved']
    return {'available': available, 'fits': data['promptTokens'] <= available}`,
 split:`    boundary = data['trainCount']
    return {'train': data['ids'][:boundary], 'test': data['ids'][boundary:]}`,
 preference:`    wins = {answer: 0 for answer in data['answers']}
    for pair in data['pairs']:
        wins[pair['chosen']] += 1
    return wins`,
 lora:`    full = data['rows'] * data['cols']
    adapter = data['rank'] * (data['rows'] + data['cols'])
    return {'full': full, 'adapter': adapter}`,
 memory:`    return (data['parameters'] * data['bits'] + 7) // 8`,
 prompt:`    return '\\n'.join(['TASK: ' + data['task'], 'DATA: ' + data['context'], 'FORMAT: ' + data['format']])`,
 schema:`    result = []
    for value in data['outputs']:
        valid = (isinstance(value, dict) and set(value) == {'label', 'confidence'}
                 and value['label'] in data['allowedLabels']
                 and type(value['confidence']) in (int, float)
                 and 0 <= value['confidence'] <= 1)
        result.append(valid)
    return result`,
 context:`    remaining = data['budget']
    kept = []
    for message in reversed(data['messages']):
        if message['cost'] > remaining:
            break
        remaining -= message['cost']
        kept.append(message['id'])
    return list(reversed(kept))`,
 retrieve:`    query = set(data['query'])
    scored = [{'id': doc['id'], 'score': len(query & set(doc['tokens']))} for doc in data['docs']]
    ranked = sorted((row for row in scored if row['score'] > 0), key=lambda row: (-row['score'], row['id']))
    return ranked[:data['k']]`,
 grounding:`    result = []
    for claim in data['claims']:
        supported = False
        for evidence in data['evidence']:
            if evidence['id'] == claim['source']:
                for fact in evidence['facts']:
                    if fact['key'] == claim['key'] and fact['value'] == claim['value']:
                        supported = True
        result.append({'id': claim['id'], 'supported': supported})
    return result`,
 loop:`    steps = 0
    for outcome in data['outcomes'][:data['limit']]:
        steps += 1
        if outcome in ('done', 'error'):
            return {'steps': steps, 'status': outcome}
    status = 'limit' if steps == data['limit'] else 'exhausted'
    return {'steps': steps, 'status': status}`,
 evaluate:`    total = len(data['expected'])
    correct = sum(expected == actual for expected, actual in zip(data['expected'], data['actual']))
    return {'correct': correct, 'total': total, 'accuracy': correct / total if total else 0}`,
 latency:`    values = data['durationsMs']
    total = sum(values)
    return {'totalMs': total, 'maxMs': max(values, default=0), 'meanMs': total / len(values) if values else 0}`,
 cache:`    matched = 0
    for before, after in zip(data['previous'], data['current']):
        if before != after:
            break
        matched += 1
    return matched`,
 quantize:`    step = data['step']
    return [((2 * value + step) // (2 * step)) * step for value in data['values']]`,
 causal:`    return [[column <= row for column in range(data['n'])] for row in range(data['n'])]`,
 distill:`    return [sum(column) / len(data['teachers']) for column in zip(*data['teachers'])]`,
};
export const solutions=Object.fromEntries(Object.entries(bodies).map(([key,body])=>['genai-'+key,'def solve(data):\n'+body+'\n']));
export const solution=(id,language='python')=>language==='python'?solutions[id]:null;
