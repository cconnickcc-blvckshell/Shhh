import { theme } from '../theme';

interface GlassInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email';
  maxLength?: number;
  disabled?: boolean;
  label?: string;
  id?: string;
  style?: React.CSSProperties;
}

export function GlassInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  disabled,
  label,
  id,
  style,
}: GlassInputProps) {
  const inputId = id ?? (label ? `glass-input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return (
    <div style={{ marginBottom: theme.space[4] }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.xs,
            fontWeight: theme.fontWeight.semibold,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: theme.space[2],
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        style={{
          width: '100%',
          padding: `${theme.space[3]} ${theme.space[4]}`,
          borderRadius: theme.radius.md,
          border: theme.glass.border,
          background: 'rgba(255, 255, 255, 0.04)',
          color: theme.colors.text,
          fontSize: theme.fontSize.md,
          fontFamily: theme.font.body,
          outline: 'none',
          boxSizing: 'border-box',
          transition: `border ${theme.transition.fast}, box-shadow ${theme.transition.fast}`,
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.border = `1px solid ${theme.colors.primary}`;
          e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryMuted}`;
        }}
        onBlur={(e) => {
          e.target.style.border = theme.glass.border;
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}
