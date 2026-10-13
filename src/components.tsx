import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={`btn ${variant} ${className}`}
    >
      {busy ? <Icon name="loading" className="spin" size={20} /> : null}
      {children}
    </button>
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
  return (
    <div
      className={`progress-track ${color}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <motion.div
        initial={false}
        animate={{
          width: `${Math.min(100, Math.max(0, (value / max) * 100))}%`,
        }}
        transition={{ duration: 0.5 }}
      />
      <span />
    </div>
  );
}
export function Modal({ open, onClose, children, title, className = "" }: any) {
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
            initial={{ y: 30, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
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
