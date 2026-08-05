"use client";

import { FilteredIncidentView } from "@/features/incidents/filtered-incident-view";

export default function ThreatsPage() {
  return (
    <FilteredIncidentView
      title="Ameaças à Pessoa"
      description="Avaliação separada de ameaça física com flags específicas. O sistema não envia resposta automática ao autor da ameaça."
      reportTheme="ameacas"
      predicate={(incident) =>
        ["Ameaça física", "Incitação à violência", "Assédio", "Exposição de agenda", "Exposição de localização"].includes(incident.category) ||
        incident.threatLevel >= 2
      }
    />
  );
}
