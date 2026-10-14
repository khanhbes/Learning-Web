export type MascotTimeline =
  | 'idle_breathe' | 'idle_blink' | 'idle_look' | 'idle_bored' | 'idle_sleep'
  | 'wave_hello' | 'teach_talk' | 'teach_point' | 'teach_think' | 'teach_idea' | 'teach_code'
  | 'answer_correct' | 'answer_correct_combo' | 'answer_wrong' | 'answer_almost' | 'timer_hurry'
  | 'lesson_complete' | 'perfect_score' | 'streak_up' | 'streak_lost' | 'level_up' | 'badge_unlock' | 'xp_gain'
  | 'cheer_encourage' | 'loading' | 'error_404' | 'offline';
export type MascotTrigger = 'wave' | 'correct' | 'wrong' | 'almost' | 'complete' | 'perfect' | 'levelUp'
  | 'streakUp' | 'streakLost' | 'badge' | 'hint' | 'hurry' | 'cheer' | 'loading';
export type MascotState = MascotTimeline | MascotTrigger;
export type MascotFinishReason = 'completed' | 'skipped' | 'interrupted' | 'cancelled' | 'coalesced' | 'overflow' | 'disposed';
export interface MascotCompletion { id: string; state: MascotTimeline; reason: MascotFinishReason }
export type MascotBoolean = 'isTalking' | 'isThinking' | 'isSleeping' | 'isCoding';
export type MascotNumber = 'viseme' | 'combo' | 'lookX' | 'lookY' | 'xp' | 'mood';
export interface MascotInputs {
  viseme: number; combo: number; lookX: number; lookY: number; xp: number; mood: number;
  isTalking: boolean; isThinking: boolean; isSleeping: boolean; isCoding: boolean;
}
export interface VisemeFrame { at: number; viseme: number }
export type VisemeStream = readonly (number | VisemeFrame)[];
export interface MascotEventOptions {
  id?: string; onComplete?: (result: MascotCompletion) => void;
  combo?: number; xp?: number; mood?: number; viseme?: number; lookX?: number; lookY?: number;
  payload?: unknown;
}
export interface TimelineDefinition {
  duration: number; loop: boolean; priority: number; interruptible: boolean; blend: number; fps: number;
}
export interface MascotSnapshot {
  state: MascotTimeline;
  active: Readonly<{ id: string; state: MascotTimeline; duration: number; priority: number; loop: boolean; payload?: unknown }> | null;
  queueLength: number; inputs: Readonly<MascotInputs>; motionPaused: boolean; reducedMotion: boolean; revision: number;
}
export interface MascotController {
  getSnapshot(): MascotSnapshot;
  subscribe(listener: () => void): () => void;
  say(state: MascotState, options?: MascotEventOptions): string;
  talk(stream: VisemeStream, options?: MascotEventOptions): string;
  levelUp(options: MascotEventOptions & { level: number }): string;
  setInputs(inputs: Partial<MascotInputs>): void;
  setBoolean(name: MascotBoolean, value: boolean): void;
  setReducedMotion(value: boolean): void;
  setVisible(value: boolean): void;
  pause(): void; resume(): void; skip(): void; complete(id: string): void; stop(id: string): void;
  cancelAll(reason?: MascotFinishReason): void; destroy(): void;
}
export const TIMELINES: Readonly<Record<MascotTimeline, TimelineDefinition>>;
export const TRIGGER_TIMELINES: Readonly<Record<MascotTrigger, MascotTimeline>>;
export const INPUT_RANGES: Readonly<Record<MascotNumber, readonly [number, number]>>;
export const BOOLEAN_INPUTS: readonly MascotBoolean[];
export function clampMascotInput(name: MascotNumber, value: unknown): number;
export function normalizeVisemeStream(stream: VisemeStream): VisemeFrame[];
export function createMascotController(options?: {
  now?: () => number; setTimeout?: typeof globalThis.setTimeout; clearTimeout?: typeof globalThis.clearTimeout;
  maxQueue?: number; reducedMotion?: boolean; onError?: (error: unknown) => void;
}): MascotController;
