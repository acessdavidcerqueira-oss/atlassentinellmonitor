import { Badge } from "@/components/ui/badge";
import type { ProvenanceType } from "@/types/domain";

export function ProvenanceBadge({ value }: { value: ProvenanceType }) {
  const variant = value === "SIMULACAO_UI" || value === "NAO_DISPONIVEL" ? "muted" : "default";
  return <Badge variant={variant}>{value}</Badge>;
}
