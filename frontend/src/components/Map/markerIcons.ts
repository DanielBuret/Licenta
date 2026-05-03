import L from 'leaflet';

type Status = 'free' | 'reserved' | 'charging';

const COLORS: Record<Status, string> = {
  free: '#16a34a',
  reserved: '#f59e0b',
  charging: '#dc2626',
};

function svgPin(color: string, badge?: number): string {
  const badgeMarkup =
    badge && badge > 0
      ? `<circle cx="29" cy="9" r="8" fill="white" stroke="${color}" stroke-width="2"/>
         <text x="29" y="13" text-anchor="middle" font-family="system-ui" font-size="11" font-weight="700" fill="${color}">${badge}</text>`
      : '';
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13 18 30 18 30s18-17 18-30C36 8.06 27.94 0 18 0z" fill="${color}"/>
      <circle cx="18" cy="18" r="7" fill="white"/>
      <path d="M16 14h2l-1 4h2l-3 6 1-5h-2z" fill="${color}"/>
      ${badgeMarkup}
    </svg>`;
}

export function buildStationIcon(status: Status, badge?: number): L.DivIcon {
  return L.divIcon({
    html: svgPin(COLORS[status], badge),
    className: 'station-marker',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -44],
  });
}

export function statusFromStation(s: { hasCharging: boolean; hasReserved: boolean }): Status {
  if (s.hasCharging) return 'charging';
  if (s.hasReserved) return 'reserved';
  return 'free';
}

const USER_DOT_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="rgba(37, 99, 235, 0.18)"/>
    <circle cx="12" cy="12" r="6" fill="#2563eb" stroke="white" stroke-width="3"/>
  </svg>`;

export function buildUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    html: USER_DOT_SVG,
    className: 'user-location-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}
