"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  authenticateDemoUser,
  defaultDemoUsers,
  normalizeAccessRole,
  toPublicUser,
  type AccessRole,
  type DemoUser,
  type StoredDemoUser
} from "@/features/auth/auth";
import { createId } from "@/utils/id";

interface AuthStoreValue {
  user: DemoUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  demoUsers: DemoUser[];
  addUser: (input: { email: string; password: string; role: AccessRole }) => boolean;
}

const AuthContext = createContext<AuthStoreValue | null>(null);
const storageKey = "atlas-sentinel-user-v1";
const usersStorageKey = "atlas-sentinel-users-v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [users, setUsers] = useState<StoredDemoUser[]>(defaultDemoUsers);

  useEffect(() => {
    const rawUsers = window.localStorage.getItem(usersStorageKey);
    if (rawUsers) {
      try {
        setUsers(normalizeStoredUsers(JSON.parse(rawUsers) as StoredDemoUser[]));
      } catch {
        setUsers(defaultDemoUsers);
      }
    }

    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoUser;
      setUser({ ...parsed, role: normalizeAccessRole(parsed.role) });
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(usersStorageKey, JSON.stringify(users));
  }, [users]);

  const value = useMemo<AuthStoreValue>(
    () => ({
      user,
      login(email, password) {
        const authenticated = authenticateDemoUser(users, email, password);
        if (!authenticated) return false;
        setUser(authenticated);
        window.localStorage.setItem(storageKey, JSON.stringify(authenticated));
        return true;
      },
      logout() {
        setUser(null);
        window.localStorage.removeItem(storageKey);
      },
      demoUsers: users.map(toPublicUser),
      addUser(input) {
        const email = input.email.trim().toLowerCase();
        const password = input.password.trim();
        if (!email || password.length < 4) return false;
        if (users.some((storedUser) => storedUser.email.toLowerCase() === email)) return false;

        const created: StoredDemoUser = {
          id: createId("user"),
          name: nameFromEmail(email),
          email,
          password,
          role: input.role,
          team: input.role === "Viewer" ? "Visualização" : "Operação"
        };
        setUsers((current) => [created, ...current]);
        return true;
      }
    }),
    [user, users]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

function normalizeStoredUsers(users: StoredDemoUser[]): StoredDemoUser[] {
  const normalized = users
    .filter((user) => user.email && user.password)
    .map((user) => ({
      ...user,
      role: normalizeAccessRole(user.role),
      name: user.name || nameFromEmail(user.email),
      team: user.team || (normalizeAccessRole(user.role) === "Viewer" ? "Visualização" : "Operação")
    }));

  return normalized.length ? normalized : defaultDemoUsers;
}

function nameFromEmail(email: string): string {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Usuário";
}
