import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { useProfile } from '../hooks/useProfile';

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
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: ${({ theme }) => theme.spacing(4)};
  align-items: center;
  padding: ${({ theme }) => theme.spacing(3)} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child {
    border-bottom: none;
  }
`;

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`;

const Value = styled.span`
  font-weight: 500;
`;

const Pill = styled.span<{ $role: string }>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(2)}`};
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $role, theme }) =>
    $role === 'admin' ? theme.colors.primary : theme.colors.background};
  color: ${({ $role, theme }) => ($role === 'admin' ? 'white' : theme.colors.text)};
`;

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  return (
    <Page>
      <AppHeader />
      <Container>
        <HeaderRow>
          <h1 style={{ margin: 0 }}>Profilul meu</h1>
          <QuickLink to="/settings">Editează în Setări →</QuickLink>
        </HeaderRow>

        <Section>
          {isLoading || !profile ? (
            <p>Se încarcă…</p>
          ) : (
            <>
              <Row>
                <Label>Email</Label>
                <Value>{profile.email}</Value>
              </Row>
              <Row>
                <Label>Nume complet</Label>
                <Value>{profile.fullName || '—'}</Value>
              </Row>
              <Row>
                <Label>Mașină</Label>
                <Value>
                  {profile.carModel
                    ? `${profile.carModel.brand} ${profile.carModel.model} (${profile.carModel.batteryCapacityKwh} kWh)`
                    : '—'}
                </Value>
              </Row>
              <Row>
                <Label>Rol</Label>
                <Value>
                  <Pill $role={profile.role}>{profile.role}</Pill>
                </Value>
              </Row>
            </>
          )}
        </Section>
      </Container>
    </Page>
  );
}
