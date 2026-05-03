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
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(6)}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`;

const Tab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(4)}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.surface)};
  color: ${({ $active, theme }) => ($active ? 'white' : theme.colors.text)};
  font-weight: 500;
  font-size: 0.875rem;
  transition: background 120ms ease;
  &:hover {
    background: ${({ $active, theme }) =>
      $active ? theme.colors.primaryHover : theme.colors.background};
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
          🗺️ Hartă
        </Tab>
        <Tab $active={view === 'list'} onClick={() => setView('list')}>
          📋 Listă
        </Tab>
      </TabBar>
      <Body style={{ overflow: view === 'list' ? 'auto' : 'hidden' }}>
        {view === 'map' ? <AdminMap /> : <AdminStationsTable />}
      </Body>
    </Wrap>
  );
}
