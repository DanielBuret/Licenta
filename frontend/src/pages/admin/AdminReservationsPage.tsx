import styled from 'styled-components';
import { useState } from 'react';
import { useAdminReservations } from '../../hooks/useAdminReservations';
import { Select } from '../../components/ui';
import {
  Card,
  EmptyState,
  Mono,
  PageContainer,
  PageHeader,
  PageSubtitle,
  PageTitle,
  PageTitleGroup,
  StatusPill,
  Table,
  TableScroll,
  Toolbar,
} from '../../components/admin/AdminUI';
import type { ReservationStatus } from '@charging-station/shared';

const FilterBox = styled.div`
  min-width: 200px;
`;

const STATUSES: Array<ReservationStatus | ''> = [
  '',
  'reserved',
  'charging',
  'completed',
  'cancelled',
];

const STATUS_LABELS: Record<ReservationStatus | '', string> = {
  '': 'Toate',
  reserved: 'Rezervate',
  charging: 'În încărcare',
  completed: 'Finalizate',
  cancelled: 'Anulate',
};

function toneFor(status: string): 'green' | 'amber' | 'red' | 'gray' {
  if (status === 'charging') return 'red';
  if (status === 'reserved') return 'amber';
  if (status === 'completed') return 'green';
  return 'gray';
}

export function AdminReservationsPage() {
  const [filter, setFilter] = useState<ReservationStatus | ''>('');
  const { data: reservations = [], isLoading } = useAdminReservations(filter || undefined);

  return (
    <PageContainer>
      <PageHeader>
        <PageTitleGroup>
          <PageTitle>Rezervări</PageTitle>
          <PageSubtitle>Toate rezervările din sistem, filtrabile după status</PageSubtitle>
        </PageTitleGroup>
        <Toolbar>
          <FilterBox>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ReservationStatus | '')}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </FilterBox>
        </Toolbar>
      </PageHeader>

      <Card>
        {isLoading ? (
          <EmptyState>Se încarcă…</EmptyState>
        ) : reservations.length === 0 ? (
          <EmptyState>Nicio rezervare {filter ? `cu status „${filter}”` : ''}.</EmptyState>
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Stație</th>
                  <th>Utilizator</th>
                  <th>Status</th>
                  <th>Coadă</th>
                  <th>Baterie</th>
                  <th>Rezervat</th>
                  <th>Început</th>
                  <th>Sfârșit</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Mono>#{r.id}</Mono>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.station.name}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.user.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.user.email}</div>
                    </td>
                    <td>
                      <StatusPill $tone={toneFor(r.status)}>{r.status}</StatusPill>
                    </td>
                    <td>
                      <Mono>#{r.queuePosition}</Mono>
                    </td>
                    <td>{r.batteryLevelStart}%</td>
                    <td style={{ color: '#64748b' }}>
                      {new Date(r.reservedAt).toLocaleString('ro-RO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {r.chargingStartedAt
                        ? new Date(r.chargingStartedAt).toLocaleString('ro-RO', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {r.chargingEndedAt
                        ? new Date(r.chargingEndedAt).toLocaleString('ro-RO', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Card>
    </PageContainer>
  );
}
