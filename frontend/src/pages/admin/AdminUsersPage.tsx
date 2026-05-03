import styled from 'styled-components';
import { useAdminUsers } from '../../hooks/useAdminUsers';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing(6)};
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

const RoleBadge = styled.span<{ $role: string }>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing(0.5)} ${theme.spacing(2)}`};
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $role, theme }) =>
    $role === 'admin' ? theme.colors.primary : theme.colors.background};
  color: ${({ $role, theme }) => ($role === 'admin' ? 'white' : theme.colors.text)};
`;

export function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();

  return (
    <Container>
      <h1 style={{ marginTop: 0 }}>Utilizatori</h1>
      {isLoading ? (
        <p>Se încarcă…</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Nume complet</th>
              <th>Mașină</th>
              <th>Rol</th>
              <th>Înregistrat</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.fullName}</td>
                <td>
                  {u.carModel
                    ? `${u.carModel.brand} ${u.carModel.model} (${u.carModel.batteryCapacityKwh} kWh)`
                    : '—'}
                </td>
                <td>
                  <RoleBadge $role={u.role}>{u.role}</RoleBadge>
                </td>
                <td>{new Date(u.createdAt).toLocaleString('ro-RO')}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
