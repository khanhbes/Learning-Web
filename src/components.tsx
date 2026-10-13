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
export function Byte({
  size = 160,
  mood = "happy",
  skin = "original",
  className = "",
}: {
  size?: number;
  mood?: string;
  skin?: string;
  className?: string;
}) {
  const colors: Record<string, string[]> = {
    original: ["#58cc02", "#46a302"],
    ocean: ["#1cb0f6", "#138cca"],
    sunset: ["#ff9600", "#e67e00"],
    cosmic: ["#a560e8", "#8348c5"],
  };
  const [color, dark] = colors[skin] || colors.original;
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={`byte byte-${mood} ${className}`}
      style={{ width: size, height: size }}
      animate={
        reduced ? {} : { y: mood === "celebrate" ? [0, -12, 0] : [0, -4, 0] }
      }
      transition={{
        duration: mood === "celebrate" ? 0.7 : 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg
        viewBox="0 0 180 180"
        role="img"
        aria-label={`Robot Byte ${mood === "celebrate" ? "đang ăn mừng" : mood === "thinking" ? "đang suy nghĩ" : "đồng hành cùng bạn"}`}
      >
        <ellipse cx="90" cy="169" rx="45" ry="8" fill="#d5ebc9" opacity=".6" />
        <path
          d="M62 144v16q0 7 10 7h9v-23M99 144v23h11q9 0 9-8v-15"
          fill={dark}
        />
        <rect x="52" y="104" width="77" height="48" rx="22" fill={color} />
        <path d="M64 114h52v25H64z" fill={dark} opacity=".35" />
        <path
          d="m86 119-9 7 9 7m11-14 9 7-9 7"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <motion.path
          d={
            mood === "celebrate"
              ? "M49 116Q20 100 23 80M132 116q25-19 25-36"
              : mood === "wave"
                ? "M52 117Q31 128 33 145M128 117q25-23 20-46"
                : mood === "explaining"
                  ? "M52 117Q31 128 33 145M128 117q26-4 25-28"
                  : mood === "encouraging"
                    ? "M52 117Q35 104 29 109M128 117q20-12 27-7"
                    : "M52 117Q31 128 33 145M128 117q24 8 21 27"
          }
          animate={
            mood === "wave" && !reduced ? { rotate: [0, -6, 0] } : { rotate: 0 }
          }
          style={{ transformOrigin: "90px 117px" }}
          transition={{
            duration: 1.1,
            repeat: mood === "wave" && !reduced ? Infinity : 0,
          }}
          stroke={dark}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M87 31V18" stroke={dark} strokeWidth="7" />
        <circle cx="87" cy="14" r="8" fill="#ffc800" />
        <rect x="24" y="57" width="15" height="34" rx="7" fill={dark} />
        <rect x="140" y="57" width="15" height="34" rx="7" fill={dark} />
        <rect x="33" y="31" width="114" height="80" rx="29" fill={color} />
        <path
          d="M54 40h47"
          stroke="white"
          strokeOpacity=".25"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <rect x="44" y="51" width="92" height="48" rx="18" fill="#163f2b" />
        <path
          d="M54 57h52"
          stroke="#fff"
          strokeWidth="3"
          strokeOpacity=".12"
          strokeLinecap="round"
        />
        {mood === "sleep" ? (
          <path
            d="M60 73h14m32 0h14"
            stroke="#bcf899"
            strokeWidth="5"
            strokeLinecap="round"
          />
        ) : mood === "celebrate" ? (
          <path
            d="M60 77q6-11 12 0m32 0q6-11 12 0"
            stroke="#bcf899"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <>
            <rect
              x={mood === "thinking" ? 64 : 61}
              y="65"
              width="12"
              height="17"
              rx="6"
              fill="#bcf899"
            />
            <rect
              x={mood === "thinking" ? 108 : 104}
              y="65"
              width="12"
              height="17"
              rx="6"
              fill="#bcf899"
            />
            <circle cx="66" cy="69" r="2" fill="white" />
            <circle cx="109" cy="69" r="2" fill="white" />
          </>
        )}
        <path
          d={mood === "sad" ? "M83 89q7-6 14 0" : "M83 86q7 7 14 0"}
          fill="none"
          stroke="#bcf899"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <ellipse cx="55" cy="85" rx="5" ry="2.5" fill="#ffb0a3" opacity=".7" />
        <ellipse cx="125" cy="85" rx="5" ry="2.5" fill="#ffb0a3" opacity=".7" />
      </svg>
    </motion.div>
  );
}
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
export function Modal({ open, onClose, children, title }: any) {
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
            className="modal"
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
