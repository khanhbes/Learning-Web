import test from 'node:test';
import assert from 'node:assert/strict';
import { createMascotController, TIMELINES, TRIGGER_TIMELINES, normalizeVisemeStream } from '../shared/mascot-motion.mjs';

function clock(options = {}) {
  let time = 0;
  let nextId = 0;
  const timers = new Map();
  const controller = createMascotController({ ...options, now: () => time,
    setTimeout(fn, ms) { const id = ++nextId; timers.set(id, { at: time + ms, fn }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  function advance(ms) {
    const target = time + ms;
    let iterations = 0;
    while (true) {
      const due = [...timers].filter(([, timer]) => timer.at <= target)
        .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!due) break;
      assert.ok(++iterations < 1000, 'scheduler must not create a busy zero-delay loop');
      timers.delete(due[0]); time = due[1].at; due[1].fn();
    }
    time = target;
  }
  return { controller, advance, timers };
}

test('27 original timelines and exact Rive inputs have valid durations and reward precedence', () => {
  assert.equal(Object.keys(TIMELINES).length, 27);
  assert.deepEqual(Object.keys(TRIGGER_TIMELINES), ['wave', 'correct', 'wrong', 'almost', 'complete',
    'perfect', 'levelUp', 'streakUp', 'streakLost', 'badge', 'hint', 'hurry', 'cheer', 'loading']);
  for (const [id, value] of Object.entries(TIMELINES)) {
    assert.equal(value.fps, 60);
    assert.ok(value.duration > 0 && value.duration <= 5000);
    if (!value.loop && !['level_up', 'perfect_score'].includes(id)) assert.ok(value.duration <= 3000, id);
  }
  assert.ok(TIMELINES.level_up.priority > TIMELINES.lesson_complete.priority);
  assert.ok(TIMELINES.lesson_complete.priority > TIMELINES.loading.priority);
});

test('higher priority interrupts loading; equal priority waits; stale Rive completion cannot finish next event', () => {
  const { controller: c, advance } = clock();
  const endings = [];
  c.say('loading', { id: 'load', onComplete: value => endings.push(value) });
  c.say('correct', { id: 'answer1', onComplete: value => endings.push(value) });
  assert.equal(endings[0].reason, 'interrupted');
  c.say('correct', { id: 'answer2', onComplete: value => endings.push(value) });
  assert.equal(c.getSnapshot().active.id, 'answer1');
  assert.equal(c.getSnapshot().queueLength, 1);
  c.complete('answer1');
  assert.equal(c.getSnapshot().active.id, 'answer2');
  c.complete('answer1'); // Late callback from the unmounted canvas.
  assert.equal(c.getSnapshot().active.id, 'answer2');
  advance(1000);
  assert.equal(c.getSnapshot().active, null);
  advance(10000);
  assert.deepEqual(endings.map(item => [item.id, item.reason]), [
    ['load', 'interrupted'], ['answer1', 'completed'], ['answer2', 'completed'],
  ]);
  assert.equal(c.getSnapshot().state, 'idle_breathe');
});

test('noninterruptible celebration serializes competing rewards by priority and settles all callbacks', () => {
  const { controller: c, advance } = clock();
  const endings = [];
  const options = id => ({ id, onComplete: event => endings.push(event.id) });
  c.say('complete', options('lesson'));
  c.say('wave', options('wave'));
  c.say('badge', options('badge'));
  c.levelUp({ level: 7, ...options('level') });
  assert.equal(c.getSnapshot().state, 'lesson_complete');
  advance(2800);
  assert.equal(c.getSnapshot().state, 'level_up');
  assert.deepEqual(c.getSnapshot().active.payload, { level: 7 });
  advance(4600);
  assert.equal(c.getSnapshot().state, 'badge_unlock');
  advance(2300);
  assert.equal(c.getSnapshot().state, 'wave_hello');
  advance(1100);
  assert.deepEqual(endings, ['lesson', 'level', 'badge', 'wave']);
});

test('skip and route cancellation release callbacks exactly once even when interrupted callbacks throw', () => {
  const failures = [];
  const { controller: c, advance } = clock({ onError: error => failures.push(error.message) });
  const endings = [];
  c.say('complete', { id: 'lesson', onComplete: event => endings.push(event.reason) });
  c.levelUp({ level: 30, id: 'level', onComplete: event => { endings.push(event.reason); throw new Error('consumer'); } });
  c.say('badge', { id: 'badge', onComplete: event => endings.push(event.reason) });
  c.skip();
  assert.equal(c.getSnapshot().state, 'level_up');
  c.cancelAll();
  c.cancelAll();
  c.complete('level');
  advance(20000);
  assert.deepEqual(endings, ['skipped', 'cancelled', 'cancelled']);
  assert.deepEqual(failures, ['consumer']);
  assert.equal(c.getSnapshot().queueLength, 0);
});

test('explicit IDs are idempotent and rapid anonymous clicks coalesce without adding combo', () => {
  const { controller: c, advance } = clock();
  let calls = 0;
  const event = { id: 'attempt:question:1', onComplete: () => calls++ };
  c.say('correct', event);
  c.say('correct', event);
  assert.equal(c.getSnapshot().queueLength, 0);
  assert.equal(c.getSnapshot().inputs.combo, 1);
  advance(1000);
  c.say('correct', event);
  assert.equal(calls, 1);
  assert.equal(c.getSnapshot().active, null);
  c.say('correct');
  c.say('correct');
  assert.equal(c.getSnapshot().queueLength, 0);
  assert.equal(c.getSnapshot().inputs.combo, 2);
});

test('combo feedback occurs at 3, 5 and 10 unique correct answers and resets after wrong', () => {
  const { controller: c, advance } = clock();
  const observed = [];
  for (let i = 1; i <= 10; i++) {
    c.say('correct', { id: `correct-${i}` });
    observed.push(c.getSnapshot().state);
    advance(TIMELINES[c.getSnapshot().state].duration);
  }
  assert.deepEqual(observed.map((state, index) => state === 'answer_correct_combo' ? index + 1 : null).filter(Boolean), [3, 5, 10]);
  c.say('correct', { id: 'eleventh' });
  assert.equal(c.getSnapshot().state, 'answer_correct', 'the milestone at ten must not repeat on every later answer');
  assert.equal(c.getSnapshot().inputs.combo, 10, 'display input remains bounded at ten');
  advance(1000);
  c.say('wrong', { id: 'wrong' });
  assert.equal(c.getSnapshot().inputs.combo, 0);
  advance(1800);
  c.say('correct', { id: 'after-wrong' });
  assert.equal(c.getSnapshot().inputs.combo, 1);
  assert.equal(c.getSnapshot().state, 'answer_correct');
});

test('queued correct answers compute combo from unique feedback, not unrelated reward renders', () => {
  const { controller: c, advance } = clock();
  c.say('complete', { id: 'reward' });
  c.say('correct', { id: 'q1' });
  c.say('correct', { id: 'q2' });
  c.say('correct', { id: 'q3' });
  assert.equal(c.getSnapshot().inputs.combo, 0, 'queued answers should not change displayed reward');
  advance(2800 + 1000 + 1000);
  assert.equal(c.getSnapshot().state, 'answer_correct_combo');
  assert.equal(c.getSnapshot().inputs.combo, 3);
});

test('hidden documents freeze elapsed time; manual pause survives document visibility changes', () => {
  const { controller: c, advance, timers } = clock();
  const endings = [];
  c.say('complete', { onComplete: event => endings.push(event) });
  advance(800);
  c.setVisible(false);
  assert.equal(timers.size, 0);
  advance(60000);
  assert.equal(endings.length, 0);
  c.pause();
  c.setVisible(true);
  assert.equal(c.getSnapshot().motionPaused, true);
  advance(5000);
  c.resume();
  advance(1999);
  assert.equal(endings.length, 0);
  advance(1);
  assert.equal(endings.length, 1);
  assert.equal(endings[0].reason, 'completed');
});

test('dynamic reduced motion settles one-shots quickly but preserves idle and loading lifecycle', () => {
  const { controller: c, advance } = clock();
  let calls = 0;
  c.levelUp({ level: 20, onComplete: () => calls++ });
  advance(1000);
  c.setReducedMotion(true);
  assert.equal(c.getSnapshot().active.duration, 120);
  advance(119);
  assert.equal(calls, 0);
  advance(1);
  assert.equal(calls, 1);
  const loading = c.say('loading');
  advance(30000);
  assert.equal(c.getSnapshot().state, 'loading');
  c.stop(loading);
  assert.equal(c.getSnapshot().state, 'idle_breathe');
});

test('bounded queue preserves higher priority rewards, reports dropped work, and never overlaps', () => {
  const { controller: c, advance } = clock({ maxQueue: 2 });
  const endings = [];
  const event = id => ({ id, onComplete: result => endings.push([id, result.reason]) });
  c.say('complete', event('current'));
  c.say('wave', event('wave'));
  c.say('hint', event('hint'));
  c.levelUp({ level: 2, ...event('level') });
  c.say('idle_bored', event('low'));
  assert.equal(c.getSnapshot().queueLength, 2);
  assert.deepEqual(endings, [['wave', 'overflow'], ['low', 'overflow']]);
  advance(2800);
  assert.equal(c.getSnapshot().state, 'level_up');
  advance(4600);
  assert.equal(c.getSnapshot().state, 'teach_idea');
  advance(1700);
  assert.equal(c.getSnapshot().active, null);
  assert.equal(endings.length, 5);
});

test('number inputs reject non-finite ranges safely and never change backend data', () => {
  const { controller: c } = clock();
  c.setInputs({ lookX: -8, lookY: 99, xp: 99999, viseme: 2.6, mood: Infinity, combo: NaN, isTalking: true });
  assert.deepEqual(c.getSnapshot().inputs, { lookX: -1, lookY: 1, xp: 999, viseme: 3, mood: 0, combo: 0,
    isTalking: true, isThinking: false, isSleeping: false, isCoding: false });
  assert.equal(c.getSnapshot().state, 'teach_talk');
  assert.throws(() => c.setBoolean('isPaid', true), /Unknown mascot boolean/);
  assert.throws(() => c.say('__proto__'), /Unknown mascot timeline/);
  c.levelUp({ level: Infinity });
  assert.deepEqual(c.getSnapshot().active.payload, { level: 1 });
  assert.equal(Object.hasOwn(c.getSnapshot(), 'gems'), false);
  assert.equal(Object.hasOwn(c.getSnapshot(), 'progress'), false);
});

test('speech stream is bounded, timed in milliseconds, and resumes its remaining visemes after hiding', () => {
  const { controller: c, advance } = clock();
  const endings = [];
  c.talk([{ at: 400, viseme: 5 }, { at: 0, viseme: 1 }, { at: 200, viseme: 3 }],
    { id: 'speech', onComplete: event => endings.push(event) });
  assert.equal(c.getSnapshot().inputs.viseme, 1);
  advance(200);
  assert.equal(c.getSnapshot().inputs.viseme, 3);
  c.setVisible(false);
  advance(60000);
  assert.equal(c.getSnapshot().inputs.viseme, 3);
  c.setVisible(true);
  advance(200);
  assert.equal(c.getSnapshot().inputs.viseme, 5);
  advance(160);
  assert.equal(c.getSnapshot().inputs.viseme, 0);
  assert.equal(endings.length, 1);
  const bounded = normalizeVisemeStream(Array.from({ length: 10000 }, () => ({ at: 1e9, viseme: -2 })));
  assert.equal(bounded.length, 512);
  assert.deepEqual(bounded[0], { at: 30000, viseme: 0 });
  const missingTime = normalizeVisemeStream(Array.from({ length: 512 }, () => ({ at: NaN, viseme: 1 })));
  assert.ok(missingTime.every(frame => frame.at >= 0 && frame.at <= 30000));
});

test('destruction clears timers and settles active/queued callbacks once without new playback', () => {
  const { controller: c, advance, timers } = clock();
  const endings = [];
  c.say('complete', { id: 'active', onComplete: event => endings.push(event.reason) });
  c.say('wave', { id: 'queued', onComplete: event => endings.push(event.reason) });
  c.destroy();
  c.destroy();
  advance(20000);
  assert.equal(timers.size, 0);
  assert.deepEqual(endings, ['disposed', 'disposed']);
  c.say('wave', { onComplete: event => endings.push(event.reason) });
  assert.equal(c.getSnapshot().active, null);
  assert.deepEqual(endings, ['disposed', 'disposed', 'disposed']);
});

test('interrupting speech resets its mouth and cancels pending viseme timers', () => {
  const { controller: c, advance } = clock();
  const reasons = [];
  c.talk([{ at: 0, viseme: 5 }, { at: 5000, viseme: 3 }],
    { id: 'speech', onComplete: result => reasons.push(result.reason) });
  assert.equal(c.getSnapshot().inputs.viseme, 5);
  c.say('correct', { id: 'answer' });
  assert.equal(c.getSnapshot().inputs.viseme, 0);
  advance(10000);
  assert.equal(c.getSnapshot().inputs.viseme, 0);
  assert.deepEqual(reasons, ['interrupted']);
});

test('a queued old correct pose cannot resurrect the logical streak after a wrong answer', () => {
  const { controller: c, advance } = clock();
  c.say('correct', { id: 'correct-one' });
  c.say('correct', { id: 'correct-two' });
  c.say('wrong', { id: 'wrong-three' });
  c.say('correct', { id: 'correct-four' });
  assert.equal(c.getSnapshot().inputs.combo, 0);
  advance(1800); // Older pose may still appear; it is feedback, not streak state.
  advance(1000);
  assert.equal(c.getSnapshot().active.id, 'correct-four');
  assert.equal(c.getSnapshot().inputs.combo, 1);
  assert.equal(c.getSnapshot().state, 'answer_correct');
});
