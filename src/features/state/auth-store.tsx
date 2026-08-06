"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  defaultDemoUsers,
  normalizeAccessRole,
  toPublicUser,
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
  demoUsers: DemoUser[];
  addUser: (input: { email: string; password: string; role: AccessRole }) => Promise<boolean>;
}

const AuthContext = createContext<AuthStoreValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [users, setUsers] = useState<DemoUser[]>(defaultDemoUsers.map(toPublicUser));
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

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        });

        if (error || !data.user) {
          setError("Credenciais inválidas ou usuário não cadastrado no Supabase.");
          return false;
        }

        const profile = await ensureUserProfile(data.user.id, data.user.email ?? email, data.user.user_metadata);
        setUser(profile);
        await loadUsers(profile);
        return true;
      },
      async logout() {
        const supabase = createBrowserSupabaseClient();
        await supabase?.auth.signOut();
        setUser(null);
      },
      demoUsers: users,
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
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) {
      setUser(null);
      setUsers(defaultDemoUsers.map(toPublicUser));
      setLoading(false);
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    const profile = await ensureUserProfile(data.user.id, data.user.email ?? "", data.user.user_metadata);
    setUser(profile);
    await loadUsers(profile);
    setLoading(false);
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
        name: row.name ?? nameFromEmail(row.email),
        email: row.email,
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

function nameFromEmail(email: string): string {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Usuário";
}

async function ensureUserProfile(
  authUserId: string,
  email: string,
  metadata: Record<string, unknown>
): Promise<DemoUser> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    return {
      id: authUserId,
      name: nameFromEmail(email),
      email,
      role: "Admin",
      team: "Operação"
    };
  }

  const { data } = await supabase
    .from("users")
    .select("auth_user_id,name,email,role,team")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (data) {
    return {
      id: data.auth_user_id ?? authUserId,
      name: data.name ?? nameFromEmail(data.email),
      email: data.email,
      role: normalizeAccessRole(data.role),
      team: data.team ?? (normalizeAccessRole(data.role) === "Viewer" ? "Visualização" : "Operação")
    };
  }

  const role = normalizeAccessRole(String(metadata.role ?? "Admin"));
  const profile: DemoUser = {
    id: authUserId,
    name: String(metadata.name ?? nameFromEmail(email)),
    email,
    role,
    team: String(metadata.team ?? (role === "Viewer" ? "Visualização" : "Operação"))
  };

  await supabase.from("users").insert({
    id: authUserId,
    auth_user_id: authUserId,
    user_id: authUserId,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    team: profile.team
  });

  return profile;
}
