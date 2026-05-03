import styled from 'styled-components';
import { useState } from 'react';
import { Button, Input, Select, Field } from '../../components/ui';
import { useCarModels } from '../../hooks/useCarModels';
import type { AdminUser } from '../../hooks/useAdminUsers';

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
  max-width: 480px;
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

const Notice = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`;

export type UserDialogMode =
  | { kind: 'add' }
  | { kind: 'email'; user: AdminUser }
  | { kind: 'password'; user: AdminUser }
  | { kind: 'delete'; user: AdminUser };

interface AddValues {
  email: string;
  password: string;
  fullName: string;
  carModelId: number | null;
  role: 'user' | 'admin';
}

interface Props {
  mode: UserDialogMode;
  onClose: () => void;
  onAdd: (v: AddValues) => Promise<void>;
  onChangeEmail: (id: string, email: string) => Promise<void>;
  onChangePassword: (id: string, password: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function UserDialog(props: Props) {
  const { mode, onClose } = props;
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function run(fn: () => Promise<void>) {
    setError(null);
    setSubmitting(true);
    try {
      await fn();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message ?? 'Eroare la salvare.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Backdrop onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        {mode.kind === 'add' && (
          <AddForm
            error={error}
            submitting={submitting}
            onCancel={onClose}
            onSubmit={(v) => run(() => props.onAdd(v))}
          />
        )}
        {mode.kind === 'email' && (
          <SingleFieldForm
            title="Schimbă email"
            label="Email nou"
            type="email"
            initial={mode.user.email}
            submitLabel="Salvează"
            error={error}
            submitting={submitting}
            onCancel={onClose}
            onSubmit={(v) => run(() => props.onChangeEmail(mode.user.id, v))}
          />
        )}
        {mode.kind === 'password' && (
          <SingleFieldForm
            title="Schimbă parola"
            label="Parolă nouă (min. 6 caractere)"
            type="password"
            initial=""
            submitLabel="Salvează"
            minLength={6}
            error={error}
            submitting={submitting}
            onCancel={onClose}
            onSubmit={(v) => run(() => props.onChangePassword(mode.user.id, v))}
          />
        )}
        {mode.kind === 'delete' && (
          <DeleteConfirm
            user={mode.user}
            error={error}
            submitting={submitting}
            onCancel={onClose}
            onConfirm={() => run(() => props.onDelete(mode.user.id))}
          />
        )}
      </Card>
    </Backdrop>
  );
}

function AddForm({
  error,
  submitting,
  onCancel,
  onSubmit,
}: {
  error: string | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (v: AddValues) => void;
}) {
  const { data: carModels = [] } = useCarModels();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [carModelId, setCarModelId] = useState<string>('');
  const [role, setRole] = useState<'user' | 'admin'>('user');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      carModelId: carModelId ? Number(carModelId) : null,
      role,
    });
  }

  return (
    <>
      <h2 style={{ margin: 0 }}>Adaugă utilizator</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Parolă (min. 6 caractere)">
          <Input
            type="password"
            value={password}
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Field label="Nume complet">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>
        <Field label="Mașină (opțional)">
          <Select value={carModelId} onChange={(e) => setCarModelId(e.target.value)}>
            <option value="">— fără —</option>
            {carModels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.brand} {c.model} ({Number(c.batteryCapacityKwh)} kWh)
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Rol">
          <Select value={role} onChange={(e) => setRole(e.target.value as 'user' | 'admin')}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </Select>
        </Field>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Row>
          <Button type="button" $variant="secondary" $full onClick={onCancel}>
            Renunță
          </Button>
          <Button type="submit" $full disabled={submitting}>
            {submitting ? 'Se salvează…' : 'Creează'}
          </Button>
        </Row>
      </form>
    </>
  );
}

function SingleFieldForm({
  title,
  label,
  type,
  initial,
  submitLabel,
  minLength,
  error,
  submitting,
  onCancel,
  onSubmit,
}: {
  title: string;
  label: string;
  type: 'email' | 'password' | 'text';
  initial: string;
  submitLabel: string;
  minLength?: number;
  error: string | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(value);
  }

  return (
    <>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Field label={label}>
          <Input
            type={type}
            value={value}
            minLength={minLength}
            onChange={(e) => setValue(e.target.value)}
            required
            autoFocus
          />
        </Field>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Row>
          <Button type="button" $variant="secondary" $full onClick={onCancel}>
            Renunță
          </Button>
          <Button type="submit" $full disabled={submitting}>
            {submitting ? 'Se salvează…' : submitLabel}
          </Button>
        </Row>
      </form>
    </>
  );
}

function DeleteConfirm({
  user,
  error,
  submitting,
  onCancel,
  onConfirm,
}: {
  user: AdminUser;
  error: string | null;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <h2 style={{ margin: 0 }}>Șterge utilizator</h2>
      <Notice>
        Sigur ștergi <strong>{user.email}</strong>? Această acțiune este ireversibilă și șterge și
        rezervările asociate.
      </Notice>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <Row>
        <Button type="button" $variant="secondary" $full onClick={onCancel}>
          Renunță
        </Button>
        <Button type="button" $variant="danger" $full disabled={submitting} onClick={onConfirm}>
          {submitting ? 'Se șterge…' : 'Șterge'}
        </Button>
      </Row>
    </>
  );
}
