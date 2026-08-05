"use client";

import { FilteredIncidentView } from "@/features/incidents/filtered-incident-view";

export default function DisinformationPage() {
  return (
    <FilteredIncidentView
      title="Desinformação"
      description="Conteúdos enganosos, fora de contexto, manipulados, deepfakes e alegações em verificação. Crítica política legítima permanece separada."
      reportTheme="desinformacao"
      predicate={(incident) =>
        ["Desinformação", "Conteúdo enganoso", "Conteúdo fora de contexto", "Conteúdo manipulado", "Deepfake"].includes(incident.category)
      }
    />
  );
}
