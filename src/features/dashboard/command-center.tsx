"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Binary,
  Bot,
  FileWarning,
  Gauge,
  ShieldAlert,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { getReportThemeStyle, reportThemeCssVars } from "@/components/layout/report-theme-style";
import {
  LightweightAreaChart,
  LightweightBarList,
  LightweightDonut,
  LightweightStackedBars
} from "@/components/ui/lightweight-charts";
import { useAtlas } from "@/features/state/atlas-store";
import { countBy, getDashboardMetrics, seriesByDay } from "@/features/dashboard/metrics";
import { reportThemeDefinitions, type ReportTheme } from "@/services/simple-report";
import { formatDateTime } from "@/utils/date";

const palette = ["#79DFFF", "#48CFF2", "#FBBF24", "#FB7185", "#34D399", "#A78BFA", "#F97316"];
const dashboardReportThemes: ReportTheme[] = [
  "geral",
  "desinformacao",
  "fraudes",
  "cti",
  "ameacas",
  "atores",
  "coordenacao",
  "narrativas",
  "evidencias"
];

export function CommandCenter() {
  const state = useAtlas();
  const metrics = getDashboardMetrics(state);
  const incidents = state.incidents.filter((incident) => !incident.deletedAt);
  const daily = seriesByDay(incidents);
  const byCategory = countBy(incidents.map((incident) => incident.category)).slice(0, 8);
  const byPlatform = countBy(incidents.map((incident) => incident.platform)).slice(0, 8);
  const criticalIncidents = incidents
    .filter((incident) => incident.riskScore > 70 || incident.threatLevel >= 4)
    .sort((a, b) => b.riskScore + b.threatLevel * 10 - (a.riskScore + a.threatLevel * 10))
    .slice(0, 5);
  const triage = incidents.filter((incident) => ["Novo", "Em triagem"].includes(incident.status)).slice(0, 5);
  const emergingNarratives = [...state.narratives].sort((a, b) => b.growth - a.growth).slice(0, 4);
  const topActors = [...state.actors].sort((a, b) => b.occurrenceCount - a.occurrenceCount).slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={Gauge} label="Total de menções" value={metrics.totalMentions} />
        <MetricCard icon={FileWarning} label="Incidentes abertos" value={metrics.openIncidents} />
        <MetricCard icon={AlertTriangle} label="Alertas críticos" value={metrics.criticalAlerts} critical />
        <MetricCard icon={ShieldAlert} label="Conteúdos negativos" value={metrics.negativeContent} />
        <MetricCard icon={Bot} label="Desinformações" value={metrics.disinformation} />
        <MetricCard icon={Users} label="Perfis falsos ativos" value={metrics.fakeProfiles} />
        <MetricCard icon={Binary} label="Fraudes detectadas" value={metrics.fraud} />
        <MetricCard icon={AlertTriangle} label="Ameaças à pessoa" value={metrics.physicalThreats} />
        <MetricCard icon={Binary} label="Incidentes cibernéticos" value={metrics.cyber} />
        <MetricCard icon={Gauge} label="Mudança de risco 24h" value={`${metrics.riskDelta >= 0 ? "+" : ""}${metrics.riskDelta}`} />
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Iniciar report</CardTitle>
            <p className="mt-1 text-sm text-atlas-muted">
              A Dash geral concentra todos os atalhos. Cada aba também tem seu botão já no tema certo.
            </p>
          </div>
          <ReportActionButton theme="geral" label="Novo report geral" />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {dashboardReportThemes.map((theme) => {
            const config = reportThemeDefinitions[theme];
            const themeStyle = getReportThemeStyle(theme);
            const Icon = themeStyle.icon;
            return (
              <div
                key={theme}
                style={reportThemeCssVars(theme)}
                className="rounded-md border border-[color:var(--report-border)] bg-[color:var(--report-bg)] p-3 transition hover:bg-[color:var(--report-hover)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--report-border)] bg-black/10 text-[color:var(--report-accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-atlas-text">{config.shortLabel}</p>
                    <p className="mt-1 min-h-10 text-xs leading-5 text-atlas-muted">{config.description}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <ReportActionButton theme={theme} label="Iniciar" />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evolução diária de menções e risco</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {daily.length ? (
              <LightweightAreaChart
                data={daily}
                xKey="date"
                series={[
                  { key: "mencoes", label: "Menções", color: "#48CFF2", fill: "#48CFF2" },
                  { key: "risco", label: "Risco", color: "#FBBF24" }
                ]}
              />
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentimento por dia</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {daily.length ? (
              <LightweightStackedBars
                data={daily}
                xKey="date"
                series={[
                  { key: "negativo", label: "Negativo", color: "#FB7185" },
                  { key: "neutro", label: "Neutro", color: "#79DFFF" },
                  { key: "positivo", label: "Positivo", color: "#34D399" }
                ]}
              />
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Incidentes por categoria" data={byCategory} />
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por plataforma</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {byPlatform.length ? (
              <LightweightDonut data={byPlatform} palette={palette} />
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Narrativas em crescimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {emergingNarratives.length ? (
              emergingNarratives.map((narrative) => (
                <div key={narrative.id} className="rounded-md border border-atlas-border bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-atlas-text">{narrative.name}</p>
                    <RiskBadge level={narrative.riskScore > 60 ? "Alto" : narrative.riskScore > 40 ? "Moderado" : "Baixo"} score={narrative.riskScore} />
                  </div>
                  <p className="mt-2 text-sm text-atlas-muted">{narrative.centralMessage}</p>
                  <div className="mt-3 h-2 rounded-full bg-white/8">
                    <div className="h-2 rounded-full bg-atlas-action" style={{ width: `${Math.min(100, narrative.growth)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-atlas-muted">Nenhuma narrativa registrada.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <OperationalList title="Alertas críticos" items={criticalIncidents} />
        <OperationalList title="Aguardando triagem" items={triage} />
        <Card>
          <CardHeader>
            <CardTitle>Principais páginas amplificadoras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topActors.length ? (
              topActors.map((actor) => (
                <div key={actor.id} className="flex items-center justify-between rounded-md border border-atlas-border bg-white/5 p-3">
                  <div>
                    <p className="font-medium text-atlas-text">{actor.name}</p>
                    <p className="text-xs text-atlas-muted">
                      {actor.type} · {actor.occurrenceCount} ocorrências
                    </p>
                  </div>
                  <Badge variant={actor.riskScore >= 70 ? "critical" : actor.riskScore >= 50 ? "moderate" : "muted"}>
                    {actor.riskScore}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-atlas-muted">Nenhuma página registrada.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Resumo executivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-atlas-muted">
            <p>
              Nenhum dado demo é carregado automaticamente. A base começa limpa e passa a refletir apenas reports
              cadastrados, importados ou coletados.
            </p>
          </CardContent>
        </Card>
        <PriorityCard
          title="Prioridade próximas 24 horas"
          items={[
            "Registrar reports novos pelo botão do tema correto.",
            "Priorizar reports com maior alcance estimado.",
            "Adicionar observação curta e objetiva para triagem."
          ]}
        />
        <PriorityCard
          title="Prioridade próximos 7 dias"
          items={[
            "Revisar reports recorrentes por página ou narrativa.",
            "Exportar briefing quando houver volume suficiente.",
            "Conectar persistência real quando a operação sair do modo local."
          ]}
        />
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  critical = false
}: {
  icon: typeof Gauge;
  label: string;
  value: string | number;
  critical?: boolean;
}) {
  return (
    <Card className={critical ? "animate-critical-pulse border-red-400/40" : ""}>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase text-atlas-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-atlas-text">{value}</p>
        </div>
        <Icon className={critical ? "h-6 w-6 text-red-200" : "h-6 w-6 text-atlas-action"} />
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length ? (
          <LightweightBarList data={data} />
        ) : (
          <EmptyChart />
        )}
      </CardContent>
    </Card>
  );
}

function OperationalList({ title, items }: { title: string; items: ReturnType<typeof useAtlas>["incidents"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="block rounded-md border border-atlas-border bg-white/5 p-3 transition hover:bg-white/8"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-atlas-text">{incident.title}</p>
                  <p className="mt-1 text-xs text-atlas-muted">{formatDateTime(incident.updatedAt)}</p>
                </div>
                <RiskBadge level={incident.riskLevel} score={incident.riskScore} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="muted">{incident.category}</Badge>
                <ProvenanceBadge value={incident.provenanceType} />
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-atlas-muted">Nenhum report registrado.</p>
        )}
        <Button asChild variant="secondary" size="sm">
          <Link href="/incidents">
            Ver incidentes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function PriorityCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm text-atlas-muted">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-atlas-action" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-atlas-border text-sm text-atlas-muted">
      Nenhum report registrado
    </div>
  );
}
