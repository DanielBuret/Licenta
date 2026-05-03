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
  padding: ${({ theme }) => theme.spacing(4)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Item = styled(NavLink)`
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  &.active {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
  }
  &:hover:not(.active) {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const Main = styled.main`
  overflow: auto;
`;

export function AdminLayout() {
  return (
    <Page>
      <AppHeader />
      <Body>
        <Sidebar>
          <Item to="/admin/stations" end>
            Stații
          </Item>
          <Item to="/admin/users">Utilizatori</Item>
          <Item to="/admin/reservations">Rezervări</Item>
        </Sidebar>
        <Main>
          <Outlet />
        </Main>
      </Body>
    </Page>
  );
}
