import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { useMyReservations } from '../hooks/useMyReservations';
import { useFinishReservation } from '../hooks/useFinishReservation';
import { useCancelReservation } from '../hooks/useCancelReservation';
import { useProfile } from '../hooks/useProfile';
import { Button } from '../components/ui';
import { estimateRemainingSeconds, formatDuration } from '../lib/charging';
import { StatusPill } from '../components/admin/AdminUI';

const Page = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
`;

const Container = styled.main`
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing(8)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(6)};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
  flex-wrap: wrap;
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9375rem;
`;

const QuickLinks = styled.nav`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  font-size: 0.875rem;
`;

const QuickLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  font-weight: 500;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};
  &:hover {
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing(5)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  transition: box-shadow ${({ theme }) => theme.transitions.base};
  &:hover {
    box-shadow: ${({ theme }) => theme.shadow.md};
  }
`;

const CardStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StationName = styled.div`
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const Meta = styled.div`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`;

const ProgressBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(3)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ProgressTrack = styled.div`
  height: 6px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number; $tone: 'red' | 'amber' }>`
  height: 100%;
  width: ${({ $percent }) => `${$percent}%`};
  background: ${({ $tone, theme }) =>
    $tone === 'red' ? theme.colors.statusCharging : theme.colors.statusReserved};
  border-radius: 999px;
  transition: width 0.5s linear;
`;

const ProgressRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.text};
  font-variant-numeric: tabular-nums;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
`;

const EmptyCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing(10)} ${({ theme }) => theme.spacing(6)};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
`;

function toneFor(status: string): 'red' | 'amber' | 'green' | 'gray' {
  if (status === 'charging') return 'red';
  if (status === 'reserved') return 'amber';
  if (status === 'completed') return 'green';
  return 'gray';
}

const STATUS_LABEL: Record<string, string> = {
  reserved: 'rezervat',
  charging: 'încărcare',
};

export function DashboardPage() {
  const { data: reservations = [], isLoading: reservationsLoading } = useMyReservations();
  const { data: profile } = useProfile();
  const finish = useFinishReservation();
  const cancel = useCancelReservation();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const car = profile?.carModel ?? null;
  const active = reservations.filter((r) => r.status === 'reserved' || r.status === 'charging');

  return (
    <Page>
      <AppHeader />
      <Container>
        <HeaderRow>
          <TitleGroup>
            <Title>Rezervări active</Title>
            <Subtitle>Sesiunile tale curente de încărcare și rezervările în coadă.</Subtitle>
          </TitleGroup>
          <QuickLinks>
            <QuickLink to="/history">Istoric</QuickLink>
            <QuickLink to="/profile">Profil</QuickLink>
            <QuickLink to="/settings">Setări</QuickLink>
          </QuickLinks>
        </HeaderRow>

        {reservationsLoading ? (
          <EmptyCard>Se încarcă…</EmptyCard>
        ) : active.length === 0 ? (
          <EmptyCard>
            Nu ai rezervări active. <Link to="/">Mergi la hartă</Link> pentru a rezerva o stație.
          </EmptyCard>
        ) : (
          <CardStack>
            {active.map((r) => {
              const remaining =
                r.status === 'charging' && r.chargingStartedAt && car && r.station
                  ? estimateRemainingSeconds(
                      car.batteryCapacityKwh,
                      r.batteryLevelStart,
                      r.station.powerKw,
                      r.chargingStartedAt,
                    )
                  : null;
              const elapsedShare =
                r.status === 'charging' &&
                r.chargingStartedAt &&
                car &&
                r.station &&
                remaining != null
                  ? (() => {
                      const total =
                        (((car.batteryCapacityKwh * (100 - r.batteryLevelStart)) /
                          100 /
                          r.station.powerKw) *
                          3600) /
                        60;
                      const elapsed = total - remaining;
                      return total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
                    })()
                  : 0;

              return (
                <Card key={r.id}>
                  <CardHeader>
                    <div>
                      <StationName>{r.station?.name ?? `Stația #${r.stationId}`}</StationName>
                      <Meta>
                        Poziție #{r.queuePosition} · Baterie start {r.batteryLevelStart}%
                      </Meta>
                    </div>
                    <StatusPill $tone={toneFor(r.status)}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </StatusPill>
                  </CardHeader>

                  {r.status === 'charging' && remaining != null && (
                    <ProgressBlock>
                      <ProgressRow>
                        <span>{remaining > 0 ? 'Timp rămas' : 'Încărcare completă'}</span>
                        <strong>{remaining > 0 ? formatDuration(remaining) : '✓'}</strong>
                      </ProgressRow>
                      <ProgressTrack>
                        <ProgressFill $percent={elapsedShare} $tone="red" />
                      </ProgressTrack>
                      <span style={{ visibility: 'hidden' }}>{now}</span>
                    </ProgressBlock>
                  )}

                  <Actions>
                    {r.status === 'charging' ? (
                      <Button onClick={() => finish.mutate(r.id)} disabled={finish.isPending}>
                        Termină
                      </Button>
                    ) : (
                      <Button
                        $variant="danger"
                        onClick={() => cancel.mutate(r.id)}
                        disabled={cancel.isPending}
                      >
                        Anulează
                      </Button>
                    )}
                  </Actions>
                </Card>
              );
            })}
          </CardStack>
        )}
      </Container>
    </Page>
  );
}
