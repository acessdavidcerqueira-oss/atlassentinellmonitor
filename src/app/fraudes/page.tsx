"use client";

import { FilteredIncidentView } from "@/features/incidents/filtered-incident-view";

export default function FraudsPage() {
  return (
    <FilteredIncidentView
      title="Fraudes e Impersonação"
      description="Perfis falsos, impersonação, golpes financeiros, phishing e domínios fraudulentos."
      reportTheme="fraudes"
      predicate={(incident) =>
        ["Perfil falso", "Impersonação", "Fraude", "Golpe financeiro", "Phishing", "Domínio fraudulento"].includes(incident.category)
      }
    />
  );
}
