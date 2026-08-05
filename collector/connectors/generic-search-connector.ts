import type { CollectionParams, CollectorConnector, RawCollectedItem } from "../../src/types/collector";

export class GenericSearchConnector implements CollectorConnector {
  name = "generic-search";

  isConfigured(): boolean {
    return Boolean(process.env.GENERIC_SEARCH_API_KEY && process.env.GENERIC_SEARCH_ENDPOINT);
  }

  async collect(_params: CollectionParams): Promise<RawCollectedItem[]> {
    if (!this.isConfigured()) return [];
    throw new Error(
      "GenericSearchConnector é apenas um placeholder configurável. Implemente conforme os termos do provedor antes de ativar."
    );
  }
}
