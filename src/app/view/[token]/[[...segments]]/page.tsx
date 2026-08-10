"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActorsView } from "@/features/actors/actors-view";
import { BlacklistView } from "@/features/blacklist/blacklist-view";
import { CtiView } from "@/features/cti/cti-view";
import { CommandCenter } from "@/features/dashboard/command-center";
import { EvidenceView } from "@/features/evidence/evidence-view";
import { FilteredIncidentView } from "@/features/incidents/filtered-incident-view";
import { IncidentDetail } from "@/features/incidents/incident-detail";
import { IncidentsTable } from "@/features/incidents/incidents-table";
import { NarrativeRadar } from "@/features/narratives/narrative-radar";
import { ReportsView } from "@/features/reports/reports-view";

export default function SharedViewPage() {
  const params = useParams<{ segments?: string[] }>();
  const segments = Array.isArray(params.segments) ? params.segments : [];
  const [section, detail] = segments;

  if (!section) return <CommandCenter />;

  if (section === "incidents") {
    if (!detail) return <IncidentsTable />;
    return <IncidentDetail incidentId={detail} />;
  }

  if (section === "narrativas") return <NarrativeRadar />;

  if (section === "desinformacao") {
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

  if (section === "fraudes") {
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

  if (section === "cti") return <CtiView />;

  if (section === "ameacas") {
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

  if (section === "atores") return <ActorsView />;

  if (section === "coordenacao") {
    return (
      <FilteredIncidentView
        title="Coordenação"
        description="Sinais de textos repetidos, URLs, janelas curtas e amplificação. Similaridade isolada não prova coordenação."
        reportTheme="coordenacao"
        predicate={(incident) => incident.coordinationLevel !== "Não identificado" || incident.category === "Movimento coordenado"}
      />
    );
  }

  if (section === "evidencias") return <EvidenceView />;
  if (section === "blacklist") return <BlacklistView />;
  if (section === "relatorios") return <ReportsView />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Área indisponível no modo visualização</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-atlas-muted">
        Este link libera somente abas operacionais de inteligência em modo somente leitura.
      </CardContent>
    </Card>
  );
}
