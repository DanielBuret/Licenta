import styled from 'styled-components';
import { useMemo, useState } from 'react';
import { useStations, type StationListItem } from '../../hooks/useStations';
import { useDeleteStation, useUpdateStation } from '../../hooks/useAdminStationMutations';
import { StationFormDialog, type StationFormValues } from './StationFormDialog';
import { ActionMenu, Input } from '../../components/ui';
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

const SearchWrap = styled.div`
  width: 320px;
  max-width: 100%;
  position: relative;
  svg {
    position: absolute;
    top: 50%;
    left: 12px;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.colors.textSubtle};
    pointer-events: none;
  }
  input {
    padding-left: 38px;
  }
`;

const Count = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-left: auto;
`;

interface EditingStation extends StationFormValues {
  id: number;
}

function statusFor(s: {
  hasCharging: boolean;
  hasReserved: boolean;
}): 'free' | 'reserved' | 'charging' {
  if (s.hasCharging) return 'charging';
  if (s.hasReserved) return 'reserved';
  return 'free';
}

const STATUS_LABEL = { free: 'liberă', reserved: 'rezervată', charging: 'încărcare' } as const;

export function AdminStationsTable() {
  const { data: stations = [], isLoading } = useStations();
  const update = useUpdateStation();
  const remove = useDeleteStation();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EditingStation | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter(
      (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q),
    );
  }, [stations, search]);

  async function handleDelete(s: StationListItem) {
    if (!confirm(`Ștergi „${s.name}”?`)) return;
    try {
      await remove.mutateAsync(s.id);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      alert(
        e.response?.data?.error?.message ??
          'Stația nu poate fi ștearsă (poate are rezervări active).',
      );
    }
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitleGroup>
          <PageTitle>Stații</PageTitle>
          <PageSubtitle>
            Gestionează stațiile din rețea — adaugă pe hartă, editează sau șterge
          </PageSubtitle>
        </PageTitleGroup>
      </PageHeader>

      <Toolbar>
        <SearchWrap>
          <SearchIcon />
          <Input
            type="search"
            placeholder="Caută după nume sau adresă…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SearchWrap>
        <Count>
          {visible.length} / {stations.length} stații
        </Count>
      </Toolbar>

      <Card>
        {isLoading ? (
          <EmptyState>Se încarcă…</EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState>
            {search
              ? 'Nicio stație nu se potrivește.'
              : 'Nu există stații. Adaugă una din tab-ul Hartă.'}
          </EmptyState>
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nume</th>
                  <th>Adresă</th>
                  <th>Coordonate</th>
                  <th>Putere</th>
                  <th>Status</th>
                  <th>Coadă</th>
                  <th style={{ textAlign: 'right' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => {
                  const status = statusFor(s);
                  return (
                    <tr key={s.id}>
                      <td>
                        <Mono>#{s.id}</Mono>
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td style={{ color: '#64748b' }}>{s.address}</td>
                      <td>
                        <Mono>
                          {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                        </Mono>
                      </td>
                      <td style={{ fontWeight: 500 }}>{s.powerKw} kW</td>
                      <td>
                        <StatusPill
                          $tone={
                            status === 'charging'
                              ? 'red'
                              : status === 'reserved'
                                ? 'amber'
                                : 'green'
                          }
                        >
                          {STATUS_LABEL[status]}
                        </StatusPill>
                      </td>
                      <td>{s.activeReservations}</td>
                      <td style={{ textAlign: 'right' }}>
                        <ActionMenu
                          align="right"
                          items={[
                            {
                              label: 'Editează',
                              onClick: () =>
                                setEditing({
                                  id: s.id,
                                  name: s.name,
                                  address: s.address,
                                  latitude: s.latitude,
                                  longitude: s.longitude,
                                  powerKw: s.powerKw,
                                }),
                            },
                            {
                              label: 'Șterge',
                              variant: 'danger',
                              disabled: remove.isPending,
                              onClick: () => handleDelete(s),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Card>

      {editing && (
        <StationFormDialog
          initial={editing}
          title={`Editare „${editing.name}”`}
          submitLabel="Salvează"
          onClose={() => setEditing(null)}
          onSubmit={async (values) => {
            await update.mutateAsync({ id: editing.id, ...values });
          }}
        />
      )}
    </PageContainer>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
