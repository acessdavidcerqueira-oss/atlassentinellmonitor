"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Binary,
  Bot,
  CheckCircle2,
  Database,
  FileText,
  FileWarning,
  Gauge,
  Link2,
  ShieldAlert,
  Users
} from "lucide-react";
import type { RiskLevel } from "@/types/domain";
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
  LightweightDonut
} from "@/components/ui/lightweight-charts";
import { useAtlas } from "@/features/state/atlas-store";
import {
  getDashboardAnalytics,
  type CountEntry,
  type DashboardAlert,
  type DashboardEvidence,
  type DashboardPeriod
} from "@/services/dashboard-analytics";
import { reportThemeDefinitions, type ReportTheme } from "@/services/simple-report";
import { formatDateTime } from "@/utils/date";

const palette = ["#79DFFF", "#48CFF2", "#FBBF24", "#FB7185", "#34D399", "#A78BFA", "#F97316"];
const periods: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" }
];
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
  const [period, setPeriod] = useState<DashboardPeriod>("24h");
  const analytics = useMemo(() => getDashboardAnalytics(state, period), [period, state]);
  const { kpis } = analytics;

  const kpiCards = [
    { label: "Total de menções / reports", value: kpis.totalReports, icon: Gauge },
    { label: "Incidentes abertos", value: kpis.openIncidents, icon: FileWarning },
    { label: "Alertas críticos", value: kpis.criticalAlerts, icon: AlertTriangle, critical: kpis.criticalAlerts > 0 },
    { label: "Conteúdos negativos", value: kpis.negative, icon: ShieldAlert },
    { label: "Desinformações", value: kpis.disinformation, icon: Bot },
    { label: "Fraudes detectadas", value: kpis.fraud, icon: Binary },
    { label: "Perfis falsos ativos", value: kpis.fakeProfiles, icon: Users },
    { label: "Incidentes cibernéticos", value: kpis.cyber, icon: Binary },
    { label: "Ameaças à pessoa", value: kpis.peopleThreats, icon: AlertCircle },
    { label: "Atores / páginas", value: kpis.actors, icon: Users },
    { label: "Evidências", value: kpis.evidences, icon: Database },
    { label: "Itens em blacklist", value: kpis.blacklist, icon: ShieldAlert },
    { label: "Mudança de risco 24h", value: signed(kpis.riskDelta24h), icon: Activity, delta: kpis.riskDelta24h },
    { label: "Mudança de risco 7d", value: signed(kpis.riskDelta7d), icon: Activity, delta: kpis.riskDelta7d }
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-lg border border-atlas-border bg-atlas-card/70 p-4 shadow-command lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-atlas-tech">War room executiva</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-atlas-text">Command Center</h1>
          <p className="mt-1 text-sm text-atlas-muted">
            Visão consolidada de reports, narrativas, ameaças, atores, evidências, blacklist, importações e auditoria.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted">{analytics.periodLabel}</Badge>
          <div className="flex rounded-md border border-atlas-border bg-white/5 p-1">
            {periods.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                className={`h-8 rounded px-3 text-xs font-medium transition ${
                  period === item.value
                    ? "bg-atlas-action text-[#00121c]"
                    : "text-atlas-muted hover:bg-white/8 hover:text-atlas-text"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {kpiCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
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

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evolução de menções, incidentes e risco</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {analytics.incidents.length ? (
              <LightweightAreaChart
                data={analytics.temporal}
                xKey="date"
                series={[
                  { key: "mentions", label: "Menções", color: "#48CFF2", fill: "#48CFF2" },
                  { key: "incidents", label: "Incidentes", color: "#79DFFF" },
                  { key: "risk", label: "Risco médio", color: "#FBBF24" }
                ]}
              />
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentimento geral</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {analytics.sentimentDistribution.length ? (
              <div className="grid h-full items-center gap-4">
                <LightweightDonut data={analytics.sentimentDistribution} palette={["#FB7185", "#79DFFF", "#34D399", "#A78BFA", "#8FA9BE"]} />
              </div>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <ChartCard title="Incidentes por módulo" data={analytics.moduleDistribution} />
        <ChartCard title="Severidade" data={analytics.severityDistribution} color="#FBBF24" />
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por plataforma</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {analytics.platformDistribution.length ? (
              <LightweightDonut data={analytics.platformDistribution} palette={palette} />
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
        <ChartCard title="Status operacional" data={analytics.statusDistribution} color="#34D399" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <NarrativesPanel items={analytics.topNarratives} />
        <ActorsPanel items={analytics.topActors} />
        <SourcesPanel items={analytics.topSources} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <AlertsPanel items={analytics.criticalAlerts} />
        <IncidentList title="Aguardando triagem" items={analytics.triage} />
        <EvidencePanel items={analytics.recentEvidences} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.95fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Resumo executivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-atlas-muted">
            <p>{analytics.executiveSummary}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <MiniStat label="Risco médio" value={kpis.averageRisk} />
              <MiniStat label="Risco máximo" value={kpis.maxRisk} />
              <MiniStat label="Auditoria" value={kpis.auditEvents} />
            </div>
            {analytics.unavailableSignals.length ? (
              <p className="text-xs text-atlas-muted">
                Sinais ainda sem volume suficiente: {analytics.unavailableSignals.join(", ")}.
              </p>
            ) : null}
          </CardContent>
        </Card>
        <PriorityCard title="Prioridade próximas 24 horas" items={analytics.priorities24h} />
        <PriorityCard title="Prioridade próximos 7 dias" items={analytics.priorities7d} />
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  critical = false,
  delta
}: {
  icon: typeof Gauge;
  label: string;
  value: string | number;
  critical?: boolean;
  delta?: number;
}) {
  const deltaTone =
    delta === undefined ? "" : delta > 0 ? "text-red-200" : delta < 0 ? "text-emerald-200" : "text-atlas-muted";

  return (
    <Card className={critical ? "animate-critical-pulse border-red-400/40" : ""}>
      <CardContent className="flex min-h-[96px] items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] uppercase leading-4 text-atlas-muted">{label}</p>
          <p className={`mt-2 font-display text-3xl font-semibold text-atlas-text ${deltaTone}`}>{value}</p>
        </div>
        <Icon className={critical ? "h-6 w-6 shrink-0 text-red-200" : "h-6 w-6 shrink-0 text-atlas-action"} />
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, data, color = "#48CFF2" }: { title: string; data: CountEntry[]; color?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length ? (
          <LightweightBarList data={data} color={color} />
        ) : (
          <EmptyChart />
        )}
      </CardContent>
    </Card>
  );
}

function NarrativesPanel({ items }: { items: ReturnType<typeof getDashboardAnalytics>["topNarratives"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Narrativas em crescimento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((narrative) => (
            <div key={narrative.id} className="rounded-md border border-atlas-border bg-white/5 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-atlas-text">{narrative.name}</p>
                  <p className="mt-1 text-xs text-atlas-muted">
                    {narrative.volume} reports · {narrative.sentiment} · {narrative.status}
                  </p>
                </div>
                <RiskBadge level={riskLevelFromScore(narrative.riskScore)} score={narrative.riskScore} />
              </div>
              {narrative.trend !== undefined ? (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-atlas-muted">
                    <span>Tendência</span>
                    <span>{narrative.trend}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/8">
                    <div className="h-2 rounded-full bg-atlas-action" style={{ width: `${Math.min(100, narrative.trend)}%` }} />
                  </div>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <EmptyState>Nenhuma narrativa registrada no período.</EmptyState>
        )}
      </CardContent>
    </Card>
  );
}

function ActorsPanel({ items }: { items: ReturnType<typeof getDashboardAnalytics>["topActors"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Principais atores / páginas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((actor) => (
            <div key={actor.id} className="flex items-center justify-between gap-3 rounded-md border border-atlas-border bg-white/5 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-atlas-text">{actor.name}</p>
                <p className="mt-1 text-xs text-atlas-muted">
                  {actor.platform} · {actor.reports} reports · {actor.role}
                </p>
              </div>
              <RiskBadge level={riskLevelFromScore(actor.riskScore)} score={actor.riskScore} />
            </div>
          ))
        ) : (
          <EmptyState>Nenhum ator ou página associado a reports no período.</EmptyState>
        )}
      </CardContent>
    </Card>
  );
}

function SourcesPanel({ items }: { items: ReturnType<typeof getDashboardAnalytics>["topSources"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Principais fontes / domínios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((source) => (
            <div key={source.name} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-atlas-border bg-white/5 p-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-atlas-muted">
                <Link2 className="h-4 w-4 shrink-0 text-atlas-action" />
                <span className="truncate">{source.name}</span>
              </span>
              <span className="font-display text-lg font-semibold text-atlas-text">{source.value}</span>
            </div>
          ))
        ) : (
          <EmptyState>Nenhuma fonte ou domínio registrado no período.</EmptyState>
        )}
      </CardContent>
    </Card>
  );
}

function AlertsPanel({ items }: { items: DashboardAlert[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas críticos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((alert) => (
            <div key={alert.id} className="rounded-md border border-red-300/20 bg-red-500/8 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-atlas-text">{alert.title}</p>
                  <p className="mt-1 text-xs text-atlas-muted">{formatDateTime(alert.date)}</p>
                </div>
                <RiskBadge level={alert.severity} score={alert.riskScore} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="muted">{alert.category}</Badge>
                <Badge variant="critical">{alert.status}</Badge>
                {alert.incidentId ? (
                  <Link href={`/incidents/${alert.incidentId}`} className="ml-auto text-xs font-medium text-atlas-action hover:text-atlas-tech">
                    Ver incidente
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <EmptyState>Nenhum alerta crítico ou alto ativo.</EmptyState>
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

function IncidentList({ title, items }: { title: string; items: ReturnType<typeof getDashboardAnalytics>["triage"] }) {
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
                <div className="min-w-0">
                  <p className="truncate font-medium text-atlas-text">{incident.title}</p>
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
          <EmptyState>Nenhum report aguardando triagem.</EmptyState>
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

function EvidencePanel({ items }: { items: DashboardEvidence[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidências recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((evidence) => (
            <Link
              key={evidence.id}
              href={`/incidents/${evidence.incidentId}`}
              className="block rounded-md border border-atlas-border bg-white/5 p-3 transition hover:bg-white/8"
            >
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-atlas-action" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-atlas-text">{evidence.incidentTitle}</p>
                  <p className="mt-1 text-xs text-atlas-muted">
                    {evidence.type} · {evidence.source || "fonte não informada"}
                  </p>
                  <p className="mt-1 text-xs text-atlas-muted">{formatDateTime(evidence.collectedAt)}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState>Nenhuma evidência registrada no período.</EmptyState>
        )}
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
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-atlas-action" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-atlas-border bg-white/5 p-3">
      <p className="text-xs uppercase text-atlas-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-atlas-text">{value}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-atlas-border text-sm text-atlas-muted">
      Nenhum report registrado no período
    </div>
  );
}

function EmptyState({ children }: { children: string }) {
  return <p className="text-sm leading-6 text-atlas-muted">{children}</p>;
}

function signed(value: number): string {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score <= 20) return "Informativo";
  if (score <= 40) return "Baixo";
  if (score <= 60) return "Moderado";
  if (score <= 80) return "Alto";
  return "Crítico";
}
