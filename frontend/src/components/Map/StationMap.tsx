import type { ReactNode } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import './leaflet-overrides.css';
import { buildStationIcon, statusFromStation } from './markerIcons';
import type { StationListItem } from '../../hooks/useStations';

const ORADEA_CENTER: [number, number] = [47.0722, 21.9211];
const DEFAULT_ZOOM = 13;

interface Props {
  stations: StationListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  popupContent: (s: StationListItem) => ReactNode;
}

function FlyToSelected({
  stations,
  selectedId,
}: {
  stations: StationListItem[];
  selectedId: number | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (selectedId == null) return;
    const s = stations.find((x) => x.id === selectedId);
    if (!s) return;
    map.flyTo([s.latitude, s.longitude], Math.max(map.getZoom(), 15), { duration: 0.5 });
  }, [selectedId, stations, map]);
  return null;
}

export function StationMap({ stations, selectedId, onSelect, popupContent }: Props) {
  return (
    <MapContainer center={ORADEA_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected stations={stations} selectedId={selectedId} />
      {stations.map((s) => (
        <Marker
          key={s.id}
          position={[s.latitude, s.longitude]}
          icon={buildStationIcon(
            statusFromStation(s),
            s.activeReservations > 0 ? s.activeReservations : undefined,
          )}
          eventHandlers={{ click: () => onSelect(s.id) }}
        >
          <Popup>{popupContent(s)}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
