import type { ReactNode } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import type L from 'leaflet';
import './leaflet-overrides.css';
import { buildStationIcon, buildUserLocationIcon, statusFromStation } from './markerIcons';
import type { StationListItem } from '../../hooks/useStations';
import type { UserLocation } from '../../hooks/useUserLocation';

const ORADEA_CENTER: [number, number] = [47.0722, 21.9211];
const DEFAULT_ZOOM = 13;

interface Props {
  stations: StationListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  popupContent: (s: StationListItem) => ReactNode;
  userLocation?: UserLocation | null;
}

function FlyToSelected({
  stations,
  selectedId,
  markerRefs,
}: {
  stations: StationListItem[];
  selectedId: number | null;
  markerRefs: React.MutableRefObject<Map<number, L.Marker>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (selectedId == null) return;
    const s = stations.find((x) => x.id === selectedId);
    if (!s) return;
    map.flyTo([s.latitude, s.longitude], Math.max(map.getZoom(), 15), { duration: 0.5 });
    const marker = markerRefs.current.get(selectedId);
    if (marker) {
      const open = () => marker.openPopup();
      const t = window.setTimeout(open, 550);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [selectedId, stations, map, markerRefs]);
  return null;
}

export function StationMap({ stations, selectedId, onSelect, popupContent, userLocation }: Props) {
  const markerRefs = useRef<Map<number, L.Marker>>(new Map());

  return (
    <MapContainer center={ORADEA_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected stations={stations} selectedId={selectedId} markerRefs={markerRefs} />
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lon]}
          icon={buildUserLocationIcon()}
          interactive={false}
          keyboard={false}
        />
      )}
      {stations.map((s) => (
        <Marker
          key={s.id}
          position={[s.latitude, s.longitude]}
          icon={buildStationIcon(
            statusFromStation(s),
            s.activeReservations > 0 ? s.activeReservations : undefined,
          )}
          eventHandlers={{ click: () => onSelect(s.id) }}
          ref={(instance) => {
            if (instance) markerRefs.current.set(s.id, instance);
            else markerRefs.current.delete(s.id);
          }}
        >
          <Popup>{popupContent(s)}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
