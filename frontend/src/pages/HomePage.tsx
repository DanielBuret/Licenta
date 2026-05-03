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

const MOBILE_BREAKPOINT = '900px';

const Layout = styled.div`
  display: grid;
  grid-template-rows: auto auto 1fr;
  height: 100vh;
  width: 100%;
  overflow: hidden;

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) {
    grid-template-rows: auto 1fr;
  }
`;

const ViewToggle = styled.div`
  display: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.spacing(2)};
    padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
    background: ${({ theme }) => theme.colors.surface};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => `${theme.spacing(2.5)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.border)};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.surface)};
  color: ${({ $active, theme }) => ($active ? 'white' : theme.colors.text)};
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition:
    background 120ms ease,
    border-color 120ms ease,
    color 120ms ease;
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: 360px 1fr;
  min-height: 0;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }
`;

const SidebarSlot = styled.div<{ $mobileHidden: boolean }>`
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: ${({ $mobileHidden }) => ($mobileHidden ? 'none' : 'flex')};
  }
`;

const MapSlot = styled.div<{ $mobileHidden: boolean }>`
  position: relative;
  min-height: 0;
  min-width: 0;
  overflow: hidden;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: ${({ $mobileHidden }) => ($mobileHidden ? 'none' : 'block')};
  }
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
  const [mobileView, setMobileView] = useState<'list' | 'map'>('map');

  function isMobile() {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT})`).matches
    );
  }

  function handleSelectFromList(id: number) {
    setSelected(id);
    if (isMobile()) setMobileView('map');
  }

  return (
    <Layout>
      <AppHeader />
      <ViewToggle role="tablist" aria-label="Schimbă vizualizarea">
        <ToggleButton
          type="button"
          role="tab"
          aria-selected={mobileView === 'list'}
          $active={mobileView === 'list'}
          onClick={() => setMobileView('list')}
        >
          📋 Listă
        </ToggleButton>
        <ToggleButton
          type="button"
          role="tab"
          aria-selected={mobileView === 'map'}
          $active={mobileView === 'map'}
          onClick={() => setMobileView('map')}
        >
          🗺️ Hartă
        </ToggleButton>
      </ViewToggle>
      <Body>
        <SidebarSlot $mobileHidden={mobileView !== 'list'}>
          <StationListSidebar
            stations={stations}
            selectedId={selected}
            onSelect={handleSelectFromList}
            userLocation={userLoc.location}
            locationLoading={userLoc.loading}
            locationError={userLoc.error}
          />
        </SidebarSlot>
        <MapSlot $mobileHidden={mobileView !== 'map'}>
          {error && <ErrorBar>Nu am putut încărca stațiile. Reîncearcă mai târziu.</ErrorBar>}
          <StationMap
            stations={stations}
            selectedId={selected}
            onSelect={setSelected}
            onDeselect={(id) => setSelected((prev) => (prev === id ? null : prev))}
            userLocation={userLoc.location}
            popupContent={(s) => (
              <StationPopup stationId={s.id} onReserve={(id) => setReservingId(id)} />
            )}
          />
        </MapSlot>
      </Body>
      {reservingId !== null && (
        <ReservationDialog stationId={reservingId} onClose={() => setReservingId(null)} />
      )}
    </Layout>
  );
}
