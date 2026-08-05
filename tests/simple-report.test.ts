import { describe, expect, it } from "vitest";
import { incidentFromSimpleReport } from "@/services/simple-report";

describe("simple report", () => {
  it("uses narrative risk classification in the generated incident", () => {
    const incident = incidentFromSimpleReport(
      {
        theme: "narrativas",
        page: "Página de teste",
        fakeNews: "Suspeita",
        whatTheySaid: "Narrativa recorrente em crescimento.",
        observation: "Monitorar a evolução.",
        estimatedReach: 5000,
        riskClassification: "Alto"
      },
      "entity_test"
    );

    expect(incident.riskLevel).toBe("Alto");
    expect(incident.riskScore).toBeGreaterThanOrEqual(72);
    expect(incident.subcategory).toContain("risco alto");
    expect(incident.analystNotes).toContain("Classificação de risco da narrativa: Alto.");
    expect(incident.keywords).toContain("risco alto");
  });

  it("uses disinformation alert risk classification in the generated incident", () => {
    const incident = incidentFromSimpleReport(
      {
        theme: "desinformacao",
        page: "Página de teste",
        fakeNews: "Suspeita",
        whatTheySaid: "Alegação enganosa em circulação.",
        observation: "Validar fonte antes de responder.",
        estimatedReach: 8000,
        riskClassification: "Moderado"
      },
      "entity_test"
    );

    expect(incident.riskLevel).toBe("Moderado");
    expect(incident.riskScore).toBeGreaterThanOrEqual(56);
    expect(incident.subcategory).toContain("risco moderado");
    expect(incident.analystNotes).toContain("Classificação de risco do alerta: Moderado.");
    expect(incident.keywords).toContain("risco moderado");
  });

  it("uses fraud profile metadata in the generated incident", () => {
    const incident = incidentFromSimpleReport(
      {
        theme: "fraudes",
        page: "@perfil_suspeito",
        fakeNews: "Não sei",
        whatTheySaid: "Perfil usando foto e nome semelhantes ao monitorado.",
        observation: "Preservar print e link.",
        estimatedReach: 1200,
        riskClassification: "Alto",
        fraudSocialNetwork: "Instagram",
        fraudCaseType: "Perfil se passando por pessoa"
      },
      "entity_test"
    );

    expect(incident.category).toBe("Impersonação");
    expect(incident.actorType).toBe("Perfil de impersonação");
    expect(incident.platform).toBe("Instagram");
    expect(incident.riskLevel).toBe("Alto");
    expect(incident.analystNotes).toContain("Classificação de risco da fraude: Alto.");
    expect(incident.analystNotes).toContain("Rede social: Instagram.");
    expect(incident.analystNotes).toContain("Tipo de caso: Perfil se passando por pessoa.");
    expect(incident.keywords).toContain("perfil se passando por pessoa");
  });

  it("uses threat type classification in the generated incident", () => {
    const incident = incidentFromSimpleReport(
      {
        theme: "ameacas",
        page: "@perfil_hostil",
        fakeNews: "Não sei",
        whatTheySaid: "Mensagem com ameaça explícita contra a vida.",
        observation: "Encaminhar para segurança.",
        estimatedReach: 900,
        threatCaseType: "Ameaça - Risco de vida"
      },
      "entity_test"
    );

    expect(incident.category).toBe("Ameaça física");
    expect(incident.actorType).toBe("Ator de ameaça");
    expect(incident.riskLevel).toBe("Alto");
    expect(incident.threatLevel).toBe(5);
    expect(incident.physicalThreatScore).toBeGreaterThanOrEqual(80);
    expect(incident.analystNotes).toContain("Classificação de risco da ameaça: Alto.");
    expect(incident.analystNotes).toContain("Tipo de ameaça: Ameaça - Risco de vida.");
    expect(incident.keywords).toContain("ameaça - risco de vida");
  });

  it("uses actor page metadata in the generated incident", () => {
    const incident = incidentFromSimpleReport(
      {
        theme: "atores",
        page: "@ator_relevante",
        fakeNews: "Não sei",
        whatTheySaid: "Perfil amplifica conteúdos sobre o monitorado.",
        observation: "Acompanhar recorrência semanal.",
        actorSocialNetwork: "TikTok",
        actorProfileType: "Influenciador",
        actorFollowers: 45000
      },
      "entity_test"
    );

    expect(incident.platform).toBe("TikTok");
    expect(incident.actorType).toBe("Influenciador");
    expect(incident.reachValue).toBe(45000);
    expect(incident.reachType).toBe("estimated");
    expect(incident.subcategory).toContain("influenciador");
    expect(incident.analystNotes).toContain("Rede social: TikTok.");
    expect(incident.analystNotes).toContain("Classificação do ator: Influenciador.");
    expect(incident.analystNotes).toContain("Seguidores: 45.000.");
    expect(incident.keywords).toContain("45000 seguidores");
  });

  it("uses evidence metadata in the generated incident", () => {
    const incident = incidentFromSimpleReport(
      {
        theme: "evidencias",
        page: "https://example.org/post",
        fakeNews: "Suspeita",
        whatTheySaid: "Post com vídeo e print anexado.",
        observation: "Verificar originalidade do arquivo.",
        evidenceKind: "Foto ou imagem",
        evidenceFileName: "print-denuncia.png",
        evidenceFileType: "image/png",
        evidenceFileSize: 204800,
        evidenceVideoUrl: "https://video.example.org/watch/123"
      },
      "entity_test"
    );

    expect(incident.subcategory).toContain("foto ou imagem");
    expect(incident.indicators).toContain("https://example.org/post");
    expect(incident.indicators).toContain("https://video.example.org/watch/123");
    expect(incident.analystNotes).toContain("Tipo de evidência: Foto ou imagem.");
    expect(incident.analystNotes).toContain("Arquivo: print-denuncia.png (image/png) - 200 KB.");
    expect(incident.analystNotes).toContain("Link de vídeo: https://video.example.org/watch/123.");
    expect(incident.keywords).toContain("print-denuncia.png");
    expect(incident.keywords).toContain("link de vídeo");
  });

  it("uses the shared threat classification in any report theme", () => {
    const incident = incidentFromSimpleReport(
      {
        theme: "geral",
        page: "https://example.org/login",
        fakeNews: "Não sei",
        whatTheySaid: "Página suspeita pedindo senha.",
        observation: "Validar domínio antes de bloquear.",
        threatClassification: "Phishing"
      },
      "entity_test"
    );

    expect(incident.category).toBe("Phishing");
    expect(incident.subcategory).toContain("phishing");
    expect(incident.analystNotes).toContain("Classificação de ameaça: Phishing.");
    expect(incident.keywords).toContain("phishing");
  });
});
