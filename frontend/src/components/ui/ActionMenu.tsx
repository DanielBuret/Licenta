import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

export interface ActionItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface Props {
  items: ActionItem[];
  triggerLabel?: string;
  align?: 'left' | 'right';
}

const Wrap = styled.div`
  position: relative;
  display: inline-block;
`;

const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease;
  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const Caret = styled.span`
  font-size: 0.6875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Menu = styled.div<{ $align: 'left' | 'right' }>`
  position: absolute;
  top: calc(100% + 4px);
  ${({ $align }) => ($align === 'right' ? 'right: 0;' : 'left: 0;')}
  min-width: 160px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadow.md};
  z-index: 100;
  padding: ${({ theme }) => theme.spacing(1)};
  display: flex;
  flex-direction: column;
`;

const MenuItem = styled.button<{ $variant: 'default' | 'danger' }>`
  display: block;
  width: 100%;
  text-align: left;
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(3)}`};
  border: none;
  background: transparent;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 0.875rem;
  cursor: pointer;
  color: ${({ $variant, theme }) =>
    $variant === 'danger' ? theme.colors.danger : theme.colors.text};
  &:hover:not(:disabled) {
    background: ${({ $variant, theme }) =>
      $variant === 'danger' ? '#fee2e2' : theme.colors.background};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export function ActionMenu({ items, triggerLabel = 'Acțiuni', align = 'right' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <Wrap ref={ref}>
      <Trigger
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {triggerLabel}
        <Caret>▾</Caret>
      </Trigger>
      {open && (
        <Menu $align={align} role="menu">
          {items.map((it, i) => (
            <MenuItem
              key={i}
              type="button"
              role="menuitem"
              $variant={it.variant ?? 'default'}
              disabled={it.disabled}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
            >
              {it.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Wrap>
  );
}
