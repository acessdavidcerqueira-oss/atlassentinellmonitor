"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Database, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/state/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await login(email, password);
    if (!ok) {
      setError(authError || "Credenciais inválidas ou usuário sem perfil no Supabase.");
      return;
    }
    router.replace("/");
  }

  return (
    <main className="grid min-h-screen grid-cols-1 overflow-hidden lg:grid-cols-[1.2fr_0.8fr]">
      <section className="relative flex min-h-[46vh] items-center justify-center bg-atlas-bg px-8 py-12">
        <div className="absolute inset-0 bg-atlas-grid bg-[length:44px_44px] opacity-60" />
        <div className="radar-sweep absolute h-[520px] w-[520px] rounded-full border border-atlas-border bg-radar-ring opacity-80" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-8 flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-atlas-border bg-atlas-raised">
              <Image src="/atlas-sentinel-logo.png" alt="Atlas Sentinel" fill sizes="64px" className="object-cover" priority />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.36em] text-atlas-tech">Executive CTI</p>
              <h1 className="font-display text-5xl font-semibold tracking-tight text-atlas-text md:text-7xl">
                ATLAS SENTINEL
              </h1>
            </div>
          </div>
          <p className="max-w-xl text-lg leading-8 text-atlas-muted">
            Central de inteligência para registrar reports simples, revisar possíveis fake news e concentrar
            alertas, observações e recomendações.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Badge variant="success">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Supabase Auth
            </Badge>
            <Badge variant="muted">Dados protegidos por RLS</Badge>
            <Badge variant="muted">Persistência no servidor</Badge>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center border-l border-atlas-border bg-atlas-panel/90 px-6 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-atlas-action" />
              Acesso operacional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                />
              </div>
              {error ? <p className="text-sm text-red-200">{error}</p> : null}
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 rounded-md border border-atlas-border bg-white/5 p-4 text-sm text-atlas-muted">
              <p className="flex items-center gap-2 font-medium text-atlas-text">
                <Database className="h-4 w-4 text-atlas-action" />
                Acesso Supabase
              </p>
              <p className="mt-3 text-xs leading-5">
                Use o e-mail e a senha cadastrados em Supabase Auth. O perfil precisa existir em public.users.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
