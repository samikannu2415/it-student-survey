/** @type {import('tailwindcss').Config} */

const withOpacity = (variable) => {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) return `var(${variable})`;
    return `color-mix(in srgb, var(${variable}) ${Number(opacityValue) * 100}%, transparent)`;
  };
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

module.exports = {
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
        "glow-cyan": "0 0 20px color-mix(in srgb, var(--accent) 40%, transparent), 0 0 60px color-mix(in srgb, var(--accent) 15%, transparent)",
        "glow-purple": "0 0 20px color-mix(in srgb, var(--accent-2) 40%, transparent), 0 0 60px color-mix(in srgb, var(--accent-2) 15%, transparent)",
        "glow-magenta": "0 0 20px color-mix(in srgb, var(--accent-3) 40%, transparent), 0 0 60px color-mix(in srgb, var(--accent-3) 15%, transparent)",
        "glow-blue": "0 0 20px color-mix(in srgb, var(--accent) 35%, transparent), 0 0 60px color-mix(in srgb, var(--accent) 12%, transparent)",
        float: "0 20px 60px color-mix(in srgb, var(--accent) 8%, transparent), 0 8px 24px color-mix(in srgb, var(--bg) 80%, transparent)",
        "float-hover": "0 28px 80px color-mix(in srgb, var(--accent) 18%, transparent), 0 12px 32px color-mix(in srgb, var(--bg) 85%, transparent)",
        "inner-glow": "inset 0 1px 0 color-mix(in srgb, var(--accent) 20%, transparent)",
      },

      ringColor: {
        DEFAULT: "color-mix(in srgb, var(--accent) 50%, transparent)",
      },

      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "12px",
        lg: "24px",
        xl: "40px",
      },

      keyframes: {
        "float-bob": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px color-mix(in srgb, var(--accent) 30%, transparent), 0 0 60px color-mix(in srgb, var(--accent) 10%, transparent)" },
          "50%": { boxShadow: "0 0 40px color-mix(in srgb, var(--accent) 55%, transparent), 0 0 100px color-mix(in srgb, var(--accent) 25%, transparent)" },
        },
        "bar-fill": {
          "0%": { width: "0%" },
          "100%": { width: "var(--bar-width)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        scanline: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100vh" },
        },
        "float-in": {
          "0%": { opacity: "0", transform: "translateY(30px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "live-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.7)" },
        },
        "border-spin": {
          "0%": { "--border-angle": "0deg" },
          "100%": { "--border-angle": "360deg" },
        },
        flicker: {
          "0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%": { opacity: "1" },
          "20%, 24%, 55%": { opacity: "0.7" },
        },
      },

      animation: {
        "float-bob": "float-bob 4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        scanline: "scanline 8s linear infinite",
        "float-in": "float-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "live-dot": "live-dot 1.5s ease-in-out infinite",
        flicker: "flicker 3s linear infinite",
        "spin-slow": "spin 6s linear infinite",
        "bar-fill": "bar-fill 0.8s cubic-bezier(0.34, 1.20, 0.64, 1) forwards",
      },

      spacing: {
        18: "4.5rem",
        88: "22rem",
        112: "28rem",
        128: "32rem",
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      transitionTimingFunction: {
        "bounce-soft": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        magnetic: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
    },
  },
  plugins: [],
};
