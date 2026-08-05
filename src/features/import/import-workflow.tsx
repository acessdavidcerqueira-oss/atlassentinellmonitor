"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { atlasCsvColumns, type AtlasCsvColumn } from "@/schemas/csv";
import { previewCsvImport, type ImportPreview, type ImportSourceFormat } from "@/services/csv-import";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";
import { canWrite } from "@/features/auth/auth";

export function ImportWorkflow() {
  const atlas = useAtlas();
  const { user } = useAuth();
  const mayWrite = canWrite(user);
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("");
  const [format, setFormat] = useState<ImportSourceFormat>("atlas");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [mapping, setMapping] = useState<Record<string, AtlasCsvColumn>>({
    title: "title",
    url: "url",
    date: "published_at",
    text: "content",
    source: "platform",
    author: "author_name"
  });

  const activeEntity = atlas.monitoredEntities.find((entity) => entity.id === atlas.activeMonitoredEntityId);
  const sourceColumns = useMemo(() => {
    if (!text) return [];
    const header = text.split(/\r?\n/)[0] ?? "";
    return header.split(",").map((item) => item.trim()).filter(Boolean);
  }, [text]);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setText(await file.text());
    setPreview(null);
    setConfirmed(false);
  }

  function runPreview() {
    if (!activeEntity) return;
    const nextPreview = previewCsvImport({
      fileName: fileName || "inline.csv",
      text,
      sourceFormat: format,
      monitoredEntityId: atlas.activeMonitoredEntityId,
      monitoredEntityName: activeEntity.name,
      existingIncidents: atlas.incidents,
      mapping
    });
    setPreview(nextPreview);
    setConfirmed(false);
  }

  function confirmImport() {
    if (!preview || !user || !mayWrite) return;
    atlas.importIncidents(preview.incidents, preview.report, user);
    setConfirmed(true);
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Importação de dados</CardTitle>
            <ReportActionButton theme="geral" label="Novo report manual" />
          </div>
          <p className="text-sm text-atlas-muted">
            Aceita CSV Atlas padrão, Brand24 e CSV genérico com mapeamento manual. Todas as células são sanitizadas e
            células iniciadas por =, +, - ou @ são neutralizadas para impedir CSV injection.
          </p>
          {!mayWrite ? (
            <p className="mt-3 rounded-md border border-atlas-border bg-white/5 p-3 text-sm text-atlas-muted">
              Perfil Viewer: você pode validar e consultar, mas não confirmar importações.
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_260px_220px]">
          <div className="space-y-2">
            <Label>Arquivo CSV</Label>
            <Input type="file" accept=".csv,text/csv" onChange={onFile} />
          </div>
          <div className="space-y-2">
            <Label>Formato</Label>
            <Select value={format} onChange={(event) => setFormat(event.target.value as ImportSourceFormat)}>
              <option value="atlas">CSV Atlas padrão</option>
              <option value="brand24">Exportação Brand24</option>
              <option value="generic">CSV genérico</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="button" className="w-full" disabled={!text} onClick={runPreview}>
              <FileUp className="h-4 w-4" />
              Validar preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {format === "generic" ? (
        <Card>
          <CardHeader>
            <CardTitle>Mapeamento manual</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sourceColumns.map((column) => (
              <div key={column} className="space-y-2">
                <Label>{column}</Label>
                <Select
                  value={mapping[column] ?? ""}
                  onChange={(event) =>
                    setMapping((current) => ({
                      ...current,
                      [column]: event.target.value as AtlasCsvColumn
                    }))
                  }
                >
                  <option value="">Ignorar</option>
                  {atlasCsvColumns.map((atlasColumn) => (
                    <option key={atlasColumn} value={atlasColumn}>
                      {atlasColumn}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>CSV de teste rápido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-atlas-muted">
            Cole um CSV aqui quando não quiser selecionar arquivo. Os templates ficam em `templates/`.
          </p>
          <textarea
            className="h-32 w-full rounded-md border border-atlas-border bg-[#071126]/90 p-3 font-mono text-xs text-atlas-text outline-none"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setFileName("inline.csv");
              setPreview(null);
            }}
            placeholder="id,monitored_entity,collected_at,published_at,title..."
          />
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Relatório de validação</CardTitle>
              <p className="mt-1 text-sm text-atlas-muted">
                {preview.report.totalRows} linhas · {preview.report.validRows} válidas ·{" "}
                {preview.report.duplicateRows} duplicadas · {preview.report.errorRows} com erro
              </p>
            </div>
            <Button type="button" disabled={!preview.incidents.length || confirmed || !mayWrite} onClick={confirmImport}>
              <ShieldCheck className="h-4 w-4" />
              {confirmed ? "Importado" : "Confirmar importação"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {preview.report.issues.length ? (
              <div className="space-y-2">
                {preview.report.issues.map((issue, index) => (
                  <div
                    key={`${issue.row}-${index}`}
                    className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
                      issue.severity === "error"
                        ? "border-red-400/40 bg-red-500/10 text-red-100"
                        : "border-amber-300/30 bg-amber-400/10 text-amber-100"
                    }`}
                  >
                    <AlertCircle className="h-4 w-4" />
                    Linha {issue.row}: {issue.field ? `${issue.field} · ` : ""}
                    {issue.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
                Nenhum erro ou duplicidade detectado.
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Procedência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.incidents.slice(0, 12).map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell>{incident.title}</TableCell>
                      <TableCell>{incident.category}</TableCell>
                      <TableCell>{incident.platform}</TableCell>
                      <TableCell>{incident.riskScore}</TableCell>
                      <TableCell>
                        <Badge variant={incident.provenanceType === "SIMULACAO_UI" ? "muted" : "default"}>
                          {incident.provenanceType}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
