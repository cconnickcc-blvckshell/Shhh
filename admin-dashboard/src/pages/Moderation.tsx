import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { AdminError } from '../components/AdminPageState';
import { SkeletonCards } from '../components/AdminSkeleton';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme';

interface Report {
  id: string;
  reporter_name: string;
  reported_name: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

interface ModItem {
  id: string;
  type: string;
  target_id: string;
  target_type: string;
  priority: number;
  status: string;
  target_user_name?: string;
  venue_name?: string;
  created_at: string;
}

type ColumnId = 'pending' | 'resolved' | 'dismissed' | 'queue';

export default function Moderation() {
  const [reports, setReports] = useState<Record<string, Report[]>>({ pending: [], resolved: [], dismissed: [] });
  const [queue, setQueue] = useState<ModItem[]>([]);
  const [resolvedQueue, setResolvedQueue] = useState<ModItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragged, setDragged] = useState<{ type: 'report'; id: string } | { type: 'mod'; id: string } | null>(null);
  const [dragOver, setDragOver] = useState<ColumnId | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      adminApi.getReports('pending'),
      adminApi.getReports('resolved'),
      adminApi.getReports('dismissed'),
      adminApi.getQueue(undefined, 'pending'),
      adminApi.getResolvedModeration(),
    ])
      .then(([p, r, d, q, resolved]) => {
        setReports({
          pending: (p as any).data || [],
          resolved: (r as any).data || [],
          dismissed: (d as any).data || [],
        });
        setQueue((q as any).data || []);
        setResolvedQueue((resolved as any).data || []);
      })
      .catch(() => setError('Failed to load moderation data.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const resolveReport = async (id: string, status: 'resolved' | 'dismissed') => {
    await adminApi.resolveReport(id, status);
    load();
  };

  const resolveMod = async (id: string, status: 'approved' | 'rejected') => {
    await adminApi.resolveModeration(id, status);
    load();
  };

  const handleDrop = (column: ColumnId) => {
    if (!dragged || !['resolved', 'dismissed'].includes(column)) return;
    if (dragged.type === 'report') {
      resolveReport(dragged.id, column as 'resolved' | 'dismissed');
    }
    setDragged(null);
    setDragOver(null);
  };

  if (error) return <AdminError message={error} onRetry={load} />;
  if (loading) return <SkeletonCards count={4} />;

  const columns: { id: ColumnId; label: string; accent?: string }[] = [
    { id: 'pending', label: 'Pending Reports', accent: theme.colors.danger },
    { id: 'resolved', label: 'Resolved', accent: theme.colors.success },
    { id: 'dismissed', label: 'Dismissed', accent: theme.colors.textMuted },
  ];

  return (
    <div role="main" aria-label="Moderation Kanban">
      <h2 style={{
        fontFamily: theme.font.display,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.space[5],
      }}>
        Moderation
      </h2>

      <div style={{ display: 'flex', gap: theme.space[4], overflowX: 'auto', paddingBottom: theme.space[2] }}>
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop(col.id)}
            style={{
              minWidth: 320,
              flex: '0 0 320px',
              background: dragOver === col.id ? theme.colors.primaryMuted : theme.glass.bg,
              border: dragOver === col.id ? `2px dashed ${theme.colors.primary}` : theme.glass.border,
              borderRadius: theme.radius.lg,
              padding: theme.space[4],
              transition: 'border 0.2s, background 0.2s',
            }}
          >
            <div style={{
              fontFamily: theme.font.display,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
              color: col.accent || theme.colors.text,
              marginBottom: theme.space[3],
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              {col.label}
              <span style={{ color: theme.colors.textMuted, fontWeight: 500 }}>
                {col.id === 'pending' ? reports.pending.length : col.id === 'resolved' ? reports.resolved.length : reports.dismissed.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space[2] }}>
              {(reports[col.id as keyof typeof reports] || []).map((r) => (
                <div
                  key={r.id}
                  draggable={col.id === 'pending'}
                  onDragStart={() => col.id === 'pending' && setDragged({ type: 'report', id: r.id })}
                  onDragEnd={() => setDragged(null)}
                  style={{ cursor: col.id === 'pending' ? 'grab' : 'default' }}
                >
                  <GlassCard style={{ padding: theme.space[3], marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.space[1] }}>
                      <span style={{ color: theme.colors.danger, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm }}>{r.reason}</span>
                      <span style={{ color: theme.colors.textDim, fontSize: 10 }}>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }}>
                      {r.reporter_name} → {r.reported_name}
                    </div>
                    {r.description && (
                      <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: theme.space[1] }}>{r.description.slice(0, 80)}...</div>
                    )}
                    {col.id === 'pending' && (
                      <div style={{ display: 'flex', gap: theme.space[2], marginTop: theme.space[2] }}>
                        <GlassButton variant="success" onClick={() => resolveReport(r.id, 'resolved')} style={{ padding: `${theme.space[1]} ${theme.space[2]}`, fontSize: 10 }}>Approve</GlassButton>
                        <GlassButton variant="secondary" onClick={() => resolveReport(r.id, 'dismissed')} style={{ padding: `${theme.space[1]} ${theme.space[2]}`, fontSize: 10 }}>Dismiss</GlassButton>
                      </div>
                    )}
                  </GlassCard>
                </div>
              ))}
              {((col.id === 'pending' ? reports.pending : col.id === 'resolved' ? reports.resolved : reports.dismissed) || []).length === 0 && (
                <div style={{ color: theme.colors.textDim, fontSize: theme.fontSize.sm, textAlign: 'center', padding: theme.space[4] }}>
                  {col.id === 'pending' ? 'Drag reports here' : 'Empty'}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Moderation Queue column */}
        <div style={{
          minWidth: 320,
          flex: '0 0 320px',
          background: theme.glass.bg,
          border: theme.glass.border,
          borderRadius: theme.radius.lg,
          padding: theme.space[4],
        }}>
          <div style={{
            fontFamily: theme.font.display,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.warning,
            marginBottom: theme.space[3],
          }}>
            Mod Queue ({queue.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space[2] }}>
            {queue.map((m) => (
              <GlassCard key={m.id} style={{ padding: theme.space[3], marginBottom: 0 }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{m.type} · {m.target_type}</div>
                <div style={{ fontFamily: theme.font.mono, fontSize: theme.fontSize.sm, color: theme.colors.text, marginTop: theme.space[1] }}>{m.venue_name || m.target_user_name || m.target_id?.slice(0, 8)}</div>
                <div style={{ display: 'flex', gap: theme.space[2], marginTop: theme.space[2] }}>
                  <GlassButton variant="success" onClick={() => resolveMod(m.id, 'approved')} style={{ padding: `${theme.space[1]} ${theme.space[2]}`, fontSize: 10 }}>Approve</GlassButton>
                  <GlassButton variant="danger" onClick={() => resolveMod(m.id, 'rejected')} style={{ padding: `${theme.space[1]} ${theme.space[2]}`, fontSize: 10 }}>Reject</GlassButton>
                </div>
              </GlassCard>
            ))}
            {queue.length === 0 && (
              <div style={{ color: theme.colors.textDim, fontSize: theme.fontSize.sm, textAlign: 'center', padding: theme.space[4] }}>Empty</div>
            )}
          </div>
        </div>

        {/* Resolved Moderation column */}
        <div style={{
          minWidth: 320,
          flex: '0 0 320px',
          background: theme.glass.bg,
          border: theme.glass.border,
          borderRadius: theme.radius.lg,
          padding: theme.space[4],
        }}>
          <div style={{
            fontFamily: theme.font.display,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.success,
            marginBottom: theme.space[3],
          }}>
            Resolved Mod ({resolvedQueue.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space[2] }}>
            {resolvedQueue.map((m) => (
              <GlassCard key={m.id} style={{ padding: theme.space[3], marginBottom: 0 }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{m.type} · {m.target_type}</div>
                <div style={{ fontFamily: theme.font.mono, fontSize: theme.fontSize.sm, color: theme.colors.text, marginTop: theme.space[1] }}>{m.venue_name || m.target_user_name || m.target_id?.slice(0, 8)}</div>
                <div style={{ fontSize: 10, marginTop: theme.space[1], color: m.status === 'approved' ? theme.colors.success : theme.colors.danger }}>{m.status}</div>
              </GlassCard>
            ))}
            {resolvedQueue.length === 0 && (
              <div style={{ color: theme.colors.textDim, fontSize: theme.fontSize.sm, textAlign: 'center', padding: theme.space[4] }}>Empty</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
