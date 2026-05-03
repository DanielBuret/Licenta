import styled from 'styled-components';
import { useState } from 'react';
import { useAdminReservations } from '../../hooks/useAdminReservations';
import { Select } from '../../components/ui';
import type { ReservationStatus } from '@charging-station/shared';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing(6)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const Filters = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  max-width: 320px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.sm};
  th,
  td {
    padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 0.875rem;
  }
  th {
    background: ${({ theme }) => theme.colors.background};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.75rem;
  }
  tr:last-child td {
    border-bottom: none;
  }
`;

const StatusPill = styled.span<{ $status: string }>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing(0.5)} ${theme.spacing(2)}`};
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $status, theme }) =>
    $status === 'charging'
      ? theme.colors.statusCharging
      : $status === 'reserved'
        ? theme.colors.statusReserved
        : $status === 'completed'
          ? theme.colors.success
          : theme.colors.textMuted};
  color: white;
`;

const STATUSES: Array<ReservationStatus | ''> = [
  '',
  'reserved',
  'charging',
  'completed',
  'cancelled',
];

export function AdminReservationsPage() {
  const [filter, setFilter] = useState<ReservationStatus | ''>('');
  const { data: reservations = [], isLoading } = useAdminReservations(filter || undefined);

  return (
    <Container>
      <h1 style={{ margin: 0 }}>Rezervări</h1>
      <Filters>
        <label>Status:</label>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ReservationStatus | '')}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === '' ? 'Toate' : s}
            </option>
          ))}
        </Select>
      </Filters>
      {isLoading ? (
        <p>Se încarcă…</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Stație</th>
              <th>Utilizator</th>
              <th>Status</th>
              <th>Coadă</th>
              <th>Baterie start</th>
              <th>Rezervat</th>
              <th>Charging start</th>
              <th>Charging end</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.station.name}</td>
                <td>
                  {r.user.fullName} ({r.user.email})
                </td>
                <td>
                  <StatusPill $status={r.status}>{r.status}</StatusPill>
                </td>
                <td>{r.queuePosition}</td>
                <td>{r.batteryLevelStart}%</td>
                <td>{new Date(r.reservedAt).toLocaleString('ro-RO')}</td>
                <td>
                  {r.chargingStartedAt
                    ? new Date(r.chargingStartedAt).toLocaleString('ro-RO')
                    : '—'}
                </td>
                <td>
                  {r.chargingEndedAt ? new Date(r.chargingEndedAt).toLocaleString('ro-RO') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
