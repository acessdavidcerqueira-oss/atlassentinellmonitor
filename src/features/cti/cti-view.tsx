"use client";

import Link from "next/link";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { LightweightAreaChart } from "@/components/ui/lightweight-charts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAtlas } from "@/features/state/atlas-store";
import { formatDateTime } from "@/utils/date";

export function CtiView() {
  const { indicators, incidents, viewBasePath } = useAtlas();
  const cyberIncidents = incidents.filter((incident) =>
    ["Phishing", "Domínio fraudulento", "Malware", "Vazamento de credencial", "Ataque contra conta", "Ataque contra site", "Incidente cibernético"].includes(incident.category)
  );
  const timeline = cyberIncidents.map((incident) => ({
    date: incident.publishedAt.slice(0, 10),
    risco: incident.riskScore,
    threat: incident.threatLevel
  }));

  return (
    <div>
      <PageTitle
        title="Cyber Threats"
        description="Indicadores técnicos, campanhas de phishing, domínios suspeitos e ações de contenção. Não há declaração de dark web sem conector real."
        actions={<ReportActionButton theme="cti" />}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Linha do tempo CTI</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <LightweightAreaChart
              data={timeline}
              xKey="date"
              series={[
                { key: "risco", label: "Risco", color: "#48CFF2", fill: "#48CFF2" },
                { key: "threat", label: "Ameaça", color: "#FBBF24" }
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ações de contenção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-atlas-muted">
            <p>Bloquear domínios confirmados, preservar cabeçalhos e orientar equipe quando houver phishing.</p>
            <p>Alertas por e-mail e webhook permanecem desativados sem variáveis de ambiente configuradas.</p>
            <Badge variant="muted">Conectores externos desativados por padrão</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Indicadores técnicos</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Primeiro registro</TableHead>
                <TableHead>Último registro</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Incidentes</TableHead>
                <TableHead>Procedência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indicators.map((indicator) => (
                <TableRow key={indicator.id}>
                  <TableCell className="font-mono text-xs">{indicator.value}</TableCell>
                  <TableCell><Badge>{indicator.type}</Badge></TableCell>
                  <TableCell>{formatDateTime(indicator.firstSeen)}</TableCell>
                  <TableCell>{formatDateTime(indicator.lastSeen)}</TableCell>
                  <TableCell><RiskBadge level={indicator.severity} /></TableCell>
                  <TableCell>{indicator.status}</TableCell>
                  <TableCell>
                    {indicator.incidentIds.map((id) => (
                      <Link key={id} className="mr-2 text-atlas-action" href={`${viewBasePath}/incidents/${id}`}>
                        Abrir
                      </Link>
                    ))}
                  </TableCell>
                  <TableCell><ProvenanceBadge value={indicator.provenanceType} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
