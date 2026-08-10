"use client";

import { Activity, Bell, LogOut, Search, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { ShareViewButton } from "@/components/layout/share-view-button";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";
import { formatDateTime } from "@/utils/date";

export function Topbar() {
  const { user, logout } = useAuth();
  const { activeEntityName, alerts, incidents, readOnly } = useAtlas();
  const criticalAlerts = alerts.filter((alert) => alert.severity === "Crítico" && alert.status !== "resolvido");
  const lastUpdate = incidents
    .map((incident) => incident.updatedAt)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  return (
    <header className="no-print sticky top-0 z-20 border-b border-atlas-border bg-[#030817]/86 backdrop-blur">
      <div className="flex min-h-20 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{activeEntityName}</Badge>
          <Badge variant="muted">Período: últimas 24h</Badge>
          <Badge variant="success">
            <ShieldCheck className="mr-1 h-3 w-3" />
            Base limpa
          </Badge>
          {readOnly ? <Badge variant="low">MODO VISUALIZAÇÃO</Badge> : null}
          <div
            className="flex h-8 items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 text-xs text-cyan-100 shadow-[0_0_22px_rgba(72,207,242,0.12)]"
            aria-label="Leitura contínua ativa"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-200/40 bg-amber-300/12 text-amber-200">
              <Zap className="signal-zap h-3.5 w-3.5" />
            </span>
            <span className="font-medium">Leitura ativa</span>
            <span className="relative h-5 w-16 overflow-hidden text-cyan-200" aria-hidden="true">
              <Activity className="ecg-wave-icon h-5 w-16" />
              <span className="ecg-scan" />
            </span>
          </div>
          <Badge variant={criticalAlerts.length > 0 ? "critical" : "muted"}>
            <Bell className="mr-1 h-3 w-3" />
            {criticalAlerts.length} críticos
          </Badge>
          <span className="text-xs text-atlas-muted" suppressHydrationWarning>
            Última atualização: {formatDateTime(lastUpdate)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden w-72 md:block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-atlas-muted" />
            <Input className="pl-9" placeholder="Pesquisa global" aria-label="Pesquisa global" />
          </div>
          {readOnly ? (
            <div className="hidden text-right text-xs md:block">
              <div className="font-medium text-atlas-text">Acesso externo</div>
              <div className="text-atlas-muted">Somente leitura</div>
            </div>
          ) : (
            <>
              <div className="hidden text-right text-xs md:block">
                <div className="font-medium text-atlas-text">{user?.name ?? "Não autenticado"}</div>
                <div className="text-atlas-muted">{user?.role ?? "Sem papel"}</div>
              </div>
              <ShareViewButton />
              <ReportActionButton theme="geral" label="Novo report" />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sair"
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
