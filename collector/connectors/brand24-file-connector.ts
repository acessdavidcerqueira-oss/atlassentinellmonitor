import { readFileSync } from "node:fs";
import Papa from "papaparse";
import type { CollectionParams, CollectorConnector, RawCollectedItem } from "../../src/types/collector";

export class Brand24FileConnector implements CollectorConnector {
  name = "brand24-file";

  isConfigured(): boolean {
    return Boolean(process.env.BRAND24_EXPORT_PATH);
  }

  async collect(_params: CollectionParams): Promise<RawCollectedItem[]> {
    if (!this.isConfigured()) return [];
    const text = readFileSync(process.env.BRAND24_EXPORT_PATH!, "utf8");
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    return parsed.data.map((row, index) => ({
      id: row.id || `brand24-${index + 1}`,
      collectedAt: new Date().toISOString(),
      publishedAt: row.published_at || row.date || new Date().toISOString(),
      title: row.title || row.snippet || row.text || "Menção Brand24 sem título",
      summary: row.snippet || row.summary || "",
      content: row.text || row.content || row.snippet || "",
      url: row.url || "",
      domain: row.domain || safeDomain(row.url || ""),
      platform: row.source || row.platform || "Brand24",
      authorName: row.author || row.author_name || "",
      authorHandle: row.author_handle || "",
      source: this.name,
      metadata: row
    }));
  }
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
