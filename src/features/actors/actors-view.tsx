"use client";

import Link from "next/link";
import { useState } from "react";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ItemActions } from "@/components/ui/item-actions";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";
import { canWrite } from "@/features/auth/auth";
import { formatDateTime } from "@/utils/date";
import type { Actor, ActorType } from "@/types/domain";
import { actorTypes } from "@/types/domain";

interface ActorDraft {
  name: string;
  handle: string;
  platform: string;
  type: ActorType;
  followers: string;
}

export function ActorsView() {
  const atlas = useAtlas();
  const { user } = useAuth();
  const mayWrite = !atlas.readOnly && canWrite(user);
  const { actors, viewBasePath } = atlas;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActorDraft>({
    name: "",
    handle: "",
    platform: "",
    type: "Origem indeterminada",
    followers: ""
  });

  function startEdit(actor: Actor) {
    setEditingId(actor.id);
    setDraft({
      name: actor.name,
      handle: actor.handle,
      platform: actor.platform,
      type: actor.type,
      followers: actor.followers ? String(actor.followers) : ""
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({ name: "", handle: "", platform: "", type: "Origem indeterminada", followers: "" });
  }

  function saveEdit(actorId: string) {
    if (!user || !mayWrite) return;
    const followers = Number(draft.followers);
    atlas.updateActor(
      actorId,
      {
        name: draft.name.trim() || "Ator sem nome",
        handle: draft.handle.trim(),
        platform: draft.platform.trim() || "Não informado",
        type: draft.type,
        followers: Number.isFinite(followers) && followers > 0 ? followers : undefined
      },
      user
    );
    cancelEdit();
  }

  function deleteActor(actor: Actor) {
    if (!user || !mayWrite) return;
    const confirmed = window.confirm(`Excluir o ator/página "${actor.name}"?`);
    if (!confirmed) return;
    atlas.deleteActor(actor.id, user);
    if (editingId === actor.id) cancelEdit();
  }

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
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actors.map((actor) => {
                const isEditing = editingId === actor.id;

                return (
                  <TableRow key={actor.id}>
                    <TableCell>
                      <div className="min-w-52">
                        {isEditing ? (
                          <Input
                            value={draft.name}
                            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                            aria-label="Nome do ator"
                          />
                        ) : (
                          <div className="font-medium">{actor.name}</div>
                        )}
                        {isEditing ? (
                          <Input
                            value={draft.handle}
                            onChange={(event) => setDraft((current) => ({ ...current, handle: event.target.value }))}
                            className="mt-2"
                            aria-label="Handle do ator"
                          />
                        ) : (
                          <div className="text-xs text-atlas-muted">{actor.handle || actor.url || "Sem handle"}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={draft.type}
                          onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as ActorType }))}
                          className="min-w-52"
                        >
                          {actorTypes.map((type) => (
                            <option key={type}>{type}</option>
                          ))}
                        </Select>
                      ) : (
                        <Badge variant="muted">{actor.type}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={draft.platform}
                          onChange={(event) => setDraft((current) => ({ ...current, platform: event.target.value }))}
                          aria-label="Plataforma do ator"
                          className="min-w-36"
                        />
                      ) : (
                        actor.platform
                      )}
                    </TableCell>
                    <TableCell>{actor.occurrenceCount}</TableCell>
                    <TableCell>{actor.recurrence}</TableCell>
                    <TableCell><RiskBadge level={actor.riskScore >= 80 ? "Crítico" : actor.riskScore >= 61 ? "Alto" : actor.riskScore >= 41 ? "Moderado" : "Baixo"} score={actor.riskScore} /></TableCell>
                    <TableCell>{actor.confidenceLevel}</TableCell>
                    <TableCell>{formatDateTime(actor.lastActivity)}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          value={draft.followers}
                          onChange={(event) => setDraft((current) => ({ ...current, followers: event.target.value }))}
                          aria-label="Seguidores do ator"
                          className="min-w-28"
                        />
                      ) : actor.followers ? (
                        actor.followers
                      ) : (
                        <ProvenanceBadge value={actor.followersProvenance} />
                      )}
                    </TableCell>
                    <TableCell>
                      {mayWrite ? (
                        <ItemActions
                          isEditing={isEditing}
                          onEdit={() => startEdit(actor)}
                          onSave={() => saveEdit(actor.id)}
                          onCancel={cancelEdit}
                          onDelete={() => deleteActor(actor)}
                          editLabel="Editar ator ou página"
                          deleteLabel="Excluir ator ou página"
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
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {actors.slice(0, 4).map((actor) => (
          <Card key={actor.id}>
            <CardContent className="p-4">
              <h2 className="font-display text-lg font-semibold">{actor.name}</h2>
              <p className="mt-2 text-sm text-atlas-muted">{actor.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {actor.incidentIds.map((id) => (
                  <Link key={id} href={`${viewBasePath}/incidents/${id}`}>
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
