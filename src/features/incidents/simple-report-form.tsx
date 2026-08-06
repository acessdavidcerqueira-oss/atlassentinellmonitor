"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getReportThemeStyle, reportThemeCssVars } from "@/components/layout/report-theme-style";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";
import { canWrite } from "@/features/auth/auth";
import { cn } from "@/lib/utils";
import {
  actorProfileTypeOptions,
  actorSocialNetworkOptions,
  fraudCaseTypeOptions,
  fraudSocialNetworkOptions,
  incidentFromSimpleReport,
  defaultThreatClassificationForTheme,
  reportRiskOptions,
  reportThreatClassificationOptions,
  reportThemeDefinitions,
  resolveActorProfileType,
  resolveActorSocialNetwork,
  resolveFraudCaseType,
  resolveFraudSocialNetwork,
  resolveReportRisk,
  resolveReportThreatClassification,
  resolveReportTheme,
  resolveThreatCaseType,
  resolveSimpleEvidenceKind,
  simpleEvidenceKindOptions,
  threatCaseTypeOptions,
  type ActorProfileType,
  type FraudCaseType,
  type FakeNewsStatus,
  type ReportRiskClassification,
  type ReportThreatClassification,
  type SimpleReportInput,
  type SimpleEvidenceKind,
  type ThreatCaseType
} from "@/services/simple-report";

const reportRiskButtonStyles: Record<
  ReportRiskClassification,
  {
    active: string;
    dot: string;
  }
> = {
  Leve: {
    active: "border-emerald-300/50 bg-emerald-400/12 text-emerald-100",
    dot: "bg-emerald-300"
  },
  Médio: {
    active: "border-sky-300/50 bg-sky-400/12 text-sky-100",
    dot: "bg-sky-300"
  },
  Moderado: {
    active: "border-amber-300/50 bg-amber-400/12 text-amber-100",
    dot: "bg-amber-300"
  },
  Alto: {
    active: "border-rose-300/50 bg-rose-400/12 text-rose-100",
    dot: "bg-rose-300"
  }
};

const fraudCaseButtonStyles: Record<
  FraudCaseType,
  {
    active: string;
    dot: string;
  }
> = {
  "Perfil fake": {
    active: "border-amber-300/50 bg-amber-400/12 text-amber-100",
    dot: "bg-amber-300"
  },
  "Perfil se passando por pessoa": {
    active: "border-orange-300/50 bg-orange-400/12 text-orange-100",
    dot: "bg-orange-300"
  }
};

const threatClassificationButtonStyles: Record<
  ReportThreatClassification,
  {
    active: string;
    dot: string;
  }
> = {
  Phishing: {
    active: "border-cyan-300/50 bg-cyan-400/12 text-cyan-100",
    dot: "bg-cyan-300"
  },
  "Fake news": {
    active: "border-violet-300/50 bg-violet-400/12 text-violet-100",
    dot: "bg-violet-300"
  },
  Hating: {
    active: "border-rose-300/50 bg-rose-400/12 text-rose-100",
    dot: "bg-rose-300"
  },
  "Ataque coordenado": {
    active: "border-fuchsia-300/50 bg-fuchsia-400/12 text-fuchsia-100",
    dot: "bg-fuchsia-300"
  },
  Invasão: {
    active: "border-red-300/55 bg-red-500/14 text-red-100",
    dot: "bg-red-300"
  },
  "Fraude/impersonação": {
    active: "border-orange-300/50 bg-orange-400/12 text-orange-100",
    dot: "bg-orange-300"
  },
  "Vazamento de dados": {
    active: "border-blue-300/50 bg-blue-400/12 text-blue-100",
    dot: "bg-blue-300"
  },
  Malware: {
    active: "border-lime-300/50 bg-lime-400/12 text-lime-100",
    dot: "bg-lime-300"
  },
  Outro: {
    active: "border-slate-300/50 bg-slate-400/12 text-slate-100",
    dot: "bg-slate-300"
  }
};

const threatCaseButtonStyles: Record<
  ThreatCaseType,
  {
    active: string;
    dot: string;
  }
> = {
  "Ameaça - Risco de vida": {
    active: "border-red-300/55 bg-red-500/14 text-red-100",
    dot: "bg-red-300"
  },
  Xingamento: {
    active: "border-orange-300/50 bg-orange-400/12 text-orange-100",
    dot: "bg-orange-300"
  },
  "Ameaça moral": {
    active: "border-amber-300/50 bg-amber-400/12 text-amber-100",
    dot: "bg-amber-300"
  },
  "Opinião ríspida": {
    active: "border-sky-300/50 bg-sky-400/12 text-sky-100",
    dot: "bg-sky-300"
  },
  "Ataque coordenado": {
    active: "border-fuchsia-300/50 bg-fuchsia-400/12 text-fuchsia-100",
    dot: "bg-fuchsia-300"
  }
};

const actorProfileButtonStyles: Record<
  ActorProfileType,
  {
    active: string;
    dot: string;
  }
> = {
  Influenciador: {
    active: "border-blue-300/50 bg-blue-400/12 text-blue-100",
    dot: "bg-blue-300"
  },
  "Pessoa exposta": {
    active: "border-cyan-300/50 bg-cyan-400/12 text-cyan-100",
    dot: "bg-cyan-300"
  }
};

const evidenceKindButtonStyles: Record<
  SimpleEvidenceKind,
  {
    active: string;
    dot: string;
  }
> = {
  Arquivo: {
    active: "border-cyan-300/50 bg-cyan-400/12 text-cyan-100",
    dot: "bg-cyan-300"
  },
  "Foto ou imagem": {
    active: "border-teal-300/50 bg-teal-400/12 text-teal-100",
    dot: "bg-teal-300"
  },
  Documento: {
    active: "border-blue-300/50 bg-blue-400/12 text-blue-100",
    dot: "bg-blue-300"
  },
  "Link de vídeo": {
    active: "border-violet-300/50 bg-violet-400/12 text-violet-100",
    dot: "bg-violet-300"
  }
};

const initialReport: SimpleReportInput = {
  page: "",
  fakeNews: "Suspeita",
  whatTheySaid: "",
  observation: "",
  estimatedReach: undefined,
  threatClassification: "Outro"
};

export function SimpleReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = resolveReportTheme(searchParams.get("theme"));
  const themeConfig = reportThemeDefinitions[theme];
  const isFraudReport = theme === "fraudes";
  const isThreatReport = theme === "ameacas";
  const isActorReport = theme === "atores";
  const isEvidenceReport = theme === "evidencias";
  const hasRiskButtons = theme === "narrativas" || theme === "desinformacao" || isFraudReport;
  const fieldCount =
    6 +
    (hasRiskButtons ? 1 : 0) +
    (isFraudReport ? 2 : 0) +
    (isThreatReport ? 1 : 0) +
    (isActorReport ? 3 : 0) +
    (isEvidenceReport ? 3 : 0);
  const riskFieldLabel = theme === "desinformacao"
    ? "Risco do alerta"
    : isFraudReport
      ? "Risco da fraude"
      : "Risco da narrativa";
  const themeStyle = getReportThemeStyle(theme);
  const ThemeIcon = themeStyle.icon;
  const atlas = useAtlas();
  const { user } = useAuth();
  const mayWrite = canWrite(user);
  const [report, setReport] = useState<SimpleReportInput>({
    ...initialReport,
    theme,
    fakeNews: themeConfig.defaultFakeNews,
    threatClassification: resolveReportThreatClassification(
      searchParams.get("classification") ?? defaultThreatClassificationForTheme(theme)
    ),
    riskClassification: hasRiskButtons ? resolveReportRisk(searchParams.get("risk")) : undefined,
    fraudSocialNetwork: isFraudReport ? resolveFraudSocialNetwork(searchParams.get("social")) : undefined,
    fraudCaseType: isFraudReport ? resolveFraudCaseType(searchParams.get("case")) : undefined,
    actorSocialNetwork: isActorReport ? resolveActorSocialNetwork(searchParams.get("social")) : undefined,
    actorProfileType: isActorReport ? resolveActorProfileType(searchParams.get("actor")) : undefined,
    evidenceKind: isEvidenceReport ? resolveSimpleEvidenceKind(searchParams.get("evidence")) : undefined,
    threatCaseType: isThreatReport ? resolveThreatCaseType(searchParams.get("threat")) : undefined
  });
  const [error, setError] = useState("");

  function updateReport<K extends keyof SimpleReportInput>(key: K, value: SimpleReportInput[K]) {
    setReport((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (!mayWrite) {
      setError("Seu acesso é somente visualização.");
      return;
    }
    if (!report.page.trim() || !report.whatTheySaid.trim()) {
      setError("Informe pelo menos a página e o que disseram.");
      return;
    }

    const incident = incidentFromSimpleReport(report, atlas.activeMonitoredEntityId);
    atlas.addIncident(incident, user);
    router.push(`/incidents/${incident.id}`);
  }

  return (
    <form className="mx-auto max-w-4xl space-y-5" onSubmit={onSubmit}>
      <Card style={reportThemeCssVars(theme)} className="border-[color:var(--report-border)]">
        <CardHeader>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[color:var(--report-border)] bg-[color:var(--report-bg)] text-[color:var(--report-accent)]">
              <ThemeIcon className="h-6 w-6" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Report rápido
              </Badge>
              <Badge className="border-[color:var(--report-border)] bg-[color:var(--report-bg)] text-[color:var(--report-accent)]">
                {themeConfig.shortLabel}
              </Badge>
              <Badge variant="muted">{fieldCount} campos</Badge>
            </div>
          </div>
          <CardTitle className="mt-3 text-2xl">{themeConfig.label}</CardTitle>
          <p className="text-sm text-atlas-muted">
            {themeConfig.description} O sistema completa a classificação operacional por baixo.
          </p>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="page">Página, perfil ou link</Label>
            <Input
              id="page"
              value={report.page}
              onChange={(event) => updateReport("page", event.target.value)}
              placeholder="Nome da página, @perfil ou URL"
              autoFocus
            />
          </div>

          <div className="grid gap-5 md:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="fake-news">{isFraudReport ? "Tem fake news associada?" : "É fake news?"}</Label>
              <Select
                id="fake-news"
                value={report.fakeNews}
                onChange={(event) => updateReport("fakeNews", event.target.value as FakeNewsStatus)}
              >
                <option>Suspeita</option>
                <option>Sim</option>
                <option>Não</option>
                <option>Não sei</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reach">Alcance estimado</Label>
              <Input
                id="reach"
                type="number"
                min={0}
                value={report.estimatedReach ?? ""}
                onChange={(event) =>
                  updateReport(
                    "estimatedReach",
                    event.target.value ? Number(event.target.value) : undefined
                  )
                }
                placeholder="Ex.: 12000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Classificação de ameaça</Label>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Classificação de ameaça">
              {reportThreatClassificationOptions.map((option) => {
                const selected = report.threatClassification === option.label;
                const style = threatClassificationButtonStyles[option.label];

                return (
                  <button
                    key={option.label}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={cn(
                      "min-h-24 rounded-md border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-action",
                      selected
                        ? style.active
                        : "border-atlas-border bg-white/5 text-atlas-muted hover:border-white/20 hover:bg-white/8 hover:text-atlas-text"
                    )}
                    onClick={() => updateReport("threatClassification", option.label)}
                  >
                    <span className="flex items-center gap-2 font-medium leading-5">
                      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", style.dot)} />
                      {option.label}
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-current/75">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {isFraudReport ? (
            <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
              <div className="space-y-2">
                <Label htmlFor="fraud-social-network">Rede social</Label>
                <Select
                  id="fraud-social-network"
                  value={report.fraudSocialNetwork ?? "Não informado"}
                  onChange={(event) => updateReport("fraudSocialNetwork", resolveFraudSocialNetwork(event.target.value))}
                >
                  {fraudSocialNetworkOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de caso</Label>
                <div className="grid gap-2 md:grid-cols-2" role="radiogroup" aria-label="Tipo de caso">
                  {fraudCaseTypeOptions.map((option) => {
                    const selected = report.fraudCaseType === option.label;
                    const style = fraudCaseButtonStyles[option.label];

                    return (
                      <button
                        key={option.label}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={cn(
                          "min-h-24 rounded-md border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-action",
                          selected
                            ? style.active
                            : "border-atlas-border bg-white/5 text-atlas-muted hover:border-white/20 hover:bg-white/8 hover:text-atlas-text"
                        )}
                        onClick={() => updateReport("fraudCaseType", option.label)}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
                          {option.label}
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-current/75">{option.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {isActorReport ? (
            <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="actor-social-network">Rede social</Label>
                  <Select
                    id="actor-social-network"
                    value={report.actorSocialNetwork ?? "Não informado"}
                    onChange={(event) => updateReport("actorSocialNetwork", resolveActorSocialNetwork(event.target.value))}
                  >
                    {actorSocialNetworkOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actor-followers">Seguidores</Label>
                  <Input
                    id="actor-followers"
                    type="number"
                    min={0}
                    value={report.actorFollowers ?? ""}
                    onChange={(event) =>
                      updateReport("actorFollowers", event.target.value ? Number(event.target.value) : undefined)
                    }
                    placeholder="Ex.: 45000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Classificação do ator</Label>
                <div className="grid gap-2 md:grid-cols-2" role="radiogroup" aria-label="Classificação do ator">
                  {actorProfileTypeOptions.map((option) => {
                    const selected = report.actorProfileType === option.label;
                    const style = actorProfileButtonStyles[option.label];

                    return (
                      <button
                        key={option.label}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={cn(
                          "min-h-24 rounded-md border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-action",
                          selected
                            ? style.active
                            : "border-atlas-border bg-white/5 text-atlas-muted hover:border-white/20 hover:bg-white/8 hover:text-atlas-text"
                        )}
                        onClick={() => updateReport("actorProfileType", option.label)}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
                          {option.label}
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-current/75">{option.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {isEvidenceReport ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Tipo de evidência</Label>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="Tipo de evidência">
                  {simpleEvidenceKindOptions.map((option) => {
                    const selected = report.evidenceKind === option.label;
                    const style = evidenceKindButtonStyles[option.label];

                    return (
                      <button
                        key={option.label}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={cn(
                          "min-h-24 rounded-md border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-action",
                          selected
                            ? style.active
                            : "border-atlas-border bg-white/5 text-atlas-muted hover:border-white/20 hover:bg-white/8 hover:text-atlas-text"
                        )}
                        onClick={() => updateReport("evidenceKind", option.label)}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
                          {option.label}
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-current/75">{option.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="evidence-file">Arquivo, foto, imagem ou documento</Label>
                  <Input
                    id="evidence-file"
                    type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      updateReport("evidenceFileName", file?.name);
                      updateReport("evidenceFileType", file?.type || undefined);
                      updateReport("evidenceFileSize", file?.size);
                    }}
                  />
                  {report.evidenceFileName ? (
                    <p className="text-xs text-atlas-muted">
                      Selecionado: {report.evidenceFileName}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evidence-video-url">Link de vídeo</Label>
                  <Input
                    id="evidence-video-url"
                    value={report.evidenceVideoUrl ?? ""}
                    onChange={(event) => updateReport("evidenceVideoUrl", event.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          ) : null}

          {isThreatReport ? (
            <div className="space-y-2">
              <Label>Tipo de ameaça</Label>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5" role="radiogroup" aria-label="Tipo de ameaça">
                {threatCaseTypeOptions.map((option) => {
                  const selected = report.threatCaseType === option.label;
                  const style = threatCaseButtonStyles[option.label];

                  return (
                    <button
                      key={option.label}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={cn(
                        "min-h-28 rounded-md border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-action",
                        selected
                          ? style.active
                          : "border-atlas-border bg-white/5 text-atlas-muted hover:border-white/20 hover:bg-white/8 hover:text-atlas-text"
                      )}
                      onClick={() => updateReport("threatCaseType", option.label)}
                    >
                      <span className="flex items-center gap-2 font-medium leading-5">
                        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", style.dot)} />
                        {option.label}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-current/75">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {hasRiskButtons ? (
            <div className="space-y-2">
              <Label>{riskFieldLabel}</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label={riskFieldLabel}>
                {reportRiskOptions.map((option) => {
                  const selected = report.riskClassification === option.label;
                  const style = reportRiskButtonStyles[option.label];

                  return (
                    <button
                      key={option.label}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={cn(
                        "min-h-24 rounded-md border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-action",
                        selected
                          ? style.active
                          : "border-atlas-border bg-white/5 text-atlas-muted hover:border-white/20 hover:bg-white/8 hover:text-atlas-text"
                      )}
                      onClick={() => updateReport("riskClassification", option.label)}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
                        {option.label}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-current/75">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="said">O que disseram</Label>
            <Textarea
              id="said"
              className="min-h-[130px]"
              value={report.whatTheySaid}
              onChange={(event) => updateReport("whatTheySaid", event.target.value)}
              placeholder="Resumo curto do conteúdo, sem precisar copiar o artigo inteiro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observação</Label>
            <Textarea
              id="observation"
              value={report.observation}
              onChange={(event) => updateReport("observation", event.target.value)}
              placeholder="Contexto, dúvida, prioridade ou encaminhamento"
            />
          </div>

          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          {!mayWrite ? (
            <p className="rounded-md border border-atlas-border bg-white/5 p-3 text-sm text-atlas-muted">
              Perfil Viewer: você pode consultar reports, mas não pode salvar novos dados.
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={!mayWrite}>
              <Send className="h-4 w-4" />
              Salvar report
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
