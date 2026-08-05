import type { CSSProperties } from "react";
import {
  AlertTriangle,
  Binary,
  BrainCircuit,
  ClipboardList,
  Database,
  Eye,
  Fingerprint,
  Radar,
  Share2,
  type LucideIcon
} from "lucide-react";
import type { ReportTheme } from "@/services/simple-report";

export type ReportThemeStyle = {
  icon: LucideIcon;
  accent: string;
  background: string;
  border: string;
  hover: string;
  glow: string;
};

export const reportThemeStyles: Record<ReportTheme, ReportThemeStyle> = {
  geral: {
    icon: ClipboardList,
    accent: "#79DFFF",
    background: "rgba(121, 223, 255, 0.10)",
    border: "rgba(121, 223, 255, 0.34)",
    hover: "rgba(121, 223, 255, 0.16)",
    glow: "rgba(121, 223, 255, 0.18)"
  },
  desinformacao: {
    icon: BrainCircuit,
    accent: "#C4B5FD",
    background: "rgba(167, 139, 250, 0.12)",
    border: "rgba(196, 181, 253, 0.36)",
    hover: "rgba(167, 139, 250, 0.18)",
    glow: "rgba(167, 139, 250, 0.2)"
  },
  fraudes: {
    icon: Fingerprint,
    accent: "#FCD34D",
    background: "rgba(251, 191, 36, 0.12)",
    border: "rgba(252, 211, 77, 0.36)",
    hover: "rgba(251, 191, 36, 0.18)",
    glow: "rgba(251, 191, 36, 0.2)"
  },
  cti: {
    icon: Binary,
    accent: "#6EE7B7",
    background: "rgba(52, 211, 153, 0.12)",
    border: "rgba(110, 231, 183, 0.36)",
    hover: "rgba(52, 211, 153, 0.18)",
    glow: "rgba(52, 211, 153, 0.2)"
  },
  ameacas: {
    icon: AlertTriangle,
    accent: "#FDA4AF",
    background: "rgba(244, 63, 94, 0.12)",
    border: "rgba(253, 164, 175, 0.36)",
    hover: "rgba(244, 63, 94, 0.18)",
    glow: "rgba(244, 63, 94, 0.22)"
  },
  atores: {
    icon: Eye,
    accent: "#93C5FD",
    background: "rgba(59, 130, 246, 0.12)",
    border: "rgba(147, 197, 253, 0.36)",
    hover: "rgba(59, 130, 246, 0.18)",
    glow: "rgba(59, 130, 246, 0.2)"
  },
  coordenacao: {
    icon: Share2,
    accent: "#FDBA74",
    background: "rgba(249, 115, 22, 0.12)",
    border: "rgba(253, 186, 116, 0.36)",
    hover: "rgba(249, 115, 22, 0.18)",
    glow: "rgba(249, 115, 22, 0.2)"
  },
  narrativas: {
    icon: Radar,
    accent: "#F0ABFC",
    background: "rgba(217, 70, 239, 0.12)",
    border: "rgba(240, 171, 252, 0.36)",
    hover: "rgba(217, 70, 239, 0.18)",
    glow: "rgba(217, 70, 239, 0.2)"
  },
  evidencias: {
    icon: Database,
    accent: "#5EEAD4",
    background: "rgba(20, 184, 166, 0.12)",
    border: "rgba(94, 234, 212, 0.36)",
    hover: "rgba(20, 184, 166, 0.18)",
    glow: "rgba(20, 184, 166, 0.2)"
  }
};

export function getReportThemeStyle(theme: ReportTheme) {
  return reportThemeStyles[theme];
}

export function reportThemeCssVars(theme: ReportTheme): CSSProperties & Record<`--report-${string}`, string> {
  const style = getReportThemeStyle(theme);

  return {
    "--report-accent": style.accent,
    "--report-bg": style.background,
    "--report-border": style.border,
    "--report-hover": style.hover,
    "--report-glow": style.glow
  };
}
