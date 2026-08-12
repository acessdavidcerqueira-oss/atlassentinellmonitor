"use client";

import Image from "next/image";
import { FileText, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Evidence } from "@/types/domain";

interface EvidenceThumbnailProps {
  evidence: Evidence;
  className?: string;
}

export function EvidenceThumbnail({ evidence, className }: EvidenceThumbnailProps) {
  const imageSrc = evidenceImageSrc(evidence);

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
    <a
      href={imageSrc}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "block aspect-video w-28 overflow-hidden rounded-md border border-atlas-border bg-[#071126]/80 ring-atlas-action/20 transition hover:ring-2",
        className
      )}
      aria-label={`Abrir evidência ${evidence.description}`}
    >
      <Image
        src={imageSrc}
        alt={evidence.description || evidence.fileName || "Evidência"}
        width={224}
        height={126}
        className="h-full w-full object-cover"
        unoptimized
      />
    </a>
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
