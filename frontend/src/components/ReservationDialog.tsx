import { useState } from 'react';
import styled from 'styled-components';
import { useStationDetail } from '../hooks/useStationDetail';
import { useCreateReservation } from '../hooks/useCreateReservation';
import { Button, Dialog, Field, Input } from './ui';

const StationLine = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.875rem;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const Bolt = styled.div`
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
`;

const StationName = styled.div`
  font-weight: 600;
`;

const StationMeta = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const Banner = styled.div`
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.875rem;
  font-weight: 500;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message ?? 'Eroare la rezervare.');
    }
  }

  return (
    <Dialog
      title="Rezervare stație"
      subtitle="Confirmă procentul bateriei pentru a estima durata."
      onClose={onClose}
    >
      {station && (
        <StationLine>
          <Bolt>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
          </Bolt>
          <div>
            <StationName>{station.name}</StationName>
            <StationMeta>
              {station.powerKw} kW · {station.address}
            </StationMeta>
          </div>
        </StationLine>
      )}
      <Form onSubmit={submit}>
        <Field
          label="Procent baterie curent"
          hint="Folosit pentru estimarea timpului de încărcare (0–99%)."
        >
          <Input
            type="number"
            min={0}
            max={99}
            value={batteryRaw}
            onChange={(e) => setBatteryRaw(e.target.value)}
          />
        </Field>
        {error && <Banner>{error}</Banner>}
        <Actions>
          <Button type="button" $variant="secondary" $full onClick={onClose}>
            Renunță
          </Button>
          <Button type="submit" $full disabled={create.isPending}>
            {create.isPending ? 'Se rezervă…' : 'Confirmă rezervarea'}
          </Button>
        </Actions>
      </Form>
    </Dialog>
  );
}
