export const colorTokens = {
  light: {
    background: "#eff6ff",
    surface: "rgba(255,255,255,0.72)",
    border: "rgba(255,255,255,0.5)",
    foreground: "#0f172a",
    muted: "#475569",
    primary: "#0f766e",
    secondary: "#2563eb",
    warning: "#f59e0b",
    danger: "#ef4444"
  },
  dark: {
    background: "#07111f",
    surface: "rgba(15,23,42,0.7)",
    border: "rgba(148,163,184,0.18)",
    foreground: "#e2e8f0",
    muted: "#94a3b8",
    primary: "#34d399",
    secondary: "#60a5fa",
    warning: "#fbbf24",
    danger: "#f87171"
  }
} as const;

export const radiusTokens = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32
} as const;

export const spacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48
} as const;

export const fontTokens = {
  heading: "Space Grotesk, sans-serif",
  body: "Manrope, sans-serif"
} as const;

