"use client";

import Link from "next/link";
import { useState } from "react";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { Select } from "@/components/ui/select";
import { ItemActions } from "@/components/ui/item-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EvidenceThumbnail } from "@/features/evidence/evidence-thumbnail";
import { canWrite } from "@/features/auth/auth";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";
import { formatDateTime } from "@/utils/date";
import type { Evidence, EvidenceType } from "@/types/domain";
import { evidenceTypes } from "@/types/domain";

interface EvidenceEditDraft {
  type: EvidenceType;
  description: string;
  source: string;
}

export function EvidenceView() {
  const atlas = useAtlas();
  const { user } = useAuth();
  const mayWrite = !atlas.readOnly && canWrite(user);
  const { evidences, viewBasePath } = atlas;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EvidenceEditDraft>({
    type: "URL",
    description: "",
    source: ""
  });

  function startEdit(evidence: Evidence) {
    setEditingId(evidence.id);
    setDraft({
      type: evidence.type,
      description: evidence.description,
      source: evidence.source
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({ type: "URL", description: "", source: "" });
  }

  function saveEdit(evidenceId: string) {
    if (!user || !mayWrite) return;
    atlas.updateEvidence(
      evidenceId,
      {
        type: draft.type,
        description: draft.description.trim() || "Evidência sem descrição",
        source: draft.source.trim() || "Fonte não informada"
      },
      user
    );
    cancelEdit();
  }

  function removeEvidence(evidence: Evidence) {
    if (!user || !mayWrite) return;
    const confirmed = window.confirm(`Excluir a evidência "${evidence.description}"?`);
    if (!confirmed) return;
    atlas.deleteEvidence(evidence.id, user);
    if (editingId === evidence.id) cancelEdit();
  }

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
                <TableHead>Prévia</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Incidente</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Integridade</TableHead>
                <TableHead>Coletado por</TableHead>
                <TableHead>Coletado em</TableHead>
                <TableHead>Procedência</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evidences.map((evidence) => {
                const isEditing = editingId === evidence.id;

                return (
                  <TableRow key={evidence.id}>
                    <TableCell><EvidenceThumbnail evidence={evidence} /></TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={draft.type}
                          onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as EvidenceType }))}
                          className="min-w-36"
                        >
                          {evidenceTypes.map((type) => (
                            <option key={type}>{type}</option>
                          ))}
                        </Select>
                      ) : (
                        <Badge>{evidence.type}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-52">
                        {isEditing ? (
                          <Input
                            value={draft.description}
                            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                            aria-label="Descrição da evidência"
                          />
                        ) : (
                          <p className="font-medium text-atlas-text">{evidence.description}</p>
                        )}
                        {evidence.fileName ? <p className="mt-1 text-xs text-atlas-muted">{evidence.fileName}</p> : null}
                      </div>
                    </TableCell>
                    <TableCell><Link className="text-atlas-action" href={`${viewBasePath}/incidents/${evidence.incidentId}`}>Abrir</Link></TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={draft.source}
                          onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value }))}
                          aria-label="Fonte da evidência"
                          className="min-w-48"
                        />
                      ) : (
                        evidence.source
                      )}
                    </TableCell>
                    <TableCell>{evidence.integrity}</TableCell>
                    <TableCell>{evidence.collectedBy}</TableCell>
                    <TableCell>{formatDateTime(evidence.collectedAt)}</TableCell>
                    <TableCell><ProvenanceBadge value={evidence.provenanceType} /></TableCell>
                    <TableCell>
                      {mayWrite ? (
                        <ItemActions
                          isEditing={isEditing}
                          onEdit={() => startEdit(evidence)}
                          onSave={() => saveEdit(evidence.id)}
                          onCancel={cancelEdit}
                          onDelete={() => removeEvidence(evidence)}
                          editLabel="Editar evidência"
                          deleteLabel="Excluir evidência"
                        />
                      ) : (
                        <span className="text-xs text-atlas-muted">Somente leitura</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
