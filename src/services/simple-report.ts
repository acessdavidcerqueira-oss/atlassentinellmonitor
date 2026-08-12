import type {
  ActorType,
  CoordinationLevel,
  EvidenceType,
  Incident,
  IncidentCategory,
  OwnerTeam,
  PhysicalThreatFactors,
  PhysicalThreatFlags,
  RiskFactors
} from "@/types/domain";
import {
  calculatePhysicalThreatScore,
  calculateRiskScore,
  classifyRisk,
  classifyThreatLevel,
  emptyPhysicalThreatFlags
} from "@/services/risk";
import { createId } from "@/utils/id";
import { isoNow } from "@/utils/date";
import { toDomain } from "@/utils/text";

export type FakeNewsStatus = "Sim" | "Suspeita" | "Não" | "Não sei";
export type ReportRiskClassification = "Leve" | "Médio" | "Moderado" | "Alto";
export type NarrativeRiskClassification = ReportRiskClassification;
export type ReportThreatClassification =
  | "Phishing"
  | "Fake news"
  | "Hating"
  | "Ataque coordenado"
  | "Invasão"
  | "Fraude/impersonação"
  | "Vazamento de dados"
  | "Malware"
  | "Outro";
export type FraudCaseType = "Perfil fake" | "Perfil se passando por pessoa";
export type FraudSocialNetwork = (typeof fraudSocialNetworkOptions)[number];
export type ActorProfileType = "Influenciador" | "Pessoa exposta";
export type ActorSocialNetwork = (typeof actorSocialNetworkOptions)[number];
export type SimpleEvidenceKind = "Arquivo" | "Foto ou imagem" | "Documento" | "Link de vídeo";
export type ThreatCaseType =
  | "Ameaça - Risco de vida"
  | "Xingamento"
  | "Ameaça moral"
  | "Opinião ríspida"
  | "Ataque coordenado";
export type ReportTheme =
  | "geral"
  | "desinformacao"
  | "fraudes"
  | "cti"
  | "ameacas"
  | "atores"
  | "coordenacao"
  | "narrativas"
  | "evidencias";

export const reportThemeDefinitions: Record<
  ReportTheme,
  {
    label: string;
    shortLabel: string;
    description: string;
    defaultFakeNews: FakeNewsStatus;
    category: IncidentCategory;
    ownerTeam: OwnerTeam;
  }
> = {
  geral: {
    label: "Report geral",
    shortLabel: "Geral",
    description: "Use para registrar qualquer página, perfil ou conteúdo.",
    defaultFakeNews: "Suspeita",
    category: "Outro",
    ownerTeam: "Atlas OSINT"
  },
  desinformacao: {
    label: "Report de desinformação",
    shortLabel: "Desinformação",
    description: "Use para fake news, alegações suspeitas ou conteúdo enganoso.",
    defaultFakeNews: "Suspeita",
    category: "Conteúdo enganoso",
    ownerTeam: "Atlas OSINT"
  },
  fraudes: {
    label: "Report de fraude ou impersonação",
    shortLabel: "Fraudes",
    description: "Use para perfis falsos, golpes, links suspeitos e impersonação.",
    defaultFakeNews: "Não sei",
    category: "Fraude",
    ownerTeam: "Jurídico"
  },
  cti: {
    label: "Report cyber",
    shortLabel: "Cyber",
    description: "Use para phishing, domínios suspeitos, links maliciosos e IOCs.",
    defaultFakeNews: "Não sei",
    category: "Phishing",
    ownerTeam: "Elytron CTI"
  },
  ameacas: {
    label: "Report de ameaça",
    shortLabel: "Ameaças",
    description: "Use para assédio, ameaça física ou exposição de agenda/localização.",
    defaultFakeNews: "Não sei",
    category: "Ameaça física",
    ownerTeam: "Segurança física"
  },
  atores: {
    label: "Report de ator ou página",
    shortLabel: "Atores",
    description: "Use para registrar uma página, perfil, autor ou amplificador.",
    defaultFakeNews: "Não sei",
    category: "Outro",
    ownerTeam: "Atlas OSINT"
  },
  coordenacao: {
    label: "Report de coordenação",
    shortLabel: "Coordenação",
    description: "Use para registrar possível publicação repetida, amplificação ou movimento coordenado.",
    defaultFakeNews: "Suspeita",
    category: "Movimento coordenado",
    ownerTeam: "Atlas OSINT"
  },
  narrativas: {
    label: "Report de narrativa",
    shortLabel: "Narrativas",
    description: "Use para registrar uma narrativa recorrente ou em crescimento.",
    defaultFakeNews: "Suspeita",
    category: "Narrativa negativa",
    ownerTeam: "Comunicação"
  },
  evidencias: {
    label: "Report com evidência",
    shortLabel: "Evidência",
    description: "Use quando você já tem link, print ou observação de apoio.",
    defaultFakeNews: "Suspeita",
    category: "Outro",
    ownerTeam: "Atlas OSINT"
  }
};

export const reportRiskOptions: Array<{
  label: ReportRiskClassification;
  description: string;
  score: number;
}> = [
  {
    label: "Leve",
    description: "Baixo alcance ou impacto limitado.",
    score: 30
  },
  {
    label: "Médio",
    description: "Pode crescer, mas ainda sem pressão forte.",
    score: 46
  },
  {
    label: "Moderado",
    description: "Já exige acompanhamento próximo.",
    score: 62
  },
  {
    label: "Alto",
    description: "Sensível, recorrente ou com alto impacto.",
    score: 78
  }
];

export const narrativeRiskOptions = reportRiskOptions;

export const reportThreatClassificationOptions: Array<{
  label: ReportThreatClassification;
  description: string;
  category: IncidentCategory;
}> = [
  {
    label: "Phishing",
    description: "Link, página ou abordagem para roubo de credenciais.",
    category: "Phishing"
  },
  {
    label: "Fake news",
    description: "Conteúdo falso, enganoso ou fora de contexto.",
    category: "Desinformação"
  },
  {
    label: "Hating",
    description: "Hostilidade, assédio, ofensa ou ataque verbal.",
    category: "Assédio"
  },
  {
    label: "Ataque coordenado",
    description: "Ação repetida por várias contas, páginas ou grupos.",
    category: "Movimento coordenado"
  },
  {
    label: "Invasão",
    description: "Acesso indevido, tomada de conta ou tentativa de intrusão.",
    category: "Ataque contra conta"
  },
  {
    label: "Fraude/impersonação",
    description: "Golpe, perfil falso ou uso indevido de identidade.",
    category: "Fraude"
  },
  {
    label: "Vazamento de dados",
    description: "Exposição de credenciais, documentos ou dados sensíveis.",
    category: "Exposição de dados"
  },
  {
    label: "Malware",
    description: "Arquivo, domínio ou link com suspeita técnica maliciosa.",
    category: "Malware"
  },
  {
    label: "Outro",
    description: "Ainda precisa de triagem para definir a classe.",
    category: "Outro"
  }
];

export const fraudSocialNetworkOptions = [
  "Não informado",
  "Instagram",
  "Facebook",
  "X/Twitter",
  "TikTok",
  "YouTube",
  "WhatsApp",
  "Telegram",
  "LinkedIn",
  "Site ou blog",
  "Outra rede"
] as const;

export const fraudCaseTypeOptions: Array<{
  label: FraudCaseType;
  description: string;
  category: IncidentCategory;
  actorType: ActorType;
}> = [
  {
    label: "Perfil fake",
    description: "Perfil criado sem identidade real ou com sinais falsos.",
    category: "Perfil falso",
    actorType: "Perfil fraudulento"
  },
  {
    label: "Perfil se passando por pessoa",
    description: "Usa nome, foto ou dados de outra pessoa.",
    category: "Impersonação",
    actorType: "Perfil de impersonação"
  }
];

export const actorSocialNetworkOptions = [
  "Não informado",
  "Instagram",
  "Facebook",
  "X/Twitter",
  "TikTok",
  "YouTube",
  "WhatsApp",
  "Telegram",
  "LinkedIn",
  "Site ou blog",
  "Outra rede"
] as const;

export const actorProfileTypeOptions: Array<{
  label: ActorProfileType;
  description: string;
  actorType: ActorType;
}> = [
  {
    label: "Influenciador",
    description: "Perfil com audiência própria e poder de amplificação.",
    actorType: "Influenciador"
  },
  {
    label: "Pessoa exposta",
    description: "Figura pública, porta-voz, familiar ou pessoa com exposição relevante.",
    actorType: "Pessoa exposta"
  }
];

export const simpleEvidenceKindOptions: Array<{
  label: SimpleEvidenceKind;
  description: string;
  evidenceType: EvidenceType;
}> = [
  {
    label: "Arquivo",
    description: "Qualquer arquivo de apoio ao report.",
    evidenceType: "Arquivo"
  },
  {
    label: "Foto ou imagem",
    description: "Print, foto, imagem ou captura visual.",
    evidenceType: "Screenshot"
  },
  {
    label: "Documento",
    description: "PDF, DOC, planilha ou outro documento.",
    evidenceType: "Documento"
  },
  {
    label: "Link de vídeo",
    description: "URL de vídeo em rede social ou plataforma externa.",
    evidenceType: "Vídeo"
  }
];

export const threatCaseTypeOptions: Array<{
  label: ThreatCaseType;
  description: string;
  category: IncidentCategory;
  actorType: ActorType;
  risk: ReportRiskClassification;
  coordinationLevel: CoordinationLevel;
  physicalThreatFactors: PhysicalThreatFactors;
  flagOverrides?: Partial<PhysicalThreatFlags>;
}> = [
  {
    label: "Ameaça - Risco de vida",
    description: "Indica morte, dano físico, arma, método ou local.",
    category: "Ameaça física",
    actorType: "Ator de ameaça",
    risk: "Alto",
    coordinationLevel: "Não identificado",
    physicalThreatFactors: {
      declaredIntent: 95,
      targetSpecificity: 88,
      apparentCapability: 86,
      proximityAccess: 78,
      recurrenceEscalation: 70,
      dataLocationExposure: 68
    },
    flagOverrides: {
      mentionsMethod: true,
      possiblePhysicalProximity: true,
      showsCapability: true
    }
  },
  {
    label: "Xingamento",
    description: "Ofensa direta, sem ameaça concreta identificada.",
    category: "Assédio",
    actorType: "Perfil de assédio",
    risk: "Leve",
    coordinationLevel: "Não identificado",
    physicalThreatFactors: {
      declaredIntent: 12,
      targetSpecificity: 8,
      apparentCapability: 4,
      proximityAccess: 3,
      recurrenceEscalation: 18,
      dataLocationExposure: 2
    }
  },
  {
    label: "Ameaça moral",
    description: "Constrangimento, intimidação ou pressão reputacional.",
    category: "Assédio",
    actorType: "Perfil de assédio",
    risk: "Médio",
    coordinationLevel: "Não identificado",
    physicalThreatFactors: {
      declaredIntent: 45,
      targetSpecificity: 38,
      apparentCapability: 15,
      proximityAccess: 8,
      recurrenceEscalation: 34,
      dataLocationExposure: 8
    }
  },
  {
    label: "Opinião ríspida",
    description: "Crítica dura ou agressiva, sem ameaça direta.",
    category: "Narrativa negativa",
    actorType: "Crítico legítimo",
    risk: "Leve",
    coordinationLevel: "Não identificado",
    physicalThreatFactors: {
      declaredIntent: 4,
      targetSpecificity: 4,
      apparentCapability: 0,
      proximityAccess: 0,
      recurrenceEscalation: 8,
      dataLocationExposure: 0
    }
  },
  {
    label: "Ataque coordenado",
    description: "Vários perfis, repetição ou amplificação organizada.",
    category: "Movimento coordenado",
    actorType: "Amplificador coordenado",
    risk: "Alto",
    coordinationLevel: "Forte indício",
    physicalThreatFactors: {
      declaredIntent: 30,
      targetSpecificity: 32,
      apparentCapability: 18,
      proximityAccess: 10,
      recurrenceEscalation: 74,
      dataLocationExposure: 8
    },
    flagOverrides: {
      encouragesThirdParties: true,
      recurrent: true
    }
  }
];

const reportRiskScoreFloors: Record<ReportRiskClassification, number> = {
  Leve: 24,
  Médio: 42,
  Moderado: 56,
  Alto: 72
};

export interface SimpleReportInput {
  theme?: ReportTheme;
  page: string;
  fakeNews: FakeNewsStatus;
  whatTheySaid: string;
  observation: string;
  estimatedReach?: number;
  threatClassification?: ReportThreatClassification;
  riskClassification?: ReportRiskClassification;
  narrativeRisk?: ReportRiskClassification;
  fraudSocialNetwork?: FraudSocialNetwork;
  fraudCaseType?: FraudCaseType;
  actorSocialNetwork?: ActorSocialNetwork;
  actorProfileType?: ActorProfileType;
  actorFollowers?: number;
  evidenceKind?: SimpleEvidenceKind;
  evidenceFileName?: string;
  evidenceFileType?: string;
  evidenceFileSize?: number;
  evidenceImagePreviewUrl?: string;
  evidenceVideoUrl?: string;
  threatCaseType?: ThreatCaseType;
}

export function incidentFromSimpleReport(input: SimpleReportInput, monitoredEntityId: string): Incident {
  const theme = resolveReportTheme(input.theme);
  const themeConfig = reportThemeDefinitions[theme];
  const reportRisk = themeUsesRiskClassification(theme)
    ? resolveReportRisk(input.riskClassification ?? input.narrativeRisk)
    : undefined;
  const threatClassification = resolveReportThreatClassification(
    input.threatClassification ?? defaultThreatClassificationForTheme(theme)
  );
  const fraudCaseType = theme === "fraudes" ? resolveFraudCaseType(input.fraudCaseType) : undefined;
  const fraudSocialNetwork = theme === "fraudes" ? resolveFraudSocialNetwork(input.fraudSocialNetwork) : undefined;
  const actorProfileType = theme === "atores" ? resolveActorProfileType(input.actorProfileType) : undefined;
  const actorSocialNetwork = theme === "atores" ? resolveActorSocialNetwork(input.actorSocialNetwork) : undefined;
  const actorFollowers = theme === "atores" ? sanitizeOptionalNumber(input.actorFollowers) : undefined;
  const evidenceKind = theme === "evidencias" ? resolveSimpleEvidenceKind(input.evidenceKind) : undefined;
  const evidenceVideoUrl = theme === "evidencias" ? normalizeOptionalUrl(input.evidenceVideoUrl) : "";
  const threatCaseType = theme === "ameacas" ? resolveThreatCaseType(input.threatCaseType) : undefined;
  const threatCaseConfig = threatCaseTypeOptions.find((option) => option.label === threatCaseType);
  const effectiveRisk = reportRisk ?? threatCaseConfig?.risk;
  const now = isoNow();
  const url = normalizePossibleUrl(input.page);
  const domain = url ? toDomain(url) : "";
  const pageName = domain || input.page.trim();
  const effectiveReachValue = input.estimatedReach ?? actorFollowers;
  const reachFactor = estimateReachFactor(effectiveReachValue);
  const damageFactor =
    effectiveRisk
      ? reportRiskOptions.find((option) => option.label === effectiveRisk)?.score ?? 46
      : theme === "ameacas" || theme === "cti" || theme === "fraudes"
      ? 62
      : input.fakeNews === "Sim"
        ? 58
        : input.fakeNews === "Suspeita"
          ? 44
          : 24;
  const riskFactors: RiskFactors = effectiveRisk
    ? riskFactorsFromReportRisk(effectiveRisk, reachFactor)
    : {
        reach: reachFactor,
        velocity: 20,
        sourceInfluence: Math.min(55, Math.round(reachFactor * 0.7)),
        damagePotential: damageFactor,
        persistence: 25,
        coordination: 0,
        pressProximity: 10
      };
  const calculatedRiskScore = calculateRiskScore(riskFactors);
  const riskScore = effectiveRisk
    ? Math.max(calculatedRiskScore, reportRiskScoreFloors[effectiveRisk])
    : calculatedRiskScore;
  const defaultPhysicalThreatFactors = {
    declaredIntent: 0,
    targetSpecificity: 0,
    apparentCapability: 0,
    proximityAccess: 0,
    recurrenceEscalation: 0,
    dataLocationExposure: 0
  };
  const physicalThreatFactors = threatCaseConfig?.physicalThreatFactors ?? defaultPhysicalThreatFactors;
  const physicalThreatScore = theme === "ameacas" ? calculatePhysicalThreatScore(physicalThreatFactors) : 0;
  const physicalThreatFlags = {
    ...emptyPhysicalThreatFlags(),
    ...(threatCaseConfig?.flagOverrides ?? {})
  };

  return {
    id: createId("inc"),
    monitoredEntityId,
    collectedAt: now,
    publishedAt: now,
    title: `Report: ${pageName}`,
    summary: input.whatTheySaid.trim(),
    content: input.whatTheySaid.trim(),
    url,
    domain,
    platform: platformFromReport(input.page, fraudSocialNetwork ?? actorSocialNetwork),
    authorName: pageName,
    authorHandle: "",
    authorUrl: url,
    actorType: actorTypeFromReport(theme, fraudCaseType, threatCaseType, actorProfileType),
    category: categoryFromTheme(theme, input.fakeNews, threatClassification, fraudCaseType, threatCaseType),
    subcategory: subcategoryFromReport(themeConfig.shortLabel, {
      threatClassification,
      risk: effectiveRisk,
      fraudCaseType,
      socialNetwork: fraudSocialNetwork ?? actorSocialNetwork,
      threatCaseType,
      actorProfileType,
      evidenceKind
    }),
    verificationStatus: verificationFromFakeNews(input.fakeNews),
    sentiment: input.fakeNews === "Não" ? "misto" : "negativo",
    provenanceType: "FATO_COLETADO",
    confidenceLevel: input.fakeNews === "Não sei" ? "low" : "medium",
    riskScore,
    riskLevel: classifyRisk(riskScore),
    riskFactors,
    threatLevel: classifyThreatLevel(physicalThreatScore),
    physicalThreatScore,
    physicalThreatFactors,
    physicalThreatFlags,
    reachValue: effectiveReachValue,
    reachType: effectiveReachValue ? "estimated" : "unavailable",
    engagementValue: undefined,
    velocityScore: 20,
    coordinationLevel: threatClassification === "Ataque coordenado" ? "Forte indício" : "Não identificado",
    target: "Monitorado",
    locationExposure: "Não disponível",
    status: "Novo",
    ownerTeam: themeConfig.ownerTeam,
    assignedTo: "",
    recommendedAction: recommendationForTheme(theme),
    analystNotes: notesWithReportMetadata(input.observation.trim(), theme, {
      risk: effectiveRisk,
      threatClassification,
      fraudCaseType,
      fraudSocialNetwork,
      actorProfileType,
      actorSocialNetwork,
      actorFollowers,
      evidenceKind,
      evidenceFileName: input.evidenceFileName,
      evidenceFileType: input.evidenceFileType,
      evidenceFileSize: sanitizeOptionalNumber(input.evidenceFileSize),
      evidenceVideoUrl,
      threatCaseType
    }),
    nextAction: "Revisar",
    relatedActorIds: [],
    relatedNarrativeIds: [],
    relatedIncidentIds: [],
    indicators: [url, evidenceVideoUrl].filter(Boolean),
    keywords: [
      "report rápido",
      theme,
      fakeNewsKeyword(input.fakeNews),
      threatClassification.toLowerCase(),
      ...(effectiveRisk ? [`risco ${effectiveRisk.toLowerCase()}`] : []),
      ...(fraudCaseType ? [fraudCaseType.toLowerCase()] : []),
      ...(fraudSocialNetwork && fraudSocialNetwork !== "Não informado"
        ? [fraudSocialNetwork.toLowerCase()]
        : []),
      ...(actorProfileType ? [actorProfileType.toLowerCase()] : []),
      ...(actorSocialNetwork && actorSocialNetwork !== "Não informado"
        ? [actorSocialNetwork.toLowerCase()]
        : []),
      ...(actorFollowers ? [`${actorFollowers} seguidores`] : []),
      ...(evidenceKind ? [evidenceKind.toLowerCase()] : []),
      ...(input.evidenceFileName ? [input.evidenceFileName] : []),
      ...(evidenceVideoUrl ? ["link de vídeo"] : []),
      ...(threatCaseType ? [threatCaseType.toLowerCase()] : [])
    ],
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  };
}

export function resolveReportTheme(value: string | null | undefined): ReportTheme {
  const candidate = value as ReportTheme | undefined;
  return candidate && candidate in reportThemeDefinitions ? candidate : "geral";
}

export function resolveReportRisk(value: string | null | undefined): ReportRiskClassification {
  const normalized = value?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (normalized === "leve") return "Leve";
  if (normalized === "medio") return "Médio";
  if (normalized === "moderado") return "Moderado";
  if (normalized === "alto") return "Alto";

  return "Médio";
}

export function resolveReportThreatClassification(
  value: string | null | undefined
): ReportThreatClassification {
  const candidate = value as ReportThreatClassification | undefined;
  return candidate && reportThreatClassificationOptions.some((option) => option.label === candidate)
    ? candidate
    : "Outro";
}

export function resolveNarrativeRisk(value: string | null | undefined): NarrativeRiskClassification {
  return resolveReportRisk(value);
}

export function resolveFraudSocialNetwork(value: string | null | undefined): FraudSocialNetwork {
  const candidate = value as FraudSocialNetwork | undefined;
  return candidate && fraudSocialNetworkOptions.includes(candidate) ? candidate : "Não informado";
}

export function resolveFraudCaseType(value: string | null | undefined): FraudCaseType {
  const candidate = value as FraudCaseType | undefined;
  return candidate && fraudCaseTypeOptions.some((option) => option.label === candidate)
    ? candidate
    : "Perfil fake";
}

export function resolveActorSocialNetwork(value: string | null | undefined): ActorSocialNetwork {
  const candidate = value as ActorSocialNetwork | undefined;
  return candidate && actorSocialNetworkOptions.includes(candidate) ? candidate : "Não informado";
}

export function resolveActorProfileType(value: string | null | undefined): ActorProfileType {
  const candidate = value as ActorProfileType | undefined;
  return candidate && actorProfileTypeOptions.some((option) => option.label === candidate)
    ? candidate
    : "Influenciador";
}

export function resolveThreatCaseType(value: string | null | undefined): ThreatCaseType {
  const candidate = value as ThreatCaseType | undefined;
  return candidate && threatCaseTypeOptions.some((option) => option.label === candidate)
    ? candidate
    : "Ameaça moral";
}

export function resolveSimpleEvidenceKind(value: string | null | undefined): SimpleEvidenceKind {
  const candidate = value as SimpleEvidenceKind | undefined;
  return candidate && simpleEvidenceKindOptions.some((option) => option.label === candidate)
    ? candidate
    : "Arquivo";
}

export function fakeNewsLabel(incident: Incident): FakeNewsStatus {
  if (incident.verificationStatus === "Opinião ou crítica") return "Não";
  if (incident.verificationStatus === "Não verificado" || incident.verificationStatus === "Alegação") return "Suspeita";
  if (["Desinformação", "Conteúdo enganoso", "Conteúdo fora de contexto", "Conteúdo manipulado", "Deepfake"].includes(incident.category)) {
    return "Sim";
  }
  return "Não sei";
}

function categoryFromTheme(
  theme: ReportTheme,
  value: FakeNewsStatus,
  threatClassification: ReportThreatClassification,
  fraudCaseType?: FraudCaseType,
  threatCaseType?: ThreatCaseType
): Incident["category"] {
  if (theme === "fraudes" && fraudCaseType) {
    return fraudCaseTypeOptions.find((option) => option.label === fraudCaseType)?.category ?? "Fraude";
  }
  if (theme === "ameacas" && threatCaseType) {
    return threatCaseTypeOptions.find((option) => option.label === threatCaseType)?.category ?? "Ameaça física";
  }
  if (threatClassification !== "Outro") {
    return reportThreatClassificationOptions.find((option) => option.label === threatClassification)?.category ?? "Outro";
  }

  const configuredCategory = reportThemeDefinitions[theme].category;
  if (theme !== "geral" && theme !== "desinformacao") return configuredCategory;
  return categoryFromFakeNews(value);
}

function categoryFromFakeNews(value: FakeNewsStatus): Incident["category"] {
  if (value === "Sim") return "Desinformação";
  if (value === "Suspeita") return "Conteúdo enganoso";
  if (value === "Não") return "Narrativa negativa";
  return "Outro";
}

function recommendationForTheme(theme: ReportTheme): string {
  const recommendations: Record<ReportTheme, string> = {
    geral: "Revisar report e decidir se exige resposta, preservação ou monitoramento.",
    desinformacao: "Verificar fonte, contexto e evidência antes de classificar como falso.",
    fraudes: "Preservar link/print e avaliar remoção, bloqueio ou encaminhamento jurídico.",
    cti: "Preservar indicador técnico, validar domínio/link e avaliar contenção.",
    ameacas: "Avaliar risco à pessoa, não responder ao autor e acionar segurança se necessário.",
    atores: "Registrar recorrência da página/perfil e relacionar a novos reports.",
    coordenacao: "Comparar texto, horários, URLs e páginas antes de concluir coordenação.",
    narrativas: "Agrupar reports semelhantes e acompanhar crescimento da narrativa.",
    evidencias: "Preservar evidência e complementar o report com link, print ou observação."
  };

  return recommendations[theme];
}

function verificationFromFakeNews(value: FakeNewsStatus): Incident["verificationStatus"] {
  if (value === "Sim") return "Não verificado";
  if (value === "Suspeita") return "Alegação";
  if (value === "Não") return "Opinião ou crítica";
  return "Não analisado";
}

function fakeNewsKeyword(value: FakeNewsStatus): string {
  return value === "Sim" ? "fake news" : value === "Suspeita" ? "suspeita" : "observação";
}

function riskFactorsFromReportRisk(risk: ReportRiskClassification, reachFactor: number): RiskFactors {
  const option = reportRiskOptions.find((item) => item.label === risk);
  const score = option?.score ?? 46;

  return {
    reach: Math.max(reachFactor, Math.round(score * 0.8)),
    velocity: score,
    sourceInfluence: Math.round(score * 0.85),
    damagePotential: score,
    persistence: score,
    coordination: score,
    pressProximity: Math.max(10, Math.round(score * 0.55))
  };
}

function notesWithReportMetadata(
  notes: string,
  theme: ReportTheme,
  metadata: {
    risk?: ReportRiskClassification;
    fraudCaseType?: FraudCaseType;
    fraudSocialNetwork?: FraudSocialNetwork;
    actorProfileType?: ActorProfileType;
    actorSocialNetwork?: ActorSocialNetwork;
    actorFollowers?: number;
    evidenceKind?: SimpleEvidenceKind;
    evidenceFileName?: string;
    evidenceFileType?: string;
    evidenceFileSize?: number;
    evidenceVideoUrl?: string;
    threatCaseType?: ThreatCaseType;
    threatClassification: ReportThreatClassification;
  }
): string {
  const metadataNotes = [
    `Classificação de ameaça: ${metadata.threatClassification}.`,
    metadata.risk ? riskNoteForTheme(theme, metadata.risk) : "",
    metadata.fraudSocialNetwork && metadata.fraudSocialNetwork !== "Não informado"
      ? `Rede social: ${metadata.fraudSocialNetwork}.`
      : "",
    metadata.actorSocialNetwork && metadata.actorSocialNetwork !== "Não informado"
      ? `Rede social: ${metadata.actorSocialNetwork}.`
      : "",
    metadata.fraudCaseType ? `Tipo de caso: ${metadata.fraudCaseType}.` : "",
    metadata.actorProfileType ? `Classificação do ator: ${metadata.actorProfileType}.` : "",
    metadata.actorFollowers ? `Seguidores: ${formatNumberPtBr(metadata.actorFollowers)}.` : "",
    metadata.evidenceKind ? `Tipo de evidência: ${metadata.evidenceKind}.` : "",
    metadata.evidenceFileName
      ? `Arquivo: ${metadata.evidenceFileName}${metadata.evidenceFileType ? ` (${metadata.evidenceFileType})` : ""}${
          metadata.evidenceFileSize ? ` - ${formatFileSize(metadata.evidenceFileSize)}` : ""
        }.`
      : "",
    metadata.evidenceVideoUrl ? `Link de vídeo: ${metadata.evidenceVideoUrl}.` : "",
    metadata.threatCaseType ? `Tipo de ameaça: ${metadata.threatCaseType}.` : ""
  ].filter(Boolean);

  if (!metadataNotes.length) return notes;

  const metadataText = metadataNotes.join("\n");
  return notes ? `${metadataText}\n\n${notes}` : metadataText;
}

function riskNoteForTheme(theme: ReportTheme, risk: ReportRiskClassification): string {
  if (theme === "desinformacao") return `Classificação de risco do alerta: ${risk}.`;
  if (theme === "fraudes") return `Classificação de risco da fraude: ${risk}.`;
  if (theme === "ameacas") return `Classificação de risco da ameaça: ${risk}.`;
  return `Classificação de risco da narrativa: ${risk}.`;
}

function themeUsesRiskClassification(theme: ReportTheme): boolean {
  return theme === "narrativas" || theme === "desinformacao" || theme === "fraudes";
}

function actorTypeFromReport(
  theme: ReportTheme,
  fraudCaseType?: FraudCaseType,
  threatCaseType?: ThreatCaseType,
  actorProfileType?: ActorProfileType
): ActorType {
  if (theme === "fraudes" && fraudCaseType) {
    return fraudCaseTypeOptions.find((option) => option.label === fraudCaseType)?.actorType ?? "Perfil fraudulento";
  }
  if (theme === "ameacas" && threatCaseType) {
    return threatCaseTypeOptions.find((option) => option.label === threatCaseType)?.actorType ?? "Ator de ameaça";
  }
  if (theme === "atores" && actorProfileType) {
    return actorProfileTypeOptions.find((option) => option.label === actorProfileType)?.actorType ?? "Influenciador";
  }

  return "Origem indeterminada";
}

function subcategoryFromReport(
  shortLabel: string,
  metadata: {
    risk?: ReportRiskClassification;
    threatClassification: ReportThreatClassification;
    fraudCaseType?: FraudCaseType;
    socialNetwork?: FraudSocialNetwork | ActorSocialNetwork;
    threatCaseType?: ThreatCaseType;
    actorProfileType?: ActorProfileType;
    evidenceKind?: SimpleEvidenceKind;
  }
): string {
  return [
    shortLabel.toLowerCase(),
    metadata.threatClassification.toLowerCase(),
    metadata.risk ? `risco ${metadata.risk.toLowerCase()}` : "",
    metadata.fraudCaseType?.toLowerCase() ?? "",
    metadata.actorProfileType?.toLowerCase() ?? "",
    metadata.evidenceKind?.toLowerCase() ?? "",
    metadata.socialNetwork && metadata.socialNetwork !== "Não informado" ? metadata.socialNetwork.toLowerCase() : "",
    metadata.threatCaseType?.toLowerCase() ?? ""
  ]
    .filter(Boolean)
    .join(" - ");
}

export function defaultThreatClassificationForTheme(theme: ReportTheme): ReportThreatClassification {
  const defaults: Record<ReportTheme, ReportThreatClassification> = {
    geral: "Outro",
    desinformacao: "Fake news",
    fraudes: "Fraude/impersonação",
    cti: "Phishing",
    ameacas: "Hating",
    atores: "Outro",
    coordenacao: "Ataque coordenado",
    narrativas: "Fake news",
    evidencias: "Outro"
  };

  return defaults[theme];
}

function estimateReachFactor(reach?: number): number {
  if (!reach || reach <= 0) return 12;
  if (reach < 1_000) return 22;
  if (reach < 10_000) return 38;
  if (reach < 100_000) return 58;
  return 76;
}

function normalizePossibleUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed).toString();
  } catch {
    return "";
  }
}

function normalizeOptionalUrl(value?: string): string {
  if (!value?.trim()) return "";
  return normalizePossibleUrl(value) || value.trim();
}

function inferPlatform(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes("instagram")) return "Instagram";
  if (lower.includes("facebook")) return "Facebook";
  if (lower.includes("x.com") || lower.includes("twitter")) return "X";
  if (lower.includes("youtube")) return "YouTube";
  if (lower.includes("tiktok")) return "TikTok";
  if (normalizePossibleUrl(value)) return "Página web";
  return "Página";
}

function platformFromReport(page: string, socialNetwork?: FraudSocialNetwork | ActorSocialNetwork): string {
  if (socialNetwork && socialNetwork !== "Não informado") return socialNetwork;
  return inferPlatform(page);
}

function sanitizeOptionalNumber(value?: number): number | undefined {
  if (!value || Number.isNaN(value) || value <= 0) return undefined;
  return Math.round(value);
}

function formatNumberPtBr(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
