import { resolve } from "node:path";
import { MockConnector } from "../connectors/mock-connector";
import { RSSConnector } from "../connectors/rss-connector";
import { GenericSearchConnector } from "../connectors/generic-search-connector";
import { Brand24FileConnector } from "../connectors/brand24-file-connector";
import { ManualJSONConnector } from "../connectors/manual-json-connector";
import { normalizeCollectedItem } from "../normalizers/atlas-normalizer";
import { exportAtlasCsv } from "../exporters/csv-exporter";
import type { CollectionParams, CollectorConnector, RawCollectedItem } from "../../src/types/collector";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const monitoredEntity = args.monitorado || args.monitored || "Flávio Bolsonaro";
  const from = args.from || new Date().toISOString().slice(0, 10);
  const to = args.to || new Date().toISOString().slice(0, 10);
  const output = resolve(args.output || "./exports/atlas_sentinel_collect.csv");
  const queries = (args.queries ? args.queries.split(";") : [monitoredEntity]).filter(Boolean);
  const params: CollectionParams = { monitoredEntity, queries, from, to };
  const connectors: CollectorConnector[] = [
    new MockConnector(),
    new RSSConnector(),
    new GenericSearchConnector(),
    new Brand24FileConnector(),
    new ManualJSONConnector()
  ];

  const rawItems: RawCollectedItem[] = [];
  for (const connector of connectors) {
    if (!connector.isConfigured()) {
      console.log(`${connector.name}: desativado ou sem configuração`);
      continue;
    }
    console.log(`${connector.name}: coletando`);
    rawItems.push(...(await connector.collect(params)));
  }

  const normalized = dedupe(rawItems).map((item) => normalizeCollectedItem(item, monitoredEntity));
  exportAtlasCsv(output, normalized);
  console.log(`Exportado ${normalized.length} linhas para ${output}`);
}

function parseArgs(args: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith("--")) {
      parsed[arg.slice(2)] = args[index + 1] ?? "";
      index += 1;
    }
  }
  return parsed;
}

function dedupe(items: RawCollectedItem[]): RawCollectedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = [item.url ?? "", item.publishedAt, item.authorHandle ?? item.authorName ?? "", item.title].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
