import { theme } from '../theme';

interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCards({ count = 12 }: SkeletonCardProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: theme.space[4],
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: theme.glass.bg,
            border: theme.glass.border,
            borderRadius: theme.radius.lg,
            padding: theme.space[5],
            minHeight: 100,
          }}
        >
          <div
            style={{
              height: 12,
              width: '60%',
              marginBottom: theme.space[3],
              borderRadius: 4,
              background: `linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 100%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              height: 28,
              width: '40%',
              borderRadius: 4,
              background: `linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 100%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
              animationDelay: '0.2s',
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div
      style={{
        background: theme.glass.bg,
        border: theme.glass.border,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
          gap: theme.space[4],
          padding: theme.space[4],
          borderBottom: theme.glass.border,
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: 10,
              width: '70%',
              borderRadius: 4,
              background: `linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 100%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div
          key={ri}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
            gap: theme.space[4],
            padding: theme.space[4],
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                height: 14,
                width: `${65 + (i + ri) * 5}%`,
                borderRadius: 4,
                background: `linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)`,
                backgroundSize: '200% 100%',
                animation: `shimmer 1.5s ease-in-out infinite`,
                animationDelay: `${ri * 0.1}s`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
