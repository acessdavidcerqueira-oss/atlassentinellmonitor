"use client";

import Link from "next/link";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ItemActions } from "@/components/ui/item-actions";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";
import { canWrite } from "@/features/auth/auth";
import type { Incident } from "@/types/domain";
import type { ReportTheme } from "@/services/simple-report";
import { formatDateTime } from "@/utils/date";

export function FilteredIncidentView({
  title,
  description,
  reportTheme,
  predicate
}: {
  title: string;
  description: string;
  reportTheme: ReportTheme;
  predicate: (incident: Incident) => boolean;
}) {
  const atlas = useAtlas();
  const { user } = useAuth();
  const mayWrite = !atlas.readOnly && canWrite(user);
  const { incidents, viewBasePath } = atlas;
  const filtered = incidents.filter((incident) => predicate(incident) && !incident.deletedAt);

  function deleteIncident(incident: Incident) {
    if (!user || !mayWrite) return;
    const confirmed = window.confirm(`Excluir o report "${incident.title}"?`);
    if (!confirmed) return;
    atlas.deleteIncident(incident.id, user);
  }

  return (
    <div>
      <PageTitle
        title={title}
        description={description}
        actions={<ReportActionButton theme={reportTheme} />}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.length ? (
          filtered.map((incident) => (
            <Card key={incident.id} className="h-full transition hover:border-atlas-action/50">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{incident.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-atlas-muted">{incident.summary}</p>
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    <RiskBadge level={incident.riskLevel} score={incident.riskScore} />
                    {mayWrite ? (
                      <ItemActions
                        editHref={`${viewBasePath}/incidents/${incident.id}`}
                        editLabel="Editar report"
                        deleteLabel="Excluir report"
                        onDelete={() => deleteIncident(incident)}
                      />
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{incident.category}</Badge>
                  <Badge variant={incident.threatLevel >= 4 ? "critical" : "muted"}>Threat {incident.threatLevel}</Badge>
                  <Badge variant="muted">{incident.status}</Badge>
                  <ProvenanceBadge value={incident.provenanceType} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-atlas-muted">{formatDateTime(incident.updatedAt)}</p>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`${viewBasePath}/incidents/${incident.id}`}>Abrir detalhe</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-atlas-muted">Não disponível.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
