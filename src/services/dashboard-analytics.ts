import type {
  Actor,
  Alert,
  AtlasState,
  AuditLog,
  BlacklistEntry,
  Evidence,
  ImportReport,
  Incident,
  Narrative,
  RiskLevel,
  Sentiment
} from "@/types/domain";
import { toDomain } from "@/utils/text";

export type DashboardPeriod = "total" | "24h" | "7d" | "30d";

export interface CountEntry {
  name: string;
  value: number;
  percent: number;
}

export interface TemporalEntry {
  [key: string]: string | number;
  date: string;
  mentions: number;
  incidents: number;
  risk: number;
  negative: number;
  neutral: number;
  positive: number;
}

export interface DashboardKpis {
  totalReports: number;
  totalIncidents: number;
  openIncidents: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  negative: number;
  neutral: number;
  positive: number;
  disinformation: number;
  fraud: number;
  fakeProfiles: number;
  cyber: number;
  peopleThreats: number;
  actors: number;
  narratives: number;
  coordination: number;
  evidences: number;
  blacklist: number;
  imports: number;
  auditEvents: number;
  averageRisk: number;
  maxRisk: number;
  riskDelta24h: number;
  riskDelta7d: number;
  criticalAlerts: number;
}

export interface DashboardNarrative {
  id: string;
  name: string;
  volume: number;
  riskScore: number;
  sentiment: string;
  trend?: number;
  status: Narrative["status"];
}

export interface DashboardActor {
  id: string;
  name: string;
  platform: string;
  reports: number;
  riskScore: number;
  role: string;
}

export interface DashboardSource {
  name: string;
  value: number;
}

export interface DashboardEvidence {
  id: string;
  type: Evidence["type"];
  source: string;
  collectedAt: string;
  incidentId: string;
  incidentTitle: string;
}

export interface DashboardAlert {
  id: string;
  title: string;
  category: string;
  riskScore: number;
  severity: RiskLevel;
  status: Alert["status"] | Incident["status"];
  date: string;
  incidentId?: string;
}

export interface DashboardAnalytics {
  period: DashboardPeriod;
  periodLabel: string;
  windowStart: Date;
  incidents: Incident[];
  evidences: Evidence[];
  alerts: Alert[];
  imports: ImportReport[];
  auditLogs: AuditLog[];
  blacklist: BlacklistEntry[];
  kpis: DashboardKpis;
  temporal: TemporalEntry[];
  sentimentDistribution: CountEntry[];
  moduleDistribution: CountEntry[];
  categoryDistribution: CountEntry[];
  severityDistribution: CountEntry[];
  platformDistribution: CountEntry[];
  statusDistribution: CountEntry[];
  topNarratives: DashboardNarrative[];
  topActors: DashboardActor[];
  topSources: DashboardSource[];
  recentEvidences: DashboardEvidence[];
  criticalAlerts: DashboardAlert[];
  triage: Incident[];
  executiveSummary: string;
  priorities24h: string[];
  priorities7d: string[];
  unavailableSignals: string[];
}

const periodConfig: Record<DashboardPeriod, { label: string; hours: number | null }> = {
  total: { label: "todo histórico", hours: null },
  "24h": { label: "últimas 24h", hours: 24 },
  "7d": { label: "últimos 7 dias", hours: 24 * 7 },
  "30d": { label: "últimos 30 dias", hours: 24 * 30 }
};

const openStatuses: Incident["status"][] = [
  "Novo",
  "Em triagem",
  "Validado",
  "Escalonado",
  "Em tratamento",
  "Monitorando"
];

const disinformationCategories = new Set<string>([
  "Desinformação",
  "Conteúdo enganoso",
  "Conteúdo fora de contexto",
  "Conteúdo manipulado",
  "Deepfake",
  "Narrativa negativa"
]);

const fraudCategories = new Set<string>([
  "Perfil falso",
  "Impersonação",
  "Fraude",
  "Golpe financeiro"
]);

const cyberCategories = new Set<string>([
  "Phishing",
  "Domínio fraudulento",
  "Malware",
  "Vazamento de credencial",
  "Ataque contra conta",
  "Ataque contra site",
  "Incidente cibernético",
  "Exposição de dados"
]);

const peopleThreatCategories = new Set<string>([
  "Exposição de agenda",
  "Exposição de localização",
  "Assédio",
  "Ameaça física",
  "Incitação à violência"
]);

const severityOrder: RiskLevel[] = ["Crítico", "Alto", "Moderado", "Baixo", "Informativo"];
const sentimentOrder: Sentiment[] = ["negativo", "neutro", "positivo", "misto", "não disponível"];

export function getDashboardAnalytics(
  state: AtlasState,
  period: DashboardPeriod,
  now = new Date()
): DashboardAnalytics {
  const config = periodConfig[period];
  const windowStart = config.hours === null ? new Date(0) : new Date(now.getTime() - config.hours * 60 * 60 * 1000);
  const previousWindowStart =
    config.hours === null ? new Date(0) : new Date(windowStart.getTime() - config.hours * 60 * 60 * 1000);
  const incidents = state.incidents
    .filter((incident) => !incident.deletedAt)
    .filter((incident) => isInsideWindow(eventDate(incident), windowStart, now));
  const previousIncidents =
    config.hours === null
      ? []
      : state.incidents
          .filter((incident) => !incident.deletedAt)
          .filter((incident) => {
            const date = eventDate(incident);
            return Boolean(date && date >= previousWindowStart && date < windowStart);
          });
  const incidentIds = new Set(incidents.map((incident) => incident.id));
  const evidences = state.evidences.filter((evidence) =>
    isInsideWindow(parseDate(evidence.collectedAt), windowStart, now)
  );
  const alerts = state.alerts.filter((alert) => isInsideWindow(parseDate(alert.createdAt), windowStart, now));
  const imports = state.imports.filter((item) => isInsideWindow(parseDate(item.startedAt), windowStart, now));
  const auditLogs = state.auditLogs.filter((log) => isInsideWindow(parseDate(log.createdAt), windowStart, now));
  const blacklist = state.blacklist.filter((entry) => isInsideWindow(parseDate(entry.createdAt), windowStart, now));

  const sentimentCounts = countByOrder(incidents.map((incident) => incident.sentiment), sentimentOrder);
  const severityCounts = countByOrder(incidents.map((incident) => incident.riskLevel), severityOrder);
  const categoryDistribution = countBy(incidents.map((incident) => incident.category), incidents.length, 8);
  const moduleDistribution = countBy(incidents.map(moduleForIncident), incidents.length, 8);
  const platformDistribution = countBy(incidents.map((incident) => visibleValue(incident.platform)), incidents.length, 8);
  const statusDistribution = countBy(incidents.map((incident) => incident.status), incidents.length, 8);
  const topNarratives = buildTopNarratives(state.narratives, incidentIds);
  const topActors = buildTopActors(state.actors, incidents, incidentIds);
  const topSources = buildTopSources(incidents, evidences);
  const recentEvidences = buildRecentEvidences(evidences, incidents);
  const criticalAlerts = buildCriticalAlerts(alerts, incidents);
  const triage = incidents
    .filter((incident) => ["Novo", "Em triagem"].includes(incident.status))
    .sort((a, b) => dateValue(eventDate(b)) - dateValue(eventDate(a)))
    .slice(0, 5);

  const kpis: DashboardKpis = {
    totalReports: incidents.length,
    totalIncidents: incidents.length,
    openIncidents: incidents.filter((incident) => openStatuses.includes(incident.status)).length,
    critical: incidents.filter((incident) => incident.riskLevel === "Crítico").length,
    high: incidents.filter((incident) => incident.riskLevel === "Alto").length,
    medium: incidents.filter((incident) => incident.riskLevel === "Moderado").length,
    low: incidents.filter((incident) => incident.riskLevel === "Baixo").length,
    negative: sentimentCounts.find((entry) => entry.name === "negativo")?.value ?? 0,
    neutral: sentimentCounts.find((entry) => entry.name === "neutro")?.value ?? 0,
    positive: sentimentCounts.find((entry) => entry.name === "positivo")?.value ?? 0,
    disinformation: incidents.filter((incident) => disinformationCategories.has(incident.category)).length,
    fraud: incidents.filter((incident) => fraudCategories.has(incident.category)).length,
    fakeProfiles: incidents.filter((incident) => ["Perfil falso", "Impersonação"].includes(incident.category)).length,
    cyber: incidents.filter((incident) => cyberCategories.has(incident.category)).length,
    peopleThreats: incidents.filter(isPeopleThreat).length,
    actors: topActors.length,
    narratives: topNarratives.length,
    coordination: incidents.filter(isCoordination).length,
    evidences: evidences.length,
    blacklist: blacklist.length,
    imports: imports.length,
    auditEvents: auditLogs.length,
    averageRisk: averageRisk(incidents),
    maxRisk: incidents.reduce((max, incident) => Math.max(max, incident.riskScore), 0),
    riskDelta24h: riskDeltaForHours(state.incidents, 24, now),
    riskDelta7d: riskDeltaForHours(state.incidents, 24 * 7, now),
    criticalAlerts: alerts.filter((alert) => ["Crítico", "Alto"].includes(alert.severity) && alert.status !== "resolvido").length
  };

  return {
    period,
    periodLabel: config.label,
    windowStart,
    incidents,
    evidences,
    alerts,
    imports,
    auditLogs,
    blacklist,
    kpis,
    temporal: buildTemporalSeries(incidents, period, now),
    sentimentDistribution: sentimentCounts,
    moduleDistribution,
    categoryDistribution,
    severityDistribution: severityCounts,
    platformDistribution,
    statusDistribution,
    topNarratives,
    topActors,
    topSources,
    recentEvidences,
    criticalAlerts,
    triage,
    executiveSummary: buildExecutiveSummary(kpis, config.label, platformDistribution, categoryDistribution),
    priorities24h: buildPriorities24h(kpis, triage, topNarratives, criticalAlerts),
    priorities7d: buildPriorities7d(kpis, topNarratives, topActors, blacklist),
    unavailableSignals: buildUnavailableSignals(state, previousIncidents, topNarratives)
  };
}

function moduleForIncident(incident: Incident): string {
  if (cyberCategories.has(incident.category)) return "Cyber";
  if (fraudCategories.has(incident.category)) return "Fraudes";
  if (peopleThreatCategories.has(incident.category) || incident.threatLevel >= 2) return "Ameaças";
  if (isCoordination(incident)) return "Coordenação";
  if (disinformationCategories.has(incident.category)) return "Desinformação";
  if (incident.category === "Narrativa negativa" || incident.relatedNarrativeIds.length > 0) return "Narrativas";
  return "Outros";
}

function isPeopleThreat(incident: Incident): boolean {
  return peopleThreatCategories.has(incident.category) || incident.threatLevel >= 2;
}

function isCoordination(incident: Incident): boolean {
  return incident.category === "Movimento coordenado" || incident.coordinationLevel !== "Não identificado";
}

function buildTopNarratives(narratives: Narrative[], incidentIds: Set<string>): DashboardNarrative[] {
  return narratives
    .map((narrative) => {
      const relatedCount = narrative.incidentIds.filter((id) => incidentIds.has(id)).length;
      const volume = relatedCount || narrative.volume || 0;
      return {
        id: narrative.id,
        name: narrative.name,
        volume,
        riskScore: narrative.riskScore,
        sentiment: narrative.polarity,
        trend: narrative.growth || undefined,
        status: narrative.status
      };
    })
    .filter((item) => item.volume > 0)
    .sort((a, b) => b.volume + b.riskScore / 100 - (a.volume + a.riskScore / 100))
    .slice(0, 5);
}

function buildTopActors(actors: Actor[], incidents: Incident[], incidentIds: Set<string>): DashboardActor[] {
  const incidentsByActor = new Map<string, Incident[]>();
  incidents.forEach((incident) => {
    incident.relatedActorIds.forEach((id) => {
      const current = incidentsByActor.get(id) ?? [];
      current.push(incident);
      incidentsByActor.set(id, current);
    });
  });

  return actors
    .map((actor) => {
      const related = incidentsByActor.get(actor.id) ?? actor.incidentIds.filter((id) => incidentIds.has(id)).map((id) => incidents.find((incident) => incident.id === id)).filter(Boolean) as Incident[];
      const reports = related.length || actor.occurrenceCount || 0;
      const riskScore = related.length ? averageRisk(related) : actor.riskScore;
      return {
        id: actor.id,
        name: actor.name,
        platform: visibleValue(actor.platform),
        reports,
        riskScore,
        role: actor.type
      };
    })
    .filter((actor) => actor.reports > 0)
    .sort((a, b) => b.reports + b.riskScore / 100 - (a.reports + a.riskScore / 100))
    .slice(0, 5);
}

function buildTopSources(incidents: Incident[], evidences: Evidence[]): DashboardSource[] {
  const values = [
    ...incidents.flatMap((incident) => [incident.domain, toDomain(incident.url)]),
    ...evidences.flatMap((evidence) => [toDomain(evidence.url ?? ""), evidence.source])
  ].map(visibleValue);

  return countBy(values, values.filter(Boolean).length, 8).map(({ name, value }) => ({ name, value }));
}

function buildRecentEvidences(evidences: Evidence[], incidents: Incident[]): DashboardEvidence[] {
  const incidentMap = new Map(incidents.map((incident) => [incident.id, incident]));
  return [...evidences]
    .sort((a, b) => dateValue(parseDate(b.collectedAt)) - dateValue(parseDate(a.collectedAt)))
    .slice(0, 5)
    .map((evidence) => ({
      id: evidence.id,
      type: evidence.type,
      source: visibleValue(toDomain(evidence.url ?? "") || evidence.source),
      collectedAt: evidence.collectedAt,
      incidentId: evidence.incidentId,
      incidentTitle: incidentMap.get(evidence.incidentId)?.title ?? "Incidente relacionado"
    }));
}

function buildCriticalAlerts(alerts: Alert[], incidents: Incident[]): DashboardAlert[] {
  const incidentMap = new Map(incidents.map((incident) => [incident.id, incident]));
  return alerts
    .filter((alert) => ["Crítico", "Alto"].includes(alert.severity) && alert.status !== "resolvido")
    .sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity) || dateValue(parseDate(b.createdAt)) - dateValue(parseDate(a.createdAt)))
    .slice(0, 5)
    .map((alert) => {
      const incident = alert.incidentId ? incidentMap.get(alert.incidentId) : undefined;
      return {
        id: alert.id,
        title: alert.title,
        category: incident?.category ?? alert.ruleId,
        riskScore: incident?.riskScore ?? severityWeight(alert.severity) * 20,
        severity: alert.severity,
        status: alert.status,
        date: alert.createdAt,
        incidentId: alert.incidentId
      };
    });
}

function buildTemporalSeries(incidents: Incident[], period: DashboardPeriod, now: Date): TemporalEntry[] {
  const config = periodConfig[period];
  const bucketCount = period === "24h" ? 12 : period === "7d" ? 7 : 15;
  const dates = incidents.map(eventDate).filter((date): date is Date => Boolean(date));
  const totalStart = dates.length ? Math.min(...dates.map((date) => date.getTime())) : now.getTime();
  const start = config.hours === null ? totalStart : now.getTime() - config.hours * 60 * 60 * 1000;
  const end = now.getTime();
  const bucketMs = Math.max(1, (end - start) / bucketCount);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const from = new Date(start + index * bucketMs);
    return {
      from,
      to: new Date(start + (index + 1) * bucketMs),
      date: formatBucketLabel(from, period),
      values: [] as Incident[]
    };
  });

  incidents.forEach((incident) => {
    const date = eventDate(incident);
    if (!date) return;
    const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((date.getTime() - start) / bucketMs)));
    buckets[index]?.values.push(incident);
  });

  return buckets.map((bucket) => ({
    date: bucket.date,
    mentions: bucket.values.length,
    incidents: bucket.values.filter((incident) => openStatuses.includes(incident.status)).length,
    risk: averageRisk(bucket.values),
    negative: bucket.values.filter((incident) => incident.sentiment === "negativo").length,
    neutral: bucket.values.filter((incident) => incident.sentiment === "neutro").length,
    positive: bucket.values.filter((incident) => incident.sentiment === "positivo").length
  }));
}

function buildExecutiveSummary(
  kpis: DashboardKpis,
  periodLabel: string,
  platforms: CountEntry[],
  categories: CountEntry[]
): string {
  if (!kpis.totalReports) {
    return `No período de ${periodLabel}, ainda não há reports registrados. A visão executiva será preenchida automaticamente conforme reports, evidências, alertas, atores e itens de blacklist forem cadastrados.`;
  }

  const concentration = platforms[0]?.name ? ` A maior concentração por plataforma ocorreu em ${platforms[0].name}.` : "";
  const category = categories[0]?.name ? ` A categoria mais recorrente foi ${categories[0].name}.` : "";
  const risk = kpis.maxRisk ? ` O maior risco observado foi ${kpis.maxRisk}, com risco médio ${kpis.averageRisk}.` : "";
  return `No período de ${periodLabel}, foram registrados ${kpis.totalReports} reports, ${kpis.openIncidents} incidentes abertos e ${kpis.negative} conteúdos negativos.${risk}${concentration}${category}`;
}

function buildPriorities24h(
  kpis: DashboardKpis,
  triage: Incident[],
  narratives: DashboardNarrative[],
  alerts: DashboardAlert[]
): string[] {
  const items: string[] = [];
  if (alerts.length) items.push(`Atender ${alerts.length} alertas críticos ou altos ainda ativos.`);
  if (kpis.high + kpis.critical > 0) items.push(`Revisar ${kpis.high + kpis.critical} incidentes com risco alto ou crítico.`);
  if (kpis.peopleThreats > 0) items.push(`Validar ${kpis.peopleThreats} ameaças à pessoa com prioridade operacional.`);
  if (triage.length) items.push(`Concluir triagem de ${triage.length} reports em status novo ou em triagem.`);
  if (narratives[0]) items.push(`Acompanhar a narrativa "${narratives[0].name}" por volume ou crescimento registrado.`);
  if (!items.length) items.push("Cadastrar novos reports conforme surgirem sinais relevantes no monitoramento.");
  return items.slice(0, 4);
}

function buildPriorities7d(
  kpis: DashboardKpis,
  narratives: DashboardNarrative[],
  actors: DashboardActor[],
  blacklist: BlacklistEntry[]
): string[] {
  const items: string[] = [];
  if (narratives.length) items.push(`Revisar ${narratives.length} narrativas com recorrência ou crescimento no período.`);
  if (actors.length) items.push(`Avaliar ${actors.length} atores ou páginas com maior recorrência nos reports.`);
  if (blacklist.length) items.push(`Revisar ${blacklist.length} itens adicionados à blacklist no período.`);
  if (kpis.imports > 0) items.push(`Auditar ${kpis.imports} importações recentes e consolidar duplicidades.`);
  if (kpis.auditEvents > 0) items.push(`Revisar ${kpis.auditEvents} eventos de auditoria para rastreabilidade operacional.`);
  if (!items.length) items.push("Aguardar volume suficiente para análise semanal de recorrência, atores e narrativas.");
  return items.slice(0, 4);
}

function buildUnavailableSignals(
  state: AtlasState,
  previousIncidents: Incident[],
  narratives: DashboardNarrative[]
): string[] {
  const signals: string[] = [];
  if (!previousIncidents.length) signals.push("comparação temporal completa");
  if (!state.actors.length) signals.push("atores/páginas associados");
  if (!narratives.length) signals.push("tendência de narrativas");
  if (!state.evidences.length) signals.push("evidências recentes");
  return signals;
}

function riskDeltaForHours(incidents: Incident[], hours: number, now: Date): number {
  const currentStart = new Date(now.getTime() - hours * 60 * 60 * 1000);
  const previousStart = new Date(currentStart.getTime() - hours * 60 * 60 * 1000);
  const current = incidents.filter((incident) => !incident.deletedAt && isInsideWindow(eventDate(incident), currentStart, now));
  const previous = incidents.filter((incident) => {
    const date = eventDate(incident);
    return Boolean(!incident.deletedAt && date && date >= previousStart && date < currentStart);
  });
  return Math.round(averageRisk(current) - averageRisk(previous));
}

function averageRisk(incidents: Incident[]): number {
  if (!incidents.length) return 0;
  return Math.round(incidents.reduce((sum, incident) => sum + incident.riskScore, 0) / incidents.length);
}

function countBy(values: string[], total: number, limit = 10): CountEntry[] {
  const map = new Map<string, number>();
  values.map(visibleValue).filter(Boolean).forEach((value) => {
    map.set(value, (map.get(value) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, percent: total ? Math.round((value / total) * 100) : 0 }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function countByOrder<T extends string>(values: T[], order: readonly T[]): CountEntry[] {
  const total = values.length;
  return order
    .map((name) => {
      const value = values.filter((value) => value === name).length;
      return { name, value, percent: total ? Math.round((value / total) * 100) : 0 };
    })
    .filter((item) => item.value > 0);
}

function eventDate(incident: Incident): Date | null {
  return parseDate(incident.collectedAt) ?? parseDate(incident.publishedAt) ?? parseDate(incident.createdAt);
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isInsideWindow(date: Date | null, start: Date, end: Date): boolean {
  return Boolean(date && date >= start && date <= end);
}

function dateValue(date: Date | null): number {
  return date?.getTime() ?? 0;
}

function formatBucketLabel(date: Date, period: DashboardPeriod): string {
  if (period === "24h") {
    return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  if (period === "total") {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
  }
  return date.toISOString().slice(5, 10);
}

function severityWeight(level: RiskLevel): number {
  return ({ Crítico: 5, Alto: 4, Moderado: 3, Baixo: 2, Informativo: 1 })[level];
}

function visibleValue(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized === "Não informado" || normalized === "Não disponível") return "";
  return normalized;
}
