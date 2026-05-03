import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import { Button } from './ui';

const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const Backdrop = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition: opacity 180ms ease;
  z-index: 1000;
`;

const Drawer = styled.aside<{ $open: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  max-width: 92vw;
  background: ${({ theme }) => theme.colors.surface};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  transform: translateX(${({ $open }) => ($open ? '0' : '100%')});
  transition: transform 220ms ease;
  display: flex;
  flex-direction: column;
  z-index: 1001;
  box-shadow: ${({ theme }) => theme.shadow.md};
`;

const Header = styled.div`
  padding: ${({ theme }) => theme.spacing(4)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled.span`
  font-weight: 600;
`;

const CloseBtn = styled.button`
  border: none;
  background: transparent;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.textMuted};
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const Body = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing(2)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Item = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  background: ${({ $active, theme }) => ($active ? `${theme.colors.primary}14` : 'transparent')};
  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const Section = styled.div`
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(3)}`};
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Footer = styled.div`
  padding: ${({ theme }) => theme.spacing(4)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Email = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
  word-break: break-all;
`;

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const { session, user } = useAuth();
  const { data: profile } = useProfile(!!session);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
  }

  const isActive = (p: string) => location.pathname === p;

  return (
    <>
      <Trigger
        type="button"
        aria-label="Deschide meniul"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </Trigger>

      <Backdrop $open={open} onClick={() => setOpen(false)} />
      <Drawer $open={open} aria-hidden={!open}>
        <Header>
          <HeaderTitle>Meniu</HeaderTitle>
          <CloseBtn aria-label="Închide meniul" onClick={() => setOpen(false)}>
            ×
          </CloseBtn>
        </Header>
        <Body>
          <Section>Navigare</Section>
          <Item to="/" $active={isActive('/')}>
            🗺️ Hartă
          </Item>

          {session ? (
            <>
              <Section>Contul meu</Section>
              <Item to="/dashboard" $active={isActive('/dashboard')}>
                📋 Rezervări active
              </Item>
              <Item to="/history" $active={isActive('/history')}>
                🕓 Istoric
              </Item>
              <Item to="/profile" $active={isActive('/profile')}>
                👤 Profil
              </Item>
              <Item to="/settings" $active={isActive('/settings')}>
                ⚙️ Setări
              </Item>

              {profile?.role === 'admin' && (
                <>
                  <Section>Administrare</Section>
                  <Item to="/admin/stations" $active={location.pathname.startsWith('/admin')}>
                    🛠️ Panou admin
                  </Item>
                </>
              )}
            </>
          ) : (
            <>
              <Section>Autentificare</Section>
              <Item to="/login" $active={isActive('/login')}>
                🔐 Autentificare
              </Item>
              <Item to="/register" $active={isActive('/register')}>
                ✨ Cont nou
              </Item>
            </>
          )}
        </Body>
        {session && (
          <Footer>
            <Email>{user?.email}</Email>
            <Button $variant="secondary" $full onClick={signOut}>
              Deconectare
            </Button>
          </Footer>
        )}
      </Drawer>
    </>
  );
}
