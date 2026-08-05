"use client";

import Link from "next/link";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAtlas } from "@/features/state/atlas-store";
import { formatDateTime } from "@/utils/date";

export function ActorsView() {
  const { actors } = useAtlas();

  return (
    <div>
      <PageTitle
        title="Atores e Páginas"
        description="Cadastro de perfis, páginas e fontes. Identidade civil de perfil anônimo não é inferida sem evidência pública suficiente."
        actions={<ReportActionButton theme="atores" />}
      />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Ocorrências</TableHead>
                <TableHead>Recorrência</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead>Última atividade</TableHead>
                <TableHead>Seguidores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actors.map((actor) => (
                <TableRow key={actor.id}>
                  <TableCell>
                    <div className="font-medium">{actor.name}</div>
                    <div className="text-xs text-atlas-muted">{actor.handle || actor.url || "Sem handle"}</div>
                  </TableCell>
                  <TableCell><Badge variant="muted">{actor.type}</Badge></TableCell>
                  <TableCell>{actor.platform}</TableCell>
                  <TableCell>{actor.occurrenceCount}</TableCell>
                  <TableCell>{actor.recurrence}</TableCell>
                  <TableCell><RiskBadge level={actor.riskScore >= 80 ? "Crítico" : actor.riskScore >= 61 ? "Alto" : actor.riskScore >= 41 ? "Moderado" : "Baixo"} score={actor.riskScore} /></TableCell>
                  <TableCell>{actor.confidenceLevel}</TableCell>
                  <TableCell>{formatDateTime(actor.lastActivity)}</TableCell>
                  <TableCell>
                    {actor.followers ? actor.followers : <ProvenanceBadge value={actor.followersProvenance} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {actors.slice(0, 4).map((actor) => (
          <Card key={actor.id}>
            <CardContent className="p-4">
              <h2 className="font-display text-lg font-semibold">{actor.name}</h2>
              <p className="mt-2 text-sm text-atlas-muted">{actor.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {actor.incidentIds.map((id) => (
                  <Link key={id} href={`/incidents/${id}`}>
                    <Badge>{id.replace("inc_demo_", "#")}</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
