"use client";

import { FormEvent, useMemo, useState } from "react";
import { Link2, ShieldX } from "lucide-react";
import { PageTitle } from "@/components/layout/page-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/state/auth-store";
import { useAtlas } from "@/features/state/atlas-store";
import { canWrite } from "@/features/auth/auth";
import type { BlacklistEntry, BlacklistKind, BlacklistStatus } from "@/types/domain";
import { formatDateTime, isoNow } from "@/utils/date";
import { createId } from "@/utils/id";

const statusOptions: Array<{ value: BlacklistStatus; label: string }> = [
  { value: "ativo", label: "Ativo" },
  { value: "em validação", label: "Em validação" },
  { value: "monitorando", label: "Monitorando" },
  { value: "removido", label: "Removido" },
  { value: "falso positivo", label: "Falso positivo" }
];

const statusVariant: Record<BlacklistStatus, "critical" | "high" | "moderate" | "low" | "success" | "muted"> = {
  ativo: "critical",
  "em validação": "moderate",
  monitorando: "low",
  removido: "success",
  "falso positivo": "muted"
};

const initialForm = {
  value: "",
  kind: "site" as BlacklistKind,
  status: "em validação" as BlacklistStatus,
  reason: "",
  source: ""
};

export function BlacklistView() {
  const atlas = useAtlas();
  const { user } = useAuth();
  const mayWrite = !atlas.readOnly && canWrite(user);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const entries = useMemo(
    () => [...(atlas.blacklist ?? [])].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [atlas.blacklist]
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (!mayWrite) {
      setError("Seu acesso é somente visualização.");
      return;
    }
    const normalizedValue = normalizeBlacklistValue(form.value);
    if (!normalizedValue) {
      setError("Informe um site ou link.");
      return;
    }
    if (entries.some((entry) => entry.normalizedValue === normalizedValue)) {
      setError("Esse site ou link já está na blacklist.");
      return;
    }

    const now = isoNow();
    const entry: BlacklistEntry = {
      id: createId("blk"),
      value: form.value.trim(),
      normalizedValue,
      kind: form.kind,
      status: form.status,
      reason: form.reason.trim(),
      source: form.source.trim(),
      createdAt: now,
      updatedAt: now,
      createdBy: user.name
    };

    atlas.addBlacklistEntry(entry, user);
    setForm(initialForm);
    setError("");
  }

  function updateStatus(entryId: string, status: BlacklistStatus) {
    if (!user || !mayWrite) return;
    atlas.updateBlacklistStatus(entryId, status, user);
  }

  return (
    <div>
      <PageTitle
        title="Blacklist"
        description="Sites e links bloqueados, em validação ou monitoramento."
      />

      <div className={atlas.readOnly ? "grid gap-4" : "grid gap-4 xl:grid-cols-[420px_1fr]"}>
        {!atlas.readOnly ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldX className="h-5 w-5 text-red-200" />
                Novo item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="blacklist-value">Site ou link</Label>
                  <Input
                    id="blacklist-value"
                    value={form.value}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, value: event.target.value }));
                      setError("");
                    }}
                    placeholder="dominio.com ou https://..."
                    disabled={!mayWrite}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="blacklist-kind">Tipo</Label>
                    <Select
                      id="blacklist-kind"
                      value={form.kind}
                      onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as BlacklistKind }))}
                      disabled={!mayWrite}
                    >
                      <option value="site">Site</option>
                      <option value="link">Link</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blacklist-status">Status</Label>
                    <Select
                      id="blacklist-status"
                      value={form.status}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as BlacklistStatus }))}
                      disabled={!mayWrite}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blacklist-source">Origem</Label>
                  <Input
                    id="blacklist-source"
                    value={form.source}
                    onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
                    placeholder="Report, analista, monitoramento..."
                    disabled={!mayWrite}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blacklist-reason">Motivo</Label>
                  <Textarea
                    id="blacklist-reason"
                    value={form.reason}
                    onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                    placeholder="Motivo da inclusão ou observação operacional"
                    disabled={!mayWrite}
                  />
                </div>

                {error ? <p className="text-sm text-red-200">{error}</p> : null}
                {!mayWrite ? (
                  <p className="rounded-md border border-atlas-border bg-white/5 p-3 text-sm text-atlas-muted">
                    Perfil Viewer: consulta liberada, cadastro e alteração de status bloqueados.
                  </p>
                ) : null}

                <Button type="submit" disabled={!mayWrite}>
                  <Link2 className="h-4 w-4" />
                  Inserir na blacklist
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Sites e links</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length ? (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-atlas-text">{entry.value}</p>
                          <p className="text-xs text-atlas-muted">{entry.normalizedValue}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="muted">{entry.kind === "site" ? "Site" : "Link"}</Badge>
                      </TableCell>
                      <TableCell>
                        {mayWrite ? (
                          <>
                            <Select
                              value={entry.status}
                              onChange={(event) => updateStatus(entry.id, event.target.value as BlacklistStatus)}
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                            <div className="mt-2">
                              <Badge variant={statusVariant[entry.status]}>{statusLabel(entry.status)}</Badge>
                            </div>
                          </>
                        ) : (
                          <Badge variant={statusVariant[entry.status]}>{statusLabel(entry.status)}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs text-sm text-atlas-muted">{entry.reason || "Não informado"}</TableCell>
                      <TableCell>{entry.source || entry.createdBy}</TableCell>
                      <TableCell>{formatDateTime(entry.updatedAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-atlas-muted">
                      Nenhum site ou link cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function normalizeBlacklistValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    return `${url.hostname.replace(/^www\./, "").toLowerCase()}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return trimmed.replace(/^www\./, "").toLowerCase();
  }
}

function statusLabel(status: BlacklistStatus): string {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}
