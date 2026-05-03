import styled, { css } from 'styled-components';

type Variant = 'primary' | 'secondary' | 'danger';

export const Button = styled.button<{ $variant?: Variant; $full?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => `${theme.spacing(2.5)} ${theme.spacing(4)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid transparent;
  font-weight: 500;
  transition:
    background 120ms ease,
    border-color 120ms ease,
    color 120ms ease;
  ${({ $full }) => $full && 'width: 100%;'}
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${({ theme, $variant = 'primary' }) =>
    $variant === 'primary' &&
    css`
      background: ${theme.colors.primary};
      color: white;
      &:hover:not(:disabled) {
        background: ${theme.colors.primaryHover};
      }
    `}
  ${({ theme, $variant }) =>
    $variant === 'secondary' &&
    css`
      background: white;
      color: ${theme.colors.text};
      border-color: ${theme.colors.border};
      &:hover:not(:disabled) {
        background: ${theme.colors.background};
      }
    `}
  ${({ theme, $variant }) =>
    $variant === 'danger' &&
    css`
      background: ${theme.colors.danger};
      color: white;
      &:hover:not(:disabled) {
        filter: brightness(0.95);
      }
    `}
`;
