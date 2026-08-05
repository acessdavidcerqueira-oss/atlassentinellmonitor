import { readFileSync } from "node:fs";
import type { CollectionParams, CollectorConnector, RawCollectedItem } from "../../src/types/collector";

export class ManualJSONConnector implements CollectorConnector {
  name = "manual-json";

  isConfigured(): boolean {
    return Boolean(process.env.MANUAL_JSON_PATH);
  }

  async collect(_params: CollectionParams): Promise<RawCollectedItem[]> {
    if (!this.isConfigured()) return [];
    const data = JSON.parse(readFileSync(process.env.MANUAL_JSON_PATH!, "utf8")) as RawCollectedItem[];
    return data.map((item) => ({
      ...item,
      collectedAt: item.collectedAt || new Date().toISOString(),
      publishedAt: item.publishedAt || new Date().toISOString(),
      source: this.name
    }));
  }
}
