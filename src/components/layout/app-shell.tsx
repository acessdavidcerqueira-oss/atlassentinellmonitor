"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/features/state/auth-store";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, error } = useAuth();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !isLogin) {
      router.replace("/login");
    }
    if (user && isLogin) {
      router.replace("/");
    }
  }, [isLogin, loading, router, user]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-atlas-muted">Carregando sessão...</div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-atlas-muted">
        <div className="max-w-md rounded-md border border-atlas-border bg-atlas-panel p-6">
          <p className="font-medium text-atlas-text">Sessão não encontrada</p>
          <p className="mt-2 text-sm leading-6">
            {error || "Você será redirecionado para o login."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="xl:pl-72">
        <Topbar />
        <main className="mx-auto w-full max-w-[1760px] px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
