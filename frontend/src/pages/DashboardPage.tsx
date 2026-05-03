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
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const QuickLinks = styled.nav`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
  font-size: 0.875rem;
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing(6)};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

const Card = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing(4)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
  & + & {
    margin-top: ${({ theme }) => theme.spacing(3)};
  }
`;

const StatusPill = styled.span<{ $status: string }>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(2)}`};
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $status, theme }) =>
    $status === 'charging'
      ? theme.colors.statusCharging
      : $status === 'reserved'
        ? theme.colors.statusReserved
        : theme.colors.textMuted};
  color: white;
`;

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
          <h1 style={{ margin: 0 }}>Rezervări active</h1>
          <QuickLinks>
            <Link to="/history">Istoric →</Link>
            <Link to="/profile">Profil →</Link>
            <Link to="/settings">Setări →</Link>
          </QuickLinks>
        </HeaderRow>

        <Section>
          {reservationsLoading ? (
            <p>Se încarcă…</p>
          ) : active.length === 0 ? (
            <p>
              Nu ai rezervări active. <Link to="/">Mergi la hartă</Link> pentru a rezerva o stație.
            </p>
          ) : (
            active.map((r) => (
              <Card key={r.id}>
                <div>
                  <strong>{r.station?.name ?? `Stația #${r.stationId}`}</strong>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                    Poziție în coadă: {r.queuePosition} · Baterie start: {r.batteryLevelStart}%
                  </div>
                  {r.status === 'charging' &&
                    r.chargingStartedAt &&
                    car &&
                    r.station &&
                    (() => {
                      const remaining = estimateRemainingSeconds(
                        car.batteryCapacityKwh,
                        r.batteryLevelStart,
                        r.station.powerKw,
                        r.chargingStartedAt,
                      );
                      return (
                        <div style={{ fontSize: '0.8125rem' }}>
                          {remaining > 0 ? (
                            <>Timp rămas: {formatDuration(remaining)}</>
                          ) : (
                            <>Încărcare completă</>
                          )}
                          <span style={{ visibility: 'hidden' }}>{now}</span>
                        </div>
                      );
                    })()}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <StatusPill $status={r.status}>{r.status}</StatusPill>
                  {r.status === 'charging' && (
                    <Button onClick={() => finish.mutate(r.id)} disabled={finish.isPending}>
                      Termină
                    </Button>
                  )}
                  <Button
                    $variant="danger"
                    onClick={() => cancel.mutate(r.id)}
                    disabled={cancel.isPending}
                  >
                    Anulează
                  </Button>
                </div>
              </Card>
            ))
          )}
        </Section>
      </Container>
    </Page>
  );
}
