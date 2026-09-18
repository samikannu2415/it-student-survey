import type { Config } from "tailwindcss";

const withOpacity =
  (variable: string) =>
  ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue === undefined) return `var(${variable})`;
    return `color-mix(in srgb, var(${variable}) ${Number(opacityValue) * 100}%, transparent)`;
  };

const neonDarkColors = {
  bg: withOpacity("--bg"),
  surface: withOpacity("--surface"),
  "surface-2": withOpacity("--surface-2"),
  border: withOpacity("--border"),
  text: withOpacity("--text"),
  dim: withOpacity("--text-dim"),
  accent: {
    DEFAULT: withOpacity("--accent"),
    2: withOpacity("--accent-2"),
    3: withOpacity("--accent-3"),
    4: withOpacity("--accent-4"),
  },
  success: withOpacity("--success"),
  danger: withOpacity("--danger"),
  neon: {
    cyan: withOpacity("--accent-2"),
    blue: withOpacity("--accent"),
    purple: withOpacity("--accent"),
    magenta: withOpacity("--accent-3"),
    pink: withOpacity("--accent-3"),
  },
};

const config: Config = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: neonDarkColors,
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Orbitron'", "sans-serif"],
      },
      boxShadow: {
        lead: "0 0 24px rgba(124, 92, 255, 0.35)",
        "glow-cyan":
          "0 0 20px color-mix(in srgb, var(--accent) 40%, transparent), 0 0 60px color-mix(in srgb, var(--accent) 15%, transparent)",
        "glow-purple":
          "0 0 20px color-mix(in srgb, var(--accent-2) 40%, transparent), 0 0 60px color-mix(in srgb, var(--accent-2) 15%, transparent)",
        "glow-magenta":
          "0 0 20px color-mix(in srgb, var(--accent-3) 40%, transparent), 0 0 60px color-mix(in srgb, var(--accent-3) 15%, transparent)",
        "glow-blue":
          "0 0 20px color-mix(in srgb, var(--accent) 35%, transparent), 0 0 60px color-mix(in srgb, var(--accent) 12%, transparent)",
        float:
          "0 20px 60px color-mix(in srgb, var(--accent) 8%, transparent), 0 8px 24px color-mix(in srgb, var(--bg) 80%, transparent)",
        "float-hover":
          "0 28px 80px color-mix(in srgb, var(--accent) 18%, transparent), 0 12px 32px color-mix(in srgb, var(--bg) 85%, transparent)",
        "inner-glow": "inset 0 1px 0 color-mix(in srgb, var(--accent) 20%, transparent)",
      },
      ringColor: {
        DEFAULT: "color-mix(in srgb, var(--accent) 50%, transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
