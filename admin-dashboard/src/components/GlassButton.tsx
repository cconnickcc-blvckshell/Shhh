import { type ReactNode } from 'react';
import { theme } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface GlassButtonProps {
  children: ReactNode;
  variant?: Variant;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #7C3AED 100%)`,
    color: '#fff',
    border: 'none',
    boxShadow: `0 4px 16px ${theme.colors.primaryGlow}`,
  },
  secondary: {
    background: theme.glass.bg,
    color: theme.colors.text,
    border: theme.glass.border,
    backdropFilter: theme.glass.blur,
  },
  ghost: {
    background: 'transparent',
    color: theme.colors.textSecondary,
    border: '1px solid transparent',
  },
  danger: {
    background: theme.colors.danger,
    color: '#fff',
    border: 'none',
  },
  success: {
    background: theme.colors.success,
    color: '#fff',
    border: 'none',
  },
};

export function GlassButton({
  children,
  variant = 'primary',
  disabled,
  type = 'button',
  onClick,
  className,
  style,
}: GlassButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{
        fontFamily: theme.font.body,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        padding: `${theme.space[2]} ${theme.space[4]}`,
        borderRadius: theme.radius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: `opacity ${theme.transition.fast}, transform ${theme.transition.fast}`,
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'translateY(-1px)';
        if (variant === 'primary') {
          e.currentTarget.style.boxShadow = `0 6px 20px ${theme.colors.primaryGlow}`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        if (variant === 'primary') {
          e.currentTarget.style.boxShadow = `0 4px 16px ${theme.colors.primaryGlow}`;
        }
      }}
    >
      {children}
    </button>
  );
}
