import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
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
import { useFavorites } from '../../hooks/useFavorites';

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
  /**
   * When false, the map's container is `display: none` (or otherwise hidden).
   * Used to force Leaflet to recompute its size when it becomes visible —
   * otherwise flyTo/openPopup operate on stale dimensions.
   */
  active?: boolean;
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
  active,
}: {
  stations: StationListItem[];
  selectedId: number | null;
  markerRefs: React.MutableRefObject<Map<number, L.Marker>>;
  active: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!active) return;
    if (selectedId == null) return;
    const s = stations.find((x) => x.id === selectedId);
    if (!s) return;
    // If the map was just revealed (mobile list → map switch), Leaflet's
    // cached dimensions may still be stale. Refresh before flying so the
    // target lands centered and the popup anchors correctly.
    map.invalidateSize({ animate: false });
    const targetZoom = Math.max(map.getZoom(), 17);
    map.flyTo([s.latitude, s.longitude], targetZoom, { duration: 0.5 });

    let cancelled = false;
    let attempts = 0;
    let escalated = false;
    let pollId: number | null = null;

    const tryOpen = (): boolean => {
      const marker = markerRefs.current.get(selectedId);
      if (marker) {
        marker.openPopup();
        return true;
      }
      return false;
    };

    const startPolling = () => {
      const tick = () => {
        if (cancelled) return;
        attempts += 1;
        if (tryOpen()) return;
        // After ~600ms, if the station is still in a cluster, push the zoom
        // one notch closer to break it apart. Fires once.
        if (attempts === 8 && !escalated) {
          escalated = true;
          const next = Math.min(MAX_ZOOM, map.getZoom() + 1);
          if (next > map.getZoom()) {
            map.flyTo([s.latitude, s.longitude], next, { duration: 0.4 });
          }
        }
        if (attempts < 20) {
          pollId = window.setTimeout(tick, 80);
        }
      };
      tick();
    };

    map.once('moveend', startPolling);
    return () => {
      cancelled = true;
      map.off('moveend', startPolling);
      if (pollId != null) window.clearTimeout(pollId);
    };
  }, [selectedId, stations, map, markerRefs, active]);
  return null;
}

/**
 * Calls map.invalidateSize whenever the map becomes visible, so clustering
 * (which relies on container pixel coordinates) and flyTo work correctly
 * after a display:none → display:block transition.
 */
function VisibilitySync({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!active) return;
    // Two rAFs: let layout settle (mobile media-query toggle) then invalidate.
    const r1 = window.requestAnimationFrame(() => {
      const r2 = window.requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
      });
      // store inner id on outer closure for cleanup
      (window as unknown as { __stationMapVizR2?: number }).__stationMapVizR2 = r2;
    });
    return () => {
      window.cancelAnimationFrame(r1);
      const r2 = (window as unknown as { __stationMapVizR2?: number }).__stationMapVizR2;
      if (r2) window.cancelAnimationFrame(r2);
    };
  }, [active, map]);
  return null;
}

function MarkersLayer({
  stations,
  selectedId,
  onSelect,
  onDeselect,
  popupContent,
  markerRefs,
  active,
}: {
  stations: StationListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDeselect: (id: number) => void;
  popupContent: (s: StationListItem) => ReactNode;
  markerRefs: React.MutableRefObject<Map<number, L.Marker>>;
  active: boolean;
}) {
  const map = useMap();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const { set: favoriteIds } = useFavorites();

  useEffect(() => {
    const recompute = () => setClusters(clusterStations(stations, map));
    recompute();
    map.on('zoomend', recompute);
    map.on('moveend', recompute);
    return () => {
      map.off('zoomend', recompute);
      map.off('moveend', recompute);
    };
  }, [stations, map]);

  // Recompute clusters once the map becomes visible (its container pixel
  // coordinates change). Without this, clusters retain pre-reveal positions.
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => {
      setClusters(clusterStations(stations, map));
    }, 60);
    return () => window.clearTimeout(id);
  }, [active, stations, map]);

  // Re-open popup after clusters recompute (e.g. on zoom) if selection survives as a single marker.
  useEffect(() => {
    if (selectedId == null) return;
    const id = window.setTimeout(() => {
      const marker = markerRefs.current.get(selectedId);
      if (marker && !marker.isPopupOpen()) marker.openPopup();
    }, 60);
    return () => window.clearTimeout(id);
  }, [clusters, selectedId, markerRefs]);

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
                favoriteIds.has(s.id),
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
            icon={buildClusterIcon(
              worstStatus(c.stations),
              c.stations.length,
              c.stations.some((s) => favoriteIds.has(s.id)),
            )}
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
  active = true,
}: Props) {
  const markerRefs = useRef<Map<number, L.Marker>>(new Map());

  return (
    <MapContainer
      center={ORADEA_CENTER}
      zoom={DEFAULT_ZOOM}
      maxZoom={MAX_ZOOM}
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" zoomInTitle="Mărește" zoomOutTitle="Micșorează" />
      <VisibilitySync active={active} />
      <FlyToSelected
        stations={stations}
        selectedId={selectedId}
        markerRefs={markerRefs}
        active={active}
      />
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
        active={active}
      />
    </MapContainer>
  );
}
