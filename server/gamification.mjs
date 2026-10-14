import { cosmetics, cosmeticById, extendedShop, boostPacks, avatarFrameIds } from "../shared/cosmetics.mjs";

export function levelProgress(totalXP = 0) {
  totalXP = Math.max(0, Number.isFinite(totalXP) ? Math.floor(totalXP) : 0);
  let level = 1, floor = 0;
  while (level < 30 && totalXP - floor >= 100 + 25 * (level - 1)) {
    floor += 100 + 25 * (level - 1);
    level++;
  }
  const capped = level === 30, nextLevelXP = capped ? 0 : 100 + 25 * (level - 1);
  const withinLevel = capped ? totalXP - floor : totalXP - floor;
  return { level, withinLevel, nextLevelXP, totalXP, xpIntoLevel: withinLevel, xpForNext: nextLevelXP, totalXp: totalXP, levelStartXP: floor, progress: capped ? 1 : withinLevel / nextLevelXP, capped };
}
export function normalizeGamification(s, { now = Date.now(), retroactive = false } = {}) {
  s.inventory ??= ["original"];
  s.consumables ??= {};
  s.avatarFrames ??= [];
  s.levelRewardIds ??= [];
  s.rewardEvents ??= [];
  s.purchaseRequests ??= {};
  s.activationRequests ??= {};
  s.activeBoost ??= null;
  s.profile ??= {};
  // The new free mascot is granted once without changing academic rewards.
  // Explicitly chosen legacy skins remain equipped; the old default migrates.
  if(!s.inventory.includes("bitty"))s.inventory.push("bitty");
  if(s.profile.mascotVersion!==1){
    if(!s.profile.skin||s.profile.skin==="original")s.profile.skin="bitty";
    s.profile.mascotVersion=1;
  }
  s.profile.sound ??= false;
  s.profile.reducedMotion ??= false;
  s.level = levelProgress(s.xp);
  if (retroactive) syncLevelRewards(s, { now });
  return s;
}
function levelGift(level) {
  if (level % 5 === 2) return { type: "gems", amount: 10 + Math.floor(level / 5) * 5, name: `${10 + Math.floor(level / 5) * 5} kim cương` };
  if (level % 5 === 3) {
    const charges = level <= 8 ? 2 : level <= 18 ? 5 : 10;
    return { type: "boost", itemId: `boost-${charges}`, amount: 1, charges, name: `Gói X2 ${charges} lượt` };
  }
  if (level % 5 === 4) {
    const amount = level <= 9 ? 1 : level <= 19 ? 2 : 3;
    return { type: "energy-voucher", itemId: "energy-voucher", amount, name: `${amount} vé hồi năng lượng` };
  }
  if (level % 5 === 1) {
    const itemId = avatarFrameIds[Math.floor(level / 5) - 1];
    return { type: "frame", itemId, amount: 1, name: ["Khung chiếc lá", "Khung sóng biển", "Khung ngôi sao", "Khung trăng", "Khung lăng kính"][Math.floor(level / 5) - 1] };
  }
  const item = cosmetics.find((c) => c.unlock.type === "level" && c.unlock.level === level);
  return { type: "skin", itemId: item.id, amount: 1, name: item.name };
}
export function syncLevelRewards(s, { now = Date.now(), fromXp } = {}) {
  // No recursion: normalization may invoke this before or after migration.
  s.consumables ??= {}; s.avatarFrames ??= []; s.levelRewardIds ??= []; s.rewardEvents ??= []; s.inventory ??= ["original"];
  const current = levelProgress(s.xp), gained = [], levels = [];
  for (let level = 2; level <= current.level; level++) {
    const id = `level:${level}`;
    if (s.levelRewardIds.includes(id)) continue;
    const gift = { ...levelGift(level), level };
    if (gift.type === "gems") s.gems += gift.amount;
    else if (gift.type === "skin") { if (!s.inventory.includes(gift.itemId)) s.inventory.push(gift.itemId); }
    else if (gift.type === "frame") { if (!s.avatarFrames.includes(gift.itemId)) s.avatarFrames.push(gift.itemId); }
    else s.consumables[gift.itemId] = (s.consumables[gift.itemId] ?? 0) + gift.amount;
    s.levelRewardIds.push(id); gained.push(gift); levels.push(level);
  }
  if (gained.length) s.rewardEvents.push({ id: `levels:${levels.join("-")}`, fromLevel: fromXp === undefined ? Math.max(1, levels[0] - 1) : levelProgress(fromXp).level, toLevel: current.level, rewards: gained, createdAt: now, seen: false });
  s.level = current;
  return gained;
}
export function applyXPBoost(s, baseXp) {
  if (!Number.isInteger(baseXp) || baseXp < 0) throw new Error("XP gốc không hợp lệ.");
  const active = s.activeBoost;
  const bonusXp = baseXp > 0 && active?.charges > 0 ? baseXp : 0;
  if (bonusXp) { active.charges--; if (active.charges === 0) s.activeBoost = null; }
  return { baseXp, bonusXp, xp: baseXp + bonusXp, boostRemaining: s.activeBoost?.charges ?? 0 };
}
function requestResult(s, field, requestId) { return requestId && Object.hasOwn(s[field] ?? {}, requestId) ? s[field][requestId] : undefined; }
function saveRequest(s, field, requestId, result) {
  if (!requestId) return result;
  s[field] ??= {}; Object.defineProperty(s[field], requestId, { value: result, enumerable: true, writable: true, configurable: true });
  return result;
}
export function purchaseExtended(s, itemId, { requestId, now = Date.now() } = {}) {
  normalizeGamification(s, { now });
  const previous = requestResult(s, "purchaseRequests", requestId);
  if (previous) { if (previous.itemId !== itemId) throw new Error("Mã mua đã dùng cho vật phẩm khác."); return { ...previous, duplicate: true }; }
  const item = extendedShop.find((p) => p.id === itemId);
  if (!item) throw new Error("Vật phẩm này được nhận qua thành tích hoặc không tồn tại.");
  if (item.type === "skin" && s.inventory.includes(itemId)) throw new Error("Bạn đã sở hữu diện mạo này.");
  if (s.gems < item.price) throw new Error("Bạn chưa có đủ kim cương.");
  s.gems -= item.price;
  if (item.type === "skin") s.inventory.push(itemId);
  else s.consumables[itemId] = (s.consumables[itemId] ?? 0) + 1;
  return saveRequest(s, "purchaseRequests", requestId, { itemId, price: item.price, purchasedAt: now, duplicate: false });
}
export function activateConsumable(s, itemId, { requestId, now = Date.now() } = {}) {
  normalizeGamification(s, { now });
  const previous = requestResult(s, "activationRequests", requestId);
  if (previous) { if (previous.itemId !== itemId) throw new Error("Mã sử dụng đã dùng cho vật phẩm khác."); return { ...previous, duplicate: true }; }
  if (!(s.consumables[itemId] > 0)) throw new Error("Bạn chưa sở hữu vật phẩm này.");
  const pack = boostPacks.find((p) => p.id === itemId);
  if (pack) {
    if (s.activeBoost?.charges > 0) throw new Error("Hãy dùng hết gói X2 đang hoạt động trước.");
    s.activeBoost = { itemId, charges: pack.charges, totalCharges: pack.charges, activatedAt: now };
  } else if (itemId === "energy-voucher") {
    if (s.energy >= 30) throw new Error("Năng lượng đang đầy.");
    s.energy = Math.min(30, s.energy + 15);
    s.energyAt = now;
  } else throw new Error("Vật phẩm này không thể kích hoạt.");
  s.consumables[itemId]--;
  return saveRequest(s, "activationRequests", requestId, { itemId, activeBoost: s.activeBoost ? { ...s.activeBoost } : null, energy: s.energy, duplicate: false });
}
export function acknowledgeRewardEvents(s, eventIds) {
  const ids = new Set(eventIds);
  for (const event of s.rewardEvents ?? []) if (ids.has(event.id)) event.seen = true;
  return s.rewardEvents;
}
export function awardCourseCosmetic(s, courseId, { now = Date.now() } = {}) {
  normalizeGamification(s, { now });
  const item = cosmetics.find((c) => c.unlock.type === "course" && c.unlock.courseId === courseId);
  if (!item || s.inventory.includes(item.id)) return false;
  s.inventory.push(item.id);
  s.rewardEvents.push({ id: `course-complete:${courseId}`, fromLevel: s.level.level, toLevel: s.level.level, rewards: [{ type: "skin", itemId: item.id, amount: 1, name: item.name }], createdAt: now, seen: false });
  return true;
}
export function gamificationShop(s) {
  normalizeGamification(s);
  return { cosmetics, items: extendedShop, inventoryConsumables: s.consumables, consumables: s.consumables, boost: s.activeBoost, level: s.level };
}
export function registerGamificationRoutes(app, { store, now = Date.now }) {
  app.post("/api/inventory/activate", async (request, reply) => {
    const { itemId, requestId } = request.body ?? {};
    if (typeof itemId !== "string" || (requestId !== undefined && (typeof requestId !== "string" || requestId.length > 100))) return reply.code(400).send({ message: "Vật phẩm hoặc mã lượt không hợp lệ." });
    try { return store.transaction(() => { const s = store.getState(); const result = activateConsumable(s, itemId, { requestId, now: now() }); store.putState(s); return { ...result, state: s }; }); }
    catch (error) { return reply.code(400).send({ message: error.message }); }
  });
  app.post("/api/reward-events/:id/seen", async (request) => store.transaction(() => {
    const s = store.getState(); acknowledgeRewardEvents(s, [request.params.id]); store.putState(s); return { ok: true };
  }));
}
