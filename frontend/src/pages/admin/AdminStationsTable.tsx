import styled from 'styled-components';
import { useMemo, useState } from 'react';
import { useStations, type StationListItem } from '../../hooks/useStations';
import { useDeleteStation, useUpdateStation } from '../../hooks/useAdminStationMutations';
import { StationFormDialog, type StationFormValues } from './StationFormDialog';
import { Button, Input } from '../../components/ui';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing(6)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const SearchWrap = styled.div`
  max-width: 360px;
  flex: 1;
`;

const Count = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const TableWrap = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: auto;
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 0.875rem;
    vertical-align: middle;
  }
  th {
    background: ${({ theme }) => theme.colors.background};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.75rem;
    white-space: nowrap;
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
  tbody tr:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const StatusPill = styled.span<{ $status: 'free' | 'reserved' | 'charging' }>`
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
        : theme.colors.statusFree};
  color: white;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  white-space: nowrap;
`;

const SmallButton = styled(Button)`
  padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(3)}`};
  font-size: 0.8125rem;
`;

const Mono = styled.span`
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
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
    } catch (err: any) {
      alert(
        err?.response?.data?.error?.message ??
          'Stația nu poate fi ștearsă (poate are rezervări active).',
      );
    }
  }

  return (
    <Container>
      <Toolbar>
        <SearchWrap>
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

      <TableWrap>
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
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>
                  Se încarcă…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>
                  {search
                    ? 'Nicio stație nu se potrivește.'
                    : 'Nu există stații. Adaugă una din tab-ul Hartă.'}
                </td>
              </tr>
            ) : (
              visible.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Mono>#{s.id}</Mono>
                  </td>
                  <td>
                    <strong>{s.name}</strong>
                  </td>
                  <td>{s.address}</td>
                  <td>
                    <Mono>
                      {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                    </Mono>
                  </td>
                  <td>{s.powerKw} kW</td>
                  <td>
                    <StatusPill $status={statusFor(s)}>{statusFor(s)}</StatusPill>
                  </td>
                  <td>{s.activeReservations}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Actions style={{ justifyContent: 'flex-end' }}>
                      <SmallButton
                        $variant="secondary"
                        onClick={() =>
                          setEditing({
                            id: s.id,
                            name: s.name,
                            address: s.address,
                            latitude: s.latitude,
                            longitude: s.longitude,
                            powerKw: s.powerKw,
                          })
                        }
                      >
                        Editează
                      </SmallButton>
                      <SmallButton
                        $variant="danger"
                        onClick={() => handleDelete(s)}
                        disabled={remove.isPending}
                      >
                        Șterge
                      </SmallButton>
                    </Actions>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableWrap>

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
    </Container>
  );
}
