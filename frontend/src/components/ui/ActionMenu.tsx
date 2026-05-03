import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

const MENU_MIN_WIDTH = 180;

const Wrap = styled.div`
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

const Menu = styled.div`
  position: fixed;
  min-width: ${MENU_MIN_WIDTH}px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadow.md};
  z-index: 2000;
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    function recompute() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuWidth = menuRef.current?.offsetWidth ?? MENU_MIN_WIDTH;
      const top = rect.bottom + 4;
      const left = align === 'right' ? rect.right - menuWidth : rect.left;
      const clampedLeft = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
      setPos({ top, left: clampedLeft });
    }
    recompute();
    window.addEventListener('resize', recompute);
    window.addEventListener('scroll', recompute, true);
    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('scroll', recompute, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        (triggerRef.current && triggerRef.current.contains(target)) ||
        (menuRef.current && menuRef.current.contains(target))
      ) {
        return;
      }
      setOpen(false);
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
    <Wrap>
      <Trigger
        ref={triggerRef}
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
      {open &&
        pos &&
        createPortal(
          <Menu
            ref={menuRef}
            role="menu"
            style={{ top: pos.top, left: pos.left }}
            onClick={(e) => e.stopPropagation()}
          >
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
          </Menu>,
          document.body,
        )}
    </Wrap>
  );
}
