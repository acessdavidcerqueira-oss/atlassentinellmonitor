"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { LightweightAreaChart, LightweightScatter } from "@/components/ui/lightweight-charts";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { useAtlas } from "@/features/state/atlas-store";

export function NarrativeRadar() {
  const { narratives, incidents } = useAtlas();
  const bubbles = narratives.map((narrative) => ({
    name: narrative.name,
    size: narrative.volume,
    x: narrative.growth,
    y: narrative.riskScore
  }));
  const timeline = narratives.map((narrative) => ({
    name: narrative.name,
    crescimento: narrative.growth,
    velocidade: narrative.velocity
  }));

  return (
    <div>
      <PageTitle
        title="Narrative Radar"
        description="Visualiza narrativas, crescimento, volume, fontes e recomendações. Autoria ou coordenação só aparecem quando há evidência suficiente."
        actions={<ReportActionButton theme="narrativas" />}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Bubble chart de risco e crescimento</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <LightweightScatter data={bubbles} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Timeline de crescimento</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <LightweightAreaChart
                data={timeline}
                xKey="name"
                series={[
                  { key: "crescimento", label: "Crescimento", color: "#48CFF2", fill: "#48CFF2" },
                  { key: "velocidade", label: "Velocidade", color: "#FBBF24", fill: "#FBBF24" }
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {narratives.map((narrative) => (
            <Card key={narrative.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{narrative.name}</h2>
                    <p className="mt-1 text-sm text-atlas-muted">{narrative.centralMessage}</p>
                  </div>
                  <RiskBadge level={narrative.riskScore > 60 ? "Alto" : narrative.riskScore > 40 ? "Moderado" : "Baixo"} score={narrative.riskScore} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{narrative.status}</Badge>
                  <Badge variant="muted">Volume {narrative.volume}</Badge>
                  <Badge variant="muted">Crescimento {narrative.growth}%</Badge>
                  <ProvenanceBadge value={narrative.provenanceType} />
                </div>
                <p className="mt-3 text-sm leading-6 text-atlas-muted">{narrative.recommendation}</p>
                <div className="mt-3 text-xs text-atlas-muted">
                  Conteúdos relacionados:{" "}
                  {incidents.filter((incident) => narrative.incidentIds.includes(incident.id)).map((incident) => incident.title).join(" · ") || "Não disponível"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
