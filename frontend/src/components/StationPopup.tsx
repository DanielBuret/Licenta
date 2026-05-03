import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { useStationDetail } from '../hooks/useStationDetail';
import { useAuth } from '../auth/useAuth';
import { Button } from './ui';
import { estimateRemainingSeconds, formatDuration } from '../lib/charging';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const Address = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`;

const Power = styled.p`
  margin: 0;
  font-size: 0.875rem;
`;

const Section = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: ${({ theme }) => theme.spacing(2)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const QueueRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
`;

interface Props {
  stationId: number;
  onReserve: (stationId: number) => void;
}

export function StationPopup({ stationId, onReserve }: Props) {
  const { session } = useAuth();
  const { data, isLoading } = useStationDetail(stationId);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (isLoading || !data) return <Wrap>Se încarcă…</Wrap>;

  const active = data.activeReservations[0];
  const isFull = data.activeReservations.length >= 2;
  const myActive = data.activeReservations.find((r) => r.userId === session?.user.id);

  return (
    <Wrap>
      <Title>{data.name}</Title>
      <Address>{data.address}</Address>
      <Power>Putere: {data.powerKw} kW</Power>

      {active ? (
        <Section>
          <strong>{active.userFullName}</strong>
          {active.carModelLabel && (
            <Address>
              {active.carModelLabel} · {active.batteryCapacityKwh} kWh
            </Address>
          )}
          {active.status === 'charging' && active.chargingStartedAt && active.batteryCapacityKwh ? (
            <Address>
              Timp rămas:{' '}
              {formatDuration(
                estimateRemainingSeconds(
                  active.batteryCapacityKwh,
                  active.batteryLevelStart,
                  data.powerKw,
                  active.chargingStartedAt,
                ),
              )}{' '}
              <span style={{ visibility: 'hidden' }}>{now}</span>
            </Address>
          ) : (
            <Address>Status: rezervat (15s grace)</Address>
          )}
          {data.activeReservations[1] && (
            <QueueRow>
              <span>În așteptare:</span>
              <span>{data.activeReservations[1].userFullName}</span>
            </QueueRow>
          )}
        </Section>
      ) : (
        <Section>
          <span>Stație liberă</span>
        </Section>
      )}

      {!session ? (
        <Button as="a" href="/login" $full>
          Autentificare pentru rezervare
        </Button>
      ) : myActive ? (
        <Button $variant="secondary" $full disabled>
          Ai deja o rezervare aici
        </Button>
      ) : isFull ? (
        <Button $variant="secondary" $full disabled>
          Stație plină
        </Button>
      ) : (
        <Button $full onClick={() => onReserve(stationId)}>
          Rezervă
        </Button>
      )}
    </Wrap>
  );
}
