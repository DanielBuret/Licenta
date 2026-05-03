export const theme = {
  colors: {
    primary: '#0d6efd',
    primaryHover: '#0b5ed7',
    background: '#f6f7fb',
    surface: '#ffffff',
    border: '#e5e7eb',
    text: '#1f2937',
    textMuted: '#6b7280',
    statusFree: '#16a34a',
    statusReserved: '#f59e0b',
    statusCharging: '#dc2626',
    danger: '#dc2626',
    success: '#16a34a',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  spacing: (n: number) => `${n * 4}px`,
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
  },
  typography: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
} as const;

export type AppTheme = typeof theme;
