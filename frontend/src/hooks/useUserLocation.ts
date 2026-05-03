import { useEffect, useState } from 'react';

export interface UserLocation {
  lat: number;
  lon: number;
}

export interface UseUserLocationResult {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
}

export function useUserLocation(): UseUserLocationResult {
  const [state, setState] = useState<UseUserLocationResult>({
    location: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState({ location: null, loading: false, error: 'Geolocalizare nesuportată de browser' });
      return;
    }
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setState({
          location: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          loading: false,
          error: null,
        });
      },
      (err) => {
        if (cancelled) return;
        setState({ location: null, loading: false, error: err.message });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
