import { random, int, hash } from "../shared/random.mjs";
const DAY = 86400000,
  OFFSET = 7 * 3600000;
export const dayKey = (now = Date.now()) =>
  new Date(now + OFFSET).toISOString().slice(0, 10);
export const dayTime = (key) => Date.parse(key + "T00:00:00+07:00");
export function weekKey(now = Date.now()) {
  const d = new Date(now + OFFSET);
  const diff = (d.getUTCDay() + 6) % 7;
  return dayKey(now - diff * DAY);
}
export const TIERS = ["Đồng", "Bạc", "Vàng", "Ruby", "Kim cương"];
const botNames = [
  "An Nhiên",
  "Pixel",
  "Mèo Mướp",
  "Hải Đăng",
  "Linh Chi",
  "CodeBuddy",
  "Sóc Nhỏ",
  "Minh Anh",
  "Turing",
  "Bảo Ngọc",
  "Cáo Cam",
  "Quang Huy",
  "Mây",
  "Ada",
  "BinBin",
  "Gia Hân",
  "Kiwi",
  "Nam Phong",
  "Bông",
];
export function botPoints(week, now, index) {
  let total = 0;
  const start = dayTime(week),
    cutoff = Math.min(now, start + 7 * DAY);
  for (let day = 0; day < 7; day++) {
    const rng = random(`${week}:bot:${index}:day:${day}`),
      count = int(rng, 2, 5);
    for (let k = 0; k < count; k++) {
      const time = start + day * DAY + (7 + rng() * 15) * 3600000,
        xp = int(rng, 10, 30);
      if (time <= cutoff) total += xp;
    }
  }
  return total;
}
export function leagueRows(s, now = Date.now(), week = weekKey(now)) {
  const start = dayTime(week),
    end = start + 7 * DAY;
  let xp = Object.entries(s.daily)
    .filter(([key]) => dayTime(key) >= start && dayTime(key) < end)
    .reduce((sum, [, v]) => sum + v.xp, 0);
  const rows = botNames.map((name, i) => ({
    id: `bot-${i}`,
    name,
    xp: botPoints(week, now, i),
    avatar: i % 6,
    isBot: true,
  }));
  rows.push({
    id: "you",
    name: s.profile.name || "Bạn",
    xp,
    avatar: 0,
    isBot: false,
  });
  return rows
    .sort((a, b) => b.xp - a.xp || a.id.localeCompare(b.id))
    .map((row, i) => ({ ...row, rank: i + 1 }));
}
export function daily(s, now = Date.now()) {
  const key = dayKey(now);
  s.daily[key] ??= {
    xp: 0,
    lessons: 0,
    reviews: 0,
    codes: 0,
    reviewRewards: 0,
  };
  return s.daily[key];
}
export function refreshGame(s, now = Date.now()) {
  if (now >= s.energyAt) {
    const gain = Math.floor((now - s.energyAt) / 600000);
    if (gain > 0) {
      s.energy = Math.min(30, s.energy + gain);
      s.energyAt = s.energy === 30 ? now : s.energyAt + gain * 600000;
    }
  }
  const today = dayKey(now);
  daily(s, now);
  if (s.streakLast) {
    let elapsed =
      Math.floor((dayTime(today) - dayTime(s.streakLast)) / DAY) - 1;
    if (elapsed > 0) {
      while (elapsed > 0 && s.freeze > 0) {
        s.freeze--;
        s.streakLast = dayKey(dayTime(s.streakLast) + DAY);
        elapsed--;
      }
      if (elapsed > 0) {
        s.streak = 0;
        s.streakLast = null;
      }
    }
  }
  const week = weekKey(now);
  if (!s.league.week) s.league.week = week;
  let limit = 520;
  while (s.league.week < week && limit-- > 0) {
    const old = s.league.week,
      rows = leagueRows(s, dayTime(old) + 7 * DAY - 1, old),
      rank = rows.find((r) => r.id === "you").rank;
    if (rank <= 5) s.league.tier = Math.min(4, s.league.tier + 1);
    else if (rank >= 16) s.league.tier = Math.max(0, s.league.tier - 1);
    s.league.history.push({ week: old, rank, tier: s.league.tier });
    s.league.week = dayKey(dayTime(old) + 7 * DAY);
  }
  return s;
}
export function recordXP(s, xp, now = Date.now()) {
  const d = daily(s, now);
  d.xp += xp;
  const key = dayKey(now);
  if (d.xp >= 20 && s.streakLast !== key) {
    s.streak++;
    s.streakLast = key;
  }
  if (s.streak >= 7 && !s.badges.includes("streak7")) s.badges.push("streak7");
  if (s.streak >= 30 && !s.badges.includes("streak30"))
    s.badges.push("streak30");
}
export function quests(s, now = Date.now()) {
  const d = daily(s, now),
    allDone = Object.values(s.progress).filter((p) => p.passed).length >= (s.mandatoryLessons??48);
  const canReview = Object.values(s.progress).some((p) => p.passed);
  return [
    {
      id: "learn",
      title: allDone
        ? "Hoàn thành một lượt ôn"
        : "Hoàn thành một buổi học hoặc ôn",
      current: Math.min(1, d.lessons + d.reviews),
      target: 1,
      icon: "book",
    },
    {
      id: "code",
      title: "Giải đúng một bài code",
      current: Math.min(1, d.codes),
      target: 1,
      icon: "code",
    },
    {
      id: "review",
      title: canReview ? "Ôn tập hai lượt đạt" : "Giải hai hoạt động tương tác",
      current: Math.min(2, canReview ? d.reviews : (d.labCompletions ?? 0)),
      target: 2,
      icon: "target",
    },
  ];
}
export const shop = [
  {
    id: "energy",
    name: "Năng lượng mới",
    description: "+15 năng lượng, tối đa 30",
    price: 20,
    type: "energy",
  },
  {
    id: "freeze",
    name: "Bảo vệ streak",
    description: "Giữ một ngày bỏ lỡ · tối đa 2",
    price: 50,
    type: "freeze",
  },
  {
    id: "ocean",
    name: "Byte đại dương",
    description: "Bộ áo xanh biển",
    price: 100,
    type: "skin",
  },
  {
    id: "sunset",
    name: "Byte hoàng hôn",
    description: "Bộ áo cam ấm áp",
    price: 200,
    type: "skin",
  },
  {
    id: "cosmic",
    name: "Byte vũ trụ",
    description: "Bộ áo tím của nhà khám phá",
    price: 300,
    type: "skin",
  },
];
export function purchase(s, item) {
  if (s.gems < item.price) throw new Error("Bạn chưa có đủ gem.");
  if (item.type === "energy" && s.energy === 30)
    throw new Error("Năng lượng đang đầy.");
  if (item.type === "freeze" && s.freeze >= 2)
    throw new Error("Bạn đã có đủ 2 vật phẩm bảo vệ.");
  if (item.type === "skin" && s.inventory.includes(item.id))
    throw new Error("Bạn đã sở hữu bộ áo này.");
  s.gems -= item.price;
  if (item.type === "energy") s.energy = Math.min(30, s.energy + 15);
  if (item.type === "freeze") s.freeze++;
  if (item.type === "skin") s.inventory.push(item.id);
}
export const chestTable = [
  { type: "gems", amount: 5, probability: 0.5 },
  { type: "gems", amount: 10, probability: 0.3 },
  { type: "gems", amount: 20, probability: 0.15 },
  { type: "freeze", amount: 1, probability: 0.05 },
];
export function chestReward(id) {
  const x = random("bytepath-chest:" + id)();
  return x < 0.5
    ? chestTable[0]
    : x < 0.8
      ? chestTable[1]
      : x < 0.95
        ? chestTable[2]
        : chestTable[3];
}
export function reviewList(s, lessons, now = Date.now()) {
  return lessons
    .filter((l) => s.progress[l.id]?.passed)
    .map((l) => ({
      ...l,
      due: s.progress[l.id].nextReview ?? now,
      mistakes: s.progress[l.id].mistakes ?? 0,
    }))
    .sort(
      (a, b) =>
        (a.due <= now ? 0 : 1) - (b.due <= now ? 0 : 1) ||
        b.mistakes - a.mistakes ||
        a.due - b.due,
    );
}
export function awardChapters(s, units) {
  for (const u of units) {
    if (u.range[0] > 48) continue;
    const ids = Array.from(
      { length: u.range[1] - u.range[0] + 1 },
      (_, i) => u.range[0] + i,
    );
    const badge = "chapter-" + u.id;
    if (ids.every((id) => s.progress[id]?.passed) && !s.badges.includes(badge))
      s.badges.push(badge);
  }
}
