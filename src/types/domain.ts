export const incidentCategories = [
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
] as const;

export const verificationStatuses = [
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
] as const;

export const provenanceTypes = [
  "FATO_COLETADO",
  "DADO_OFICIAL",
  "METRICA_NATIVA",
  "ESTIMATIVA_ATLAS",
  "INFERENCIA_ANALITICA",
  "RECOMENDACAO_ESTRATEGICA",
  "SIMULACAO_UI",
  "NAO_DISPONIVEL"
] as const;

export const incidentStatuses = [
  "Novo",
  "Em triagem",
  "Validado",
  "Escalonado",
  "Em tratamento",
  "Monitorando",
  "Resolvido",
  "Falso positivo",
  "Arquivado"
] as const;

export const ownerTeams = [
  "Atlas OSINT",
  "Marketing",
  "Comunicação",
  "Elytron CTI",
  "Elytron SOC",
  "Jurídico",
  "Segurança física",
  "Gestão executiva"
] as const;

export const actorTypes = [
  "Crítico legítimo",
  "Veículo jornalístico",
  "Influenciador",
  "Pessoa exposta",
  "Amplificador negativo",
  "Página de baixa credibilidade",
  "Perfil anônimo hostil",
  "Perfil de assédio",
  "Perfil fraudulento",
  "Perfil de impersonação",
  "Amplificador coordenado",
  "Ator de ameaça",
  "Origem indeterminada"
] as const;

export const evidenceTypes = [
  "Screenshot",
  "URL",
  "Arquivo",
  "Vídeo",
  "Áudio",
  "Documento",
  "Registro oficial",
  "Métrica nativa",
  "Indicador técnico",
  "Nota do analista"
] as const;

export const indicatorTypes = [
  "Domínio",
  "Subdomínio",
  "URL",
  "IP",
  "E-mail",
  "Telefone",
  "Hash",
  "Nome de arquivo",
  "Conta",
  "Perfil",
  "Aplicativo",
  "Chave de criptomoeda",
  "Outro"
] as const;

export type IncidentCategory = (typeof incidentCategories)[number];
export type VerificationStatus = (typeof verificationStatuses)[number];
export type ProvenanceType = (typeof provenanceTypes)[number];
export type IncidentStatus = (typeof incidentStatuses)[number];
export type OwnerTeam = (typeof ownerTeams)[number];
export type ActorType = (typeof actorTypes)[number];
export type EvidenceType = (typeof evidenceTypes)[number];
export type IndicatorType = (typeof indicatorTypes)[number];

export type RiskLevel = "Informativo" | "Baixo" | "Moderado" | "Alto" | "Crítico";
export type ThreatLevel = 1 | 2 | 3 | 4 | 5;
export type ConfidenceLevel = "high" | "medium" | "low";
export type Sentiment = "positivo" | "neutro" | "negativo" | "misto" | "não disponível";
export type CoordinationLevel =
  | "Não identificado"
  | "Sinal fraco"
  | "Sinal moderado"
  | "Forte indício"
  | "Coordenação comprovada";

export interface MonitoredEntity {
  id: string;
  name: string;
  type: string;
  country: string;
  status: "ativo" | "pausado" | "arquivado";
}

export interface RiskFactors {
  reach: number;
  velocity: number;
  sourceInfluence: number;
  damagePotential: number;
  persistence: number;
  coordination: number;
  pressProximity: number;
}

export interface PhysicalThreatFactors {
  declaredIntent: number;
  targetSpecificity: number;
  apparentCapability: number;
  proximityAccess: number;
  recurrenceEscalation: number;
  dataLocationExposure: number;
}

export interface PhysicalThreatFlags {
  mentionsWeapon: boolean;
  mentionsMethod: boolean;
  mentionsPlace: boolean;
  mentionsTime: boolean;
  knowsAgenda: boolean;
  exposesAddress: boolean;
  exposesVehicle: boolean;
  exposesRoute: boolean;
  exposesHotel: boolean;
  mentionsFamily: boolean;
  encouragesThirdParties: boolean;
  showsPreparation: boolean;
  showsCapability: boolean;
  recurrent: boolean;
  possiblePhysicalProximity: boolean;
}

export interface Incident {
  id: string;
  monitoredEntityId: string;
  collectedAt: string;
  publishedAt: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  domain: string;
  platform: string;
  authorName: string;
  authorHandle: string;
  authorUrl: string;
  actorType: ActorType;
  category: IncidentCategory;
  subcategory: string;
  verificationStatus: VerificationStatus;
  sentiment: Sentiment;
  provenanceType: ProvenanceType;
  confidenceLevel: ConfidenceLevel;
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactors;
  riskOverride?: {
    previousScore: number;
    score: number;
    justification: string;
    changedBy: string;
    changedAt: string;
  };
  threatLevel: ThreatLevel;
  physicalThreatScore: number;
  physicalThreatFactors: PhysicalThreatFactors;
  physicalThreatFlags: PhysicalThreatFlags;
  reachValue?: number;
  reachType: "native" | "estimated" | "unavailable";
  engagementValue?: number;
  velocityScore: number;
  coordinationLevel: CoordinationLevel;
  target: string;
  locationExposure: string;
  status: IncidentStatus;
  ownerTeam: OwnerTeam;
  assignedTo: string;
  recommendedAction: string;
  analystNotes: string;
  nextAction: string;
  dueAt?: string;
  relatedActorIds: string[];
  relatedNarrativeIds: string[];
  relatedIncidentIds: string[];
  indicators: string[];
  keywords: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Evidence {
  id: string;
  incidentId: string;
  type: EvidenceType;
  description: string;
  url?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  imagePreviewUrl?: string;
  fileHash?: string;
  collectedBy: string;
  collectedAt: string;
  source: string;
  integrity: "original preservado" | "cópia verificada" | "metadados pendentes";
  observation: string;
  confidenceLevel: ConfidenceLevel;
  provenanceType: ProvenanceType;
}

export interface Actor {
  id: string;
  name: string;
  handle: string;
  url: string;
  platform: string;
  type: ActorType;
  description: string;
  publicLocation?: string;
  createdAtPublic?: string;
  followers?: number;
  followersProvenance: ProvenanceType;
  occurrenceCount: number;
  recurrence: "baixa" | "moderada" | "alta";
  riskScore: number;
  confidenceLevel: ConfidenceLevel;
  lastActivity: string;
  observations: string;
  evidenceIds: string[];
  incidentIds: string[];
  narrativeIds: string[];
}

export interface Narrative {
  id: string;
  name: string;
  description: string;
  centralMessage: string;
  polarity: "positiva" | "neutra" | "negativa" | "mista";
  volume: number;
  growth: number;
  velocity: number;
  platforms: string[];
  topSources: string[];
  topAmplifiers: string[];
  incidentIds: string[];
  probableOrigin: string;
  riskScore: number;
  confidenceLevel: ConfidenceLevel;
  reachedAudiences: string[];
  recommendation: string;
  status: "em observação" | "em crescimento" | "estável" | "mitigada";
  provenanceType: ProvenanceType;
}

export interface Indicator {
  id: string;
  value: string;
  type: IndicatorType;
  firstSeen: string;
  lastSeen: string;
  incidentIds: string[];
  source: string;
  confidenceLevel: ConfidenceLevel;
  severity: RiskLevel;
  status: "novo" | "em validação" | "ativo" | "contido" | "arquivado";
  observations: string;
  tags: string[];
  provenanceType: ProvenanceType;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: RiskLevel;
  incidentId?: string;
  createdAt: string;
  status: "novo" | "reconhecido" | "resolvido";
  ruleId: string;
  provenanceType: ProvenanceType;
}

export interface Task {
  id: string;
  title: string;
  ownerTeam: OwnerTeam;
  dueAt: string;
  status: "pendente" | "em andamento" | "concluída";
  incidentId?: string;
}

export type BlacklistStatus = "ativo" | "em validação" | "monitorando" | "removido" | "falso positivo";
export type BlacklistKind = "site" | "link";

export interface BlacklistEntry {
  id: string;
  value: string;
  normalizedValue: string;
  kind: BlacklistKind;
  status: BlacklistStatus;
  reason: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  entityType: "incident" | "evidence" | "actor" | "narrative" | "blacklist" | "import" | "auth" | "settings";
  entityId: string;
  action: string;
  userName: string;
  createdAt: string;
  previousValue?: string;
  newValue?: string;
  justification?: string;
}

export interface ImportRowIssue {
  row: number;
  field?: string;
  message: string;
  severity: "error" | "warning";
}

export interface ImportReport {
  id: string;
  fileName: string;
  sourceFormat: "atlas" | "brand24" | "generic";
  startedAt: string;
  finishedAt?: string;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  errorRows: number;
  importedRows: number;
  issues: ImportRowIssue[];
}

export interface AtlasState {
  monitoredEntities: MonitoredEntity[];
  activeMonitoredEntityId: string;
  incidents: Incident[];
  evidences: Evidence[];
  actors: Actor[];
  narratives: Narrative[];
  indicators: Indicator[];
  alerts: Alert[];
  tasks: Task[];
  blacklist: BlacklistEntry[];
  auditLogs: AuditLog[];
  imports: ImportReport[];
}
