'use client';

import { useRef, type ReactNode } from 'react';
import { motion, type TargetAndTransition } from 'motion/react';
import { useMotionPreference } from '../motionPreference';
import './page-transition.css';

export type PageTransitionVariant = 'mascot_wipe' | 'iris_circle' | 'jump_through' | 'slide_card' | 'curtain_pixel' | 'celebration_fade';
export type PageTransitionProps = {
  children: ReactNode;
  /** A pathname, activity id or confirmed result id; never a render counter. */
  transitionKey: string | number;
  variant?: PageTransitionVariant;
  direction?: 1 | -1;
  /** Normalized reveal origin, e.g. the mascot position in the scene. */
  origin?: { x: number; y: number };
  className?: string;
  mascot?: ReactNode;
  onTransitionComplete?: () => void;
};

const CUBIC_OUT: [number, number, number, number] = [.22, 1, .36, 1];
const CUBIC_IN_OUT: [number, number, number, number] = [.65, 0, .35, 1];
const DURATIONS: Record<PageTransitionVariant, number> = {
  mascot_wipe: .62, iris_circle: .55, jump_through: .64,
  slide_card: .42, curtain_pixel: .66, celebration_fade: .5,
};

function contentPose(variant: PageTransitionVariant, direction: 1 | -1, reduced: boolean, origin: { x: number; y: number }): { initial: TargetAndTransition; animate: TargetAndTransition } {
  if (reduced) return { initial: { opacity: .92 }, animate: { opacity: 1 } };
  const x = Number.isFinite(origin.x) ? Math.max(0, Math.min(1, origin.x)) * 100 : 50;
  const y = Number.isFinite(origin.y) ? Math.max(0, Math.min(1, origin.y)) * 100 : 35;
  switch (variant) {
    case 'iris_circle': return { initial: { opacity: .7, clipPath: `circle(0% at ${x}% ${y}%)` }, animate: { opacity: 1, clipPath: `circle(150% at ${x}% ${y}%)` } };
    case 'mascot_wipe': return { initial: { opacity: .65, clipPath: direction === 1 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' }, animate: { opacity: 1, clipPath: 'inset(0 0% 0 0%)' } };
    case 'jump_through': return { initial: { opacity: .45, y: 18, scale: .985 }, animate: { opacity: 1, y: 0, scale: 1 } };
    case 'slide_card': return { initial: { opacity: 0, x: direction * 30 }, animate: { opacity: 1, x: 0 } };
    case 'curtain_pixel': return { initial: { opacity: .65 }, animate: { opacity: 1 } };
    default: return { initial: { opacity: .2, y: 8 }, animate: { opacity: 1, y: 0 } };
  }
}

/**
 * Enter-only scenes intentionally avoid retaining an old route in the DOM.
 * A rapid navigation replaces the keyed scene and cancels its motion effects.
 * Decoration never captures a click, keyboard focus, or an accessibility node.
 */
export function PageTransition({ children, transitionKey, variant = 'slide_card', direction = 1, origin = { x: .5, y: .35 }, className = '', mascot, onTransitionComplete }: PageTransitionProps) {
  const reduced = useMotionPreference();
  const current = useRef(transitionKey);
  const completed = useRef<string | number | null>(null);
  const content = useRef<HTMLDivElement>(null);
  current.current = transitionKey;
  const duration = reduced ? .12 : DURATIONS[variant];
  const pose = contentPose(variant, direction, reduced, origin);
  const finish = () => {
    if (current.current !== transitionKey || completed.current === transitionKey) return;
    completed.current = transitionKey;
    // Remove temporary reveal clipping so tooltips, menus and focus outlines
    // outside the scene bounds remain visible after the entrance.
    content.current?.setAttribute('data-transition-settled', 'true');
    onTransitionComplete?.();
  };
  const character = mascot || <img src="/mascots/bitty/bitty-rig.svg" alt="" width="108" height="108" loading="lazy" />;

  return <div className={`bitty-page-transition ${className}`} data-transition={variant} data-direction={direction} data-motion-reduced={reduced ? 'true' : 'false'}>
    <motion.div ref={content} key={String(transitionKey)} className="bitty-transition-scene" initial={pose.initial} animate={pose.animate}
      transition={{ duration, ease: variant === 'mascot_wipe' ? CUBIC_IN_OUT : CUBIC_OUT }} onAnimationComplete={finish}>
      {children}
    </motion.div>
    {!reduced && variant === 'mascot_wipe' && <motion.div key={`wipe:${transitionKey}`} className="bitty-transition-decor bitty-transition-wipe" aria-hidden="true"
      initial={{ x: direction === 1 ? '-120%' : '120%', opacity: .95 }} animate={{ x: direction === 1 ? '120%' : '-120%', opacity: [0, .95, .95, 0] }}
      transition={{ duration, ease: CUBIC_IN_OUT, opacity: { times: [0, .12, .8, 1] } }}>
      <div className="bitty-wipe-sheet" /><span className="bitty-transition-character">{character}</span>
    </motion.div>}
    {!reduced && variant === 'jump_through' && <motion.div key={`jump-wash:${transitionKey}`} className="bitty-transition-decor bitty-transition-jump-wash" aria-hidden="true"
      initial={{ opacity: .18 }} animate={{ opacity: 0 }} transition={{ duration, ease: CUBIC_OUT }} />}
    {!reduced && variant === 'jump_through' && <motion.div key={`jump:${transitionKey}`} className="bitty-transition-decor bitty-transition-jump" aria-hidden="true"
      initial={{ opacity: 0, y: 80, scale: .7 }} animate={{ opacity: [0, 1, 1, 0], y: [80, -20, -80, -130], scale: [.7, 1.1, 1, .6] }}
      transition={{ duration, ease: CUBIC_OUT, times: [0, .35, .7, 1] }}>
      <span className="bitty-transition-character">{character}</span>
    </motion.div>}
    {!reduced && variant === 'curtain_pixel' && <div key={`pixels:${transitionKey}`} className="bitty-transition-decor bitty-transition-pixels" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => <motion.i key={index} initial={{ scaleY: 1, opacity: .92 }} animate={{ scaleY: 0, opacity: 0 }}
        transition={{ duration: .4, delay: .018 * (direction === 1 ? index : 11 - index), ease: CUBIC_OUT }} />)}
    </div>}
    {!reduced && variant === 'celebration_fade' && <motion.div key={`fade:${transitionKey}`} className="bitty-transition-decor bitty-transition-celebration" aria-hidden="true"
      initial={{ opacity: .28, scale: .98 }} animate={{ opacity: 0, scale: 1.02 }} transition={{ duration, ease: CUBIC_OUT }} />}
  </div>;
}

export default PageTransition;
