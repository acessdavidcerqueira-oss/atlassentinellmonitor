"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { ArrowLeft, ArrowRight, Save, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  actorTypes,
  incidentCategories,
  incidentStatuses,
  ownerTeams,
  provenanceTypes,
  verificationStatuses
} from "@/types/domain";
import { incidentFormSchema, type IncidentFormInput } from "@/schemas/incident";
import { defaultRiskFactors, emptyPhysicalThreatFlags } from "@/services/risk";
import { incidentFromForm } from "@/services/incidents";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";
import { canWrite } from "@/features/auth/auth";

const steps = ["Fonte", "Conteúdo", "Classificação", "Risco", "Evidências", "Responsável", "Recomendação", "Revisão"];

const defaultValues: IncidentFormInput = {
  title: "",
  summary: "",
  content: "",
  url: "",
  platform: "Rede social",
  authorName: "",
  authorHandle: "",
  authorUrl: "",
  actorType: "Origem indeterminada",
  category: "Outro",
  subcategory: "",
  verificationStatus: "Não analisado",
  sentiment: "não disponível",
  provenanceType: "FATO_COLETADO",
  confidenceLevel: "medium",
  riskFactors: defaultRiskFactors(25),
  physicalThreatFactors: {
    declaredIntent: 0,
    targetSpecificity: 0,
    apparentCapability: 0,
    proximityAccess: 0,
    recurrenceEscalation: 0,
    dataLocationExposure: 0
  },
  physicalThreatFlags: emptyPhysicalThreatFlags(),
  reachType: "unavailable",
  velocityScore: 0,
  coordinationLevel: "Não identificado",
  target: "Monitorado",
  locationExposure: "Não disponível",
  status: "Novo",
  ownerTeam: "Atlas OSINT",
  assignedTo: "",
  recommendedAction: "",
  analystNotes: "",
  nextAction: "",
  keywords: ""
};

export function ManualIncidentForm() {
  const router = useRouter();
  const atlas = useAtlas();
  const { user } = useAuth();
  const mayWrite = canWrite(user);
  const [step, setStep] = useState(0);
  const [draftSaved, setDraftSaved] = useState(false);

  const form = useForm<IncidentFormInput>({
    resolver: zodResolver(incidentFormSchema) as never,
    defaultValues
  });

  const values = form.watch();
  const canSubmit = useMemo(() => step === steps.length - 1, [step]);

  function saveDraft() {
    window.localStorage.setItem("atlas-sentinel-incident-draft", JSON.stringify(values));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 1800);
  }

  function onSubmit(input: IncidentFormInput) {
    if (!user || !mayWrite) return;
    const incident = incidentFromForm(input, atlas.activeMonitoredEntityId);
    atlas.addIncident(incident, user);
    router.push(`/incidents/${incident.id}`);
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Cadastro manual de incidente</CardTitle>
          <p className="text-sm text-atlas-muted">
            O formulário usa o mesmo schema do CSV Atlas. Salvar rascunho mantém os dados apenas neste navegador.
          </p>
          {!mayWrite ? (
            <p className="mt-3 rounded-md border border-atlas-border bg-white/5 p-3 text-sm text-atlas-muted">
              Perfil Viewer: visualização liberada, criação bloqueada.
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
            {steps.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`rounded-md border px-3 py-2 text-xs ${
                  index === step
                    ? "border-atlas-action bg-atlas-action/14 text-atlas-ice"
                    : "border-atlas-border bg-white/5 text-atlas-muted"
                }`}
                onClick={() => setStep(index)}
              >
                {index + 1}. {item}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          {step === 0 ? <SourceStep form={form} /> : null}
          {step === 1 ? <ContentStep form={form} /> : null}
          {step === 2 ? <ClassificationStep form={form} /> : null}
          {step === 3 ? <RiskStep form={form} /> : null}
          {step === 4 ? <EvidenceStep /> : null}
          {step === 5 ? <OwnerStep form={form} /> : null}
          {step === 6 ? <RecommendationStep form={form} /> : null}
          {step === 7 ? <ReviewStep values={values} /> : null}
        </CardContent>
      </Card>

      {Object.keys(form.formState.errors).length ? (
        <Card className="border-red-400/40 bg-red-500/10">
          <CardContent className="p-4 text-sm text-red-100">
            Revise os campos obrigatórios. O sistema não marca “Falso confirmado” automaticamente; isso exige evidência e validação humana.
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={step === steps.length - 1}
            onClick={() => setStep((current) => current + 1)}
          >
            Avançar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={saveDraft}>
            <Save className="h-4 w-4" />
            {draftSaved ? "Rascunho salvo" : "Salvar rascunho"}
          </Button>
          <Button type="submit" disabled={!canSubmit || !mayWrite}>
            <ShieldAlert className="h-4 w-4" />
            Criar incidente
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  error
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
    </div>
  );
}

type IncidentForm = UseFormReturn<IncidentFormInput>;

function SourceStep({ form }: { form: IncidentForm }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="URL" error={form.formState.errors.url?.message}>
        <Input {...form.register("url")} placeholder="https://..." />
      </Field>
      <Field label="Plataforma">
        <Input {...form.register("platform")} />
      </Field>
      <Field label="Autor">
        <Input {...form.register("authorName")} />
      </Field>
      <Field label="Handle">
        <Input {...form.register("authorHandle")} />
      </Field>
      <Field label="URL do autor">
        <Input {...form.register("authorUrl")} />
      </Field>
      <Field label="Tipo de ator">
        <Select {...form.register("actorType")}>
          {actorTypes.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

function ContentStep({ form }: { form: IncidentForm }) {
  return (
    <div className="grid gap-4">
      <Field label="Título" error={form.formState.errors.title?.message}>
        <Input {...form.register("title")} />
      </Field>
      <Field label="Resumo" error={form.formState.errors.summary?.message}>
        <Textarea {...form.register("summary")} />
      </Field>
      <Field label="Conteúdo original">
        <Textarea className="min-h-[180px]" {...form.register("content")} />
      </Field>
      <Field label="Palavras-chave separadas por ponto e vírgula">
        <Input {...form.register("keywords")} placeholder="phishing; impersonação; denúncia" />
      </Field>
    </div>
  );
}

function ClassificationStep({ form }: { form: IncidentForm }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Categoria">
        <Select {...form.register("category")}>
          {incidentCategories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>
      <Field label="Subcategoria">
        <Input {...form.register("subcategory")} />
      </Field>
      <Field label="Status de verificação">
        <Select {...form.register("verificationStatus")}>
          {verificationStatuses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>
      <Field label="Sentimento">
        <Select {...form.register("sentiment")}>
          {["positivo", "neutro", "negativo", "misto", "não disponível"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>
      <Field label="Procedência">
        <Select {...form.register("provenanceType")}>
          {provenanceTypes.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>
      <Field label="Confiança">
        <Select {...form.register("confidenceLevel")}>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </Select>
      </Field>
    </div>
  );
}

function RiskStep({ form }: { form: IncidentForm }) {
  const riskFields = [
    ["reach", "Alcance atual"],
    ["velocity", "Velocidade de crescimento"],
    ["sourceInfluence", "Influência da fonte"],
    ["damagePotential", "Potencial de dano"],
    ["persistence", "Persistência"],
    ["coordination", "Indício de coordenação"],
    ["pressProximity", "Proximidade de imprensa"]
  ] as const;
  const threatFields = [
    ["declaredIntent", "Intenção declarada"],
    ["targetSpecificity", "Especificidade"],
    ["apparentCapability", "Capacidade aparente"],
    ["proximityAccess", "Proximidade/acesso"],
    ["recurrenceEscalation", "Reincidência/escalada"],
    ["dataLocationExposure", "Exposição de dados/local"]
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold">Risk Score reputacional e digital</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {riskFields.map(([name, label]) => (
            <Field key={name} label={label}>
              <Input type="number" min={0} max={100} {...form.register(`riskFactors.${name}`, { valueAsNumber: true })} />
            </Field>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold">Score separado de ameaça à pessoa</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {threatFields.map(([name, label]) => (
            <Field key={name} label={label}>
              <Input type="number" min={0} max={100} {...form.register(`physicalThreatFactors.${name}`, { valueAsNumber: true })} />
            </Field>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Threat flags">
          <div className="grid gap-2 rounded-md border border-atlas-border bg-white/5 p-3 text-sm text-atlas-muted md:grid-cols-2">
            {Object.keys(emptyPhysicalThreatFlags()).map((key) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" {...form.register(`physicalThreatFlags.${key as keyof ReturnType<typeof emptyPhysicalThreatFlags>}`)} />
                {key}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Reach type">
          <Select {...form.register("reachType")}>
            <option value="native">native</option>
            <option value="estimated">estimated</option>
            <option value="unavailable">unavailable</option>
          </Select>
        </Field>
        <Field label="Coordenação">
          <Select {...form.register("coordinationLevel")}>
            {["Não identificado", "Sinal fraco", "Sinal moderado", "Forte indício", "Coordenação comprovada"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  );
}

function EvidenceStep() {
  return (
    <div className="rounded-md border border-atlas-border bg-white/5 p-4 text-sm leading-6 text-atlas-muted">
      Evidências podem ser anexadas logo após a criação do incidente na página de detalhe. O fluxo preserva
      metadados e registra auditoria, sem alterar arquivos originais.
    </div>
  );
}

function OwnerStep({ form }: { form: IncidentForm }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Status operacional">
        <Select {...form.register("status")}>
          {incidentStatuses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>
      <Field label="Equipe responsável">
        <Select {...form.register("ownerTeam")}>
          {ownerTeams.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>
      <Field label="Responsável atual">
        <Input {...form.register("assignedTo")} />
      </Field>
      <Field label="Alvo">
        <Input {...form.register("target")} />
      </Field>
      <Field label="Exposição de localização">
        <Input {...form.register("locationExposure")} />
      </Field>
      <Field label="Prazo">
        <Input type="datetime-local" {...form.register("dueAt")} />
      </Field>
    </div>
  );
}

function RecommendationStep({ form }: { form: IncidentForm }) {
  return (
    <div className="grid gap-4">
      <Field label="Recomendação estratégica">
        <Textarea {...form.register("recommendedAction")} />
      </Field>
      <Field label="Análise do analista">
        <Textarea {...form.register("analystNotes")} />
      </Field>
      <Field label="Próxima ação">
        <Input {...form.register("nextAction")} />
      </Field>
    </div>
  );
}

function ReviewStep({ values }: { values: IncidentFormInput }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge>{values.category}</Badge>
        <Badge variant="muted">{values.verificationStatus}</Badge>
        <Badge variant="muted">{values.provenanceType}</Badge>
      </div>
      <div className="rounded-md border border-atlas-border bg-white/5 p-4">
        <h3 className="font-display text-lg font-semibold">{values.title || "Sem título"}</h3>
        <p className="mt-2 text-sm text-atlas-muted">{values.summary || "Sem resumo"}</p>
      </div>
      <p className="text-sm text-atlas-muted">
        Confirme que a classificação separa opinião, alegação, fato, fraude e ameaça antes de salvar o report.
      </p>
    </div>
  );
}
