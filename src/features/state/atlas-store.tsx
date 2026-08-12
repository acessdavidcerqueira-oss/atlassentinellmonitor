"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type {
  Actor,
  AtlasState,
  AuditLog,
  BlacklistEntry,
  BlacklistStatus,
  Evidence,
  ImportReport,
  Incident,
  Indicator,
  Narrative
} from "@/types/domain";
import { buildDemoState } from "@/services/demo-data";
import { evaluateIncidentAlerts } from "@/services/alerts";
import { classifyRisk, defaultRiskFactors, emptyPhysicalThreatFlags } from "@/services/risk";
import { createId } from "@/utils/id";
import { isoNow } from "@/utils/date";
import { toDomain } from "@/utils/text";
import { canWrite, type DemoUser } from "@/features/auth/auth";
import { useAuth } from "@/features/state/auth-store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadAtlasStateFromSupabase, replaceAtlasStateInSupabase } from "@/services/supabase-persistence";

type AtlasAction =
  | { type: "load"; state: AtlasState }
  | { type: "addIncident"; incident: Incident; user: DemoUser }
  | {
      type: "updateIncident";
      incidentId: string;
      patch: Partial<Incident>;
      user: DemoUser;
      justification?: string;
    }
  | { type: "deleteIncident"; incidentId: string; user: DemoUser }
  | {
      type: "overrideRisk";
      incidentId: string;
      score: number;
      justification: string;
      user: DemoUser;
    }
  | { type: "addEvidence"; evidence: Evidence; user: DemoUser }
  | { type: "updateEvidence"; evidenceId: string; patch: Partial<Evidence>; user: DemoUser }
  | { type: "deleteEvidence"; evidenceId: string; user: DemoUser }
  | { type: "updateActor"; actorId: string; patch: Partial<Actor>; user: DemoUser }
  | { type: "deleteActor"; actorId: string; user: DemoUser }
  | { type: "updateNarrative"; narrativeId: string; patch: Partial<Narrative>; user: DemoUser }
  | { type: "deleteNarrative"; narrativeId: string; user: DemoUser }
  | { type: "updateIndicator"; indicatorId: string; patch: Partial<Indicator>; user: DemoUser }
  | { type: "deleteIndicator"; indicatorId: string; user: DemoUser }
  | { type: "addBlacklistEntry"; entry: BlacklistEntry; user: DemoUser }
  | { type: "updateBlacklistEntry"; entryId: string; patch: Partial<BlacklistEntry>; user: DemoUser }
  | { type: "deleteBlacklistEntry"; entryId: string; user: DemoUser }
  | { type: "updateBlacklistStatus"; entryId: string; status: BlacklistStatus; user: DemoUser }
  | { type: "importIncidents"; incidents: Incident[]; report: ImportReport; user: DemoUser }
  | { type: "updateImport"; importId: string; patch: Partial<ImportReport>; user: DemoUser }
  | { type: "deleteImport"; importId: string; user: DemoUser }
  | { type: "ackAlert"; alertId: string; user: DemoUser };

interface AtlasStoreValue extends AtlasState {
  activeEntityName: string;
  loading: boolean;
  syncError: string;
  readOnly: boolean;
  viewToken: string | null;
  viewBasePath: string;
  addIncident: (incident: Incident, user: DemoUser) => void;
  updateIncident: (
    incidentId: string,
    patch: Partial<Incident>,
    user: DemoUser,
    justification?: string
  ) => void;
  deleteIncident: (incidentId: string, user: DemoUser) => void;
  overrideRisk: (incidentId: string, score: number, justification: string, user: DemoUser) => void;
  addEvidence: (evidence: Evidence, user: DemoUser) => void;
  updateEvidence: (evidenceId: string, patch: Partial<Evidence>, user: DemoUser) => void;
  deleteEvidence: (evidenceId: string, user: DemoUser) => void;
  updateActor: (actorId: string, patch: Partial<Actor>, user: DemoUser) => void;
  deleteActor: (actorId: string, user: DemoUser) => void;
  updateNarrative: (narrativeId: string, patch: Partial<Narrative>, user: DemoUser) => void;
  deleteNarrative: (narrativeId: string, user: DemoUser) => void;
  updateIndicator: (indicatorId: string, patch: Partial<Indicator>, user: DemoUser) => void;
  deleteIndicator: (indicatorId: string, user: DemoUser) => void;
  addBlacklistEntry: (entry: BlacklistEntry, user: DemoUser) => void;
  updateBlacklistEntry: (entryId: string, patch: Partial<BlacklistEntry>, user: DemoUser) => void;
  deleteBlacklistEntry: (entryId: string, user: DemoUser) => void;
  updateBlacklistStatus: (entryId: string, status: BlacklistStatus, user: DemoUser) => void;
  importIncidents: (incidents: Incident[], report: ImportReport, user: DemoUser) => void;
  updateImport: (importId: string, patch: Partial<ImportReport>, user: DemoUser) => void;
  deleteImport: (importId: string, user: DemoUser) => void;
  ackAlert: (alertId: string, user: DemoUser) => void;
  resetDemo: () => Promise<void>;
}

const AtlasContext = createContext<AtlasStoreValue | null>(null);
const storageKey = "atlas-sentinel-state-v3-empty";
const legacyStorageKeys = ["atlas-sentinel-state-v1", "atlas-sentinel-state-v2"];

interface SharedViewStateResponse {
  state: AtlasState;
}

function auditLog(
  entityType: AuditLog["entityType"],
  entityId: string,
  action: string,
  user: DemoUser,
  previousValue?: string,
  newValue?: string,
  justification?: string
): AuditLog {
  return {
    id: createId("audit"),
    entityType,
    entityId,
    action,
    userName: user.name,
    createdAt: isoNow(),
    previousValue,
    newValue,
    justification
  };
}

function reducer(state: AtlasState, action: AtlasAction): AtlasState {
  switch (action.type) {
    case "load":
      return action.state;
    case "addIncident": {
      if (!canWrite(action.user)) return state;
      const alerts = evaluateIncidentAlerts(action.incident);
      const derived = deriveEntitiesFromIncident(action.incident, state);
      return {
        ...state,
        incidents: [derived.incident, ...state.incidents],
        actors: derived.actors,
        narratives: derived.narratives,
        alerts: [...alerts, ...state.alerts],
        auditLogs: [
          auditLog("incident", derived.incident.id, "created", action.user, undefined, derived.incident.title),
          ...state.auditLogs
        ]
      };
    }
    case "updateIncident": {
      if (!canWrite(action.user)) return state;
      const previous = state.incidents.find((incident) => incident.id === action.incidentId);
      if (!previous) return state;
      const updated = {
        ...previous,
        ...action.patch,
        updatedAt: isoNow()
      };

      return {
        ...state,
        incidents: state.incidents.map((incident) =>
          incident.id === action.incidentId ? updated : incident
        ),
        auditLogs: [
          auditLog(
            "incident",
            action.incidentId,
            "updated",
            action.user,
            JSON.stringify(action.patch),
            JSON.stringify(updated),
            action.justification
          ),
          ...state.auditLogs
        ]
      };
    }
    case "deleteIncident": {
      if (!canWrite(action.user)) return state;
      const previous = state.incidents.find((incident) => incident.id === action.incidentId);
      if (!previous) return state;

      return {
        ...state,
        incidents: state.incidents.filter((incident) => incident.id !== action.incidentId),
        evidences: state.evidences.filter((evidence) => evidence.incidentId !== action.incidentId),
        alerts: state.alerts.filter((alert) => alert.incidentId !== action.incidentId),
        actors: state.actors.map((actor) => ({
          ...actor,
          incidentIds: actor.incidentIds.filter((id) => id !== action.incidentId)
        })),
        narratives: state.narratives.map((narrative) => ({
          ...narrative,
          incidentIds: narrative.incidentIds.filter((id) => id !== action.incidentId)
        })),
        auditLogs: [
          auditLog(
            "incident",
            action.incidentId,
            "deleted",
            action.user,
            previous.title,
            undefined,
            "Report removido pelo analista."
          ),
          ...state.auditLogs
        ]
      };
    }
    case "overrideRisk": {
      if (!canWrite(action.user)) return state;
      const previous = state.incidents.find((incident) => incident.id === action.incidentId);
      if (!previous) return state;
      const updated: Incident = {
        ...previous,
        riskScore: action.score,
        riskLevel: classifyRisk(action.score),
        riskOverride: {
          previousScore: previous.riskScore,
          score: action.score,
          justification: action.justification,
          changedBy: action.user.name,
          changedAt: isoNow()
        },
        updatedAt: isoNow()
      };
      const alerts = evaluateIncidentAlerts(updated).filter(
        (alert) =>
          !state.alerts.some(
            (existing) => existing.incidentId === alert.incidentId && existing.ruleId === alert.ruleId
          )
      );

      return {
        ...state,
        incidents: state.incidents.map((incident) =>
          incident.id === action.incidentId ? updated : incident
        ),
        alerts: [...alerts, ...state.alerts],
        auditLogs: [
          auditLog(
            "incident",
            action.incidentId,
            "risk_override",
            action.user,
            String(previous.riskScore),
            String(action.score),
            action.justification
          ),
          ...state.auditLogs
        ]
      };
    }
    case "addEvidence":
      if (!canWrite(action.user)) return state;
      return {
        ...state,
        evidences: [action.evidence, ...state.evidences],
        auditLogs: [
          auditLog(
            "evidence",
            action.evidence.id,
            "evidence_added",
            action.user,
            undefined,
            action.evidence.description
          ),
          ...state.auditLogs
        ]
      };
    case "updateEvidence": {
      if (!canWrite(action.user)) return state;
      const previous = state.evidences.find((evidence) => evidence.id === action.evidenceId);
      if (!previous) return state;
      const updated: Evidence = {
        ...previous,
        ...action.patch
      };

      return {
        ...state,
        evidences: state.evidences.map((evidence) =>
          evidence.id === action.evidenceId ? updated : evidence
        ),
        auditLogs: [
          auditLog(
            "evidence",
            action.evidenceId,
            "evidence_updated",
            action.user,
            previous.description,
            updated.description
          ),
          ...state.auditLogs
        ]
      };
    }
    case "deleteEvidence": {
      if (!canWrite(action.user)) return state;
      const previous = state.evidences.find((evidence) => evidence.id === action.evidenceId);
      if (!previous) return state;

      return {
        ...state,
        evidences: state.evidences.filter((evidence) => evidence.id !== action.evidenceId),
        auditLogs: [
          auditLog(
            "evidence",
            action.evidenceId,
            "evidence_deleted",
            action.user,
            previous.description,
            undefined,
            "Evidência removida pelo analista."
          ),
          ...state.auditLogs
        ]
      };
    }
    case "updateActor": {
      if (!canWrite(action.user)) return state;
      const previous = state.actors.find((actor) => actor.id === action.actorId);
      if (!previous) return state;
      const updated: Actor = {
        ...previous,
        ...action.patch,
        lastActivity: action.patch.lastActivity ?? previous.lastActivity
      };

      return {
        ...state,
        actors: state.actors.map((actor) => (actor.id === action.actorId ? updated : actor)),
        auditLogs: [
          auditLog("actor", action.actorId, "actor_updated", action.user, previous.name, updated.name),
          ...state.auditLogs
        ]
      };
    }
    case "deleteActor": {
      if (!canWrite(action.user)) return state;
      const previous = state.actors.find((actor) => actor.id === action.actorId);
      if (!previous) return state;

      return {
        ...state,
        actors: state.actors.filter((actor) => actor.id !== action.actorId),
        incidents: state.incidents.map((incident) => ({
          ...incident,
          relatedActorIds: incident.relatedActorIds.filter((id) => id !== action.actorId),
          updatedAt: incident.relatedActorIds.includes(action.actorId) ? isoNow() : incident.updatedAt
        })),
        auditLogs: [
          auditLog("actor", action.actorId, "actor_deleted", action.user, previous.name, undefined),
          ...state.auditLogs
        ]
      };
    }
    case "updateNarrative": {
      if (!canWrite(action.user)) return state;
      const previous = state.narratives.find((narrative) => narrative.id === action.narrativeId);
      if (!previous) return state;
      const updated: Narrative = {
        ...previous,
        ...action.patch
      };

      return {
        ...state,
        narratives: state.narratives.map((narrative) =>
          narrative.id === action.narrativeId ? updated : narrative
        ),
        auditLogs: [
          auditLog(
            "narrative",
            action.narrativeId,
            "narrative_updated",
            action.user,
            previous.name,
            updated.name
          ),
          ...state.auditLogs
        ]
      };
    }
    case "deleteNarrative": {
      if (!canWrite(action.user)) return state;
      const previous = state.narratives.find((narrative) => narrative.id === action.narrativeId);
      if (!previous) return state;

      return {
        ...state,
        narratives: state.narratives.filter((narrative) => narrative.id !== action.narrativeId),
        incidents: state.incidents.map((incident) => ({
          ...incident,
          relatedNarrativeIds: incident.relatedNarrativeIds.filter((id) => id !== action.narrativeId),
          updatedAt: incident.relatedNarrativeIds.includes(action.narrativeId) ? isoNow() : incident.updatedAt
        })),
        auditLogs: [
          auditLog(
            "narrative",
            action.narrativeId,
            "narrative_deleted",
            action.user,
            previous.name,
            undefined
          ),
          ...state.auditLogs
        ]
      };
    }
    case "updateIndicator": {
      if (!canWrite(action.user)) return state;
      const previous = state.indicators.find((indicator) => indicator.id === action.indicatorId);
      if (!previous) return state;
      const updated: Indicator = {
        ...previous,
        ...action.patch,
        lastSeen: action.patch.lastSeen ?? isoNow()
      };

      return {
        ...state,
        indicators: state.indicators.map((indicator) =>
          indicator.id === action.indicatorId ? updated : indicator
        ),
        auditLogs: [
          auditLog(
            "incident",
            action.indicatorId,
            "indicator_updated",
            action.user,
            previous.value,
            updated.value
          ),
          ...state.auditLogs
        ]
      };
    }
    case "deleteIndicator": {
      if (!canWrite(action.user)) return state;
      const previous = state.indicators.find((indicator) => indicator.id === action.indicatorId);
      if (!previous) return state;

      return {
        ...state,
        indicators: state.indicators.filter((indicator) => indicator.id !== action.indicatorId),
        incidents: state.incidents.map((incident) => ({
          ...incident,
          indicators: incident.indicators.filter((indicator) => indicator !== previous.value),
          updatedAt: incident.indicators.includes(previous.value) ? isoNow() : incident.updatedAt
        })),
        auditLogs: [
          auditLog(
            "incident",
            action.indicatorId,
            "indicator_deleted",
            action.user,
            previous.value,
            undefined
          ),
          ...state.auditLogs
        ]
      };
    }
    case "addBlacklistEntry":
      if (!canWrite(action.user)) return state;
      return {
        ...state,
        blacklist: [action.entry, ...(state.blacklist ?? [])],
        auditLogs: [
          auditLog("blacklist", action.entry.id, "blacklist_added", action.user, undefined, action.entry.value),
          ...state.auditLogs
        ]
      };
    case "updateBlacklistEntry": {
      if (!canWrite(action.user)) return state;
      const previous = (state.blacklist ?? []).find((entry) => entry.id === action.entryId);
      if (!previous) return state;
      const updated: BlacklistEntry = {
        ...previous,
        ...action.patch,
        updatedAt: isoNow()
      };

      return {
        ...state,
        blacklist: (state.blacklist ?? []).map((entry) => (entry.id === action.entryId ? updated : entry)),
        auditLogs: [
          auditLog("blacklist", action.entryId, "blacklist_updated", action.user, previous.value, updated.value),
          ...state.auditLogs
        ]
      };
    }
    case "deleteBlacklistEntry": {
      if (!canWrite(action.user)) return state;
      const previous = (state.blacklist ?? []).find((entry) => entry.id === action.entryId);
      if (!previous) return state;

      return {
        ...state,
        blacklist: (state.blacklist ?? []).filter((entry) => entry.id !== action.entryId),
        auditLogs: [
          auditLog("blacklist", action.entryId, "blacklist_deleted", action.user, previous.value, undefined),
          ...state.auditLogs
        ]
      };
    }
    case "updateBlacklistStatus": {
      if (!canWrite(action.user)) return state;
      const previous = (state.blacklist ?? []).find((entry) => entry.id === action.entryId);
      if (!previous) return state;
      const updated: BlacklistEntry = {
        ...previous,
        status: action.status,
        updatedAt: isoNow()
      };

      return {
        ...state,
        blacklist: (state.blacklist ?? []).map((entry) => (entry.id === action.entryId ? updated : entry)),
        auditLogs: [
          auditLog(
            "blacklist",
            action.entryId,
            "blacklist_status_updated",
            action.user,
            previous.status,
            action.status
          ),
          ...state.auditLogs
        ]
      };
    }
    case "updateImport": {
      if (!canWrite(action.user)) return state;
      const previous = state.imports.find((item) => item.id === action.importId);
      if (!previous) return state;
      const updated: ImportReport = {
        ...previous,
        ...action.patch
      };

      return {
        ...state,
        imports: state.imports.map((item) => (item.id === action.importId ? updated : item)),
        auditLogs: [
          auditLog("import", action.importId, "import_updated", action.user, previous.fileName, updated.fileName),
          ...state.auditLogs
        ]
      };
    }
    case "deleteImport": {
      if (!canWrite(action.user)) return state;
      const previous = state.imports.find((item) => item.id === action.importId);
      if (!previous) return state;

      return {
        ...state,
        imports: state.imports.filter((item) => item.id !== action.importId),
        auditLogs: [
          auditLog("import", action.importId, "import_deleted", action.user, previous.fileName, undefined),
          ...state.auditLogs
        ]
      };
    }
    case "importIncidents": {
      if (!canWrite(action.user)) return state;
      const materialized = materializeIncidentBatch(action.incidents, state);
      const alerts = materialized.incidents.flatMap(evaluateIncidentAlerts);
      return {
        ...state,
        incidents: [...materialized.incidents, ...state.incidents],
        actors: materialized.actors,
        narratives: materialized.narratives,
        alerts: [...alerts, ...state.alerts],
        imports: [action.report, ...state.imports],
        auditLogs: [
          auditLog(
            "import",
            action.report.id,
            "csv_imported",
            action.user,
            undefined,
            `${action.report.importedRows} incidentes`,
            "Importação confirmada pelo usuário."
          ),
          ...state.auditLogs
        ]
      };
    }
    case "ackAlert":
      if (!canWrite(action.user)) return state;
      return {
        ...state,
        alerts: state.alerts.map((alert) =>
          alert.id === action.alertId ? { ...alert, status: "reconhecido" } : alert
        ),
        auditLogs: [
          auditLog("incident", action.alertId, "alert_acknowledged", action.user),
          ...state.auditLogs
        ]
      };
    default:
      return state;
  }
}

function normalizeState(state: AtlasState): AtlasState {
  const fallback = buildDemoState();
  const incidents = Array.isArray(state?.incidents)
    ? state.incidents.map(normalizeIncident)
    : [];
  const evidences = backfillEvidenceReports(
    Array.isArray(state?.evidences) ? state.evidences : [],
    incidents
  );
  const recovered = backfillActorAndNarrativeReports(
    incidents,
    Array.isArray(state?.actors) ? state.actors : [],
    Array.isArray(state?.narratives) ? state.narratives : []
  );

  return {
    ...fallback,
    ...(state && typeof state === "object" ? state : {}),
    monitoredEntities: Array.isArray(state?.monitoredEntities) ? state.monitoredEntities : fallback.monitoredEntities,
    incidents: recovered.incidents,
    evidences,
    actors: recovered.actors,
    narratives: recovered.narratives,
    indicators: Array.isArray(state?.indicators) ? state.indicators : [],
    alerts: Array.isArray(state?.alerts) ? state.alerts : [],
    tasks: Array.isArray(state?.tasks) ? state.tasks : [],
    blacklist: Array.isArray(state?.blacklist) ? state.blacklist : [],
    auditLogs: Array.isArray(state?.auditLogs) ? state.auditLogs : [],
    imports: Array.isArray(state?.imports) ? state.imports : []
  };
}

function normalizeIncident(incident: Incident): Incident {
  const fallback = buildDemoState();
  const now = isoNow();
  const riskScore = Number.isFinite(incident.riskScore) ? incident.riskScore : 25;
  const physicalThreatScore = Number.isFinite(incident.physicalThreatScore) ? incident.physicalThreatScore : 0;

  return {
    ...incident,
    id: incident.id || createId("inc"),
    monitoredEntityId: incident.monitoredEntityId || fallback.activeMonitoredEntityId,
    collectedAt: incident.collectedAt || incident.createdAt || now,
    publishedAt: incident.publishedAt || incident.collectedAt || incident.createdAt || now,
    title: incident.title || `Report: ${incident.domain || incident.authorName || "sem título"}`,
    summary: incident.summary || incident.content || "",
    content: incident.content || incident.summary || "",
    url: incident.url || "",
    domain: incident.domain || toDomain(incident.url) || incident.authorName || "Não disponível",
    platform: incident.platform || "Não informado",
    authorName: incident.authorName || incident.domain || incident.title || "Não informado",
    authorHandle: incident.authorHandle || "",
    authorUrl: incident.authorUrl || incident.url || "",
    actorType: incident.actorType || "Origem indeterminada",
    category: incident.category || "Outro",
    subcategory: incident.subcategory || "",
    verificationStatus: incident.verificationStatus || "Não analisado",
    sentiment: incident.sentiment || "não disponível",
    provenanceType: incident.provenanceType || "FATO_COLETADO",
    confidenceLevel: incident.confidenceLevel || "medium",
    riskScore,
    riskLevel: incident.riskLevel || classifyRisk(riskScore),
    riskFactors: incident.riskFactors || defaultRiskFactors(riskScore),
    threatLevel: incident.threatLevel || 1,
    physicalThreatScore,
    physicalThreatFactors:
      incident.physicalThreatFactors || {
        declaredIntent: 0,
        targetSpecificity: 0,
        apparentCapability: 0,
        proximityAccess: 0,
        recurrenceEscalation: 0,
        dataLocationExposure: 0
      },
    physicalThreatFlags: incident.physicalThreatFlags || emptyPhysicalThreatFlags(),
    reachType: incident.reachType || "unavailable",
    velocityScore: Number.isFinite(incident.velocityScore) ? incident.velocityScore : 20,
    coordinationLevel: incident.coordinationLevel || "Não identificado",
    target: incident.target || "Monitorado",
    locationExposure: incident.locationExposure || "Não disponível",
    status: incident.status || "Novo",
    ownerTeam: incident.ownerTeam || "Atlas OSINT",
    assignedTo: incident.assignedTo || "",
    recommendedAction: incident.recommendedAction || "Revisar",
    analystNotes: incident.analystNotes || "",
    nextAction: incident.nextAction || "Revisar",
    relatedActorIds: Array.isArray(incident.relatedActorIds) ? incident.relatedActorIds : [],
    relatedNarrativeIds: Array.isArray(incident.relatedNarrativeIds) ? incident.relatedNarrativeIds : [],
    relatedIncidentIds: Array.isArray(incident.relatedIncidentIds) ? incident.relatedIncidentIds : [],
    indicators: Array.isArray(incident.indicators) ? incident.indicators : [],
    keywords: Array.isArray(incident.keywords) ? incident.keywords : [],
    createdAt: incident.createdAt || incident.collectedAt || now,
    updatedAt: incident.updatedAt || incident.createdAt || incident.collectedAt || now,
    deletedAt: incident.deletedAt ?? null
  };
}

function deriveEntitiesFromIncident(
  incident: Incident,
  state: Pick<AtlasState, "actors" | "narratives">
): { incident: Incident; actors: Actor[]; narratives: Narrative[] } {
  let nextIncident = incident;
  let actors = state.actors;
  let narratives = state.narratives;

  if (isActorReport(incident)) {
    const derived = upsertActorForIncident(nextIncident, actors);
    actors = derived.actors;
    nextIncident = {
      ...nextIncident,
      relatedActorIds: uniqueValues([...nextIncident.relatedActorIds, derived.actorId])
    };
  }

  if (isNarrativeReport(incident)) {
    const derived = upsertNarrativeForIncident(nextIncident, narratives);
    narratives = derived.narratives;
    nextIncident = {
      ...nextIncident,
      relatedNarrativeIds: uniqueValues([...nextIncident.relatedNarrativeIds, derived.narrativeId])
    };
  }

  return { incident: nextIncident, actors, narratives };
}

function backfillActorAndNarrativeReports(
  incidents: Incident[],
  initialActors: Actor[],
  initialNarratives: Narrative[]
): { incidents: Incident[]; actors: Actor[]; narratives: Narrative[] } {
  let actors = initialActors;
  let narratives = initialNarratives;

  const nextIncidents = incidents.map((incident) => {
    const derived = deriveEntitiesFromIncident(incident, { actors, narratives });
    actors = derived.actors;
    narratives = derived.narratives;
    return derived.incident;
  });

  return { incidents: nextIncidents, actors, narratives };
}

function materializeIncidentBatch(
  incidents: Incident[],
  state: Pick<AtlasState, "actors" | "narratives">
): { incidents: Incident[]; actors: Actor[]; narratives: Narrative[] } {
  let actors = state.actors;
  let narratives = state.narratives;
  const materializedIncidents = incidents.map((incident) => {
    const derived = deriveEntitiesFromIncident(incident, { actors, narratives });
    actors = derived.actors;
    narratives = derived.narratives;
    return derived.incident;
  });

  return { incidents: materializedIncidents, actors, narratives };
}

function upsertActorForIncident(incident: Incident, actors: Actor[]): { actors: Actor[]; actorId: string } {
  const key = actorIdentityKey(incident);
  const existing = actors.find((actor) => actorIdentityKeyFromActor(actor) === key);
  const lastActivity = incident.updatedAt || incident.createdAt || isoNow();
  const followers = incident.reachType === "estimated" ? incident.reachValue : undefined;

  if (existing) {
    const incidentIds = uniqueValues([...existing.incidentIds, incident.id]);
    return {
      actorId: existing.id,
      actors: actors.map((actor) =>
        actor.id === existing.id
          ? {
              ...actor,
              name: actor.name || incident.authorName,
              handle: actor.handle || incident.authorHandle,
              url: actor.url || incident.authorUrl || incident.url,
              platform: actor.platform || incident.platform || "Não informado",
              type: actor.type === "Origem indeterminada" ? incident.actorType : actor.type,
              followers: actor.followers ?? followers,
              occurrenceCount: incidentIds.length,
              recurrence: recurrenceFromCount(incidentIds.length),
              riskScore: Math.max(actor.riskScore, incident.riskScore),
              confidenceLevel: strongerConfidence(actor.confidenceLevel, incident.confidenceLevel),
              lastActivity: laterDate(actor.lastActivity, lastActivity),
              observations: actor.observations || incident.analystNotes,
              incidentIds
            }
          : actor
      )
    };
  }

  const actor: Actor = {
    id: createId("actor"),
    name: incident.authorName || incident.domain || incident.title.replace(/^Report:\s*/i, ""),
    handle: incident.authorHandle || "",
    url: incident.authorUrl || incident.url,
    platform: incident.platform || "Não informado",
    type: incident.actorType,
    description: incident.summary || incident.content || "Ator ou página registrado por report rápido.",
    followers,
    followersProvenance: followers ? "ESTIMATIVA_ATLAS" : "NAO_DISPONIVEL",
    occurrenceCount: 1,
    recurrence: "baixa",
    riskScore: incident.riskScore,
    confidenceLevel: incident.confidenceLevel,
    lastActivity,
    observations: incident.analystNotes,
    evidenceIds: [],
    incidentIds: [incident.id],
    narrativeIds: incident.relatedNarrativeIds
  };

  return { actorId: actor.id, actors: [actor, ...actors] };
}

function upsertNarrativeForIncident(
  incident: Incident,
  narratives: Narrative[]
): { narratives: Narrative[]; narrativeId: string } {
  const key = narrativeIdentityKey(incident);
  const existing = narratives.find((narrative) => normalizeKey(narrative.name) === key);
  const source = incident.domain || toDomain(incident.url) || incident.platform || "Fonte não informada";

  if (existing) {
    return {
      narrativeId: existing.id,
      narratives: narratives.map((narrative) => {
        if (narrative.id !== existing.id) return narrative;
        const incidentIds = uniqueValues([...narrative.incidentIds, incident.id]);
        return {
          ...narrative,
          description: narrative.description || incident.summary,
          centralMessage: narrative.centralMessage || incident.summary,
          volume: Math.max(narrative.volume, incidentIds.length),
          growth: Math.max(narrative.growth, incidentIds.length > 1 ? 25 : 10),
          velocity: Math.max(narrative.velocity, incident.velocityScore),
          platforms: uniqueValues([...narrative.platforms, incident.platform].filter(Boolean)),
          topSources: uniqueValues([...narrative.topSources, source].filter(Boolean)),
          incidentIds,
          riskScore: Math.max(narrative.riskScore, incident.riskScore),
          confidenceLevel: strongerConfidence(narrative.confidenceLevel, incident.confidenceLevel),
          recommendation: narrative.recommendation || incident.recommendedAction,
          status: narrative.status === "mitigada" ? narrative.status : incidentIds.length > 1 ? "em crescimento" : "em observação"
        };
      })
    };
  }

  const narrative: Narrative = {
    id: createId("nar"),
    name: narrativeNameFromIncident(incident),
    description: incident.summary,
    centralMessage: incident.summary,
    polarity: incident.sentiment === "positivo" ? "positiva" : incident.sentiment === "neutro" ? "neutra" : incident.sentiment === "misto" ? "mista" : "negativa",
    volume: 1,
    growth: 10,
    velocity: incident.velocityScore,
    platforms: [incident.platform].filter(Boolean),
    topSources: [source].filter(Boolean),
    topAmplifiers: [incident.authorName].filter(Boolean),
    incidentIds: [incident.id],
    probableOrigin: "Não inferido",
    riskScore: incident.riskScore,
    confidenceLevel: incident.confidenceLevel,
    reachedAudiences: [],
    recommendation: incident.recommendedAction,
    status: "em observação",
    provenanceType: incident.provenanceType
  };

  return { narrativeId: narrative.id, narratives: [narrative, ...narratives] };
}

function isActorReport(incident: Incident): boolean {
  const keywords = incident.keywords ?? [];

  return (
    keywords.includes("atores") ||
    keywords.includes("influenciador") ||
    keywords.includes("pessoa exposta") ||
    (incident.ownerTeam === "Atlas OSINT" && ["Influenciador", "Pessoa exposta"].includes(incident.actorType))
  );
}

function isNarrativeReport(incident: Incident): boolean {
  return incident.ownerTeam === "Comunicação" || (incident.keywords ?? []).includes("narrativas") || incident.category === "Narrativa negativa";
}

function actorIdentityKey(incident: Incident): string {
  return normalizeKey(incident.authorUrl || incident.url || incident.authorName || incident.domain || incident.title);
}

function actorIdentityKeyFromActor(actor: Actor): string {
  return normalizeKey(actor.url || actor.handle || actor.name);
}

function narrativeIdentityKey(incident: Incident): string {
  return normalizeKey(narrativeNameFromIncident(incident));
}

function narrativeNameFromIncident(incident: Incident): string {
  return incident.authorName || incident.domain || incident.title.replace(/^Report:\s*/i, "") || "Narrativa registrada";
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function recurrenceFromCount(count: number): Actor["recurrence"] {
  if (count >= 5) return "alta";
  if (count >= 2) return "moderada";
  return "baixa";
}

function strongerConfidence(current: Actor["confidenceLevel"], incoming: Actor["confidenceLevel"]): Actor["confidenceLevel"] {
  const order: Record<Actor["confidenceLevel"], number> = { low: 1, medium: 2, high: 3 };
  return order[incoming] > order[current] ? incoming : current;
}

function laterDate(current: string, incoming: string): string {
  return new Date(incoming).getTime() > new Date(current).getTime() ? incoming : current;
}

function backfillEvidenceReports(evidences: Evidence[], incidents: Incident[]): Evidence[] {
  const existingIncidentIds = new Set(evidences.map((evidence) => evidence.incidentId));
  const existingEvidenceIds = new Set(evidences.map((evidence) => evidence.id));
  const recovered = incidents
    .filter((incident) => isLegacyEvidenceReport(incident) && !existingIncidentIds.has(incident.id))
    .map((incident) => evidenceFromLegacyIncident(incident))
    .filter((evidence) => !existingEvidenceIds.has(evidence.id));

  return recovered.length ? [...recovered, ...evidences] : evidences;
}

function isLegacyEvidenceReport(incident: Incident): boolean {
  return /\bevid[êe]ncia\b/i.test(`${incident.subcategory} ${incident.analystNotes} ${(incident.keywords ?? []).join(" ")}`);
}

function evidenceFromLegacyIncident(incident: Incident): Evidence {
  const fileName = extractMetadataValue(incident.analystNotes, "Arquivo");
  const videoUrl = extractMetadataValue(incident.analystNotes, "Link de vídeo");
  const evidenceKind = extractMetadataValue(incident.analystNotes, "Tipo de evidência");
  const source = fileName || videoUrl || incident.url || incident.authorName || "Report com evidência";

  return {
    id: `ev_${incident.id}_legacy`,
    incidentId: incident.id,
    type: evidenceTypeFromLegacyMetadata(fileName, videoUrl, evidenceKind),
    description: fileName ? `Arquivo anexado: ${fileName}` : videoUrl ? "Link de vídeo anexado ao report" : "Evidência registrada no report",
    url: videoUrl || incident.url || undefined,
    fileName: fileName || undefined,
    collectedBy: incident.assignedTo || "Administrador",
    collectedAt: incident.createdAt || incident.collectedAt || isoNow(),
    source,
    integrity: "metadados pendentes",
    observation: incident.analystNotes,
    confidenceLevel: incident.confidenceLevel,
    provenanceType: incident.provenanceType
  };
}

function extractMetadataValue(notes: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = notes.match(new RegExp(`${escapedLabel}:\\s*([^\\n.]+(?:\\.[\\w]+)?)`, "i"));
  return match?.[1]?.trim() ?? "";
}

function evidenceTypeFromLegacyMetadata(fileName: string, videoUrl: string, evidenceKind: string): Evidence["type"] {
  if (videoUrl || /link de v[íi]deo/i.test(evidenceKind)) return "Vídeo";
  if (/\.(png|jpe?g|gif|webp|avif)$/i.test(fileName) || /foto|imagem|screenshot|print/i.test(evidenceKind)) return "Screenshot";
  if (/\.(pdf|docx?|xlsx?|csv|txt)$/i.test(fileName) || /documento/i.test(evidenceKind)) return "Documento";
  return "Arquivo";
}

function buildEmptyState(): AtlasState {
  const fallback = buildDemoState();
  return {
    ...fallback,
    monitoredEntities: [],
    activeMonitoredEntityId: "",
    incidents: [],
    evidences: [],
    actors: [],
    narratives: [],
    indicators: [],
    alerts: [],
    tasks: [],
    blacklist: [],
    auditLogs: [],
    imports: []
  };
}

function getReadOnlyToken(pathname: string): string | null {
  const match = pathname.match(/^\/view\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function loadLocalStorageStateForMigration(): AtlasState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return normalizeState(JSON.parse(raw) as AtlasState);
  } catch {
    return null;
  }
}

export function AtlasProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(reducer, undefined, buildDemoState);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState("");
  const hydratedUserId = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readOnlyToken = useMemo(() => getReadOnlyToken(pathname), [pathname]);
  const readOnly = Boolean(readOnlyToken);

  useEffect(() => {
    if (readOnlyToken) {
      const token = readOnlyToken;
      let cancelled = false;
      setLoading(true);
      setSyncError("");
      hydratedUserId.current = null;

      async function loadSharedViewState() {
        try {
          const response = await fetch(`/api/shared-views/${encodeURIComponent(token)}/state`, {
            cache: "no-store"
          });
          const payload = (await response.json().catch(() => null)) as
            | (SharedViewStateResponse & { error?: string })
            | null;

          if (!response.ok || !payload?.state) {
            throw new Error(payload?.error || "Link de visualização não encontrado.");
          }

          if (!cancelled) {
            dispatch({ type: "load", state: normalizeState(payload.state) });
          }
        } catch (error) {
          if (!cancelled) {
            setSyncError(error instanceof Error ? error.message : "Não foi possível carregar o link de visualização.");
            dispatch({ type: "load", state: buildEmptyState() });
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      void loadSharedViewState();

      return () => {
        cancelled = true;
      };
    }

    if (authLoading) return;
    if (!user) {
      hydratedUserId.current = null;
      dispatch({ type: "load", state: buildDemoState() });
      setLoading(false);
      return;
    }

    let cancelled = false;
    const currentUser = user;
    const userId = user.id;
    setLoading(true);
    setSyncError("");

    async function loadRemoteState() {
      try {
        if (!isSupabaseConfigured()) {
          dispatch({ type: "load", state: buildDemoState() });
          setSyncError("Supabase não está configurado. Os dados não serão persistidos no servidor.");
          return;
        }

        const remoteState = normalizeState(await loadAtlasStateFromSupabase(currentUser));
        const localState = loadLocalStorageStateForMigration();
        const shouldMigrateLocal =
          localState &&
          remoteState.incidents.length === 0 &&
          remoteState.evidences.length === 0 &&
          remoteState.blacklist.length === 0 &&
          (localState.incidents.length > 0 || localState.evidences.length > 0 || localState.blacklist.length > 0);

        if (shouldMigrateLocal) {
          await replaceAtlasStateInSupabase(userId, localState);
          if (!cancelled) dispatch({ type: "load", state: localState });
          clearLegacyLocalStorage();
        } else if (!cancelled) {
          dispatch({ type: "load", state: remoteState });
          clearLegacyLocalStorage();
        }

        hydratedUserId.current = userId;
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : "Não foi possível carregar dados do Supabase.");
          dispatch({ type: "load", state: buildDemoState() });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRemoteState();

    return () => {
      cancelled = true;
    };
  }, [authLoading, readOnlyToken, user]);

  useEffect(() => {
    if (readOnly || !user || loading || hydratedUserId.current !== user.id || !isSupabaseConfigured()) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      replaceAtlasStateInSupabase(user.id, state).catch((error: unknown) => {
        setSyncError(error instanceof Error ? error.message : "Não foi possível salvar dados no Supabase.");
      });
    }, 350);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [loading, readOnly, state, user]);

  const value = useMemo<AtlasStoreValue>(() => {
    const activeEntity =
      state.monitoredEntities.find((entity) => entity.id === state.activeMonitoredEntityId) ??
      state.monitoredEntities[0];

    return {
      ...state,
      activeEntityName: activeEntity?.name ?? "Não disponível",
      loading,
      syncError,
      readOnly,
      viewToken: readOnlyToken,
      viewBasePath: readOnlyToken ? `/view/${readOnlyToken}` : "",
      addIncident: (incident, user) => {
        if (!readOnly) dispatch({ type: "addIncident", incident, user });
      },
      updateIncident: (incidentId, patch, user, justification) => {
        if (!readOnly) dispatch({ type: "updateIncident", incidentId, patch, user, justification });
      },
      deleteIncident: (incidentId, user) => {
        if (!readOnly) dispatch({ type: "deleteIncident", incidentId, user });
      },
      overrideRisk: (incidentId, score, justification, user) => {
        if (!readOnly) dispatch({ type: "overrideRisk", incidentId, score, justification, user });
      },
      addEvidence: (evidence, user) => {
        if (!readOnly) dispatch({ type: "addEvidence", evidence, user });
      },
      updateEvidence: (evidenceId, patch, user) => {
        if (!readOnly) dispatch({ type: "updateEvidence", evidenceId, patch, user });
      },
      deleteEvidence: (evidenceId, user) => {
        if (!readOnly) dispatch({ type: "deleteEvidence", evidenceId, user });
      },
      updateActor: (actorId, patch, user) => {
        if (!readOnly) dispatch({ type: "updateActor", actorId, patch, user });
      },
      deleteActor: (actorId, user) => {
        if (!readOnly) dispatch({ type: "deleteActor", actorId, user });
      },
      updateNarrative: (narrativeId, patch, user) => {
        if (!readOnly) dispatch({ type: "updateNarrative", narrativeId, patch, user });
      },
      deleteNarrative: (narrativeId, user) => {
        if (!readOnly) dispatch({ type: "deleteNarrative", narrativeId, user });
      },
      updateIndicator: (indicatorId, patch, user) => {
        if (!readOnly) dispatch({ type: "updateIndicator", indicatorId, patch, user });
      },
      deleteIndicator: (indicatorId, user) => {
        if (!readOnly) dispatch({ type: "deleteIndicator", indicatorId, user });
      },
      addBlacklistEntry: (entry, user) => {
        if (!readOnly) dispatch({ type: "addBlacklistEntry", entry, user });
      },
      updateBlacklistEntry: (entryId, patch, user) => {
        if (!readOnly) dispatch({ type: "updateBlacklistEntry", entryId, patch, user });
      },
      deleteBlacklistEntry: (entryId, user) => {
        if (!readOnly) dispatch({ type: "deleteBlacklistEntry", entryId, user });
      },
      updateBlacklistStatus: (entryId, status, user) => {
        if (!readOnly) dispatch({ type: "updateBlacklistStatus", entryId, status, user });
      },
      importIncidents: (incidents, report, user) => {
        if (!readOnly) dispatch({ type: "importIncidents", incidents, report, user });
      },
      updateImport: (importId, patch, user) => {
        if (!readOnly) dispatch({ type: "updateImport", importId, patch, user });
      },
      deleteImport: (importId, user) => {
        if (!readOnly) dispatch({ type: "deleteImport", importId, user });
      },
      ackAlert: (alertId, user) => {
        if (!readOnly) dispatch({ type: "ackAlert", alertId, user });
      },
      resetDemo: async () => {
        if (readOnly) return;
        const emptyState = buildDemoState();
        dispatch({ type: "load", state: emptyState });
        if (user && isSupabaseConfigured()) {
          await replaceAtlasStateInSupabase(user.id, emptyState);
        }
      }
    };
  }, [loading, readOnly, readOnlyToken, state, syncError, user]);

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
}

function clearLegacyLocalStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey);
  window.localStorage.removeItem("atlas-sentinel-user-v1");
  window.localStorage.removeItem("atlas-sentinel-users-v1");
  legacyStorageKeys.forEach((key) => window.localStorage.removeItem(key));
}

export function useAtlas() {
  const context = useContext(AtlasContext);
  if (!context) {
    throw new Error("useAtlas must be used inside AtlasProvider");
  }
  return context;
}
