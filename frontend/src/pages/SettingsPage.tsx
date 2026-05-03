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
  align-items: baseline;
  justify-content: space-between;
`;

const QuickLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-size: 0.875rem;
  &:hover {
    text-decoration: underline;
  }
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing(6)};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const SuccessBanner = styled.div`
  padding: ${({ theme }) => theme.spacing(3)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: #dcfce7;
  color: ${({ theme }) => theme.colors.success};
  font-size: 0.875rem;
`;

const ErrorBanner = styled.div`
  padding: ${({ theme }) => theme.spacing(3)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: #fee2e2;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.875rem;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
  justify-content: flex-end;
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
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Eroare la salvare.');
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
          <h1 style={{ margin: 0 }}>Setări</h1>
          <QuickLink to="/profile">← Vezi profilul</QuickLink>
        </HeaderRow>

        <Section>
          {profileLoading || !profile ? (
            <p>Se încarcă…</p>
          ) : (
            <Form onSubmit={submit}>
              <Field label="Email (nu poate fi modificat aici)">
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
              {error && <ErrorBanner>{error}</ErrorBanner>}
              {success && <SuccessBanner>Setările au fost salvate.</SuccessBanner>}
              <ButtonRow>
                <Button
                  type="button"
                  $variant="secondary"
                  onClick={reset}
                  disabled={!dirty || update.isPending}
                >
                  Anulează modificările
                </Button>
                <Button type="submit" disabled={!dirty || update.isPending}>
                  {update.isPending ? 'Se salvează…' : 'Salvează'}
                </Button>
              </ButtonRow>
            </Form>
          )}
        </Section>
      </Container>
    </Page>
  );
}
