import styled from 'styled-components';
import type { ReactNode } from 'react';

const Page = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.spacing(4)};
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadow.md};
  padding: ${({ theme }) => theme.spacing(8)};
`;

const Title = styled.h1`
  margin: 0 0 ${({ theme }) => theme.spacing(2)};
  font-size: 1.5rem;
`;

const Subtitle = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing(6)};
  color: ${({ theme }) => theme.colors.textMuted};
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
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
        {children}
      </Card>
    </Page>
  );
}
