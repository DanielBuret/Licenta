import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { HamburgerMenu } from './HamburgerMenu';

const Bar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(6)}`};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Brand = styled(Link)`
  font-weight: 700;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
`;

export function AppHeader() {
  return (
    <Bar>
      <Brand to="/">⚡ Charging Station Oradea</Brand>
      <HamburgerMenu />
    </Bar>
  );
}
