"use client";

import { FormEvent, useState } from "react";
import { KeyRound, RotateCcw, ShieldCheck, UserPlus } from "lucide-react";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManageUsers, canWrite, type AccessRole } from "@/features/auth/auth";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";

const roles: AccessRole[] = ["Super Admin", "Admin", "Viewer"];

const roleDescriptions: Record<AccessRole, string> = {
  "Super Admin": "Acesso total para operar, configurar e criar novos usuários.",
  Admin: "Pode cadastrar reports, evidências, blacklist e gerenciar usuários.",
  Viewer: "Visualiza todas as abas e relatórios, sem adicionar ou alterar dados."
};

export default function SettingsPage() {
  const atlas = useAtlas();
  const { user, users, addUser } = useAuth();
  const mayWrite = canWrite(user);
  const mayManageUsers = canManageUsers(user);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccessRole>("Viewer");
  const [message, setMessage] = useState("");

  async function onAddUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mayManageUsers) {
      setMessage("Seu acesso é somente visualização.");
      return;
    }

    const ok = await addUser({ email, password, role });
    if (!ok) {
      setMessage("Verifique e-mail, senha ou se esse usuário já existe.");
      return;
    }

    setEmail("");
    setPassword("");
    setRole("Viewer");
    setMessage("Usuário cadastrado.");
  }

  return (
    <div>
      <PageTitle
        title="Configurações"
        description="Taxonomias, RBAC, conectores e segurança. Integrações externas permanecem desativadas sem variáveis de ambiente."
        actions={mayWrite ? <ReportActionButton theme="geral" label="Novo report" /> : null}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ambiente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-atlas-muted">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success"><ShieldCheck className="mr-1 h-3 w-3" />Supabase Auth</Badge>
              <Badge variant="muted">RLS ativo</Badge>
              <Badge variant="muted">Alertas reais desligados</Badge>
            </div>
            <p>Usuário atual: {user?.name ?? "Não autenticado"} · {user?.role ?? "Sem papel"}</p>
            {!mayWrite ? (
              <p className="rounded-md border border-atlas-border bg-white/5 p-3 text-xs text-atlas-muted">
                Seu perfil é Viewer: você pode ver todas as abas e relatórios, mas não pode adicionar ou alterar dados.
              </p>
            ) : null}
            <Button variant="secondary" onClick={atlas.resetDemo} disabled={!mayWrite}>
              <RotateCcw className="h-4 w-4" />
              Limpar reports e voltar à base vazia
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-atlas-action" />
              Novo acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={onAddUser}>
              <div className="space-y-2">
                <Label htmlFor="access-email">E-mail</Label>
                <Input
                  id="access-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setMessage("");
                  }}
                  placeholder="pessoa@empresa.com"
                  disabled={!mayManageUsers}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div className="space-y-2">
                  <Label htmlFor="access-password">Senha</Label>
                  <Input
                    id="access-password"
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setMessage("");
                    }}
                    placeholder="Senha inicial"
                    disabled={!mayManageUsers}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-role">Nível</Label>
                  <Select
                    id="access-role"
                    value={role}
                    onChange={(event) => setRole(event.target.value as AccessRole)}
                    disabled={!mayManageUsers}
                  >
                    {roles.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </Select>
                </div>
              </div>
              {message ? <p className="text-sm text-atlas-muted">{message}</p> : null}
              <Button type="submit" disabled={!mayManageUsers}>
                <KeyRound className="h-4 w-4" />
                Adicionar acesso
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Usuários e permissões</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="overflow-x-auto rounded-md border border-atlas-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead>Permissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-atlas-text">{account.email}</p>
                          <p className="text-xs text-atlas-muted">{account.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.role === "Viewer" ? "muted" : "success"}>{account.role}</Badge>
                      </TableCell>
                      <TableCell>{account.team}</TableCell>
                      <TableCell className="text-sm text-atlas-muted">
                        {account.role === "Viewer" ? "Somente visualiza" : "Visualiza e adiciona dados"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-2">
              {roles.map((roleName) => (
                <div key={roleName} className="rounded-md border border-atlas-border bg-white/5 p-3 text-sm">
                  <p className="font-medium text-atlas-text">{roleName}</p>
                  <p className="mt-1 text-xs leading-5 text-atlas-muted">{roleDescriptions[roleName]}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
