"use client";

import Image from "next/image";
import { useState } from "react";
import { FileText, ImageOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Evidence } from "@/types/domain";

interface EvidenceThumbnailProps {
  evidence: Evidence;
  className?: string;
}

export function EvidenceThumbnail({ evidence, className }: EvidenceThumbnailProps) {
  const [open, setOpen] = useState(false);
  const imageSrc = evidenceImageSrc(evidence);
  const title = evidence.description || evidence.fileName || "Evidência";

  if (!imageSrc) {
    const isExpectedImage = evidence.type === "Screenshot" || /\.(png|jpe?g|gif|webp|avif)$/i.test(evidence.fileName ?? "");

    return (
      <div
        className={cn(
          "flex aspect-video w-32 flex-col items-center justify-center gap-1 rounded-md border border-atlas-border bg-[#071126]/80 px-2 text-center text-atlas-muted",
          className
        )}
      >
        {isExpectedImage ? <ImageOff className="h-5 w-5 text-amber-200" /> : <FileText className="h-5 w-5" />}
        <span className="text-[10px] leading-3">
          {isExpectedImage ? "Imagem nao salva" : "Sem preview"}
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "block aspect-video w-28 overflow-hidden rounded-md border border-atlas-border bg-[#071126]/80 text-left ring-atlas-action/20 transition hover:ring-2 focus:outline-none focus:ring-2 focus:ring-atlas-action/60",
          className
        )}
        aria-label={`Abrir evidência ${title}`}
        onClick={() => setOpen(true)}
      >
        <Image
          src={imageSrc}
          alt={title}
          width={224}
          height={126}
          className="h-full w-full object-cover"
          unoptimized
        />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Pré-visualização da evidência ${title}`}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-atlas-border bg-atlas-panel shadow-command"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-atlas-border px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold text-atlas-text">{title}</p>
                {evidence.fileName ? <p className="mt-1 truncate text-sm text-atlas-muted">{evidence.fileName}</p> : null}
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Fechar evidência" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#030916] p-4">
              <Image
                src={imageSrc}
                alt={title}
                width={1400}
                height={900}
                className="max-h-[78vh] w-auto max-w-full rounded-md object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function evidenceImageSrc(evidence: Evidence): string {
  if (evidence.imagePreviewUrl?.startsWith("data:image/")) return evidence.imagePreviewUrl;
  if (isImageUrl(evidence.imagePreviewUrl)) return evidence.imagePreviewUrl ?? "";
  if (isImageUrl(evidence.url)) return evidence.url ?? "";
  return "";
}

function isImageUrl(value: string | undefined): boolean {
  if (!value) return false;
  if (value.startsWith("data:image/")) return true;
  if (!/^https?:\/\//i.test(value)) return false;
  return /\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(value);
}
