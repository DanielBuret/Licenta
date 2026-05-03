import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { useProfile } from '../hooks/useProfile';
import { useCarModels } from '../hooks/useCarModels';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { Button, Field, Input, Select } from '../components/ui';

const Page = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
`;

const Container = styled.main`
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing(8)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(6)};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9375rem;
`;

const QuickLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: background ${({ theme }) => theme.transitions.fast};
  &:hover {
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Card = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing(7)};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(5)};
`;

const Banner = styled.div<{ $tone: 'success' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.875rem;
  font-weight: 500;
  ${({ $tone, theme }) =>
    $tone === 'success'
      ? `background: ${theme.colors.statusFreeSoft}; color: ${theme.colors.success};`
      : `background: ${theme.colors.dangerSoft}; color: ${theme.colors.danger};`}
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
  justify-content: flex-end;
  padding-top: ${({ theme }) => theme.spacing(2)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export function SettingsPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: cars = [], isLoading: carsLoading } = useCarModels();
  const update = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [carModelId, setCarModelId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setCarModelId(profile.carModelId ? String(profile.carModelId) : '');
    }
  }, [profile]);

  const dirty =
    profile &&
    (fullName.trim() !== profile.fullName ||
      (carModelId === '' ? null : Number(carModelId)) !== profile.carModelId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Numele complet este obligatoriu (cel puțin 2 caractere).');
      return;
    }
    try {
      await update.mutateAsync({
        fullName: fullName.trim(),
        carModelId: carModelId === '' ? null : Number(carModelId),
      });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message ?? 'Eroare la salvare.');
    }
  }

  function reset() {
    if (!profile) return;
    setFullName(profile.fullName);
    setCarModelId(profile.carModelId ? String(profile.carModelId) : '');
    setError(null);
    setSuccess(false);
  }

  return (
    <Page>
      <AppHeader />
      <Container>
        <HeaderRow>
          <div>
            <Title>Setări</Title>
            <Subtitle>Modifică numele și mașina asociată contului.</Subtitle>
          </div>
          <QuickLink to="/profile">← Vezi profilul</QuickLink>
        </HeaderRow>

        <Card>
          {profileLoading || !profile ? (
            <p style={{ margin: 0 }}>Se încarcă…</p>
          ) : (
            <Form onSubmit={submit}>
              <Field label="Email" hint="Email-ul nu poate fi modificat aici.">
                <Input value={profile.email} disabled />
              </Field>
              <Field label="Nume complet">
                <Input
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setSuccess(false);
                  }}
                />
              </Field>
              <Field label="Modelul mașinii">
                <Select
                  value={carModelId}
                  onChange={(e) => {
                    setCarModelId(e.target.value);
                    setSuccess(false);
                  }}
                  disabled={carsLoading}
                >
                  <option value="">— Fără mașină —</option>
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} ({c.batteryCapacityKwh} kWh)
                    </option>
                  ))}
                </Select>
              </Field>
              {error && <Banner $tone="danger">{error}</Banner>}
              {success && <Banner $tone="success">Setările au fost salvate.</Banner>}
              <ButtonRow>
                <Button
                  type="button"
                  $variant="secondary"
                  onClick={reset}
                  disabled={!dirty || update.isPending}
                >
                  Renunță
                </Button>
                <Button type="submit" disabled={!dirty || update.isPending}>
                  {update.isPending ? 'Se salvează…' : 'Salvează'}
                </Button>
              </ButtonRow>
            </Form>
          )}
        </Card>
      </Container>
    </Page>
  );
}
