import { theme } from '../theme';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

const variantMap: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: theme.colors.successMuted, color: theme.colors.success },
  warning: { bg: theme.colors.warningMuted, color: theme.colors.warning },
  danger: { bg: theme.colors.dangerMuted, color: theme.colors.danger },
  info: { bg: theme.colors.infoMuted, color: theme.colors.info },
  neutral: { bg: 'rgba(255,255,255,0.06)', color: theme.colors.textMuted },
  primary: { bg: theme.colors.primaryMuted, color: theme.colors.primary },
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = 'neutral', style }: BadgeProps) {
  const { bg, color } = variantMap[variant];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: `${theme.space[1]} ${theme.space[2]}`,
        borderRadius: theme.radius.full,
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.semibold,
        background: bg,
        color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
