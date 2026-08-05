import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildDemoState } from "@/services/demo-data";

const outputDir = resolve(process.cwd(), "work");
const outputPath = resolve(outputDir, "atlas-sentinel-demo-seed.json");

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, JSON.stringify(buildDemoState(), null, 2));

console.log(`Base limpa gerada em ${outputPath}`);
