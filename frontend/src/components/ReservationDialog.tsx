import { useState } from 'react';
import styled from 'styled-components';
import { useStationDetail } from '../hooks/useStationDetail';
import { useCreateReservation } from '../hooks/useCreateReservation';
import { Button, Input, Field } from './ui';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 1000;
`;

const Card = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing(6)};
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const ErrorBanner = styled.div`
  padding: ${({ theme }) => theme.spacing(3)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: #fee2e2;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.875rem;
`;

interface Props {
  stationId: number;
  onClose: () => void;
}

export function ReservationDialog({ stationId, onClose }: Props) {
  const { data: station } = useStationDetail(stationId);
  const create = useCreateReservation();
  const [batteryRaw, setBatteryRaw] = useState('20');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const battery = Number(batteryRaw);
    if (!Number.isInteger(battery) || battery < 0 || battery > 99) {
      setError('Procentul bateriei trebuie să fie între 0 și 99.');
      return;
    }
    try {
      await create.mutateAsync({ stationId, batteryLevelStart: battery });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Eroare la rezervare.');
    }
  }

  return (
    <Backdrop onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: 0 }}>Rezervare</h2>
        {station && (
          <p style={{ margin: 0 }}>
            {station.name} — {station.powerKw} kW
          </p>
        )}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="Procent baterie curent (%)">
            <Input
              type="number"
              min={0}
              max={99}
              value={batteryRaw}
              onChange={(e) => setBatteryRaw(e.target.value)}
            />
          </Field>
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <Row>
            <Button type="button" $variant="secondary" $full onClick={onClose}>
              Renunță
            </Button>
            <Button type="submit" $full disabled={create.isPending}>
              {create.isPending ? 'Se rezervă…' : 'Confirmă'}
            </Button>
          </Row>
        </form>
      </Card>
    </Backdrop>
  );
}
