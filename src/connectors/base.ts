import type { CollectionParams, CollectorConnector, RawCollectedItem } from "@/types/collector";

export type { CollectionParams, CollectorConnector, RawCollectedItem };

export abstract class BaseConnector implements CollectorConnector {
  abstract name: string;

  isConfigured(): boolean {
    return false;
  }

  async collect(_params: CollectionParams): Promise<RawCollectedItem[]> {
    return [];
  }
}
