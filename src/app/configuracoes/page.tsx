"use client";

import { FormEvent, useState } from "react";
import { KeyRound, RotateCcw, ShieldCheck, UserPlus } from "lucide-react";
import { PageTitle } from "@/components/layout/page-title";
import { ReportActionButton } from "@/components/layout/report-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ItemActions } from "@/components/ui/item-actions";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManageUsers, canWrite, type AccessRole } from "@/features/auth/auth";
import { useAtlas } from "@/features/state/atlas-store";
import { useAuth } from "@/features/state/auth-store";

interface UserDraft {
  name: string;
  role: AccessRole;
  team: string;
}

const roles: AccessRole[] = ["Super Admin", "Admin", "Viewer"];

const roleDescriptions: Record<AccessRole, string> = {
  "Super Admin": "Acesso total para operar, configurar e criar novos usuários.",
  Admin: "Pode cadastrar reports, evidências, blacklist e gerenciar usuários.",
  Viewer: "Visualiza todas as abas e relatórios, sem adicionar ou alterar dados."
};

export default function SettingsPage() {
  const atlas = useAtlas();
  const { user, users, addUser, updateUserProfile, deleteUserProfile } = useAuth();
  const mayWrite = canWrite(user);
  const mayManageUsers = canManageUsers(user);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccessRole>("Viewer");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UserDraft>({ name: "", role: "Viewer", team: "" });
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

  function startEdit(account: (typeof users)[number]) {
    setEditingId(account.id);
    setDraft({
      name: account.name,
      role: account.role,
      team: account.team
    });
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({ name: "", role: "Viewer", team: "" });
  }

  async function saveUser(id: string) {
    if (!mayManageUsers) return;
    const ok = await updateUserProfile(id, {
      name: draft.name.trim() || "Usuário",
      role: draft.role,
      team: draft.team.trim() || (draft.role === "Viewer" ? "Visualização" : "Operação")
    });
    setMessage(ok ? "Usuário atualizado." : "Não foi possível atualizar esse usuário.");
    if (ok) cancelEdit();
  }

  async function removeUser(account: (typeof users)[number]) {
    if (!mayManageUsers || account.id === user?.id) return;
    const confirmed = window.confirm(`Excluir o acesso de "${account.email}"?`);
    if (!confirmed) return;
    const ok = await deleteUserProfile(account.id);
    setMessage(ok ? "Usuário removido." : "Não foi possível remover esse usuário.");
    if (ok && editingId === account.id) cancelEdit();
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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((account) => {
                    const isEditing = editingId === account.id;

                    return (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div className="min-w-52">
                            <p className="font-medium text-atlas-text">{account.email}</p>
                            {isEditing ? (
                              <Input
                                value={draft.name}
                                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                                aria-label="Nome do usuário"
                                className="mt-2"
                              />
                            ) : (
                              <p className="text-xs text-atlas-muted">{account.name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={draft.role}
                              onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as AccessRole }))}
                              className="min-w-36"
                            >
                              {roles.map((option) => (
                                <option key={option}>{option}</option>
                              ))}
                            </Select>
                          ) : (
                            <Badge variant={account.role === "Viewer" ? "muted" : "success"}>{account.role}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={draft.team}
                              onChange={(event) => setDraft((current) => ({ ...current, team: event.target.value }))}
                              aria-label="Equipe do usuário"
                              className="min-w-40"
                            />
                          ) : (
                            account.team
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-atlas-muted">
                          {(isEditing ? draft.role : account.role) === "Viewer" ? "Somente visualiza" : "Visualiza e adiciona dados"}
                        </TableCell>
                        <TableCell>
                          {mayManageUsers ? (
                            <ItemActions
                              isEditing={isEditing}
                              onEdit={() => startEdit(account)}
                              onSave={() => void saveUser(account.id)}
                              onCancel={cancelEdit}
                              onDelete={() => void removeUser(account)}
                              deleteDisabled={account.id === user?.id}
                              editLabel="Editar usuário"
                              deleteLabel="Excluir usuário"
                            />
                          ) : (
                            <span className="text-xs text-atlas-muted">Somente leitura</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
