"use client";

import { useEffect } from "react";

export default function GlobalRootError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR" className="dark">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-[#030817] px-4 text-center text-slate-300">
          <div className="max-w-md rounded-md border border-slate-700 bg-[#081226] p-6">
            <p className="text-2xl font-semibold text-white">Não foi possível carregar o Atlas</p>
            <p className="mt-3 text-sm leading-6">
              A sessão ou o perfil não carregou corretamente. Tente novamente ou volte para o login.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950"
                onClick={reset}
              >
                Tentar novamente
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-white"
                onClick={() => window.location.assign("/login")}
              >
                Ir para login
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
