import styled from 'styled-components';
import { useState } from 'react';
import { useAdminUsers, type AdminUser } from '../../hooks/useAdminUsers';
import {
  useCreateAdminUser,
  useDeleteAdminUser,
  useSetAdminUserEmail,
  useSetAdminUserPassword,
  useSetAdminUserRole,
} from '../../hooks/useAdminUserMutations';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui';
import { UserDialog, type UserDialogMode } from './UserDialog';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing(6)};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
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

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  padding: 0;
  font-size: 0.8125rem;
  &:hover {
    text-decoration: underline;
  }
  &:disabled {
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
    text-decoration: none;
  }
`;

const ActionDanger = styled(ActionButton)`
  color: ${({ theme }) => theme.colors.danger};
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export function AdminUsersPage() {
  const { session } = useAuth();
  const { data: users = [], isLoading } = useAdminUsers();
  const createUser = useCreateAdminUser();
  const deleteUser = useDeleteAdminUser();
  const setRole = useSetAdminUserRole();
  const setEmail = useSetAdminUserEmail();
  const setPassword = useSetAdminUserPassword();
  const [dialog, setDialog] = useState<UserDialogMode | null>(null);

  const currentUserId = session?.user.id;

  return (
    <Container>
      <Header>
        <h1 style={{ margin: 0 }}>Utilizatori</h1>
        <Button onClick={() => setDialog({ kind: 'add' })}>+ Adaugă utilizator</Button>
      </Header>
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
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === currentUserId}
                onChangeRole={(role) => setRole.mutate({ id: u.id, role })}
                onEditEmail={() => setDialog({ kind: 'email', user: u })}
                onEditPassword={() => setDialog({ kind: 'password', user: u })}
                onDelete={() => setDialog({ kind: 'delete', user: u })}
              />
            ))}
          </tbody>
        </Table>
      )}

      {dialog && (
        <UserDialog
          mode={dialog}
          onClose={() => setDialog(null)}
          onAdd={async (v) => {
            await createUser.mutateAsync(v);
          }}
          onChangeEmail={async (id, email) => {
            await setEmail.mutateAsync({ id, email });
          }}
          onChangePassword={async (id, password) => {
            await setPassword.mutateAsync({ id, password });
          }}
          onDelete={async (id) => {
            await deleteUser.mutateAsync(id);
          }}
        />
      )}
    </Container>
  );
}

function UserRow({
  user,
  isSelf,
  onChangeRole,
  onEditEmail,
  onEditPassword,
  onDelete,
}: {
  user: AdminUser;
  isSelf: boolean;
  onChangeRole: (role: 'user' | 'admin') => void;
  onEditEmail: () => void;
  onEditPassword: () => void;
  onDelete: () => void;
}) {
  const nextRole = user.role === 'admin' ? 'user' : 'admin';
  const roleLabel = nextRole === 'admin' ? 'Fă admin' : 'Fă user';

  return (
    <tr>
      <td>{user.email}</td>
      <td>{user.fullName}</td>
      <td>
        {user.carModel
          ? `${user.carModel.brand} ${user.carModel.model} (${user.carModel.batteryCapacityKwh} kWh)`
          : '—'}
      </td>
      <td>
        <RoleBadge $role={user.role}>{user.role}</RoleBadge>
      </td>
      <td>{new Date(user.createdAt).toLocaleString('ro-RO')}</td>
      <td>
        <ActionRow>
          <ActionButton onClick={onEditEmail}>Email</ActionButton>
          <ActionButton onClick={onEditPassword}>Parolă</ActionButton>
          <ActionButton
            onClick={() => onChangeRole(nextRole)}
            disabled={isSelf}
            title={isSelf ? 'Nu îți poți schimba propriul rol' : undefined}
          >
            {roleLabel}
          </ActionButton>
          <ActionDanger
            onClick={onDelete}
            disabled={isSelf}
            title={isSelf ? 'Nu te poți șterge pe tine însuți' : undefined}
          >
            Șterge
          </ActionDanger>
        </ActionRow>
      </td>
    </tr>
  );
}
