import styled, { css } from 'styled-components';
import { useEffect, useState } from 'react';
import { useStationDetail } from '../hooks/useStationDetail';
import { useAuth } from '../auth/useAuth';
import { useFinishReservation } from '../hooks/useFinishReservation';
import { useCancelReservation } from '../hooks/useCancelReservation';
import { useFavorites, useToggleFavorite } from '../hooks/useFavorites';
import { useMyReservations } from '../hooks/useMyReservations';
import { Button } from './ui';
import { estimateRemainingSeconds, formatDuration } from '../lib/charging';
import { estimateChargingSeconds } from '@charging-station/shared';

const FACTOR = Number(import.meta.env.VITE_TIME_SCALE_FACTOR ?? '60');

type Status = 'free' | 'reserved' | 'charging' | 'full';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  min-width: 260px;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.25;
`;

const StatusPill = styled.span<{ $status: Status }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
  ${({ $status, theme }) => {
    const c =
      $status === 'free'
        ? theme.colors.statusFree
        : $status === 'reserved'
          ? theme.colors.statusReserved
          : $status === 'charging'
            ? theme.colors.statusCharging
            : theme.colors.textMuted;
    return css`
      color: ${c};
      background: ${c}1a;
      &::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: ${c};
        ${$status === 'charging' &&
        css`
          animation: pulse 1.5s ease-in-out infinite;
        `}
      }
    `;
  }}

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
`;

const AddressRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
  line-height: 1.4;

  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => `${theme.spacing(2.5)} ${theme.spacing(3)}`};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const IconBubble = styled.div<{ $tone?: 'primary' | 'amber' | 'red' }>`
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
  ${({ $tone = 'primary', theme }) => {
    const c =
      $tone === 'amber'
        ? theme.colors.statusReserved
        : $tone === 'red'
          ? theme.colors.statusCharging
          : theme.colors.primary;
    return css`
      color: ${c};
      background: ${c}1a;
    `;
  }}
`;

const StatLabel = styled.div`
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 600;
`;

const StatValue = styled.div`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const ReservationCard = styled.div<{ $status: 'reserved' | 'charging' }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(3)};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  ${({ $status, theme }) =>
    $status === 'charging' &&
    css`
      border-color: ${theme.colors.statusCharging}33;
      background: linear-gradient(180deg, ${theme.colors.statusCharging}08 0%, white 100%);
    `}
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const UserName = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text};
`;

const UserMeta = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const TimeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.text};
  font-variant-numeric: tabular-nums;
`;

const ProgressTrack = styled.div`
  height: 6px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number; $tone: 'amber' | 'red' }>`
  height: 100%;
  width: ${({ $percent }) => `${$percent}%`};
  background: ${({ $tone, theme }) =>
    $tone === 'red' ? theme.colors.statusCharging : theme.colors.statusReserved};
  border-radius: 999px;
  transition: width 0.5s linear;
`;

const QueueRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: ${({ theme }) => theme.spacing(2)};
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ActionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const IconButton = styled.button`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: white;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 120ms ease,
    border-color 120ms ease,
    color 120ms ease,
    transform 120ms ease;
  &:hover {
    background: ${({ theme }) => theme.colors.background};
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
  &:active {
    transform: scale(0.96);
  }
`;

const FavoriteButton = styled(IconButton)<{ $active: boolean }>`
  ${({ $active, theme }) =>
    $active &&
    css`
      color: ${theme.colors.statusReserved};
      border-color: ${theme.colors.statusReserved}66;
      background: ${theme.colors.statusReserved}1a;
      &:hover {
        color: ${theme.colors.statusReserved};
        border-color: ${theme.colors.statusReserved};
        background: ${theme.colors.statusReserved}26;
      }
    `}
`;

interface Props {
  stationId: number;
  onReserve: (stationId: number) => void;
}

export function StationPopup({ stationId, onReserve }: Props) {
  const { session } = useAuth();
  const { data, isLoading } = useStationDetail(stationId);
  const finish = useFinishReservation();
  const cancel = useCancelReservation();
  const { set: favoriteIds } = useFavorites();
  const toggleFav = useToggleFavorite();
  const { data: myReservations = [] } = useMyReservations();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (isLoading || !data) return <Wrap>Se încarcă…</Wrap>;

  const active = data.activeReservations[0];
  const queued = data.activeReservations[1];
  const isFull = data.activeReservations.length >= 2;
  const myActive = data.activeReservations.find((r) => r.userId === session?.user.id);

  const status: Exclude<Status, 'full'> = active
    ? active.status === 'charging'
      ? 'charging'
      : 'reserved'
    : 'free';
  const displayStatus: Status = isFull && status !== 'charging' ? 'full' : status;
  const statusLabel = displayStatus === 'full' ? 'Plină' : STATUS_LABELS[status];

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`;
  const isFavorite = favoriteIds.has(stationId);
  const hasActiveElsewhere = myReservations.some(
    (r) => (r.status === 'reserved' || r.status === 'charging') && r.stationId !== stationId,
  );

  return (
    <Wrap>
      <Header>
        <Title>{data.name}</Title>
        <StatusPill $status={displayStatus}>{statusLabel}</StatusPill>
      </Header>

      <AddressRow>
        <PinIcon />
        <span>{data.address}</span>
      </AddressRow>

      <StatCard>
        <IconBubble>
          <BoltIcon />
        </IconBubble>
        <div>
          <StatLabel>Putere</StatLabel>
          <StatValue>{data.powerKw} kW</StatValue>
        </div>
      </StatCard>

      {active && (
        <ReservationCard $status={active.status}>
          <UserRow>
            <IconBubble $tone={active.status === 'charging' ? 'red' : 'amber'}>
              <UserIcon />
            </IconBubble>
            <div>
              <UserName>{active.userFullName}</UserName>
              {active.carModelLabel && (
                <UserMeta>
                  {active.carModelLabel}
                  {active.batteryCapacityKwh != null && ` · ${active.batteryCapacityKwh} kWh`}
                </UserMeta>
              )}
            </div>
          </UserRow>

          {active.status === 'charging' && active.chargingStartedAt && active.batteryCapacityKwh ? (
            <ChargingProgress
              capacity={active.batteryCapacityKwh}
              startPercent={active.batteryLevelStart}
              power={data.powerKw}
              startedAt={active.chargingStartedAt}
              now={now}
            />
          ) : (
            <TimeRow>
              <span>În așteptare grace 15s</span>
              <span style={{ visibility: 'hidden' }}>{now}</span>
            </TimeRow>
          )}

          {queued && (
            <QueueRow>
              <span>În așteptare</span>
              <span>{queued.userFullName}</span>
            </QueueRow>
          )}
        </ReservationCard>
      )}

      <ActionRow>
        {session && (
          <FavoriteButton
            type="button"
            $active={isFavorite}
            disabled={toggleFav.isPending}
            title={isFavorite ? 'Scoate de la favorite' : 'Adaugă la favorite'}
            aria-label={isFavorite ? 'Scoate de la favorite' : 'Adaugă la favorite'}
            onClick={() => toggleFav.mutate({ stationId, favorite: !isFavorite })}
          >
            <StarIcon filled={isFavorite} />
          </FavoriteButton>
        )}
        <IconButton
          as="a"
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Deschide în Google Maps"
          aria-label="Deschide în Google Maps"
        >
          <DirectionsIcon />
        </IconButton>
        {renderPrimaryAction()}
      </ActionRow>
    </Wrap>
  );

  function renderPrimaryAction() {
    if (!session) {
      return (
        <Button as="a" href="/login" $full>
          Autentificare
        </Button>
      );
    }
    if (myActive) {
      if (myActive.status === 'charging') {
        return (
          <Button $full onClick={() => finish.mutate(myActive.id)} disabled={finish.isPending}>
            {finish.isPending ? 'Se termină…' : 'Termină'}
          </Button>
        );
      }
      return (
        <Button
          $variant="danger"
          $full
          onClick={() => cancel.mutate(myActive.id)}
          disabled={cancel.isPending}
        >
          {cancel.isPending ? 'Se anulează…' : 'Anulează'}
        </Button>
      );
    }
    if (hasActiveElsewhere) {
      return (
        <Button
          $variant="secondary"
          $full
          disabled
          title="Ai deja o rezervare activă. Anulează-o întâi dacă vrei să rezervi aici."
        >
          Rezervă
        </Button>
      );
    }
    if (isFull) {
      return (
        <Button $variant="secondary" $full disabled>
          Stație plină
        </Button>
      );
    }
    return (
      <Button $full onClick={() => onReserve(stationId)}>
        Rezervă
      </Button>
    );
  }
}

function ChargingProgress({
  capacity,
  startPercent,
  power,
  startedAt,
  now: _now,
}: {
  capacity: number;
  startPercent: number;
  power: number;
  startedAt: string;
  now: number;
}) {
  const total = estimateChargingSeconds(capacity, startPercent, power, FACTOR);
  const remaining = estimateRemainingSeconds(capacity, startPercent, power, startedAt);
  const elapsed = total - remaining;
  const percent = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
  const done = remaining <= 0;

  return (
    <>
      <TimeRow>
        <span>{done ? 'Încărcare completă' : 'Timp rămas'}</span>
        <strong>{done ? '✓' : formatDuration(remaining)}</strong>
      </TimeRow>
      <ProgressTrack>
        <ProgressFill $percent={percent} $tone="red" />
      </ProgressTrack>
    </>
  );
}

const STATUS_LABELS: Record<Exclude<Status, 'full'>, string> = {
  free: 'Liberă',
  reserved: 'Rezervată',
  charging: 'Încărcare',
};

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function DirectionsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}
