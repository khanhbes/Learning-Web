import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from '../server/index.mjs';
import { createStore } from '../server/store.mjs';
import { dayTime } from '../server/game.mjs';

const assetRoot = resolve(import.meta.dirname, '..', 'public');
const now = dayTime('2026-10-14') + 3600000;
async function fixture() {
  const store = createStore(':memory:');
  const app = await createApp({ store, assetRoot, now: () => now,
    health: async () => ({ available: false }), aiHealth: async () => ({ available: false }),
    tutor: async () => ({ available: false, text: 'Fixture; no cloud request' }),
  });
  return { store, app };
}
const ledger = store => store.db.prepare('SELECT * FROM ledger ORDER BY id').all();

test('new profiles receive Bitty free and can explicitly re-equip the original robot without remigration', async () => {
  const { store, app } = await fixture();
  try {
    const fresh = store.getState();
    assert.equal(fresh.profile.skin, 'bitty');
    assert.equal(fresh.profile.mascotVersion, 1);
    assert.deepEqual(fresh.inventory, ['original', 'bitty']);
    assert.equal(fresh.xp, 0); assert.equal(fresh.gems, 0); assert.equal(ledger(store).length, 0);
    const shop = (await app.inject('/api/shop')).json();
    assert.equal(shop.items.some(item => item.id === 'bitty'), false, 'A free equipped mascot must not require a purchase');
    const equip = await app.inject({ method: 'PUT', url: '/api/profile', payload: {
      name: 'Bitty QA', language: 'python', dailyGoal: 50, skin: 'original',
    } });
    assert.equal(equip.statusCode, 200, equip.body);
    for (let i = 0; i < 4; i++) {
      const response = await app.inject('/api/state');
      assert.equal(response.statusCode, 200);
      assert.equal(response.json().profile.skin, 'original');
    }
    const after = store.getState();
    assert.equal(after.inventory.filter(id => id === 'bitty').length, 1);
    assert.equal(after.xp, 0); assert.equal(after.gems, 0); assert.equal(ledger(store).length, 0);
  } finally { await app.close(); }
});

test('pre-Bitty migration grants once, changes only the old default, and retains academic/ledger/inventory data', async t => {
  for (const selected of ['original', 'ocean', 'cat']) await t.test(selected, async () => {
    const { store, app } = await fixture();
    try {
      const legacy = store.getState();
      delete legacy.profile.mascotVersion;
      legacy.profile.skin = selected;
      legacy.inventory = ['original', 'ocean', 'cat'];
      legacy.xp = 450; legacy.gems = 123;
      // These are existing, already-issued level gifts. Bitty must not reissue them.
      legacy.levelRewardIds = ['level:2', 'level:3', 'level:4'];
      legacy.rewardEvents = [{ id: 'levels:2-3-4', fromLevel: 1, toLevel: 4,
        rewards: [], createdAt: now - 1000, seen: true }];
      legacy.courses.dsa.progress[1] = { passed: true, bestKnowledge: 80, bestScore: 80 };
      legacy.progress = structuredClone(legacy.courses.dsa.progress);
      store.putState(legacy);
      store.db.prepare('INSERT INTO ledger(id,created_at,xp,gems,reason,course_id) VALUES (?,?,?,?,?,?)')
        .run('lesson:1', now - 1000, 50, 10, 'Original DSA reward', 'dsa');
      const oldLedger = ledger(store), oldProgress = structuredClone(legacy.courses.dsa.progress);
      const oldEvents = structuredClone(legacy.rewardEvents);
      for (let i = 0; i < 5; i++) assert.equal((await app.inject('/api/state')).statusCode, 200);
      const migrated = store.getState();
      assert.equal(migrated.profile.skin, selected === 'original' ? 'bitty' : selected);
      assert.equal(migrated.profile.mascotVersion, 1);
      assert.deepEqual(migrated.inventory, ['original', 'ocean', 'cat', 'bitty']);
      assert.equal(migrated.xp, 450); assert.equal(migrated.gems, 123);
      assert.deepEqual(migrated.courses.dsa.progress, oldProgress);
      assert.deepEqual(migrated.rewardEvents, oldEvents);
      assert.deepEqual(ledger(store), oldLedger);
      const persisted = JSON.parse(store.db.prepare("SELECT value FROM meta WHERE key='state'").get().value);
      assert.equal(persisted.profile.mascotVersion, 1, 'Migration marker must persist through the state API');
      const beforeRetry = structuredClone(migrated);
      store.transaction(() => {
        const s = store.getState();
        assert.equal(store.reward(s, 'lesson:1', { xp: 50, gems: 10, now, courseId: 'dsa' }), false);
        store.putState(s);
      });
      assert.deepEqual(store.getState(), beforeRetry, 'Historical reward IDs remain idempotent after mascot migration');
    } finally { await app.close(); }
  });
});

test('Bitty static SVG, native RIV and props have correct MIME, unchanged bytes and nosniff', async () => {
  const { app } = await fixture();
  try {
    const cases = [
      ['bitty-rig.svg', /^image\/svg\+xml/],
      ['bitty.riv', /^application\/octet-stream/],
      ['contract.json', /^application\/json/],
      ['props/trophy.svg', /^image\/svg\+xml/],
    ];
    for (const [asset, mime] of cases) {
      const expected = readFileSync(resolve(assetRoot, 'mascots', 'bitty', asset));
      const response = await app.inject(`/mascots/bitty/${asset}`);
      assert.equal(response.statusCode, 200, response.body);
      assert.match(response.headers['content-type'], mime);
      assert.equal(response.headers['x-content-type-options'], 'nosniff');
      assert.equal(response.headers['cache-control'], 'no-cache');
      assert.deepEqual(response.rawPayload, expected, `${asset} must be served as the actual asset, not SPA HTML`);
      if (asset.endsWith('.riv')) {
        assert.equal(expected.subarray(0, 4).toString(), 'RIVE');
        assert.ok(expected.length > 5000 && expected.length < 200000);
      }
      if (asset === 'contract.json') assert.deepEqual(response.json(), JSON.parse(
        readFileSync(resolve(import.meta.dirname, '..', 'animation', 'bitty', 'contract.json'), 'utf8'),
      ), 'Published input contract must match the source used to compile the binary');
    }
  } finally { await app.close(); }
});

test('missing and encoded-traversal mascot URLs return an error rather than source, secrets or SPA HTML', async () => {
  const { app } = await fixture();
  try {
    for (const url of [
      '/mascots/bitty/not-present.riv',
      '/mascots/bitty/props/missing.svg',
      '/mascots/bitty/%2e%2e%2fbitty-rig.svg',
      '/mascots/bitty/props/%2e%2e%2f%2e%2e%2f.env',
      '/mascots/bitty/%2e%2e%5c%2e%2e%5c.env',
      '/mascots/bitty/bitty-rig.svg%00.json',
      '/mascots/bitty/bitty-rig.svg.js',
    ]) {
      const response = await app.inject(url);
      assert.ok([400, 404].includes(response.statusCode), `${url}: ${response.statusCode}`);
      assert.match(response.headers['content-type'], /^application\/json/);
      assert.doesNotMatch(response.body, /<svg\b|<!doctype\b|GEMINI_API_KEY\s*=/i);
      assert.notEqual(response.rawPayload.subarray(0, 4).toString(), 'RIVE');
    }
  } finally { await app.close(); }
});
