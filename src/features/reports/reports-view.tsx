"use client";

import Image from "next/image";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItemActions } from "@/components/ui/item-actions";
import { RiskBadge } from "@/components/ui/risk-badge";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";
import { canWrite } from "@/features/auth/auth";
import { exportIncidentsCsv } from "@/services/csv-import";
import { getDashboardAnalytics } from "@/services/dashboard-analytics";
import { formatDateTime } from "@/utils/date";
import type { Actor, BlacklistEntry, Evidence, Incident, Narrative, RiskLevel } from "@/types/domain";

interface PageGroup {
  name: string;
  reports: number;
  reach: number;
  platforms: string[];
  categories: string[];
  latest: string;
  maxRisk: number;
  riskLevel: RiskLevel;
}

const modules = [
  {
    title: "Desinformação",
    description: "Fake news, conteúdo enganoso, fora de contexto, manipulado e narrativas negativas.",
    predicate: (incident: Incident) =>
      ["Desinformação", "Conteúdo enganoso", "Conteúdo fora de contexto", "Conteúdo manipulado", "Deepfake", "Narrativa negativa"].includes(incident.category)
  },
  {
    title: "Fraudes e Impersonação",
    description: "Perfis falsos, golpes, impersonação, phishing e domínios fraudulentos.",
    predicate: (incident: Incident) =>
      ["Perfil falso", "Impersonação", "Fraude", "Golpe financeiro", "Phishing", "Domínio fraudulento"].includes(incident.category)
  },
  {
    title: "Cyber Threats",
    description: "Phishing, malware, vazamento de credencial, ataque contra conta/site e incidente cibernético.",
    predicate: (incident: Incident) =>
      ["Phishing", "Domínio fraudulento", "Malware", "Vazamento de credencial", "Ataque contra conta", "Ataque contra site", "Incidente cibernético", "Exposição de dados"].includes(incident.category)
  },
  {
    title: "Ameaças à Pessoa",
    description: "Assédio, ameaça física, incitação à violência, exposição de agenda ou localização.",
    predicate: (incident: Incident) =>
      ["Ameaça física", "Incitação à violência", "Assédio", "Exposição de agenda", "Exposição de localização"].includes(incident.category) ||
      incident.threatLevel >= 2
  },
  {
    title: "Coordenação",
    description: "Movimentos coordenados, repetição, amplificação ou indícios de ação conjunta.",
    predicate: (incident: Incident) => incident.category === "Movimento coordenado" || incident.coordinationLevel !== "Não identificado"
  }
];

export function ReportsView() {
  const state = useAtlas();
  const { user } = useAuth();
  const mayWrite = !state.readOnly && canWrite(user);
  const allIncidents = state.incidents
    .filter((incident) => !incident.deletedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const last24 = allIncidents.filter((incident) => Date.now() - new Date(incident.collectedAt).getTime() <= 24 * 60 * 60 * 1000);
  const critical = allIncidents.filter((incident) => incident.riskScore > 70 || incident.threatLevel >= 4);
  const analytics = getDashboardAnalytics(state, "total");
  const pageGroups = buildPageGroups(allIncidents);

  function exportCsv() {
    const blob = new Blob([exportIncidentsCsv(state)], { type: "text/csv" });
    downloadBlob(blob, "atlas-sentinel-relatorio-completo.csv");
  }

  function exportJson() {
    const payload = {
      generatedAt: new Date().toISOString(),
      monitoredEntity: state.activeEntityName,
      kpis: analytics.kpis,
      pages: pageGroups,
      incidents: allIncidents,
      actors: state.actors,
      narratives: state.narratives,
      evidences: state.evidences,
      blacklist: state.blacklist,
      alerts: state.alerts,
      imports: state.imports,
      auditLogs: state.auditLogs
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, "atlas-sentinel-relatorio-completo.json");
  }

  function deleteIncident(incident: Incident) {
    if (!user || !mayWrite) return;
    const confirmed = window.confirm(`Excluir o report "${incident.title}"?`);
    if (!confirmed) return;
    state.deleteIncident(incident.id, user);
  }

  function deleteNarrative(narrative: Narrative) {
    if (!user || !mayWrite) return;
    const confirmed = window.confirm(`Excluir a narrativa "${narrative.name}"?`);
    if (!confirmed) return;
    state.deleteNarrative(narrative.id, user);
  }

  function deleteActor(actor: Actor) {
    if (!user || !mayWrite) return;
    const confirmed = window.confirm(`Excluir o ator/página "${actor.name}"?`);
    if (!confirmed) return;
    state.deleteActor(actor.id, user);
  }

  function deleteEvidence(evidence: Evidence) {
    if (!user || !mayWrite) return;
    const confirmed = window.confirm(`Excluir a evidência "${evidence.description}"?`);
    if (!confirmed) return;
    state.deleteEvidence(evidence.id, user);
  }

  function deleteBlacklist(entry: BlacklistEntry) {
    if (!user || !mayWrite) return;
    const confirmed = window.confirm(`Excluir "${entry.value}" da blacklist?`);
    if (!confirmed) return;
    state.deleteBlacklistEntry(entry.id, user);
  }

  return (
    <div>
      <PageTitle
        title="Relatórios"
        description="Relatório completo por páginas, categorias, abas operacionais, KPIs e conteúdos registrados."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" />CSV</Button>
            <Button variant="secondary" onClick={exportJson}><Download className="h-4 w-4" />JSON</Button>
            <Button onClick={() => window.print()}><Printer className="h-4 w-4" />PDF completo</Button>
            <ReportActionButton theme="geral" label="Novo report" />
          </>
        }
      />

      <Card className="print:border-slate-200 print:bg-white">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-md border border-atlas-border">
            <Image src="/atlas-sentinel-mark.png" alt="Atlas Sentinel" fill sizes="48px" className="object-contain" />
          </div>
          <div>
            <CardTitle>Relatório executivo completo</CardTitle>
            <p className="text-sm text-atlas-muted">
              {state.activeEntityName} · Gerado em {formatDateTime(new Date().toISOString())}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <section>
            <h2 className="font-display text-xl font-semibold">Resumo geral</h2>
            <p className="mt-2 text-sm leading-6 text-atlas-muted">
              Foram registrados {allIncidents.length} reports no histórico, sendo {last24.length} nas últimas 24h. O relatório consolida dados do Command Center, Reports, Narrative Radar, Desinformação, Fraudes, Cyber Threats, Ameaças, Atores, Evidências, Blacklist, Importações e Auditoria.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
              <ReportBlock title="Reports totais" value={allIncidents.length} />
              <ReportBlock title="Incidentes abertos" value={analytics.kpis.openIncidents} />
              <ReportBlock title="Críticos/altos" value={critical.length} />
              <ReportBlock title="Evidências" value={state.evidences.length} />
              <ReportBlock title="Itens blacklist" value={state.blacklist.length} />
              <ReportBlock title="Atores/páginas" value={state.actors.length} />
              <ReportBlock title="Narrativas" value={state.narratives.length} />
              <ReportBlock title="Alertas" value={state.alerts.length} />
              <ReportBlock title="Importações" value={state.imports.length} />
              <ReportBlock title="Auditoria" value={state.auditLogs.length} />
            </div>
          </section>

          <section>
            <SectionTitle title="KPIs por aba operacional" />
            <div className="grid gap-4 xl:grid-cols-2">
              <ModuleSummary
                title="Command Center"
                description="Visão consolidada geral do histórico."
                incidents={allIncidents}
                extra={`${formatNumber(analytics.kpis.averageRisk)} risco médio · ${formatNumber(analytics.kpis.maxRisk)} risco máximo`}
              />
              <ModuleSummary
                title="Reports"
                description="Todos os reports cadastrados na plataforma."
                incidents={allIncidents}
                extra={`${formatNumber(totalReach(allIncidents))} alcance estimado somado`}
              />
              {modules.map((module) => (
                <ModuleSummary
                  key={module.title}
                  title={module.title}
                  description={module.description}
                  incidents={allIncidents.filter(module.predicate)}
                />
              ))}
              <ModuleSummary
                title="Narrative Radar"
                description="Narrativas cadastradas, recorrentes ou em crescimento."
                incidents={allIncidents.filter((incident) => incident.relatedNarrativeIds.length > 0 || incident.category === "Narrativa negativa")}
                extra={`${state.narratives.length} narrativas registradas`}
              />
              <ModuleSummary
                title="Atores e Páginas"
                description="Perfis, páginas, autores e amplificadores registrados."
                incidents={allIncidents.filter((incident) => incident.relatedActorIds.length > 0)}
                extra={`${state.actors.length} atores/páginas cadastrados`}
              />
              <ModuleSummary
                title="Evidências"
                description="Arquivos, links, prints, documentos e observações de apoio."
                incidents={allIncidents.filter((incident) => state.evidences.some((evidence) => evidence.incidentId === incident.id))}
                extra={`${state.evidences.length} evidências registradas`}
              />
            </div>
          </section>

          <section>
            <SectionTitle title="Páginas, perfis e fontes mencionadas" />
            <div className="overflow-x-auto rounded-md border border-atlas-border">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase text-atlas-muted">
                  <tr>
                    <th className="px-3 py-3">Página/perfil/fonte</th>
                    <th className="px-3 py-3">Reports</th>
                    <th className="px-3 py-3">Alcance</th>
                    <th className="px-3 py-3">Risco máx.</th>
                    <th className="px-3 py-3">Plataformas</th>
                    <th className="px-3 py-3">Categorias</th>
                    <th className="px-3 py-3">Último registro</th>
                  </tr>
                </thead>
                <tbody>
                  {pageGroups.length ? (
                    pageGroups.map((page) => (
                      <tr key={page.name} className="border-t border-atlas-border">
                        <td className="px-3 py-3 font-medium text-atlas-text">{page.name}</td>
                        <td className="px-3 py-3">{page.reports}</td>
                        <td className="px-3 py-3">{formatNumber(page.reach)}</td>
                        <td className="px-3 py-3"><RiskBadge level={page.riskLevel} score={page.maxRisk} /></td>
                        <td className="px-3 py-3 text-atlas-muted">{page.platforms.join(", ") || "Não disponível"}</td>
                        <td className="px-3 py-3 text-atlas-muted">{page.categories.join(", ") || "Não disponível"}</td>
                        <td className="px-3 py-3">{formatDateTime(page.latest)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-8 text-center text-atlas-muted" colSpan={7}>Nenhuma página registrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <SectionTitle title="Reports registrados" />
            <div className="space-y-3">
              {allIncidents.length ? (
                allIncidents.map((incident) => (
                  <IncidentReportCard
                    key={incident.id}
                    incident={incident}
                    basePath={state.viewBasePath}
                    mayWrite={mayWrite}
                    onDelete={() => deleteIncident(incident)}
                  />
                ))
              ) : (
                <EmptyText>Nenhum report registrado.</EmptyText>
              )}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <ListPanel title="Narrativas" empty="Nenhuma narrativa registrada.">
              {state.narratives.map((narrative) => (
                <CompactItem
                  key={narrative.id}
                  title={narrative.name}
                  subtitle={`${narrative.status} · ${narrative.polarity} · volume ${narrative.volume}`}
                  badge={<RiskBadge level={riskLevelFromScore(narrative.riskScore)} score={narrative.riskScore} />}
                  actions={
                    mayWrite ? (
                      <ItemActions
                        editHref={`${state.viewBasePath}/narrativas`}
                        onDelete={() => deleteNarrative(narrative)}
                        editLabel="Editar narrativa"
                        deleteLabel="Excluir narrativa"
                      />
                    ) : null
                  }
                />
              ))}
            </ListPanel>

            <ListPanel title="Atores e páginas" empty="Nenhum ator ou página registrado.">
              {state.actors.map((actor) => (
                <CompactItem
                  key={actor.id}
                  title={actor.name}
                  subtitle={`${actor.platform || "Plataforma não informada"} · ${actor.type} · ${formatFollowers(actor)}`}
                  badge={<RiskBadge level={riskLevelFromScore(actor.riskScore)} score={actor.riskScore} />}
                  actions={
                    mayWrite ? (
                      <ItemActions
                        editHref={`${state.viewBasePath}/atores`}
                        onDelete={() => deleteActor(actor)}
                        editLabel="Editar ator ou página"
                        deleteLabel="Excluir ator ou página"
                      />
                    ) : null
                  }
                />
              ))}
            </ListPanel>

            <ListPanel title="Evidências" empty="Nenhuma evidência registrada.">
              {state.evidences.map((evidence) => (
                <CompactItem
                  key={evidence.id}
                  title={evidence.description}
                  subtitle={`${evidence.type} · ${evidence.source || evidence.url || "Fonte não informada"} · ${formatDateTime(evidence.collectedAt)}`}
                  badge={<Badge variant="muted">{evidence.integrity}</Badge>}
                  actions={
                    mayWrite ? (
                      <ItemActions
                        editHref={`${state.viewBasePath}/incidents/${evidence.incidentId}`}
                        onDelete={() => deleteEvidence(evidence)}
                        editLabel="Editar evidência"
                        deleteLabel="Excluir evidência"
                      />
                    ) : null
                  }
                />
              ))}
            </ListPanel>

            <ListPanel title="Blacklist" empty="Nenhum item de blacklist registrado.">
              {state.blacklist.map((entry) => (
                <CompactItem
                  key={entry.id}
                  title={entry.value}
                  subtitle={`${entry.kind} · ${entry.reason || "Sem motivo informado"} · atualizado em ${formatDateTime(entry.updatedAt)}`}
                  badge={<Badge variant="muted">{entry.status}</Badge>}
                  actions={
                    mayWrite ? (
                      <ItemActions
                        editHref={`${state.viewBasePath}/blacklist`}
                        onDelete={() => deleteBlacklist(entry)}
                        editLabel="Editar item da blacklist"
                        deleteLabel="Excluir item da blacklist"
                      />
                    ) : null
                  }
                />
              ))}
            </ListPanel>
          </section>

          <section>
            <SectionTitle title="Limitação metodológica" />
            <p className="text-sm leading-6 text-atlas-muted">
              O relatório usa apenas dados cadastrados, importados ou coletados na plataforma. Métricas ausentes permanecem como “Não disponível”; inferências analíticas não são apresentadas como fato comprovado.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportBlock({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-md border border-atlas-border bg-white/5 p-4">
      <p className="text-xs uppercase text-atlas-muted">{title}</p>
      <p className="mt-2 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="font-display text-xl font-semibold text-atlas-text">{title}</h2>;
}

function ModuleSummary({
  title,
  description,
  incidents,
  extra
}: {
  title: string;
  description: string;
  incidents: Incident[];
  extra?: string;
}) {
  const criticalOrHigh = incidents.filter((incident) => incident.riskLevel === "Crítico" || incident.riskLevel === "Alto").length;
  const open = incidents.filter((incident) => !["Resolvido", "Arquivado", "Falso positivo"].includes(incident.status)).length;
  return (
    <div className="rounded-md border border-atlas-border bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-atlas-text">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-atlas-muted">{description}</p>
        </div>
        <Badge>{incidents.length} reports</Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ReportBlock title="Abertos" value={open} />
        <ReportBlock title="Críticos/altos" value={criticalOrHigh} />
        <ReportBlock title="Risco médio" value={averageRisk(incidents)} />
      </div>
      {extra ? <p className="mt-3 text-sm text-atlas-muted">{extra}</p> : null}
    </div>
  );
}

function IncidentReportCard({
  incident,
  basePath,
  mayWrite,
  onDelete
}: {
  incident: Incident;
  basePath: string;
  mayWrite: boolean;
  onDelete: () => void;
}) {
  const page = incident.authorName || incident.authorHandle || incident.domain || incident.platform || "Não disponível";
  return (
    <div className="rounded-md border border-atlas-border bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-atlas-text">{page}</h3>
          <p className="mt-1 text-sm leading-6 text-atlas-muted">{incident.summary || incident.content || "Sem resumo informado."}</p>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <RiskBadge level={incident.riskLevel} score={incident.riskScore} />
          {mayWrite ? (
            <ItemActions
              editHref={`${basePath}/incidents/${incident.id}`}
              onDelete={onDelete}
              editLabel="Editar report"
              deleteLabel="Excluir report"
            />
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{incident.category}</Badge>
        <Badge variant="muted">{incident.status}</Badge>
        <Badge variant="muted">{incident.platform || "Plataforma não informada"}</Badge>
        <Badge variant={incident.threatLevel >= 4 ? "critical" : "muted"}>Threat {incident.threatLevel}</Badge>
      </div>
      <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
        <InfoLine label="O que disseram" value={incident.content || incident.summary || "Não disponível"} />
        <InfoLine label="Observação" value={incident.analystNotes || "Sem observação"} />
        <InfoLine label="Alcance estimado" value={incident.reachValue ? formatNumber(incident.reachValue) : "Não disponível"} />
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-atlas-muted">{label}</p>
      <p className="mt-1 text-atlas-text">{value}</p>
    </div>
  );
}

function ListPanel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <div className="rounded-md border border-atlas-border bg-white/5 p-4">
      <h3 className="font-display text-lg font-semibold text-atlas-text">{title}</h3>
      <div className="mt-3 space-y-3">
        {children.length ? children : <EmptyText>{empty}</EmptyText>}
      </div>
    </div>
  );
}

function CompactItem({
  title,
  subtitle,
  badge,
  actions
}: {
  title: string;
  subtitle: string;
  badge: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-atlas-border bg-black/10 p-3">
      <div>
        <p className="font-medium text-atlas-text">{title}</p>
        <p className="mt-1 text-sm leading-5 text-atlas-muted">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-start gap-2">
        {badge}
        {actions}
      </div>
    </div>
  );
}

function EmptyText({ children }: { children: string }) {
  return <p className="text-sm leading-6 text-atlas-muted">{children}</p>;
}

function buildPageGroups(incidents: Incident[]): PageGroup[] {
  const groups = new Map<string, Incident[]>();
  incidents.forEach((incident) => {
    const name = incident.authorName || incident.authorHandle || incident.domain || incident.platform || "Não disponível";
    groups.set(name, [...(groups.get(name) ?? []), incident]);
  });

  return Array.from(groups.entries())
    .map(([name, group]) => {
      const maxRisk = Math.max(...group.map((incident) => incident.riskScore), 0);
      return {
        name,
        reports: group.length,
        reach: totalReach(group),
        platforms: unique(group.map((incident) => incident.platform)),
        categories: unique(group.map((incident) => incident.category)),
        latest: group.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]?.updatedAt ?? "",
        maxRisk,
        riskLevel: riskLevelFromScore(maxRisk)
      };
    })
    .sort((a, b) => b.reports - a.reports || b.maxRisk - a.maxRisk);
}

function totalReach(incidents: Incident[]): number {
  return incidents.reduce((sum, incident) => sum + (incident.reachValue ?? 0), 0);
}

function averageRisk(incidents: Incident[]): number {
  if (!incidents.length) return 0;
  return Math.round(incidents.reduce((sum, incident) => sum + incident.riskScore, 0) / incidents.length);
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score <= 20) return "Informativo";
  if (score <= 40) return "Baixo";
  if (score <= 60) return "Moderado";
  if (score <= 80) return "Alto";
  return "Crítico";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 6);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function formatFollowers(actor: Actor): string {
  return actor.followers ? `${formatNumber(actor.followers)} seguidores` : "Seguidores não informados";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
