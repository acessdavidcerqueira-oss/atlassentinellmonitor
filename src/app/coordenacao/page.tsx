"use client";

import { FilteredIncidentView } from "@/features/incidents/filtered-incident-view";

export default function CoordinationPage() {
  return (
    <FilteredIncidentView
      title="Coordenação"
      description="Sinais de textos repetidos, URLs, janelas curtas e amplificação. Similaridade isolada não prova coordenação."
      reportTheme="coordenacao"
      predicate={(incident) => incident.coordinationLevel !== "Não identificado" || incident.category === "Movimento coordenado"}
    />
  );
}
