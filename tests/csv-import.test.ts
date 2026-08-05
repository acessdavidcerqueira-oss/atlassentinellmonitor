import { describe, expect, it } from "vitest";
import { previewCsvImport } from "@/services/csv-import";
import { buildDemoState } from "@/services/demo-data";
import { sanitizeCell } from "@/utils/text";

describe("csv import pipeline", () => {
  it("neutralizes csv injection cells", () => {
    expect(sanitizeCell("=IMPORTXML(\"http://example.test\")")).toBe("'=IMPORTXML(\"http://example.test\")");
    expect(sanitizeCell("+SUM(1,1)")).toBe("'+SUM(1,1)");
  });

  it("imports atlas csv and flags duplicates", () => {
    const state = buildDemoState();
    const csv = [
      "id,monitored_entity,collected_at,published_at,title,summary,content,url,domain,platform,author_name,author_handle,author_url,actor_type,category,subcategory,verification_status,sentiment,provenance_type,confidence_level,risk_score,risk_level,threat_level,reach_value,reach_type,engagement_value,velocity_score,coordination_level,target,location_exposure,evidence_type,evidence_url,screenshot_url,indicators,keywords,status,owner_team,recommended_action,analyst_notes",
      "new_1,Flávio Bolsonaro,2026-08-05T12:00:00.000Z,2026-08-05T11:00:00.000Z,Novo item fictício,Resumo,Conteúdo,https://example.org/new-1,example.org,Portal,Fonte,,,,Outro,,Não analisado,neutro,SIMULACAO_UI,medium,20,Baixo,1,,unavailable,,10,Não identificado,Monitorado,Não disponível,URL,https://example.org/new-1,,tag,item,Novo,Atlas OSINT,Avaliar,Teste",
      "new_2,Flávio Bolsonaro,2026-08-05T12:00:00.000Z,2026-08-05T11:00:00.000Z,Novo item fictício,Resumo,Conteúdo,https://example.org/new-1,example.org,Portal,Fonte,,,,Outro,,Não analisado,neutro,SIMULACAO_UI,medium,20,Baixo,1,,unavailable,,10,Não identificado,Monitorado,Não disponível,URL,https://example.org/new-1,,tag,item,Novo,Atlas OSINT,Avaliar,Teste"
    ].join("\n");

    const preview = previewCsvImport({
      fileName: "test.csv",
      text: csv,
      sourceFormat: "atlas",
      monitoredEntityId: state.activeMonitoredEntityId,
      monitoredEntityName: "Flávio Bolsonaro",
      existingIncidents: []
    });

    expect(preview.incidents).toHaveLength(1);
    expect(preview.report.duplicateRows).toBe(1);
  });
});
