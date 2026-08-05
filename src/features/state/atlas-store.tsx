"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { AtlasState, AuditLog, BlacklistEntry, BlacklistStatus, Evidence, Incident } from "@/types/domain";
import { buildDemoState } from "@/services/demo-data";
import { evaluateIncidentAlerts } from "@/services/alerts";
import { classifyRisk } from "@/services/risk";
import { createId } from "@/utils/id";
import { isoNow } from "@/utils/date";
import { canWrite, type DemoUser } from "@/features/auth/auth";

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
  | {
      type: "overrideRisk";
      incidentId: string;
      score: number;
      justification: string;
      user: DemoUser;
    }
  | { type: "addEvidence"; evidence: Evidence; user: DemoUser }
  | { type: "addBlacklistEntry"; entry: BlacklistEntry; user: DemoUser }
  | { type: "updateBlacklistStatus"; entryId: string; status: BlacklistStatus; user: DemoUser }
  | { type: "importIncidents"; incidents: Incident[]; report: AtlasState["imports"][number]; user: DemoUser }
  | { type: "ackAlert"; alertId: string; user: DemoUser };

interface AtlasStoreValue extends AtlasState {
  activeEntityName: string;
  addIncident: (incident: Incident, user: DemoUser) => void;
  updateIncident: (
    incidentId: string,
    patch: Partial<Incident>,
    user: DemoUser,
    justification?: string
  ) => void;
  overrideRisk: (incidentId: string, score: number, justification: string, user: DemoUser) => void;
  addEvidence: (evidence: Evidence, user: DemoUser) => void;
  addBlacklistEntry: (entry: BlacklistEntry, user: DemoUser) => void;
  updateBlacklistStatus: (entryId: string, status: BlacklistStatus, user: DemoUser) => void;
  importIncidents: (incidents: Incident[], report: AtlasState["imports"][number], user: DemoUser) => void;
  ackAlert: (alertId: string, user: DemoUser) => void;
  resetDemo: () => void;
}

const AtlasContext = createContext<AtlasStoreValue | null>(null);
const storageKey = "atlas-sentinel-state-v3-empty";
const legacyStorageKeys = ["atlas-sentinel-state-v1", "atlas-sentinel-state-v2"];

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
      return {
        ...state,
        incidents: [action.incident, ...state.incidents],
        alerts: [...alerts, ...state.alerts],
        auditLogs: [
          auditLog("incident", action.incident.id, "created", action.user, undefined, action.incident.title),
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
    case "importIncidents": {
      if (!canWrite(action.user)) return state;
      const alerts = action.incidents.flatMap(evaluateIncidentAlerts);
      return {
        ...state,
        incidents: [...action.incidents, ...state.incidents],
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
  return {
    ...state,
    blacklist: state.blacklist ?? []
  };
}

function loadInitialState(): AtlasState {
  if (typeof window === "undefined") return buildDemoState();
  legacyStorageKeys.forEach((key) => window.localStorage.removeItem(key));
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return buildDemoState();
  try {
    return normalizeState(JSON.parse(raw) as AtlasState);
  } catch {
    return buildDemoState();
  }
}

export function AtlasProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const value = useMemo<AtlasStoreValue>(() => {
    const activeEntity =
      state.monitoredEntities.find((entity) => entity.id === state.activeMonitoredEntityId) ??
      state.monitoredEntities[0];

    return {
      ...state,
      activeEntityName: activeEntity?.name ?? "Não disponível",
      addIncident: (incident, user) => dispatch({ type: "addIncident", incident, user }),
      updateIncident: (incidentId, patch, user, justification) =>
        dispatch({ type: "updateIncident", incidentId, patch, user, justification }),
      overrideRisk: (incidentId, score, justification, user) =>
        dispatch({ type: "overrideRisk", incidentId, score, justification, user }),
      addEvidence: (evidence, user) => dispatch({ type: "addEvidence", evidence, user }),
      addBlacklistEntry: (entry, user) => dispatch({ type: "addBlacklistEntry", entry, user }),
      updateBlacklistStatus: (entryId, status, user) =>
        dispatch({ type: "updateBlacklistStatus", entryId, status, user }),
      importIncidents: (incidents, report, user) =>
        dispatch({ type: "importIncidents", incidents, report, user }),
      ackAlert: (alertId, user) => dispatch({ type: "ackAlert", alertId, user }),
      resetDemo: () => dispatch({ type: "load", state: buildDemoState() })
    };
  }, [state]);

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
}

export function useAtlas() {
  const context = useContext(AtlasContext);
  if (!context) {
    throw new Error("useAtlas must be used inside AtlasProvider");
  }
  return context;
}
