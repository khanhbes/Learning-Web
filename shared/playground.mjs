export const initialPlayground = () => ({
  values: [],
  slots: [null, null, null, null],
  head: 0,
  size: 0,
  bits: 13,
  message: "Thử thêm, lấy hoặc bật/tắt bit rồi quan sát.",
});
export function playgroundStep(s, action) {
  if (action.type === "reset") return initialPlayground();
  const next = structuredClone(s);
  if (action.type === "bit") {
    if (!Number.isInteger(action.index) || action.index < 0 || action.index > 7)
      return s;
    next.bits ^= 1 << action.index;
    next.message = `Đảo bit ${action.index}: ${s.bits} XOR ${1 << action.index} = ${next.bits}.`;
    return next;
  }
  if (action.type === "push") {
    if (!Number.isInteger(action.value) || Math.abs(action.value) > 1000) {
      next.message = "Nhập số nguyên trong [-1000,1000].";
      return next;
    }
    if (s.size === 4) {
      next.message = "Đã đầy: size=capacity=4. Không ghi đè dữ liệu đang chờ.";
      return next;
    }
    const tail = (s.head + s.size) % 4;
    next.slots[tail] = action.value;
    next.values.push(action.value);
    next.size++;
    next.message = `Thêm ${action.value} tại ô ${tail}. Tail tiếp theo = ${(next.head + next.size) % 4}.`;
    return next;
  }
  if (action.type === "pop") {
    if (!s.size) {
      next.message = "Đang rỗng: không có phần tử để lấy.";
      return next;
    }
    if (action.mode === "stack") {
      const slot = (s.head + s.size - 1) % 4,
        value = next.values.pop();
      next.slots[slot] = null;
      next.size--;
      next.message = `Pop lấy ${value} ở đỉnh.`;
    } else {
      const value = next.values.shift();
      next.slots[s.head] = null;
      next.head = (s.head + 1) % 4;
      next.size--;
      next.message = `Dequeue lấy ${value}; head mới = ${next.head}.`;
    }
    return next;
  }
  return s;
}
