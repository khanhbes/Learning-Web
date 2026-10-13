import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMotionPreference } from "./motionPreference";
import {
  BookOpen,
  Code2,
  Flame,
  Gem,
  Zap,
  Trophy,
  Target,
  Gift,
  ShoppingBag,
  UserRound,
  Map,
  Star,
  Lock,
  Check,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Heart,
  GraduationCap,
  Layers,
  Network,
  Search,
  TreePine,
  Sprout,
  Puzzle,
  Brain,
  Link,
  Move,
  Crown,
  Rocket,
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  RefreshCw,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Settings,
  ShieldCheck,
  Download,
  Upload,
  Clock,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  Info,
  FileText,
  BookMarked,
} from "lucide-react";
export const icons: Record<string, typeof Star> = {
  book: BookOpen,
  code: Code2,
  flame: Flame,
  gem: Gem,
  zap: Zap,
  trophy: Trophy,
  target: Target,
  gift: Gift,
  shop: ShoppingBag,
  user: UserRound,
  map: Map,
  star: Star,
  lock: Lock,
  check: Check,
  next: ChevronRight,
  left: ArrowLeft,
  right: ArrowRight,
  sparkles: Sparkles,
  heart: Heart,
  graduate: GraduationCap,
  layers: Layers,
  network: Network,
  search: Search,
  tree: TreePine,
  sprout: Sprout,
  puzzle: Puzzle,
  brain: Brain,
  link: Link,
  move: Move,
  crown: Crown,
  rocket: Rocket,
  close: X,
  sound: Volume2,
  mute: VolumeX,
  play: Play,
  pause: Pause,
  reset: RotateCcw,
  previous: SkipBack,
  forward: SkipForward,
  refresh: RefreshCw,
  loading: LoaderCircle,
  success: CheckCircle2,
  error: AlertCircle,
  settings: Settings,
  shield: ShieldCheck,
  download: Download,
  upload: Upload,
  clock: Clock,
  chat: MessageCircle,
  up: ArrowUp,
  down: ArrowDown,
  info: Info,
  file: FileText,
  bookmark: BookMarked,
};
export function Icon({
  name,
  size = 24,
  className = "",
  ...props
}: {
  name: string;
  size?: number;
  className?: string;
  [key: string]: any;
}) {
  const C = icons[name] || Star;
  return (
    <C
      size={size}
      strokeWidth={2.5}
      className={className}
      aria-hidden="true"
      {...props}
    />
  );
}
export function Button({
  children,
  variant = "primary",
  className = "",
  busy = false,
  ...props
}: any) {
  const reduced = useMotionPreference();
  return (
    <motion.button
      {...props}
      disabled={props.disabled || busy}
      aria-busy={busy || undefined}
      className={`btn ${variant} ${busy ? 'bp-button-busy' : ''} ${className}`}
      whileTap={reduced || busy || props.disabled ? undefined : { scale: .97 }}
      transition={{ type: 'spring', stiffness: 550, damping: 28 }}
    >
      {busy && <span className="bp-button-dots" aria-hidden="true"><i /><i /><i /></span>}
      {children}
    </motion.button>
  );
}
export { default as Byte } from './Mascot';
export function ProgressBar({
  value,
  max = 100,
  color = "green",
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const reduced = useMotionPreference();
  const limit = Math.max(1, max), amount = Math.min(limit, Math.max(0, value));
  return (
    <div
      className={`progress-track ${color}`}
      role="progressbar"
      aria-valuenow={amount}
      aria-valuemin={0}
      aria-valuemax={limit}
    >
      <motion.div
        initial={false}
        animate={{
          width: `${amount / limit * 100}%`,
        }}
        transition={{ duration: reduced ? 0 : .55, ease: [0.2, .8, .25, 1] }}
      />
      <span />
    </div>
  );
}
export function Modal({ open, onClose, children, title, className = "" }: any) {
  const reduced = useMotionPreference();
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab") {
        const focusable = [
          ...(ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ) ?? []),
        ].filter((el) => el.offsetParent !== null);
        const first = focusable[0],
          last = focusable.at(-1);
        if (!first) {
          e.preventDefault();
          ref.current?.focus();
        } else if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
      previousFocus?.focus();
    };
  }, [open]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : .16 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title || "Thông báo"}
            className={`modal ${className}`}
            initial={reduced ? false : { y: 20, scale: .95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: 12, scale: .98, opacity: 0 }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 29 }}
          >
            {onClose && (
              <button
                className="icon-button modal-close"
                aria-label="Đóng"
                onClick={onClose}
              >
                <Icon name="close" />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export function Empty({ icon = "book", title, children }: any) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={36} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
