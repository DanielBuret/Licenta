import styled, { css } from 'styled-components';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

export const Button = styled.button<{ $variant?: Variant; $full?: boolean; $size?: Size }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid transparent;
  font-weight: 600;
  letter-spacing: -0.005em;
  white-space: nowrap;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast},
    transform ${({ theme }) => theme.transitions.fast};
  text-decoration: none;
  ${({ theme, $size = 'md' }) =>
    $size === 'sm'
      ? css`
          padding: ${theme.spacing(1.5)} ${theme.spacing(3)};
          font-size: 0.8125rem;
        `
      : css`
          padding: ${theme.spacing(2.5)} ${theme.spacing(4)};
          font-size: 0.9375rem;
        `}
  ${({ $full }) => $full && 'width: 100%;'}
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.shadow.ring};
  }
  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  ${({ theme, $variant = 'primary' }) =>
    $variant === 'primary' &&
    css`
      background: ${theme.colors.primary};
      color: white;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
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
        border-color: ${theme.colors.borderStrong};
      }
    `}
  ${({ theme, $variant }) =>
    $variant === 'danger' &&
    css`
      background: ${theme.colors.danger};
      color: white;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
      &:hover:not(:disabled) {
        filter: brightness(0.94);
      }
      &:focus-visible {
        box-shadow: ${theme.shadow.ringDanger};
      }
    `}
  ${({ theme, $variant }) =>
    $variant === 'ghost' &&
    css`
      background: transparent;
      color: ${theme.colors.textMuted};
      &:hover:not(:disabled) {
        background: ${theme.colors.background};
        color: ${theme.colors.text};
      }
    `}
`;
