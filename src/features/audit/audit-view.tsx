"use client";

import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAtlas } from "@/features/state/atlas-store";
import { formatDateTime } from "@/utils/date";

export function AuditView() {
  const { auditLogs, imports } = useAtlas();
  return (
    <div>
      <PageTitle
        title="Auditoria"
        description="Toda alteração sensível registra usuário, data, valor anterior, novo valor e justificativa quando aplicável."
        actions={<ReportActionButton theme="geral" label="Novo report" />}
      />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Valor anterior</TableHead>
                <TableHead>Valor novo</TableHead>
                <TableHead>Justificativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell>{log.userName}</TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{log.previousValue ?? ""}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{log.newValue ?? ""}</TableCell>
                  <TableCell>{log.justification ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="mt-5">
        <CardContent className="p-4 text-sm text-atlas-muted">
          Importações registradas: {imports.length || "Não disponível"}.
        </CardContent>
      </Card>
    </div>
  );
}
