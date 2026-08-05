import type { CollectionParams, CollectorConnector, RawCollectedItem } from "../../src/types/collector";

export class MockConnector implements CollectorConnector {
  name = "mock";

  isConfigured(): boolean {
    return true;
  }

  async collect(params: CollectionParams): Promise<RawCollectedItem[]> {
    return params.queries.map((query, index) => ({
      id: `mock-${index + 1}`,
      collectedAt: new Date().toISOString(),
      publishedAt: `${params.from}T12:00:00.000Z`,
      title: `Coleta fictícia sobre ${query}`,
      summary: "Item gerado pelo MockConnector para validação do pipeline Atlas Sentinel.",
      content: "Conteúdo SIMULACAO_UI. Não representa publicação real.",
      url: `https://example.org/mock/${encodeURIComponent(query)}`,
      domain: "example.org",
      platform: "MockConnector",
      authorName: "Fonte simulada",
      authorHandle: "@mock",
      source: this.name,
      metadata: {
        monitoredEntity: params.monitoredEntity,
        provenanceType: "SIMULACAO_UI"
      }
    }));
  }
}
