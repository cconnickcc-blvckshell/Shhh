import { type ReactNode } from 'react';
import { theme } from '../theme';

interface GlassCardProps {
  children: ReactNode;
  /** Optional accent bar (left border) — use semantic color */
  accent?: string;
  /** Optional glow on hover */
  hover?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassCard({ children, accent, hover = false, className, style }: GlassCardProps) {
  return (
    <div
      className={className}
      style={{
        background: theme.glass.bg,
        backdropFilter: theme.glass.blur,
        WebkitBackdropFilter: theme.glass.blur,
        border: theme.glass.border,
        borderRadius: theme.radius.lg,
        boxShadow: theme.glass.shadow,
        padding: theme.space[5],
        transition: `border ${theme.transition.base}, box-shadow ${theme.transition.base}`,
        ...(accent && { borderLeft: `3px solid ${accent}` }),
        ...(hover && {
          cursor: 'default',
        }),
        ...style,
      }}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.border = theme.glass.borderHover;
        e.currentTarget.style.boxShadow = theme.glass.shadowHover;
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.border = theme.glass.border;
        if (accent) e.currentTarget.style.borderLeft = `3px solid ${accent}`;
        e.currentTarget.style.boxShadow = theme.glass.shadow;
      } : undefined}
    >
      {children}
    </div>
  );
}
