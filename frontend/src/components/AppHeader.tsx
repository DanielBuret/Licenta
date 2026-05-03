import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { HamburgerMenu } from './HamburgerMenu';

const Bar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing(3.5)} ${theme.spacing(6)}`};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;
  z-index: 100;
  /* Promote to its own compositor layer so route transitions don't repaint
     the header (and don't briefly steal the cursor sprite on macOS). */
  transform: translateZ(0);
`;

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: -0.01em;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  transition: opacity ${({ theme }) => theme.transitions.fast};
  &:hover {
    opacity: 0.75;
  }
`;

const Logo = styled.span`
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary} 0%,
    ${({ theme }) => theme.colors.primaryHover} 100%
  );
  color: white;
  font-size: 0.875rem;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
`;

const City = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 500;
`;

export function AppHeader() {
  return (
    <Bar>
      <Brand to="/">
        <Logo>⚡</Logo>
        <span>Charging Station</span>
        <City>· Oradea</City>
      </Brand>
      <HamburgerMenu />
    </Bar>
  );
}
