export type AccessRole = "Super Admin" | "Admin" | "Viewer";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: AccessRole;
  team: string;
}

export function canWrite(user: DemoUser | null | undefined): boolean {
  return Boolean(user && user.role !== "Viewer");
}

export function canManageUsers(user: DemoUser | null | undefined): boolean {
  return Boolean(user && (user.role === "Admin" || user.role === "Super Admin"));
}

export function normalizeAccessRole(role: string | null | undefined): AccessRole {
  const normalized = String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  if (normalized === "super admin" || normalized === "superadmin") return "Super Admin";
  if (normalized === "viewer" || normalized === "viewver") return "Viewer";
  return "Admin";
}
