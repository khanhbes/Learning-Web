'use client';

import { useEffect, type ReactNode } from 'react';
import { Modal } from '../components';
import { useMascot } from './MascotProvider';
import Mascot from './Mascot';

type OverlayActions = {
  onClose?: () => void;
  onContinue?: () => void;
  onSkip?: () => void;
};

export type LevelUpOverlayProps = OverlayActions & {
  open: boolean;
  /** This value and eventId come from a confirmed backend reward report. */
  level: number;
  eventId?: string | number;
  title?: string;
  variant?: 'level' | 'badge';
  className?: string;
  children?: ReactNode;
};

/** UI envelope only: it never awards a reward or marks a backend event seen. */
export function LevelUpOverlay({ open, level, eventId, title = 'Bạn đã lên cấp', variant = 'level', className = '', children, onClose, onContinue, onSkip }: LevelUpOverlayProps) {
  const { levelUp, say, stop } = useMascot();
  const playbackId = eventId == null ? null : `${variant}:${eventId}`;
  useEffect(() => {
    if (!open || !playbackId) return;
    if (variant === 'level') {
      if (!Number.isFinite(level) || level < 1) return;
      levelUp({ level, id: playbackId });
    } else say('badge', { id: playbackId });
    return () => stop(playbackId);
  }, [open, level, playbackId, variant, levelUp, say, stop]);

  return <Modal open={open} onClose={onClose} title={title} className={`level-event-modal reward-event-dialog ${className}`}>
    {children ?? <div className="bitty-overlay-content">
      <Mascot state={variant === 'level' ? 'level_up' : 'badge_unlock'} size={190} />
      <h2>{title}</h2><p>{variant === 'level' ? `Cấp ${level}` : 'Một món quà cho nỗ lực của bạn.'}</p>
    </div>}
    {(onContinue || onSkip) && <div className="reward-dialog-actions">
      {onContinue && <button type="button" className="btn primary" onClick={onContinue}>Tiếp tục</button>}
      {onSkip && <button type="button" className="text-link" onClick={() => { if (playbackId) stop(playbackId); onSkip(); }}>Bỏ qua hiệu ứng</button>}
    </div>}
  </Modal>;
}

export type LessonCompleteModalProps = OverlayActions & {
  open: boolean;
  title: string;
  eventId?: string | number;
  result: { passed: boolean; knowledge: number };
  className?: string;
  children?: ReactNode;
};

/** The owner keeps its existing result controls, draft handling and API calls. */
export function LessonCompleteModal({ open, title, eventId, result, className = '', children, onClose, onContinue, onSkip }: LessonCompleteModalProps) {
  const { say, stop } = useMascot();
  const animation = result.passed ? result.knowledge === 100 ? 'perfect' : 'complete' : 'cheer';
  const playbackId = eventId == null ? null : `lesson:${eventId}:${animation}`;
  useEffect(() => {
    if (!open || !playbackId) return;
    say(animation, { id: playbackId });
    return () => stop(playbackId);
  }, [open, animation, playbackId, say, stop]);

  return <Modal open={open} onClose={onClose} title={title} className={className}>
    {children ?? <div className="bitty-overlay-content">
      <Mascot state={animation === 'perfect' ? 'perfect_score' : animation === 'complete' ? 'lesson_complete' : 'cheer_encourage'} size={190} />
      <h2>{title}</h2><p>{result.passed ? 'Một bước tiến mới đã được ghi nhận.' : 'Xem phản hồi và thử lại theo tốc độ của bạn.'}</p>
    </div>}
    {(onContinue || onSkip) && <div className="reward-dialog-actions">
      {onContinue && <button type="button" className="btn primary" onClick={onContinue}>Tiếp tục</button>}
      {onSkip && <button type="button" className="text-link" onClick={() => { if (playbackId) stop(playbackId); onSkip(); }}>Bỏ qua hiệu ứng</button>}
    </div>}
  </Modal>;
}
