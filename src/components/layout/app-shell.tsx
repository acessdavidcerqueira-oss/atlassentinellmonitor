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
  const { user, loading } = useAuth();
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
