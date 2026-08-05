import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { RiskLevel } from "@/types/domain";

const variants: Record<RiskLevel, BadgeProps["variant"]> = {
  Informativo: "muted",
  Baixo: "low",
  Moderado: "moderate",
  Alto: "high",
  Crítico: "critical"
};

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  return (
    <Badge variant={variants[level]}>
      {level}
      {score !== undefined ? ` ${score}` : ""}
    </Badge>
  );
}
