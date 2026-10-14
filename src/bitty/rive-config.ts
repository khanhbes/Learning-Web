import { TIMELINES } from '../../shared/mascot-motion.mjs';

/** One locally compiled, script-free Rive asset; runtime failures use SVG. */
export const BITTY_RIVE = {
  enabled: true,
  src: '/mascots/bitty/bitty.riv',
  artboard: 'Bitty',
  stateMachine: 'MascotSM',
  maxBytes: 200000,
  timelines: Object.keys(TIMELINES),
} as const;
