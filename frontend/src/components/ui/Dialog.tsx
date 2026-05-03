import styled, { keyframes } from 'styled-components';
import { useEffect, type ReactNode } from 'react';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const popIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing(4)};
  animation: ${fadeIn} 140ms ease-out;
`;

const Card = styled.div<{ $maxWidth: number }>`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadow.xl};
  width: 100%;
  max-width: ${({ $maxWidth }) => `${$maxWidth}px`};
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 32px);
  overflow: hidden;
  animation: ${popIn} 180ms cubic-bezier(0.2, 0.9, 0.3, 1.2);
`;

const Header = styled.div`
  padding: ${({ theme }) => `${theme.spacing(5)} ${theme.spacing(6)} 0`};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Body = styled.div`
  padding: ${({ theme }) => `${theme.spacing(5)} ${theme.spacing(6)} ${theme.spacing(6)}`};
  overflow: auto;
`;

interface Props {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}

export function Dialog({ title, subtitle, onClose, children, maxWidth = 480 }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <Backdrop onClick={onClose}>
      <Card $maxWidth={maxWidth} onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{title}</Title>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </Header>
        <Body>{children}</Body>
      </Card>
    </Backdrop>
  );
}
