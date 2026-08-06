"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  normalizeAccessRole,
  type AccessRole,
  type DemoUser
} from "@/features/auth/auth";
import { createBrowserSupabaseClient, createEphemeralSupabaseClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface AuthStoreValue {
  user: DemoUser | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  users: DemoUser[];
  addUser: (input: { email: string; password: string; role: AccessRole }) => Promise<boolean>;
}

const AuthContext = createContext<AuthStoreValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadSession();
    // A sessão deve ser carregada uma única vez na montagem do provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthStoreValue>(
    () => ({
      user,
      loading,
      error,
      async login(email, password) {
        setError("");
        const supabase = createBrowserSupabaseClient();
        if (!supabase || !isSupabaseConfigured()) {
          setError("Supabase não configurado. Defina as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
          return false;
        }

        setLoading(true);

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
          });

          if (error || !data.user) {
            setError("Credenciais inválidas ou usuário não cadastrado no Supabase.");
            return false;
          }

          const profile = await loadUserProfile(data.user.id);
          if (!profile) {
            await supabase.auth.signOut();
            setError("Usuário autenticado, mas sem perfil em public.users.");
            return false;
          }
          setUser(profile);
          await loadUsers(profile);
          return true;
        } catch (error) {
          setError(error instanceof Error ? error.message : "Falha ao autenticar no Supabase.");
          return false;
        } finally {
          setLoading(false);
        }
      },
      async logout() {
        const supabase = createBrowserSupabaseClient();
        await supabase?.auth.signOut();
        setUser(null);
      },
      users,
      async addUser(input) {
        const email = input.email.trim().toLowerCase();
        const password = input.password.trim();
        if (!email || password.length < 4) return false;
        if (users.some((storedUser) => storedUser.email.toLowerCase() === email)) return false;

        const signUpClient = createEphemeralSupabaseClient();
        const supabase = createBrowserSupabaseClient();
        if (!signUpClient || !supabase) return false;

        const { data, error } = await signUpClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: input.role,
              team: input.role === "Viewer" ? "Visualização" : "Operação"
            }
          }
        });

        if (error || !data.user) {
          setError(error?.message ?? "Não foi possível criar o usuário no Supabase Auth.");
          return false;
        }

        const created: DemoUser = {
          id: data.user.id,
          name: nameFromEmail(email),
          email,
          role: input.role,
          team: input.role === "Viewer" ? "Visualização" : "Operação"
        };

        const { error: profileError } = await supabase.from("users").upsert(
          {
            id: data.user.id,
            auth_user_id: data.user.id,
            user_id: data.user.id,
            email: created.email,
            name: created.name,
            role: created.role,
            team: created.team
          },
          { onConflict: "auth_user_id" }
        );

        if (profileError) {
          setError(profileError.message);
          return false;
        }

        setUsers((current) => [created, ...current]);
        return true;
      }
    }),
    [error, loading, user, users]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

  async function loadSession() {
    setLoading(true);
    setError("");
    try {
      const supabase = createBrowserSupabaseClient();
      if (!supabase || !isSupabaseConfigured()) {
        setUser(null);
        setUsers([]);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setUser(null);
        setUsers([]);
        return;
      }

      const profile = await loadUserProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        setError("Sessão encontrada, mas sem perfil em public.users.");
        setUser(null);
        setUsers([]);
        return;
      }
      setUser(profile);
      await loadUsers(profile);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível carregar a sessão.");
      setUser(null);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers(currentUser: DemoUser) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const { data, error } = await supabase.from("users").select("auth_user_id,name,email,role,team").order("created_at", { ascending: false });
    if (error || !data?.length) {
      setUsers([currentUser]);
      return;
    }
    setUsers(
      data.map((row) => ({
        id: row.auth_user_id ?? currentUser.id,
        name: safeText(row.name, nameFromEmail(row.email)),
        email: safeText(row.email, currentUser.email),
        role: normalizeAccessRole(row.role),
        team: row.team ?? (normalizeAccessRole(row.role) === "Viewer" ? "Visualização" : "Operação")
      }))
    );
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

function nameFromEmail(email: unknown): string {
  return String(email ?? "")
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Usuário";
}

async function loadUserProfile(authUserId: string): Promise<DemoUser | null> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("users")
    .select("auth_user_id,name,email,role,team")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (data) {
    const email = safeText(data.email, "");
    return {
      id: safeText(data.auth_user_id, authUserId),
      name: safeText(data.name, nameFromEmail(email)),
      email,
      role: normalizeAccessRole(data.role),
      team: data.team ?? (normalizeAccessRole(data.role) === "Viewer" ? "Visualização" : "Operação")
    };
  }
  return null;
}

function safeText(value: unknown, fallback: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}
