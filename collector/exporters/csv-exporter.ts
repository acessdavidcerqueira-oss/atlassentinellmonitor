import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import Papa from "papaparse";
import { atlasCsvColumns } from "../../src/schemas/csv";
import type { NormalizedCollectedItem } from "../../src/types/collector";

export function exportAtlasCsv(outputPath: string, rows: NormalizedCollectedItem[]): void {
  mkdirSync(dirname(outputPath), { recursive: true });
  const csv = Papa.unparse(rows, { columns: [...atlasCsvColumns] });
  writeFileSync(outputPath, csv);
}
