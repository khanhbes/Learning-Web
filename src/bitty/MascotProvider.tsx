import {
  createContext, useContext, useEffect, useMemo, useRef, useState,
  useSyncExternalStore, type ReactNode,
} from 'react';
import { createMascotController } from '../../shared/mascot-motion.mjs';
import { useMotionPreference } from '../motionPreference';
import type { MascotController, MascotSnapshot } from './mascot-types';

const MascotContext = createContext<MascotController | null>(null);

// Delay final disposal by one microtask: React Strict Mode rehearses effect
// cleanup/setup without disposing the mounted component's controller.
function useOwnedController(enabled = true) {
  const reducedMotion = useMotionPreference();
  const [initial] = useState(() => enabled ? createMascotController({ reducedMotion }) : null);
  const local = useRef(initial);
  if (enabled && !local.current) local.current = createMascotController({ reducedMotion });
  const controller = enabled ? local.current : null;
  const lifecycle = useRef(0);
  useEffect(() => {
    if (!controller) return;
    lifecycle.current += 1;
    const visibility = () => controller.setVisible(document.visibilityState !== 'hidden');
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      const generation = ++lifecycle.current;
      queueMicrotask(() => { if (generation === lifecycle.current) controller.destroy(); });
    };
  }, [controller]);
  useEffect(() => { controller?.setReducedMotion(reducedMotion); }, [controller, reducedMotion]);
  return controller;
}

export interface MascotProviderProps {
  children: ReactNode;
  /** Pass the current route to settle queued UI callbacks on navigation. */
  transitionKey?: string;
  /** Ambient idle acting can be disabled in a focused editor or exam. */
  ambient?: boolean;
}

export function MascotProvider({ children, transitionKey, ambient = true }: MascotProviderProps) {
  const controller = useOwnedController()!;
  const route = useRef(transitionKey);
  useEffect(() => {
    if (route.current !== transitionKey) {
      controller.cancelAll('cancelled');
      route.current = transitionKey;
    }
  }, [controller, transitionKey]);

  useEffect(() => {
    if (!ambient) return;
    let bored: ReturnType<typeof setTimeout> | null = null;
    let sleep: ReturnType<typeof setTimeout> | null = null;
    let autoSleeping = false;
    let activitySerial = 0;
    let pointerFrame = 0;
    let pointer: { x: number; y: number } | null = null;
    const clear = () => {
      if (bored !== null) clearTimeout(bored);
      if (sleep !== null) clearTimeout(sleep);
      bored = null; sleep = null;
    };
    const hasDialog = () => !!document.querySelector('[role="dialog"]');
    const followPointer = () => {
      pointerFrame = 0;
      const point = pointer;
      pointer = null;
      const snapshot = controller.getSnapshot();
      if (!point || document.visibilityState === 'hidden' || snapshot.reducedMotion || snapshot.motionPaused || hasDialog()
        || !['idle_breathe', 'idle_look'].includes(snapshot.state)) return;
      controller.setInputs({ lookX: point.x, lookY: point.y });
    };
    const activity = (event?: Event) => {
      clear();
      if (autoSleeping) { controller.setBoolean('isSleeping', false); autoSleeping = false; }
      const current = controller.getSnapshot().active;
      if (current?.state === 'idle_bored') controller.stop(current.id);
      if (document.visibilityState === 'hidden') return;
      // Share the ambient listener; pointer tracking never attaches one listener per mascot.
      if (event?.type === 'pointermove' && 'pointerType' in event && event.pointerType === 'mouse') {
        const mouse = event as PointerEvent;
        pointer = { x: 2 * mouse.clientX / Math.max(1, window.innerWidth) - 1,
          y: 2 * mouse.clientY / Math.max(1, window.innerHeight) - 1 };
        if (!pointerFrame) pointerFrame = requestAnimationFrame(followPointer);
      }
      bored = setTimeout(() => {
        const snapshot = controller.getSnapshot();
        if (!snapshot.active && snapshot.state === 'idle_breathe' && !snapshot.motionPaused && !hasDialog())
          controller.say('idle_bored', { id: `ambient-bored-${++activitySerial}` });
      }, 10000);
      sleep = setTimeout(() => {
        const snapshot = controller.getSnapshot();
        if (!snapshot.active && snapshot.state === 'idle_breathe' && !snapshot.motionPaused && !hasDialog()) {
          autoSleeping = true;
          controller.setBoolean('isSleeping', true);
        }
      }, 60000);
    };
    const events = ['pointerdown', 'pointermove', 'keydown', 'focus'] as const;
    for (const event of events) window.addEventListener(event, activity, { passive: true });
    document.addEventListener('visibilitychange', activity);
    activity();
    return () => {
      clear();
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      for (const event of events) window.removeEventListener(event, activity);
      document.removeEventListener('visibilitychange', activity);
      if (autoSleeping) controller.setBoolean('isSleeping', false);
    };
  }, [controller, ambient]);

  return <MascotContext.Provider value={controller}>{children}</MascotContext.Provider>;
}

export interface MascotAPI extends MascotController, MascotSnapshot {
  lookAt(point: { x: number; y: number }): void;
  /** Snapshot alias is convenient when adapting state-machine renderers. */
  snapshot: MascotSnapshot;
}

/** Works inside the application provider and in isolated previews without AppContext. */
export function useMascot(): MascotAPI {
  const context = useContext(MascotContext);
  const local = useOwnedController(!context);
  const controller = (context ?? local)!;
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  return useMemo(() => ({ ...controller, ...snapshot, snapshot,
    lookAt: ({ x, y }: { x: number; y: number }) => controller.setInputs({ lookX: x, lookY: y }),
  }), [controller, snapshot]);
}
