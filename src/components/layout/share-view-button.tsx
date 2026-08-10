"use client";

import { useState } from "react";
import { Check, Copy, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canWrite } from "@/features/auth/auth";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";

interface SharedViewResponse {
  url: string;
  name: string | null;
}

export function ShareViewButton() {
  const atlas = useAtlas();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  if (atlas.readOnly || !canWrite(user)) return null;

  async function generateLink() {
    if (!atlas.activeMonitoredEntityId) {
      setError("Nenhum monitorado ativo foi encontrado.");
      setOpen(true);
      return;
    }

    setOpen(true);
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/shared-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monitoredEntityId: atlas.activeMonitoredEntityId,
          name: atlas.activeEntityName
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | (SharedViewResponse & { error?: string })
        | null;

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || "Não foi possível gerar o link.");
      }

      setLink(payload.url);
      setLabel(payload.name || atlas.activeEntityName);
      await copyLink(payload.url);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível gerar o link.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink(value = link) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={generateLink}>
        <Share2 className="h-4 w-4" />
        Compartilhar
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-atlas-border bg-atlas-panel p-5 shadow-command">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg font-semibold text-atlas-text">Link de visualização</p>
                <p className="mt-1 text-sm leading-6 text-atlas-muted">
                  Este link fornece acesso permanente em modo somente leitura aos dados atuais deste monitorado.
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Fechar" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-atlas-muted">
                {label || atlas.activeEntityName}
              </p>
              <div className="flex gap-2">
                <Input value={loading ? "Gerando link..." : link} readOnly />
                <Button type="button" variant="secondary" onClick={() => copyLink()} disabled={!link || loading}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
              {error ? <p className="text-sm text-red-200">{error}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
