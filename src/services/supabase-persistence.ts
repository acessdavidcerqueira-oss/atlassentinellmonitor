"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type {
  Actor,
  Alert,
  AtlasState,
  AuditLog,
  BlacklistEntry,
  Evidence,
  ImportReport,
  Incident,
  MonitoredEntity,
  Narrative
} from "@/types/domain";
import type { DemoUser } from "@/features/auth/auth";
import { buildDemoState } from "@/services/demo-data";
import { classifyRisk, defaultRiskFactors, emptyPhysicalThreatFlags } from "@/services/risk";
import { createId } from "@/utils/id";
import { isoNow } from "@/utils/date";
import { toDomain } from "@/utils/text";

const tables = [
  "reports",
  "incidents",
  "evidences",
  "actors",
  "narratives",
  "alerts",
  "imports",
  "audit_logs",
  "blacklist_entries",
  "monitored_entities"
] as const;

type PersistableTable = (typeof tables)[number];

export function getSupabaseClientOrThrow(): SupabaseClient {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase não está configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

export async function loadAtlasStateFromSupabase(user: DemoUser): Promise<AtlasState> {
  const supabase = getSupabaseClientOrThrow();
  const [
    monitoredEntities,
    reportIncidents,
    incidents,
    evidences,
    actors,
    narratives,
    alerts,
    imports,
    auditLogs,
    blacklist
  ] = await Promise.all([
    loadPayloads<MonitoredEntity>(supabase, "monitored_entities", user),
    loadReportIncidents(supabase, user),
    loadPayloads<Incident>(supabase, "incidents", user),
    loadPayloads<Evidence>(supabase, "evidences", user),
    loadPayloads<Actor>(supabase, "actors", user),
    loadPayloads<Narrative>(supabase, "narratives", user),
    loadPayloads<Alert>(supabase, "alerts", user),
    loadPayloads<ImportReport>(supabase, "imports", user),
    loadPayloads<AuditLog>(supabase, "audit_logs", user),
    loadPayloads<BlacklistEntry>(supabase, "blacklist_entries", user)
  ]);

  const fallback = buildDemoState();
  const entities = monitoredEntities.length ? monitoredEntities : fallback.monitoredEntities;

  return {
    ...fallback,
    monitoredEntities: entities,
    activeMonitoredEntityId: entities[0]?.id ?? fallback.activeMonitoredEntityId,
    incidents: mergeIncidents(incidents, reportIncidents),
    evidences,
    actors,
    narratives,
    alerts,
    imports,
    auditLogs,
    blacklist
  };
}

export async function replaceAtlasStateInSupabase(userId: string, state: AtlasState): Promise<void> {
  const supabase = getSupabaseClientOrThrow();

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error) throw error;
  }

  await insertRows(supabase, "monitored_entities", state.monitoredEntities.map((entity) => monitoredEntityRow(userId, entity)));
  await insertRows(supabase, "incidents", state.incidents.map((incident) => incidentRow(userId, incident)));
  await insertRows(supabase, "reports", state.incidents.map((incident) => reportRow(userId, incident)));
  await insertRows(supabase, "evidences", state.evidences.map((evidence) => evidenceRow(userId, evidence)));
  await insertRows(supabase, "actors", state.actors.map((actor) => actorRow(userId, actor)));
  await insertRows(supabase, "narratives", state.narratives.map((narrative) => narrativeRow(userId, narrative)));
  await insertRows(supabase, "alerts", state.alerts.map((alert) => alertRow(userId, alert)));
  await insertRows(supabase, "imports", state.imports.map((report) => importRow(userId, report)));
  await insertRows(supabase, "audit_logs", state.auditLogs.map((log) => auditLogRow(userId, log)));
  await insertRows(supabase, "blacklist_entries", state.blacklist.map((entry) => blacklistRow(userId, entry)));
}

async function loadPayloads<T extends { id: string }>(
  supabase: SupabaseClient,
  table: PersistableTable,
  user: DemoUser
): Promise<T[]> {
  let query = supabase
    .from(table)
    .select("payload, created_at")
    .order("created_at", { ascending: false });

  if (user.role !== "Super Admin") {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => row.payload).filter(hasClientId) as T[];
}

async function loadReportIncidents(supabase: SupabaseClient, user: DemoUser): Promise<Incident[]> {
  let query = supabase
    .from("reports")
    .select("payload, content, created_at")
    .order("created_at", { ascending: false });

  if (user.role !== "Super Admin") {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? [])
    .flatMap((row) => [row.payload, row.content])
    .map(recoverIncidentPayload)
    .filter((incident): incident is Incident => Boolean(incident));
}

function mergeIncidents(primary: Incident[], fallback: Incident[]): Incident[] {
  const byId = new Map<string, Incident>();
  [...fallback, ...primary].forEach((incident) => {
    if (!incident.id) return;
    byId.set(incident.id, incident);
  });
  return Array.from(byId.values()).sort((a, b) => {
    const bTime = new Date(b.createdAt || b.collectedAt).getTime();
    const aTime = new Date(a.createdAt || a.collectedAt).getTime();
    return bTime - aTime;
  });
}

function recoverIncidentPayload(payload: unknown): Incident | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as Partial<Incident> & Record<string, unknown>;
  const title =
    typeof candidate.title === "string"
      ? candidate.title
      : typeof candidate.name === "string"
        ? candidate.name
        : typeof candidate.domain === "string"
          ? `Report: ${candidate.domain}`
          : "";

  if (!title) return null;

  const now = isoNow();
  const riskScore = finiteNumber(candidate.riskScore, finiteNumber(candidate.risk_score, 25));
  const physicalThreatScore = finiteNumber(
    candidate.physicalThreatScore,
    finiteNumber(candidate.physical_threat_score, 0)
  );
  const url = stringValue(candidate.url);
  const domain = stringValue(candidate.domain) || toDomain(url) || "Não disponível";
  const summary = stringValue(candidate.summary) || stringValue(candidate.content);
  const createdAt = stringValue(candidate.createdAt) || stringValue(candidate.created_at) || now;
  const collectedAt = stringValue(candidate.collectedAt) || stringValue(candidate.collected_at) || createdAt;

  return {
    id: stringValue(candidate.id) || stringValue(candidate.client_id) || createId("inc"),
    monitoredEntityId: stringValue(candidate.monitoredEntityId) || stringValue(candidate.monitored_entity_client_id) || "entity_flavio_bolsonaro",
    collectedAt,
    publishedAt: stringValue(candidate.publishedAt) || stringValue(candidate.published_at) || collectedAt,
    title,
    summary,
    content: stringValue(candidate.content) || summary,
    url,
    domain,
    platform: stringValue(candidate.platform) || "Não informado",
    authorName: stringValue(candidate.authorName) || stringValue(candidate.author_name) || domain,
    authorHandle: stringValue(candidate.authorHandle) || stringValue(candidate.author_handle),
    authorUrl: stringValue(candidate.authorUrl) || stringValue(candidate.author_url) || url,
    actorType: stringValue(candidate.actorType) || stringValue(candidate.actor_type) || "Origem indeterminada",
    category: stringValue(candidate.category) || "Outro",
    subcategory: stringValue(candidate.subcategory),
    verificationStatus: stringValue(candidate.verificationStatus) || stringValue(candidate.verification_status) || "Não analisado",
    sentiment: stringValue(candidate.sentiment) || "não disponível",
    provenanceType: stringValue(candidate.provenanceType) || stringValue(candidate.provenance_type) || "FATO_COLETADO",
    confidenceLevel: stringValue(candidate.confidenceLevel) || stringValue(candidate.confidence_level) || "medium",
    riskScore,
    riskLevel: stringValue(candidate.riskLevel) || stringValue(candidate.risk_level) || classifyRisk(riskScore),
    riskFactors:
      typeof candidate.riskFactors === "object" && candidate.riskFactors
        ? candidate.riskFactors
        : defaultRiskFactors(riskScore),
    threatLevel: finiteNumber(candidate.threatLevel, finiteNumber(candidate.threat_level, 1)),
    physicalThreatScore,
    physicalThreatFactors:
      typeof candidate.physicalThreatFactors === "object" && candidate.physicalThreatFactors
        ? candidate.physicalThreatFactors
        : {
            declaredIntent: 0,
            targetSpecificity: 0,
            apparentCapability: 0,
            proximityAccess: 0,
            recurrenceEscalation: 0,
            dataLocationExposure: 0
          },
    physicalThreatFlags:
      typeof candidate.physicalThreatFlags === "object" && candidate.physicalThreatFlags
        ? candidate.physicalThreatFlags
        : emptyPhysicalThreatFlags(),
    reachValue: optionalNumber(candidate.reachValue ?? candidate.reach_value),
    reachType: stringValue(candidate.reachType) || stringValue(candidate.reach_type) || "unavailable",
    engagementValue: optionalNumber(candidate.engagementValue ?? candidate.engagement_value),
    velocityScore: finiteNumber(candidate.velocityScore, finiteNumber(candidate.velocity_score, 20)),
    coordinationLevel: stringValue(candidate.coordinationLevel) || stringValue(candidate.coordination_level) || "Não identificado",
    target: stringValue(candidate.target) || "Monitorado",
    locationExposure: stringValue(candidate.locationExposure) || stringValue(candidate.location_exposure) || "Não disponível",
    status: stringValue(candidate.status) || "Novo",
    ownerTeam: stringValue(candidate.ownerTeam) || stringValue(candidate.owner_team) || ownerTeamFromCategory(stringValue(candidate.category)),
    assignedTo: stringValue(candidate.assignedTo) || stringValue(candidate.assigned_to),
    recommendedAction: stringValue(candidate.recommendedAction) || stringValue(candidate.recommended_action) || "Revisar",
    analystNotes: stringValue(candidate.analystNotes) || stringValue(candidate.analyst_notes),
    nextAction: stringValue(candidate.nextAction) || stringValue(candidate.next_action) || "Revisar",
    dueAt: stringValue(candidate.dueAt) || stringValue(candidate.due_at) || undefined,
    relatedActorIds: stringArray(candidate.relatedActorIds),
    relatedNarrativeIds: stringArray(candidate.relatedNarrativeIds),
    relatedIncidentIds: stringArray(candidate.relatedIncidentIds),
    indicators: stringArray(candidate.indicators),
    keywords: stringArray(candidate.keywords),
    createdAt,
    updatedAt: stringValue(candidate.updatedAt) || stringValue(candidate.updated_at) || createdAt,
    deletedAt: stringValue(candidate.deletedAt) || stringValue(candidate.deleted_at) || null
  } as Incident;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function ownerTeamFromCategory(category: string) {
  if (category === "Narrativa negativa") return "Comunicação";
  if (["Ameaça física", "Assédio", "Incitação à violência"].includes(category)) return "Segurança física";
  if (["Phishing", "Malware", "Ataque contra conta", "Ataque contra site", "Incidente cibernético"].includes(category)) return "Elytron CTI";
  if (["Fraude", "Perfil falso", "Impersonação"].includes(category)) return "Jurídico";
  return "Atlas OSINT";
}

async function insertRows(supabase: SupabaseClient, table: PersistableTable, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
}

function hasClientId(payload: unknown): payload is { id: string } {
  return Boolean(payload && typeof payload === "object" && typeof (payload as { id?: unknown }).id === "string");
}

function monitoredEntityRow(userId: string, entity: MonitoredEntity) {
  return {
    client_id: entity.id,
    user_id: userId,
    name: entity.name,
    type: entity.type,
    country: entity.country,
    status: entity.status,
    payload: entity
  };
}

function reportRow(userId: string, incident: Incident) {
  return {
    client_id: `report_${incident.id}`,
    user_id: userId,
    monitored_entity_client_id: incident.monitoredEntityId,
    type: "incident",
    title: incident.title,
    content: incident,
    payload: incident,
    created_at: incident.createdAt
  };
}

function incidentRow(userId: string, incident: Incident) {
  return {
    client_id: incident.id,
    user_id: userId,
    monitored_entity_client_id: incident.monitoredEntityId,
    collected_at: incident.collectedAt,
    published_at: incident.publishedAt || null,
    title: incident.title,
    summary: incident.summary,
    content: incident.content,
    url: incident.url || null,
    domain: incident.domain,
    platform: incident.platform,
    author_name: incident.authorName,
    author_handle: incident.authorHandle,
    author_url: incident.authorUrl || null,
    actor_type: incident.actorType,
    category: incident.category,
    subcategory: incident.subcategory,
    verification_status: incident.verificationStatus,
    sentiment: incident.sentiment,
    provenance_type: incident.provenanceType,
    confidence_level: incident.confidenceLevel,
    risk_score: incident.riskScore,
    risk_level: incident.riskLevel,
    threat_level: incident.threatLevel,
    physical_threat_score: incident.physicalThreatScore,
    reach_value: incident.reachValue ?? null,
    reach_type: incident.reachType,
    engagement_value: incident.engagementValue ?? null,
    velocity_score: incident.velocityScore,
    coordination_level: incident.coordinationLevel,
    target: incident.target,
    location_exposure: incident.locationExposure,
    status: incident.status,
    owner_team: incident.ownerTeam,
    assigned_to: incident.assignedTo,
    recommended_action: incident.recommendedAction,
    analyst_notes: incident.analystNotes,
    next_action: incident.nextAction,
    due_at: incident.dueAt ?? null,
    indicators: incident.indicators,
    keywords: incident.keywords,
    metadata: { relatedActorIds: incident.relatedActorIds, relatedNarrativeIds: incident.relatedNarrativeIds },
    payload: incident,
    created_at: incident.createdAt,
    updated_at: incident.updatedAt,
    deleted_at: incident.deletedAt ?? null
  };
}

function evidenceRow(userId: string, evidence: Evidence) {
  return {
    client_id: evidence.id,
    user_id: userId,
    incident_client_id: evidence.incidentId,
    type: evidence.type,
    description: evidence.description,
    file_path: evidence.fileName ?? null,
    url: evidence.url ?? null,
    file_hash: evidence.fileHash ?? null,
    collected_at: evidence.collectedAt,
    source: evidence.source,
    integrity: evidence.integrity,
    observation: evidence.observation,
    confidence_level: evidence.confidenceLevel,
    provenance_type: evidence.provenanceType,
    payload: evidence
  };
}

function actorRow(userId: string, actor: Actor) {
  return {
    client_id: actor.id,
    user_id: userId,
    name: actor.name,
    handle: actor.handle,
    url: actor.url || null,
    platform: actor.platform,
    type: actor.type,
    description: actor.description,
    followers: actor.followers ?? null,
    followers_provenance: actor.followersProvenance,
    occurrence_count: actor.occurrenceCount,
    recurrence: actor.recurrence,
    risk_score: actor.riskScore,
    confidence_level: actor.confidenceLevel,
    last_activity: actor.lastActivity || null,
    observations: actor.observations,
    payload: actor
  };
}

function narrativeRow(userId: string, narrative: Narrative) {
  return {
    client_id: narrative.id,
    user_id: userId,
    name: narrative.name,
    description: narrative.description,
    central_message: narrative.centralMessage,
    polarity: narrative.polarity,
    volume: narrative.volume,
    growth: narrative.growth,
    velocity: narrative.velocity,
    platforms: narrative.platforms,
    top_sources: narrative.topSources,
    top_amplifiers: narrative.topAmplifiers,
    probable_origin: narrative.probableOrigin,
    risk_score: narrative.riskScore,
    confidence_level: narrative.confidenceLevel,
    reached_audiences: narrative.reachedAudiences,
    recommendation: narrative.recommendation,
    status: narrative.status,
    provenance_type: narrative.provenanceType,
    payload: narrative
  };
}

function alertRow(userId: string, alert: Alert) {
  return {
    client_id: alert.id,
    user_id: userId,
    incident_client_id: alert.incidentId ?? null,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    status: alert.status,
    provenance_type: alert.provenanceType,
    payload: alert,
    created_at: alert.createdAt
  };
}

function importRow(userId: string, report: ImportReport) {
  return {
    client_id: report.id,
    user_id: userId,
    file_name: report.fileName,
    source_format: report.sourceFormat,
    total_rows: report.totalRows,
    valid_rows: report.validRows,
    duplicate_rows: report.duplicateRows,
    error_rows: report.errorRows,
    imported_rows: report.importedRows,
    started_at: report.startedAt,
    finished_at: report.finishedAt ?? null,
    payload: report
  };
}

function auditLogRow(userId: string, log: AuditLog) {
  return {
    client_id: log.id,
    user_id: userId,
    entity_client_id: log.entityId,
    entity_type: log.entityType,
    action: log.action,
    previous_value: log.previousValue ?? null,
    new_value: log.newValue ?? null,
    justification: log.justification ?? null,
    payload: log,
    created_at: log.createdAt
  };
}

function blacklistRow(userId: string, entry: BlacklistEntry) {
  return {
    client_id: entry.id,
    user_id: userId,
    value: entry.value,
    normalized_value: entry.normalizedValue,
    kind: entry.kind,
    status: entry.status,
    reason: entry.reason,
    source: entry.source,
    payload: entry,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt
  };
}
