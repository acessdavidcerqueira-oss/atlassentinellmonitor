import { z } from "zod";
import {
  actorTypes,
  evidenceTypes,
  incidentCategories,
  incidentStatuses,
  ownerTeams,
  provenanceTypes,
  verificationStatuses
} from "@/types/domain";

export const riskFactorsSchema = z.object({
  reach: z.coerce.number().min(0).max(100),
  velocity: z.coerce.number().min(0).max(100),
  sourceInfluence: z.coerce.number().min(0).max(100),
  damagePotential: z.coerce.number().min(0).max(100),
  persistence: z.coerce.number().min(0).max(100),
  coordination: z.coerce.number().min(0).max(100),
  pressProximity: z.coerce.number().min(0).max(100)
});

export const physicalThreatFactorsSchema = z.object({
  declaredIntent: z.coerce.number().min(0).max(100),
  targetSpecificity: z.coerce.number().min(0).max(100),
  apparentCapability: z.coerce.number().min(0).max(100),
  proximityAccess: z.coerce.number().min(0).max(100),
  recurrenceEscalation: z.coerce.number().min(0).max(100),
  dataLocationExposure: z.coerce.number().min(0).max(100)
});

export const physicalThreatFlagsSchema = z.object({
  mentionsWeapon: z.boolean(),
  mentionsMethod: z.boolean(),
  mentionsPlace: z.boolean(),
  mentionsTime: z.boolean(),
  knowsAgenda: z.boolean(),
  exposesAddress: z.boolean(),
  exposesVehicle: z.boolean(),
  exposesRoute: z.boolean(),
  exposesHotel: z.boolean(),
  mentionsFamily: z.boolean(),
  encouragesThirdParties: z.boolean(),
  showsPreparation: z.boolean(),
  showsCapability: z.boolean(),
  recurrent: z.boolean(),
  possiblePhysicalProximity: z.boolean()
});

export const incidentFormSchema = z.object({
  title: z.string().min(4, "Informe um título operacional."),
  summary: z.string().min(4, "Informe um resumo."),
  content: z.string().default(""),
  url: z.string().url("URL inválida.").or(z.literal("")),
  platform: z.string().min(1, "Informe a plataforma."),
  authorName: z.string().default(""),
  authorHandle: z.string().default(""),
  authorUrl: z.string().url().or(z.literal("")).default(""),
  actorType: z.enum(actorTypes),
  category: z.enum(incidentCategories),
  subcategory: z.string().default(""),
  verificationStatus: z.enum(verificationStatuses),
  sentiment: z.enum(["positivo", "neutro", "negativo", "misto", "não disponível"]),
  provenanceType: z.enum(provenanceTypes),
  confidenceLevel: z.enum(["high", "medium", "low"]),
  riskFactors: riskFactorsSchema,
  physicalThreatFactors: physicalThreatFactorsSchema,
  physicalThreatFlags: physicalThreatFlagsSchema,
  reachValue: z.coerce.number().optional(),
  reachType: z.enum(["native", "estimated", "unavailable"]),
  engagementValue: z.coerce.number().optional(),
  velocityScore: z.coerce.number().min(0).max(100),
  coordinationLevel: z.enum([
    "Não identificado",
    "Sinal fraco",
    "Sinal moderado",
    "Forte indício",
    "Coordenação comprovada"
  ]),
  target: z.string().default(""),
  locationExposure: z.string().default(""),
  status: z.enum(incidentStatuses),
  ownerTeam: z.enum(ownerTeams),
  assignedTo: z.string().default(""),
  recommendedAction: z.string().default(""),
  analystNotes: z.string().default(""),
  nextAction: z.string().default(""),
  dueAt: z.string().optional(),
  keywords: z.string().default("")
});

export const evidenceFormSchema = z.object({
  type: z.enum(evidenceTypes),
  description: z.string().min(3),
  url: z.string().url().or(z.literal("")).optional(),
  fileName: z.string().optional(),
  source: z.string().min(2),
  observation: z.string().default(""),
  confidenceLevel: z.enum(["high", "medium", "low"]),
  provenanceType: z.enum(provenanceTypes)
});

export const riskOverrideSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  justification: z.string().min(10, "Justificativa obrigatória para override humano.")
});

export type IncidentFormInput = z.infer<typeof incidentFormSchema>;
export type EvidenceFormInput = z.infer<typeof evidenceFormSchema>;
