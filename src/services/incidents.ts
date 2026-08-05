import type { Incident } from "@/types/domain";
import type { IncidentFormInput } from "@/schemas/incident";
import {
  calculatePhysicalThreatScore,
  calculateRiskScore,
  classifyRisk,
  classifyThreatLevel
} from "@/services/risk";
import { createId } from "@/utils/id";
import { isoNow } from "@/utils/date";
import { splitList, toDomain } from "@/utils/text";

export function incidentFromForm(input: IncidentFormInput, monitoredEntityId: string): Incident {
  const riskScore = calculateRiskScore(input.riskFactors);
  const physicalThreatScore = calculatePhysicalThreatScore(input.physicalThreatFactors);
  const now = isoNow();

  return {
    id: createId("inc"),
    monitoredEntityId,
    collectedAt: now,
    publishedAt: now,
    title: input.title,
    summary: input.summary,
    content: input.content,
    url: input.url,
    domain: toDomain(input.url),
    platform: input.platform,
    authorName: input.authorName,
    authorHandle: input.authorHandle,
    authorUrl: input.authorUrl,
    actorType: input.actorType,
    category: input.category,
    subcategory: input.subcategory,
    verificationStatus: input.verificationStatus,
    sentiment: input.sentiment,
    provenanceType: input.provenanceType,
    confidenceLevel: input.confidenceLevel,
    riskScore,
    riskLevel: classifyRisk(riskScore),
    riskFactors: input.riskFactors,
    threatLevel: classifyThreatLevel(physicalThreatScore),
    physicalThreatScore,
    physicalThreatFactors: input.physicalThreatFactors,
    physicalThreatFlags: input.physicalThreatFlags,
    reachValue: input.reachValue,
    reachType: input.reachType,
    engagementValue: input.engagementValue,
    velocityScore: input.velocityScore,
    coordinationLevel: input.coordinationLevel,
    target: input.target,
    locationExposure: input.locationExposure || "Não disponível",
    status: input.status,
    ownerTeam: input.ownerTeam,
    assignedTo: input.assignedTo,
    recommendedAction: input.recommendedAction,
    analystNotes: input.analystNotes,
    nextAction: input.nextAction,
    dueAt: input.dueAt,
    relatedActorIds: [],
    relatedNarrativeIds: [],
    relatedIncidentIds: [],
    indicators: [],
    keywords: splitList(input.keywords),
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  };
}
