import { useState } from 'react';
import styled from 'styled-components';
import { useStations } from '../hooks/useStations';
import { useStationsRealtime } from '../hooks/useStationsRealtime';
import { useUserLocation } from '../hooks/useUserLocation';
import { StationMap } from '../components/Map/StationMap';
import { StationPopup } from '../components/StationPopup';
import { StationListSidebar } from '../components/StationListSidebar';
import { AppHeader } from '../components/AppHeader';
import { ReservationDialog } from '../components/ReservationDialog';

const Layout = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: 360px 1fr;
  min-height: 0;
`;

const MapWrap = styled.div`
  position: relative;
  min-height: 0;
`;

const ErrorBar = styled.div`
  position: absolute;
  inset: 16px 16px auto 16px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.danger};
  padding: ${({ theme }) => theme.spacing(3)};
  border-radius: ${({ theme }) => theme.radii.md};
  z-index: 500;
  font-size: 0.875rem;
`;

export function HomePage() {
  useStationsRealtime();
  const { data: stations = [], error } = useStations();
  const userLoc = useUserLocation();
  const [selected, setSelected] = useState<number | null>(null);
  const [reservingId, setReservingId] = useState<number | null>(null);

  return (
    <Layout>
      <AppHeader />
      <Body>
        <StationListSidebar
          stations={stations}
          selectedId={selected}
          onSelect={setSelected}
          userLocation={userLoc.location}
          locationLoading={userLoc.loading}
          locationError={userLoc.error}
        />
        <MapWrap>
          {error && <ErrorBar>Nu am putut încărca stațiile. Reîncearcă mai târziu.</ErrorBar>}
          <StationMap
            stations={stations}
            selectedId={selected}
            onSelect={setSelected}
            userLocation={userLoc.location}
            popupContent={(s) => (
              <StationPopup stationId={s.id} onReserve={(id) => setReservingId(id)} />
            )}
          />
        </MapWrap>
      </Body>
      {reservingId !== null && (
        <ReservationDialog stationId={reservingId} onClose={() => setReservingId(null)} />
      )}
    </Layout>
  );
}
