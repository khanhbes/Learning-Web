import test from "node:test";
import assert from "node:assert/strict";
import { cosmetics, boostPacks, extendedShop } from "../shared/cosmetics.mjs";
import { levelProgress, normalizeGamification, syncLevelRewards, applyXPBoost, purchaseExtended, activateConsumable, acknowledgeRewardEvents, awardCourseCosmetic } from "../server/gamification.mjs";
const fresh = () => normalizeGamification({ xp: 0, gems: 10000, energy: 5, energyAt: 0, inventory: ["original"], profile: {} });

test("24 original cosmetics have precise shop/level/course unlocks", () => {
  assert.equal(cosmetics.length, 24);
  assert.equal(new Set(cosmetics.map((c) => c.id)).size, 24);
  assert.equal(cosmetics.filter((c) => c.family === "robot").length, 12);
  assert.equal(cosmetics.filter((c) => c.family !== "robot").length, 12);
  assert.equal(cosmetics.filter((c) => c.unlock.type === "level").length, 6);
  assert.equal(cosmetics.filter((c) => c.unlock.type === "course").length, 2);
  assert.deepEqual(boostPacks.map((b) => [b.charges,b.price]), [[2,40],[5,90],[10,160]]);
  for (const family of ["cat","fox","rabbit","axolotl"]) assert.deepEqual(cosmetics.filter((c) => c.family === family).map((c) => c.price), [150,300,null]);
  assert.ok(extendedShop.every((c) => c.price > 0));
});
test("Level thresholds are correct at every boundary and stay capped at 30", () => {
  let threshold = 0;
  for (let level = 1; level < 30; level++) {
    const cost = 100 + 25 * (level - 1);
    assert.equal(levelProgress(threshold).level, level);
    assert.equal(levelProgress(threshold + cost - 1).level, level);
    assert.equal(levelProgress(threshold + cost).level, level + 1);
    threshold += cost;
  }
  assert.equal(levelProgress(-20).level, 1);
  assert.equal(levelProgress(threshold + 999999).level, 30);
  assert.equal(levelProgress(threshold + 999999).totalXP, threshold + 999999);
  assert.ok(levelProgress(threshold).capped);
});
test("Retroactive and multi-level gifts are granted once and coalesced", () => {
  const s = fresh(); s.xp = 13150;
  normalizeGamification(s, { retroactive: true, now: 100 });
  assert.equal(s.level.level, 30);
  assert.equal(s.levelRewardIds.length, 29);
  assert.equal(s.gems, 10135);
  assert.equal(s.consumables["boost-2"], 2);
  assert.equal(s.consumables["boost-5"], 2);
  assert.equal(s.consumables["boost-10"], 2);
  assert.equal(s.consumables["energy-voucher"], 12);
  assert.equal(s.avatarFrames.length, 5);
  assert.equal(s.rewardEvents.length, 1);
  const before = structuredClone(s);
  normalizeGamification(s, { retroactive: true, now: 200 });
  assert.deepEqual(s, before);
  acknowledgeRewardEvents(s, [s.rewardEvents[0].id]);
  assert.equal(s.rewardEvents[0].seen, true);
  assert.deepEqual(syncLevelRewards(s, { now: 300 }), []);
});
test("X2 consumes a charge only on a real positive XP grant and cannot stack", () => {
  const s = fresh(); purchaseExtended(s,"boost-2",{requestId:"purchase1"}); activateConsumable(s,"boost-2",{requestId:"activate1"});
  assert.deepEqual(applyXPBoost(s,0), {baseXp:0,bonusXp:0,xp:0,boostRemaining:2});
  assert.equal(applyXPBoost(s,50).xp, 100);
  assert.equal(s.activeBoost.charges, 1);
  purchaseExtended(s,"boost-5",{requestId:"purchase2"});
  assert.throws(() => activateConsumable(s,"boost-5"), /đang hoạt động/);
  assert.equal(s.consumables["boost-5"],1);
  assert.equal(applyXPBoost(s,10).xp,20);
  assert.equal(s.activeBoost,null);
  assert.equal(applyXPBoost(s,20).xp,20);
  activateConsumable(s,"boost-5");
  assert.equal(s.activeBoost.charges,5);
});
test("Purchase/activation retries are idempotent and cannot reuse an ID for another item", () => {
  const s = fresh();
  purchaseExtended(s,"boost-2",{requestId:"a"}); const gems=s.gems;
  assert.equal(purchaseExtended(s,"boost-2",{requestId:"a"}).duplicate,true);
  assert.equal(s.gems,gems); assert.equal(s.consumables["boost-2"],1);
  assert.throws(() => purchaseExtended(s,"boost-5",{requestId:"a"}));
  activateConsumable(s,"boost-2",{requestId:"b"});
  assert.equal(activateConsumable(s,"boost-2",{requestId:"b"}).duplicate,true);
  assert.equal(s.activeBoost.charges,2); assert.equal(s.consumables["boost-2"],0);
  assert.throws(() => purchaseExtended(s,"scholar"));
  purchaseExtended(s,"cat"); assert.ok(s.inventory.includes("cat")); assert.throws(() => purchaseExtended(s,"cat"));
});
test("Energy tickets cap at 30 and cannot be spent at full energy", () => {
  const s=fresh(); s.consumables["energy-voucher"]=3;
  activateConsumable(s,"energy-voucher",{requestId:"ticket1",now:10}); assert.equal(s.energy,20);
  activateConsumable(s,"energy-voucher",{requestId:"ticket2",now:20}); assert.equal(s.energy,30);
  assert.throws(() => activateConsumable(s,"energy-voucher")); assert.equal(s.consumables["energy-voucher"],1);
  assert.equal(activateConsumable(s,"energy-voucher",{requestId:"ticket2"}).duplicate,true); assert.equal(s.consumables["energy-voucher"],1);
});
test("Course completion cosmetics are independent, never purchasable and awarded once", () => {
  const s=fresh(); assert.equal(awardCourseCosmetic(s,"dsa"),true); assert.equal(awardCourseCosmetic(s,"dsa"),false);
  assert.equal(awardCourseCosmetic(s,"ml"),true); assert.ok(s.inventory.includes("scientist")); assert.equal(s.rewardEvents.length,2);
});
