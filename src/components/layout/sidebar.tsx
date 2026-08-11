"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { navItems } from "@/components/layout/nav-items";
import { reportThemeCssVars } from "@/components/layout/report-theme-style";
import { useAtlas } from "@/features/state/atlas-store";
import { cn } from "@/lib/utils";
import type { ReportTheme } from "@/services/simple-report";

const navThemeByHref: Partial<Record<string, ReportTheme>> = {
  "/incidents": "geral",
  "/narrativas": "narrativas",
  "/desinformacao": "desinformacao",
  "/fraudes": "fraudes",
  "/cti": "cti",
  "/ameacas": "ameacas",
  "/atores": "atores",
  "/coordenacao": "coordenacao",
  "/evidencias": "evidencias"
};

const readOnlyAllowedHrefs = new Set([
  "/",
  "/incidents",
  "/narrativas",
  "/desinformacao",
  "/fraudes",
  "/cti",
  "/ameacas",
  "/atores",
  "/coordenacao",
  "/evidencias",
  "/blacklist",
  "/relatorios"
]);

export function Sidebar() {
  const pathname = usePathname();
  const { readOnly, viewBasePath } = useAtlas();

  return (
    <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-atlas-border bg-[#040b1a]/92 backdrop-blur xl:flex xl:flex-col">
      <div className="flex h-24 items-center border-b border-atlas-border px-4">
        <div className="relative h-16 w-64 overflow-hidden">
          <Image src="/atlas-sentinel-logo.png" alt="Atlas Sentinel" fill sizes="256px" className="object-contain object-left" priority />
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems
          .filter((item) => !item.hidden)
          .filter((item) => !readOnly || readOnlyAllowedHrefs.has(item.href))
          .map((item) => {
            const Icon = item.icon;
            const href = readOnly ? `${viewBasePath}${item.href === "/" ? "" : item.href}` : item.href;
            const active = pathname === href || (readOnly && item.href === "/" && pathname === viewBasePath);
            const theme = navThemeByHref[item.href];
            return (
              <Link
                key={item.href}
                href={href}
                style={theme ? reportThemeCssVars(theme) : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm text-atlas-muted transition",
                  active && theme
                    ? "border-[color:var(--report-border)] bg-[color:var(--report-bg)] text-atlas-text shadow-glow"
                    : active
                      ? "border-atlas-border bg-white/8 text-atlas-text shadow-glow"
                      : "hover:border-atlas-border hover:bg-white/5 hover:text-atlas-text"
                )}
              >
                <Icon className={cn("h-4 w-4", theme ? "text-[color:var(--report-accent)]" : "")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-atlas-border p-4">
        <div className="flex items-start gap-3 rounded-md border border-atlas-border bg-atlas-card/70 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-atlas-action" />
          <div>
            <p className="text-xs font-medium text-atlas-text">Base limpa</p>
            <p className="mt-1 text-xs leading-5 text-atlas-muted">
              A Dash só mostra reports cadastrados ou importados.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
