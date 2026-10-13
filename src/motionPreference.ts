import { useContext, useSyncExternalStore } from 'react';
import { AppContext } from './context';

const media = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const snapshot = () => media?.matches ?? false;
const serverSnapshot = () => false;
function subscribe(listener: () => void) {
  if (!media) return () => {};
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}

// The OS setting can change while an animation is playing. Subscribe directly
// so particles, counters, timers and mascot poses settle immediately.
export function useMotionPreference() {
  const context = useContext(AppContext);
  const system = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return system || !!context?.state.profile.settings?.reducedMotion;
}
