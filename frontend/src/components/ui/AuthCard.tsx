import styled from 'styled-components';
import type { ReactNode } from 'react';

const Page = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.spacing(4)};
  background:
    radial-gradient(circle at 20% 0%, rgba(37, 99, 235, 0.08), transparent 40%),
    radial-gradient(circle at 80% 100%, rgba(22, 163, 74, 0.06), transparent 40%),
    ${({ theme }) => theme.colors.background};
`;

const Card = styled.div`
  width: 100%;
  max-width: 440px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  padding: ${({ theme }) => `${theme.spacing(10)} ${theme.spacing(8)}`};
`;

const Brand = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  &::before {
    content: '⚡';
    font-size: 1rem;
  }
`;

const Title = styled.h1`
  margin: 0 0 ${({ theme }) => theme.spacing(2)};
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing(7)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9375rem;
`;

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Page>
      <Card>
        <Brand>Charging Oradea</Brand>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
        {children}
      </Card>
    </Page>
  );
}
