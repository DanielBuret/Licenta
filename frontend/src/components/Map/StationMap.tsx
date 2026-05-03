import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import './leaflet-overrides.css';
import {
  buildClusterIcon,
  buildStationIcon,
  buildUserLocationIcon,
  statusFromStation,
  worstStatus,
} from './markerIcons';
import type { StationListItem } from '../../hooks/useStations';
import type { UserLocation } from '../../hooks/useUserLocation';

const ORADEA_CENTER: [number, number] = [47.0722, 21.9211];
const DEFAULT_ZOOM = 13;
const MAX_ZOOM = 19;
const CLUSTER_PIXEL_THRESHOLD = 30;
// Zoom-ul maxim la care se ajunge când se face click pe un cluster. Mărește/scade după preferință.
const CLUSTER_CLICK_MAX_ZOOM = 18;

interface Props {
  stations: StationListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDeselect: (id: number) => void;
  popupContent: (s: StationListItem) => ReactNode;
  userLocation?: UserLocation | null;
}

interface Cluster {
  id: string;
  stations: StationListItem[];
  center: [number, number];
  bounds: L.LatLngBounds;
}

function clusterStations(stations: StationListItem[], map: L.Map): Cluster[] {
  type Bucket = { stations: StationListItem[]; sumX: number; sumY: number };
  const buckets: Bucket[] = [];
  const threshold = CLUSTER_PIXEL_THRESHOLD * CLUSTER_PIXEL_THRESHOLD;
  for (const s of stations) {
    const p = map.latLngToContainerPoint([s.latitude, s.longitude]);
    let placed = false;
    for (const b of buckets) {
      const cx = b.sumX / b.stations.length;
      const cy = b.sumY / b.stations.length;
      const dx = p.x - cx;
      const dy = p.y - cy;
      if (dx * dx + dy * dy < threshold) {
        b.stations.push(s);
        b.sumX += p.x;
        b.sumY += p.y;
        placed = true;
        break;
      }
    }
    if (!placed) buckets.push({ stations: [s], sumX: p.x, sumY: p.y });
  }
  return buckets.map((b) => {
    const lat = b.stations.reduce((acc, s) => acc + s.latitude, 0) / b.stations.length;
    const lon = b.stations.reduce((acc, s) => acc + s.longitude, 0) / b.stations.length;
    const bounds = L.latLngBounds(
      b.stations.map((s) => [s.latitude, s.longitude] as [number, number]),
    );
    const id = b.stations
      .map((s) => s.id)
      .sort((a, z) => a - z)
      .join('-');
    return { id, stations: b.stations, center: [lat, lon], bounds };
  });
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
    const targetZoom = Math.max(map.getZoom(), 10);
    map.flyTo([s.latitude, s.longitude], targetZoom, { duration: 0.5 });
    const open = () => {
      window.setTimeout(() => {
        const marker = markerRefs.current.get(selectedId);
        if (marker) marker.openPopup();
      }, 50);
    };
    map.once('moveend', open);
    return () => {
      map.off('moveend', open);
    };
  }, [selectedId, stations, map, markerRefs]);
  return null;
}

function MarkersLayer({
  stations,
  selectedId,
  onSelect,
  onDeselect,
  popupContent,
  markerRefs,
}: {
  stations: StationListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDeselect: (id: number) => void;
  popupContent: (s: StationListItem) => ReactNode;
  markerRefs: React.MutableRefObject<Map<number, L.Marker>>;
}) {
  const map = useMap();
  const [clusters, setClusters] = useState<Cluster[]>([]);

  useEffect(() => {
    const recompute = () => setClusters(clusterStations(stations, map));
    recompute();
    map.on('zoomend', recompute);
    return () => {
      map.off('zoomend', recompute);
    };
  }, [stations, map]);

  return (
    <>
      {clusters.map((c) => {
        const [first] = c.stations;
        if (c.stations.length === 1 && first) {
          const s = first;
          return (
            <Marker
              key={`s-${s.id}`}
              position={[s.latitude, s.longitude]}
              icon={buildStationIcon(
                statusFromStation(s),
                s.activeReservations > 0 ? s.activeReservations : undefined,
                s.id === selectedId,
              )}
              eventHandlers={{
                click: () => onSelect(s.id),
                popupclose: () => onDeselect(s.id),
              }}
              ref={(instance) => {
                if (instance) markerRefs.current.set(s.id, instance);
                else markerRefs.current.delete(s.id);
              }}
            >
              <Popup>{popupContent(s)}</Popup>
            </Marker>
          );
        }
        return (
          <Marker
            key={`c-${c.id}`}
            position={c.center}
            icon={buildClusterIcon(worstStatus(c.stations), c.stations.length)}
            eventHandlers={{
              click: () => {
                const fitZoom = map.getBoundsZoom(c.bounds, false, L.point(60, 60));
                const targetZoom = Math.min(
                  Math.max(fitZoom, map.getZoom() + 1),
                  CLUSTER_CLICK_MAX_ZOOM,
                );
                map.flyTo(c.center, targetZoom, { animate: true, duration: 0.4 });
              },
            }}
          />
        );
      })}
    </>
  );
}

export function StationMap({
  stations,
  selectedId,
  onSelect,
  onDeselect,
  popupContent,
  userLocation,
}: Props) {
  const markerRefs = useRef<Map<number, L.Marker>>(new Map());

  return (
    <MapContainer center={ORADEA_CENTER} zoom={DEFAULT_ZOOM} maxZoom={MAX_ZOOM} scrollWheelZoom>
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
      <MarkersLayer
        stations={stations}
        selectedId={selectedId}
        onSelect={onSelect}
        onDeselect={onDeselect}
        popupContent={popupContent}
        markerRefs={markerRefs}
      />
    </MapContainer>
  );
}
