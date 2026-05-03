import styled from 'styled-components';
import { NavLink, Outlet } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';

const Page = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 0;
`;

const Sidebar = styled.aside`
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing(5)} ${({ theme }) => theme.spacing(3)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const SectionLabel = styled.div`
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(3)}`};
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.textSubtle};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const Item = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2.5)};
  padding: ${({ theme }) => `${theme.spacing(2.5)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 500;
  font-size: 0.875rem;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};
  svg {
    flex-shrink: 0;
  }
  &.active {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }
  &:hover:not(.active) {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Main = styled.main`
  overflow: auto;
  background: ${({ theme }) => theme.colors.background};
`;

export function AdminLayout() {
  return (
    <Page>
      <AppHeader />
      <Body>
        <Sidebar>
          <SectionLabel>Administrare</SectionLabel>
          <Item to="/admin/stations" end>
            <StationsIcon />
            <span>Stații</span>
          </Item>
          <Item to="/admin/users">
            <UsersIcon />
            <span>Utilizatori</span>
          </Item>
          <Item to="/admin/reservations">
            <ReservationsIcon />
            <span>Rezervări</span>
          </Item>
        </Sidebar>
        <Main>
          <Outlet />
        </Main>
      </Body>
    </Page>
  );
}

function StationsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ReservationsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
