import { describe, expect, it } from "vitest";
import { evaluateIncidentAlerts } from "@/services/alerts";
import { buildDemoState } from "@/services/demo-data";
import { incidentFromSimpleReport } from "@/services/simple-report";

describe("alert engine", () => {
  it("raises critical alerts for threat level 4+", () => {
    const state = buildDemoState();
    const incident = {
      ...incidentFromSimpleReport(
        {
          theme: "ameacas",
          page: "Perfil de teste",
          fakeNews: "Não sei",
          whatTheySaid: "Comentário de teste para validação do alerta.",
          observation: "Teste automatizado.",
          estimatedReach: 1000
        },
        state.activeMonitoredEntityId
      ),
      threatLevel: 4 as const
    };
    const alerts = evaluateIncidentAlerts(incident);

    expect(alerts.some((alert) => alert.ruleId === "rule_threat_level_4")).toBe(true);
  });
});
