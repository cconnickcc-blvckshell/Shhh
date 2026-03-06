import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { adminApi } from '../api/client';
import { AdminError } from '../components/AdminPageState';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme';

const CARTODB_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const CARTODB_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

type ViewMode = 'users' | 'heat' | 'both';

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const heatRef = useRef<L.Layer | null>(null);

  const [geo, setGeo] = useState<Array<{ userId: string; lat: number; lng: number; lastSeen: string; presenceState?: string }>>([]);
  const [cities, setCities] = useState<Array<{ lat: number; lng: number; activeCount: number; newThisWeek: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [selectedUser, setSelectedUser] = useState<{ userId: string; lastSeen: string } | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([adminApi.getPresenceGeo(), adminApi.getStatsCities()])
      .then(([geoRes, citiesRes]) => {
        setGeo(geoRes.data);
        setCities(citiesRes.data);
      })
      .catch(() => setError('Failed to load map data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Init map (runs when we have data or when viewMode changes)
  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersRef.current = null;
      heatRef.current = null;
    }

    const hasData = geo.length > 0 || cities.length > 0;
    const map = L.map(mapRef.current, {
      center: [40.7128, -74.006],
      zoom: hasData ? 4 : 2,
      zoomControl: false,
    });
    if (hasData) {
      const pts = geo.length > 0 ? geo.map((p) => [p.lat, p.lng] as [number, number]) : cities.map((c) => [c.lat, c.lng] as [number, number]);
      const bounds = L.latLngBounds(pts);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer(CARTODB_DARK, {
      attribution: CARTODB_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    const markers = L.layerGroup().addTo(map);
    markersRef.current = markers;

    // Neon marker icon
    const createIcon = () =>
      L.divIcon({
        className: 'map-user-marker',
        html: `<div style="
          width: 10px; height: 10px;
          background: ${theme.colors.primary};
          border: 2px solid ${theme.colors.primaryGlow};
          border-radius: 50%;
          box-shadow: 0 0 12px ${theme.colors.primaryGlow};
        "></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

    if (viewMode === 'users' || viewMode === 'both') {
      geo.forEach((p) => {
        const m = L.marker([p.lat, p.lng], { icon: createIcon() })
          .on('click', () => setSelectedUser({ userId: p.userId, lastSeen: p.lastSeen }))
          .addTo(markers);
        m.bindTooltip(p.userId.slice(0, 8), {
          permanent: false,
          direction: 'top',
          className: 'map-tooltip',
        });
      });
    }

    // Heat layer
    const heatData: [number, number, number][] = cities.map((c) => [c.lat, c.lng, c.activeCount]);
    const maxIntensity = cities.length > 0 ? Math.max(1, ...cities.map((c) => c.activeCount)) : 1;
    const heat = (L as any).heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: maxIntensity,
      gradient: {
        0.0: 'transparent',
        0.3: theme.colors.primary,
        0.6: theme.colors.accentPink,
        1.0: theme.colors.success,
      },
    });
    if ((viewMode === 'heat' || viewMode === 'both') && cities.length > 0) heat.addTo(map);
    heatRef.current = heat;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = null;
      heatRef.current = null;
    };
  }, [geo, cities, viewMode]);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space[4] }}>
        <div style={{ height: 32, width: 200, borderRadius: 8, background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
        <div style={{ flex: 1, minHeight: 400, borderRadius: theme.radius.lg, background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
      </div>
    );
  }

  return (
    <div role="main" aria-label="Command center map" className="page-map-container" style={{ display: 'flex', flexDirection: 'column', gap: theme.space[4], height: 'calc(100vh - 48px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: theme.space[3] }}>
        <h2 style={{
          fontFamily: theme.font.display,
          fontSize: theme.fontSize.xl,
          fontWeight: theme.fontWeight.bold,
          color: theme.colors.text,
          margin: 0,
        }}>
          Command Map
        </h2>
        <div style={{ display: 'flex', gap: theme.space[2], alignItems: 'center' }}>
          <span style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
            {geo.length} users · {cities.length} hotspots
          </span>
          <GlassButton variant={viewMode === 'users' ? 'primary' : 'secondary'} onClick={() => setViewMode('users')} style={{ padding: `${theme.space[1]} ${theme.space[2]}`, fontSize: theme.fontSize.xs }}>
            Dots
          </GlassButton>
          <GlassButton variant={viewMode === 'heat' ? 'primary' : 'secondary'} onClick={() => setViewMode('heat')} style={{ padding: `${theme.space[1]} ${theme.space[2]}`, fontSize: theme.fontSize.xs }}>
            Heat
          </GlassButton>
          <GlassButton variant={viewMode === 'both' ? 'primary' : 'secondary'} onClick={() => setViewMode('both')} style={{ padding: `${theme.space[1]} ${theme.space[2]}`, fontSize: theme.fontSize.xs }}>
            Both
          </GlassButton>
          <GlassButton variant="secondary" onClick={load} style={{ padding: `${theme.space[1]} ${theme.space[2]}`, fontSize: theme.fontSize.xs }}>
            Refresh
          </GlassButton>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 400, borderRadius: theme.radius.lg, overflow: 'hidden', border: theme.glass.border, background: theme.glass.bg }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 400 }} />
      </div>

      {selectedUser && (
        <GlassCard style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginBottom: theme.space[1] }}>Selected user</div>
              <div style={{ fontFamily: theme.font.mono, fontSize: theme.fontSize.sm, color: theme.colors.primary }}>{selectedUser.userId}</div>
              <div style={{ color: theme.colors.textDim, fontSize: theme.fontSize.xs, marginTop: theme.space[1] }}>
                Last seen: {new Date(selectedUser.lastSeen).toLocaleString()}
              </div>
            </div>
            <GlassButton variant="ghost" onClick={() => setSelectedUser(null)}>Clear</GlassButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
