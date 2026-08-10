"use client";

import Link from "next/link";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { useAtlas } from "@/features/state/atlas-store";
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
  const { incidents, viewBasePath } = useAtlas();
  const filtered = incidents.filter((incident) => predicate(incident) && !incident.deletedAt);

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
            <Link key={incident.id} href={`${viewBasePath}/incidents/${incident.id}`}>
              <Card className="h-full transition hover:border-atlas-action/50">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-semibold">{incident.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-atlas-muted">{incident.summary}</p>
                    </div>
                    <RiskBadge level={incident.riskLevel} score={incident.riskScore} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{incident.category}</Badge>
                    <Badge variant={incident.threatLevel >= 4 ? "critical" : "muted"}>Threat {incident.threatLevel}</Badge>
                    <Badge variant="muted">{incident.status}</Badge>
                    <ProvenanceBadge value={incident.provenanceType} />
                  </div>
                  <p className="mt-3 text-xs text-atlas-muted">{formatDateTime(incident.updatedAt)}</p>
                </CardContent>
              </Card>
            </Link>
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
