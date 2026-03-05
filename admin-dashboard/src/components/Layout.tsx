import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getToken } from '../api/client';
import { useEffect } from 'react';
import { theme } from '../theme';
import { StatusBar } from './StatusBar';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◆' },
  { path: '/users', label: 'Users', icon: '◇' },
  { path: '/revenue', label: 'Revenue', icon: '▣' },
  { path: '/venues', label: 'Venues', icon: '▤' },
  { path: '/ads', label: 'Ads', icon: '▥' },
  { path: '/events', label: 'Events', icon: '▦' },
  { path: '/reports', label: 'Reports', icon: '▧' },
  { path: '/moderation', label: 'Moderation', icon: '▢' },
  { path: '/safety', label: 'Safety', icon: '▨' },
  { path: '/audit', label: 'Audit Log', icon: '▩' },
  { path: '/settings', label: 'Settings', icon: '◎' },
  { path: '/map', label: 'Map', icon: '◉' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) navigate('/login');
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: theme.font.body,
    }}>
      <StatusBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Sidebar — glassmorphism */}
      <nav
        role="navigation"
        aria-label="Admin navigation"
        style={{
          width: 220,
          flexShrink: 0,
          background: theme.glass.bg,
          backdropFilter: theme.glass.blur,
          WebkitBackdropFilter: theme.glass.blur,
          borderRight: theme.glass.border,
          padding: `${theme.space[6]} ${theme.space[3]}`,
        }}
      >
        <div style={{ padding: `0 ${theme.space[3]}`, marginBottom: theme.space[8] }}>
          <div style={{
            fontFamily: theme.font.display,
            fontSize: theme.fontSize.xl,
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.primary,
            letterSpacing: '-0.5px',
          }}>
            Shhh
          </div>
          <div style={{
            color: theme.colors.textDim,
            fontSize: theme.fontSize.xs,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginTop: theme.space[1],
          }}>
            Command Center
          </div>
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.space[3],
                padding: `${theme.space[2]} ${theme.space[3]}`,
                marginBottom: theme.space[1],
                borderRadius: theme.radius.md,
                color: isActive ? theme.colors.primary : theme.colors.textMuted,
                textDecoration: 'none',
                fontSize: theme.fontSize.sm,
                fontWeight: isActive ? theme.fontWeight.semibold : theme.fontWeight.normal,
                background: isActive ? theme.colors.primaryMuted : 'transparent',
                borderLeft: isActive ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                transition: `color ${theme.transition.fast}, background ${theme.transition.fast}`,
              }}
            >
              <span style={{ fontSize: theme.fontSize.base, opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      {/* Main content */}
      <main style={{
        flex: 1,
        padding: theme.space[6],
        overflowY: 'auto',
      }}>
        <Outlet />
      </main>
      </div>
    </div>
  );
}
