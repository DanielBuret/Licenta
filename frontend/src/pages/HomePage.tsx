import { useState } from 'react';
import styled from 'styled-components';
import { useStations } from '../hooks/useStations';
import { useStationsRealtime } from '../hooks/useStationsRealtime';
import { StationMap } from '../components/Map/StationMap';
import { StationPopup } from '../components/StationPopup';
import { AppHeader } from '../components/AppHeader';
import { ReservationDialog } from '../components/ReservationDialog';

const Layout = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
`;

const MapWrap = styled.div`
  position: relative;
`;

export function HomePage() {
  useStationsRealtime();
  const { data: stations = [] } = useStations();
  const [selected, setSelected] = useState<number | null>(null);
  const [reservingId, setReservingId] = useState<number | null>(null);

  return (
    <Layout>
      <AppHeader />
      <MapWrap>
        <StationMap
          stations={stations}
          selectedId={selected}
          onSelect={setSelected}
          popupContent={(s) => (
            <StationPopup stationId={s.id} onReserve={(id) => setReservingId(id)} />
          )}
        />
      </MapWrap>
      {reservingId !== null && (
        <ReservationDialog stationId={reservingId} onClose={() => setReservingId(null)} />
      )}
    </Layout>
  );
}
