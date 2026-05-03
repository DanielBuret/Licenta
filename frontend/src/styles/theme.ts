export const theme = {
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primarySoft: 'rgba(37, 99, 235, 0.1)',
    background: '#f4f6fb',
    backgroundAlt: '#eef1f8',
    surface: '#ffffff',
    surfaceMuted: '#fafbfd',
    border: '#e4e7ee',
    borderStrong: '#cbd0db',
    text: '#0f172a',
    textMuted: '#64748b',
    textSubtle: '#94a3b8',
    statusFree: '#16a34a',
    statusFreeSoft: 'rgba(22, 163, 74, 0.12)',
    statusReserved: '#f59e0b',
    statusReservedSoft: 'rgba(245, 158, 11, 0.14)',
    statusCharging: '#dc2626',
    statusChargingSoft: 'rgba(220, 38, 38, 0.12)',
    danger: '#dc2626',
    dangerSoft: 'rgba(220, 38, 38, 0.1)',
    success: '#16a34a',
  },
  radii: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    pill: '999px',
  },
  spacing: (n: number) => `${n * 4}px`,
  shadow: {
    sm: '0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.06)',
    md: '0 4px 12px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04)',
    lg: '0 12px 32px rgba(15, 23, 42, 0.10), 0 4px 8px rgba(15, 23, 42, 0.04)',
    xl: '0 24px 48px rgba(15, 23, 42, 0.16), 0 8px 16px rgba(15, 23, 42, 0.06)',
    ring: '0 0 0 3px rgba(37, 99, 235, 0.18)',
    ringDanger: '0 0 0 3px rgba(220, 38, 38, 0.18)',
  },
  typography: {
    fontFamily:
      "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
  },
  transitions: {
    fast: '120ms ease',
    base: '180ms ease',
  },
} as const;

export type AppTheme = typeof theme;
