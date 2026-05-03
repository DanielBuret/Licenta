import styled, { css } from 'styled-components';

export const PageContainer = styled.div`
  padding: ${({ theme }) => theme.spacing(8)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(6)};
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
`;

export const PageHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
  flex-wrap: wrap;
`;

export const PageTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

export const PageSubtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  flex-wrap: wrap;
`;

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  overflow: hidden;
`;

export const TableScroll = styled.div`
  overflow: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    padding: ${({ theme }) => `${theme.spacing(3.5)} ${theme.spacing(4)}`};
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 0.875rem;
    vertical-align: middle;
  }
  th {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.6875rem;
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  tbody tr {
    transition: background ${({ theme }) => theme.transitions.fast};
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
  tbody tr:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }
`;

type PillTone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

export const StatusPill = styled.span<{ $tone: PillTone }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  ${({ $tone, theme }) => {
    const c =
      $tone === 'green'
        ? theme.colors.statusFree
        : $tone === 'amber'
          ? theme.colors.statusReserved
          : $tone === 'red'
            ? theme.colors.statusCharging
            : $tone === 'blue'
              ? theme.colors.primary
              : theme.colors.textMuted;
    return css`
      color: ${c};
      background: ${c}1a;
      &::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: ${c};
      }
    `;
  }}
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.mono};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => `${theme.spacing(12)} ${theme.spacing(6)}`};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9375rem;
`;
