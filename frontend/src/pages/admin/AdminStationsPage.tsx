import { useState } from 'react';
import styled from 'styled-components';
import { AdminMap } from './AdminMap';
import { AdminStationsTable } from './AdminStationsTable';

type View = 'map' | 'list';

const Wrap = styled.div`
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 0;
`;

const TabBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(6)}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`;

const Tab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(4)}`};
  border: none;
  background: transparent;
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.textMuted)};
  font-weight: 600;
  font-size: 0.875rem;
  position: relative;
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};
  &::after {
    content: '';
    position: absolute;
    bottom: ${({ theme }) => `calc(${theme.spacing(3)} * -1 - 1px)`};
    left: 12px;
    right: 12px;
    height: 2px;
    background: ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
    border-radius: 2px 2px 0 0;
    transition: background ${({ theme }) => theme.transitions.fast};
  }
  &:hover {
    color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.text)};
  }
`;

const Body = styled.div`
  min-height: 0;
  overflow: hidden;
`;

export function AdminStationsPage() {
  const [view, setView] = useState<View>('map');
  return (
    <Wrap>
      <TabBar>
        <Tab $active={view === 'map'} onClick={() => setView('map')}>
          <MapIcon /> Hartă
        </Tab>
        <Tab $active={view === 'list'} onClick={() => setView('list')}>
          <ListIcon /> Listă
        </Tab>
      </TabBar>
      <Body style={{ overflow: view === 'list' ? 'auto' : 'hidden' }}>
        {view === 'map' ? <AdminMap /> : <AdminStationsTable />}
      </Body>
    </Wrap>
  );
}

function MapIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
