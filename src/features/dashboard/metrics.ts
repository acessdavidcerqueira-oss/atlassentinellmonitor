import type { AtlasState, Incident } from "@/types/domain";

export function getDashboardMetrics(state: AtlasState) {
  const incidents = state.incidents.filter((incident) => !incident.deletedAt);
  const criticalAlerts = state.alerts.filter(
    (alert) => alert.severity === "Crítico" && alert.status !== "resolvido"
  );
  const openStatuses: Incident["status"][] = ["Novo", "Em triagem", "Validado", "Escalonado", "Em tratamento", "Monitorando"];
  const negative = incidents.filter((incident) => incident.sentiment === "negativo").length;
  const disinformation = incidents.filter((incident) =>
    ["Desinformação", "Conteúdo enganoso", "Conteúdo fora de contexto", "Conteúdo manipulado", "Deepfake"].includes(
      incident.category
    )
  ).length;
  const fakeProfiles = incidents.filter((incident) =>
    ["Perfil falso", "Impersonação"].includes(incident.category)
  ).length;
  const fraud = incidents.filter((incident) =>
    ["Fraude", "Golpe financeiro", "Phishing", "Domínio fraudulento"].includes(incident.category)
  ).length;
  const physicalThreats = incidents.filter((incident) => incident.threatLevel >= 2).length;
  const cyber = incidents.filter((incident) =>
    ["Phishing", "Domínio fraudulento", "Malware", "Vazamento de credencial", "Ataque contra conta", "Ataque contra site", "Incidente cibernético"].includes(
      incident.category
    )
  ).length;

  const now = Date.now();
  const last24 = incidents.filter((incident) => now - new Date(incident.collectedAt).getTime() <= 24 * 60 * 60 * 1000);
  const previous24 = incidents.filter((incident) => {
    const age = now - new Date(incident.collectedAt).getTime();
    return age > 24 * 60 * 60 * 1000 && age <= 48 * 60 * 60 * 1000;
  });
  const avg = (items: Incident[]) =>
    items.length > 0 ? items.reduce((sum, incident) => sum + incident.riskScore, 0) / items.length : 0;
  const riskDelta = Math.round(avg(last24) - avg(previous24));

  return {
    totalMentions: incidents.length,
    openIncidents: incidents.filter((incident) => openStatuses.includes(incident.status)).length,
    criticalAlerts: criticalAlerts.length,
    negativeContent: negative,
    disinformation,
    fakeProfiles,
    fraud,
    physicalThreats,
    cyber,
    riskDelta
  };
}

export function seriesByDay(incidents: Incident[]) {
  const map = new Map<string, { date: string; mencoes: number; risco: number; negativo: number; neutro: number; positivo: number }>();
  incidents.forEach((incident) => {
    const date = incident.publishedAt.slice(0, 10);
    const entry = map.get(date) ?? { date, mencoes: 0, risco: 0, negativo: 0, neutro: 0, positivo: 0 };
    entry.mencoes += 1;
    entry.risco += incident.riskScore;
    if (incident.sentiment === "negativo") entry.negativo += 1;
    if (incident.sentiment === "neutro") entry.neutro += 1;
    if (incident.sentiment === "positivo") entry.positivo += 1;
    map.set(date, entry);
  });
  return Array.from(map.values())
    .map((entry) => ({ ...entry, risco: Math.round(entry.risco / Math.max(1, entry.mencoes)) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function countBy<T extends string>(values: T[]) {
  const map = new Map<T, number>();
  values.forEach((value) => map.set(value, (map.get(value) ?? 0) + 1));
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}
