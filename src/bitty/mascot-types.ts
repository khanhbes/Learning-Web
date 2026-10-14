export type {
  MascotTimeline, MascotTrigger, MascotState, MascotFinishReason, MascotCompletion,
  MascotBoolean, MascotNumber, MascotInputs, VisemeFrame, VisemeStream,
  MascotEventOptions, MascotSnapshot, MascotController, TimelineDefinition,
} from '../../shared/mascot-motion.mjs';

/** Inputs shared by the vector fallback and the optional Rive renderer. */
export interface BittyArtworkProps {
  state?: import('./mascot-types').MascotTimeline;
  size?: number;
  lookAt?: { x: number; y: number };
  viseme?: number;
  combo?: number;
  xp?: number;
  mood?: number;
  motionPaused?: boolean;
  reducedMotion?: boolean;
  eventId?: string | number;
  pointDirection?: 'left' | 'right';
  onComplete?: () => void;
  className?: string;
}
