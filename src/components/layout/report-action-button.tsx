"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getReportThemeStyle, reportThemeCssVars } from "@/components/layout/report-theme-style";
import { canWrite } from "@/features/auth/auth";
import { useAuth } from "@/features/state/auth-store";
import {
  reportThemeDefinitions,
  type ReportTheme
} from "@/services/simple-report";

export function ReportActionButton({
  theme = "geral",
  label
}: {
  theme?: ReportTheme;
  label?: string;
}) {
  const themeConfig = reportThemeDefinitions[theme];
  const themeStyle = getReportThemeStyle(theme);
  const Icon = themeStyle.icon;
  const { user } = useAuth();

  if (!canWrite(user)) return null;

  return (
    <Button
      asChild
      variant="secondary"
      style={reportThemeCssVars(theme)}
      className="border-[color:var(--report-border)] bg-[color:var(--report-bg)] text-atlas-text shadow-[0_0_0_rgba(0,0,0,0)] hover:bg-[color:var(--report-hover)] hover:shadow-[0_0_22px_var(--report-glow)]"
    >
      <Link href={`/incidents/new?theme=${theme}`}>
        <Icon className="h-4 w-4 text-[color:var(--report-accent)]" />
        {label ?? `Novo report: ${themeConfig.shortLabel}`}
      </Link>
    </Button>
  );
}
