import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import { Button } from './ui';
import {
  CalendarIcon,
  ClockIcon,
  LogInIcon,
  MapIcon,
  MenuIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
  UserPlusIcon,
} from './icons';

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
  z-index: 9000;
  will-change: opacity;
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
  transform: translate3d(${({ $open }) => ($open ? '0' : '100%')}, 0, 0);
  transition: transform 220ms ease;
  display: flex;
  flex-direction: column;
  z-index: 9001;
  box-shadow: ${({ theme }) => theme.shadow.lg};
  will-change: transform;

  @media (max-width: 900px) {
    width: 100%;
    max-width: 100%;
    border-left: none;
  }
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
        <MenuIcon size={20} />
      </Trigger>

      {createPortal(
        <>
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
                <MapIcon /> <span>Hartă</span>
              </Item>

              {session ? (
                <>
                  <Section>Contul meu</Section>
                  <Item to="/dashboard" $active={isActive('/dashboard')}>
                    <CalendarIcon /> <span>Rezervări active</span>
                  </Item>
                  <Item to="/history" $active={isActive('/history')}>
                    <ClockIcon /> <span>Istoric</span>
                  </Item>
                  <Item to="/profile" $active={isActive('/profile')}>
                    <UserIcon /> <span>Profil</span>
                  </Item>
                  <Item to="/settings" $active={isActive('/settings')}>
                    <SettingsIcon /> <span>Setări</span>
                  </Item>

                  {profile?.role === 'admin' && (
                    <>
                      <Section>Administrare</Section>
                      <Item to="/admin/stations" $active={location.pathname.startsWith('/admin')}>
                        <ShieldIcon /> <span>Panou admin</span>
                      </Item>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Section>Autentificare</Section>
                  <Item to="/login" $active={isActive('/login')}>
                    <LogInIcon /> <span>Autentificare</span>
                  </Item>
                  <Item to="/register" $active={isActive('/register')}>
                    <UserPlusIcon /> <span>Cont nou</span>
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
        </>,
        document.body,
      )}
    </>
  );
}
