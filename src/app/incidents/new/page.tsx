import { Suspense } from "react";
import { SimpleReportForm } from "@/features/incidents/simple-report-form";
import { Card, CardContent } from "@/components/ui/card";

export default function NewIncidentPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="p-8 text-atlas-muted">Carregando report...</CardContent>
        </Card>
      }
    >
      <SimpleReportForm />
    </Suspense>
  );
}
