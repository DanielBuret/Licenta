import styled from 'styled-components';
import type { ReactNode } from 'react';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1.5)};
`;

const Label = styled.label`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ErrorText = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.danger};
`;

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <Wrap>
      <Label>{label}</Label>
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </Wrap>
  );
}
