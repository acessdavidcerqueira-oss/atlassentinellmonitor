"use client";

import { useState } from "react";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ItemActions } from "@/components/ui/item-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";
import { canWrite } from "@/features/auth/auth";
import type { ImportReport } from "@/types/domain";
import { formatDateTime } from "@/utils/date";

export function AuditView() {
  const atlas = useAtlas();
  const { user } = useAuth();
  const mayWrite = !atlas.readOnly && canWrite(user);
  const { auditLogs, imports } = atlas;
  const [editingImportId, setEditingImportId] = useState<string | null>(null);
  const [fileNameDraft, setFileNameDraft] = useState("");

  function startImportEdit(report: ImportReport) {
    setEditingImportId(report.id);
    setFileNameDraft(report.fileName);
  }

  function cancelImportEdit() {
    setEditingImportId(null);
    setFileNameDraft("");
  }

  function saveImport(report: ImportReport) {
    if (!user || !mayWrite) return;
    atlas.updateImport(report.id, { fileName: fileNameDraft.trim() || report.fileName }, user);
    cancelImportEdit();
  }

  function deleteImport(report: ImportReport) {
    if (!user || !mayWrite) return;
    const confirmed = window.confirm(`Excluir o registro da importação "${report.fileName}"?`);
    if (!confirmed) return;
    atlas.deleteImport(report.id, user);
    if (editingImportId === report.id) cancelImportEdit();
  }

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
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Linhas</TableHead>
                <TableHead>Importados</TableHead>
                <TableHead>Finalizado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.length ? (
                imports.map((report) => {
                  const isEditing = editingImportId === report.id;

                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={fileNameDraft}
                            onChange={(event) => setFileNameDraft(event.target.value)}
                            aria-label="Nome do arquivo importado"
                            className="min-w-56"
                          />
                        ) : (
                          report.fileName
                        )}
                      </TableCell>
                      <TableCell>{report.sourceFormat}</TableCell>
                      <TableCell>{report.totalRows}</TableCell>
                      <TableCell>{report.importedRows}</TableCell>
                      <TableCell>{formatDateTime(report.finishedAt ?? report.startedAt)}</TableCell>
                      <TableCell>
                        {mayWrite ? (
                          <ItemActions
                            isEditing={isEditing}
                            onEdit={() => startImportEdit(report)}
                            onSave={() => saveImport(report)}
                            onCancel={cancelImportEdit}
                            onDelete={() => deleteImport(report)}
                            editLabel="Editar importação"
                            deleteLabel="Excluir importação"
                          />
                        ) : (
                          <span className="text-xs text-atlas-muted">Somente leitura</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-atlas-muted">
                    Nenhuma importação registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
