import styled from 'styled-components';

export const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing(2.5)} ${theme.spacing(3)}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: white;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
  }
`;
