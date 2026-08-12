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
import { ItemActions } from "@/components/ui/item-actions";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { RiskBadge } from "@/components/ui/risk-badge";
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
import { canWrite } from "@/features/auth/auth";
import { formatDateTime } from "@/utils/date";
import { useAuth } from "@/features/state/auth-store";
import { cn } from "@/lib/utils";

const palette = ["#79DFFF", "#48CFF2", "#FBBF24", "#FB7185", "#34D399", "#A78BFA", "#F97316"];
const periods: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "total", label: "Total" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" }
];

export function CommandCenter() {
  const state = useAtlas();
  const { user } = useAuth();
  const mayWrite = !state.readOnly && canWrite(user);
  const [period, setPeriod] = useState<DashboardPeriod>("24h");
  const analytics = useMemo(() => getDashboardAnalytics(state, period), [period, state]);
  const { kpis } = analytics;

  const kpiCards = [
    { label: "Total de menções / reports", value: kpis.totalReports, icon: Gauge, href: `${state.viewBasePath}/reports` },
    { label: "Incidentes abertos", value: kpis.openIncidents, icon: FileWarning, href: `${state.viewBasePath}/incidents` },
    { label: "Alertas críticos", value: kpis.criticalAlerts, icon: AlertTriangle, critical: kpis.criticalAlerts > 0, href: `${state.viewBasePath}/incidents` },
    { label: "Conteúdos negativos", value: kpis.negative, icon: ShieldAlert, href: `${state.viewBasePath}/reports` },
    { label: "Desinformações", value: kpis.disinformation, icon: Bot, href: `${state.viewBasePath}/desinformacao` },
    { label: "Fraudes detectadas", value: kpis.fraud, icon: Binary, href: `${state.viewBasePath}/fraudes` },
    { label: "Perfis falsos ativos", value: kpis.fakeProfiles, icon: Users, href: `${state.viewBasePath}/fraudes` },
    { label: "Incidentes cibernéticos", value: kpis.cyber, icon: Binary, href: `${state.viewBasePath}/cti` },
    { label: "Ameaças à pessoa", value: kpis.peopleThreats, icon: AlertCircle, href: `${state.viewBasePath}/ameacas` },
    { label: "Atores / páginas", value: kpis.actors, icon: Users, href: `${state.viewBasePath}/atores` },
    { label: "Evidências", value: kpis.evidences, icon: Database, href: `${state.viewBasePath}/evidencias` },
    { label: "Itens em blacklist", value: kpis.blacklist, icon: ShieldAlert, href: `${state.viewBasePath}/blacklist` },
    { label: "Mudança de risco 24h", value: signed(kpis.riskDelta24h), icon: Activity, delta: kpis.riskDelta24h, href: `${state.viewBasePath}/reports` },
    { label: "Mudança de risco 7d", value: signed(kpis.riskDelta7d), icon: Activity, delta: kpis.riskDelta7d, href: `${state.viewBasePath}/reports` }
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

      <section className="grid gap-4 xl:grid-cols-4">
        <SectionInsightCard
          title="Desinformação"
          icon={Bot}
          value={kpis.disinformation}
          data={analytics.categoryDistribution.filter((item) =>
            ["Desinformação", "Conteúdo enganoso", "Conteúdo fora de contexto", "Conteúdo manipulado", "Deepfake", "Narrativa negativa"].includes(item.name)
          )}
          items={analytics.incidents.filter((incident) => ["Desinformação", "Conteúdo enganoso", "Conteúdo fora de contexto", "Conteúdo manipulado", "Deepfake", "Narrativa negativa"].includes(incident.category)).slice(0, 3)}
          basePath={state.viewBasePath}
          href={`${state.viewBasePath}/desinformacao`}
        />
        <SectionInsightCard
          title="Fraudes"
          icon={ShieldAlert}
          value={kpis.fraud}
          data={analytics.categoryDistribution.filter((item) =>
            ["Perfil falso", "Impersonação", "Fraude", "Golpe financeiro"].includes(item.name)
          )}
          items={analytics.incidents.filter((incident) => ["Perfil falso", "Impersonação", "Fraude", "Golpe financeiro"].includes(incident.category)).slice(0, 3)}
          basePath={state.viewBasePath}
          href={`${state.viewBasePath}/fraudes`}
        />
        <SectionInsightCard
          title="Cyber"
          icon={Binary}
          value={kpis.cyber}
          data={analytics.categoryDistribution.filter((item) =>
            ["Phishing", "Domínio fraudulento", "Malware", "Vazamento de credencial", "Ataque contra conta", "Ataque contra site", "Incidente cibernético", "Exposição de dados"].includes(item.name)
          )}
          items={analytics.incidents.filter((incident) => ["Phishing", "Domínio fraudulento", "Malware", "Vazamento de credencial", "Ataque contra conta", "Ataque contra site", "Incidente cibernético", "Exposição de dados"].includes(incident.category)).slice(0, 3)}
          basePath={state.viewBasePath}
          href={`${state.viewBasePath}/cti`}
        />
        <SectionInsightCard
          title="Ameaças"
          icon={AlertCircle}
          value={kpis.peopleThreats}
          data={analytics.categoryDistribution.filter((item) =>
            ["Exposição de agenda", "Exposição de localização", "Assédio", "Ameaça física", "Incitação à violência"].includes(item.name)
          )}
          items={analytics.incidents.filter((incident) => ["Exposição de agenda", "Exposição de localização", "Assédio", "Ameaça física", "Incitação à violência"].includes(incident.category) || incident.threatLevel >= 2).slice(0, 3)}
          basePath={state.viewBasePath}
          href={`${state.viewBasePath}/ameacas`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <SectionInsightCard
          title="Atores e páginas"
          icon={Users}
          value={kpis.actors}
          data={analytics.topActors.map((actor) => ({ name: actor.name, value: actor.reports, percent: 0 }))}
          summaryItems={analytics.topActors.map((actor) => ({
            id: actor.id,
            title: actor.name,
            subtitle: `${actor.platform} · ${actor.role}`,
            value: actor.reports,
            href: `${state.viewBasePath}/atores`
          }))}
          href={`${state.viewBasePath}/atores`}
        />
        <SectionInsightCard
          title="Narrativas"
          icon={Activity}
          value={kpis.narratives}
          data={analytics.topNarratives.map((narrative) => ({ name: narrative.name, value: narrative.volume, percent: 0 }))}
          summaryItems={analytics.topNarratives.map((narrative) => ({
            id: narrative.id,
            title: narrative.name,
            subtitle: `${narrative.sentiment} · ${narrative.status}`,
            value: narrative.volume,
            href: `${state.viewBasePath}/narrativas`
          }))}
          href={`${state.viewBasePath}/narrativas`}
        />
        <SectionInsightCard
          title="Evidências"
          icon={Database}
          value={kpis.evidences}
          data={analytics.recentEvidences.map((evidence) => ({ name: evidence.type, value: 1, percent: 0 }))}
          summaryItems={analytics.recentEvidences.map((evidence) => ({
            id: evidence.id,
            title: evidence.incidentTitle,
            subtitle: `${evidence.type} · ${evidence.source}`,
            href: `${state.viewBasePath}/incidents/${evidence.incidentId}`
          }))}
          href={`${state.viewBasePath}/evidencias`}
        />
        <SectionInsightCard
          title="Blacklist"
          icon={ShieldAlert}
          value={kpis.blacklist}
          data={analytics.blacklist.slice(0, 6).map((entry) => ({ name: entry.kind, value: 1, percent: 0 }))}
          summaryItems={analytics.blacklist.slice(0, 3).map((entry) => ({
            id: entry.id,
            title: entry.value,
            subtitle: `${entry.kind} · ${entry.status}`,
            href: `${state.viewBasePath}/blacklist`
          }))}
          href={`${state.viewBasePath}/blacklist`}
        />
      </section>

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
        <NarrativesPanel
          items={analytics.topNarratives}
          basePath={state.viewBasePath}
          mayWrite={mayWrite}
          onDelete={(narrative) => {
            if (!user) return;
            const confirmed = window.confirm(`Excluir a narrativa "${narrative.name}"?`);
            if (!confirmed) return;
            state.deleteNarrative(narrative.id, user);
          }}
        />
        <ActorsPanel
          items={analytics.topActors}
          basePath={state.viewBasePath}
          mayWrite={mayWrite}
          onDelete={(actor) => {
            if (!user) return;
            const confirmed = window.confirm(`Excluir o ator/página "${actor.name}"?`);
            if (!confirmed) return;
            state.deleteActor(actor.id, user);
          }}
        />
        <SourcesPanel items={analytics.topSources} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <AlertsPanel items={analytics.criticalAlerts} basePath={state.viewBasePath} />
        <IncidentList
          title="Aguardando triagem"
          items={analytics.triage}
          basePath={state.viewBasePath}
          mayWrite={mayWrite}
          onDelete={(incident) => {
            if (!user) return;
            const confirmed = window.confirm(`Excluir o report "${incident.title}"?`);
            if (!confirmed) return;
            state.deleteIncident(incident.id, user);
          }}
        />
        <EvidencePanel
          items={analytics.recentEvidences}
          basePath={state.viewBasePath}
          mayWrite={mayWrite}
          onDelete={(evidenceId) => {
            if (!user) return;
            const evidence = state.evidences.find((item) => item.id === evidenceId);
            const confirmed = window.confirm(`Excluir a evidência "${evidence?.description ?? evidenceId}"?`);
            if (!confirmed) return;
            state.deleteEvidence(evidenceId, user);
          }}
        />
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
  delta,
  href
}: {
  icon: typeof Gauge;
  label: string;
  value: string | number;
  critical?: boolean;
  delta?: number;
  href?: string;
}) {
  const deltaTone =
    delta === undefined ? "" : delta > 0 ? "text-red-200" : delta < 0 ? "text-emerald-200" : "text-atlas-muted";
  const content = (
    <Card className={cn(
      critical ? "animate-critical-pulse border-red-400/40" : "",
      href ? "h-full transition hover:-translate-y-0.5 hover:border-atlas-action/60 hover:bg-atlas-card" : ""
    )}>
      <CardContent className="flex min-h-[96px] items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] uppercase leading-4 text-atlas-muted">{label}</p>
          <p className={`mt-2 font-display text-3xl font-semibold text-atlas-text ${deltaTone}`}>{value}</p>
        </div>
        <Icon className={critical ? "h-6 w-6 shrink-0 text-red-200" : "h-6 w-6 shrink-0 text-atlas-action"} />
      </CardContent>
    </Card>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-action/70">
      {content}
    </Link>
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

function SectionInsightCard({
  title,
  icon: Icon,
  value,
  data,
  items,
  summaryItems,
  basePath = "",
  href
}: {
  title: string;
  icon: typeof Gauge;
  value: number;
  data: CountEntry[];
  items?: Array<{ id: string; title: string; category: string; riskScore: number; riskLevel: RiskLevel; updatedAt: string }>;
  summaryItems?: Array<{ id: string; title: string; subtitle: string; value?: number; href: string }>;
  basePath?: string;
  href?: string;
}) {
  const normalizedData = compactCounts(data);
  const content = (
    <Card className={cn(
      "relative h-full",
      href ? "transition hover:-translate-y-0.5 hover:border-atlas-action/60 hover:bg-atlas-card" : ""
    )}>
      {href ? (
        <Link
          href={href}
          className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-action/70"
          aria-label={`Abrir aba ${title}`}
        />
      ) : null}
      <CardHeader>
        <div className="relative z-10 flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <Icon className="h-5 w-5 text-atlas-action" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10 space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-atlas-muted">Registros no período</p>
            <p className="mt-1 font-display text-3xl font-semibold text-atlas-text">{value}</p>
          </div>
          <Badge variant="muted">{normalizedData.length ? `${normalizedData.length} grupos` : "sem volume"}</Badge>
        </div>
        <div className="h-28">
          {normalizedData.length ? <LightweightBarList data={normalizedData} /> : <EmptyChart />}
        </div>
        <div className="space-y-2">
          {items?.length
            ? items.map((item) => (
                <Link
                  key={item.id}
                  href={`${basePath}/incidents/${item.id}`}
                  className="relative z-20 block rounded-md border border-atlas-border bg-white/5 p-2 transition hover:bg-white/8"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-atlas-text">{item.title}</p>
                      <p className="mt-1 text-xs text-atlas-muted">{item.category} · {formatDateTime(item.updatedAt)}</p>
                    </div>
                    <RiskBadge level={item.riskLevel} score={item.riskScore} />
                  </div>
                </Link>
              ))
            : summaryItems?.length
              ? summaryItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="relative z-20 flex items-center justify-between gap-3 rounded-md border border-atlas-border bg-white/5 p-2 text-sm transition hover:bg-white/8"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-atlas-text">{item.title}</span>
                      <span className="mt-1 block truncate text-xs text-atlas-muted">{item.subtitle}</span>
                    </span>
                    {item.value !== undefined ? <span className="font-display text-lg text-atlas-text">{item.value}</span> : null}
                  </Link>
                ))
              : <EmptyState>Nenhum item registrado nesta seção.</EmptyState>}
        </div>
      </CardContent>
    </Card>
  );

  return content;
}

function NarrativesPanel({
  items,
  basePath,
  mayWrite,
  onDelete
}: {
  items: ReturnType<typeof getDashboardAnalytics>["topNarratives"];
  basePath: string;
  mayWrite: boolean;
  onDelete: (narrative: ReturnType<typeof getDashboardAnalytics>["topNarratives"][number]) => void;
}) {
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
                <div className="flex shrink-0 items-start gap-2">
                  <RiskBadge level={riskLevelFromScore(narrative.riskScore)} score={narrative.riskScore} />
                  {mayWrite ? (
                    <ItemActions
                      editHref={`${basePath}/narrativas`}
                      onDelete={() => onDelete(narrative)}
                      editLabel="Editar narrativa"
                      deleteLabel="Excluir narrativa"
                    />
                  ) : null}
                </div>
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

function ActorsPanel({
  items,
  basePath,
  mayWrite,
  onDelete
}: {
  items: ReturnType<typeof getDashboardAnalytics>["topActors"];
  basePath: string;
  mayWrite: boolean;
  onDelete: (actor: ReturnType<typeof getDashboardAnalytics>["topActors"][number]) => void;
}) {
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
              <div className="flex shrink-0 items-center gap-2">
                <RiskBadge level={riskLevelFromScore(actor.riskScore)} score={actor.riskScore} />
                {mayWrite ? (
                  <ItemActions
                    editHref={`${basePath}/atores`}
                    onDelete={() => onDelete(actor)}
                    editLabel="Editar ator ou página"
                    deleteLabel="Excluir ator ou página"
                  />
                ) : null}
              </div>
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

function AlertsPanel({ items, basePath }: { items: DashboardAlert[]; basePath: string }) {
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
                  <Link href={`${basePath}/incidents/${alert.incidentId}`} className="ml-auto text-xs font-medium text-atlas-action hover:text-atlas-tech">
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
          <Link href={`${basePath}/incidents`}>
            Ver incidentes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function IncidentList({
  title,
  items,
  basePath,
  mayWrite,
  onDelete
}: {
  title: string;
  items: ReturnType<typeof getDashboardAnalytics>["triage"];
  basePath: string;
  mayWrite: boolean;
  onDelete: (incident: ReturnType<typeof getDashboardAnalytics>["triage"][number]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((incident) => (
            <div key={incident.id} className="rounded-md border border-atlas-border bg-white/5 p-3 transition hover:bg-white/8">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-atlas-text">{incident.title}</p>
                  <p className="mt-1 text-xs text-atlas-muted">{formatDateTime(incident.updatedAt)}</p>
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <RiskBadge level={incident.riskLevel} score={incident.riskScore} />
                  {mayWrite ? (
                    <ItemActions
                      editHref={`${basePath}/incidents/${incident.id}`}
                      onDelete={() => onDelete(incident)}
                      editLabel="Editar report"
                      deleteLabel="Excluir report"
                    />
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="muted">{incident.category}</Badge>
                <ProvenanceBadge value={incident.provenanceType} />
              </div>
              <Button asChild variant="ghost" size="sm" className="mt-3">
                <Link href={`${basePath}/incidents/${incident.id}`}>Abrir detalhe</Link>
              </Button>
            </div>
          ))
        ) : (
          <EmptyState>Nenhum report aguardando triagem.</EmptyState>
        )}
        <Button asChild variant="secondary" size="sm">
          <Link href={`${basePath}/incidents`}>
            Ver incidentes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function EvidencePanel({
  items,
  basePath,
  mayWrite,
  onDelete
}: {
  items: DashboardEvidence[];
  basePath: string;
  mayWrite: boolean;
  onDelete: (evidenceId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidências recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((evidence) => (
            <div key={evidence.id} className="rounded-md border border-atlas-border bg-white/5 p-3 transition hover:bg-white/8">
              <div className="flex items-start justify-between gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-atlas-action" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-atlas-text">{evidence.incidentTitle}</p>
                  <p className="mt-1 text-xs text-atlas-muted">
                    {evidence.type} · {evidence.source || "fonte não informada"}
                  </p>
                  <p className="mt-1 text-xs text-atlas-muted">{formatDateTime(evidence.collectedAt)}</p>
                </div>
                {mayWrite ? (
                  <ItemActions
                    editHref={`${basePath}/incidents/${evidence.incidentId}`}
                    onDelete={() => onDelete(evidence.id)}
                    editLabel="Editar evidência"
                    deleteLabel="Excluir evidência"
                  />
                ) : null}
              </div>
              <Button asChild variant="ghost" size="sm" className="mt-3">
                <Link href={`${basePath}/incidents/${evidence.incidentId}`}>Abrir detalhe</Link>
              </Button>
            </div>
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

function compactCounts(data: CountEntry[]): CountEntry[] {
  const totals = new Map<string, number>();
  data.forEach((item) => {
    if (!item.name) return;
    totals.set(item.name, (totals.get(item.name) ?? 0) + item.value);
  });
  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(totals.entries())
    .map(([name, value]) => ({
      name,
      value,
      percent: total ? Math.round((value / total) * 100) : 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);
}
