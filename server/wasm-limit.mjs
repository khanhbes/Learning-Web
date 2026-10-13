// Rewrite defined wasm32 memory limits. No host memory is imported into a guest.
function read(bytes, pos) {
  let value = 0,
    shift = 0;
  for (let i = 0; i < 5; i++) {
    const b = bytes[pos.i++];
    value += (b & 127) * 2 ** shift;
    if (!(b & 128)) return value;
    shift += 7;
  }
  throw Error("Invalid wasm integer");
}
function uleb(value) {
  const out = [];
  do {
    let b = value % 128;
    value = Math.floor(value / 128);
    out.push(b | (value ? 128 : 0));
  } while (value);
  return out;
}
export function limitMemory(bytes, maxPages = 8192) {
  const input = new Uint8Array(bytes),
    parts = [input.subarray(0, 8)],
    pos = { i: 8 };
  while (pos.i < input.length) {
    const id = input[pos.i++],
      length = read(input, pos),
      end = pos.i + length;
    if (id !== 5) {
      parts.push(
        new Uint8Array([id, ...uleb(length)]),
        input.subarray(pos.i, end),
      );
      pos.i = end;
      continue;
    }
    const count = read(input, pos),
      body = [...uleb(count)];
    for (let i = 0; i < count; i++) {
      const flags = read(input, pos),
        min = read(input, pos),
        max = flags & 1 ? read(input, pos) : maxPages;
      if (flags & 6 || min > maxPages) throw Error("Unsupported guest memory");
      body.push(1, ...uleb(min), ...uleb(Math.min(max, maxPages)));
    }
    if (pos.i !== end) throw Error("Invalid wasm memory section");
    parts.push(new Uint8Array([id, ...uleb(body.length), ...body]));
  }
  const output = new Uint8Array(parts.reduce((size, p) => size + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    output.set(p, offset);
    offset += p.length;
  }
  return output;
}
