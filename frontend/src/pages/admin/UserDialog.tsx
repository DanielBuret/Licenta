import styled from 'styled-components';
import { useState } from 'react';
import { Button, Dialog, Input, Select, Field } from '../../components/ui';
import { useCarModels } from '../../hooks/useCarModels';
import type { AdminUser } from '../../hooks/useAdminUsers';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const ErrorBanner = styled.div`
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.875rem;
  font-weight: 500;
`;

const DangerCallout = styled.div`
  padding: ${({ theme }) => theme.spacing(4)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.dangerSoft};
  border: 1px solid rgba(220, 38, 38, 0.2);
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
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

  if (mode.kind === 'add') {
    return (
      <Dialog
        title="Adaugă utilizator"
        subtitle="Creează un cont nou cu email și parolă."
        onClose={onClose}
      >
        <AddForm
          error={error}
          submitting={submitting}
          onCancel={onClose}
          onSubmit={(v) => run(() => props.onAdd(v))}
        />
      </Dialog>
    );
  }

  if (mode.kind === 'email') {
    return (
      <Dialog title="Schimbă email" subtitle={`Pentru ${mode.user.fullName}`} onClose={onClose}>
        <SingleFieldForm
          label="Email nou"
          type="email"
          initial={mode.user.email}
          submitLabel="Salvează"
          error={error}
          submitting={submitting}
          onCancel={onClose}
          onSubmit={(v) => run(() => props.onChangeEmail(mode.user.id, v))}
        />
      </Dialog>
    );
  }

  if (mode.kind === 'password') {
    return (
      <Dialog title="Schimbă parola" subtitle={`Pentru ${mode.user.fullName}`} onClose={onClose}>
        <SingleFieldForm
          label="Parolă nouă"
          type="password"
          initial=""
          submitLabel="Salvează"
          minLength={6}
          hint="Min. 6 caractere."
          error={error}
          submitting={submitting}
          onCancel={onClose}
          onSubmit={(v) => run(() => props.onChangePassword(mode.user.id, v))}
        />
      </Dialog>
    );
  }

  return (
    <Dialog title="Șterge utilizator" onClose={onClose}>
      <DangerCallout>
        Ești pe cale să ștergi <strong>{mode.user.email}</strong>. Această acțiune este ireversibilă
        și șterge și rezervările asociate.
      </DangerCallout>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <Row>
        <Button type="button" $variant="secondary" $full onClick={onClose}>
          Renunță
        </Button>
        <Button
          type="button"
          $variant="danger"
          $full
          disabled={submitting}
          onClick={() => run(() => props.onDelete(mode.user.id))}
        >
          {submitting ? 'Se șterge…' : 'Șterge definitiv'}
        </Button>
      </Row>
    </Dialog>
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
    <Form onSubmit={submit}>
      <Field label="Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Parolă" hint="Min. 6 caractere.">
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
      <Row>
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
      </Row>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <Row>
        <Button type="button" $variant="secondary" $full onClick={onCancel}>
          Renunță
        </Button>
        <Button type="submit" $full disabled={submitting}>
          {submitting ? 'Se creează…' : 'Creează cont'}
        </Button>
      </Row>
    </Form>
  );
}

function SingleFieldForm({
  label,
  type,
  initial,
  submitLabel,
  minLength,
  hint,
  error,
  submitting,
  onCancel,
  onSubmit,
}: {
  label: string;
  type: 'email' | 'password' | 'text';
  initial: string;
  submitLabel: string;
  minLength?: number;
  hint?: string;
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
    <Form onSubmit={submit}>
      <Field label={label} hint={hint}>
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
    </Form>
  );
}
