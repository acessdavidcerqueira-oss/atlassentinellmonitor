"use client";

import Image from "next/image";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { useAtlas } from "@/features/state/atlas-store";
import { exportIncidentsCsv } from "@/services/csv-import";
import { formatDateTime } from "@/utils/date";

export function ReportsView() {
  const state = useAtlas();
  const last24 = state.incidents.filter((incident) => Date.now() - new Date(incident.collectedAt).getTime() <= 24 * 60 * 60 * 1000);
  const critical = last24.filter((incident) => incident.riskScore > 70 || incident.threatLevel >= 4);
  const pending = state.tasks.filter((task) => task.status !== "concluída");

  function exportCsv() {
    const blob = new Blob([exportIncidentsCsv(state)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atlas-sentinel-briefing-diario.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ last24, critical, pending }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atlas-sentinel-briefing-diario.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageTitle
        title="Relatórios"
        description="Briefing diário, relatórios por incidente, ameaça, desinformação, fraude, CTI e resumo executivo."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" />CSV</Button>
            <Button variant="secondary" onClick={exportJson}><Download className="h-4 w-4" />JSON</Button>
            <Button onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimir</Button>
            <ReportActionButton theme="geral" label="Novo report" />
          </>
        }
      />

      <Card className="print:border-slate-200 print:bg-white">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-md border border-atlas-border">
            <Image src="/atlas-sentinel-logo.png" alt="Atlas Sentinel" fill sizes="48px" className="object-cover" />
          </div>
          <div>
            <CardTitle>Briefing diário</CardTitle>
            <p className="text-sm text-atlas-muted">Gerado em {formatDateTime(new Date().toISOString())}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <section>
            <h2 className="font-display text-xl font-semibold">Resumo das últimas 24 horas</h2>
            <p className="mt-2 text-sm leading-6 text-atlas-muted">
              Foram registrados {last24.length} reports no período. Métricas ausentes permanecem como “Não disponível”.
            </p>
          </section>
          <section className="grid gap-4 md:grid-cols-3">
            <ReportBlock title="Principais riscos" value={`${critical.length} críticos/altos`} />
            <ReportBlock title="Ações pendentes" value={`${pending.length}`} />
            <ReportBlock title="Prioridade do dia" value="Triar reports novos" />
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">Incidentes prioritários</h2>
            <div className="mt-3 space-y-3">
              {critical.map((incident) => (
                <div key={incident.id} className="rounded-md border border-atlas-border bg-white/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{incident.title}</p>
                    <RiskBadge level={incident.riskLevel} score={incident.riskScore} />
                  </div>
                  <p className="mt-2 text-sm text-atlas-muted">{incident.recommendedAction}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge>{incident.category}</Badge>
                    <Badge variant={incident.threatLevel >= 4 ? "critical" : "muted"}>Threat {incident.threatLevel}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">Limitação metodológica</h2>
            <p className="mt-2 text-sm leading-6 text-atlas-muted">
              O briefing não usa métricas imaginárias, não apresenta inferências como fatos e não envia alertas reais sem configuração explícita.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-atlas-border bg-white/5 p-4">
      <p className="text-xs uppercase text-atlas-muted">{title}</p>
      <p className="mt-2 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}
