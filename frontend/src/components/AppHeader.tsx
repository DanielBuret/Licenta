import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from './ui';

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

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export function AppHeader() {
  const { session, user } = useAuth();

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <Bar>
      <Brand to="/">⚡ Charging Station Oradea</Brand>
      <Right>
        {session ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <span>{user?.email}</span>
            <Button $variant="secondary" onClick={signOut}>
              Deconectare
            </Button>
          </>
        ) : (
          <>
            <Link to="/login">Autentificare</Link>
            <Button as={Link as any} to="/register">
              Cont nou
            </Button>
          </>
        )}
      </Right>
    </Bar>
  );
}
