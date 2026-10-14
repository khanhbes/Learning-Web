/** UI-only scheduler. It never awards XP, changes progress, or decides whether an answer is correct. */
const timeline = (duration, loop, priority, interruptible = true, blend = 120) =>
  Object.freeze({ duration, loop, priority, interruptible, blend, fps: 60 });

export const TIMELINES = Object.freeze({
  idle_breathe: timeline(2800, true, 0),
  idle_blink: timeline(160, false, 5, true, 40),
  idle_look: timeline(1800, true, 0),
  idle_bored: timeline(2600, false, 5),
  idle_sleep: timeline(3000, true, 0),
  wave_hello: timeline(1100, false, 30),
  teach_talk: timeline(1800, true, 20),
  teach_point: timeline(1500, false, 25),
  teach_think: timeline(2400, true, 20),
  teach_idea: timeline(1700, false, 40),
  teach_code: timeline(2000, true, 20),
  answer_correct: timeline(1000, false, 60),
  answer_correct_combo: timeline(1400, false, 60),
  answer_wrong: timeline(1800, false, 65),
  answer_almost: timeline(1000, false, 50),
  timer_hurry: timeline(1800, true, 70),
  lesson_complete: timeline(2800, false, 85, false),
  perfect_score: timeline(3600, false, 95, false),
  streak_up: timeline(2200, false, 80),
  streak_lost: timeline(2400, false, 75),
  level_up: timeline(4600, false, 100, false),
  badge_unlock: timeline(2300, false, 85, false),
  xp_gain: timeline(900, false, 55),
  cheer_encourage: timeline(1800, false, 45),
  loading: timeline(1400, true, 10),
  error_404: timeline(2300, false, 75),
  offline: timeline(2200, true, 70),
});
export const TRIGGER_TIMELINES = Object.freeze({
  wave: 'wave_hello', correct: 'answer_correct', wrong: 'answer_wrong', almost: 'answer_almost',
  complete: 'lesson_complete', perfect: 'perfect_score', levelUp: 'level_up',
  streakUp: 'streak_up', streakLost: 'streak_lost', badge: 'badge_unlock',
  hint: 'teach_idea', hurry: 'timer_hurry', cheer: 'cheer_encourage', loading: 'loading',
});
export const INPUT_RANGES = Object.freeze({
  viseme: [0, 5], combo: [0, 10], lookX: [-1, 1], lookY: [-1, 1], xp: [0, 999], mood: [0, 4],
});
export const BOOLEAN_INPUTS = Object.freeze(['isTalking', 'isThinking', 'isSleeping', 'isCoding']);
const numericInputs = Object.keys(INPUT_RANGES);
const initialInputs = () => ({ viseme: 0, combo: 0, lookX: 0, lookY: 0, xp: 0, mood: 0,
  isTalking: false, isThinking: false, isSleeping: false, isCoding: false });
const integerInputs = new Set(['viseme', 'combo', 'xp', 'mood']);

export function clampMascotInput(name, value) {
  if (!Object.hasOwn(INPUT_RANGES, name)) throw new TypeError(`Unknown mascot input: ${name}`);
  const number = Number(value);
  const [min, max] = INPUT_RANGES[name];
  const bounded = Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min > 0 ? min : 0;
  return integerInputs.has(name) ? Math.round(bounded) : bounded;
}

/** A viseme stream is an array of {at: milliseconds, viseme: 0..5}, or numbers spaced 120ms apart. */
export function normalizeVisemeStream(stream) {
  if (!Array.isArray(stream)) throw new TypeError('Viseme stream must be an array');
  const frames = stream.slice(0, 512).map((frame, index) => {
    const object = typeof frame === 'object' && frame !== null;
    const rawAt = object ? Number(frame.at) : index * 120;
    return { at: Number.isFinite(rawAt) ? Math.min(30000, Math.max(0, rawAt)) : Math.min(30000, index * 120),
      viseme: clampMascotInput('viseme', object ? frame.viseme : frame) };
  }).sort((a, b) => a.at - b.at);
  return frames;
}

/** Injectable clock makes lifecycle tests deterministic and avoids browser globals in the engine. */
export function createMascotController(options = {}) {
  const now = options.now ?? (() => typeof performance === 'object' ? performance.now() : Date.now());
  const schedule = options.setTimeout ?? globalThis.setTimeout;
  const unschedule = options.clearTimeout ?? globalThis.clearTimeout;
  const maxQueue = Math.max(1, Math.min(16, options.maxQueue ?? 8));
  let inputs = initialInputs();
  let active = null;
  let queue = [];
  let timer = null;
  let serial = 0;
  let revision = 0;
  let paused = false;
  let visible = true;
  let reducedMotion = !!options.reducedMotion;
  let disposed = false;
  let lastAnonymous = null;
  let comboStreak = 0;
  const listeners = new Set();
  const recentIds = new Map();
  let snapshot;

  const isPaused = () => paused || !visible;
  const baseState = () => inputs.isSleeping ? 'idle_sleep' : inputs.isCoding ? 'teach_code'
    : inputs.isThinking ? 'teach_think' : inputs.isTalking ? 'teach_talk' : 'idle_breathe';
  function publish() {
    revision += 1;
    snapshot = Object.freeze({ state: active?.state ?? baseState(),
      active: active ? Object.freeze({ id: active.id, state: active.state, duration: active.duration,
        priority: active.priority, loop: active.loop, payload: active.payload }) : null,
      queueLength: queue.length, inputs: Object.freeze({ ...inputs }),
      motionPaused: isPaused(), reducedMotion, revision });
    for (const listener of listeners) listener();
  }
  function clearTimer() { if (timer !== null) { unschedule(timer); timer = null; } }
  function markSeen(id) {
    recentIds.set(id, true);
    if (recentIds.size > 128) recentIds.delete(recentIds.keys().next().value);
  }
  function settle(event, reason) {
    if (!event || event.settled) return;
    event.settled = true;
    const result = Object.freeze({ id: event.id, state: event.state, reason });
    try { event.onComplete?.(result); } catch (error) { options.onError?.(error); }
  }
  const elapsed = () => active ? active.elapsed + (isPaused() ? 0 : Math.max(0, now() - active.started)) : 0;
  function next() {
    if (disposed || active || !queue.length) return;
    queue.sort((a, b) => b.priority - a.priority || a.order - b.order);
    start(queue.shift());
  }
  function finish(reason = 'completed') {
    if (!active) return;
    const event = active;
    clearTimer();
    active = null;
    if (event.stream) inputs = { ...inputs, viseme: 0 };
    // Advance first: a callback may enqueue another event without interrupting queue bookkeeping.
    next();
    publish();
    settle(event, reason);
  }
  function arm() {
    clearTimer();
    if (!active || isPaused() || disposed) return;
    const t = elapsed();
    if (active.stream) {
      while (active.streamIndex < active.stream.length && active.stream[active.streamIndex].at <= t) {
        inputs = { ...inputs, viseme: active.stream[active.streamIndex].viseme };
        active.streamIndex += 1;
      }
      publish();
    }
    if (!active.loop && t >= active.duration) { finish(); return; }
    const nextFrame = active.stream?.[active.streamIndex]?.at;
    const untilDone = active.loop ? Infinity : Math.max(0, active.duration - t);
    const delay = Math.min(untilDone, nextFrame === undefined ? Infinity : Math.max(0, nextFrame - t));
    if (Number.isFinite(delay)) timer = schedule(arm, Math.max(1, delay));
  }
  function start(event) {
    active = event;
    active.elapsed = 0;
    active.started = now();
    active.streamIndex = 0;
    // Inputs belong to the displayed event. Queued answer feedback must not change a reward pose.
    inputs = { ...inputs, ...event.inputs };
    publish();
    arm();
  }
  function dispatch(stateOrTrigger, eventOptions = {}) {
    const mapped = TRIGGER_TIMELINES[stateOrTrigger] ?? stateOrTrigger;
    if (!Object.hasOwn(TIMELINES, mapped)) throw new TypeError(`Unknown mascot timeline: ${stateOrTrigger}`);
    const id = eventOptions.id == null ? `mascot-${++serial}` : String(eventOptions.id).slice(0, 160);
    const event = { id, state: mapped, onComplete: eventOptions.onComplete, settled: false };
    if (disposed) { settle(event, 'disposed'); return id; }
    // An explicit event ID is an idempotency key: replaying it never replays its callback.
    if (recentIds.has(id)) return id;
    const t = now();
    if (eventOptions.id == null && lastAnonymous?.state === stateOrTrigger && t - lastAnonymous.at < 120) {
      settle(event, 'coalesced'); return id;
    }
    lastAnonymous = eventOptions.id == null ? { state: stateOrTrigger, at: t } : null;
    markSeen(id);
    const eventInputs = {};
    for (const key of numericInputs) if (eventOptions[key] !== undefined)
      eventInputs[key] = clampMascotInput(key, eventOptions[key]);
    if (stateOrTrigger === 'correct' || mapped === 'answer_correct') {
      // Arrival order defines the answer streak; priority determines only playback.
      // An older queued correct pose must not resurrect a streak reset by a wrong answer.
      comboStreak = eventOptions.combo === undefined ? Math.min(1e9, comboStreak + 1) : eventInputs.combo;
      eventInputs.combo = Math.min(10, comboStreak);
      if ([3, 5, 10].includes(comboStreak)) event.state = 'answer_correct_combo';
      event.answerFeedback = true;
    } else if (stateOrTrigger === 'wrong' || mapped === 'answer_wrong') {
      eventInputs.combo = 0;
      comboStreak = 0;
      event.answerFeedback = true;
    }
    const selected = TIMELINES[event.state];
    Object.assign(event, { duration: reducedMotion ? 120 : selected.duration,
      loop: selected.loop, priority: selected.priority, interruptible: selected.interruptible,
      inputs: eventInputs, payload: eventOptions.payload, order: serial++ });
    if (eventOptions.stream) {
      event.stream = normalizeVisemeStream(eventOptions.stream);
      event.loop = false;
      event.duration = reducedMotion ? 120 : Math.min(30160, Math.max(240, (event.stream.at(-1)?.at ?? 0) + 160));
    }
    if (!active) start(event);
    else if (event.priority > active.priority && active.interruptible) {
      const interrupted = active;
      clearTimer();
      active = null;
      if (interrupted.stream) inputs = { ...inputs, viseme: 0 };
      start(event);
      settle(interrupted, 'interrupted');
    } else {
      if (queue.length >= maxQueue) {
        const lowest = queue.reduce((chosen, item) => item.priority < chosen.priority ? item : chosen, queue[0]);
        if (lowest.priority < event.priority) {
          queue = queue.filter(item => item !== lowest);
          queue.push(event);
          settle(lowest, 'overflow');
        } else settle(event, 'overflow');
      } else queue.push(event);
      publish();
    }
    return id;
  }
  function updatePause(mutator) {
    const wasPaused = isPaused();
    const elapsedBefore = elapsed();
    mutator();
    if (active && wasPaused !== isPaused()) {
      active.elapsed = elapsedBefore;
      active.started = now();
      arm();
    }
    publish();
  }
  function cancelAll(reason = 'cancelled') {
    const pending = active ? [active, ...queue] : [...queue];
    clearTimer(); active = null; queue = [];
    inputs = { ...inputs, viseme: 0, isTalking: false, isThinking: false, isCoding: false };
    publish();
    for (const event of pending) settle(event, reason);
  }
  publish();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    say: dispatch,
    talk(stream, eventOptions = {}) { return dispatch('teach_talk', { ...eventOptions, stream }); },
    levelUp({ level, ...eventOptions } = {}) {
      const number = Number(level);
      return dispatch('levelUp', { ...eventOptions, payload: { level: Number.isFinite(number) ? Math.min(30, Math.max(1, Math.round(number))) : 1 } });
    },
    setInputs(values) {
      const nextInputs = { ...inputs };
      for (const key of numericInputs) if (values[key] !== undefined) nextInputs[key] = clampMascotInput(key, values[key]);
      for (const key of BOOLEAN_INPUTS) if (values[key] !== undefined) nextInputs[key] = !!values[key];
      if (values.combo !== undefined) comboStreak = nextInputs.combo;
      inputs = nextInputs; publish();
    },
    setBoolean(name, value) {
      if (!BOOLEAN_INPUTS.includes(name)) throw new TypeError(`Unknown mascot boolean: ${name}`);
      inputs = { ...inputs, [name]: !!value }; publish();
    },
    setReducedMotion(value) {
      if (reducedMotion === !!value) return;
      reducedMotion = !!value;
      if (reducedMotion) {
        if (active && !active.loop) { active.elapsed = 0; active.started = now(); active.duration = 120; active.stream = null; }
        queue = queue.map(event => ({ ...event, duration: 120, stream: null }));
        inputs = { ...inputs, viseme: 0 };
      }
      arm(); publish();
    },
    setVisible(value) { updatePause(() => { visible = !!value; }); },
    pause() { updatePause(() => { paused = true; }); },
    resume() { updatePause(() => { paused = false; }); },
    skip() { finish('skipped'); },
    complete(id) { if (active?.id === id) finish('completed'); },
    stop(id) {
      if (active?.id === id) { finish('cancelled'); return; }
      const event = queue.find(item => item.id === id);
      if (event) { queue = queue.filter(item => item !== event); publish(); settle(event, 'cancelled'); }
    },
    cancelAll,
    destroy() {
      if (disposed) return;
      disposed = true; cancelAll('disposed'); listeners.clear();
    },
  };
}
