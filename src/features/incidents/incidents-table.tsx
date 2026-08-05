"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, ExternalLink, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAtlas } from "@/features/state/atlas-store";
import { exportIncidentsCsv } from "@/services/csv-import";
import { fakeNewsLabel } from "@/services/simple-report";
import { formatDateTime } from "@/utils/date";

export function IncidentsTable() {
  const state = useAtlas();
  const [keyword, setKeyword] = useState("");
  const [fakeNews, setFakeNews] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    return state.incidents.filter((incident) => {
      const query = keyword.toLowerCase();
      const matchesKeyword =
        !query ||
        [incident.title, incident.summary, incident.content, incident.authorName, incident.authorHandle, incident.analystNotes]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesFakeNews = fakeNews === "all" || fakeNewsLabel(incident) === fakeNews;
      const matchesStatus = status === "all" || incident.status === status;
      return matchesKeyword && matchesFakeNews && matchesStatus && !incident.deletedAt;
    });
  }, [fakeNews, keyword, state.incidents, status]);

  const statuses = Array.from(new Set(state.incidents.map((incident) => incident.status)));

  function downloadCsv() {
    const csv = exportIncidentsCsv(state);
    downloadText("atlas-sentinel-incidents.csv", csv, "text/csv");
  }

  function downloadJson() {
    downloadText("atlas-sentinel-incidents.json", JSON.stringify(filtered, null, 2), "application/json");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Reports</CardTitle>
            <p className="mt-1 text-sm text-atlas-muted">
              Lista simples para acompanhar páginas, possíveis fake news, o que foi dito e alcance estimado.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ReportActionButton theme="geral" label="Novo report" />
            <Button variant="secondary" onClick={downloadCsv}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="secondary" onClick={downloadJson}>
              <FileText className="h-4 w-4" />
              JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-atlas-muted" />
              <Input className="pl-9" placeholder="Buscar página ou texto" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </div>
            <Select value={fakeNews} onChange={(event) => setFakeNews(event.target.value)} aria-label="Fake news">
              <option value="all">Fake news: todos</option>
              <option>Sim</option>
              <option>Suspeita</option>
              <option>Não</option>
              <option>Não sei</option>
            </Select>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status">
              <option value="all">Todos os status</option>
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Página</TableHead>
                <TableHead>Fake news</TableHead>
                <TableHead>O que disseram</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead>Alcance estimado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length ? (
                filtered.map((incident) => {
                  const page = incident.authorName || incident.authorHandle || incident.domain || incident.platform;
                  const fakeNews = fakeNewsLabel(incident);
                  const fakeNewsVariant = fakeNews === "Sim" ? "critical" : fakeNews === "Suspeita" ? "moderate" : fakeNews === "Não" ? "success" : "muted";

                  return (
                    <TableRow key={incident.id}>
                      <TableCell>
                        <div className="min-w-[180px]">
                          <Link href={`/incidents/${incident.id}`} className="font-medium text-atlas-ice hover:text-atlas-action">
                            {page || "Não disponível"}
                          </Link>
                          <p className="mt-1 max-w-[260px] truncate text-xs text-atlas-muted">
                            {incident.url || incident.platform}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={fakeNewsVariant}>{fakeNews}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[420px] text-sm leading-5 text-atlas-text">
                          {incident.summary || incident.content || "Não disponível"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[300px] text-sm leading-5 text-atlas-muted">
                          {incident.analystNotes || "Sem observação"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {incident.reachValue ? formatReach(incident.reachValue) : "Não disponível"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="muted">{incident.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{formatDateTime(incident.updatedAt)}</span>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="icon" aria-label="Abrir incidente">
                          <Link href={`/incidents/${incident.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-atlas-muted">
                    Não disponível para os filtros selecionados.
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

function formatReach(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function downloadText(fileName: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
