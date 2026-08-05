import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      colors: {
        atlas: {
          bg: "#030817",
          panel: "#071126",
          card: "#0A142D",
          raised: "#0E1B38",
          border: "rgba(180, 229, 255, 0.14)",
          text: "#F1FAFF",
          muted: "#8FA9BE",
          ice: "#D8F7FF",
          tech: "#79DFFF",
          action: "#48CFF2"
        }
      },
      boxShadow: {
        command: "0 24px 80px rgba(0, 0, 0, 0.45)",
        glow: "0 0 24px rgba(72, 207, 242, 0.16)"
      },
      backgroundImage: {
        "atlas-grid":
          "linear-gradient(rgba(216,247,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(216,247,255,0.045) 1px, transparent 1px)",
        "radar-ring":
          "radial-gradient(circle at center, rgba(72,207,242,0.14), transparent 42%)"
      },
      keyframes: {
        "critical-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(248, 113, 113, 0.28)" },
          "50%": { boxShadow: "0 0 0 8px rgba(248, 113, 113, 0)" }
        },
        sweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "critical-pulse": "critical-pulse 1.8s ease-in-out infinite",
        sweep: "sweep 12s linear infinite",
        "fade-up": "fade-up 0.35s ease-out both"
      }
    }
  },
  plugins: []
};

export default config;
