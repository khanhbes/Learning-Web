export const debugExercises = [
  {
    prompt:
      "Mảng có n phần tử. Thay i <= n bằng điều kiện nào để duyệt từ chỉ số 0 mà không vượt mảng?",
    code: {
      python: "i = 0\nwhile i <= len(nums):\n    print(nums[i])\n    i += 1",
      cpp: "for (int i = 0; i <= nums.size(); ++i)\n    cout << nums[i];",
    },
    options: [
      { id: "safe", text: "i < n" },
      { id: "extra", text: "i <= n + 1" },
      { id: "empty", text: "i < 0" },
    ],
    answer: "safe",
    explanation:
      "Chỉ số cuối là n−1. Dùng i < n; dãy rỗng không truy cập phần tử nào.",
  },
  {
    prompt:
      "Hàm tính tổng đang trả về sau phần tử đầu tiên. Cần chuyển return tới đâu?",
    code: {
      python:
        "def total(nums):\n    answer = 0\n    for value in nums:\n        answer += value\n        return answer",
      cpp: "int total(vector<int> nums) {\n    int answer = 0;\n    for (int value : nums) {\n        answer += value;\n        return answer;\n    }\n}",
    },
    options: [
      { id: "after", text: "Sau khi vòng lặp kết thúc" },
      { id: "before", text: "Trước khi bắt đầu vòng lặp" },
      { id: "keep", text: "Giữ trong vòng lặp" },
    ],
    answer: "after",
    explanation:
      "Return kết thúc hàm ngay. Đặt sau vòng lặp để đọc đủ mọi phần tử; dãy rỗng cũng trả 0.",
  },
  {
    prompt:
      "Vòng while cứ đọc cùng phần tử. Bổ sung bước nào để nó tiến tới điểm dừng?",
    code: {
      python: "i = 0\nwhile i < len(nums):\n    print(nums[i])",
      cpp: "int i = 0;\nwhile (i < nums.size()) {\n    cout << nums[i];\n}",
    },
    options: [
      { id: "advance", text: "Tăng i thêm 1 sau mỗi lượt" },
      { id: "zero", text: "Đặt lại i=0 sau mỗi lượt" },
      { id: "decrease", text: "Giảm i sau mỗi lượt" },
    ],
    answer: "advance",
    explanation:
      "Biến điều khiển phải tiến tới điều kiện dừng. Với dãy dài n, i đi từ 0 đến n−1 rồi dừng tại n.",
  },
];
