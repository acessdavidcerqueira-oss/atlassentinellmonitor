"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ItemActions } from "@/components/ui/item-actions";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { LightweightAreaChart, LightweightScatter } from "@/components/ui/lightweight-charts";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";
import { canWrite } from "@/features/auth/auth";
import type { Narrative } from "@/types/domain";

interface NarrativeDraft {
  name: string;
  centralMessage: string;
  status: Narrative["status"];
  volume: string;
  growth: string;
  recommendation: string;
}

const narrativeStatuses: Narrative["status"][] = ["em observação", "em crescimento", "estável", "mitigada"];

export function NarrativeRadar() {
  const atlas = useAtlas();
  const { user } = useAuth();
  const mayWrite = !atlas.readOnly && canWrite(user);
  const { narratives, incidents } = atlas;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NarrativeDraft>({
    name: "",
    centralMessage: "",
    status: "em observação",
    volume: "0",
    growth: "0",
    recommendation: ""
  });
  const bubbles = narratives.map((narrative) => ({
    name: narrative.name,
    size: narrative.volume,
    x: narrative.growth,
    y: narrative.riskScore
  }));
  const timeline = narratives.map((narrative) => ({
    name: narrative.name,
    crescimento: narrative.growth,
    velocidade: narrative.velocity
  }));

  function startEdit(narrative: Narrative) {
    setEditingId(narrative.id);
    setDraft({
      name: narrative.name,
      centralMessage: narrative.centralMessage,
      status: narrative.status,
      volume: String(narrative.volume),
      growth: String(narrative.growth),
      recommendation: narrative.recommendation
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({
      name: "",
      centralMessage: "",
      status: "em observação",
      volume: "0",
      growth: "0",
      recommendation: ""
    });
  }

  function saveEdit(narrativeId: string) {
    if (!user || !mayWrite) return;
    const volume = Number(draft.volume);
    const growth = Number(draft.growth);
    atlas.updateNarrative(
      narrativeId,
      {
        name: draft.name.trim() || "Narrativa sem nome",
        centralMessage: draft.centralMessage.trim(),
        description: draft.centralMessage.trim(),
        status: draft.status,
        volume: Number.isFinite(volume) ? Math.max(0, volume) : 0,
        growth: Number.isFinite(growth) ? growth : 0,
        recommendation: draft.recommendation.trim()
      },
      user
    );
    cancelEdit();
  }

  function deleteNarrative(narrative: Narrative) {
    if (!user || !mayWrite) return;
    const confirmed = window.confirm(`Excluir a narrativa "${narrative.name}"?`);
    if (!confirmed) return;
    atlas.deleteNarrative(narrative.id, user);
    if (editingId === narrative.id) cancelEdit();
  }

  return (
    <div>
      <PageTitle
        title="Narrative Radar"
        description="Visualiza narrativas, crescimento, volume, fontes e recomendações. Autoria ou coordenação só aparecem quando há evidência suficiente."
        actions={<ReportActionButton theme="narrativas" />}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Bubble chart de risco e crescimento</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <LightweightScatter data={bubbles} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Timeline de crescimento</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <LightweightAreaChart
                data={timeline}
                xKey="name"
                series={[
                  { key: "crescimento", label: "Crescimento", color: "#48CFF2", fill: "#48CFF2" },
                  { key: "velocidade", label: "Velocidade", color: "#FBBF24", fill: "#FBBF24" }
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {narratives.map((narrative) => {
            const isEditing = editingId === narrative.id;

            return (
              <Card key={narrative.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="grid gap-2">
                          <Input
                            value={draft.name}
                            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                            aria-label="Nome da narrativa"
                          />
                          <Textarea
                            value={draft.centralMessage}
                            onChange={(event) => setDraft((current) => ({ ...current, centralMessage: event.target.value }))}
                            aria-label="Mensagem central da narrativa"
                            className="min-h-20"
                          />
                        </div>
                      ) : (
                        <>
                          <h2 className="font-display text-lg font-semibold">{narrative.name}</h2>
                          <p className="mt-1 text-sm text-atlas-muted">{narrative.centralMessage}</p>
                        </>
                      )}
                    </div>
                    <div className="flex shrink-0 items-start gap-2">
                      <RiskBadge level={narrative.riskScore > 60 ? "Alto" : narrative.riskScore > 40 ? "Moderado" : "Baixo"} score={narrative.riskScore} />
                      {mayWrite ? (
                        <ItemActions
                          isEditing={isEditing}
                          onEdit={() => startEdit(narrative)}
                          onSave={() => saveEdit(narrative.id)}
                          onCancel={cancelEdit}
                          onDelete={() => deleteNarrative(narrative)}
                          editLabel="Editar narrativa"
                          deleteLabel="Excluir narrativa"
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <Select
                          value={draft.status}
                          onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as Narrative["status"] }))}
                          className="max-w-48"
                        >
                          {narrativeStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </Select>
                        <Input
                          type="number"
                          value={draft.volume}
                          onChange={(event) => setDraft((current) => ({ ...current, volume: event.target.value }))}
                          aria-label="Volume da narrativa"
                          className="max-w-28"
                        />
                        <Input
                          type="number"
                          value={draft.growth}
                          onChange={(event) => setDraft((current) => ({ ...current, growth: event.target.value }))}
                          aria-label="Crescimento da narrativa"
                          className="max-w-28"
                        />
                      </>
                    ) : (
                      <>
                        <Badge>{narrative.status}</Badge>
                        <Badge variant="muted">Volume {narrative.volume}</Badge>
                        <Badge variant="muted">Crescimento {narrative.growth}%</Badge>
                      </>
                    )}
                    <ProvenanceBadge value={narrative.provenanceType} />
                  </div>
                  {isEditing ? (
                    <Textarea
                      value={draft.recommendation}
                      onChange={(event) => setDraft((current) => ({ ...current, recommendation: event.target.value }))}
                      aria-label="Recomendação da narrativa"
                      className="mt-3"
                    />
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-atlas-muted">{narrative.recommendation}</p>
                  )}
                  <div className="mt-3 text-xs text-atlas-muted">
                    Conteúdos relacionados:{" "}
                    {incidents.filter((incident) => narrative.incidentIds.includes(incident.id)).map((incident) => incident.title).join(" · ") || "Não disponível"}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
