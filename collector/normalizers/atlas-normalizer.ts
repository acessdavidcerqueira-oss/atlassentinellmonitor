import type { NormalizedCollectedItem, RawCollectedItem } from "../../src/types/collector";

export function normalizeCollectedItem(item: RawCollectedItem, monitoredEntity: string): NormalizedCollectedItem {
  return {
    monitored_entity: monitoredEntity,
    collected_at: item.collectedAt,
    published_at: item.publishedAt,
    title: item.title,
    summary: item.summary ?? "",
    content: item.content ?? item.summary ?? "",
    url: item.url ?? "",
    domain: item.domain ?? safeDomain(item.url ?? ""),
    platform: item.platform ?? item.source ?? "Não disponível",
    author_name: item.authorName ?? "",
    author_handle: item.authorHandle ?? "",
    author_url: "",
    actor_type: "Origem indeterminada",
    category: "Outro",
    subcategory: "",
    verification_status: "Não analisado",
    sentiment: "não disponível",
    provenance_type: item.metadata?.provenanceType === "SIMULACAO_UI" ? "SIMULACAO_UI" : "FATO_COLETADO",
    confidence_level: item.metadata?.provenanceType === "SIMULACAO_UI" ? "medium" : "low",
    risk_score: "",
    risk_level: "",
    threat_level: "",
    reach_value: "",
    reach_type: "unavailable",
    engagement_value: "",
    velocity_score: "",
    coordination_level: "Não identificado",
    target: monitoredEntity,
    location_exposure: "",
    evidence_type: "URL",
    evidence_url: item.url ?? "",
    screenshot_url: "",
    indicators: "",
    keywords: "",
    status: "Novo",
    owner_team: "Atlas OSINT",
    recommended_action: "Triar e classificar manualmente.",
    analyst_notes: `Normalizado via ${item.source ?? "connector"}.`
  };
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
