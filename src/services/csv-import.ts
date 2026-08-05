import Papa from "papaparse";
import { atlasCsvColumns, atlasCsvRowSchema, type AtlasCsvColumn, type AtlasCsvRow } from "@/schemas/csv";
import type { AtlasState, ImportReport, ImportRowIssue, Incident } from "@/types/domain";
import { createId } from "@/utils/id";
import { isoNow } from "@/utils/date";
import { hashText, normalizeUrl, sanitizeCell, splitList, toDomain } from "@/utils/text";
import {
  calculatePhysicalThreatScore,
  calculateRiskScore,
  classifyRisk,
  classifyThreatLevel,
  defaultRiskFactors,
  emptyPhysicalThreatFlags
} from "@/services/risk";

export type ImportSourceFormat = "atlas" | "brand24" | "generic";

export interface ImportPreview {
  report: ImportReport;
  incidents: Incident[];
  duplicates: string[];
  sanitizedRows: Record<string, string>[];
}

const defaultBrand24Mapping: Record<string, AtlasCsvColumn> = {
  date: "published_at",
  published_at: "published_at",
  title: "title",
  snippet: "summary",
  text: "content",
  content: "content",
  url: "url",
  domain: "domain",
  source: "platform",
  platform: "platform",
  author: "author_name",
  author_name: "author_name",
  author_handle: "author_handle",
  sentiment: "sentiment",
  reach: "reach_value",
  influence_score: "velocity_score"
};

export function parseCsvText(text: string): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transform: sanitizeCell
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map((error) => error.message).join("; "));
  }

  return parsed.data.map((row) => sanitizeRow(row));
}

function sanitizeRow(row: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), sanitizeCell(value)]));
}

function mapBrand24Row(row: Record<string, string>, monitoredEntity: string): Record<AtlasCsvColumn, string> {
  const normalized = blankAtlasRow(monitoredEntity);

  Object.entries(row).forEach(([key, value]) => {
    const atlasKey = defaultBrand24Mapping[key.trim().toLowerCase()];
    if (atlasKey) {
      normalized[atlasKey] = value;
    }
  });

  normalized.collected_at = normalized.collected_at || isoNow();
  normalized.provenance_type = "FATO_COLETADO";
  normalized.confidence_level = "medium";
  normalized.reach_type = normalized.reach_value ? "native" : "unavailable";
  normalized.category = normalized.category || "Outro";
  normalized.verification_status = normalized.verification_status || "Não analisado";
  normalized.status = normalized.status || "Novo";
  normalized.owner_team = normalized.owner_team || "Atlas OSINT";
  normalized.actor_type = normalized.actor_type || "Origem indeterminada";
  return normalized;
}

function mapGenericRow(
  row: Record<string, string>,
  monitoredEntity: string,
  mapping: Partial<Record<string, AtlasCsvColumn>>
): Record<AtlasCsvColumn, string> {
  const normalized = blankAtlasRow(monitoredEntity);

  Object.entries(mapping).forEach(([sourceColumn, atlasColumn]) => {
    if (atlasColumn && row[sourceColumn] !== undefined) {
      normalized[atlasColumn] = row[sourceColumn];
    }
  });

  normalized.collected_at = normalized.collected_at || isoNow();
  normalized.provenance_type = normalized.provenance_type || "FATO_COLETADO";
  normalized.confidence_level = normalized.confidence_level || "low";
  normalized.reach_type = normalized.reach_type || "unavailable";
  normalized.category = normalized.category || "Outro";
  normalized.verification_status = normalized.verification_status || "Não analisado";
  normalized.status = normalized.status || "Novo";
  normalized.owner_team = normalized.owner_team || "Atlas OSINT";
  normalized.actor_type = normalized.actor_type || "Origem indeterminada";
  return normalized;
}

function blankAtlasRow(monitoredEntity: string): Record<AtlasCsvColumn, string> {
  return Object.fromEntries(
    atlasCsvColumns.map((column) => [column, column === "monitored_entity" ? monitoredEntity : ""])
  ) as Record<AtlasCsvColumn, string>;
}

function normalizeAtlasRow(
  row: Record<string, string>,
  monitoredEntity: string
): Record<AtlasCsvColumn, string> {
  const normalized = blankAtlasRow(monitoredEntity);
  atlasCsvColumns.forEach((column) => {
    normalized[column] = sanitizeCell(row[column] ?? "");
  });

  normalized.monitored_entity = normalized.monitored_entity || monitoredEntity;
  normalized.collected_at = normalized.collected_at || isoNow();
  normalized.provenance_type = normalized.provenance_type || "FATO_COLETADO";
  normalized.confidence_level = normalized.confidence_level || "medium";
  normalized.reach_type = normalized.reach_type || "unavailable";
  normalized.category = normalized.category || "Outro";
  normalized.verification_status = normalized.verification_status || "Não analisado";
  normalized.status = normalized.status || "Novo";
  normalized.owner_team = normalized.owner_team || "Atlas OSINT";
  normalized.actor_type = normalized.actor_type || "Origem indeterminada";
  return normalized;
}

export function buildDedupeKey(row: Pick<AtlasCsvRow, "url" | "published_at" | "author_handle" | "author_name" | "title" | "content">): string {
  const author = row.author_handle || row.author_name || "";
  const contentHash = hashText(`${row.title ?? ""}|${row.content ?? ""}`);
  return [normalizeUrl(row.url ?? ""), row.published_at ?? "", author.toLowerCase(), contentHash].join("|");
}

export function previewCsvImport(params: {
  fileName: string;
  text: string;
  sourceFormat: ImportSourceFormat;
  monitoredEntityId: string;
  monitoredEntityName: string;
  existingIncidents: Incident[];
  mapping?: Partial<Record<string, AtlasCsvColumn>>;
}): ImportPreview {
  const rows = parseCsvText(params.text);
  const issues: ImportRowIssue[] = [];
  const duplicates: string[] = [];
  const incidents: Incident[] = [];
  const existingKeys = new Set(
    params.existingIncidents.map((incident) =>
      buildDedupeKey({
        url: incident.url,
        published_at: incident.publishedAt,
        author_handle: incident.authorHandle,
        author_name: incident.authorName,
        title: incident.title,
        content: incident.content
      })
    )
  );
  const importedKeys = new Set<string>();

  rows.forEach((row, index) => {
    const atlasRow =
      params.sourceFormat === "atlas"
        ? normalizeAtlasRow(row, params.monitoredEntityName)
        : params.sourceFormat === "brand24"
          ? mapBrand24Row(row, params.monitoredEntityName)
          : mapGenericRow(row, params.monitoredEntityName, params.mapping ?? {});

    const result = atlasCsvRowSchema.safeParse(atlasRow);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        issues.push({
          row: index + 2,
          field: issue.path.join("."),
          message: issue.message,
          severity: "error"
        });
      });
      return;
    }

    const dedupeKey = buildDedupeKey(result.data);
    if (existingKeys.has(dedupeKey) || importedKeys.has(dedupeKey)) {
      duplicates.push(result.data.title);
      issues.push({
        row: index + 2,
        message: `Duplicidade detectada para "${result.data.title}".`,
        severity: "warning"
      });
      return;
    }

    importedKeys.add(dedupeKey);
    incidents.push(incidentFromCsvRow(result.data, params.monitoredEntityId));
  });

  const errorRows = new Set(issues.filter((issue) => issue.severity === "error").map((issue) => issue.row)).size;
  const report: ImportReport = {
    id: createId("import"),
    fileName: params.fileName,
    sourceFormat: params.sourceFormat,
    startedAt: isoNow(),
    finishedAt: isoNow(),
    totalRows: rows.length,
    validRows: incidents.length,
    duplicateRows: duplicates.length,
    errorRows,
    importedRows: incidents.length,
    issues
  };

  return {
    report,
    incidents,
    duplicates,
    sanitizedRows: rows
  };
}

export function incidentFromCsvRow(row: AtlasCsvRow, monitoredEntityId: string): Incident {
  const parsedScore = Number(row.risk_score);
  const riskFactors = Number.isFinite(parsedScore)
    ? defaultRiskFactors(Math.max(0, Math.min(100, parsedScore)))
    : defaultRiskFactors(24);
  const riskScore = calculateRiskScore(riskFactors);
  const emptyFlags = emptyPhysicalThreatFlags();
  const physicalThreatFactors = {
    declaredIntent: Number(row.threat_level ?? 0) >= 4 ? 70 : 0,
    targetSpecificity: row.location_exposure ? 55 : 0,
    apparentCapability: 0,
    proximityAccess: row.location_exposure ? 40 : 0,
    recurrenceEscalation: 0,
    dataLocationExposure: row.location_exposure ? 70 : 0
  };
  const physicalThreatScore = calculatePhysicalThreatScore(physicalThreatFactors);
  const collectedAt = row.collected_at || isoNow();
  const locationExposure = row.location_exposure ?? "";

  return {
    id: row.id || createId("inc"),
    monitoredEntityId,
    collectedAt,
    publishedAt: row.published_at || collectedAt,
    title: row.title,
    summary: row.summary ?? "",
    content: row.content ?? "",
    url: row.url ?? "",
    domain: row.domain || toDomain(row.url ?? ""),
    platform: row.platform || "Não disponível",
    authorName: row.author_name ?? "",
    authorHandle: row.author_handle ?? "",
    authorUrl: row.author_url ?? "",
    actorType: safeActorType(row.actor_type),
    category: safeCategory(row.category),
    subcategory: row.subcategory ?? "",
    verificationStatus: safeVerification(row.verification_status),
    sentiment: safeSentiment(row.sentiment),
    provenanceType: row.provenance_type,
    confidenceLevel: row.confidence_level,
    riskScore,
    riskLevel: classifyRisk(riskScore),
    riskFactors,
    threatLevel: classifyThreatLevel(physicalThreatScore),
    physicalThreatScore,
    physicalThreatFactors,
    physicalThreatFlags: {
      ...emptyFlags,
      knowsAgenda: row.category === "Exposição de agenda" || locationExposure.length > 0,
      exposesRoute: locationExposure.toLowerCase().includes("rota")
    },
    reachValue: row.reach_value ? Number(row.reach_value) : undefined,
    reachType: row.reach_type,
    engagementValue: row.engagement_value ? Number(row.engagement_value) : undefined,
    velocityScore: row.velocity_score ? Number(row.velocity_score) : 0,
    coordinationLevel: safeCoordination(row.coordination_level),
    target: row.target ?? "",
    locationExposure: locationExposure || "Não disponível",
    status: safeStatus(row.status),
    ownerTeam: safeOwnerTeam(row.owner_team),
    assignedTo: "",
    recommendedAction: row.recommended_action ?? "",
    analystNotes: row.analyst_notes ?? "",
    nextAction: "",
    relatedActorIds: [],
    relatedNarrativeIds: [],
    relatedIncidentIds: [],
    indicators: splitList(row.indicators),
    keywords: splitList(row.keywords),
    createdAt: isoNow(),
    updatedAt: isoNow(),
    deletedAt: null
  };
}

function safeCategory(value: string | undefined): Incident["category"] {
  const allowed: Incident["category"][] = [
    "Desinformação",
    "Conteúdo enganoso",
    "Conteúdo fora de contexto",
    "Conteúdo manipulado",
    "Deepfake",
    "Narrativa negativa",
    "Crise reputacional",
    "Perfil falso",
    "Impersonação",
    "Fraude",
    "Golpe financeiro",
    "Phishing",
    "Domínio fraudulento",
    "Malware",
    "Vazamento de credencial",
    "Exposição de dados",
    "Exposição de agenda",
    "Exposição de localização",
    "Assédio",
    "Ameaça física",
    "Incitação à violência",
    "Movimento coordenado",
    "Ataque contra conta",
    "Ataque contra site",
    "Incidente cibernético",
    "Outro"
  ];
  return allowed.includes(value as Incident["category"]) ? (value as Incident["category"]) : "Outro";
}

function safeActorType(value: string | undefined): Incident["actorType"] {
  const allowed: Incident["actorType"][] = [
    "Crítico legítimo",
    "Veículo jornalístico",
    "Influenciador",
    "Amplificador negativo",
    "Página de baixa credibilidade",
    "Perfil anônimo hostil",
    "Perfil de assédio",
    "Perfil fraudulento",
    "Perfil de impersonação",
    "Amplificador coordenado",
    "Ator de ameaça",
    "Origem indeterminada"
  ];
  return allowed.includes(value as Incident["actorType"]) ? (value as Incident["actorType"]) : "Origem indeterminada";
}

function safeVerification(value: string | undefined): Incident["verificationStatus"] {
  const allowed: Incident["verificationStatus"][] = [
    "Não analisado",
    "Não verificado",
    "Fato confirmado",
    "Falso confirmado",
    "Enganoso",
    "Fora de contexto",
    "Manipulado",
    "Sátira ou paródia",
    "Opinião ou crítica",
    "Alegação",
    "Investigação em andamento",
    "Falso positivo"
  ];
  return allowed.includes(value as Incident["verificationStatus"])
    ? (value as Incident["verificationStatus"])
    : "Não analisado";
}

function safeSentiment(value: string | undefined): Incident["sentiment"] {
  const normalized = value?.toLowerCase();
  if (normalized === "positive" || normalized === "positivo") return "positivo";
  if (normalized === "negative" || normalized === "negativo") return "negativo";
  if (normalized === "neutral" || normalized === "neutro") return "neutro";
  if (normalized === "misto") return "misto";
  return "não disponível";
}

function safeCoordination(value: string | undefined): Incident["coordinationLevel"] {
  const allowed: Incident["coordinationLevel"][] = [
    "Não identificado",
    "Sinal fraco",
    "Sinal moderado",
    "Forte indício",
    "Coordenação comprovada"
  ];
  return allowed.includes(value as Incident["coordinationLevel"])
    ? (value as Incident["coordinationLevel"])
    : "Não identificado";
}

function safeStatus(value: string | undefined): Incident["status"] {
  const allowed: Incident["status"][] = [
    "Novo",
    "Em triagem",
    "Validado",
    "Escalonado",
    "Em tratamento",
    "Monitorando",
    "Resolvido",
    "Falso positivo",
    "Arquivado"
  ];
  return allowed.includes(value as Incident["status"]) ? (value as Incident["status"]) : "Novo";
}

function safeOwnerTeam(value: string | undefined): Incident["ownerTeam"] {
  const allowed: Incident["ownerTeam"][] = [
    "Atlas OSINT",
    "Marketing",
    "Comunicação",
    "Elytron CTI",
    "Elytron SOC",
    "Jurídico",
    "Segurança física",
    "Gestão executiva"
  ];
  return allowed.includes(value as Incident["ownerTeam"]) ? (value as Incident["ownerTeam"]) : "Atlas OSINT";
}

export function exportIncidentsCsv(state: Pick<AtlasState, "incidents" | "monitoredEntities">): string {
  const rows = state.incidents.map((incident) => ({
    id: incident.id,
    monitored_entity:
      state.monitoredEntities.find((entity) => entity.id === incident.monitoredEntityId)?.name ?? "",
    collected_at: incident.collectedAt,
    published_at: incident.publishedAt,
    title: incident.title,
    summary: incident.summary,
    content: incident.content,
    url: incident.url,
    domain: incident.domain,
    platform: incident.platform,
    author_name: incident.authorName,
    author_handle: incident.authorHandle,
    author_url: incident.authorUrl,
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
    reach_value: incident.reachValue ?? "",
    reach_type: incident.reachType,
    engagement_value: incident.engagementValue ?? "",
    velocity_score: incident.velocityScore,
    coordination_level: incident.coordinationLevel,
    target: incident.target,
    location_exposure: incident.locationExposure,
    evidence_type: "",
    evidence_url: "",
    screenshot_url: "",
    indicators: incident.indicators.join(";"),
    keywords: incident.keywords.join(";"),
    status: incident.status,
    owner_team: incident.ownerTeam,
    recommended_action: incident.recommendedAction,
    analyst_notes: incident.analystNotes
  }));

  return Papa.unparse(rows, {
    columns: [...atlasCsvColumns]
  });
}
