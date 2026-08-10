"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, FilePlus, Link2, Save, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";
import { canWrite } from "@/features/auth/auth";
import { createId } from "@/utils/id";
import { isoNow, formatDateTime } from "@/utils/date";
import { threatLevelLabel } from "@/services/risk";
import { fakeNewsLabel } from "@/services/simple-report";
import type { Evidence, EvidenceType, IncidentStatus } from "@/types/domain";
import { evidenceTypes, incidentStatuses } from "@/types/domain";

export function IncidentDetail({ incidentId }: { incidentId?: string }) {
  const params = useParams<{ id: string }>();
  const atlas = useAtlas();
  const { user } = useAuth();
  const mayWrite = !atlas.readOnly && canWrite(user);
  const resolvedIncidentId = incidentId ?? params.id;
  const incident = atlas.incidents.find((item) => item.id === resolvedIncidentId);
  const [overrideScore, setOverrideScore] = useState(incident?.riskScore ?? 0);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [status, setStatus] = useState<IncidentStatus>(incident?.status ?? "Novo");
  const [actorId, setActorId] = useState("");
  const [narrativeId, setNarrativeId] = useState("");
  const [evidence, setEvidence] = useState({
    type: "URL" as EvidenceType,
    description: "",
    url: "",
    source: ""
  });

  const evidences = useMemo(
    () => atlas.evidences.filter((item) => item.incidentId === incident?.id),
    [atlas.evidences, incident?.id]
  );
  const logs = useMemo(
    () => atlas.auditLogs.filter((log) => log.entityId === incident?.id || evidences.some((item) => item.id === log.entityId)),
    [atlas.auditLogs, evidences, incident?.id]
  );

  if (!incident) {
    return (
      <Card>
        <CardContent className="p-8 text-atlas-muted">Incidente não encontrado.</CardContent>
      </Card>
    );
  }
  const currentIncident = incident;

  function applyOverride() {
    if (!user || !mayWrite || overrideJustification.trim().length < 10) return;
    atlas.overrideRisk(currentIncident.id, overrideScore, overrideJustification, user);
    setOverrideJustification("");
  }

  function applyStatus() {
    if (!user || !mayWrite) return;
    atlas.updateIncident(currentIncident.id, { status }, user, "Status alterado manualmente no detalhe do incidente.");
  }

  function addEvidence() {
    if (!user || !mayWrite || !evidence.description || !evidence.source) return;
    const newEvidence: Evidence = {
      id: createId("ev"),
      incidentId: currentIncident.id,
      type: evidence.type,
      description: evidence.description,
      url: evidence.url,
      collectedBy: user.name,
      collectedAt: isoNow(),
      source: evidence.source,
      integrity: "metadados pendentes",
      observation: "",
      confidenceLevel: "medium",
      provenanceType: currentIncident.provenanceType
    };
    atlas.addEvidence(newEvidence, user);
    setEvidence({ type: "URL", description: "", url: "", source: "" });
  }

  function relateActor() {
    if (!user || !mayWrite || !actorId || currentIncident.relatedActorIds.includes(actorId)) return;
    atlas.updateIncident(
      currentIncident.id,
      { relatedActorIds: [...currentIncident.relatedActorIds, actorId] },
      user,
      "Relação com ator adicionada pelo analista."
    );
    setActorId("");
  }

  function relateNarrative() {
    if (!user || !mayWrite || !narrativeId || currentIncident.relatedNarrativeIds.includes(narrativeId)) return;
    atlas.updateIncident(
      currentIncident.id,
      { relatedNarrativeIds: [...currentIncident.relatedNarrativeIds, narrativeId] },
      user,
      "Relação com narrativa adicionada pelo analista."
    );
    setNarrativeId("");
  }

  const relatedActors = atlas.actors.filter((actor) => incident.relatedActorIds.includes(actor.id));
  const relatedNarratives = atlas.narratives.filter((narrative) => incident.relatedNarrativeIds.includes(narrative.id));
  const pageName = incident.authorName || incident.authorHandle || incident.domain || incident.platform;
  const reach = incident.reachValue ? formatReach(incident.reachValue) : "Não disponível";

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="grid gap-5 p-5 xl:grid-cols-[1fr_360px]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={fakeNewsLabel(incident) === "Sim" ? "critical" : fakeNewsLabel(incident) === "Suspeita" ? "moderate" : "muted"}>
                Fake news: {fakeNewsLabel(incident)}
              </Badge>
              <Badge variant="muted">{incident.status}</Badge>
              <ProvenanceBadge value={incident.provenanceType} />
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold text-atlas-text">{pageName}</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-atlas-muted">{incident.summary}</p>
            <div className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
              <Info label="Página" value={pageName || "Não disponível"} />
              <Info label="Alcance estimado" value={reach} />
              <Info label="Data" value={formatDateTime(incident.publishedAt)} />
              <Info label="Status" value={incident.status} />
              <Info label="URL" value={incident.url || "Não disponível"} />
              <Info label="Observação" value={incident.analystNotes || "Sem observação"} />
            </div>
          </div>
          <div className="rounded-md border border-atlas-border bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase text-atlas-muted">Classificação automática</span>
              <RiskBadge level={incident.riskLevel} score={incident.riskScore} />
            </div>
            <div className="mt-5">
              <div className="h-2 rounded-full bg-white/8">
                <div className="h-2 rounded-full bg-atlas-action" style={{ width: `${incident.riskScore}%` }} />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs uppercase text-atlas-muted">Ameaça à pessoa</span>
              <Badge variant={incident.threatLevel >= 4 ? "critical" : "muted"}>
                L{incident.threatLevel} · {threatLevelLabel(incident.threatLevel)}
              </Badge>
            </div>
            <p className="mt-4 text-sm text-atlas-muted">
              Score físico: {incident.physicalThreatScore}. Incidentes nível 4 ou 5 aparecem imediatamente no Command Center.
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-atlas-muted">
              <div>
                <Label>O que disseram</Label>
                <p className="mt-2 rounded-md border border-atlas-border bg-[#071126]/70 p-3">{incident.content || "Não disponível"}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextBlock label="Observação" value={incident.analystNotes} />
                <TextBlock label="Encaminhamento" value={incident.recommendedAction} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Info label="Responsável atual" value={incident.assignedTo || "Não atribuído"} />
                <Info label="Próxima ação" value={incident.nextAction || "Não disponível"} />
                <Info label="Prazo" value={incident.dueAt ? formatDateTime(incident.dueAt) : "Não disponível"} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fatores do score</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {Object.entries(incident.riskFactors).map(([key, value]) => (
                <Factor key={key} label={key} value={value} />
              ))}
            </CardContent>
          </Card>

          <Card id="evidencias">
            <CardHeader>
              <CardTitle>Evidências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {evidences.length ? (
                evidences.map((item) => (
                  <div key={item.id} className="rounded-md border border-atlas-border bg-white/5 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{item.type}</Badge>
                      <ProvenanceBadge value={item.provenanceType} />
                      <span className="text-xs text-atlas-muted">{formatDateTime(item.collectedAt)}</span>
                    </div>
                    <p className="mt-2 font-medium text-atlas-text">{item.description}</p>
                    <p className="mt-1 text-sm text-atlas-muted">{item.url || item.source}</p>
                    <p className="mt-1 text-xs text-atlas-muted">Integridade: {item.integrity}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-atlas-muted">Não disponível.</p>
              )}

              {mayWrite ? (
                <div className="grid gap-3 rounded-md border border-atlas-border bg-white/5 p-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={evidence.type}
                      onChange={(event) => setEvidence({ ...evidence, type: event.target.value as EvidenceType })}
                    >
                      {evidenceTypes.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fonte</Label>
                    <Input
                      value={evidence.source}
                      onChange={(event) => setEvidence({ ...evidence, source: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Descrição</Label>
                    <Input
                      value={evidence.description}
                      onChange={(event) => setEvidence({ ...evidence, description: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Arquivo ou URL</Label>
                    <Input
                      value={evidence.url}
                      onChange={(event) => setEvidence({ ...evidence, url: event.target.value })}
                    />
                  </div>
                  <Button type="button" onClick={addEvidence}>
                    <FilePlus className="h-4 w-4" />
                    Adicionar evidência
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          {mayWrite ? (
            <Card>
              <CardHeader>
                <CardTitle>Operação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onChange={(event) => setStatus(event.target.value as IncidentStatus)}>
                    {incidentStatuses.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </div>
                <Button type="button" variant="secondary" onClick={applyStatus}>
                  <Save className="h-4 w-4" />
                  Alterar status
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!user || !mayWrite) return;
                    atlas.updateIncident(incident.id, { status: "Falso positivo" }, user, "Marcado como falso positivo pelo analista.");
                  }}
                >
                  Marcar falso positivo
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (!user || !mayWrite) return;
                    atlas.updateIncident(incident.id, { status: "Escalonado" }, user, "Escalonamento manual para equipe responsável.");
                  }}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Escalonar
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {mayWrite ? (
            <Card>
              <CardHeader>
                <CardTitle>Override humano de risco</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label>Novo score</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={overrideScore}
                  onChange={(event) => setOverrideScore(Number(event.target.value))}
                />
                <Label>Justificativa obrigatória</Label>
                <Textarea
                  value={overrideJustification}
                  onChange={(event) => setOverrideJustification(event.target.value)}
                />
                <Button type="button" onClick={applyOverride} disabled={overrideJustification.trim().length < 10}>
                  <ShieldAlert className="h-4 w-4" />
                  Aplicar override
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Relações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Atores relacionados</Label>
                <div className="flex flex-wrap gap-2">
                  {relatedActors.map((actor) => (
                    <Badge key={actor.id}>{actor.name}</Badge>
                  ))}
                </div>
                {mayWrite ? (
                  <div className="flex gap-2">
                    <Select value={actorId} onChange={(event) => setActorId(event.target.value)}>
                      <option value="">Selecionar ator</option>
                      {atlas.actors.map((actor) => (
                        <option key={actor.id} value={actor.id}>
                          {actor.name}
                        </option>
                      ))}
                    </Select>
                    <Button type="button" variant="secondary" size="icon" onClick={relateActor} aria-label="Relacionar ator">
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Narrativas relacionadas</Label>
                <div className="flex flex-wrap gap-2">
                  {relatedNarratives.map((narrative) => (
                    <Badge key={narrative.id}>{narrative.name}</Badge>
                  ))}
                </div>
                {mayWrite ? (
                  <div className="flex gap-2">
                    <Select value={narrativeId} onChange={(event) => setNarrativeId(event.target.value)}>
                      <option value="">Selecionar narrativa</option>
                      {atlas.narratives.map((narrative) => (
                        <option key={narrative.id} value={narrative.id}>
                          {narrative.name}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={relateNarrative}
                      aria-label="Relacionar narrativa"
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {["Coletado", "Triado", "Verificado", "Escalonado", "Tratado", "Resolvido", "Arquivado"].map((item, index) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className={`h-4 w-4 ${index <= 3 ? "text-atlas-action" : "text-atlas-muted"}`} />
                    <span className={index <= 3 ? "text-atlas-text" : "text-atlas-muted"}>{item}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de alterações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {logs.length ? (
                logs.map((log) => (
                  <div key={log.id} className="rounded-md border border-atlas-border bg-white/5 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-atlas-text">{log.action}</span>
                      <span className="text-xs text-atlas-muted">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-atlas-muted">{log.userName}</p>
                    {log.justification ? <p className="mt-2 text-xs text-atlas-muted">{log.justification}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-atlas-muted">Não disponível.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>

      <Button asChild variant="secondary">
        <Link href={`${atlas.viewBasePath}/incidents`}>Voltar para incidentes</Link>
      </Button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-atlas-border bg-white/5 p-3">
      <p className="text-xs uppercase text-atlas-muted">{label}</p>
      <p className="mt-1 break-words text-sm text-atlas-text">{value || "Não disponível"}</p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <p className="mt-2 rounded-md border border-atlas-border bg-white/5 p-3">{value || "Não disponível"}</p>
    </div>
  );
}

function Factor({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-atlas-muted">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/8">
        <div className="h-2 rounded-full bg-atlas-action" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function formatReach(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}
