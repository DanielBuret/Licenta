import styled from 'styled-components';

export const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) =>
    `${theme.spacing(2.5)} ${theme.spacing(8)} ${theme.spacing(2.5)} ${theme.spacing(3.5)}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: white
    url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")
    no-repeat right 14px center;
  appearance: none;
  -webkit-appearance: none;
  font-size: 0.9375rem;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};
  &:hover:not(:disabled):not(:focus) {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadow.ring};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.background};
    cursor: not-allowed;
  }
`;
