import styled from 'styled-components';
import { useMemo, useState } from 'react';
import type { StationListItem } from '../hooks/useStations';
import type { UserLocation } from '../hooks/useUserLocation';
import { Input } from './ui';
import { formatDistance, googleMapsDirections, haversineKm } from '../lib/distance';

const Wrap = styled.aside`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  min-height: 0;
`;

const Header = styled.div`
  padding: ${({ theme }) => theme.spacing(4)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
`;

const HeaderSubtitle = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
`;

const Empty = styled.li`
  padding: ${({ theme }) => theme.spacing(6)};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`;

const Item = styled.li<{ $selected: boolean }>`
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  background: ${({ $selected, theme }) =>
    $selected ? `${theme.colors.primary}14` : 'transparent'};
  border-left: 3px solid
    ${({ $selected, theme }) => ($selected ? theme.colors.primary : 'transparent')};
  transition: background 120ms ease;
  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const NameWrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  min-width: 0;
`;

const Dot = styled.span<{ $status: 'free' | 'reserved' | 'charging' }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $status, theme }) =>
    $status === 'charging'
      ? theme.colors.statusCharging
      : $status === 'reserved'
        ? theme.colors.statusReserved
        : theme.colors.statusFree};
`;

const Name = styled.span`
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Distance = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  flex-shrink: 0;
`;

const Address = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const Power = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const DirectionsLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(2)}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const Notice = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(4)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

interface Props {
  stations: StationListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  userLocation: UserLocation | null;
  locationLoading: boolean;
  locationError: string | null;
}

function statusFor(s: {
  hasCharging: boolean;
  hasReserved: boolean;
}): 'free' | 'reserved' | 'charging' {
  if (s.hasCharging) return 'charging';
  if (s.hasReserved) return 'reserved';
  return 'free';
}

export function StationListSidebar({
  stations,
  selectedId,
  onSelect,
  userLocation,
  locationLoading,
  locationError,
}: Props) {
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? stations.filter(
          (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q),
        )
      : stations.slice();

    if (userLocation) {
      list = list
        .map((s) => ({
          station: s,
          distanceKm: haversineKm(userLocation.lat, userLocation.lon, s.latitude, s.longitude),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .map((entry) => Object.assign(entry.station, { __distanceKm: entry.distanceKm }));
    } else {
      list = list.slice().sort((a, b) => a.name.localeCompare(b.name, 'ro'));
    }
    return list as Array<StationListItem & { __distanceKm?: number }>;
  }, [stations, search, userLocation]);

  return (
    <Wrap>
      <Header>
        <HeaderTitle>Stații ({stations.length})</HeaderTitle>
        <HeaderSubtitle>
          {locationLoading
            ? 'Detectez locația ta…'
            : userLocation
              ? 'Sortate după distanța față de tine'
              : 'Sortate alfabetic (locația indisponibilă)'}
        </HeaderSubtitle>
        <Input
          type="search"
          placeholder="Caută stație după nume sau adresă…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Header>
      {locationError && !locationLoading && !userLocation && (
        <Notice>Locația nu e disponibilă: {locationError}</Notice>
      )}
      <List>
        {visible.length === 0 ? (
          <Empty>
            {search ? 'Nicio stație nu se potrivește.' : 'Nu există stații înregistrate.'}
          </Empty>
        ) : (
          visible.map((s) => {
            const status = statusFor(s);
            const directionsHref = googleMapsDirections(
              s.latitude,
              s.longitude,
              userLocation?.lat,
              userLocation?.lon,
            );
            return (
              <Item key={s.id} $selected={s.id === selectedId} onClick={() => onSelect(s.id)}>
                <TopRow>
                  <NameWrap>
                    <Dot $status={status} />
                    <Name>{s.name}</Name>
                  </NameWrap>
                  {s.__distanceKm != null && <Distance>{formatDistance(s.__distanceKm)}</Distance>}
                </TopRow>
                <Address>{s.address}</Address>
                <MetaRow>
                  <Power>{s.powerKw} kW</Power>
                  <DirectionsLink
                    href={directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Drum cu Google Maps ↗
                  </DirectionsLink>
                </MetaRow>
              </Item>
            );
          })
        )}
      </List>
    </Wrap>
  );
}
