import type {
  PhysicalThreatFactors,
  PhysicalThreatFlags,
  RiskFactors,
  RiskLevel,
  ThreatLevel
} from "@/types/domain";

export const reputationalRiskWeights: Record<keyof RiskFactors, number> = {
  reach: 0.2,
  velocity: 0.2,
  sourceInfluence: 0.15,
  damagePotential: 0.15,
  persistence: 0.1,
  coordination: 0.1,
  pressProximity: 0.1
};

export const physicalThreatWeights: Record<keyof PhysicalThreatFactors, number> = {
  declaredIntent: 0.25,
  targetSpecificity: 0.2,
  apparentCapability: 0.2,
  proximityAccess: 0.15,
  recurrenceEscalation: 0.1,
  dataLocationExposure: 0.1
};

function clampFactor(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function calculateRiskScore(factors: RiskFactors): number {
  const total = Object.entries(reputationalRiskWeights).reduce((score, [key, weight]) => {
    return score + clampFactor(factors[key as keyof RiskFactors]) * weight;
  }, 0);

  return Math.round(total);
}

export function classifyRisk(score: number): RiskLevel {
  if (score <= 20) return "Informativo";
  if (score <= 40) return "Baixo";
  if (score <= 60) return "Moderado";
  if (score <= 80) return "Alto";
  return "Crítico";
}

export function calculatePhysicalThreatScore(factors: PhysicalThreatFactors): number {
  const total = Object.entries(physicalThreatWeights).reduce((score, [key, weight]) => {
    return score + clampFactor(factors[key as keyof PhysicalThreatFactors]) * weight;
  }, 0);

  return Math.round(total);
}

export function classifyThreatLevel(score: number): ThreatLevel {
  if (score <= 20) return 1;
  if (score <= 40) return 2;
  if (score <= 60) return 3;
  if (score <= 80) return 4;
  return 5;
}

export function threatLevelLabel(level: ThreatLevel): string {
  const labels: Record<ThreatLevel, string> = {
    1: "Observação",
    2: "Atenção",
    3: "Relevante",
    4: "Crítico",
    5: "Emergência"
  };

  return labels[level];
}

export function deriveThreatFactorsFromFlags(flags: PhysicalThreatFlags): PhysicalThreatFactors {
  return {
    declaredIntent: flags.mentionsWeapon || flags.mentionsMethod || flags.encouragesThirdParties ? 65 : 10,
    targetSpecificity: flags.mentionsPlace || flags.mentionsTime || flags.mentionsFamily ? 70 : 8,
    apparentCapability: flags.showsCapability || flags.showsPreparation ? 75 : 10,
    proximityAccess: flags.possiblePhysicalProximity ? 68 : 5,
    recurrenceEscalation: flags.recurrent ? 65 : 4,
    dataLocationExposure:
      flags.knowsAgenda ||
      flags.exposesAddress ||
      flags.exposesVehicle ||
      flags.exposesRoute ||
      flags.exposesHotel
        ? 82
        : 5
  };
}

export function emptyPhysicalThreatFlags(): PhysicalThreatFlags {
  return {
    mentionsWeapon: false,
    mentionsMethod: false,
    mentionsPlace: false,
    mentionsTime: false,
    knowsAgenda: false,
    exposesAddress: false,
    exposesVehicle: false,
    exposesRoute: false,
    exposesHotel: false,
    mentionsFamily: false,
    encouragesThirdParties: false,
    showsPreparation: false,
    showsCapability: false,
    recurrent: false,
    possiblePhysicalProximity: false
  };
}

export function defaultRiskFactors(score = 25): RiskFactors {
  return {
    reach: score,
    velocity: score,
    sourceInfluence: score,
    damagePotential: score,
    persistence: score,
    coordination: score,
    pressProximity: score
  };
}
