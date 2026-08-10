"use client";

import Link from "next/link";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAtlas } from "@/features/state/atlas-store";
import { formatDateTime } from "@/utils/date";

export function EvidenceView() {
  const { evidences, viewBasePath } = useAtlas();
  return (
    <div>
      <PageTitle
        title="Evidências"
        description="Preservação de URLs, screenshots, arquivos, registros oficiais, indicadores técnicos e notas de analista."
        actions={<ReportActionButton theme="evidencias" />}
      />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Incidente</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Integridade</TableHead>
                <TableHead>Coletado por</TableHead>
                <TableHead>Coletado em</TableHead>
                <TableHead>Procedência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evidences.map((evidence) => (
                <TableRow key={evidence.id}>
                  <TableCell><Badge>{evidence.type}</Badge></TableCell>
                  <TableCell>{evidence.description}</TableCell>
                  <TableCell><Link className="text-atlas-action" href={`${viewBasePath}/incidents/${evidence.incidentId}`}>Abrir</Link></TableCell>
                  <TableCell>{evidence.source}</TableCell>
                  <TableCell>{evidence.integrity}</TableCell>
                  <TableCell>{evidence.collectedBy}</TableCell>
                  <TableCell>{formatDateTime(evidence.collectedAt)}</TableCell>
                  <TableCell><ProvenanceBadge value={evidence.provenanceType} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
