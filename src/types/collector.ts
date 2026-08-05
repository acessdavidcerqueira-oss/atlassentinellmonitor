import type { ConfidenceLevel, ProvenanceType } from "@/types/domain";

export interface CollectionParams {
  monitoredEntity: string;
  queries: string[];
  from: string;
  to: string;
}

export interface RawCollectedItem {
  id?: string;
  collectedAt: string;
  publishedAt: string;
  title: string;
  summary?: string;
  content?: string;
  url?: string;
  domain?: string;
  platform?: string;
  authorName?: string;
  authorHandle?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface CollectorConnector {
  name: string;
  isConfigured(): boolean;
  collect(params: CollectionParams): Promise<RawCollectedItem[]>;
}

export interface NormalizedCollectedItem {
  monitored_entity: string;
  collected_at: string;
  published_at: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  domain: string;
  platform: string;
  author_name: string;
  author_handle: string;
  author_url: string;
  actor_type: string;
  category: string;
  subcategory: string;
  verification_status: string;
  sentiment: string;
  provenance_type: ProvenanceType;
  confidence_level: ConfidenceLevel;
  risk_score: string;
  risk_level: string;
  threat_level: string;
  reach_value: string;
  reach_type: "native" | "estimated" | "unavailable";
  engagement_value: string;
  velocity_score: string;
  coordination_level: string;
  target: string;
  location_exposure: string;
  evidence_type: string;
  evidence_url: string;
  screenshot_url: string;
  indicators: string;
  keywords: string;
  status: string;
  owner_team: string;
  recommended_action: string;
  analyst_notes: string;
}
