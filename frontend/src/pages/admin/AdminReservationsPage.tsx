import styled from 'styled-components';
import { useMemo, useState } from 'react';
import { useAdminReservations } from '../../hooks/useAdminReservations';
import {
  useAdminCancelReservation,
  useAdminFinishReservation,
} from '../../hooks/useAdminReservationMutations';
import { ActionMenu, Select } from '../../components/ui';
import {
  Card,
  DensityToggle,
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
  min-width: 180px;
`;

const FilterLabel = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-right: ${({ theme }) => theme.spacing(2)};
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
`;

type SortKey = 'newest' | 'oldest' | 'station' | 'user';
type Period = 'all' | 'today' | 'week' | 'month';

const STATUSES: Array<ReservationStatus | ''> = [
  '',
  'reserved',
  'charging',
  'completed',
  'cancelled',
];

const STATUS_LABELS: Record<ReservationStatus | '', string> = {
  '': 'Toate statusurile',
  reserved: 'Rezervate',
  charging: 'În încărcare',
  completed: 'Finalizate',
  cancelled: 'Anulate',
};

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'newest', label: 'Cele mai noi' },
  { value: 'oldest', label: 'Cele mai vechi' },
  { value: 'station', label: 'După stație (A-Z)' },
  { value: 'user', label: 'După utilizator (A-Z)' },
];

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: 'all', label: 'Toată perioada' },
  { value: 'today', label: 'Astăzi' },
  { value: 'week', label: 'Ultimele 7 zile' },
  { value: 'month', label: 'Ultimele 30 zile' },
];

function toneFor(status: string): 'green' | 'amber' | 'red' | 'gray' {
  if (status === 'charging') return 'red';
  if (status === 'reserved') return 'amber';
  if (status === 'completed') return 'green';
  return 'gray';
}

function periodCutoff(period: Period): number | null {
  if (period === 'all') return null;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (period === 'today') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (period === 'week') return now - 7 * day;
  return now - 30 * day;
}

export function AdminReservationsPage() {
  const [status, setStatus] = useState<ReservationStatus | ''>('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [period, setPeriod] = useState<Period>('all');
  const [compact, setCompact] = useState(false);

  const { data: reservations = [], isLoading } = useAdminReservations(status || undefined);
  const cancel = useAdminCancelReservation();
  const finish = useAdminFinishReservation();

  const visible = useMemo(() => {
    const cutoff = periodCutoff(period);
    let list = [...reservations];
    if (cutoff != null) {
      list = list.filter((r) => new Date(r.reservedAt).getTime() >= cutoff);
    }
    list.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.reservedAt).getTime() - new Date(b.reservedAt).getTime();
        case 'station':
          return a.station.name.localeCompare(b.station.name, 'ro');
        case 'user':
          return a.user.fullName.localeCompare(b.user.fullName, 'ro');
        case 'newest':
        default:
          return new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime();
      }
    });
    return list;
  }, [reservations, period, sort]);

  return (
    <PageContainer>
      <PageHeader>
        <PageTitleGroup>
          <PageTitle>Rezervări</PageTitle>
          <PageSubtitle>Toate rezervările din sistem, cu filtre și acțiuni admin</PageSubtitle>
        </PageTitleGroup>
      </PageHeader>

      <Toolbar>
        <FilterGroup>
          <FilterLabel>Status</FilterLabel>
          <FilterBox>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReservationStatus | '')}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </FilterBox>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Perioadă</FilterLabel>
          <FilterBox>
            <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </FilterBox>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Sortare</FilterLabel>
          <FilterBox>
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </FilterBox>
        </FilterGroup>

        <DensityToggle
          $active={compact}
          onClick={() => setCompact((v) => !v)}
          title={compact ? 'Vizualizare confortabilă' : 'Vizualizare compactă'}
          aria-pressed={compact}
        >
          {compact ? <ExpandIcon /> : <CompactIcon />}
          {compact ? 'Expand' : 'Compact'}
        </DensityToggle>
      </Toolbar>

      <Card>
        {isLoading ? (
          <EmptyState>Se încarcă…</EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState>Nicio rezervare cu filtrele curente.</EmptyState>
        ) : (
          <TableScroll>
            <Table $compact={compact}>
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
                  <th style={{ textAlign: 'right' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const items = [];
                  if (r.status === 'charging') {
                    items.push({
                      label: 'Forțează finalizare',
                      onClick: () => finish.mutate(r.id),
                      disabled: finish.isPending,
                    });
                  }
                  if (r.status === 'reserved' || r.status === 'charging') {
                    items.push({
                      label: 'Anulează rezervarea',
                      onClick: () => cancel.mutate(r.id),
                      variant: 'danger' as const,
                      disabled: cancel.isPending,
                    });
                  }
                  return (
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
                      <td style={{ textAlign: 'right' }}>
                        {items.length > 0 ? (
                          <ActionMenu align="right" items={items} />
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Card>
    </PageContainer>
  );
}

function CompactIcon() {
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
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="3" y1="14" x2="21" y2="14" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function ExpandIcon() {
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
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
