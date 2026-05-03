import L from 'leaflet';

type Status = 'free' | 'reserved' | 'charging';

const COLORS: Record<Status, string> = {
  free: '#16a34a',
  reserved: '#f59e0b',
  charging: '#dc2626',
};

const STATUS_PRIORITY: Record<Status, number> = { free: 0, reserved: 1, charging: 2 };

const SELECTED_OUTLINE = '#2563eb';

function svgPin(color: string, badge?: number, selected = false): string {
  const badgeMarkup =
    badge && badge > 0
      ? `<circle cx="29" cy="9" r="8" fill="white" stroke="${color}" stroke-width="2"/>
         <text x="29" y="13" text-anchor="middle" font-family="system-ui" font-size="11" font-weight="700" fill="${color}">${badge}</text>`
      : '';
  if (selected) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="-2 -2 40 52">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13 18 30 18 30s18-17 18-30C36 8.06 27.94 0 18 0z" fill="${color}" stroke="${SELECTED_OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="18" cy="18" r="7" fill="white"/>
        <path d="M16 14h2l-1 4h2l-3 6 1-5h-2z" fill="${color}"/>
        ${badgeMarkup}
      </svg>`;
  }
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13 18 30 18 30s18-17 18-30C36 8.06 27.94 0 18 0z" fill="${color}"/>
      <circle cx="18" cy="18" r="7" fill="white"/>
      <path d="M16 14h2l-1 4h2l-3 6 1-5h-2z" fill="${color}"/>
      ${badgeMarkup}
    </svg>`;
}

export function buildStationIcon(status: Status, badge?: number, selected = false): L.DivIcon {
  const size: [number, number] = selected ? [40, 52] : [36, 48];
  const anchor: [number, number] = selected ? [20, 50] : [18, 48];
  const popupAnchor: [number, number] = selected ? [0, -46] : [0, -44];
  return L.divIcon({
    html: svgPin(COLORS[status], badge, selected),
    className: selected ? 'station-marker station-marker--selected' : 'station-marker',
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor,
  });
}

export function statusFromStation(s: { hasCharging: boolean; hasReserved: boolean }): Status {
  if (s.hasCharging) return 'charging';
  if (s.hasReserved) return 'reserved';
  return 'free';
}

export function worstStatus(stations: { hasCharging: boolean; hasReserved: boolean }[]): Status {
  let worst: Status = 'free';
  for (const s of stations) {
    const st = statusFromStation(s);
    if (STATUS_PRIORITY[st] > STATUS_PRIORITY[worst]) worst = st;
  }
  return worst;
}

function svgClusterPin(color: string, count: number): string {
  const label = count > 99 ? '99+' : String(count);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" fill="${color}" fill-opacity="0.35"/>
      <circle cx="24" cy="24" r="16" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="24" y="29" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="700" fill="white">${label}</text>
    </svg>`;
}

export function buildClusterIcon(status: Status, count: number): L.DivIcon {
  return L.divIcon({
    html: svgClusterPin(COLORS[status], count),
    className: 'station-cluster',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -22],
  });
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
