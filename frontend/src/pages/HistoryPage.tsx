import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { useMyReservations } from '../hooks/useMyReservations';

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
`;

const QuickLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-size: 0.875rem;
  &:hover {
    text-decoration: underline;
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
    $status === 'completed' ? theme.colors.success : theme.colors.textMuted};
  color: white;
`;

const Counts = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(6)};
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export function HistoryPage() {
  const { data: reservations = [], isLoading } = useMyReservations();

  const history = reservations.filter((r) => r.status === 'completed' || r.status === 'cancelled');
  const completedCount = history.filter((r) => r.status === 'completed').length;
  const cancelledCount = history.filter((r) => r.status === 'cancelled').length;

  return (
    <Page>
      <AppHeader />
      <Container>
        <HeaderRow>
          <h1 style={{ margin: 0 }}>Istoric rezervări</h1>
          <QuickLink to="/dashboard">← Rezervări active</QuickLink>
        </HeaderRow>

        <Section>
          <Counts>
            <span>
              Total: <strong>{history.length}</strong>
            </span>
            <span>
              Completate: <strong>{completedCount}</strong>
            </span>
            <span>
              Anulate: <strong>{cancelledCount}</strong>
            </span>
          </Counts>

          {isLoading ? (
            <p>Se încarcă…</p>
          ) : history.length === 0 ? (
            <p>Niciun istoric încă.</p>
          ) : (
            history.map((r) => (
              <Card key={r.id}>
                <div>
                  <strong>{r.station?.name ?? `Stația #${r.stationId}`}</strong>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                    Rezervat: {new Date(r.reservedAt).toLocaleString('ro-RO')}
                  </div>
                  {r.chargingStartedAt && (
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                      Charging: {new Date(r.chargingStartedAt).toLocaleString('ro-RO')}
                      {r.chargingEndedAt &&
                        ` → ${new Date(r.chargingEndedAt).toLocaleString('ro-RO')}`}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                    Baterie start: {r.batteryLevelStart}%
                  </div>
                </div>
                <StatusPill $status={r.status}>{r.status}</StatusPill>
              </Card>
            ))
          )}
        </Section>
      </Container>
    </Page>
  );
}
