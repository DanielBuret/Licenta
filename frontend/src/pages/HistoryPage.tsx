import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { useMyReservations } from '../hooks/useMyReservations';
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
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9375rem;
`;

const QuickLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: background ${({ theme }) => theme.transitions.fast};
  &:hover {
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing(4)};
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing(5)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StatValue = styled.div`
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text};
  font-variant-numeric: tabular-nums;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
`;

const Item = styled.div`
  display: grid;
  grid-template-columns: 16px 1fr auto;
  gap: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(4)} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  align-items: flex-start;
  &:last-child {
    border-bottom: none;
  }
`;

const Dot = styled.div<{ $tone: 'green' | 'gray' }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 7px;
  background: ${({ $tone, theme }) =>
    $tone === 'green' ? theme.colors.statusFree : theme.colors.textMuted};
`;

const StationLine = styled.div`
  font-weight: 600;
  font-size: 0.9375rem;
`;

const Meta = styled.div`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(5)}`};
`;

const EmptyCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing(10)} ${({ theme }) => theme.spacing(6)};
  text-align: center;
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
          <div>
            <Title>Istoric rezervări</Title>
            <Subtitle>Sesiunile finalizate și anulate.</Subtitle>
          </div>
          <QuickLink to="/dashboard">← Rezervări active</QuickLink>
        </HeaderRow>

        <StatGrid>
          <StatCard>
            <StatLabel>Total</StatLabel>
            <StatValue>{history.length}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Completate</StatLabel>
            <StatValue style={{ color: '#16a34a' }}>{completedCount}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Anulate</StatLabel>
            <StatValue style={{ color: '#94a3b8' }}>{cancelledCount}</StatValue>
          </StatCard>
        </StatGrid>

        {isLoading ? (
          <EmptyCard>Se încarcă…</EmptyCard>
        ) : history.length === 0 ? (
          <EmptyCard>Niciun istoric încă.</EmptyCard>
        ) : (
          <Card>
            <Timeline>
              {history.map((r) => (
                <Item key={r.id}>
                  <Dot $tone={r.status === 'completed' ? 'green' : 'gray'} />
                  <div>
                    <StationLine>{r.station?.name ?? `Stația #${r.stationId}`}</StationLine>
                    <Meta>
                      <span>
                        Rezervat{' '}
                        {new Date(r.reservedAt).toLocaleString('ro-RO', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>Baterie {r.batteryLevelStart}%</span>
                      {r.chargingStartedAt && r.chargingEndedAt && (
                        <span>
                          Încărcat{' '}
                          {Math.round(
                            (new Date(r.chargingEndedAt).getTime() -
                              new Date(r.chargingStartedAt).getTime()) /
                              60000,
                          )}
                          m
                        </span>
                      )}
                    </Meta>
                  </div>
                  <StatusPill $tone={r.status === 'completed' ? 'green' : 'gray'}>
                    {r.status === 'completed' ? 'completată' : 'anulată'}
                  </StatusPill>
                </Item>
              ))}
            </Timeline>
          </Card>
        )}
      </Container>
    </Page>
  );
}
