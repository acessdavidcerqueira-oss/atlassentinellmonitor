"use client";

import Link from "next/link";
import { useState } from "react";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ItemActions } from "@/components/ui/item-actions";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { LightweightAreaChart } from "@/components/ui/lightweight-charts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";
import { canWrite } from "@/features/auth/auth";
import { formatDateTime } from "@/utils/date";
import type { Indicator, IndicatorType, RiskLevel } from "@/types/domain";
import { indicatorTypes } from "@/types/domain";

interface IndicatorDraft {
  value: string;
  type: IndicatorType;
  severity: RiskLevel;
  status: Indicator["status"];
}

const indicatorStatuses: Indicator["status"][] = ["novo", "em validação", "ativo", "contido", "arquivado"];
const severityOptions: RiskLevel[] = ["Informativo", "Baixo", "Moderado", "Alto", "Crítico"];

export function CtiView() {
  const atlas = useAtlas();
  const { user } = useAuth();
  const mayWrite = !atlas.readOnly && canWrite(user);
  const { indicators, incidents, viewBasePath } = atlas;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<IndicatorDraft>({
    value: "",
    type: "Outro",
    severity: "Baixo",
    status: "novo"
  });
  const cyberIncidents = incidents.filter((incident) =>
    ["Phishing", "Domínio fraudulento", "Malware", "Vazamento de credencial", "Ataque contra conta", "Ataque contra site", "Incidente cibernético"].includes(incident.category)
  );
  const timeline = cyberIncidents.map((incident) => ({
    date: incident.publishedAt.slice(0, 10),
    risco: incident.riskScore,
    threat: incident.threatLevel
  }));

  function startEdit(indicator: Indicator) {
    setEditingId(indicator.id);
    setDraft({
      value: indicator.value,
      type: indicator.type,
      severity: indicator.severity,
      status: indicator.status
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({ value: "", type: "Outro", severity: "Baixo", status: "novo" });
  }

  function saveEdit(indicatorId: string) {
    if (!user || !mayWrite) return;
    atlas.updateIndicator(
      indicatorId,
      {
        value: draft.value.trim() || "Indicador sem valor",
        type: draft.type,
        severity: draft.severity,
        status: draft.status
      },
      user
    );
    cancelEdit();
  }

  function deleteIndicator(indicator: Indicator) {
    if (!user || !mayWrite) return;
    const confirmed = window.confirm(`Excluir o indicador "${indicator.value}"?`);
    if (!confirmed) return;
    atlas.deleteIndicator(indicator.id, user);
    if (editingId === indicator.id) cancelEdit();
  }

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
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indicators.map((indicator) => {
                const isEditing = editingId === indicator.id;

                return (
                  <TableRow key={indicator.id}>
                    <TableCell className="font-mono text-xs">
                      {isEditing ? (
                        <Input
                          value={draft.value}
                          onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
                          aria-label="Valor do indicador"
                          className="min-w-48 font-mono"
                        />
                      ) : (
                        indicator.value
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={draft.type}
                          onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as IndicatorType }))}
                          className="min-w-40"
                        >
                          {indicatorTypes.map((type) => (
                            <option key={type}>{type}</option>
                          ))}
                        </Select>
                      ) : (
                        <Badge>{indicator.type}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(indicator.firstSeen)}</TableCell>
                    <TableCell>{formatDateTime(indicator.lastSeen)}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={draft.severity}
                          onChange={(event) => setDraft((current) => ({ ...current, severity: event.target.value as RiskLevel }))}
                          className="min-w-36"
                        >
                          {severityOptions.map((severity) => (
                            <option key={severity}>{severity}</option>
                          ))}
                        </Select>
                      ) : (
                        <RiskBadge level={indicator.severity} />
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={draft.status}
                          onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as Indicator["status"] }))}
                          className="min-w-36"
                        >
                          {indicatorStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </Select>
                      ) : (
                        indicator.status
                      )}
                    </TableCell>
                    <TableCell>
                      {indicator.incidentIds.map((id) => (
                        <Link key={id} className="mr-2 text-atlas-action" href={`${viewBasePath}/incidents/${id}`}>
                          Abrir
                        </Link>
                      ))}
                    </TableCell>
                    <TableCell><ProvenanceBadge value={indicator.provenanceType} /></TableCell>
                    <TableCell>
                      {mayWrite ? (
                        <ItemActions
                          isEditing={isEditing}
                          onEdit={() => startEdit(indicator)}
                          onSave={() => saveEdit(indicator.id)}
                          onCancel={cancelEdit}
                          onDelete={() => deleteIndicator(indicator)}
                          editLabel="Editar indicador"
                          deleteLabel="Excluir indicador"
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
