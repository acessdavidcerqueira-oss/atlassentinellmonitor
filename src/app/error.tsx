"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-atlas-bg px-4 text-center">
      <div className="max-w-md rounded-md border border-atlas-border bg-atlas-panel p-6 shadow-glow">
        <p className="font-display text-2xl font-semibold text-atlas-text">Não foi possível carregar o Atlas</p>
        <p className="mt-3 text-sm leading-6 text-atlas-muted">
          A sessão ou o perfil ainda não terminou de carregar. Tente novamente; se continuar, saia e entre de novo.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button type="button" onClick={reset}>
            Tentar novamente
          </Button>
          <Button type="button" variant="secondary" onClick={() => window.location.assign("/login")}>
            Ir para login
          </Button>
        </div>
      </div>
    </main>
  );
}
