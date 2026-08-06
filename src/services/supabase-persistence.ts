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
import { buildDemoState } from "@/services/demo-data";

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

export async function loadAtlasStateFromSupabase(userId: string): Promise<AtlasState> {
  const supabase = getSupabaseClientOrThrow();
  const [
    monitoredEntities,
    incidents,
    evidences,
    actors,
    narratives,
    alerts,
    imports,
    auditLogs,
    blacklist
  ] = await Promise.all([
    loadPayloads<MonitoredEntity>(supabase, "monitored_entities", userId),
    loadPayloads<Incident>(supabase, "incidents", userId),
    loadPayloads<Evidence>(supabase, "evidences", userId),
    loadPayloads<Actor>(supabase, "actors", userId),
    loadPayloads<Narrative>(supabase, "narratives", userId),
    loadPayloads<Alert>(supabase, "alerts", userId),
    loadPayloads<ImportReport>(supabase, "imports", userId),
    loadPayloads<AuditLog>(supabase, "audit_logs", userId),
    loadPayloads<BlacklistEntry>(supabase, "blacklist_entries", userId)
  ]);

  const fallback = buildDemoState();
  const entities = monitoredEntities.length ? monitoredEntities : fallback.monitoredEntities;

  return {
    ...fallback,
    monitoredEntities: entities,
    activeMonitoredEntityId: entities[0]?.id ?? fallback.activeMonitoredEntityId,
    incidents,
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

async function loadPayloads<T>(supabase: SupabaseClient, table: PersistableTable, userId: string): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select("payload, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => row.payload as T).filter(Boolean);
}

async function insertRows(supabase: SupabaseClient, table: PersistableTable, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
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
