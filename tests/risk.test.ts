import { describe, expect, it } from "vitest";
import {
  calculatePhysicalThreatScore,
  calculateRiskScore,
  classifyRisk,
  classifyThreatLevel
} from "@/services/risk";

describe("risk methodology", () => {
  it("calculates weighted reputational risk", () => {
    const score = calculateRiskScore({
      reach: 100,
      velocity: 50,
      sourceInfluence: 0,
      damagePotential: 100,
      persistence: 0,
      coordination: 50,
      pressProximity: 0
    });

    expect(score).toBe(50);
    expect(classifyRisk(score)).toBe("Moderado");
  });

  it("calculates separate physical threat level", () => {
    const score = calculatePhysicalThreatScore({
      declaredIntent: 80,
      targetSpecificity: 90,
      apparentCapability: 70,
      proximityAccess: 80,
      recurrenceEscalation: 60,
      dataLocationExposure: 100
    });

    expect(score).toBeGreaterThanOrEqual(80);
    expect(classifyThreatLevel(score)).toBe(4);
  });
});
