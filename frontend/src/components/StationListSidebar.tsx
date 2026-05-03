import styled from 'styled-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { StationListItem } from '../hooks/useStations';
import type { UserLocation } from '../hooks/useUserLocation';
import { useFavorites, useToggleFavorite } from '../hooks/useFavorites';
import { useAuth } from '../auth/useAuth';
import { Input } from './ui';
import { formatDistance, googleMapsDirections, haversineKm } from '../lib/distance';

const ORADEA_CENTER = { lat: 47.0722, lon: 21.9211 };

const Wrap = styled.aside`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  min-height: 0;
  min-width: 0;
  width: 100%;
  overflow: hidden;
`;

const Rail = styled.aside`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  width: 100%;
  height: 100%;
  padding: ${({ theme }) => theme.spacing(3)} 0;
`;

const RailButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};
  &:hover {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.shadow.ring};
  }
`;

const RailCount = styled.span`
  margin-top: ${({ theme }) => theme.spacing(2)};
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  letter-spacing: 0.04em;
`;

const Header = styled.div`
  padding: ${({ theme }) => theme.spacing(4)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const HeaderTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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

const CollapseButton = styled.button<{ $collapsed: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};
  &:hover {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.shadow.ring};
  }

  svg {
    transition: transform ${({ theme }) => theme.transitions.base};
    transform: rotate(${({ $collapsed }) => ($collapsed ? '180deg' : '0deg')});
  }
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
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(2)}`};
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

const FavButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.statusReserved : theme.colors.textSubtle};
  font-size: 1.125rem;
  line-height: 1;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition:
    color 120ms ease,
    background 120ms ease,
    transform 120ms ease;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
    transform: scale(1.1);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
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

const DirectionsGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  flex-shrink: 0;
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
  collapsed: boolean;
  onToggleCollapse: () => void;
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
  collapsed,
  onToggleCollapse,
}: Props) {
  const [search, setSearch] = useState('');
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const { user } = useAuth();
  const { set: favoriteIds } = useFavorites();
  const toggleFav = useToggleFavorite();

  useEffect(() => {
    if (selectedId == null) return;
    const el = itemRefs.current.get(selectedId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedId]);

  const origin: { lat: number; lon: number; approximate: boolean } = userLocation
    ? { lat: userLocation.lat, lon: userLocation.lon, approximate: false }
    : { lat: ORADEA_CENTER.lat, lon: ORADEA_CENTER.lon, approximate: true };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? stations.filter(
          (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q),
        )
      : stations.slice();

    return filtered
      .map((s) => ({
        ...s,
        __distanceKm: haversineKm(origin.lat, origin.lon, s.latitude, s.longitude),
        __isFavorite: favoriteIds.has(s.id),
      }))
      .sort((a, b) => {
        if (a.__isFavorite !== b.__isFavorite) return a.__isFavorite ? -1 : 1;
        return a.__distanceKm - b.__distanceKm;
      });
  }, [stations, search, origin.lat, origin.lon, favoriteIds]);

  if (collapsed) {
    return (
      <Rail>
        <RailButton
          type="button"
          aria-label="Extinde lista"
          aria-expanded={false}
          title="Extinde lista"
          onClick={onToggleCollapse}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </RailButton>
        <RailCount>Stații · {stations.length}</RailCount>
      </Rail>
    );
  }

  return (
    <Wrap>
      <Header>
        <HeaderTopRow>
          <div>
            <HeaderTitle>Stații ({stations.length})</HeaderTitle>
            <HeaderSubtitle>
              {locationLoading
                ? 'Detectez locația ta…'
                : userLocation
                  ? 'Sortate după distanța față de tine'
                  : 'Sortate aproximativ după distanța de centrul Oradei'}
            </HeaderSubtitle>
          </div>
          <CollapseButton
            type="button"
            $collapsed={false}
            aria-label="Restrânge lista"
            aria-expanded
            title="Restrânge lista"
            onClick={onToggleCollapse}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </CollapseButton>
        </HeaderTopRow>
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
              <Item
                key={s.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(s.id, el);
                  else itemRefs.current.delete(s.id);
                }}
                $selected={s.id === selectedId}
                onClick={() => onSelect(s.id)}
              >
                <TopRow>
                  <NameWrap>
                    <Dot $status={status} />
                    <Name>{s.name}</Name>
                  </NameWrap>
                  {user && (
                    <FavButton
                      type="button"
                      $active={s.__isFavorite}
                      aria-label={s.__isFavorite ? 'Scoate de la favorite' : 'Adaugă la favorite'}
                      title={s.__isFavorite ? 'Scoate de la favorite' : 'Adaugă la favorite'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFav.mutate({ stationId: s.id, favorite: !s.__isFavorite });
                      }}
                    >
                      {s.__isFavorite ? '★' : '☆'}
                    </FavButton>
                  )}
                </TopRow>
                <Address>{s.address}</Address>
                <MetaRow>
                  <Power>{s.powerKw} kW</Power>
                  <DirectionsGroup>
                    {!origin.approximate && <Distance>{formatDistance(s.__distanceKm)}</Distance>}
                    <DirectionsLink
                      href={directionsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Google Maps ↗
                    </DirectionsLink>
                  </DirectionsGroup>
                </MetaRow>
              </Item>
            );
          })
        )}
      </List>
    </Wrap>
  );
}
