import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getToken } from '../api/client';
import { useEffect, useState } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setSidebarOpen(false);
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: theme.font.body,
    }}>
      <div className="layout-header-row" style={{
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <button
          type="button"
          className="layout-hamburger"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Open menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            marginRight: theme.space[2],
            background: 'none',
            border: 'none',
            color: theme.colors.textMuted,
            fontSize: '1.25rem',
            cursor: 'pointer',
          }}
        >
          ☰
        </button>
        <StatusBar />
      </div>
      <div
        className={`layout-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        role="presentation"
        aria-hidden="true"
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <nav
          role="navigation"
          aria-label="Admin navigation"
          className={`layout-sidebar ${sidebarOpen ? 'open' : ''}`}
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
                onClick={closeSidebar}
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
        <main className="layout-main" style={{
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
