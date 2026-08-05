import type { Alert, Incident } from "@/types/domain";
import { createId } from "@/utils/id";
import { isoNow } from "@/utils/date";

export function evaluateIncidentAlerts(incident: Incident): Alert[] {
  const alerts: Alert[] = [];

  if (incident.riskScore > 80) {
    alerts.push({
      id: createId("alert"),
      title: "Risk Score crítico",
      description: `${incident.title} atingiu Risk Score ${incident.riskScore}.`,
      severity: "Crítico",
      incidentId: incident.id,
      createdAt: isoNow(),
      status: "novo",
      ruleId: "rule_risk_above_80",
      provenanceType: incident.provenanceType
    });
  }

  if (incident.threatLevel >= 4) {
    alerts.push({
      id: createId("alert"),
      title: "Ameaça à pessoa exige escalonamento",
      description: `${incident.title} está em Threat Level ${incident.threatLevel}.`,
      severity: incident.threatLevel === 5 ? "Crítico" : "Alto",
      incidentId: incident.id,
      createdAt: isoNow(),
      status: "novo",
      ruleId: "rule_threat_level_4",
      provenanceType: incident.provenanceType
    });
  }

  if (incident.category === "Phishing" || incident.category === "Domínio fraudulento") {
    alerts.push({
      id: createId("alert"),
      title: "Indicador técnico sensível",
      description: `${incident.category} requer contenção e evidência técnica.`,
      severity: incident.riskScore >= 61 ? "Alto" : "Moderado",
      incidentId: incident.id,
      createdAt: isoNow(),
      status: "novo",
      ruleId: "rule_cti_indicator",
      provenanceType: incident.provenanceType
    });
  }

  if (incident.category === "Perfil falso" || incident.category === "Impersonação") {
    alerts.push({
      id: createId("alert"),
      title: "Perfil falso ou impersonação",
      description: "Preservar evidências antes de solicitar ação externa.",
      severity: incident.riskScore >= 61 ? "Alto" : "Moderado",
      incidentId: incident.id,
      createdAt: isoNow(),
      status: "novo",
      ruleId: "rule_impersonation",
      provenanceType: incident.provenanceType
    });
  }

  if (incident.category === "Exposição de agenda" || incident.locationExposure !== "Não disponível") {
    alerts.push({
      id: createId("alert"),
      title: "Exposição de agenda ou localização",
      description: "Validar com fonte autorizada e acionar segurança física quando necessário.",
      severity: incident.threatLevel >= 4 ? "Crítico" : "Alto",
      incidentId: incident.id,
      createdAt: isoNow(),
      status: "novo",
      ruleId: "rule_location_exposure",
      provenanceType: incident.provenanceType
    });
  }

  return alerts;
}
