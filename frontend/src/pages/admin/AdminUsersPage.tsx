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
import { ActionMenu, Button } from '../../components/ui';
import {
  Card,
  EmptyState,
  PageContainer,
  PageHeader,
  PageSubtitle,
  PageTitle,
  PageTitleGroup,
  StatusPill,
  Table,
  TableScroll,
} from '../../components/admin/AdminUI';
import { UserDialog, type UserDialogMode } from './UserDialog';

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
    <PageContainer>
      <PageHeader>
        <PageTitleGroup>
          <PageTitle>Utilizatori</PageTitle>
          <PageSubtitle>Gestionează conturile utilizatorilor și rolurile lor</PageSubtitle>
        </PageTitleGroup>
        <Button onClick={() => setDialog({ kind: 'add' })}>+ Adaugă utilizator</Button>
      </PageHeader>

      <Card>
        {isLoading ? (
          <EmptyState>Se încarcă…</EmptyState>
        ) : users.length === 0 ? (
          <EmptyState>Nu există utilizatori încă.</EmptyState>
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>Utilizator</th>
                  <th>Mașină</th>
                  <th>Rol</th>
                  <th>Înregistrat</th>
                  <th style={{ textAlign: 'right' }}>Acțiuni</th>
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
          </TableScroll>
        )}
      </Card>

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
    </PageContainer>
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
  const roleLabel = nextRole === 'admin' ? 'Promovează admin' : 'Retrogradează user';

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={user.fullName} />
          <div>
            <div style={{ fontWeight: 600 }}>{user.fullName}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{user.email}</div>
          </div>
        </div>
      </td>
      <td>
        {user.carModel ? (
          <div>
            <div style={{ fontWeight: 500 }}>
              {user.carModel.brand} {user.carModel.model}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {user.carModel.batteryCapacityKwh} kWh
            </div>
          </div>
        ) : (
          <span style={{ color: '#94a3b8' }}>—</span>
        )}
      </td>
      <td>
        <StatusPill $tone={user.role === 'admin' ? 'blue' : 'gray'}>{user.role}</StatusPill>
      </td>
      <td style={{ color: '#64748b' }}>
        {new Date(user.createdAt).toLocaleDateString('ro-RO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </td>
      <td style={{ textAlign: 'right' }}>
        <ActionMenu
          align="right"
          items={[
            { label: 'Schimbă email', onClick: onEditEmail },
            { label: 'Schimbă parola', onClick: onEditPassword },
            {
              label: roleLabel,
              onClick: () => onChangeRole(nextRole),
              disabled: isSelf,
            },
            {
              label: 'Șterge utilizatorul',
              onClick: onDelete,
              variant: 'danger',
              disabled: isSelf,
            },
          ]}
        />
      </td>
    </tr>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
  const hue = hashHue(name);
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: `hsl(${hue}, 70%, 92%)`,
        color: `hsl(${hue}, 60%, 32%)`,
        display: 'grid',
        placeItems: 'center',
        fontSize: '0.8125rem',
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials || '?'}
    </div>
  );
}

function hashHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}
