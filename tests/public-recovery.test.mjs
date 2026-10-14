import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { decidePublicRecovery, recoveryRetryDelay } from '../scripts/public-recovery-policy.mjs';
import { readPublicJobState } from '../scripts/public-watchdog.mjs';

const minute = 60_000;
const currentTime = Date.parse('2026-10-15T08:00:00+07:00');
const observation = overrides => Object.freeze({
  enabled: true, failures: 3, localHealthy: true, tunnelHealthy: true,
  publicHealthy: true, internetReachable: true, gradingActive: false,
  now: currentTime, nextRecoveryAt: 0, ...overrides,
});

test('manual Stop, healthy service and brief failures never trigger public recovery', () => {
  for (const failures of [0, 1, 2]) {
    assert.equal(decidePublicRecovery(observation({ failures, localHealthy: false,
      tunnelHealthy: false, publicHealthy: false })), 'idle',
    'One or two failed probes must not churn a tunnel');
  }
  assert.equal(decidePublicRecovery(observation({ enabled: false, failures: 500,
    localHealthy: false, tunnelHealthy: false, publicHealthy: false })), 'idle',
  'An explicitly stopped website must not revive itself');
  for (const failures of [0, 3, 500]) assert.equal(
    decidePublicRecovery(observation({ failures })), 'idle',
    'A live website wins over an old failure counter',
  );
});

test('public health combinations repair only the missing component; drifted Worker does not restart Node', () => {
  const cases = [
    { localHealthy: true, tunnelHealthy: true, publicHealthy: true, action: 'idle' },
    { localHealthy: true, tunnelHealthy: true, publicHealthy: false, action: 'sync-alias' },
    { localHealthy: true, tunnelHealthy: false, publicHealthy: true, action: 'restart' },
    { localHealthy: true, tunnelHealthy: false, publicHealthy: false, action: 'restart' },
    { localHealthy: false, tunnelHealthy: true, publicHealthy: true, action: 'restart' },
    { localHealthy: false, tunnelHealthy: true, publicHealthy: false, action: 'restart' },
    { localHealthy: false, tunnelHealthy: false, publicHealthy: true, action: 'restart' },
    { localHealthy: false, tunnelHealthy: false, publicHealthy: false, action: 'restart' },
  ];
  for (const { action, ...health } of cases) assert.equal(
    decidePublicRecovery(observation(health)), action, JSON.stringify(health),
  );
});

test('loss of Internet pauses both alias repair and tunnel rotation until connectivity returns', () => {
  const aliasOutage = { publicHealthy: false };
  const tunnelOutage = { tunnelHealthy: false, publicHealthy: false };
  for (const outage of [aliasOutage, tunnelOutage]) {
    assert.equal(decidePublicRecovery(observation({ ...outage, internetReachable: false })), 'wait-network');
  }
  assert.equal(decidePublicRecovery(observation(aliasOutage)), 'sync-alias');
  assert.equal(decidePublicRecovery(observation(tunnelOutage)), 'restart');
});

test('live local grading defers restarts, while an unhealthy server requests guarded process verification', () => {
  const tunnelOutage = { tunnelHealthy: false, publicHealthy: false };
  assert.equal(decidePublicRecovery(observation({ ...tunnelOutage, gradingActive: true })), 'defer-grading');
  assert.equal(decidePublicRecovery(observation({ ...tunnelOutage, gradingActive: false })), 'restart');
  for (const outage of [
    { localHealthy: false, tunnelHealthy: false, publicHealthy: false },
    { localHealthy: false },
  ]) assert.equal(decidePublicRecovery(observation({ ...outage, gradingActive: true })), 'restart',
    'Stale job rows must allow a recovery proposal; PowerShell still verifies ownership and protects a live server');
  assert.equal(decidePublicRecovery(observation({ publicHealthy: false, gradingActive: true })), 'sync-alias',
    'Updating the Worker target can preserve an in-progress local submission');
});

test('backoff waits until its deadline, with no assumed Quick Tunnel expiry after hours offline', () => {
  const outage = { tunnelHealthy: false, publicHealthy: false, nextRecoveryAt: currentTime + 2 * minute };
  assert.equal(decidePublicRecovery(observation({ ...outage, now: outage.nextRecoveryAt - 1 })), 'cooldown');
  assert.equal(decidePublicRecovery(observation({ ...outage, now: outage.nextRecoveryAt })), 'restart');
  assert.equal(decidePublicRecovery(observation({ ...outage, now: outage.nextRecoveryAt + 1 })), 'restart');
  const afterLongSleep = currentTime + 48 * 60 * minute;
  assert.equal(decidePublicRecovery(observation({ now: afterLongSleep, failures: 100 })), 'idle',
    'Elapsed wall-clock time alone does not expire a healthy tunnel');
  assert.equal(decidePublicRecovery(observation({ ...outage, now: afterLongSleep, internetReachable: false })), 'wait-network',
    'A passed cooldown does not make the network reachable');
});

test('successive recovery errors use bounded, increasing delays instead of a tight deploy loop', () => {
  const expected = [2, 5, 10, 30, 30, 30].map(n => n * minute);
  assert.deepEqual([1, 2, 3, 4, 5, 100].map(recoveryRetryDelay), expected);
});

test('the decision policy is read-only and does not alter credentials or saved grading state', () => {
  const input = observation({ publicHealthy: false, gradingActive: true,
    password: 'private-test-password', db: '.data/bytepath.sqlite',
    publicOrigin: 'https://study.example.workers.dev',
    jobs: Object.freeze([{ id: 'submission-fixture', status: 'running' }]),
  });
  const before = structuredClone(input);
  assert.equal(decidePublicRecovery(input), 'sync-alias');
  assert.deepEqual(input, before);
});

function databaseFixture(t, rows) {
  const fixtureRoot = mkdtempSync(resolve(tmpdir(), 'bytepath-public-recovery-'));
  mkdirSync(resolve(fixtureRoot, '.data', 'public'), { recursive: true });
  t.after(() => {
    // Only remove the directory created by this test, within the temp root.
    const target = resolve(fixtureRoot);
    assert.equal(dirname(target), resolve(tmpdir()));
    assert.ok(basename(target).startsWith('bytepath-public-recovery-'));
    rmSync(target, { recursive: true, force: true });
  });
  const database = '.data/bytepath.sqlite';
  const file = resolve(fixtureRoot, database);
  const db = new DatabaseSync(file);
  try {
    db.exec('CREATE TABLE jobs(id TEXT PRIMARY KEY, data TEXT NOT NULL); CREATE TABLE meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);');
    db.prepare('INSERT INTO meta VALUES (?,?)').run('profile', 'Untouched progress fixture');
    rows.forEach((row, index) => db.prepare('INSERT INTO jobs VALUES (?,?)').run(String(index), row));
  } finally { db.close(); }
  return { fixtureRoot, database, file };
}

test('readonly job inspection distinguishes queued/running work from finished and infrastructure-error jobs', t => {
  const finished = databaseFixture(t, [JSON.stringify({ status: 'completed' }), JSON.stringify({ status: 'error' })]);
  const before = readFileSync(finished.file);
  assert.equal(readPublicJobState(finished.database, finished.fixtureRoot), 'idle');
  assert.deepEqual(readFileSync(finished.file), before, 'Inspecting jobs must not change saved grades or profile bytes');
  for (const status of ['queued', 'running']) {
    const active = databaseFixture(t, [JSON.stringify({ status: 'completed' }), JSON.stringify({ status })]);
    const original = readFileSync(active.file);
    assert.equal(readPublicJobState(active.database, active.fixtureRoot), 'active');
    assert.deepEqual(readFileSync(active.file), original);
  }
});

test('missing or malformed grading data stays unknown and cannot create an empty replacement database', t => {
  for (const badRow of ['not-json', 'null', JSON.stringify({ status: 'unrecognized' }), JSON.stringify({})]) {
    const malformed = databaseFixture(t, [JSON.stringify({ status: 'running' }), badRow]);
    const original = readFileSync(malformed.file);
    assert.equal(readPublicJobState(malformed.database, malformed.fixtureRoot), 'unknown',
      'A valid active row must not conceal later malformed data');
    assert.deepEqual(readFileSync(malformed.file), original);
  }
  const fixture = databaseFixture(t, []);
  const missing = '.data/public/online.sqlite';
  const names = readdirSync(resolve(fixture.fixtureRoot, '.data', 'public'));
  assert.equal(readPublicJobState(missing, fixture.fixtureRoot), 'unknown');
  assert.equal(existsSync(resolve(fixture.fixtureRoot, missing)), false);
  assert.deepEqual(readdirSync(resolve(fixture.fixtureRoot, '.data', 'public')), names);
  const unavailableSchema = new DatabaseSync(fixture.file);
  unavailableSchema.exec('DROP TABLE jobs');
  unavailableSchema.close();
  const schemaBytes = readFileSync(fixture.file);
  assert.equal(readPublicJobState(fixture.database, fixture.fixtureRoot), 'unknown');
  assert.deepEqual(readFileSync(fixture.file), schemaBytes, 'Inspection must not repair or rewrite a missing job table');
  for (const unsafe of ['../../personal.sqlite', '.data/other.sqlite', resolve(fixture.fixtureRoot, fixture.database)]) {
    assert.equal(readPublicJobState(unsafe, fixture.fixtureRoot), 'unknown');
  }
});
