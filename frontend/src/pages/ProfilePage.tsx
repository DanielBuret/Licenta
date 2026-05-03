import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { useProfile } from '../hooks/useProfile';
import { StatusPill } from '../components/admin/AdminUI';

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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  background: ${({ theme }) => theme.colors.primarySoft};
  transition: filter ${({ theme }) => theme.transitions.fast};
  &:hover {
    filter: brightness(0.96);
  }
`;

const Card = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing(6)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const HeroRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(4)};
  padding-bottom: ${({ theme }) => theme.spacing(5)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const Avatar = styled.div<{ $hue: number }>`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
  background: ${({ $hue }) => `hsl(${$hue}, 70%, 92%)`};
  color: ${({ $hue }) => `hsl(${$hue}, 60%, 32%)`};
`;

const Name = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const Email = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
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
  color: ${({ theme }) => theme.colors.text};
`;

function hashHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || '?'
  );
}

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  return (
    <Page>
      <AppHeader />
      <Container>
        <HeaderRow>
          <div>
            <Title>Profilul meu</Title>
            <Subtitle>Detaliile contului tău și mașina asociată.</Subtitle>
          </div>
          <QuickLink to="/settings">Editează →</QuickLink>
        </HeaderRow>

        <Card>
          {isLoading || !profile ? (
            <p style={{ margin: 0 }}>Se încarcă…</p>
          ) : (
            <>
              <HeroRow>
                <Avatar $hue={hashHue(profile.fullName || profile.email)}>
                  {initials(profile.fullName || profile.email)}
                </Avatar>
                <div>
                  <Name>{profile.fullName || '—'}</Name>
                  <Email>{profile.email}</Email>
                </div>
              </HeroRow>

              <Row>
                <Label>Mașină</Label>
                <Value>
                  {profile.carModel
                    ? `${profile.carModel.brand} ${profile.carModel.model} · ${profile.carModel.batteryCapacityKwh} kWh`
                    : '—'}
                </Value>
              </Row>
              <Row>
                <Label>Rol</Label>
                <Value>
                  <StatusPill $tone={profile.role === 'admin' ? 'blue' : 'gray'}>
                    {profile.role}
                  </StatusPill>
                </Value>
              </Row>
            </>
          )}
        </Card>
      </Container>
    </Page>
  );
}
